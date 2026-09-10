"""
Unit tests for cross-document consistency checking and numerical discrepancy detection.
"""

import sys
import unittest
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from database.db import init_db
from agents.manager_agent import manager_agent
from services.validation_service import validation_service
from config.settings import SAMPLE_DATA_DIR

class TestValidationEngine(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        # Ingest both Doc A (1.32 MT) and Doc B (1.28 MT)
        doc_a = SAMPLE_DATA_DIR / "ECL_Rajmahal_Monthly_Production_May_2025.pdf"
        doc_b = SAMPLE_DATA_DIR / "ECL_Annual_Production_Summary_Discrepancy_Check_2025.pdf"

        if not doc_a.exists() or not doc_b.exists():
            from sample_data.generator import generate_sample_documents
            generate_sample_documents()

        manager_agent.run_document_processing_workflow(str(doc_a), doc_a.name)
        manager_agent.run_document_processing_workflow(str(doc_b), doc_b.name)

    def test_discrepancy_detection(self):
        issues = validation_service.run_cross_document_validation()
        self.assertGreater(len(issues), 0)

        # Check for ECL May 2025 production conflict
        prod_issues = [i for i in issues if i["field_name"] == "Coal Production" and i["subsidiary"] == "ECL"]
        self.assertGreater(len(prod_issues), 0)
        
        issue = prod_issues[0]
        self.assertGreater(issue["variance_percentage"], 0.0)
        self.assertIn(issue["severity"], ["LOW", "MEDIUM", "HIGH"])
        self.assertEqual(issue["status"], "UNRESOLVED")

if __name__ == "__main__":
    unittest.main()
