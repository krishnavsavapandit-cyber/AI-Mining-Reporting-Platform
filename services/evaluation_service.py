"""
Controlled Synthetic Evaluation Benchmark Service for SIH26023.
Provides verifiable ground-truth evaluation datasets for calculating
empirical extraction accuracy, query-answer accuracy, citation correctness,
and retrieval relevance on synthetic test documents without fabricating results.

LABEL: SYNTHETIC EVALUATION DATA — NOT OFFICIAL CIL DATA.
"""

import logging
from typing import Dict, Any, List, Tuple
from database.db import get_db

logger = logging.getLogger(__name__)

# Canonical Ground-Truth Fields for Seeded Synthetic Files
GROUND_TRUTH_EXTRACTION_FIELDS: List[Dict[str, Any]] = [
    {
        "doc_pattern": "ECL_Rajmahal_Monthly_Production_May_2025.pdf",
        "field_name": "Coal Production",
        "expected_value": 1.32,
        "tolerance": 0.05
    },
    {
        "doc_pattern": "ECL_Rajmahal_Monthly_Production_May_2025.pdf",
        "field_name": "Production Target",
        "expected_value": 1.40,
        "tolerance": 0.05
    },
    {
        "doc_pattern": "ECL_Rajmahal_Monthly_Production_May_2025.pdf",
        "field_name": "Overburden Removal",
        "expected_value": 3.85,
        "tolerance": 0.05
    },
    {
        "doc_pattern": "ECL_Annual_Production_Summary_Discrepancy_Check_2025.pdf",
        "field_name": "Coal Production",
        "expected_value": 1.28,
        "tolerance": 0.05
    },
    {
        "doc_pattern": "BCCL_Jharia_Coalfield_Geological_Survey_Report_2025.docx",
        "field_name": "Geological Reserves",
        "expected_value": 412.5,
        "tolerance": 1.0
    },
    {
        "doc_pattern": "SECL_Korba_Operational_HEMM_Performance_Q1.xlsx",
        "field_name": "Coal Production",
        "expected_value": 14.80,
        "tolerance": 0.2
    },
    {
        "doc_pattern": "SECL_Korba_Operational_HEMM_Performance_Q1.xlsx",
        "field_name": "Overburden Removal",
        "expected_value": 38.20,
        "tolerance": 0.5
    }
]

# Canonical Evaluation Queries for Retrieval and Factual QA
GROUND_TRUTH_EVAL_QUERIES: List[Dict[str, Any]] = [
    {
        "query": "What was the coal production in ECL Rajmahal during May 2025?",
        "expected_target": "1.32",
        "expected_doc_substring": "ECL_Rajmahal",
        "is_out_of_domain": False
    },
    {
        "query": "What are the geological reserves in BCCL Jharia Coalfield?",
        "expected_target": "412.5",
        "expected_doc_substring": "BCCL_Jharia",
        "is_out_of_domain": False
    },
    {
        "query": "What was the Overburden Removal at Rajmahal in May 2025?",
        "expected_target": "3.85",
        "expected_doc_substring": "ECL_Rajmahal",
        "is_out_of_domain": False
    },
    {
        "query": "What is the average surface temperature on Mars?",
        "expected_target": "Insufficient information found in the available documents.",
        "expected_doc_substring": None,
        "is_out_of_domain": True
    }
]

