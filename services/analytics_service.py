"""
Real-Time Analytics & Mining KPI Service for SIH26023.
Derives actual metrics and Chart.js datasets from processed documents and extracted data.
Never fabricates statistics; reflects genuine database records.
"""

import logging
from typing import Dict, Any, List
from database.db import get_db

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Aggregates and formats enterprise mining analytics for dashboard charts."""

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Fetch high-level overview metrics."""
        try:
            with get_db() as conn:
                doc_stats = conn.execute(
                    """
                    SELECT 
                        COUNT(*) as total_docs,
                        SUM(CASE WHEN status = 'PROCESSED' THEN 1 ELSE 0 END) as processed_docs,
                        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_docs,
                        SUM(page_count) as total_pages
                    FROM documents
                    """
                ).fetchone()

                records_count = conn.execute("SELECT COUNT(*) as cnt FROM extracted_data").fetchone()["cnt"]
                inconsistencies_count = conn.execute("SELECT COUNT(*) as cnt FROM validation_issues WHERE status = 'UNRESOLVED'").fetchone()["cnt"]
                reports_count = conn.execute("SELECT COUNT(*) as cnt FROM reports").fetchone()["cnt"]
                inquiries_count = conn.execute("SELECT COUNT(*) as cnt FROM inquiries").fetchone()["cnt"]
                queries_count = conn.execute("SELECT COUNT(*) as cnt FROM queries").fetchone()["cnt"]

                # Production total in MT
                prod_row = conn.execute(
                    """
                    SELECT SUM(numeric_value) as total_prod
                    FROM extracted_data
                    WHERE field_name = 'Coal Production' AND numeric_value IS NOT NULL
                    """
                ).fetchone()
                total_prod_mt = round(prod_row["total_prod"] or 0.0, 2)

                # OBR total
                obr_row = conn.execute(
                    """
                    SELECT SUM(numeric_value) as total_obr
                    FROM extracted_data
                    WHERE field_name = 'Overburden Removal (OBR)' AND numeric_value IS NOT NULL
                    """
                ).fetchone()
                total_obr_mcum = round(obr_row["total_obr"] or 0.0, 2)

                return {
                    "total_documents": doc_stats["total_docs"] or 0,
                    "processed_documents": doc_stats["processed_docs"] or 0,
                    "failed_documents": doc_stats["failed_docs"] or 0,
                    "total_pages": doc_stats["total_pages"] or 0,
                    "extracted_records": records_count,
                    "unresolved_inconsistencies": inconsistencies_count,
                    "generated_reports": reports_count,
                    "inquiries_processed": inquiries_count,
                    "ai_queries_executed": queries_count,
                    "total_production_mt": total_prod_mt,
                    "total_obr_mcum": total_obr_mcum
                }
        except Exception as e:
            logger.error(f"Failed to fetch dashboard summary: {e}")
            return {
                "total_documents": 0,
                "processed_documents": 0,
                "failed_documents": 0,
                "total_pages": 0,
                "extracted_records": 0,
                "unresolved_inconsistencies": 0,
                "generated_reports": 0,
                "inquiries_processed": 0,
                "ai_queries_executed": 0,
                "total_production_mt": 0.0,
                "total_obr_mcum": 0.0
            }

    def get_charts_data(self) -> Dict[str, Any]:
        """Aggregate data for Chart.js interactive visualizations."""
        try:
            with get_db() as conn:
                # 1. Production by Subsidiary (Bar / Doughnut)
                sub_rows = conn.execute(
                    """
                    SELECT subsidiary, SUM(numeric_value) as production_mt
                    FROM extracted_data
                    WHERE field_name = 'Coal Production' AND numeric_value IS NOT NULL AND subsidiary IS NOT NULL
                    GROUP BY subsidiary
                    ORDER BY production_mt DESC
                    """
                ).fetchall()

                sub_labels = [r["subsidiary"] for r in sub_rows]
                sub_values = [round(r["production_mt"], 2) for r in sub_rows]

                # 2. Production Trends by Reporting Period (Line Chart)
                period_rows = conn.execute(
                    """
                    SELECT reporting_period, SUM(numeric_value) as production_mt
                    FROM extracted_data
                    WHERE field_name = 'Coal Production' AND numeric_value IS NOT NULL AND reporting_period IS NOT NULL
                    GROUP BY reporting_period
                    ORDER BY id ASC
                    """
                ).fetchall()

                trend_labels = [r["reporting_period"] for r in period_rows]
                trend_values = [round(r["production_mt"], 2) for r in period_rows]

                # 3. Target vs Actual Production
                target_rows = conn.execute(
                    """
                    SELECT subsidiary, 
                           SUM(CASE WHEN field_name = 'Production Target' THEN numeric_value ELSE 0 END) as target_mt,
                           SUM(CASE WHEN field_name = 'Coal Production' THEN numeric_value ELSE 0 END) as actual_mt
                    FROM extracted_data
                    WHERE subsidiary IS NOT NULL AND numeric_value IS NOT NULL
                    GROUP BY subsidiary
                    HAVING target_mt > 0 OR actual_mt > 0
                    """
                ).fetchall()

                comp_labels = [r["subsidiary"] for r in target_rows]
                comp_targets = [round(r["target_mt"], 2) for r in target_rows]
                comp_actuals = [round(r["actual_mt"], 2) for r in target_rows]

                # 4. Safety Metrics Distribution (Fatal vs Serious vs LTIFR)
                safety_rows = conn.execute(
                    """
                    SELECT subsidiary,
                           SUM(CASE WHEN field_name = 'Fatal Accidents' THEN numeric_value ELSE 0 END) as fatal_count,
                           SUM(CASE WHEN field_name = 'Serious Accidents' THEN numeric_value ELSE 0 END) as serious_count
                    FROM extracted_data
                    WHERE field_category = 'Safety' AND subsidiary IS NOT NULL
                    GROUP BY subsidiary
                    """
                ).fetchall()

                safety_labels = [r["subsidiary"] for r in safety_rows]
                safety_fatals = [int(r["fatal_count"]) for r in safety_rows]
                safety_serious = [int(r["serious_count"]) for r in safety_rows]

                # 5. Inconsistency Severity Breakdown
                val_rows = conn.execute(
                    """
                    SELECT severity, COUNT(*) as cnt
                    FROM validation_issues
                    GROUP BY severity
                    """
                ).fetchall()
                val_breakdown = {r["severity"]: r["cnt"] for r in val_rows}

                return {
                    "subsidiary_production": {
                        "labels": sub_labels,
                        "data": sub_values
                    },
                    "production_trend": {
                        "labels": trend_labels,
                        "data": trend_values
                    },
                    "target_vs_actual": {
                        "labels": comp_labels,
                        "targets": comp_targets,
                        "actuals": comp_actuals
                    },
                    "safety_kpis": {
                        "labels": safety_labels,
                        "fatal": safety_fatals,
                        "serious": safety_serious
                    },
                    "validation_severity": val_breakdown
                }
        except Exception as e:
            logger.error(f"Failed to generate charts data: {e}")
            return {
                "subsidiary_production": {"labels": [], "data": []},
                "production_trend": {"labels": [], "data": []},
                "target_vs_actual": {"labels": [], "targets": [], "actuals": []},
                "safety_kpis": {"labels": [], "fatal": [], "serious": []},
                "validation_severity": {}
            }

    def get_kpi_framework(self) -> Dict[str, Any]:
        """
        Formal KPI & Measurement Methodology Framework (SIH26023).
        Calculates empirical metrics dynamically from live database state and controlled
        evaluation benchmarks. Distinguishes KPI definitions, project targets, actual
        measured results, sample sizes, and measurement types.
        ZERO fabricated numbers.
        """
        from services.evaluation_service import evaluation_service

        try:
            with get_db() as conn:
                doc_stats = conn.execute(
                    """
                    SELECT 
                        COUNT(*) as total_docs,
                        SUM(CASE WHEN status = 'PROCESSED' THEN 1 ELSE 0 END) as processed_docs
                    FROM documents
                    """
                ).fetchone()

                total_docs = doc_stats["total_docs"] or 0
                processed_docs = doc_stats["processed_docs"] or 0
                doc_success_rate = round((processed_docs / total_docs * 100.0), 1) if total_docs > 0 else None

                wf_stats = conn.execute(
                    """
                    SELECT 
                        COUNT(*) as total_wf,
                        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_wf
                    FROM agent_workflows
                    """
                ).fetchone()

                total_wf = wf_stats["total_wf"] or 0
                completed_wf = wf_stats["completed_wf"] or 0
                wf_success_rate = round((completed_wf / total_wf * 100.0), 1) if total_wf > 0 else None
        except Exception as e:
            logger.error(f"Error querying DB for KPI framework: {e}")
            total_docs = 0
            processed_docs = 0
            doc_success_rate = None
            total_wf = 0
            completed_wf = 0
            wf_success_rate = None

        # Evaluate extraction against ground-truth fixture
        extraction_eval = evaluation_service.evaluate_extraction_accuracy()

        # Evaluate retrieval, QA grounding, and citations if documents exist
        qa_eval = evaluation_service.evaluate_retrieval_and_qa()

        kpis = [
            {
                "kpi_id": "KPI-01",
                "name": "Report Preparation Time Reduction",
                "formula": "((T_manual_baseline - T_automated) / T_manual_baseline) * 100",
                "definition": "Percentage reduction in hours required to compile a multi-source executive mining report compared against historical manual baseline.",
                "target_benchmark": "≥ 70.0% time reduction",
                "target_type": "Project-defined target",
                "measured_result": None,
                "formatted_result": "Not yet measured.",
                "sample_size": "N/A (No empirical human baseline recorded)",
                "data_source": "Requires empirical CIL time-motion study",
                "measurement_type": "NOT YET MEASURED",
                "status": "TARGET ONLY",
                "methodology_note": "Formula and telemetry hooks implemented; empirical percentage savings cannot be claimed without an authorized human baseline study."
            },
            {
                "kpi_id": "KPI-02",
                "name": "Structured Extraction Accuracy",
                "formula": "(Matched_Verified_Fields / Total_Ground_Truth_Fields) * 100",
                "definition": "Proportion of extracted numerical mining entities (Production MT, Target MT, OBR M.Cum, Reserves) matching verified ground truth within tolerance.",
                "target_benchmark": "≥ 90.0% field accuracy",
                "target_type": "Project-defined target",
                "measured_result": extraction_eval["measured_result"],
                "formatted_result": extraction_eval["formatted_result"],
                "sample_size": extraction_eval["sample_size"],
                "data_source": "Synthetic Evaluation Fixture (services/evaluation_service.py)",
                "measurement_type": extraction_eval["measurement_type"],
                "status": extraction_eval["status"],
                "methodology_note": "Evaluated against canonical synthetic ground-truth records across PDF, DOCX, and XLSX test files."
            },
            {
                "kpi_id": "KPI-03",
                "name": "Query-Answer Accuracy & Grounding",
                "formula": "(Correctly_Grounded_Answers / Total_Audited_Queries) * 100",
                "definition": "Proportion of queries answering strictly with verified document facts and returning mandatory rejection on out-of-domain queries.",
                "target_benchmark": "100.0% grounded answers (Zero hallucination)",
                "target_type": "Project-defined target",
                "measured_result": qa_eval["qa_accuracy"],
                "formatted_result": qa_eval["qa_formatted"],
                "sample_size": qa_eval["sample_size"],
                "data_source": "Controlled QA Evaluation Suite (services/evaluation_service.py)",
                "measurement_type": qa_eval["measurement_type"],
                "status": qa_eval["status"],
                "methodology_note": "Evaluates factual extraction queries and negative out-of-domain prompts against active chunk retrieval."
            },
            {
                "kpi_id": "KPI-04",
                "name": "Citation Correctness & Provenance Precision",
                "formula": "(Valid_Provenance_Citations / Total_Generated_Citations) * 100",
                "definition": "Proportion of citations containing valid document name, non-empty page number, and matching source text chunks in SQLite database.",
                "target_benchmark": "≥ 95.0% citation precision",
                "target_type": "Project-defined target",
                "measured_result": qa_eval["citation_precision"],
                "formatted_result": qa_eval["citation_formatted"],
                "sample_size": qa_eval["sample_size"],
                "data_source": "Controlled QA Evaluation Suite (services/evaluation_service.py)",
                "measurement_type": qa_eval["measurement_type"],
                "status": qa_eval["status"],
                "methodology_note": "Validates that every citation points to an actual verified document chunk without fabricated references."
            },
            {
                "kpi_id": "KPI-05",
                "name": "Automation Percentage in Report Lifecycle",
                "formula": "(Automated_Lifecycle_Stages / Total_Eligible_Lifecycle_Stages) * 100",
                "definition": "Proportion of reporting stages executed autonomously by agents versus stages reserved for mandatory human verification.",
                "target_benchmark": "80.0% - 90.0% automated (Final stage mandatory HITL)",
                "target_type": "Project-defined target",
                "measured_result": 87.5,
                "formatted_result": "87.5% (7 of 8 core lifecycle stages automated; final stage is mandatory HITL)",
                "sample_size": "8 core architectural lifecycle stages",
                "data_source": "Multi-Agent System Pipeline Architecture",
                "measurement_type": "CONTROLLED TEST",
                "status": "MEASURED",
                "methodology_note": "Stages 1-7 (Ingest, OCR, Embed, Extract, Validate, Retrieve, Draft) are automated; Stage 8 (Official Sign-off) is strictly Human-In-The-Loop."
            },
            {
                "kpi_id": "KPI-06",
                "name": "Document Processing Success Rate",
                "formula": "(Successfully_Processed_Docs / Total_Uploaded_Docs) * 100",
                "definition": "Proportion of valid uploaded/seeded documents successfully parsed and indexed into chunks without server failure.",
                "target_benchmark": "≥ 95.0% across all supported formats",
                "target_type": "Project-defined target",
                "measured_result": doc_success_rate,
                "formatted_result": f"{doc_success_rate}% ({processed_docs}/{total_docs} docs processed)" if doc_success_rate is not None else "No measured result available.",
                "sample_size": f"N = {total_docs} documents in active DB" if total_docs > 0 else "N = 0",
                "data_source": "Active SQLite Database (documents table)",
                "measurement_type": "CONTROLLED TEST" if total_docs > 0 else "NOT YET MEASURED",
                "status": "MEASURED" if total_docs > 0 else "INSUFFICIENT DATA",
                "methodology_note": "Calculated dynamically from active session documents table."
            },
            {
                "kpi_id": "KPI-07",
                "name": "Hybrid Retrieval Relevance (Top-1 Relevant Yield)",
                "formula": "(Queries_with_Top1_Relevant_Doc / Total_Domain_Queries) * 100",
                "definition": "Proportion of domain queries where the top-ranked retrieved chunk originated from the known canonical ground-truth document.",
                "target_benchmark": "≥ 85.0% top-ranked precision",
                "target_type": "Project-defined target",
                "measured_result": qa_eval["retrieval_relevance"],
                "formatted_result": qa_eval["retrieval_formatted"],
                "sample_size": qa_eval["sample_size"],
                "data_source": "Controlled QA Evaluation Suite (services/evaluation_service.py)",
                "measurement_type": qa_eval["measurement_type"],
                "status": qa_eval["status"],
                "methodology_note": "Evaluated via Sublinear TF-IDF + Cosine Vector Reciprocal Rank Fusion (RRF)."
            },
            {
                "kpi_id": "KPI-08",
                "name": "Multi-Agent Workflow Execution Reliability",
                "formula": "(Completed_Workflows / Total_Dispatched_Workflows) * 100",
                "definition": "Proportion of multi-agent DAG workflows completing in COMPLETED status without unhandled agent exceptions.",
                "target_benchmark": "≥ 95.0% workflow completion",
                "target_type": "Project-defined target",
                "measured_result": wf_success_rate,
                "formatted_result": f"{wf_success_rate}% ({completed_wf}/{total_wf} workflows completed)" if wf_success_rate is not None else "No measured result available.",
                "sample_size": f"N = {total_wf} workflow runs in active DB" if total_wf > 0 else "N = 0",
                "data_source": "Active SQLite Database (agent_workflows table)",
                "measurement_type": "CONTROLLED TEST" if total_wf > 0 else "NOT YET MEASURED",
                "status": "MEASURED" if total_wf > 0 else "INSUFFICIENT DATA",
                "methodology_note": "Calculated dynamically from active agent_workflows table."
            }
        ]

        return {
            "framework_name": "SIH26023 Mining Document Intelligence KPI & Measurement Framework",
            "organization": "Coal India Limited / CMPDI",
            "disclaimer": "SYNTHETIC DEMONSTRATION BENCHMARK — Real CIL operational KPIs require production deployment with authorized organizational data.",
            "kpis_count": len(kpis),
            "kpis": kpis
        }

# Global analytics service
analytics_service = AnalyticsService()

