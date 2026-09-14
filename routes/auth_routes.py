"""
Authentication and Session Management Routes for SIH26023.
Provides secure server-side login, session validation, and logout for both
Public Viewers and Official Authority Accounts (Mining Analyst, Reviewing Officer, System Admin).
"""

import logging
from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from config.settings import SECRET_KEY
from database.db import log_audit

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

AUTH_SERIALIZER = URLSafeTimedSerializer(SECRET_KEY, salt="geonexus-authority-session-2026")

# Synthetic Development Authority Accounts (Password hashes created with pbkdf2:sha256)
# Default development password for all authority accounts: "authority2026"
DEVELOPMENT_AUTHORITY_ACCOUNTS = {
    "analyst@cil.gov.in": {
        "email": "analyst@cil.gov.in",
        "name": "Dr. Debashis Roy",
        "title": "Mining Intelligence Analyst",
        "role": "ANALYST",
        "level": 2,
        "password_hash": generate_password_hash("authority2026"),
        "account_type": "AUTHORITY"
    },
    "officer@cil.gov.in": {
        "email": "officer@cil.gov.in",
        "name": "Smt. Ananya Sen, IAS",
        "title": "Reviewing Officer / Joint Secretary",
        "role": "OFFICER",
        "level": 3,
        "password_hash": generate_password_hash("authority2026"),
        "account_type": "AUTHORITY"
    },
    "admin@cil.gov.in": {
        "email": "admin@cil.gov.in",
        "name": "Col. K. V. Sharma (Retd.)",
        "title": "Chief System Administrator",
        "role": "ADMIN",
        "level": 4,
        "password_hash": generate_password_hash("authority2026"),
        "account_type": "AUTHORITY"
    }
}

# Fast lookup by canonical identifier or alias (exact match only - NO substring/fuzzy match)
CANONICAL_LOOKUP = {
    "analyst@cil.gov.in": "analyst@cil.gov.in",
    "officer@cil.gov.in": "officer@cil.gov.in",
    "admin@cil.gov.in": "admin@cil.gov.in",
    "analyst": "analyst@cil.gov.in",
    "officer": "officer@cil.gov.in",
    "admin": "admin@cil.gov.in",
}

# Set of explicitly revoked/logged-out tokens (fast in-memory cache)
REVOKED_TOKENS = set()

def revoke_token(token: str, user_email: str = None):
    """Mark token as revoked upon logout in memory and persistent database."""
    if token and isinstance(token, str):
        cleaned = token.replace("Bearer ", "").strip()
        if cleaned:
            REVOKED_TOKENS.add(cleaned)
            try:
                from database.db import revoke_token as db_revoke_token
                db_revoke_token(cleaned, user_email=user_email)
            except Exception as e:
                logger.debug(f"Database token revocation record note: {e}")

def is_token_revoked(token: str) -> bool:
    """Check if token has been revoked in memory or database."""
    if not token or not isinstance(token, str):
        return False
    cleaned = token.replace("Bearer ", "").strip()
    if cleaned in REVOKED_TOKENS:
        return True
    try:
        from database.db import is_token_revoked as db_is_token_revoked
        if db_is_token_revoked(cleaned):
            REVOKED_TOKENS.add(cleaned)
            return True
    except Exception:
        pass
    return False

def generate_auth_token(email: str, name: str, role: str, account_type: str) -> str:
    """Generate cryptographically signed, time-limited authentication token (24h lifespan)."""
    payload = {
        "email": email,
        "name": name,
        "role": role,
        "account_type": account_type
    }
    return AUTH_SERIALIZER.dumps(payload)

def verify_auth_token(token: str, max_age: int = 86400):
    """
    Verify cryptographically signed token and extract payload.
    Rejects expired tokens (> 24 hours / max_age) and explicitly revoked tokens.
    """
    if not token or is_token_revoked(token):
        return None
    try:
        cleaned = token.replace("Bearer ", "").strip()
        data = AUTH_SERIALIZER.loads(cleaned, max_age=max_age)
        if isinstance(data, dict) and "role" in data:
            return data
    except (BadSignature, SignatureExpired):
        return None
    return None


