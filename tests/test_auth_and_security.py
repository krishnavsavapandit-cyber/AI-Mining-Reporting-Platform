"""
Server-Side Authentication & RBAC Boundary Test Suite for SIH26023.
Tests server-side authority credentials validation, password hashing, session tokens,
prevention of header/role spoofing, and endpoint RBAC boundaries.
"""

import unittest
import json
from app import create_app
from routes.auth_routes import AUTH_SERIALIZER

class TestAuthAndSecurity(unittest.TestCase):
    """Rigorous tests for server-side authentication and authorization boundaries."""

    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    # ==========================================
    # 1. SERVER-SIDE AUTHENTICATION TESTS
    # ==========================================

    def test_analyst_login_with_correct_credentials(self):
        """Verify that Mining Analyst logs in with correct password and receives ANALYST role."""
        res = self.client.post("/api/auth/authority/login", json={
            "email": "analyst@cil.gov.in",
            "password": "authority2026"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["user"]["authorizedRole"], "ANALYST")
        self.assertEqual(data["user"]["accountType"], "AUTHORITY")
        self.assertTrue(bool(data["token"]))

    def test_officer_login_with_correct_credentials(self):
        """Verify that Reviewing Officer logs in with correct password and receives OFFICER role."""
        res = self.client.post("/api/auth/authority/login", json={
            "email": "officer@cil.gov.in",
            "password": "authority2026"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["user"]["authorizedRole"], "OFFICER")

    def test_admin_login_with_correct_credentials(self):
        """Verify that System Administrator logs in with correct password and receives ADMIN role."""
        res = self.client.post("/api/auth/authority/login", json={
            "email": "admin@cil.gov.in",
            "password": "authority2026"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["user"]["authorizedRole"], "ADMIN")

    def test_correct_email_with_wrong_password_rejected(self):
        """Verify that correct email with wrong password returns 401 Unauthorized."""
        res = self.client.post("/api/auth/authority/login", json={
            "email": "admin@cil.gov.in",
            "password": "wrongpassword123"
        })
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertEqual(data["error_code"], "UNAUTHORIZED")
        self.assertIn("Invalid official credentials", data["message"])

    def test_unknown_email_rejected(self):
        """Verify that unknown email returns 401 Unauthorized."""
        res = self.client.post("/api/auth/authority/login", json={
            "email": "stranger@gmail.com",
            "password": "authority2026"
        })
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertEqual(data["error_code"], "UNAUTHORIZED")

    def test_fake_analyst_keyword_substring_rejected(self):
        """Verify that unknown email containing 'analyst' is strictly rejected without fuzzy matching."""
        res = self.client.post("/api/auth/authority/login", json={
            "email": "fakeanalyst@external.com",
            "password": "authority2026"
        })
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.get_json()["error_code"], "UNAUTHORIZED")

    def test_fake_officer_keyword_substring_rejected(self):
        """Verify that unknown email containing 'officer' is strictly rejected."""
        res = self.client.post("/api/auth/authority/login", json={
            "email": "fakeofficer@external.com",
            "password": "authority2026"
        })
        self.assertEqual(res.status_code, 401)

    def test_fake_admin_keyword_substring_rejected(self):
        """Verify that unknown email containing 'admin' is strictly rejected."""
        res = self.client.post("/api/auth/authority/login", json={
            "email": "fakeadmin@external.com",
            "password": "authority2026"
        })
        self.assertEqual(res.status_code, 401)

    def test_empty_password_rejected(self):
        """Verify that empty password returns 400 Bad Request."""
        res = self.client.post("/api/auth/authority/login", json={
            "email": "analyst@cil.gov.in",
            "password": ""
        })
        self.assertEqual(res.status_code, 400)

    def test_empty_email_rejected(self):
        """Verify that empty email returns 400 Bad Request."""
        res = self.client.post("/api/auth/authority/login", json={
            "email": "",
            "password": "authority2026"
        })
        self.assertEqual(res.status_code, 400)

    # ==========================================
    # 2. SERVER-SIDE AUTHORIZATION (RBAC) TESTS
    # ==========================================

    def test_unauthenticated_request_blocked_from_admin_endpoint(self):
        """Verify that unauthenticated requests to Admin endpoints return 401 Unauthorized or 403 Forbidden."""
        res = self.client.post("/api/settings/provider", json={"preferred_provider": "deterministic"})
        self.assertIn(res.status_code, [401, 403])

    def test_public_registration_creates_viewer_only(self):
        """Verify that public registration creates PUBLIC_VIEWER account with VIEWER role only."""
        res = self.client.post("/api/auth/register", json={
            "email": "new_citizen@gmail.com",
            "fullName": "Jane Citizen",
            "organization": "Citizen Watch"
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["user"]["accountType"], "PUBLIC_VIEWER")
        self.assertEqual(data["user"]["authorizedRole"], "VIEWER")
        self.assertTrue(bool(data["token"]))

    def test_public_registration_cannot_hijack_authority_accounts(self):
        """Verify that public registration rejects official authority emails."""
        res = self.client.post("/api/auth/register", json={
            "email": "admin@cil.gov.in",
            "fullName": "Imposter Admin"
        })
        self.assertEqual(res.status_code, 403)

    def test_public_user_cannot_escalate_to_analyst_officer_or_admin(self):
        """Verify that a Public Viewer cannot escalate to Analyst, Officer, or Admin."""
        reg_res = self.client.post("/api/auth/register", json={
            "email": "auditor_test@public.org",
            "fullName": "Test Auditor"
        })
        token = reg_res.get_json()["token"]

        # Attempt to access Admin endpoint with spoofed X-User-Role
        res_admin = self.client.post(
            "/api/settings/provider",
            headers={
                "Authorization": f"Bearer {token}",
                "X-User-Role": "ADMIN"
            },
            json={"preferred_provider": "deterministic"}
        )
        self.assertEqual(res_admin.status_code, 403)

        # Attempt to access Officer endpoint with spoofed X-User-Role
        res_officer = self.client.post(
            "/api/inquiries/1/approve",
            headers={
                "Authorization": f"Bearer {token}",
                "X-User-Role": "OFFICER"
            },
            json={"approved_by": "Auditor"}
        )
        self.assertEqual(res_officer.status_code, 403)

        # Attempt to access Analyst upload endpoint with spoofed X-User-Role
        res_analyst = self.client.post(
            "/api/documents/upload",
            headers={
                "Authorization": f"Bearer {token}",
                "X-User-Role": "ANALYST"
            }
        )
        self.assertEqual(res_analyst.status_code, 403)

    def test_landing_page_route_accessible_without_auth(self):
        """Verify that the public landing page / is accessible without authentication."""
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)

    def test_viewer_session_blocked_from_admin_endpoint(self):
        """Verify that authenticated Public Viewer is blocked from Admin endpoints (403 Forbidden)."""
        # Login as public viewer
        login_res = self.client.post("/api/auth/public/login", json={"email": "citizen@cil.public"})
        token = login_res.get_json()["token"]

        res = self.client.post(
            "/api/settings/provider",
            headers={"Authorization": f"Bearer {token}"},
            json={"preferred_provider": "deterministic"}
        )
        self.assertEqual(res.status_code, 403)
        self.assertEqual(res.get_json()["error_code"], "FORBIDDEN")

    def test_analyst_session_blocked_from_admin_endpoint(self):
        """Verify that authenticated Analyst is blocked from Admin-only endpoints (403 Forbidden)."""
        login_res = self.client.post("/api/auth/authority/login", json={
            "email": "analyst@cil.gov.in",
            "password": "authority2026"
        })
        token = login_res.get_json()["token"]

        # Attempt to modify provider settings (Admin only)
        res = self.client.post(
            "/api/settings/provider",
            headers={"Authorization": f"Bearer {token}"},
            json={"preferred_provider": "deterministic"}
        )
        self.assertEqual(res.status_code, 403)

    def test_officer_session_blocked_from_admin_only_endpoint(self):
        """Verify that Reviewing Officer cannot execute Admin-only actions like provider update (403)."""
        login_res = self.client.post("/api/auth/authority/login", json={
            "email": "officer@cil.gov.in",
            "password": "authority2026"
        })
        token = login_res.get_json()["token"]

        res = self.client.post(
            "/api/settings/provider",
            headers={"Authorization": f"Bearer {token}"},
            json={"preferred_provider": "deterministic"}
        )
        self.assertEqual(res.status_code, 403)

    def test_admin_session_allowed_on_admin_endpoint(self):
        """Verify that authenticated Admin session successfully accesses Admin endpoints."""
        login_res = self.client.post("/api/auth/authority/login", json={
            "email": "admin@cil.gov.in",
            "password": "authority2026"
        })
        token = login_res.get_json()["token"]

        res = self.client.post(
            "/api/settings/provider",
            headers={"Authorization": f"Bearer {token}"},
            json={"preferred_provider": "deterministic"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["status"], "success")

    # ==========================================
    # 3. HEADER SPOOFING & TAMPERING RESISTANCE
    # ==========================================

    def test_header_spoofing_without_session_rejected(self):
        """Verify that sending X-User-Role: ADMIN without a valid token is rejected (401 Unauthorized)."""
        res = self.client.post(
            "/api/settings/provider",
            headers={"X-User-Role": "ADMIN"},
            json={"preferred_provider": "deterministic"}
        )
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.get_json()["error_code"], "UNAUTHORIZED")

    def test_anonymous_user_blocked_from_protected_dashboard_apis(self):
        """Verify that anonymous unauthenticated user cannot access protected dashboard APIs."""
        res_upload = self.client.post("/api/documents/upload")
        self.assertEqual(res_upload.status_code, 401)

        res_approve = self.client.post("/api/inquiries/1/approve", json={"approved_by": "Anon"})
        self.assertEqual(res_approve.status_code, 401)

        res_settings = self.client.post("/api/settings/provider", json={"preferred_provider": "deterministic"})
        self.assertEqual(res_settings.status_code, 401)

    def test_viewer_session_with_spoofed_admin_header_rejected(self):
        """Verify that a Public Viewer sending X-User-Role: ADMIN is still forced to VIEWER (403)."""
        login_res = self.client.post("/api/auth/public/login", json={"email": "citizen@cil.public"})
        token = login_res.get_json()["token"]

        res = self.client.post(
            "/api/settings/provider",
            headers={
                "Authorization": f"Bearer {token}",
                "X-User-Role": "ADMIN"
            },
            json={"preferred_provider": "deterministic"}
        )
        self.assertEqual(res.status_code, 403)

    def test_public_user_can_login_and_access_viewer_dashboard(self):
        """Verify that registered public user can log in and access read-only Viewer dashboard APIs."""
        login_res = self.client.post("/api/auth/public/login", json={"email": "citizen@cil.public"})
        self.assertEqual(login_res.status_code, 200)
        token = login_res.get_json()["token"]

        res_docs = self.client.get("/api/documents", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res_docs.status_code, 200)

        res_analytics = self.client.get("/api/analytics/summary", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res_analytics.status_code, 200)

    def test_analyst_session_with_spoofed_admin_header_rejected(self):
        """Verify that an Analyst sending X-User-Role: ADMIN cannot escalate privilege (403)."""
        login_res = self.client.post("/api/auth/authority/login", json={
            "email": "analyst@cil.gov.in",
            "password": "authority2026"
        })
        token = login_res.get_json()["token"]

        res = self.client.post(
            "/api/settings/provider",
            headers={
                "Authorization": f"Bearer {token}",
                "X-User-Role": "ADMIN"
            },
            json={"preferred_provider": "deterministic"}
        )
        self.assertEqual(res.status_code, 403)

    # ==========================================
    # 4. SESSION VALIDATION & LOGOUT
    # ==========================================

    def test_session_me_endpoint(self):
        """Verify that /api/auth/me returns currently authenticated user details."""
        login_res = self.client.post("/api/auth/authority/login", json={
            "email": "analyst@cil.gov.in",
            "password": "authority2026"
        })
        token = login_res.get_json()["token"]

        res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["authenticated"])
        self.assertEqual(data["user"]["email"], "analyst@cil.gov.in")
        self.assertEqual(data["user"]["authorizedRole"], "ANALYST")

    def test_logout_invalidates_session_and_token(self):
        """Verify that logout clears server-side session and revokes Bearer token."""
        login_res = self.client.post("/api/auth/authority/login", json={
            "email": "admin@cil.gov.in",
            "password": "authority2026"
        })
        token = login_res.get_json()["token"]

        # Token works before logout
        res_before = self.client.post(
            "/api/settings/provider",
            headers={"Authorization": f"Bearer {token}"},
            json={"preferred_provider": "deterministic"}
        )
        self.assertEqual(res_before.status_code, 200)

        # Call logout with the token
        logout_res = self.client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(logout_res.status_code, 200)

        # After logout, accessing admin endpoint with the old token is blocked (401 Unauthorized)
        res_after = self.client.post(
            "/api/settings/provider",
            headers={"Authorization": f"Bearer {token}"},
            json={"preferred_provider": "deterministic"}
        )
        self.assertIn(res_after.status_code, [401, 403])

    def test_expired_token_rejected(self):
        """Verify that expired tokens cannot be used to authenticate."""
        from routes.auth_routes import generate_auth_token, verify_auth_token
        token = generate_auth_token("admin@cil.gov.in", "Admin", "ADMIN", "AUTHORITY")

        # verify_auth_token with max_age=-1 treats token as expired
        verified = verify_auth_token(token, max_age=-1)
        self.assertIsNone(verified)

    def test_tampered_token_signature_rejected(self):
        """Verify that manually tampered token signatures are rejected."""
        from routes.auth_routes import generate_auth_token
        token = generate_auth_token("analyst@cil.gov.in", "Analyst", "ANALYST", "AUTHORITY")
        tampered = token[:-4] + "xxxx"

        res = self.client.post(
            "/api/settings/provider",
            headers={"Authorization": f"Bearer {tampered}"},
            json={"preferred_provider": "deterministic"}
        )
        self.assertIn(res.status_code, [401, 403])

if __name__ == "__main__":
    unittest.main()
