"""
Data Validation & Discrepancy REST Routes for SIH26023.
Provides listing, scanning, and full lifecycle transitions (UNRESOLVED -> UNDER_REVIEW -> RESOLVED/DISMISSED)
for cross-document conflicts with audit trail tracking.
"""

import logging
from flask import Blueprint, request, jsonify
from services.validation_service import validation_service, DiscrepancyLifecycleStatus
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

@validation_bp.route("/issues/<int:issue_id>/lifecycle", methods=["POST"])
@require_role(["ADMIN", "OFFICER", "ANALYST"])
def update_lifecycle(issue_id: int):
    """Transition discrepancy along lifecycle with reviewer note and optional adopted ground truth."""
    data = request.get_json() or {}
    new_status = data.get("status", DiscrepancyLifecycleStatus.RESOLVED).upper()
    current_role = get_current_user_role()
    reviewer = data.get("reviewer", f"Officer ({current_role})")
    reviewer_note = data.get("note", "Reviewed and updated via discrepancy audit console.")
    adopted_source = data.get("adopted_source")
    resolved_value = data.get("resolved_value")
    decision_type = data.get("decision_type")

    try:
        success = validation_service.update_issue_lifecycle(
            issue_id=issue_id,
            new_status=new_status,
            reviewer=reviewer,
            reviewer_role=current_role,
            reviewer_note=reviewer_note,
            adopted_source=adopted_source,
            resolved_value=resolved_value,
            decision_type=decision_type
        )
        if success:
            return jsonify({
                "status": "success",
                "message": f"Discrepancy #{issue_id} transitioned to {new_status}.",
                "adopted_source": adopted_source,
                "resolved_value": resolved_value
            }), 200
        return jsonify({"status": "error", "message": "Failed to update discrepancy lifecycle status."}), 400
    except Exception as e:
        logger.error(f"Error updating lifecycle for issue {issue_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@validation_bp.route("/issues/<int:issue_id>/resolve", methods=["POST"])
@require_role(["ADMIN", "OFFICER", "ANALYST"])
def resolve_issue(issue_id: int):
    """Mark a validation conflict as certified ground truth / resolved."""
    data = request.get_json() or {}
    current_role = get_current_user_role()
    resolved_by = data.get("resolved_by", f"Officer ({current_role})")
    note = data.get("note", "Ground truth established by reviewing officer.")
    adopted_source = data.get("adopted_source")
    resolved_value = data.get("resolved_value")
    decision_type = data.get("decision_type", "ADOPT_SOURCE")

    try:
        success = validation_service.resolve_issue(
            issue_id=issue_id,
            resolved_by=resolved_by,
            adopted_source=adopted_source,
            resolved_value=resolved_value,
            note=note,
            decision_type=decision_type
        )
        if success:
            return jsonify({
                "status": "success",
                "message": f"Discrepancy #{issue_id} successfully resolved.",
                "resolved_value": resolved_value,
                "adopted_source": adopted_source
            }), 200
        return jsonify({"status": "error", "message": "Failed to resolve issue"}), 400
    except Exception as e:
        logger.error(f"Error resolving issue {issue_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
