"""
Audit Logging REST Routes for SIH26023.
Exposes security, system activity, and workflow compliance audit logs.
"""

import json
import logging
from flask import Blueprint, request, jsonify
from database.db import get_db

logger = logging.getLogger(__name__)
audit_bp = Blueprint("audit", __name__, url_prefix="/api/audit")

@audit_bp.route("", methods=["GET"])
def get_audit_logs():
    """Retrieve audit logs with optional filtering."""
    action_type = request.args.get("action")
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))

    try:
        with get_db() as conn:
            sql = "SELECT * FROM audit_logs WHERE 1=1"
            params = []
            if action_type:
                sql += " AND action_type = ?"
                params.append(action_type)

            sql += " ORDER BY id DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            rows = conn.execute(sql, params).fetchall()
            total = conn.execute("SELECT COUNT(*) as cnt FROM audit_logs").fetchone()["cnt"]

            return jsonify({
                "status": "success",
                "total": total,
                "count": len(rows),
                "logs": rows
            }), 200
    except Exception as e:
        logger.error(f"Failed to fetch audit logs: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
