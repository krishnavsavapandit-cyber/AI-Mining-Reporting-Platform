"""
Unit tests for all 8 specialized agents in the SIH26023 Multi-Agent architecture.
"""

import sys
import unittest
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from database.db import init_db
from agents.agent_messages import AgentTask, WorkflowContext, EvidenceItem, QualityGateDecision
from agents.document_agent import DocumentIntelligenceAgent
from agents.retrieval_agent import RetrievalAgent
from agents.mining_agent import MiningIntelligenceAgent
from agents.validation_agent import ValidationAgent
from agents.report_agent import ReportGenerationAgent
from agents.inquiry_agent import GovernmentInquiryAgent
from agents.quality_agent import QualityGovernanceAgent
from agents.manager_agent import ManagerAgent
from agents.agent_registry import agent_registry
from config.settings import SAMPLE_DATA_DIR

class TestAgents(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        # Ensure sample docs exist
        pdf_path = SAMPLE_DATA_DIR / "ECL_Rajmahal_Monthly_Production_May_2025.pdf"
        if not pdf_path.exists():
            from sample_data.generator import generate_sample_documents
            generate_sample_documents()

    def test_all_8_agents_registered(self):
        """Verify that exactly 8 logical agents are registered without duplicates."""
        mgr = ManagerAgent()
        agents = agent_registry.list_agents()
        agent_names = [a["name"] for a in agents]
        
        expected_8 = [
            "ManagerAgent",
            "DocumentIntelligenceAgent",
            "RetrievalAgent",
            "MiningIntelligenceAgent",
            "ValidationAgent",
            "ReportGenerationAgent",
            "GovernmentInquiryAgent",
            "QualityGovernanceAgent"
        ]
        for name in expected_8:
            self.assertIn(name, agent_names, f"Agent {name} missing from registry.")
        self.assertEqual(len(set(agent_names)), 8, "Expected exactly 8 registered agents.")

    def test_document_agent_execution(self):
        agent = DocumentIntelligenceAgent()
        pdf_path = SAMPLE_DATA_DIR / "ECL_Rajmahal_Monthly_Production_May_2025.pdf"
        
        task = AgentTask(
            task_id="test_doc_01",
            workflow_id="wf_test_01",
            source_agent="ManagerAgent",
            destination_agent="DocumentIntelligenceAgent",
            task_type="PROCESS_DOCUMENT",
            input_data={"file_path": str(pdf_path), "original_filename": pdf_path.name}
        )
        context = WorkflowContext(workflow_id="wf_test_01", workflow_type="TEST", initial_prompt="test")
        
        res = agent.process(task, context)
        self.assertEqual(res.status, "SUCCESS")
        self.assertGreater(len(res.evidence), 0)
        self.assertEqual(res.result_data["subsidiary"], "ECL")

    def test_retrieval_agent_execution(self):
        agent = RetrievalAgent()
        task = AgentTask(
            task_id="test_ret_01",
            workflow_id="wf_test_02",
            source_agent="ManagerAgent",
            destination_agent="RetrievalAgent",
            task_type="RETRIEVE_EVIDENCE",
            input_data={"query": "Rajmahal May 2025 Coal Production", "top_k": 5}
        )
        context = WorkflowContext(workflow_id="wf_test_02", workflow_type="TEST", initial_prompt="test")
        
        res = agent.process(task, context)
        self.assertEqual(res.status, "SUCCESS")
        self.assertGreater(len(res.evidence), 0)

    def test_mining_intelligence_agent_execution(self):
        """Test Agent 4 (MiningIntelligenceAgent) domain entity extraction and unit normalization."""
        agent = MiningIntelligenceAgent()
        raw_text = (
            "In May 2025, Rajmahal opencast project produced 1.32 MT of raw coal against target of 1.40 MT. "
            "Overburden removal achieved was 2.64 M.Cum with a stripping ratio of 2.0:1. "
            "Coal grade evaluated as Grade G11 with Ash content 32.5% and Moisture 8.0%. "
            "Zero fatal accidents and 1 serious injury reported."
        )
        task = AgentTask(
            task_id="test_mine_01",
            workflow_id="wf_test_03",
            source_agent="ManagerAgent",
            destination_agent="MiningIntelligenceAgent",
            task_type="EXTRACT_AND_NORMALIZE_FACTS",
            input_data={"text": raw_text, "mine": "Rajmahal", "subsidiary": "ECL", "reporting_period": "May 2025"}
        )
        context = WorkflowContext(workflow_id="wf_test_03", workflow_type="TEST", initial_prompt="test")

        res = agent.process(task, context)
        self.assertEqual(res.status, "SUCCESS")
        facts = res.result_data.get("facts", [])
        self.assertGreaterEqual(len(facts), 3)

        # Check production fact
        prod_fact = next((f for f in facts if f["metric"] == "production"), None)
        self.assertIsNotNone(prod_fact)
        self.assertEqual(prod_fact["numeric_value"], 1.32)
        self.assertEqual(prod_fact["normalized_unit"], "MT")

        # Check unit normalizer
        norm_lt = agent.normalize_production_unit("13.2 Lakh Tonnes")
        self.assertEqual(norm_lt["normalized_value"], 1.32)
        self.assertEqual(norm_lt["normalized_unit"], "MT")

    def test_validation_agent_execution(self):
        agent = ValidationAgent()
        task = AgentTask(
            task_id="test_val_01",
            workflow_id="wf_test_04",
            source_agent="ManagerAgent",
            destination_agent="ValidationAgent",
            task_type="CHECK_CONSISTENCY",
            input_data={"subsidiary": "ECL"}
        )
        context = WorkflowContext(workflow_id="wf_test_04", workflow_type="TEST", initial_prompt="test")
        
        res = agent.process(task, context)
        self.assertIn(res.status, ["SUCCESS", "REQUIRES_HUMAN_REVIEW"])

    def test_report_agent_execution(self):
        agent = ReportGenerationAgent()
        task = AgentTask(
            task_id="test_rep_01",
            workflow_id="wf_test_05",
            source_agent="ManagerAgent",
            destination_agent="ReportGenerationAgent",
            task_type="GENERATE_REPORT",
            input_data={"report_type": "Consolidated Mining Production Report", "title": "Test Production Report"}
        )
        context = WorkflowContext(workflow_id="wf_test_05", workflow_type="TEST", initial_prompt="test")
        context.accumulated_evidence.append(EvidenceItem(
            document_id=1,
            document_name="ECL_Rajmahal_Monthly_Production_May_2025.pdf",
            page_number=1,
            section_title="Summary",
            source_text="Rajmahal achieved Coal Production of 1.32 Million Tonnes in May 2025."
        ))

        res = agent.process(task, context)
        self.assertEqual(res.status, "SUCCESS")
        self.assertIn("report_id", res.result_data)

    def test_inquiry_agent_execution(self):
        agent = GovernmentInquiryAgent()
        task = AgentTask(
            task_id="test_inq_01",
            workflow_id="wf_test_06",
            source_agent="ManagerAgent",
            destination_agent="GovernmentInquiryAgent",
            task_type="DRAFT_INQUIRY_RESPONSE",
            input_data={"question_text": "What was the coal production in Rajmahal during May 2025?"}
        )
        context = WorkflowContext(workflow_id="wf_test_06", workflow_type="TEST", initial_prompt="test")
        context.accumulated_evidence.append(EvidenceItem(
            document_id=1,
            document_name="ECL_Rajmahal_Monthly_Production_May_2025.pdf",
            page_number=1,
            section_title="Summary",
            source_text="Rajmahal achieved Coal Production of 1.32 Million Tonnes in May 2025."
        ))

        res = agent.process(task, context)
        self.assertEqual(res.status, "SUCCESS")
        self.assertIn("DRAFT — REQUIRES HUMAN VERIFICATION", res.result_data["draft_response"])

    def test_quality_governance_agent_execution(self):
        """Test Agent 8 (QualityGovernanceAgent) release gate decision making."""
        agent = QualityGovernanceAgent()
        task = AgentTask(
            task_id="test_qual_01",
            workflow_id="wf_test_07",
            source_agent="ManagerAgent",
            destination_agent="QualityGovernanceAgent",
            task_type="AUDIT_RELEASE_GATE"
        )
        context = WorkflowContext(
            workflow_id="wf_test_07",
            workflow_type="AI_ASSISTANT_QUERY",
            initial_prompt="Test query"
        )
        context.accumulated_evidence.append(EvidenceItem(
            document_id=1,
            document_name="ECL_Rajmahal_Monthly_Production_May_2025.pdf",
            page_number=1,
            section_title="Summary",
            source_text="Rajmahal achieved 1.32 MT."
        ))
        # Add valid result to context
        context.results["test_task"] = agent.process(task, context)

        res = agent.process(task, context)
        self.assertIn(res.status, ["SUCCESS", "WARNING", "REQUIRES_HUMAN_REVIEW"])
        self.assertIn("decision", res.result_data)

if __name__ == "__main__":
    unittest.main()
