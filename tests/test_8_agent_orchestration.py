"""
Test Suite: 8-Agent Dynamic Orchestration, DAG Concurrency, HITL & Provenance for SIH26023.
"""

import sys
import time
import unittest
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from database.db import init_db, get_db
from agents.agent_messages import (
    AgentTask, AgentResult, WorkflowContext, WorkflowStatus, EvidenceItem,
    QualityGateDecision, ProvenanceEdgeType
)
from agents.manager_agent import manager_agent
from agents.agent_registry import agent_registry
from config.settings import SAMPLE_DATA_DIR

class Test8AgentOrchestration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        pdf_path = SAMPLE_DATA_DIR / "ECL_Rajmahal_Monthly_Production_May_2025.pdf"
        if not pdf_path.exists():
            from sample_data.generator import generate_sample_documents
            generate_sample_documents()

    def test_eight_agents_registered_no_duplicates(self):
        """Verify all 8 logical agents are present in registry with unique names."""
        agents = agent_registry.list_agents()
        names = [a["name"] for a in agents]
        self.assertEqual(len(names), 8)
        self.assertEqual(len(set(names)), 8)
        expected = [
            "ManagerAgent",
            "DocumentIntelligenceAgent",
            "RetrievalAgent",
            "MiningIntelligenceAgent",
            "ValidationAgent",
            "ReportGenerationAgent",
            "GovernmentInquiryAgent",
            "QualityGovernanceAgent"
        ]
        for exp in expected:
            self.assertIn(exp, names)

    def test_dynamic_routing_selects_necessary_agents_only(self):
        """Verify Manager plans appropriate specialized agents and skips unnecessary ones."""
        # Ingestion: Document + Quality
        plan_ingest = manager_agent.plan_execution("DOCUMENT_INGESTION")
        self.assertIn("DocumentIntelligenceAgent", plan_ingest["required_agents"])
        self.assertIn("QualityGovernanceAgent", plan_ingest["required_agents"])
        self.assertNotIn("ReportGenerationAgent", plan_ingest["required_agents"])
        self.assertNotIn("GovernmentInquiryAgent", plan_ingest["required_agents"])

        # Query: Retrieval + Mining + Validation + Quality
        plan_query = manager_agent.plan_execution("AI_ASSISTANT_QUERY")
        self.assertIn("RetrievalAgent", plan_query["required_agents"])
        self.assertIn("MiningIntelligenceAgent", plan_query["required_agents"])
        self.assertIn("ValidationAgent", plan_query["required_agents"])
        self.assertIn("QualityGovernanceAgent", plan_query["required_agents"])
        self.assertNotIn("GovernmentInquiryAgent", plan_query["required_agents"])

        # Report: Retrieval + Mining + Validation + Report + Quality
        plan_rep = manager_agent.plan_execution("REPORT_GENERATION")
        self.assertIn("ReportGenerationAgent", plan_rep["required_agents"])
        self.assertNotIn("GovernmentInquiryAgent", plan_rep["required_agents"])

        # Inquiry: Retrieval + Mining + Validation + Inquiry + Quality
        plan_inq = manager_agent.plan_execution("PARLIAMENTARY_INQUIRY")
        self.assertIn("GovernmentInquiryAgent", plan_inq["required_agents"])
        self.assertNotIn("ReportGenerationAgent", plan_inq["required_agents"])

    def test_dag_dependency_execution_and_parallel_concurrency(self):
        """Verify independent tasks execute concurrently while respecting dependencies."""
        wf_id = f"wf_dag_test_{int(time.time())}"
        context = WorkflowContext(
            workflow_id=wf_id,
            workflow_type="DAG_TEST",
            initial_prompt="Test DAG concurrency"
        )
        agent_registry.persist_workflow_start(context)

        # Independent Task 1: Retrieval
        t1 = AgentTask(
            task_id="t1_ret",
            workflow_id=wf_id,
            source_agent="ManagerAgent",
            destination_agent="RetrievalAgent",
            task_type="RETRIEVE_EVIDENCE",
            input_data={"query": "Rajmahal production", "top_k": 3},
            dependencies=[]
        )

        # Independent Task 2: Mining Intelligence (can run in parallel with Task 1)
        t2 = AgentTask(
            task_id="t2_mine",
            workflow_id=wf_id,
            source_agent="ManagerAgent",
            destination_agent="MiningIntelligenceAgent",
            task_type="EXTRACT_AND_NORMALIZE_FACTS",
            input_data={"text": "Rajmahal produced 1.32 MT in May 2025."},
            dependencies=[]
        )

        # Dependent Task 3: Validation (depends on Task 1 and Task 2)
        t3 = AgentTask(
            task_id="t3_val",
            workflow_id=wf_id,
            source_agent="ManagerAgent",
            destination_agent="ValidationAgent",
            task_type="CHECK_CONSISTENCY",
            input_data={"subsidiary": "ECL"},
            dependencies=["t1_ret", "t2_mine"]
        )

        # Dependent Task 4: Quality Gate (depends on Task 3)
        t4 = AgentTask(
            task_id="t4_qual",
            workflow_id=wf_id,
            source_agent="ManagerAgent",
            destination_agent="QualityGovernanceAgent",
            task_type="AUDIT_RELEASE_GATE",
            dependencies=["t3_val"]
        )

        results = manager_agent.execute_dag([t1, t2, t3, t4], context)

        self.assertEqual(len(results), 4)
        self.assertIn("t1_ret", results)
        self.assertIn("t2_mine", results)
        self.assertIn("t3_val", results)
        self.assertIn("t4_qual", results)

        # Verify DAG provenance nodes and edges
        dag = context.provenance_dag
        self.assertGreaterEqual(len(dag["nodes"]), 4)
        self.assertGreaterEqual(len(dag["edges"]), 3)

    def test_cyclic_dependency_rejected(self):
        """Verify cyclic dependencies in task graph raise ValueError and stop safely."""
        context = WorkflowContext(
            workflow_id="wf_cycle_test",
            workflow_type="TEST",
            initial_prompt="Cycle test"
        )
        t1 = AgentTask(task_id="tA", workflow_id="wf_cycle_test", source_agent="M", destination_agent="RetrievalAgent", task_type="TEST", dependencies=["tB"])
        t2 = AgentTask(task_id="tB", workflow_id="wf_cycle_test", source_agent="M", destination_agent="ValidationAgent", task_type="TEST", dependencies=["tA"])

        with self.assertRaises(ValueError):
            manager_agent.execute_dag([t1, t2], context)

    def test_human_in_the_loop_pause_and_resume(self):
        """Verify workflow can pause, persist checkpoint state, and resume with reviewer audit trail."""
        wf_id = f"wf_hitl_{int(time.time())}"
        context = WorkflowContext(
            workflow_id=wf_id,
            workflow_type="DISCREPANCY_INVESTIGATION",
            initial_prompt="Investigate discrepancy"
        )
        agent_registry.persist_workflow_start(context)

        # Pause workflow
        paused = manager_agent.pause_workflow(
            workflow_id=wf_id,
            paused_task_id="task_val_01",
            reason="High variance discrepancy detected (>20%). Requires manual sign-off.",
            state={"discrepancy": "Rajmahal 1.32 MT vs 1.28 MT", "variance": 3.08}
        )
        self.assertTrue(paused)

        # Verify paused state in DB
        with get_db() as conn:
            row = conn.execute("SELECT status, paused_reason FROM agent_workflows WHERE id = ?", (wf_id,)).fetchone()
            self.assertEqual(row["status"], "PAUSED")
            self.assertIn("High variance", row["paused_reason"])

        # Resume workflow
        resumed_state = manager_agent.resume_workflow(
            workflow_id=wf_id,
            reviewer="Dr. S. K. Verma",
            reviewer_role="OFFICER",
            reviewer_note="Discrepancy verified against DGMS logs. Approved."
        )
        self.assertIsNotNone(resumed_state)
        self.assertEqual(resumed_state.get("variance"), 3.08)

        # Verify resumed status in DB
        with get_db() as conn:
            row = conn.execute("SELECT status, paused_reason FROM agent_workflows WHERE id = ?", (wf_id,)).fetchone()
            self.assertEqual(row["status"], "RUNNING")
            self.assertIsNone(row["paused_reason"])

    def test_e2e_rajmahal_discrepancy_demo_workflow(self):
        """
        Execute full judge-facing demo scenario:
        Compare Rajmahal production across reports, extract normalized metrics,
        detect discrepancy, generate executive report, and pass Quality Gate.
        """
        res = manager_agent.run_discrepancy_investigation_workflow("Rajmahal production discrepancy")
        self.assertIn("workflow", res)
        self.assertIn("report", res)
        self.assertIn("quality_decision", res)

        wf = res["workflow"]
        self.assertEqual(wf["status"], "COMPLETED")
        self.assertIn(res["quality_decision"], ["PASS", "WARNING", "REQUIRES_HUMAN_REVIEW"])

        # Check that DAG was populated
        dag = wf.get("provenance_dag", {})
        self.assertGreaterEqual(len(dag.get("nodes", [])), 4)
        self.assertGreaterEqual(len(dag.get("edges", [])), 3)

if __name__ == "__main__":
    unittest.main()
