"""
Role-Based Access Control (RBAC) & Security Middleware for SIH26023.
Provides role enforcement, permission hierarchies, and authorization decorators.

Roles:
- ADMIN: Complete system control (settings, deletions, approvals, seeding).
- OFFICER: Reviewer/executive authority (approvals, resolution, uploads, reports).
- ANALYST: Core operational user (queries, reports, uploads, scanning).
- VIEWER: Read-only access (querying, viewing documents, reports, analytics).
"""

import functools
import logging
from flask import request, jsonify, session
from database.db import log_audit

logger = logging.getLogger(__name__)

# Valid user roles
ROLES = {
    "ADMIN": {"level": 4, "name": "System Administrator"},
    "OFFICER": {"level": 3, "name": "Senior Mining Officer / Joint Secretary"},
    "ANALYST": {"level": 2, "name": "Mining Data Analyst"},
    "VIEWER": {"level": 1, "name": "Read-Only Viewer / Auditor"}
}

def get_current_user_role() -> str:
    """Extract user role from headers, session, query parameters, or body, defaulting securely to least-privilege VIEWER on invalid role strings."""
    # 1. Check HTTP header
    role = request.headers.get("X-User-Role")
    if role:
        if role.upper() in ROLES:
            return role.upper()
        else:
            return "VIEWER"  # Invalid role string defaults securely to VIEWER

    # 2. Check session
    if "user_role" in session:
        if session["user_role"].upper() in ROLES:
            return session["user_role"].upper()
        else:
            return "VIEWER"

    # 3. Check query parameters
    role_arg = request.args.get("role")
    if role_arg:
        if role_arg.upper() in ROLES:
            return role_arg.upper()
        else:
            return "VIEWER"

    # 4. Check JSON body if available
    if request.is_json and request.json:
        body_role = request.json.get("user_role")
        if body_role:
            if str(body_role).upper() in ROLES:
                return str(body_role).upper()
            else:
                return "VIEWER"

    # Default to ANALYST for standard demonstration ease when no explicit role is passed
    return "ANALYST"

def require_role(allowed_roles):
    """
    Decorator to restrict route access to specific roles.
    allowed_roles: list or set of role strings, e.g. ["ADMIN", "OFFICER"]
    """
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]
    allowed_roles = [r.upper() for r in allowed_roles]

    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            current_role = get_current_user_role()
            if current_role not in allowed_roles:
                logger.warning(f"RBAC DENIAL: Role '{current_role}' attempted access to {request.path} requiring {allowed_roles}")
                log_audit("UNAUTHORIZED_ACCESS_ATTEMPT", user_role=current_role, resource_type="endpoint", details={
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
