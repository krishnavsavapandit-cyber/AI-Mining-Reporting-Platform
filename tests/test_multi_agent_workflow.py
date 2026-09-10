"""
End-to-End Multi-Agent Workflow Tests for ManagerAgent coordination.
"""

import sys
import unittest
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from database.db import init_db
from agents.manager_agent import manager_agent
from config.settings import SAMPLE_DATA_DIR

class TestMultiAgentWorkflow(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        # Seed test document
        pdf_path = SAMPLE_DATA_DIR / "ECL_Rajmahal_Monthly_Production_May_2025.pdf"
        if not pdf_path.exists():
            from sample_data.generator import generate_sample_documents
            generate_sample_documents()
        manager_agent.run_document_processing_workflow(str(pdf_path), pdf_path.name)

    def test_e2e_query_workflow(self):
        wf_res = manager_agent.run_query_workflow("What was the coal production of Rajmahal in May 2025?")
        self.assertIn("answer", wf_res)
        self.assertGreater(len(wf_res["evidence"]), 0)
        self.assertEqual(wf_res["workflow"]["status"], "COMPLETED")
        self.assertIn("1.32", wf_res["answer"])

    def test_e2e_report_workflow(self):
        wf_res = manager_agent.run_report_generation_workflow(
            report_type="Consolidated Mining Production Report",
            title="ECL Monthly Production Audit",
            subsidiary="ECL",
            reporting_period="May 2025"
        )
        self.assertEqual(wf_res["workflow"]["status"], "COMPLETED")
        self.assertIn("report_id", wf_res["report"])

    def test_e2e_inquiry_workflow(self):
        wf_res = manager_agent.run_inquiry_workflow(
            question_text="Provide details of coal production achieved in ECL Rajmahal during May 2025.",
            inquiry_ref="LS-TEST-999"
        )
        self.assertEqual(wf_res["workflow"]["status"], "COMPLETED")
        self.assertIn("DRAFT — REQUIRES HUMAN VERIFICATION", wf_res["inquiry"]["draft_response"])

if __name__ == "__main__":
    unittest.main()
