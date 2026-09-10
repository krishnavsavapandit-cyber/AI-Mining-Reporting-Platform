"""
Integration tests for Flask REST API endpoints.
"""

import sys
import unittest
import json
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app import create_app
from database.db import init_db

class TestAPIRoutes(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_health_endpoint(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["status"], "healthy")

    def test_settings_endpoint(self):
        res = self.client.get("/api/settings")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("system", data)
        self.assertIn("ai", data)

    def test_analytics_summary_endpoint(self):
        res = self.client.get("/api/analytics/summary")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("summary", data)

    def test_analytics_charts_endpoint(self):
        res = self.client.get("/api/analytics/charts")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("charts", data)

    def test_documents_list_endpoint(self):
        res = self.client.get("/api/documents")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("documents", data)

    def test_agents_status_endpoint(self):
        res = self.client.get("/api/agents/status")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertGreater(data["count"], 0)

    def test_audit_endpoint(self):
        res = self.client.get("/api/audit")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("logs", data)

if __name__ == "__main__":
    unittest.main()
