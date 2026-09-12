"""
Government & Parliamentary Inquiry REST Routes for SIH26023.
Handles inquiry parsing, draft generation, and human verification sign-offs.
"""

import json
import logging
from flask import Blueprint, request, jsonify
from agents.manager_agent import manager_agent
from database.db import get_db, log_audit
from routes.auth_middleware import require_role, get_current_user_role

logger = logging.getLogger(__name__)
inquiry_bp = Blueprint("inquiries", __name__, url_prefix="/api/inquiries")

@inquiry_bp.route("/generate", methods=["POST"])
def generate_inquiry():
    """Trigger inquiry response draft workflow via Manager Agent."""
    data = request.get_json() or {}
    question_text = data.get("question_text", "").strip()
    inquiry_ref = data.get("inquiry_ref", "LS-UNSTARRED-2026")
    ministry_body = data.get("ministry_body", "Ministry of Coal / Parliament of India")

    if not question_text:
        return jsonify({"status": "error", "message": "Question text cannot be empty"}), 400

    try:
        wf_res = manager_agent.run_inquiry_workflow(
            question_text=question_text,
            inquiry_ref=inquiry_ref,
            ministry_body=ministry_body
        )

        return jsonify({
            "status": "success",
            "message": "Inquiry draft generated successfully",
            "inquiry": wf_res.get("inquiry", {}),
            "workflow": wf_res.get("workflow", {})
        }), 200
    except Exception as e:
        logger.error(f"Inquiry generation error: {e}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500

@inquiry_bp.route("", methods=["GET"])
def list_inquiries():
    """List all recorded inquiry drafts."""
    try:
        with get_db() as conn:
            inquiries = conn.execute(
                "SELECT * FROM inquiries ORDER BY id DESC"
            ).fetchall()

            return jsonify({
                "status": "success",
                "count": len(inquiries),
                "inquiries": inquiries
            }), 200
    except Exception as e:
        logger.error(f"Failed to list inquiries: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@inquiry_bp.route("/<int:inquiry_id>", methods=["GET"])
def get_inquiry(inquiry_id: int):
    """Get single inquiry draft details."""
    try:
        with get_db() as conn:
            inquiry = conn.execute("SELECT * FROM inquiries WHERE id = ?", (inquiry_id,)).fetchone()
            if not inquiry:
                return jsonify({"status": "error", "message": "Inquiry not found"}), 404

            return jsonify({
                "status": "success",
                "inquiry": inquiry
            }), 200
    except Exception as e:
        logger.error(f"Failed to fetch inquiry {inquiry_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@inquiry_bp.route("/<int:inquiry_id>/approve", methods=["POST"])
@require_role(["ADMIN", "OFFICER"])
def approve_inquiry(inquiry_id: int):
    """Human verification sign-off for a drafted response."""
    data = request.get_json() or {}
    current_role = get_current_user_role()
    approved_by = data.get("approved_by", f"Designated Officer ({current_role})")

    try:
        with get_db() as conn:
            existing = conn.execute("SELECT id FROM inquiries WHERE id = ?", (inquiry_id,)).fetchone()
            if not existing:
                return jsonify({"status": "error", "message": "Inquiry not found"}), 404

            conn.execute(
                "UPDATE inquiries SET human_approved = 1, approved_by = ?, status = 'OFFICIALLY_VERIFIED' WHERE id = ?",
                (approved_by, inquiry_id)
            )
            log_audit("INQUIRY_HUMAN_APPROVED", user_role=current_role, resource_type="inquiry", resource_id=inquiry_id, details={"approved_by": approved_by})

        return jsonify({"status": "success", "message": "Inquiry draft officially signed off."}), 200
    except Exception as e:
        logger.error(f"Failed to approve inquiry {inquiry_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