@auth_bp.route("/authority/login", methods=["POST"])
def authority_login():
    """
    Official Authority Authentication Endpoint.
    Validates official credentials server-side against provisioned development accounts.
    Strictly derives the authorized role from the verified account record.
    """
    if not request.is_json:
        return jsonify({"status": "error", "message": "Request must be JSON"}), 400

    data = request.get_json() or {}
    raw_email = data.get("email")
    raw_password = data.get("password")

    if not raw_email or not str(raw_email).strip():
        return jsonify({"status": "error", "message": "Official email or username is required."}), 400

    if not raw_password or not str(raw_password).strip():
        return jsonify({"status": "error", "message": "Password is required."}), 400

    normalized_input = str(raw_email).strip().lower()
    canonical_email = CANONICAL_LOOKUP.get(normalized_input)

    # Reject unknown identifiers with zero substring keyword matching
    if not canonical_email or canonical_email not in DEVELOPMENT_AUTHORITY_ACCOUNTS:
        logger.warning(f"Failed authority login: Unknown identifier '{normalized_input}'")
        log_audit("AUTHORITY_LOGIN_FAILED", user_role="VIEWER", resource_type="auth", details={
            "attempted_email": normalized_input,
            "reason": "UNKNOWN_IDENTIFIER"
        })
        return jsonify({
            "status": "error",
            "error_code": "UNAUTHORIZED",
            "message": "Invalid official credentials or unauthorized identifier."
        }), 401

    account = DEVELOPMENT_AUTHORITY_ACCOUNTS[canonical_email]

    # Verify password hash server-side
    if not check_password_hash(account["password_hash"], str(raw_password)):
        logger.warning(f"Failed authority login: Password mismatch for '{canonical_email}'")
        log_audit("AUTHORITY_LOGIN_FAILED", user_role="VIEWER", resource_type="auth", details={
            "attempted_email": canonical_email,
            "reason": "PASSWORD_MISMATCH"
        })
        return jsonify({
            "status": "error",
            "error_code": "UNAUTHORIZED",
            "message": "Invalid official credentials or password."
        }), 401

    # Establish authenticated server-side session
    session["user"] = {
        "email": account["email"],
        "name": account["name"],
        "role": account["role"],
        "account_type": "AUTHORITY"
    }
    session["user_role"] = account["role"]
    session["account_type"] = "AUTHORITY"

    token = generate_auth_token(
        email=account["email"],
        name=account["name"],
        role=account["role"],
        account_type="AUTHORITY"
    )

    log_audit("AUTHORITY_LOGIN_SUCCESS", user_role=account["role"], resource_type="auth", details={
        "email": account["email"],
        "role": account["role"],
        "level": account["level"]
    })

    return jsonify({
        "status": "success",
        "message": f"Authority clearance verified for {account['title']}",
        "token": token,
        "user": {
            "email": account["email"],
            "name": account["name"],
            "title": account["title"],
            "level": account["level"],
            "accountType": "AUTHORITY",
            "authorizedRole": account["role"]
        }
    }), 200

@auth_bp.route("/public/login", methods=["POST"])
@auth_bp.route("/login", methods=["POST"])
def public_login():
    """
    Public and Auditor Authentication Endpoint.
    Establishes an authenticated session strictly locked to PUBLIC_VIEWER / VIEWER.
    """
    data = request.get_json() if request.is_json else {}
    raw_email = data.get("email") if data else ""
    email = str(raw_email).strip().lower() if raw_email else "auditor.public@geonexus.cil"
    name = email.split("@")[0].replace(".", " ").title() if "@" in email else "Public Auditor"

    # Establish public viewer session
    session["user"] = {
        "email": email,
        "name": name,
        "role": "VIEWER",
        "account_type": "PUBLIC_VIEWER"
    }
    session["user_role"] = "VIEWER"
    session["account_type"] = "PUBLIC_VIEWER"

    token = generate_auth_token(
        email=email,
        name=name,
        role="VIEWER",
        account_type="PUBLIC_VIEWER"
    )

    log_audit("PUBLIC_LOGIN_SUCCESS", user_role="VIEWER", resource_type="auth", details={
        "email": email
    })

    return jsonify({
        "status": "success",
        "message": "Public Auditor session initialized",
        "token": token,
        "user": {
            "email": email,
            "name": name,
            "accountType": "PUBLIC_VIEWER",
            "authorizedRole": "VIEWER"
        }
    }), 200

