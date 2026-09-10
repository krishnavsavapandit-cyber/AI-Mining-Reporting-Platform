"""
Report Generation Agent for SIH26023 Multi-Agent Platform.
Responsible for synthesizing multi-section executive reports, organizing key figures,
incorporating cross-document validation notices, and producing exportable PDF/DOCX files.
"""

import logging
from typing import Dict, Any, List
from agents.base_agent import BaseAgent
from agents.agent_messages import AgentTask, AgentResult, WorkflowContext, EvidenceItem
from services.ai_service import ai_service
from services.report_service import report_service
from database.db import get_db

logger = logging.getLogger(__name__)

class ReportGenerationAgent(BaseAgent):
    """Specialized agent for drafting, structuring, and exporting comprehensive mining reports."""

    def __init__(self):
        super().__init__(
            name="ReportGenerationAgent",
            description="Compiles multi-section executive mining reports with tables, validation caveats, and PDF/DOCX exports.",
            capabilities=[
                "REPORT_SYNTHESIS",
                "TABULAR_GENERATION",
                "EXECUTIVE_SUMMARY",
                "PDF_DOCX_EXPORT",
                "CITATION_ASSEMBLY"
            ]
        )

    def _execute(self, task: AgentTask, context: WorkflowContext) -> AgentResult:
        input_data = task.input_data or {}
        report_type = input_data.get("report_type", "Consolidated Mining Production Report")
        title = input_data.get("title", f"CIL Executive Report — {report_type}")
        subsidiary = input_data.get("subsidiary")
        period = input_data.get("reporting_period")
        custom_instructions = input_data.get("instructions", "Provide a comprehensive formal assessment.")

        evidence = [e.to_dict() if hasattr(e, 'to_dict') else e for e in context.accumulated_evidence]
        inconsistencies = input_data.get("inconsistencies", [])

        # 1. Fetch relevant key extracted figures from database
        key_figures = self._fetch_key_figures(subsidiary, period)

        # 2. Generate Executive Summary via AI Service
        summary_prompt = f"Write a concise executive summary for {title} covering subsidiary: {subsidiary or 'All Subsidiaries'} and period: {period or 'Recent Periods'}."
        summary_res = ai_service.generate_report_section(
            section_name="Executive Summary",
            topic=report_type,
            evidence=evidence,
            instructions=summary_prompt
        )
        executive_summary = summary_res.get("text", "Executive summary compiled based on verified document records.")

        # 3. Generate Core Specialized Report Sections
        sections = []
        section_blueprints = self._get_section_blueprints(report_type)
        
        for sec_name, sec_instruction in section_blueprints:
            sec_res = ai_service.generate_report_section(
                section_name=sec_name,
                topic=report_type,
                evidence=evidence,
                instructions=f"{sec_instruction} {custom_instructions}"
            )
            sections.append({
                "title": sec_name,
                "content": sec_res.get("text", "Section compiled from verified document records.")
            })

        # 4. Compile and Export via ReportService
        sources_list = [
            {"document_name": e.get("document_name"), "page_number": e.get("page_number", 1), "source_text": e.get("source_text", "")}
            for e in evidence[:10]
        ]

        report_output = report_service.generate_report_content(
            report_type=report_type,
            title=title,
            subsidiary=subsidiary,
            reporting_period=period,
            sections=sections,
            executive_summary=executive_summary,
            inconsistencies=inconsistencies,
            sources=sources_list,
            key_figures=key_figures
        )

        return AgentResult(
            task_id=task.task_id,
            workflow_id=task.workflow_id,
            agent_name=self.name,
            status="SUCCESS",
            result_data=report_output,
            evidence=context.accumulated_evidence,
            confidence=0.95,
            warnings=[f"Includes {len(inconsistencies)} cross-document discrepancy caveats."] if inconsistencies else [],
            sources=sources_list,
            next_action="REPORT_EXPORTED_FOR_HUMAN_REVIEW"
        )

    def _fetch_key_figures(self, subsidiary: Optional[str], period: Optional[str]) -> List[Dict[str, Any]]:
        figures = []
        try:
            with get_db() as conn:
                sql = """
                    SELECT e.field_name as metric, e.raw_value as value, e.unit, d.original_name as doc, e.page_number as page
                    FROM extracted_data e
                    JOIN documents d ON e.document_id = d.id
                    WHERE 1=1
                """
                params = []
                if subsidiary:
                    sql += " AND (e.subsidiary = ? OR d.subsidiary = ?)"
                    params.extend([subsidiary, subsidiary])
                if period:
                    sql += " AND (e.reporting_period = ? OR d.reporting_period = ?)"
                    params.extend([period, period])

                sql += " ORDER BY e.id DESC LIMIT 8"
                rows = conn.execute(sql, params).fetchall()
                for r in rows:
                    figures.append({
                        "metric": r["metric"],
                        "value": r["value"],
                        "unit": r["unit"] or "",
                        "source": f"{r['doc']} (Pg {r['page']})"
                    })
        except Exception as e:
            logger.error(f"Failed to fetch key figures: {e}")
        return figures

    def _get_section_blueprints(self, report_type: str) -> List[tuple]:
        if "Production" in report_type:
            return [
                ("1. Production & Offtake Performance", "Analyze coal extraction volumes, target achievement percentages, and dispatch trends."),
                ("2. Overburden Removal & Stripping Ratio", "Review OBR performance, equipment dragline utilization, and stripping efficiency."),
                ("3. Operational Constraints & Bottlenecks", "Highlight railway rake availability, weather impacts, and machinery downtime.")
            ]
        elif "Geological" in report_type:
            return [
                ("1. Geological Stratigraphy & Seam Characteristics", "Detail identified coal seams, borehole depths, and lithological findings."),
                ("2. Coal Quality & Grade Parameters", "Analyze ash percentage, moisture content, and gross calorific value distribution."),
                ("3. Reserve Estimates & Mineable Horizons", "Review proven reserves and recommended extraction methodologies.")
            ]
        elif "Safety" in report_type:
            return [
                ("1. Safety Performance & Incident Record", "Review statutory safety inspections, fatal/serious accident occurrences, and LTIFR."),
                ("2. DGMS Compliance & Remedial Measures", "Analyze safety committee reviews and technological interventions implemented.")
            ]
        elif "Equipment" in report_type:
            return [
                ("1. HEMM Fleet Availability & Utilization", "Detail availability and utilization percentage of Draglines, Shovels, and Dumpers."),
                ("2. Breakdown Analysis & Maintenance Schedules", "Identify critical component failures, spare parts delays, and preventive maintenance.")
            ]
        else:
            return [
                ("1. Operational Review", "Provide overall assessment of mining operations and milestones."),
                ("2. Strategic Observations & Compliance", "Summarize compliance, administrative directives, and recommendations.")
            ]
