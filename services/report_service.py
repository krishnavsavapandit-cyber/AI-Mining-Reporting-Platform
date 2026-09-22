"""
Automated Report Generation & Export Service for SIH26023.
Creates multi-section structured executive reports with tabular figures,
charts metadata, inconsistency caveats, and exports to clean HTML, PDF, and DOCX formats.
"""

import os
import json
import logging
import time
import re
import html
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
    """Custom FPDF2 class for generating clean, executive Coal India reports."""

    def __init__(self, title: str, period: str, subsidiary: str):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.report_title = title
        self.report_period = period or "Consolidated Period"
        self.subsidiary = subsidiary or "All Subsidiaries"

    def header(self):
        # Top corporate header band
        self.set_fill_color(241, 245, 249)  # Light slate tint
        self.rect(0, 0, 210, 28, style="F")
        
        # Primary Title
        self.set_y(6)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(15, 23, 42)  # Dark slate
        self.cell(0, 5, "COAL INDIA LIMITED / CMPDI -- MINING INTELLIGENCE", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        
        # Subtitle with Period & Subsidiary
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(180, 83, 9)  # Amber gold
        self.cell(0, 5, self.report_title.upper(), new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        
        # Metadata strip
        self.set_font("Helvetica", "", 7.5)
        self.set_text_color(100, 116, 139)
        self.cell(0, 4, f"Period: {self.report_period}   |   Subsidiary: {self.subsidiary}   |   Review Status: Verified", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        
        # Clean separator line
        self.set_draw_color(203, 213, 225)
        self.set_line_width(0.4)
        self.line(12, 28, 198, 28)
        self.ln(6)

    def footer(self):
        self.set_y(-14)
        self.set_draw_color(226, 232, 240)
        self.set_line_width(0.3)
        self.line(12, 283, 198, 283)
        
        self.set_font("Helvetica", "I", 7.5)
        self.set_text_color(148, 163, 184)
        self.cell(90, 8, "CIL AI Document Intelligence System SIH26023", align="L")
        self.cell(0, 8, f"Page {self.page_no()}/{{nb}}", align="R")


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
                    INSERT INTO reports (
                        title, report_type, subsidiary, reporting_period,
                        summary, content_json, file_path, docx_path, html_content,
                        status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                    """,
                    (
                        title,
                        report_type,
                        subsidiary,
                        reporting_period,
                        executive_summary,
                        json.dumps(content_dict),
                        pdf_filename,
                        docx_filename,
                        html_content,
                        "DRAFT"
                    )
                )
                conn.commit()
                report_id = cursor.lastrowid
                log_audit("REPORT_GENERATED", resource_type="report", resource_id=str(report_id), details={"title": title, "type": report_type})
        except Exception as e:
            logger.error(f"Failed to persist generated report to DB: {e}")

        return {
            "report_id": report_id,
            "title": title,
            "content": content_dict,
            "pdf_url": f"/api/reports/download/{pdf_filename}",
            "docx_url": f"/api/reports/download/{docx_filename}"
        }

    def _render_markdown_html(self, text: str) -> str:
        """Convert markdown formatted LLM text into semantic HTML."""
        if not text:
            return ""
        
        lines = text.split('\n')
        html_lines = []
        in_list = False

        for line in lines:
            line_str = line.strip()
            if not line_str:
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                continue

            if line_str.startswith('### '):
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                h_text = html.escape(line_str[4:].strip())
                html_lines.append(f"<h4 class='text-md font-bold text-amber-300 mt-4 mb-2'>{h_text}</h4>")
            elif line_str.startswith('## '):
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                h_text = html.escape(line_str[3:].strip())
                html_lines.append(f"<h3 class='text-lg font-bold text-slate-100 mt-5 mb-2 border-b border-slate-700/60 pb-1'>{h_text}</h3>")
            elif line_str.startswith('# '):
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                h_text = html.escape(line_str[2:].strip())
                html_lines.append(f"<h2 class='text-xl font-extrabold text-amber-400 mt-6 mb-3'>{h_text}</h2>")
            elif line_str.startswith('- ') or line_str.startswith('* ') or line_str.startswith('• '):
                if not in_list:
                    html_lines.append("<ul class='list-disc ml-5 space-y-1 my-2 text-slate-300 text-sm'>")
                    in_list = True
                content = line_str[2:].strip()
                content = re.sub(r'\*\*(.+?)\*\*', r'<strong class="text-slate-100 font-semibold">\1</strong>', content)
                content = re.sub(r'\*(.+?)\*', r'<em class="text-slate-300">\1</em>', content)
                html_lines.append(f"<li>{content}</li>")
            else:
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                content = line_str
                content = re.sub(r'\*\*(.+?)\*\*', r'<strong class="text-slate-100 font-semibold">\1</strong>', content)
                content = re.sub(r'\*(.+?)\*', r'<em class="text-slate-300">\1</em>', content)
                html_lines.append(f"<p class='text-slate-300 leading-relaxed text-sm my-2'>{content}</p>")

        if in_list:
            html_lines.append("</ul>")

        return "\n".join(html_lines)

    def _render_html_report(self, data: Dict[str, Any]) -> str:
        """Render clean, responsive HTML view for report modal/tab."""
        sections_html = ""
        for sec in data.get("sections", []):
            content_rendered = self._render_markdown_html(sec.get('content', ''))
            sections_html += f"""
            <div class="report-section mb-6 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                <h3 class="text-md font-bold text-amber-400 border-b border-slate-800 pb-2 mb-3">{sec.get('title')}</h3>
                <div class="section-content text-slate-300 text-sm leading-relaxed">{content_rendered}</div>
            </div>
            """

        figures_html = ""
        if data.get("key_figures"):
            rows = "".join([
                f"<tr class='border-b border-slate-800 hover:bg-slate-800/40'><td class='py-2 px-3 font-medium text-slate-200'>{f.get('metric')}</td><td class='py-2 px-3 text-amber-300 font-bold'>{f.get('value')} {f.get('unit','')}</td><td class='py-2 px-3 text-xs text-slate-400'>{f.get('source','')}</td></tr>"
                for f in data.get("key_figures")
            ])
            figures_html = f"""
            <div class="key-figures my-6 bg-slate-900 p-4 rounded-lg border border-slate-800">
                <h4 class="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">Key Extracted Figures</h4>
                <table class="w-full text-left text-sm">
                    <thead><tr class="text-xs uppercase text-slate-400 border-b border-slate-700 bg-slate-800/50"><th class="py-2 px-3">Metric</th><th class="py-2 px-3">Value</th><th class="py-2 px-3">Source</th></tr></thead>
                    <tbody>{rows}</tbody>
                </table>
            </div>
            """

        inconsistencies_html = ""
        if data.get("inconsistencies"):
            items = "".join([
                f"<li class='mb-1'><strong>{inc.get('field_name')}:</strong> {inc.get('doc_a_name')} (Pg {inc.get('doc_a_page')}: {inc.get('doc_a_value')}) vs {inc.get('doc_b_name')} (Pg {inc.get('doc_b_page')}: {inc.get('doc_b_value')}) -- Variance: {inc.get('variance_percentage')}%</li>"
                for inc in data.get("inconsistencies")
            ])
            inconsistencies_html = f"""
            <div class="p-4 my-4 bg-amber-950/40 border border-amber-600/50 rounded-lg text-amber-200 text-sm">
                <h5 class="font-bold flex items-center gap-1">&#9888; Data Discrepancies Flagged Across Sources</h5>
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

        exec_summary_rendered = self._render_markdown_html(data.get('executive_summary', ''))

        return f"""
        <div class="report-document p-6 bg-slate-900 rounded-xl border border-slate-800 text-slate-200">
            <div class="report-header border-b border-slate-800 pb-4 mb-4 text-center">
                <div class="text-xs font-bold uppercase tracking-widest text-slate-400">Coal India Limited / CMPDI</div>
                <h1 class="text-xl font-black text-amber-400 mt-1">{data.get('title')}</h1>
                <div class="flex justify-center gap-4 text-xs text-slate-400 mt-2">
                    <span><strong>Period:</strong> {data.get('reporting_period')}</span>
                    <span>&bull;</span>
                    <span><strong>Subsidiary:</strong> {data.get('subsidiary')}</span>
                    <span>&bull;</span>
                    <span><strong>Compiled:</strong> {data.get('generated_at')}</span>
                </div>
            </div>

            <div class="executive-summary bg-slate-800/40 p-4 rounded-lg border border-slate-700/60 mb-6">
                <h4 class="text-xs uppercase tracking-wider text-amber-300 font-bold mb-2">1. Executive Summary</h4>
                <div class="text-sm leading-relaxed text-slate-200">{exec_summary_rendered}</div>
            </div>

            {figures_html}
            {inconsistencies_html}
            {sections_html}
            {sources_html}
        </div>
        """

    def _export_to_docx(self, data: Dict[str, Any], file_path: Path):
        """Export executive report to Microsoft Word (.docx)."""
        try:
            doc = docx.Document()
            doc.add_heading("Coal India Limited / CMPDI", level=0)
            
            p_title = doc.add_paragraph()
            r_title = p_title.add_run(data.get("title", "Executive Report"))
            r_title.bold = True
            r_title.font.size = Pt(16)

            p_meta = doc.add_paragraph()
            p_meta.add_run(f"Period: {data.get('reporting_period', 'N/A')} | Subsidiary: {data.get('subsidiary', 'N/A')} | Date: {data.get('generated_at', time.strftime('%Y-%m-%d'))}")

            # Summary
            doc.add_heading("1. Executive Summary", level=1)
            summary_clean = self._strip_markdown_symbols(data.get("executive_summary", ""))
            doc.add_paragraph(summary_clean)

            # Key Figures Table
            if data.get("key_figures"):
                doc.add_heading("2. Key Operational Figures", level=1)
                table = doc.add_table(rows=1, cols=3)
                hdr_cells = table.rows[0].cells
                hdr_cells[0].text = "Metric"
                hdr_cells[1].text = "Value"
                hdr_cells[2].text = "Source Reference"

                for fig in data.get("key_figures"):
                    row_cells = table.add_row().cells
                    row_cells[0].text = str(fig.get("metric", ""))
                    row_cells[1].text = f"{fig.get('value', '')} {fig.get('unit', '')}"
                    row_cells[2].text = str(fig.get("source", ""))

            # Sections
            sec_idx = 3
            for sec in data.get("sections", []):
                doc.add_heading(f"{sec_idx}. {sec.get('title', 'Section')}", level=1)
                sec_clean = self._strip_markdown_symbols(sec.get("content", ""))
                doc.add_paragraph(sec_clean)
                sec_idx += 1

            # Discrepancies
            if data.get("inconsistencies"):
                doc.add_heading(f"{sec_idx}. Identified Discrepancies", level=1)
                for inc in data.get("inconsistencies"):
                    doc.add_paragraph(
                        f"- {inc.get('field_name')}: {inc.get('doc_a_name')} (Pg {inc.get('doc_a_page')}: {inc.get('doc_a_value')}) vs {inc.get('doc_b_name')} (Pg {inc.get('doc_b_page')}: {inc.get('doc_b_value')}) [Variance: {inc.get('variance_percentage')}%]"
                    )
                sec_idx += 1

            # Sources
            if data.get("sources"):
                doc.add_heading(f"{sec_idx}. Source Provenance Appendix", level=1)
                for s in data.get("sources"):
                    doc.add_paragraph(f"- [{s.get('document_name')}, Page {s.get('page_number',1)}] {s.get('source_text','')[:180]}...")

            file_path.parent.mkdir(parents=True, exist_ok=True)
            doc.save(str(file_path))
        except Exception as e:
            logger.error(f"Failed to export DOCX report: {e}")

    def _clean_pdf_text(self, text: str) -> str:
        """Sanitize text for standard Helvetica font in FPDF2, preventing latin-1 crashes."""
        if not text:
            return ""
        replacements = {
            "—": " - ", "–": " - ", "•": "- ", "“": '"', "”": '"',
            "’": "'", "‘": "'", "…": "...", "⚠": "[!]", "\u2014": " - ",
            "\u2013": " - ", "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
            "\u2022": "- ", "→": "->", "←": "<-", "≥": ">=", "≤": "<=", "±": "+/-",
            "©": "(c)", "®": "(R)", "\u00a0": " "
        }
        for k, v in replacements.items():
            text = text.replace(k, v)
        return text.encode("latin-1", "replace").decode("latin-1")

    def _strip_markdown_symbols(self, text: str) -> str:
        """Thoroughly remove raw markdown symbols (#, *, **, _, `) for clean human reading."""
        if not text:
            return ""
        # Remove markdown headers like ### or ##
        t = re.sub(r'^[ \t]*#{1,6}[ \t]*', '', text, flags=re.MULTILINE)
        # Remove bold/italic markdown
        t = re.sub(r'\*\*\*(.+?)\*\*\*', r'\1', t)
        t = re.sub(r'\*\*(.+?)\*\*', r'\1', t)
        t = re.sub(r'\*(.+?)\*', r'\1', t)
        t = re.sub(r'___(.+?)___', r'\1', t)
        t = re.sub(r'__(.+?)__', r'\1', t)
        t = re.sub(r'_(.+?)_', r'\1', t)
        t = re.sub(r'`(.+?)`', r'\1', t)
        # Clean bullet indicators to uniform simple dash
        t = re.sub(r'^[ \t]*[\*\•][ \t]+', '- ', t, flags=re.MULTILINE)
        # Clean multiple spaces
        t = re.sub(r'[ \t]{2,}', ' ', t)
        return t.strip()

    def _export_to_pdf(self, data: Dict[str, Any], file_path: Path):
        """Build professional, simple, executive-ready PDF report using FPDF2."""
        try:
            pdf = PDFReportGenerator(
                self._clean_pdf_text(data.get("title", "Executive Report")),
                self._clean_pdf_text(data.get("reporting_period", "Consolidated")),
                self._clean_pdf_text(data.get("subsidiary", "Consolidated CIL"))
            )
            pdf.set_margins(14, 14, 14)
            pdf.set_auto_page_break(auto=True, margin=18)
            pdf.add_page()

            def print_clean_body_text(raw_text: str):
                """Parse and write clean, readable paragraphs without symbols or awkward gaps."""
                cleaned = self._strip_markdown_symbols(raw_text)
                paragraphs = cleaned.split('\n')
                for p in paragraphs:
                    line = p.strip()
                    if not line:
                        pdf.ln(2)
                        continue
                    
                    if line.startswith('- ') or line.startswith('1. ') or line.startswith('2. ') or line.startswith('3. ') or line.startswith('4. '):
                        # Bullet or numbered item
                        bullet_txt = self._clean_pdf_text(line)
                        pdf.set_font("Helvetica", "", 9.5)
                        pdf.set_text_color(30, 41, 59)
                        pdf.set_x(18)
                        pdf.multi_cell(w=178, h=5, text=bullet_txt, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                    else:
                        # Normal paragraph text
                        para_txt = self._clean_pdf_text(line)
                        pdf.set_font("Helvetica", "", 9.5)
                        pdf.set_text_color(30, 41, 59)
                        pdf.set_x(14)
                        pdf.multi_cell(w=182, h=5.2, text=para_txt, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                        pdf.ln(1)

            # Section 1: Executive Summary Box
            pdf.set_fill_color(248, 250, 252)  # Soft cool white/gray
            pdf.set_draw_color(203, 213, 225)
            pdf.set_line_width(0.3)
            
            # Heading 1
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(0, 7, "1. Executive Summary", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(1)
            
            print_clean_body_text(data.get("executive_summary", "Summary of mining operations and statutory compliance."))
            pdf.ln(4)

            # Section 2: Key Operational Figures Table
            key_figs = data.get("key_figures") or []
            if key_figs:
                pdf.set_font("Helvetica", "B", 11)
                pdf.set_text_color(15, 23, 42)
                pdf.cell(0, 7, "2. Key Operational Figures", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(1)

                col1_w = 70
                col2_w = 52
                col3_w = 60

                # Table Header
                pdf.set_fill_color(226, 232, 240)
                pdf.set_draw_color(148, 163, 184)
                pdf.set_font("Helvetica", "B", 9)
                pdf.set_text_color(15, 23, 42)
                pdf.cell(col1_w, 6.5, " Metric Description", border=1, fill=True)
                pdf.cell(col2_w, 6.5, " Extracted Value", border=1, fill=True)
                pdf.cell(col3_w, 6.5, " Document Source", border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

                # Table Body
                pdf.set_font("Helvetica", "", 9)
                pdf.set_text_color(30, 41, 59)
                fill_toggle = False
                for fig in key_figs:
                    fill_color = 248 if fill_toggle else 255
                    pdf.set_fill_color(fill_color, fill_color, fill_color)
                    metric_str = " " + self._clean_pdf_text(str(fig.get("metric", "")))[:40]
                    val_str = " " + self._clean_pdf_text(f"{fig.get('value','')} {fig.get('unit','')}")[:28]
                    src_str = " " + self._clean_pdf_text(str(fig.get("source", "")))[:35]
                    
                    pdf.cell(col1_w, 6, metric_str, border=1, fill=True)
                    pdf.cell(col2_w, 6, val_str, border=1, fill=True)
                    pdf.cell(col3_w, 6, src_str, border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                    fill_toggle = not fill_toggle

                pdf.ln(4)

            # Section 3+: Detailed Content Sections
            sec_num = 3
            for sec in data.get("sections", []):
                sec_title = self._strip_markdown_symbols(sec.get("title", f"Section {sec_num}"))
                pdf.set_font("Helvetica", "B", 11)
                pdf.set_text_color(15, 23, 42)
                pdf.cell(0, 7, f"{sec_num}. {self._clean_pdf_text(sec_title)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(1)
                
                print_clean_body_text(sec.get("content", ""))
                pdf.ln(3)
                sec_num += 1

            # Discrepancies & Conflict Notices Box
            inconsistencies = data.get("inconsistencies") or []
            if inconsistencies:
                pdf.set_font("Helvetica", "B", 11)
                pdf.set_text_color(180, 83, 9)  # Amber
                pdf.cell(0, 7, f"{sec_num}. Data Discrepancies & Conflict Notes", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(1)
                
                pdf.set_fill_color(254, 243, 199)  # Light amber background
                pdf.set_draw_color(245, 158, 11)
                pdf.set_font("Helvetica", "", 9)
                pdf.set_text_color(120, 53, 15)

                for inc in inconsistencies:
                    inc_text = self._clean_pdf_text(
                        f"  * {inc.get('field_name')}: {inc.get('doc_a_name')} (Pg {inc.get('doc_a_page')}: {inc.get('doc_a_value')}) vs "
                        f"{inc.get('doc_b_name')} (Pg {inc.get('doc_b_page')}: {inc.get('doc_b_value')}) -- Variance: {inc.get('variance_percentage')}%"
                    )
                    pdf.multi_cell(w=182, h=5, text=inc_text, border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                    pdf.ln(1)
                
                pdf.ln(3)
                sec_num += 1

            # Source Provenance & Audit Trail
            sources = data.get("sources") or []
            if sources:
                pdf.set_font("Helvetica", "B", 10)
                pdf.set_text_color(100, 116, 139)
                pdf.cell(0, 6, f"{sec_num}. Source Provenance & Document Citations", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(1)
                
                pdf.set_font("Helvetica", "I", 8)
                pdf.set_text_color(100, 116, 139)
                for s in sources:
                    s_name = self._clean_pdf_text(str(s.get('document_name', 'Document')))
                    s_pg = s.get('page_number', 1)
                    s_excerpt = self._clean_pdf_text(self._strip_markdown_symbols(str(s.get('source_text', ''))))[:150]
                    src_line = f"- [{s_name}, Page {s_pg}] {s_excerpt}..."
                    pdf.multi_cell(w=182, h=4.2, text=src_line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.ln(2)

            # Official Sign-Off Block at end of report
            pdf.ln(4)
            pdf.set_draw_color(203, 213, 225)
            pdf.set_line_width(0.3)
            pdf.line(14, pdf.get_y(), 196, pdf.get_y())
            pdf.ln(3)
            
            pdf.set_font("Helvetica", "B", 8)
            pdf.set_text_color(71, 85, 105)
            pdf.cell(90, 5, "REVIEWING OFFICER SIGN-OFF:", new_x=XPos.RIGHT, new_y=YPos.TOP)
            pdf.cell(0, 5, f"DATE: {time.strftime('%d-%b-%Y')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="R")
            
            pdf.set_font("Helvetica", "I", 7.5)
            pdf.set_text_color(148, 163, 184)
            pdf.cell(0, 4, "Digitally Compiled & Grounded by SIH26023 AI Mining Intelligence Engine", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

            file_path.parent.mkdir(parents=True, exist_ok=True)
            pdf.output(str(file_path))
            logger.info(f"Successfully exported clean PDF report to {file_path}")
        except Exception as e:
            logger.error(f"Failed to export PDF report: {e}")

# Global report service
report_service = ReportService()
