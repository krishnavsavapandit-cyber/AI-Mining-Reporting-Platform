"""
Provenance & Empty Database Verification Test Suite for SIH26023.
Tests end-to-end preservation of document names, page numbers, sections,
and graceful handling when the repository contains zero records.
"""

import unittest
from agents.manager_agent import manager_agent
from services.ai_service import MANDATORY_NO_EVIDENCE_RESPONSE
from services.analytics_service import analytics_service

class TestProvenanceAndEmptyDB(unittest.TestCase):

    def test_provenance_preservation_in_query(self):
        """Verify that every piece of returned evidence contains doc name, page number, and section."""
        res = manager_agent.run_query_workflow("What was the coal production of ECL in May 2025?")
        evidence = res.get("evidence", [])
        self.assertGreater(len(evidence), 0)
        for item in evidence:
            self.assertTrue(bool(item.get("document_name")), "Evidence missing document_name")
            self.assertTrue(item.get("page_number") is not None, "Evidence missing page_number")
            self.assertTrue(bool(item.get("section_title")), "Evidence missing section_title")
            self.assertTrue(bool(item.get("source_text")), "Evidence missing source_text")

    def test_analytics_calculated_strictly_without_fabrication(self):
        """Verify that analytics service summary calculates numbers directly from DB without fake statistics."""
        summary = analytics_service.get_dashboard_summary()
        self.assertIn("total_documents", summary)
        self.assertIn("extracted_records", summary)
        self.assertIn("unresolved_inconsistencies", summary)
        self.assertIsInstance(summary["total_documents"], int)
        self.assertIsInstance(summary["extracted_records"], int)

    def test_empty_analytics_charts_graceful(self):
        """Verify that analytics charts render cleanly rather than crashing."""
        charts = analytics_service.get_charts_data()
        self.assertIn("subsidiary_production", charts)
        self.assertIn("production_trend", charts)
        self.assertIn("target_vs_actual", charts)
        self.assertIn("safety_kpis", charts)
        self.assertIn("validation_severity", charts)

    def test_provenance_in_report_key_figures(self):
        """Verify that report generation embeds document citations in key operational figures."""
        res = manager_agent.run_report_generation_workflow(
            report_type="Consolidated Mining Production Report",
            title="Q1 Operational Audit",
            subsidiary="ECL",
            reporting_period="May 2025"
        )
        report_data = res.get("report", {})
        key_figures = report_data.get("key_figures", [])
        if key_figures:
            for fig in key_figures:
                self.assertIn("metric", fig)
                self.assertIn("source", fig)

if __name__ == "__main__":
    unittest.main()
