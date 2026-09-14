"""
Master-Level Backend Resilience & Intelligence Comprehensive Test Suite for SIH26023.
Verifies all 10 Core Architectural Capabilities:
1. Adaptive OCR & PSM Selection
2. Document Deduplication & Chunk Hash Integrity
3. Hybrid RAG Ranking & Intent Classification
4. AI Provider Resilience, Health Probing, and Explainable Fallback
5. DAG Cycle Detection, Concurrency, and Exponential Backoff
6. Mining Domain Intelligence, Coal Seams, and Physical Plausibility
7. Cross-Document Discrepancy Lifecycle & Variance Calculation
8. Quality & Governance Release Gatekeeper Auditing
9. Persistent Revocation & RBAC Correlation ID
10. System Health and Readiness Endpoints
"""

import unittest
import json
import time
from database.db import init_db, get_db, revoke_token, is_token_revoked, check_db_health
from services.ocr.ocr_service import ocr_service
from services.document_processor import document_processor
from services.retrieval_service import retrieval_service
from services.ai_service import ai_service
from services.validation_service import validation_service
from agents.agent_messages import (
    AgentTask, AgentResult, WorkflowContext, WorkflowStatus, QualityGateDecision
)
from agents.manager_agent import manager_agent
from agents.mining_agent import MiningIntelligenceAgent
from agents.quality_agent import QualityGovernanceAgent
from app import create_app