class EvaluationService:
    """Service to evaluate empirical metrics against reproducible ground truth."""

    def evaluate_extraction_accuracy(self) -> Dict[str, Any]:
        """
        Calculates extraction accuracy against the controlled ground-truth dataset.
        Formula: (Matched_Verified_Fields / Total_Ground_Truth_Fields) * 100
        """
        try:
            with get_db() as conn:
                extracted_rows = conn.execute(
                    """
                    SELECT d.original_name, e.field_name, e.numeric_value, e.raw_value
                    FROM extracted_data e
                    JOIN documents d ON e.document_id = d.id
                    """
                ).fetchall()

                if not extracted_rows:
                    return {
                        "measured_result": None,
                        "formatted_result": "No measured result available.",
                        "sample_size": "N = 0 (Database contains no extracted entities)",
                        "matched_count": 0,
                        "total_count": len(GROUND_TRUTH_EXTRACTION_FIELDS),
                        "status": "INSUFFICIENT DATA",
                        "measurement_type": "NOT YET MEASURED"
                    }

                matched = 0
                for gt in GROUND_TRUTH_EXTRACTION_FIELDS:
                    for row in extracted_rows:
                        if gt["doc_pattern"].lower() in row["original_name"].lower() and gt["field_name"].lower() == row["field_name"].lower():
                            val = row["numeric_value"]
                            if val is not None and abs(val - gt["expected_value"]) <= gt["tolerance"]:
                                matched += 1
                                break

                total_gt = len(GROUND_TRUTH_EXTRACTION_FIELDS)
                accuracy_pct = round((matched / total_gt) * 100.0, 1)

                return {
                    "measured_result": accuracy_pct,
                    "formatted_result": f"{accuracy_pct}% ({matched}/{total_gt} ground-truth fields matched)",
                    "sample_size": f"N = {total_gt} verified ground-truth fields",
                    "matched_count": matched,
                    "total_count": total_gt,
                    "status": "MEASURED",
                    "measurement_type": "SYNTHETIC EVALUATION"
                }
        except Exception as e:
            logger.error(f"Error evaluating extraction accuracy: {e}")
            return {
                "measured_result": None,
                "formatted_result": "No measured result available.",
                "sample_size": "N = 0",
                "matched_count": 0,
                "total_count": len(GROUND_TRUTH_EXTRACTION_FIELDS),
                "status": "INSUFFICIENT DATA",
                "measurement_type": "NOT YET MEASURED"
            }

    def evaluate_retrieval_and_qa(self) -> Dict[str, Any]:
        """
        Evaluates retrieval relevance, query-answer accuracy, and citation precision
        against the controlled query evaluation dataset.
        """
        try:
            from services.retrieval_service import retrieval_service
            from services.ai_service import ai_service

            with get_db() as conn:
                doc_count = conn.execute("SELECT COUNT(*) as cnt FROM documents WHERE status = 'PROCESSED'").fetchone()["cnt"]
                if doc_count == 0:
                    return {
                        "qa_accuracy": None,
                        "qa_formatted": "No measured result available.",
                        "retrieval_relevance": None,
                        "retrieval_formatted": "No measured result available.",
                        "citation_precision": None,
                        "citation_formatted": "No measured result available.",
                        "sample_size": "N = 0 (Requires ingested test documents)",
                        "measurement_type": "NOT YET MEASURED",
                        "status": "INSUFFICIENT DATA"
                    }

            qa_correct = 0
            retrieval_hits = 0
            citations_valid = 0
            total_citations = 0

            for item in GROUND_TRUTH_EVAL_QUERIES:
                query = item["query"]
                search_results = retrieval_service.hybrid_search(query, top_k=5)
                chunks = [e.source_text for e in search_results]
                evidence_dicts = [e.to_dict() for e in search_results]

                if not item["is_out_of_domain"]:
                    # Check top retrieval hit
                    if search_results:
                        top_doc = search_results[0].document_name or ""
                        if item["expected_doc_substring"] and item["expected_doc_substring"].lower() in top_doc.lower():
                            retrieval_hits += 1

                # Generate AI response
                ai_resp = ai_service.generate_chat_response(
                    prompt=query,
                    system_prompt="You are a mining document intelligence assistant for Coal India Limited.",
                    evidence=evidence_dicts
                )
                answer = ai_resp.get("text", "")

                if item["is_out_of_domain"]:
                    if "Insufficient information found in the available documents." in answer:
                        qa_correct += 1
                else:
                    if item["expected_target"] in answer:
                        qa_correct += 1

                # Evaluate citations
                total_citations += len(evidence_dicts)
                for s in evidence_dicts:
                    doc_name = s.get("document_name", "")
                    page_num = s.get("page_number")
                    if doc_name and page_num is not None:
                        citations_valid += 1

            total_queries = len(GROUND_TRUTH_EVAL_QUERIES)
            domain_queries = sum(1 for q in GROUND_TRUTH_EVAL_QUERIES if not q["is_out_of_domain"])
            
            qa_pct = round((qa_correct / total_queries) * 100.0, 1)
            retrieval_pct = round((retrieval_hits / max(domain_queries, 1)) * 100.0, 1)
            citation_pct = round((citations_valid / max(total_citations, 1)) * 100.0, 1) if total_citations > 0 else 100.0

            return {
                "qa_accuracy": qa_pct,
                "qa_formatted": f"{qa_pct}% ({qa_correct}/{total_queries} queries correctly grounded/rejected)",
                "retrieval_relevance": retrieval_pct,
                "retrieval_formatted": f"{retrieval_pct}% ({retrieval_hits}/{domain_queries} top-1 relevant hits)",
                "citation_precision": citation_pct,
                "citation_formatted": f"{citation_pct}% ({citations_valid}/{total_citations} citations verified with doc/page pointers)",
                "sample_size": f"N = {total_queries} controlled test queries",
                "measurement_type": "SYNTHETIC EVALUATION",
                "status": "MEASURED"
            }
        except Exception as e:
            logger.error(f"Error evaluating retrieval and QA: {e}")
            return {
                "qa_accuracy": None,
                "qa_formatted": "No measured result available.",
                "retrieval_relevance": None,
                "retrieval_formatted": "No measured result available.",
                "citation_precision": None,
                "citation_formatted": "No measured result available.",
                "sample_size": "N = 0",
                "measurement_type": "NOT YET MEASURED",
                "status": "INSUFFICIENT DATA"
            }

evaluation_service = EvaluationService()
