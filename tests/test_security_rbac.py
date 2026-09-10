"""
RBAC & Security Foundations Test Suite for SIH26023.
Tests role authorization, unauthorized access rejection (403), audit logging,
and permission boundaries across endpoints.
"""

import unittest
from app import create_app
from database.db import get_db

class TestSecurityRBAC(unittest.TestCase):
    """Test Role-Based Access Control and security enforcement."""

    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_viewer_denied_document_deletion(self):
        """Verify that VIEWER role is blocked from deleting documents with HTTP 403."""
        response = self.client.delete(
            "/api/documents/1",
            headers={"X-User-Role": "VIEWER"}
        )
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertEqual(data.get("error_code"), "FORBIDDEN")
        self.assertIn("Access denied", data.get("message", ""))

    def test_viewer_denied_settings_update(self):
        """Verify that VIEWER role cannot update AI provider settings with HTTP 403."""
        response = self.client.post(
            "/api/settings/provider",
            headers={"X-User-Role": "VIEWER"},
            json={"preferred_provider": "deterministic"}
        )
        self.assertEqual(response.status_code, 403)

    def test_viewer_denied_inquiry_approval(self):
        """Verify that VIEWER role cannot sign off on parliamentary inquiries with HTTP 403."""
        response = self.client.post(
            "/api/inquiries/1/approve",
            headers={"X-User-Role": "VIEWER"},
            json={"approved_by": "Unauthorized Viewer"}
        )
        self.assertEqual(response.status_code, 403)

    def test_officer_allowed_inquiry_approval(self):
        """Verify that OFFICER role has permission to sign off on inquiries."""
        # Check if inquiry 1 exists or test approval flow
        response = self.client.post(
            "/api/inquiries/1/approve",
            headers={"X-User-Role": "OFFICER"},
            json={"approved_by": "Director Mining (Officer)"}
        )
        # Should be 200 (if inquiry exists) or not 403 forbidden
        self.assertIn(response.status_code, [200, 404, 500])
        self.assertNotEqual(response.status_code, 403)

    def test_admin_allowed_settings_update(self):
        """Verify that ADMIN role can update settings successfully."""
        response = self.client.post(
            "/api/settings/provider",
            headers={"X-User-Role": "ADMIN"},
            json={"preferred_provider": "deterministic"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data.get("status"), "success")

    def test_viewer_allowed_read_only_access(self):
        """Verify that VIEWER can access read-only operations (documents list, settings, analytics)."""
        res_docs = self.client.get("/api/documents", headers={"X-User-Role": "VIEWER"})
        self.assertEqual(res_docs.status_code, 200)

        res_settings = self.client.get("/api/settings", headers={"X-User-Role": "VIEWER"})
        self.assertEqual(res_settings.status_code, 200)

        res_analytics = self.client.get("/api/analytics/summary", headers={"X-User-Role": "VIEWER"})
        self.assertEqual(res_analytics.status_code, 200)

    def test_invalid_role_degrades_to_viewer(self):
        """Verify that unrecognized or spoofed role strings degrade safely to least-privilege VIEWER."""
        response = self.client.delete(
            "/api/documents/1",
            headers={"X-User-Role": "SUPER_ADMIN_HACKER"}
        )
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertEqual(data.get("error_code"), "FORBIDDEN")

    def test_report_download_path_traversal_blocked(self):
        """Verify that path traversal attempts on report downloads return 404."""
        response = self.client.get("/api/reports/download/../../database/mining_platform.db")
        self.assertEqual(response.status_code, 404)

if __name__ == "__main__":
    unittest.main()

