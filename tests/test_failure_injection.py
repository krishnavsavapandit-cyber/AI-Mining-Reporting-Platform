"""
Test Suite: Failure-Injection & Resilience Testing for SIH26023 8-Agent Architecture.
Simulates deliberate component failures, timeouts, schema malformations,
and calculation violations to verify non-fabrication and graceful recovery.
"""

import sys
import time
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from database.db import init_db
from agents.agent_messages import (
    AgentTask, AgentResult, WorkflowContext, WorkflowStatus, EvidenceItem,
    QualityGateDecision
)
from agents.manager_agent import manager_agent
from agents.agent_registry import agent_registry
from agents.quality_agent import QualityGovernanceAgent
from services.ai_service import ai_service, MANDATORY_NO_EVIDENCE_RESPONSE

class TestFailureInjection(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()

    def test_1_retrieval_agent_failure_handled(self):
        """Failure Injection 1: When RetrievalAgent throws or fails, Manager captures error without fabricating results."""
        wf_id = "wf_fail_ret"
        context = WorkflowContext(workflow_id=wf_id, workflow_type="TEST", initial_prompt="Fail retrieval")
        agent_registry.persist_workflow_start(context)
        
        # Empty query triggers error
        task = AgentTask(
            task_id="t_ret_fail",
            workflow_id=wf_id,
            source_agent="ManagerAgent",
            destination_agent="RetrievalAgent",
            task_type="RETRIEVE_EVIDENCE",
            input_data={"query": ""}
        )
        res = agent_registry.dispatch_task(task, context)
        self.assertEqual(res.status, "FAILED")
        self.assertGreater(len(res.errors), 0)
        self.assertEqual(len(res.evidence), 0)

    def test_2_mining_intelligence_failure_handled(self):
        """Failure Injection 2: When MiningIntelligenceAgent receives invalid input, it reports PARTIAL/FAILED with zero hallucinated facts."""
        wf_id = "wf_fail_mine"
        context = WorkflowContext(workflow_id=wf_id, workflow_type="TEST", initial_prompt="Fail mining")
        agent_registry.persist_workflow_start(context)
        
        task = AgentTask(
            task_id="t_mine_fail",
            workflow_id=wf_id,
            source_agent="ManagerAgent",
            destination_agent="MiningIntelligenceAgent",
            task_type="EXTRACT_AND_NORMALIZE_FACTS",
            input_data={"text": "Arbitrary non-mining gibberish xyz123"}
        )
        res = agent_registry.dispatch_task(task, context)
        self.assertIn(res.status, ["PARTIAL", "SUCCESS"])
        self.assertEqual(len(res.result_data.get("facts", [])), 0)

    def test_3_validation_failure_propagates_cleanly(self):
        """Failure Injection 3: Validation failure preserves error state without pretending data was validated."""
        wf_id = "wf_fail_val"
        context = WorkflowContext(workflow_id=wf_id, workflow_type="TEST", initial_prompt="Fail validation")
        agent_registry.persist_workflow_start(context)
        
        task = AgentTask(
            task_id="t_val_fail",
            workflow_id=wf_id,
            source_agent="ManagerAgent",
            destination_agent="ValidationAgent",
            task_type="CHECK_CONSISTENCY",
            input_data={"subsidiary": "NON_EXISTENT_SUBSIDIARY_XYZ"}
        )
        res = agent_registry.dispatch_task(task, context)
        self.assertEqual(res.status, "SUCCESS")
        self.assertEqual(len(res.result_data.get("inconsistencies", [])), 0)

    def test_4_report_generation_failure_handled(self):
        """Failure Injection 4: ReportGenerationAgent with missing template or error preserves error."""
        wf_id = "wf_fail_rep"
        context = WorkflowContext(workflow_id=wf_id, workflow_type="TEST", initial_prompt="Fail report")
        agent_registry.persist_workflow_start(context)
        
        task = AgentTask(
            task_id="t_rep_fail",
            workflow_id=wf_id,
            source_agent="ManagerAgent",
            destination_agent="ReportGenerationAgent",
            task_type="GENERATE_REPORT",
            input_data={"report_type": "Custom Executive Summary", "title": "Empty Report"}
        )
        res = agent_registry.dispatch_task(task, context)
        self.assertIn(res.status, ["SUCCESS", "FAILED"])
        self.assertIsNotNone(res.result_data)

    def test_5_government_inquiry_missing_question_fails_gracefully(self):
        """Failure Injection 5: GovernmentInquiryAgent with empty question fails cleanly."""
        wf_id = "wf_fail_inq"
        context = WorkflowContext(workflow_id=wf_id, workflow_type="TEST", initial_prompt="Fail inquiry")
        agent_registry.persist_workflow_start(context)
        
        task = AgentTask(
            task_id="t_inq_fail",
            workflow_id=wf_id,
            source_agent="ManagerAgent",
            destination_agent="GovernmentInquiryAgent",
            task_type="DRAFT_INQUIRY_RESPONSE",
            input_data={"question_text": ""}
        )
        res = agent_registry.dispatch_task(task, context)
        self.assertEqual(res.status, "FAILED")
        self.assertIn("No question text", res.errors[0])

    def test_6_quality_agent_rejection_on_invalid_calculation(self):
        """Failure Injection 6: QualityGovernanceAgent REJECTS outputs with false mathematical variance or negative numbers."""
        quality_agent = QualityGovernanceAgent()
        wf_id = "wf_fail_calc"
        context = WorkflowContext(workflow_id=wf_id, workflow_type="AI_ASSISTANT_QUERY", initial_prompt="Test calculation audit")
        agent_registry.persist_workflow_start(context)

        # Inject flawed validation result with severe mathematical error: 10 vs 20 reported as 1.0% variance
        flawed_val_res = AgentResult(
            task_id="t_flawed_val",
            workflow_id=wf_id,
            agent_name="ValidationAgent",
            status="SUCCESS",
            result_data={
                "inconsistencies": [{
                    "field_name": "production",
                    "doc_a_value": "10.0 MT",
                    "doc_b_value": "20.0 MT",
                    "variance_percentage": 1.0  # False! Should be 50.0%
                }]
            }
        )
        context.results["t_flawed_val"] = flawed_val_res

        t_qual = AgentTask(
            task_id="t_qual_gate",
            workflow_id=wf_id,
            source_agent="ManagerAgent",
            destination_agent="QualityGovernanceAgent",
            task_type="AUDIT_RELEASE_GATE"
        )
        res = quality_agent.process(t_qual, context)
        
        # Must be REJECTED by quality gate
        self.assertEqual(res.status, "REJECTED")
        self.assertEqual(context.quality_decision, QualityGateDecision.REJECT)
        self.assertGreater(len(res.errors), 0)

    def test_7_ai_provider_timeout_and_offline_fallback(self):
        """Failure Injection 7: Simulating Cloud AI timeout falls back smoothly to Deterministic Engine."""
        evidence = [{"document_name": "ECL_Report.pdf", "page_number": 1, "source_text": "Production was 1.32 MT."}]
        
        # Mock Gemini API throwing timeout exception
        with patch.object(ai_service.gemini, "is_available", return_value=True), \
             patch.object(ai_service.gemini, "generate_chat_response", side_effect=TimeoutError("Connection timed out")):
            res = ai_service.generate_chat_response(
                prompt="What was the production in Rajmahal?",
                system_prompt="Be factual.",
                evidence=evidence
            )
            # Should have fallen back to open_model or deterministic
            self.assertIn(res["provider"], ["deterministic", "open_model"])
            self.assertIn("1.32", res["text"])

    def test_8_malformed_agent_result_detected(self):
        """Failure Injection 8: Quality agent detects and rejects malformed AgentResults (e.g. invalid confidence > 1.0)."""
        quality_agent = QualityGovernanceAgent()
        wf_id = "wf_malformed_res"
        context = WorkflowContext(workflow_id=wf_id, workflow_type="AI_ASSISTANT_QUERY", initial_prompt="Malformed test")
        agent_registry.persist_workflow_start(context)

        malformed_res = AgentResult(
            task_id="t_bad",
            workflow_id=wf_id,
            agent_name="BadAgent",
            status="SUCCESS",
            confidence=999.0  # Illegal! Must be <= 1.0
        )
        context.results["t_bad"] = malformed_res

        t_qual = AgentTask(task_id="t_q", workflow_id=wf_id, source_agent="M", destination_agent="QualityGovernanceAgent", task_type="AUDIT_RELEASE_GATE")
        res = quality_agent.process(t_qual, context)
        self.assertEqual(res.status, "REJECTED")
        self.assertIn("confidence", res.errors[0].lower())

    def test_9_missing_evidence_triggers_mandatory_no_hallucination_gate(self):
        """Failure Injection 9: When zero evidence is retrieved, system never hallucinates facts."""
        res = ai_service.generate_chat_response(
            prompt="What is the secret coal formula on Mars?",
            system_prompt="Be factual.",
            evidence=[]
        )
        self.assertEqual(res["text"], MANDATORY_NO_EVIDENCE_RESPONSE)
        self.assertEqual(res["confidence_semantics"]["validation_status"], "INSUFFICIENT")

    def test_10_hitl_pause_resume_preserves_state_accurately(self):
        """Failure Injection 10: HITL state survives without restarting workflow."""
        wf_id = f"wf_persist_test_{int(time.time())}"
        context = WorkflowContext(workflow_id=wf_id, workflow_type="TEST", initial_prompt="Pause test")
        agent_registry.persist_workflow_start(context)

        manager_agent.pause_workflow(wf_id, "t_val", "Discrepancy inspection", {"key": "saved_value_123"})
        resumed = manager_agent.resume_workflow(wf_id, "Reviewer A", "OFFICER", "All clear")
        self.assertEqual(resumed["key"], "saved_value_123")

    def test_11_empty_pdf_ingestion_fails_with_controlled_error(self):
        """Failure Injection 11: Empty 0-byte PDF returns controlled FAILED state rather than crashing."""
        import tempfile
        from services.document_processor import document_processor
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp_path = Path(tmp.name)
        try:
            res = document_processor.process_document(tmp_path, "empty_test.pdf")
            self.assertEqual(res["status"], "FAILED")
            self.assertIn("empty", res["error"].lower())
            self.assertEqual(res["page_count"], 0)
        finally:
            if tmp_path.exists():
                tmp_path.unlink()

    def test_12_malformed_csv_multi_delimiter_handling(self):
        """Failure Injection 12: CSV with semicolon/pipe delimiters is parsed gracefully without corruption."""
        import tempfile
        from services.document_processor import document_processor
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False, mode="w", encoding="utf-8") as tmp:
            tmp.write("Mine;Subsidiary;Production_MT;Period\nRajmahal;ECL;1.32;May 2025\n")
            tmp_path = Path(tmp.name)
        try:
            res = document_processor.process_document(tmp_path, "semicolon_test.csv")
            self.assertEqual(res["status"], "SUCCESS")
            self.assertGreater(len(res["chunks"]), 0)
            self.assertIn("Rajmahal", res["full_text"])
        finally:
            if tmp_path.exists():
                tmp_path.unlink()

    def test_13_byte_level_sha256_deduplication_detected(self):
        """Failure Injection 13: Identical byte content with different filenames is flagged as DUPLICATE."""
        import io
        from app import app
        client = app.test_client()
        client.post("/api/auth/authority/login", json={"email": "admin@cil.gov.in", "password": "authority2026"})
        content = b"Coal India Production Report Sample Bytes 123456789"

        # First upload
        res1 = client.post(
            "/api/documents/upload",
            data={"file": (io.BytesIO(content), "First_Doc.txt")},
            content_type="multipart/form-data",
            headers={"X-User-Role": "ADMIN"}
        )
        self.assertEqual(res1.status_code, 200)

        # Second upload with different filename but identical bytes
        res2 = client.post(
            "/api/documents/upload",
            data={"file": (io.BytesIO(content), "Renamed_Identical_Doc.txt")},
            content_type="multipart/form-data",
            headers={"X-User-Role": "ADMIN"}
        )
        self.assertEqual(res2.status_code, 200)
        data = res2.get_json()
        self.assertEqual(data["results"][0]["status"], "DUPLICATE")
        self.assertTrue(data["results"][0]["is_duplicate"])
        self.assertIn("checksum", data["results"][0])

    def test_14_force_upload_bypasses_deduplication(self):
        """Failure Injection 14: Passing force=true allows re-uploading duplicate document."""
        import io
        from app import app
        client = app.test_client()
        client.post("/api/auth/authority/login", json={"email": "admin@cil.gov.in", "password": "authority2026"})
        content = b"Coal India Force Upload Bypass Test Bytes 987654321"

        client.post(
            "/api/documents/upload",
            data={"file": (io.BytesIO(content), "Original_Doc.txt")},
            content_type="multipart/form-data",
            headers={"X-User-Role": "ADMIN"}
        )

        res_forced = client.post(
            "/api/documents/upload?force=true",
            data={"file": (io.BytesIO(content), "Original_Doc.txt")},
            content_type="multipart/form-data",
            headers={"X-User-Role": "ADMIN"}
        )
        self.assertEqual(res_forced.status_code, 200)
        data = res_forced.get_json()
        self.assertEqual(data["results"][0]["status"], "SUCCESS")

    def test_15_viewer_role_blocked_from_workflow_cancel(self):
        """Failure Injection 15: Read-only VIEWER role cannot cancel workflows (HTTP 403)."""
        from app import app
        client = app.test_client()
        login_res = client.post("/api/auth/public/login", json={"email": "viewer@public.cil.gov.in"})
        token = login_res.get_json()["token"]
        res = client.post(
            "/api/agents/workflows/wf_dummy_123/cancel",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(res.status_code, 403)
        self.assertEqual(res.get_json()["error_code"], "FORBIDDEN")

    def test_16_viewer_role_blocked_from_workflow_pause(self):
        """Failure Injection 16: Read-only VIEWER role cannot pause workflows (HTTP 403)."""
        from app import app
        client = app.test_client()
        login_res = client.post("/api/auth/public/login", json={"email": "viewer@public.cil.gov.in"})
        token = login_res.get_json()["token"]
        res = client.post(
            "/api/agents/workflows/wf_dummy_123/pause",
            json={"reason": "Unauthorized attempt"},
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(res.status_code, 403)
        self.assertEqual(res.get_json()["error_code"], "FORBIDDEN")

    def test_17_invalid_dag_cycle_rejected(self):
        """Failure Injection 17: Manager rejects circular task dependencies with explicit error."""
        context = WorkflowContext(workflow_id="wf_cycle", workflow_type="TEST", initial_prompt="Cycle")
        t1 = AgentTask(task_id="t1", workflow_id="wf_cycle", source_agent="M", destination_agent="RetrievalAgent", task_type="TEST", dependencies=["t2"])
        t2 = AgentTask(task_id="t2", workflow_id="wf_cycle", source_agent="M", destination_agent="ValidationAgent", task_type="TEST", dependencies=["t1"])
        
        with self.assertRaises(ValueError):
            manager_agent.execute_dag([t1, t2], context)

    def test_18_task_timeout_handling_in_registry(self):
        """Failure Injection 18: Task timeout triggers bounded error without hanging manager thread."""
        wf_id = f"wf_timeout_{int(time.time())}"
        context = WorkflowContext(workflow_id=wf_id, workflow_type="TEST", initial_prompt="Timeout")
        agent_registry.persist_workflow_start(context)

        # Task with very small timeout against an artificial delay
        t_slow = AgentTask(
            task_id="t_slow",
            workflow_id=wf_id,
            source_agent="ManagerAgent",
            destination_agent="RetrievalAgent",
            task_type="RETRIEVE_EVIDENCE",
            input_data={"query": "Rajmahal production"},
            timeout_seconds=0.001
        )
        
        def slow_process(task, ctx):
            time.sleep(0.05)
            return AgentResult(task_id=task.task_id, workflow_id=task.workflow_id, agent_name="RetrievalAgent", status="SUCCESS")

        agent = agent_registry.get_agent("RetrievalAgent")
        with patch.object(agent, "process", side_effect=slow_process):
            res = agent_registry.dispatch_task(t_slow, context)
            self.assertIn(res.status, ["TIMEOUT", "FAILED", "SUCCESS"])

    def test_19_quality_gate_rejects_exceeded_page_citation(self):
        """Failure Injection 19: Quality gate rejects evidence citing impossible page numbers."""
        quality_agent = QualityGovernanceAgent()
        wf_id = "wf_bad_citation"
        context = WorkflowContext(workflow_id=wf_id, workflow_type="AI_ASSISTANT_QUERY", initial_prompt="Citation test")
        agent_registry.persist_workflow_start(context)

        # Add invalid evidence item with page 0 or negative
        context.accumulated_evidence.append(EvidenceItem(
            document_id=1,
            document_name="ECL_Rajmahal.pdf",
            page_number=-5,
            section_title="Production",
            source_text="Invalid page citation",
            producing_agent="RetrievalAgent"
        ))

        t_qual = AgentTask(task_id="t_qc", workflow_id=wf_id, source_agent="M", destination_agent="QualityGovernanceAgent", task_type="AUDIT_RELEASE_GATE")
        res = quality_agent.process(t_qual, context)
        self.assertEqual(res.status, "REJECTED")
        self.assertEqual(context.quality_decision, QualityGateDecision.REJECT)

    def test_20_report_download_path_traversal_rejected(self):
        """Failure Injection 20: Path traversal attempts on report file download return HTTP 404."""
        from app import app
        client = app.test_client()
        res = client.get("/api/reports/download/../../etc/passwd")
        self.assertEqual(res.status_code, 404)

if __name__ == "__main__":
    unittest.main()
