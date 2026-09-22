"""
Automated Report Generation REST Routes for SIH26023.
Handles report generation, inspection, approval, and file downloads (PDF/DOCX).
"""

import os
import json
import logging
from pathlib import Path
from flask import Blueprint, request, jsonify, send_from_directory
from agents.manager_agent import manager_agent
from config.settings import GENERATED_REPORTS_DIR
from database.db import get_db, log_audit
from routes.auth_middleware import require_role, get_current_user_role

logger = logging.getLogger(__name__)
report_bp = Blueprint("reports", __name__, url_prefix="/api/reports")

@report_bp.route("/generate", methods=["POST"])
@require_role(["ADMIN", "OFFICER", "ANALYST"])
def generate_report():
    """Trigger automated report generation workflow via Manager Agent."""
    data = request.get_json() or {}
    report_type = data.get("report_type", "Consolidated Mining Production Report")
    title = data.get("title", f"CIL Executive Report -- {report_type}")
    subsidiary = data.get("subsidiary")
    period = data.get("reporting_period")
    instructions = data.get("instructions", "")

    try:
        wf_res = manager_agent.run_report_generation_workflow(
            report_type=report_type,
            title=title,
            subsidiary=subsidiary,
            reporting_period=period,
            instructions=instructions
        )

        return jsonify({
            "status": "success",
            "message": "Report generated successfully",
            "report": wf_res.get("report", {}),
            "workflow": wf_res.get("workflow", {})
        }), 200
    except Exception as e:
        logger.error(f"Failed to generate report: {e}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500

@report_bp.route("", methods=["GET"])
def list_reports():
    """List all generated reports with metadata."""
    try:
        with get_db() as conn:
            reports = conn.execute("SELECT id, title, report_type, reporting_period, subsidiary, status, summary, file_path, docx_path, human_approved, approved_by, created_at FROM reports ORDER BY id DESC").fetchall()
            return jsonify({
                "status": "success",
                "count": len(reports),
                "reports": reports
            }), 200
    except Exception as e:
        logger.error(f"Failed to list reports: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@report_bp.route("/<int:report_id>", methods=["GET"])
def get_report(report_id: int):
    """Retrieve full report content and HTML rendering."""
    try:
        with get_db() as conn:
            report = conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
            if not report:
                return jsonify({"status": "error", "message": "Report not found"}), 404

            # Parse content JSON if string
            content = json.loads(report["content_json"]) if report.get("content_json") else {}
            pdf_filename = Path(report["file_path"]).name if report.get("file_path") else None
            docx_filename = Path(report["docx_path"]).name if report.get("docx_path") else None

            return jsonify({
                "status": "success",
                "report": report,
                "content": content,
                "pdf_url": f"/api/reports/download/{pdf_filename}" if pdf_filename else None,
                "docx_url": f"/api/reports/download/{docx_filename}" if docx_filename else None
            }), 200
    except Exception as e:
        logger.error(f"Failed to fetch report {report_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@report_bp.route("/download/<path:filename>", methods=["GET"])
def download_report_file(filename: str):
    """Serve generated PDF or DOCX file with strict path sanitization."""
    try:
        safe_filename = Path(filename).name
        target_path = (GENERATED_REPORTS_DIR / safe_filename).resolve()
        reports_dir = GENERATED_REPORTS_DIR.resolve()
        
        # Verify file exists inside the reports directory
        if not target_path.exists() or not str(target_path).startswith(str(reports_dir)):
            return jsonify({"status": "error", "message": "File not found"}), 404
            
        return send_from_directory(str(reports_dir), safe_filename, as_attachment=True)
    except Exception as e:
        logger.error(f"Failed to download report file {filename}: {e}")
        return jsonify({"status": "error", "message": "File not found"}), 404


@report_bp.route("/<int:report_id>/approve", methods=["POST"])
@require_role(["ADMIN", "OFFICER"])
def approve_report(report_id: int):
    """Human-in-the-loop approval toggle for generated reports."""
    data = request.get_json() or {}
    current_role = get_current_user_role()
    approved_by = data.get("approved_by", f"Authorized Officer ({current_role})")

    try:
        with get_db() as conn:
            conn.execute(
                "UPDATE reports SET human_approved = 1, approved_by = ?, status = 'OFFICIALLY_APPROVED' WHERE id = ?",
                (approved_by, report_id)
            )
            log_audit("REPORT_HUMAN_APPROVED", user_role=current_role, resource_type="report", resource_id=report_id, details={"approved_by": approved_by})

        return jsonify({"status": "success", "message": "Report approved successfully"}), 200
    except Exception as e:
        logger.error(f"Failed to approve report {report_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@report_bp.route("/<int:report_id>/revoke", methods=["POST"])
@require_role(["ADMIN", "OFFICER"])
def revoke_report_approval(report_id: int):
    """Revoke accidental human approval, returning report back to DRAFT state."""
    current_role = get_current_user_role()
    try:
        with get_db() as conn:
            conn.execute(
                "UPDATE reports SET human_approved = 0, approved_by = NULL, status = 'DRAFT' WHERE id = ?",
                (report_id,)
            )
            log_audit("REPORT_APPROVAL_REVOKED", user_role=current_role, resource_type="report", resource_id=report_id, details={"action": "Revoked to Draft"})

        return jsonify({"status": "success", "message": "Report approval revoked. Reverted back to Draft."}), 200
    except Exception as e:
        logger.error(f"Failed to revoke approval for report {report_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@report_bp.route("/<int:report_id>", methods=["DELETE"])
@require_role(["ADMIN", "OFFICER"])
def delete_report(report_id: int):
    """Delete a report permanently (Admin and Officer only)."""
    current_role = get_current_user_role()
    try:
        with get_db() as conn:
            conn.execute("DELETE FROM reports WHERE id = ?", (report_id,))
            log_audit("REPORT_DELETED", user_role=current_role, resource_type="report", resource_id=report_id, details={"action": "Permanently deleted"})

        return jsonify({"status": "success", "message": f"Report #{report_id} permanently deleted."}), 200
    except Exception as e:
        logger.error(f"Failed to delete report {report_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