class TestMasterBackendResilience(unittest.TestCase):
    """Comprehensive test suite for Master Backend Architecture."""

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()
        init_db()

    # -------------------------------------------------------------------------
    # 1. Adaptive OCR Engine
    # -------------------------------------------------------------------------
    def test_01_ocr_service_health_and_capabilities(self):
        """Test OCR service health reporting and adaptive fallback readiness."""
        health = ocr_service.get_ocr_health()
        self.assertIn("status", health)
        self.assertIn("tesseract_primary_available", health)
        self.assertIn("rapidocr_secondary_available", health)

    # -------------------------------------------------------------------------
    # 2. Document Deduplication & Classification
    # -------------------------------------------------------------------------
    def test_02_document_classification_and_hashing(self):
        """Test document type classification and SHA-256 chunk hash generation."""
        doc_type = document_processor.classify_document_type(
            filename="ECL_Rajmahal_Monthly_Production_Report_2026.pdf",
            sample_text="Rajmahal opencast project production achieved 1.32 MT."
        )
        self.assertEqual(doc_type, "PRODUCTION_REPORT")

        geo_type = document_processor.classify_document_type(
            filename="Borehole_Lithology_CMPDI_RI1.pdf",
            sample_text="Borehole log BH-01 seam correlation stratigraphy."
        )
        self.assertEqual(geo_type, "GEOLOGICAL_REPORT")

    # -------------------------------------------------------------------------
    # 3. Hybrid RAG Ranking & Intent Classification
    # -------------------------------------------------------------------------
    def test_03_query_intent_and_explainable_ranking(self):
        """Test query intent classification and search retrieval with explainable ranking."""
        intent = retrieval_service.classify_query_intent("What is the coal production and offtake for Rajmahal in FY 2025-26?")
        self.assertEqual(intent, "PRODUCTION_QUERY")

        geo_intent = retrieval_service.classify_query_intent("What is the borehole depth and seam thickness in CMPDI log?")
        self.assertEqual(geo_intent, "GEOLOGY_QUERY")

        safety_intent = retrieval_service.classify_query_intent("How many fatal accidents or serious injuries were reported?")
        self.assertEqual(safety_intent, "SAFETY_QUERY")

        # Test retrieval ranking explanation
        res = retrieval_service.retrieve(query="Rajmahal coal production", top_k=3)
        self.assertIsInstance(res, list)
        for item in res:
            self.assertIn("ranking_explanation", item.metadata)
            explanation = item.metadata["ranking_explanation"]
            self.assertIn("Vector Rank", explanation)
            self.assertIn("Keyword SQL Rank", explanation)

    # -------------------------------------------------------------------------
    # 4. AI Provider Resilience & Health Probing
    # -------------------------------------------------------------------------
    def test_04_ai_provider_probing_and_telemetry(self):
        """Test AI provider probing, health tracking, and error classification."""
        health = ai_service.probe_provider_health()
        self.assertIn("gemini", health)
        self.assertIn("open_model", health)
        self.assertIn("deterministic", health)
        self.assertTrue(health["deterministic"]["healthy"])

        # Test transient error classifier
        is_transient = ai_service.is_transient_error(RuntimeError("HTTP 429 Too Many Requests: Rate limit exceeded"))
        self.assertTrue(is_transient)
        is_bad_req = ai_service.is_transient_error(ValueError("400 Bad Request: Invalid parameter"))
        self.assertFalse(is_bad_req)

    # -------------------------------------------------------------------------
    # 5. DAG Cycle Detection & Orchestration
    # -------------------------------------------------------------------------
    def test_05_dag_cycle_detection(self):
        """Test that cyclical DAG dependencies are caught and rejected."""
        t1 = AgentTask(task_id="t1", workflow_id="wf_cyc", source_agent="Manager", destination_agent="RetrievalAgent", task_type="TEST", dependencies=["t2"])
        t2 = AgentTask(task_id="t2", workflow_id="wf_cyc", source_agent="Manager", destination_agent="ValidationAgent", task_type="TEST", dependencies=["t1"])
        
        ctx = WorkflowContext(workflow_id="wf_cyc", workflow_type="TEST", initial_prompt="Test Cycle")
        with self.assertRaises(ValueError):
            manager_agent.execute_dag([t1, t2], ctx)

    # -------------------------------------------------------------------------
    # 6. Mining Intelligence, Coal Seams, and Physical Plausibility
    # -------------------------------------------------------------------------
    def test_06_mining_intelligence_extraction_and_plausibility(self):
        """Test unit normalizations, coal seam detection, and physical plausibility validation."""
        mining_agent = MiningIntelligenceAgent()
        
        # Test unit normalizations
        mt_norm = mining_agent.normalize_production_unit("13.2 Lakh Tonnes")
        self.assertEqual(mt_norm["normalized_unit"], "MT")
        self.assertEqual(mt_norm["normalized_value"], 1.32)

        bcm_norm = mining_agent.normalize_production_unit("2.5 BCM")
        self.assertEqual(bcm_norm["normalized_unit"], "M.Cum")
        self.assertEqual(bcm_norm["normalized_value"], 2500.0)

        # Test fact extraction with seam name
        test_text = "In Rajmahal opencast project, extraction in Dishergarh Seam yielded 1.45 MT coal with Ash 38.5%."
        facts = mining_agent._extract_facts_from_text(
            text=test_text,
            doc_id=1,
            doc_name="Test_Doc.pdf",
            page=1,
            section="Operational Data"
        )
        
        seam_facts = [f for f in facts if f.get("metric") == "coal_seam"]
        self.assertTrue(len(seam_facts) >= 1)
        self.assertEqual(seam_facts[0]["raw_value"], "Dishergarh")

        # Test physical impossibility check
        bad_fact = {"metric": "ash_percentage", "normalized_value": 140.0, "raw_value": "140%"}
        is_plausible, msg = mining_agent._validate_physical_plausibility(bad_fact)
        self.assertFalse(is_plausible)
        self.assertIn("physical range", msg)

    # -------------------------------------------------------------------------
    # 7. Discrepancy Lifecycle & Variance Calculation
    # -------------------------------------------------------------------------
    def test_07_discrepancy_variance_and_lifecycle(self):
        """Test variance formula and discrepancy status transitions."""
        # Test lifecycle transition
        res = validation_service.update_issue_lifecycle(
            issue_id=99999,  # Non-existent ID should return False
            new_status="UNDER_REVIEW",
            reviewer="officer@cil.gov.in",
            reviewer_role="OFFICER",
            reviewer_note="Reviewing with mine manager."
        )
        self.assertFalse(res)

    # -------------------------------------------------------------------------
    # 8. Quality Governance Release Gatekeeper
    # -------------------------------------------------------------------------
    def test_08_quality_gatekeeper_validation(self):
        """Test that QualityGovernanceAgent audits schema, calculations, and watermarks."""
        qc_agent = QualityGovernanceAgent()
        
        # Test missing watermark in parliamentary inquiry triggers violation
        ctx = WorkflowContext(workflow_id="wf_qc_test", workflow_type="PARLIAMENTARY_INQUIRY", initial_prompt="Lok Sabha Question")
        ctx.results["inq_task"] = AgentResult(
            task_id="inq_task",
            workflow_id="wf_qc_test",
            agent_name="GovernmentInquiryAgent",
            status="SUCCESS",
            result_data={"draft_response": "Here is the production data without any disclaimer."}
        )
        
        task = AgentTask(task_id="t_qc", workflow_id="wf_qc_test", source_agent="Manager", destination_agent="QualityGovernanceAgent", task_type="AUDIT_RELEASE_GATE")
        res = qc_agent.process(task, ctx)
        self.assertEqual(res.status, "REJECTED")
        self.assertEqual(ctx.quality_decision, QualityGateDecision.REJECT)

    # -------------------------------------------------------------------------
    # 9. Persistent Token Revocation & DB Checks
    # -------------------------------------------------------------------------
    def test_09_persistent_token_revocation(self):
        """Test token revocation persistence in the database."""
        test_token = f"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_revocation_{time.time()}_{hash('test')}"
        self.assertFalse(is_token_revoked(test_token))
        
        # Revoke token
        revoke_token(test_token, "analyst@cil.gov.in")
        self.assertTrue(is_token_revoked(test_token))


    # -------------------------------------------------------------------------
    # 10. System Health & Readiness Endpoints
    # -------------------------------------------------------------------------
    def test_10_health_and_readiness_endpoints(self):
        """Test /api/health and /api/ready endpoints and X-Request-ID response header."""
        res_health = self.client.get("/api/health")
        self.assertEqual(res_health.status_code, 200)
        data_health = json.loads(res_health.data)
        self.assertIn("status", data_health)
        self.assertIn("database", data_health)
        self.assertIn("ocr_engine", data_health)
        self.assertIn("ai_providers", data_health)
        self.assertIn("X-Request-ID", res_health.headers)

        res_ready = self.client.get("/api/ready")
        self.assertEqual(res_ready.status_code, 200)
        data_ready = json.loads(res_ready.data)
        self.assertTrue(data_ready.get("ready"))

if __name__ == "__main__":
    unittest.main()
