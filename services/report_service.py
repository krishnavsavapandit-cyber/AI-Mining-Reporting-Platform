"""
Automated Report Generation & Export Service for SIH26023.
Creates multi-section structured executive reports with tabular figures,
charts metadata, inconsistency caveats, and exports to HTML, PDF, and DOCX formats.
"""

import os
import json
import logging
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
import docx
from docx.shared import Inches, Pt, RGBColor
from fpdf import FPDF
from fpdf.enums import XPos, YPos
from config.settings import GENERATED_REPORTS_DIR
from database.db import get_db, log_audit

logger = logging.getLogger(__name__)

class PDFReportGenerator(FPDF):
    """Custom FPDF2 class for generating Coal India executive reports."""

    def __init__(self, title: str, period: str, subsidiary: str):
        super().__init__()
        self.report_title = title
        self.report_period = period or "Consolidated Period"
        self.subsidiary = subsidiary or "All Subsidiaries"

    def header(self):
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(24, 43, 73)  # Coal Navy
        self.cell(0, 7, "COAL INDIA LIMITED / CMPDI", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(180, 50, 50)  # Disclaimer red
        self.cell(0, 5, "[SYNTHETIC DEMONSTRATION DATA -- NOT OFFICIAL CIL DATA]", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(180, 83, 9)  # Industrial Amber
        self.cell(0, 5, self.report_title.upper(), new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(100, 116, 139)
        self.cell(0, 4, f"Period: {self.report_period} | Subsidiary: {self.subsidiary} | Status: Human-Review Required", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.line(10, 33, 200, 33)
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}} | CIL AI Document Intelligence System SIH26023", align="C")

class ReportService:
    """Report compilation and multi-format export service."""

    def generate_report_content(
        self,
        report_type: str,
        title: str,
        subsidiary: Optional[str],
        reporting_period: Optional[str],
        sections: List[Dict[str, Any]],
        executive_summary: str,
        inconsistencies: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
        key_figures: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Assemble structured report payload and save to DB."""
        content_dict = {
            "title": title,
            "report_type": report_type,
            "subsidiary": subsidiary or "Consolidated CIL",
            "reporting_period": reporting_period or "Consolidated",
            "executive_summary": executive_summary,
            "sections": sections,
            "key_figures": key_figures,
            "inconsistencies": inconsistencies,
            "sources": sources,
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }

        html_content = self._render_html_report(content_dict)
        
        # Export files
        doc_slug = "".join(c for c in title if c.isalnum() or c in (' ', '_', '-')).rstrip().replace(' ', '_')
        timestamp_str = int(time.time())
        docx_filename = f"{doc_slug}_{timestamp_str}.docx"
        pdf_filename = f"{doc_slug}_{timestamp_str}.pdf"

        docx_path = GENERATED_REPORTS_DIR / docx_filename
        pdf_path = GENERATED_REPORTS_DIR / pdf_filename

        self._export_to_docx(content_dict, docx_path)
        self._export_to_pdf(content_dict, pdf_path)

        report_id = None
        try:
            with get_db() as conn:
                cursor = conn.execute(
                    """
                    INSERT INTO reports 
                    (title, report_type, reporting_period, subsidiary, summary, content_json, html_content, file_path, docx_path)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        title, report_type, reporting_period, subsidiary,
                        executive_summary[:500], json.dumps(content_dict),
                        html_content, str(pdf_path), str(docx_path)
                    )
                )
                report_id = cursor.lastrowid
                log_audit("REPORT_GENERATED", resource_type="report", resource_id=report_id, details={"title": title, "type": report_type})
        except Exception as e:
            logger.error(f"Failed to persist report in database: {e}")

        return {
            "report_id": report_id,
            "title": title,
            "html_content": html_content,
            "content": content_dict,
            "pdf_url": f"/api/reports/download/{pdf_filename}",
            "docx_url": f"/api/reports/download/{docx_filename}"
        }

    def _render_html_report(self, data: Dict[str, Any]) -> str:
        """Render clean, responsive HTML view for report modal/tab."""
        sections_html = ""
        for sec in data.get("sections", []):
            sections_html += f"""
            <div class="report-section mb-4">
                <h4 class="section-title text-gold font-bold text-lg mb-2">{sec.get('title')}</h4>
                <div class="section-body text-slate-200 leading-relaxed">{sec.get('content')}</div>
            </div>
            """

        figures_html = ""
        if data.get("key_figures"):
            rows = "".join([
                f"<tr><td class='p-2 font-medium'>{f.get('metric')}</td><td class='p-2 font-bold text-amber-400'>{f.get('value')} {f.get('unit','')}</td><td class='p-2 text-xs text-slate-400'>{f.get('source','')}</td></tr>"
                for f in data.get("key_figures")
            ])
            figures_html = f"""
            <div class="report-figures-table my-4">
                <h4 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Key Operational Figures</h4>
                <table class="w-full text-left border border-slate-700 text-sm">
                    <thead class="bg-slate-800 text-slate-300">
                        <tr><th class="p-2">Metric</th><th class="p-2">Value</th><th class="p-2">Source Reference</th></tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800">{rows}</tbody>
                </table>
            </div>
            """

        inconsistencies_html = ""
        if data.get("inconsistencies"):
            items = "".join([
                f"<li class='mb-1'><strong>{inc.get('field_name')}:</strong> {inc.get('doc_a_name')} (Pg {inc.get('doc_a_page')}: {inc.get('doc_a_value')}) vs {inc.get('doc_b_name')} (Pg {inc.get('doc_b_page')}: {inc.get('doc_b_value')}) — Variance: {inc.get('variance_percentage')}%</li>"
                for inc in data.get("inconsistencies")
            ])
            inconsistencies_html = f"""
            <div class="p-3 my-4 bg-amber-950/40 border border-amber-600/50 rounded-lg text-amber-200 text-sm">
                <h5 class="font-bold flex items-center gap-1">⚠ Data Discrepancies Flagged Across Sources</h5>
                <ul class="list-disc ml-5 mt-2 space-y-1">{items}</ul>
            </div>
            """

        sources_html = ""
        if data.get("sources"):
            items = "".join([
                f"<li class='text-xs text-slate-400'>[{s.get('document_name')}, Page {s.get('page_number',1)}] {s.get('source_text','')[:140]}...</li>"
                for s in data.get("sources")
            ])
            sources_html = f"""
            <div class="report-sources mt-6 pt-4 border-t border-slate-700">
                <h5 class="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Source Provenance & Audit Trail</h5>
                <ul class="space-y-1">{items}</ul>
            </div>
            """

        return f"""
        <div class="report-document p-6 bg-slate-900 rounded-xl border border-slate-800 text-slate-200">
            <div class="report-header border-b border-slate-800 pb-4 mb-4 text-center">
                <div class="mb-1"><span class="text-xs font-semibold px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded">[SYNTHETIC DEMONSTRATION DATA -- NOT OFFICIAL CIL DATA]</span></div>
                <h2 class="text-2xl font-bold text-white mt-2">{data.get('title')}</h2>
                <div class="text-xs text-slate-400 mt-1">Subsidiary: {data.get('subsidiary')} | Period: {data.get('reporting_period')} | Generated: {data.get('generated_at')}</div>
            </div>
            <div class="executive-summary p-4 bg-slate-800/60 rounded-lg border border-slate-700 mb-6">
                <h4 class="text-sm font-bold uppercase tracking-wider text-amber-400 mb-1">Executive Summary</h4>
                <p class="text-slate-300 leading-relaxed text-sm">{data.get('executive_summary')}</p>
            </div>
            {figures_html}
            {inconsistencies_html}
            <div class="report-body space-y-4">{sections_html}</div>
            {sources_html}
        </div>
        """

    def _export_to_docx(self, data: Dict[str, Any], file_path: Path):
        """Build professional Word DOCX document."""
        try:
            doc = docx.Document()
            # Title
            h1 = doc.add_heading("COAL INDIA LIMITED / CMPDI", level=0)
            h1.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER

            p_disclaimer = doc.add_paragraph("[SYNTHETIC DEMONSTRATION DATA -- NOT OFFICIAL CIL DATA]")
            p_disclaimer.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER

            p_sub = doc.add_paragraph(f"{data.get('title').upper()}\nPeriod: {data.get('reporting_period')} | Subsidiary: {data.get('subsidiary')}")
            p_sub.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER

            # Executive Summary
            doc.add_heading("1. Executive Summary", level=1)
            doc.add_paragraph(data.get("executive_summary", "No summary available."))

            # Key Figures Table
            if data.get("key_figures"):
                doc.add_heading("2. Key Operational & Mining Figures", level=1)
                table = doc.add_table(rows=1, cols=3)
                hdr_cells = table.rows[0].cells
                hdr_cells[0].text = "Metric"
                hdr_cells[1].text = "Value"
                hdr_cells[2].text = "Source Document / Page"
                for fig in data.get("key_figures"):
                    row_cells = table.add_row().cells
                    row_cells[0].text = str(fig.get("metric", ""))
                    row_cells[1].text = f"{fig.get('value','')} {fig.get('unit','')}"
                    row_cells[2].text = str(fig.get("source", ""))

            # Detailed Sections
            sec_idx = 3
            for sec in data.get("sections", []):
                doc.add_heading(f"{sec_idx}. {sec.get('title')}", level=1)
                doc.add_paragraph(sec.get("content", ""))
                sec_idx += 1

            # Discrepancies
            if data.get("inconsistencies"):
                doc.add_heading(f"{sec_idx}. Data Discrepancies & Conflict Notices", level=1)
                for inc in data.get("inconsistencies"):
                    doc.add_paragraph(f"• {inc.get('field_name')}: {inc.get('doc_a_name')} (Pg {inc.get('doc_a_page')}: {inc.get('doc_a_value')}) vs {inc.get('doc_b_name')} (Pg {inc.get('doc_b_page')}: {inc.get('doc_b_value')}) [Variance: {inc.get('variance_percentage')}%]")
                sec_idx += 1

            # Sources
            if data.get("sources"):
                doc.add_heading(f"{sec_idx}. Source Provenance Appendix", level=1)
                for s in data.get("sources"):
                    doc.add_paragraph(f"• [{s.get('document_name')}, Page {s.get('page_number',1)}] {s.get('source_text','')[:180]}...")

            file_path.parent.mkdir(parents=True, exist_ok=True)
            doc.save(str(file_path))
        except Exception as e:
            logger.error(f"Failed to export DOCX report: {e}")

    def _clean_pdf_text(self, text: str) -> str:
        """Sanitize text for standard Helvetica font in FPDF2."""
        if not text:
            return ""
        replacements = {
            "—": "--", "–": "-", "•": "-", "“": '"', "”": '"',
            "’": "'", "‘": "'", "…": "...", "⚠": "[!]", "\u2014": "--",
            "\u2013": "-", "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"'
        }
        for k, v in replacements.items():
            text = text.replace(k, v)
        return text.encode("latin-1", "replace").decode("latin-1")

    def _export_to_pdf(self, data: Dict[str, Any], file_path: Path):
        """Build professional PDF document using FPDF2."""
        try:
            pdf = PDFReportGenerator(
                self._clean_pdf_text(data.get("title", "Report")),
                self._clean_pdf_text(data.get("reporting_period", "")),
                self._clean_pdf_text(data.get("subsidiary", ""))
            )
            pdf.set_left_margin(12)
            pdf.set_right_margin(12)
            pdf.set_auto_page_break(auto=True, margin=15)
            pdf.add_page()

            # Executive Summary
            pdf.set_x(pdf.l_margin)
            pdf.set_font("Helvetica", "B", 12)
            pdf.set_text_color(24, 43, 73)
            pdf.cell(pdf.epw, 8, "1. Executive Summary", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(51, 65, 85)
            summary_clean = self._clean_pdf_text(data.get("executive_summary", "No summary."))
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(w=pdf.epw, h=5, text=summary_clean, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(3)

            # Key Figures
            if data.get("key_figures"):
                pdf.set_x(pdf.l_margin)
                pdf.set_font("Helvetica", "B", 12)
                pdf.set_text_color(24, 43, 73)
                pdf.cell(pdf.epw, 8, "2. Key Operational Figures", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.set_font("Helvetica", "B", 9)
                pdf.set_fill_color(241, 245, 249)
                
                col1_w = round(pdf.epw * 0.35, 1)
                col2_w = round(pdf.epw * 0.25, 1)
                col3_w = round(pdf.epw - col1_w - col2_w, 1)

                pdf.set_x(pdf.l_margin)
                pdf.cell(col1_w, 7, "Metric", border=1, fill=True)
                pdf.cell(col2_w, 7, "Value", border=1, fill=True)
                pdf.cell(col3_w, 7, "Source", border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                
                pdf.set_font("Helvetica", "", 9)
                for fig in data.get("key_figures"):
                    metric_str = self._clean_pdf_text(str(fig.get("metric", "")))[:35]
                    val_str = self._clean_pdf_text(f"{fig.get('value','')} {fig.get('unit','')}")[:25]
                    src_str = self._clean_pdf_text(str(fig.get("source", "")))[:40]
                    pdf.set_x(pdf.l_margin)
                    pdf.cell(col1_w, 6, metric_str, border=1)
                    pdf.cell(col2_w, 6, val_str, border=1)
                    pdf.cell(col3_w, 6, src_str, border=1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(3)

            # Sections
            sec_idx = 3
            for sec in data.get("sections", []):
                pdf.set_x(pdf.l_margin)
                pdf.set_font("Helvetica", "B", 12)
                pdf.set_text_color(24, 43, 73)
                pdf.cell(pdf.epw, 8, f"{sec_idx}. {self._clean_pdf_text(sec.get('title', ''))}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.set_font("Helvetica", "", 10)
                pdf.set_text_color(51, 65, 85)
                clean_content = self._clean_pdf_text(sec.get("content", ""))
                pdf.set_x(pdf.l_margin)
                pdf.multi_cell(w=pdf.epw, h=5, text=clean_content, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(3)
                sec_idx += 1

            # Discrepancies / Conflicts
            if data.get("inconsistencies"):
                pdf.set_x(pdf.l_margin)
                pdf.set_font("Helvetica", "B", 12)
                pdf.set_text_color(180, 83, 9)
                pdf.cell(pdf.epw, 8, f"{sec_idx}. Data Discrepancies & Conflict Notices", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.set_font("Helvetica", "", 9)
                pdf.set_text_color(51, 65, 85)
                for inc in data.get("inconsistencies"):
                    inc_text = self._clean_pdf_text(f"- {inc.get('field_name')}: {inc.get('doc_a_name')} (Pg {inc.get('doc_a_page')}: {inc.get('doc_a_value')}) vs {inc.get('doc_b_name')} (Pg {inc.get('doc_b_page')}: {inc.get('doc_b_value')}) [Variance: {inc.get('variance_percentage')}%]")
                    pdf.set_x(pdf.l_margin)
                    pdf.multi_cell(w=pdf.epw, h=5, text=inc_text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(3)
                sec_idx += 1

            # Source Provenance Appendix
            if data.get("sources"):
                pdf.set_x(pdf.l_margin)
                pdf.set_font("Helvetica", "B", 12)
                pdf.set_text_color(24, 43, 73)
                pdf.cell(pdf.epw, 8, f"{sec_idx}. Source Provenance Appendix", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.set_font("Helvetica", "I", 8)
                pdf.set_text_color(100, 116, 139)
                for s in data.get("sources"):
                    src_text = self._clean_pdf_text(f"- [{s.get('document_name')}, Page {s.get('page_number', 1)}] {s.get('source_text', '')[:160]}...")
                    pdf.set_x(pdf.l_margin)
                    pdf.multi_cell(w=pdf.epw, h=5, text=src_text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(3)

            file_path.parent.mkdir(parents=True, exist_ok=True)
            pdf.output(str(file_path))
        except Exception as e:
            logger.error(f"Failed to export PDF report: {e}")

# Global report service
report_service = ReportService()