@auth_bp.route("/public/register", methods=["POST"])
@auth_bp.route("/register", methods=["POST"])
def public_register():
    """
    Public Registration Endpoint.
    Registers a public account and returns an authenticated session strictly locked to PUBLIC_VIEWER / VIEWER.
    Never accepts or provisions authority roles (ANALYST, OFFICER, ADMIN).
    """
    data = request.get_json() if request.is_json else {}
    raw_email = (data or {}).get("email", "").strip().lower()
    full_name = (data or {}).get("fullName") or (data or {}).get("name") or "Public User"
    organization = (data or {}).get("organization", "Citizen Auditor / Public")

    if not raw_email:
        return jsonify({"status": "error", "message": "Email is required for registration."}), 400

    # Ensure authority emails cannot be hijacked via public registration
    if raw_email in DEVELOPMENT_AUTHORITY_ACCOUNTS:
        return jsonify({
            "status": "error",
            "error_code": "FORBIDDEN",
            "message": "Official authority accounts must log in via the Official Authority Portal."
        }), 403

    # Establish authenticated public viewer session - strictly locked to VIEWER
    session["user"] = {
        "email": raw_email,
        "name": str(full_name).strip(),
        "organization": str(organization).strip(),
        "role": "VIEWER",
        "account_type": "PUBLIC_VIEWER"
    }
    session["user_role"] = "VIEWER"
    session["account_type"] = "PUBLIC_VIEWER"

    token = generate_auth_token(
        email=raw_email,
        name=str(full_name).strip(),
        role="VIEWER",
        account_type="PUBLIC_VIEWER"
    )

    log_audit("PUBLIC_REGISTRATION", user_role="VIEWER", resource_type="auth", details={
        "email": raw_email,
        "name": full_name
    })

    return jsonify({
        "status": "success",
        "message": "Public account registered successfully",
        "token": token,
        "user": {
            "email": raw_email,
            "name": str(full_name).strip(),
            "organization": str(organization).strip(),
            "accountType": "PUBLIC_VIEWER",
            "authorizedRole": "VIEWER"
        }
    }), 201

@auth_bp.route("/logout", methods=["POST", "GET"])
def logout():
    """
    Invalidate active server-side session, revoke Bearer token, and clear authentication context.
    """
    current_role = session.get("user_role", "VIEWER")
    current_email = session.get("email") or (session.get("user", {}) or {}).get("email")
    session.clear()

    auth_header = request.headers.get("Authorization") or request.headers.get("X-Auth-Token")
    if auth_header:
        revoke_token(auth_header, user_email=current_email)
    
    if request.is_json:
        req_token = (request.get_json() or {}).get("token")
        if req_token:
            revoke_token(req_token, user_email=current_email)

    log_audit("USER_LOGOUT", user_role=current_role, resource_type="auth")

    return jsonify({
        "status": "success",
        "message": "Session and token invalidated successfully."
    }), 200

@auth_bp.route("/me", methods=["GET"])
def get_current_session():
    """
    Inspect currently authenticated server-side session or token.
    """
    # 1. Check Flask session
    if "user" in session and isinstance(session["user"], dict):
        user = session["user"]
        return jsonify({
            "status": "success",
            "authenticated": True,
            "user": {
                "email": user.get("email"),
                "name": user.get("name"),
                "accountType": user.get("account_type", "PUBLIC_VIEWER"),
                "authorizedRole": user.get("role", "VIEWER")
            }
        }), 200

    # 2. Check Bearer token
    auth_header = request.headers.get("Authorization") or request.headers.get("X-Auth-Token")
    if auth_header:
        token = auth_header.replace("Bearer ", "").strip() if auth_header.startswith("Bearer ") else auth_header.strip()
        data = verify_auth_token(token)
        if data:
            return jsonify({
                "status": "success",
                "authenticated": True,
                "user": {
                    "email": data.get("email"),
                    "name": data.get("name"),
                    "accountType": data.get("account_type", "PUBLIC_VIEWER"),
                    "authorizedRole": data.get("role", "VIEWER")
                }
            }), 200

    return jsonify({
        "status": "success",
        "authenticated": False,
        "user": None
    }), 200
