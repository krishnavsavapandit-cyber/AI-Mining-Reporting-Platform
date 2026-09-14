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
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()
        login_res = self.client.post("/api/auth/public/login", json={"email": "viewer@public.cil.gov.in"})
        self.viewer_token = login_res.get_json().get("token")
        self.viewer_headers = {"Authorization": f"Bearer {self.viewer_token}"}

    def test_anonymous_unauthenticated_request_denied_with_401(self):
        """Verify that unauthenticated anonymous request without token receives 401 Unauthorized."""
        anon_client = self.app.test_client()
        response = anon_client.delete("/api/documents/1")
        self.assertEqual(response.status_code, 401)
        data = response.get_json()
        self.assertEqual(data.get("error_code"), "UNAUTHORIZED")

    def test_viewer_denied_document_deletion(self):
        """Verify that VIEWER role is blocked from deleting documents with HTTP 403."""
        response = self.client.delete(
            "/api/documents/1",
            headers=self.viewer_headers
        )
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertEqual(data.get("error_code"), "FORBIDDEN")
        self.assertIn("Access denied", data.get("message", ""))

    def test_viewer_denied_settings_update(self):
        """Verify that VIEWER role cannot update AI provider settings with HTTP 403."""
        response = self.client.post(
            "/api/settings/provider",
            headers=self.viewer_headers,
            json={"preferred_provider": "deterministic"}
        )
        self.assertEqual(response.status_code, 403)

    def test_viewer_denied_inquiry_approval(self):
        """Verify that VIEWER role cannot sign off on parliamentary inquiries with HTTP 403."""
        response = self.client.post(
            "/api/inquiries/1/approve",
            headers=self.viewer_headers,
            json={"approved_by": "Unauthorized Viewer"}
        )
        self.assertEqual(response.status_code, 403)

    def test_officer_allowed_inquiry_approval(self):
        """Verify that authenticated OFFICER role has permission to sign off on inquiries."""
        # Authenticate as Officer
        login_res = self.client.post("/api/auth/authority/login", json={
            "email": "officer@cil.gov.in",
            "password": "authority2026"
        })
        token = login_res.get_json().get("token")

        response = self.client.post(
            "/api/inquiries/1/approve",
            headers={"Authorization": f"Bearer {token}"},
            json={"approved_by": "Director Mining (Officer)"}
        )
        # Should be 200 (if inquiry exists) or not 403 forbidden
        self.assertIn(response.status_code, [200, 404, 500])
        self.assertNotEqual(response.status_code, 403)

    def test_admin_allowed_settings_update(self):
        """Verify that authenticated ADMIN role can update settings successfully."""
        # Authenticate as Admin
        login_res = self.client.post("/api/auth/authority/login", json={
            "email": "admin@cil.gov.in",
            "password": "authority2026"
        })
        token = login_res.get_json().get("token")

        response = self.client.post(
            "/api/settings/provider",
            headers={"Authorization": f"Bearer {token}"},
            json={"preferred_provider": "deterministic"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data.get("status"), "success")

    def test_viewer_allowed_read_only_access(self):
        """Verify that VIEWER can access read-only operations (documents list, settings, analytics)."""
        res_docs = self.client.get("/api/documents", headers=self.viewer_headers)
        self.assertEqual(res_docs.status_code, 200)

        res_settings = self.client.get("/api/settings", headers=self.viewer_headers)
        self.assertEqual(res_settings.status_code, 200)

        res_analytics = self.client.get("/api/analytics/summary", headers=self.viewer_headers)
        self.assertEqual(res_analytics.status_code, 200)

    def test_invalid_role_degrades_to_viewer(self):
        """Verify that unrecognized or spoofed role strings degrade safely to least-privilege VIEWER."""
        response = self.client.delete(
            "/api/documents/1",
            headers={**self.viewer_headers, "X-User-Role": "SUPER_ADMIN_HACKER"}
        )
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertEqual(data.get("error_code"), "FORBIDDEN")

    def test_report_download_path_traversal_blocked(self):
        """Verify that path traversal attempts on report downloads return 404."""
        response = self.client.get("/api/reports/download/../../database/mining_platform.db")
        self.assertEqual(response.status_code, 404)

    def test_public_viewer_account_type_forces_viewer_despite_admin_header_spoofing(self):
        """Verify that X-Account-Type: PUBLIC_VIEWER locks role to VIEWER even if X-User-Role is ADMIN."""
        response = self.client.delete(
            "/api/documents/1",
            headers={
                **self.viewer_headers,
                "X-Account-Type": "PUBLIC_VIEWER",
                "X-User-Role": "ADMIN"
            }
        )
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertEqual(data.get("error_code"), "FORBIDDEN")
        self.assertIn("Access denied", data.get("message", ""))

    def test_public_viewer_denied_officer_inquiry_approval_even_with_spoofed_header(self):
        """Verify that PUBLIC_VIEWER cannot approve inquiries even when sending X-User-Role: OFFICER."""
        response = self.client.post(
            "/api/inquiries/1/approve",
            headers={
                **self.viewer_headers,
                "X-Account-Type": "PUBLIC_VIEWER",
                "X-User-Role": "OFFICER"
            },
            json={"approved_by": "Citizen Auditor"}
        )
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertEqual(data.get("error_code"), "FORBIDDEN")

if __name__ == "__main__":
    unittest.main()
