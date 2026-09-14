"""
Role-Based Access Control (RBAC) & Security Middleware for SIH26023.
Provides server-verified session enforcement, permission hierarchies, and authorization decorators.

Roles:
- ADMIN: Complete system control (settings, deletions, approvals, seeding).
- OFFICER: Reviewer/executive authority (approvals, resolution, uploads, reports).
- ANALYST: Core operational user (queries, reports, uploads, scanning).
- VIEWER: Read-only access (querying, viewing documents, reports, analytics).
"""

import functools
import logging
from flask import request, jsonify, session
from itsdangerous import BadSignature, SignatureExpired
from database.db import log_audit

logger = logging.getLogger(__name__)

# Valid user roles & authority clearance hierarchy
ROLES = {
    "ADMIN": {"level": 4, "name": "System Administrator"},
    "OFFICER": {"level": 3, "name": "Senior Mining Officer / Joint Secretary"},
    "ANALYST": {"level": 2, "name": "Mining Data Analyst"},
    "VIEWER": {"level": 1, "name": "Read-Only Viewer / Auditor"}
}

def get_current_authenticated_user():
    """
    Extract verified user dictionary from server-side session or cryptographically signed Bearer token.
    Returns None if unauthenticated.
    """
    # 1. Check Flask server-side session
    if "user" in session and isinstance(session["user"], dict):
        return session["user"]

    if "user_role" in session and "account_type" in session:
        return {
            "email": session.get("email", ""),
            "name": session.get("name", ""),
            "role": session.get("user_role"),
            "account_type": session.get("account_type")
        }

    # 2. Check Authorization Bearer or X-Auth-Token header
    auth_header = request.headers.get("Authorization") or request.headers.get("X-Auth-Token")
    if auth_header:
        token = auth_header.replace("Bearer ", "").strip() if auth_header.startswith("Bearer ") else auth_header.strip()
        from routes.auth_routes import verify_auth_token
        verified = verify_auth_token(token)
        if verified:
            return verified

    return None

def get_current_user_role() -> str:
    """
    Extract verified user role strictly from server session or cryptographically signed token.
    Returns None if the request is unauthenticated.
    Public accounts are locked to least-privilege VIEWER.
    Raw client headers (e.g. X-User-Role: ADMIN) without a valid server session are ignored.
    """
    user = get_current_authenticated_user()

    # 1. Unauthenticated request -> None
    if not user:
        return None

    account_type = str(user.get("account_type", "PUBLIC_VIEWER")).upper()

    # 2. Public registered users are strictly locked to VIEWER
    if account_type == "PUBLIC_VIEWER":
        return "VIEWER"

    # 3. Verified Authority Sessions
    if account_type == "AUTHORITY":
        authorized_role = str(user.get("role", "ANALYST")).upper()
        if authorized_role in ROLES:
            # Check if authority user requested a lower UI perspective (e.g. Admin testing Analyst view)
            requested_role = request.headers.get("X-User-Role")
            if requested_role and requested_role.upper() in ROLES:
                req_level = ROLES[requested_role.upper()]["level"]
                auth_level = ROLES[authorized_role]["level"]
                # Can only step down perspective, never escalate beyond server-verified clearance
                if req_level <= auth_level:
                    return requested_role.upper()
            return authorized_role
        return "VIEWER"

    return "VIEWER"

def require_role(allowed_roles):
    """
    Decorator to restrict route access to specific roles.
    Unauthenticated requests receive 401 Unauthorized.
    Authenticated users lacking role permission receive 403 Forbidden.
    allowed_roles: list or set of role strings, e.g. ["ADMIN", "OFFICER"]
    """
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]
    allowed_roles = [r.upper() for r in allowed_roles]

    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_authenticated_user()
            if not user:
                logger.warning(f"UNAUTHENTICATED ACCESS: Request to {request.path} lacks authenticated session.")
                return jsonify({
                    "status": "error",
                    "error_code": "UNAUTHORIZED",
                    "message": "Authentication required. Please sign in with an authorized account."
                }), 401

            current_role = get_current_user_role()
            if not current_role or current_role not in allowed_roles:
                logger.warning(f"RBAC DENIAL: Role '{current_role}' attempted access to {request.path} requiring {allowed_roles}")
                log_audit("UNAUTHORIZED_ACCESS_ATTEMPT", user_role=current_role or "VIEWER", resource_type="endpoint", details={
                    "path": request.path,
                    "method": request.method,
                    "required_roles": allowed_roles,
                    "actual_role": current_role
                })
                return jsonify({
                    "status": "error",
                    "error_code": "FORBIDDEN",
                    "message": f"Access denied: Role '{current_role}' lacks permission for this action. Required: {', '.join(allowed_roles)}."
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_auth(f):
    """
    Decorator requiring an authenticated session (Public Viewer or Authority).
    Unauthenticated requests receive 401 Unauthorized.
    """
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_authenticated_user()
        if not user:
            logger.warning(f"UNAUTHENTICATED ACCESS: Request to {request.path} lacks authenticated session.")
            return jsonify({
                "status": "error",
                "error_code": "UNAUTHORIZED",
                "message": "Authentication required. Please sign in to access this resource."
            }), 401
        return f(*args, **kwargs)
    return decorated_function
