"""
Data Validation & Discrepancy REST Routes for SIH26023.
Provides listing, scanning, and resolution for cross-document conflicts.
"""

import logging
from flask import Blueprint, request, jsonify
from services.validation_service import validation_service
from routes.auth_middleware import require_role, get_current_user_role

logger = logging.getLogger(__name__)
validation_bp = Blueprint("validation", __name__, url_prefix="/api/validation")

@validation_bp.route("/issues", methods=["GET"])
def list_issues():
    """List detected cross-document validation issues."""
    status = request.args.get("status")
    try:
        issues = validation_service.get_all_issues(status_filter=status)
        return jsonify({
            "status": "success",
            "count": len(issues),
            "issues": issues
        }), 200
    except Exception as e:
        logger.error(f"Failed to list validation issues: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@validation_bp.route("/scan", methods=["POST"])
@require_role(["ADMIN", "OFFICER", "ANALYST"])
def run_scan():
    """Trigger on-demand cross-document validation scan."""
    try:
        issues = validation_service.run_cross_document_validation()
        return jsonify({
            "status": "success",
            "message": f"Validation scan completed. {len(issues)} discrepancies found.",
            "issues_count": len(issues),
            "issues": issues
        }), 200
    except Exception as e:
        logger.error(f"Validation scan failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@validation_bp.route("/issues/<int:issue_id>/resolve", methods=["POST"])
@require_role(["ADMIN", "OFFICER", "ANALYST"])
def resolve_issue(issue_id: int):
    """Mark a validation conflict as acknowledged / resolved."""
    data = request.get_json() or {}
    current_role = get_current_user_role()
    resolved_by = data.get("resolved_by", f"User ({current_role})")
    try:
        success = validation_service.resolve_issue(issue_id, resolved_by=resolved_by)
        if success:
            return jsonify({"status": "success", "message": "Issue marked as resolved"}), 200
        return jsonify({"status": "error", "message": "Failed to resolve issue"}), 400
    except Exception as e:
        logger.error(f"Error resolving issue {issue_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
