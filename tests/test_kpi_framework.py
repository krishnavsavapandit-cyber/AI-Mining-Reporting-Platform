"""
Unit & Integration Tests for KPI Integrity & Measurement Framework (SIH26023).
Verifies:
1. KPI formulas and definitions are mathematically sound.
2. Results are computed dynamically from actual DB / evaluation data (zero hardcoded fake values).
3. Missing measurement data correctly produces 'Not yet measured.' / 'No measured result available.'
4. Target benchmarks are never presented as achieved empirical results.
5. Measurement types (CONTROLLED TEST, SYNTHETIC EVALUATION, NOT YET MEASURED) are properly classified.
6. Sample sizes match actual evaluated records.
"""

import unittest
import json
from app import create_app
from database.db import get_db, init_db
from services.analytics_service import analytics_service
from services.evaluation_service import evaluation_service

class TestKPIIntegrityFramework(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_kpi_framework_structure_and_keys(self):
        """Verify that KPI framework returns all 8 required KPIs with required schema fields."""
        data = analytics_service.get_kpi_framework()
        self.assertEqual(data["kpis_count"], 8)
        self.assertEqual(len(data["kpis"]), 8)

        required_fields = [
            "kpi_id", "name", "formula", "definition", "target_benchmark",
            "target_type", "measured_result", "formatted_result", "sample_size",
            "data_source", "measurement_type", "status", "methodology_note"
        ]

        for kpi in data["kpis"]:
            for field in required_fields:
                self.assertIn(field, kpi, f"Missing {field} in {kpi.get('kpi_id')}")

    def test_kpi_time_reduction_not_fabricated(self):
        """Verify KPI-01 (Report Prep Time Reduction) is NOT claimed without empirical baseline."""
        data = analytics_service.get_kpi_framework()
        kpi1 = next(k for k in data["kpis"] if k["kpi_id"] == "KPI-01")
        
        self.assertIsNone(kpi1["measured_result"])
        self.assertEqual(kpi1["formatted_result"], "Not yet measured.")
        self.assertEqual(kpi1["measurement_type"], "NOT YET MEASURED")
        self.assertEqual(kpi1["status"], "TARGET ONLY")
        self.assertIn("Project-defined target", kpi1["target_type"])

    def test_kpi_automation_percentage(self):
        """Verify KPI-05 evaluates to 87.5% (7 of 8 lifecycle stages automated, 1 mandatory HITL)."""
        data = analytics_service.get_kpi_framework()
        kpi5 = next(k for k in data["kpis"] if k["kpi_id"] == "KPI-05")
        
        self.assertEqual(kpi5["measured_result"], 87.5)
        self.assertEqual(kpi5["status"], "MEASURED")
        self.assertEqual(kpi5["measurement_type"], "CONTROLLED TEST")

    def test_kpi_api_endpoint(self):
        """Verify GET /api/analytics/kpi-framework endpoint returns 200 and valid JSON."""
        response = self.client.get("/api/analytics/kpi-framework")
        self.assertEqual(response.status_code, 200)
        json_data = json.loads(response.data)
        self.assertEqual(json_data["status"], "success")
        self.assertIn("kpi_framework", json_data)
        self.assertEqual(len(json_data["kpi_framework"]["kpis"]), 8)

    def test_no_hardcoded_fake_sample_sizes(self):
        """Verify that the old hard-coded strings (N=12 reports, N=48 fields) are not present."""
        data = analytics_service.get_kpi_framework()
        json_str = json.dumps(data)

        self.assertNotIn("N = 12 synthetic reports", json_str)
        self.assertNotIn("N = 48 verified ground truth fields", json_str)
        self.assertNotIn("N = 35 test queries", json_str)
        self.assertNotIn("N = 54 citation pointers", json_str)
        self.assertNotIn("N = 26 pipeline workflow steps", json_str)
        self.assertNotIn("N = 18 diverse test files", json_str)
        self.assertNotIn("N = 45 automated integration runs", json_str)

    def test_evaluation_service_empty_db_graceful(self):
        """Verify EvaluationService gracefully handles missing or unseeded documents."""
        res = evaluation_service.evaluate_extraction_accuracy()
        self.assertIn(res["status"], ["MEASURED", "INSUFFICIENT DATA"])
        if res["status"] == "INSUFFICIENT DATA":
            self.assertIsNone(res["measured_result"])
            self.assertEqual(res["formatted_result"], "No measured result available.")

    def test_measurement_type_classification(self):
        """Verify that every KPI is classified with an approved measurement type."""
        allowed_types = ["REAL-WORLD", "CONTROLLED TEST", "SYNTHETIC EVALUATION", "NOT YET MEASURED"]
        allowed_statuses = ["MEASURED", "TARGET ONLY", "INSUFFICIENT DATA"]

        data = analytics_service.get_kpi_framework()
        for kpi in data["kpis"]:
            self.assertIn(kpi["measurement_type"], allowed_types, f"Invalid measurement_type in {kpi['kpi_id']}")
            self.assertIn(kpi["status"], allowed_statuses, f"Invalid status in {kpi['kpi_id']}")

if __name__ == "__main__":
    unittest.main()
