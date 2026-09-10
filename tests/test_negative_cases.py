"""
Comprehensive Negative & Edge-Case Test Suite for SIH26023.
Tests resilience against missing evidence, unrelated queries, empty databases,
corrupt files, AI provider outages, and conflicting cross-document data.
"""

import os
import unittest
from pathlib import Path
from agents.manager_agent import manager_agent
from services.ai_service import ai_service, MANDATORY_NO_EVIDENCE_RESPONSE
from services.document_processor import document_processor
from services.validation_service import validation_service
from services.deterministic_provider import DeterministicProvider

class TestNegativeAndEdgeCases(unittest.TestCase):
    """Rigorous negative and edge case verification."""

    def test_completely_unrelated_query(self):
        """Verify that unrelated questions return the mandatory no-hallucination string."""
        unrelated_query = "What is the average surface temperature and atmospheric pressure on Mars?"
        result = manager_agent.run_query_workflow(unrelated_query)
        answer = result.get("answer", "")
        self.assertIn(
            MANDATORY_NO_EVIDENCE_RESPONSE,
            answer,
            f"Expected mandatory response '{MANDATORY_NO_EVIDENCE_RESPONSE}' for unrelated query, got: {answer}"
        )

    def test_empty_evidence_chat_response(self):
        """Verify AIService returns exact mandatory string when evidence list is empty."""
        res = ai_service.generate_chat_response(
            prompt="Tell me about ECL quarterly excavation statistics",
            system_prompt="Test system prompt",
            evidence=[]
        )
        self.assertEqual(res.get("text"), MANDATORY_NO_EVIDENCE_RESPONSE)
        self.assertEqual(res.get("confidence"), 0.0)
        self.assertEqual(res.get("confidence_semantics", {}).get("validation_status"), "INSUFFICIENT")

    def test_low_relevance_evidence_gating(self):
        """Verify that evidence with near-zero relevance score is rejected as insufficient."""
        low_rel_evidence = [{
            "document_id": 999,
            "document_name": "Irrelevant.pdf",
            "page_number": 1,
            "section_title": "Misc",
            "source_text": "Random text about canteen menus and office stationery supplies.",
            "relevance_score": 0.05
        }]
        res = ai_service.generate_chat_response(
            prompt="What was the total coal production of SECL in Q1?",
            system_prompt="Test system prompt",
            evidence=low_rel_evidence
        )
        self.assertIn(MANDATORY_NO_EVIDENCE_RESPONSE, res.get("text"))

    def test_inquiry_with_insufficient_evidence(self):
        """Verify parliamentary inquiry with zero evidence includes mandatory draft watermark and no-evidence notice."""
        result = manager_agent.run_inquiry_workflow(
            question_text="Has Coal India established underwater lunar mining operations?",
            inquiry_ref="LS-TEST-NEG-01"
        )
        inquiry_data = result.get("inquiry", {})
        draft = inquiry_data.get("draft_response", "")
        self.assertIn("DRAFT — REQUIRES HUMAN VERIFICATION", draft)
        self.assertIn(MANDATORY_NO_EVIDENCE_RESPONSE, draft)

    def test_corrupt_file_handling(self):
        """Verify that corrupted document files are handled gracefully with FAILED status and error logs."""
        corrupt_path = Path("sample_data/corrupt_dummy.pdf")
        corrupt_path.parent.mkdir(parents=True, exist_ok=True)
        corrupt_path.write_bytes(b"%PDF-1.4 CORRUPTED INVALID BYTESTREAM")

        result = document_processor.process_document(corrupt_path, "corrupt_dummy.pdf")
        self.assertEqual(result.get("status"), "FAILED")
        self.assertIn("error", result)

    def test_all_ai_providers_offline_fallback(self):
        """Verify that if Gemini and OpenModel are unavailable, the system safely uses Deterministic Engine."""
        # Temporarily mock providers unavailable
        original_gemini_avail = ai_service.gemini.is_available
        original_open_avail = ai_service.open_model.is_available
        
        try:
            ai_service.gemini.is_available = lambda: False
            ai_service.open_model.is_available = lambda: False

            res = ai_service.generate_chat_response(
                prompt="What is the coal production?",
                system_prompt="Grounding prompt",
                evidence=[{
                    "document_name": "TestDoc.pdf",
                    "page_number": 1,
                    "section_title": "Production",
                    "source_text": "Total coal production was recorded at 45.2 MT during the quarter.",
                    "relevance_score": 0.95
                }]
            )
            self.assertEqual(res.get("provider"), "deterministic")
            self.assertIn("45.2 MT", res.get("text"))
        finally:
            ai_service.gemini.is_available = original_gemini_avail
            ai_service.open_model.is_available = original_open_avail

    def test_cross_document_conflict_detection_and_variance(self):
        """Verify cross-document validation detects conflicts and calculates correct variance percentages."""
        issues = validation_service.run_cross_document_validation()
        self.assertIsInstance(issues, list)
        for issue in issues:
            self.assertIn("field_name", issue)
            self.assertIn("variance_percentage", issue)
            self.assertIn("doc_a_name", issue)
            self.assertIn("doc_b_name", issue)
            self.assertIn("severity", issue)
            self.assertGreater(issue["variance_percentage"], 0.0)

    def test_missing_report_download_returns_404(self):
        """Verify that requesting a non-existent report file returns HTTP 404 cleanly."""
        from app import create_app
        client = create_app().test_client()
        response = client.get("/api/reports/download/non_existent_report_12345.pdf")
        self.assertEqual(response.status_code, 404)

if __name__ == "__main__":
    unittest.main()


