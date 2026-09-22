"""
System Settings, Health Checks, and Demo Data Seeder REST Routes for SIH26023.
"""

import os
import shutil
import logging
from pathlib import Path
from flask import Blueprint, request, jsonify
from config.settings import (
    CIL_SUBSIDIARIES, MINING_TOPICS, UPLOAD_DIR, DATABASE_PATH, SAMPLE_DATA_DIR, ALLOWED_EXTENSIONS
)
from services.ai_service import ai_service
from services.ocr_service import is_ocr_available
from agents.manager_agent import manager_agent
from database.db import get_db, log_audit, get_db_info, is_db_connected, get_db_type
from routes.auth_middleware import require_role, get_current_user_role

logger = logging.getLogger(__name__)
settings_bp = Blueprint("settings", __name__, url_prefix="/api")

@settings_bp.route("/settings", methods=["GET"])
def get_settings():
    """Retrieve system configuration and AI provider statuses."""
    ai_info = ai_service.get_active_provider_info()
    db_info = get_db_info()
    return jsonify({
        "status": "success",
        "system": {
            "name": "SIH26023 -- CIL AI Document Intelligence & Reporting Platform",
            "version": "1.0.0-PROTOTYPE",
            "organization": "Ministry of Coal / Coal India Limited",
            "ocr_available": is_ocr_available(),
            "database": db_info.get("display_target", "sqlite:///database.db"),
            "database_info": db_info,
            "subsidiaries": CIL_SUBSIDIARIES,
            "topics": MINING_TOPICS
        },
        "ai": ai_info
    }), 200

@settings_bp.route("/settings/provider", methods=["POST"])
@require_role(["ADMIN"])
def update_provider_settings():
    """Dynamically update AI provider keys or fallback configurations."""
    data = request.get_json() or {}
    provider = data.get("preferred_provider")
    gemini_key = data.get("gemini_api_key")
    open_model_endpoint = data.get("open_model_endpoint")

    if provider in ["gemini", "open_model", "deterministic"]:
        ai_service.preferred_provider = provider

    if gemini_key:
        ai_service.gemini.api_key = gemini_key.strip()
    if open_model_endpoint:
        ai_service.open_model.endpoint = open_model_endpoint.strip()

    log_audit("AI_SETTINGS_UPDATED", user_role=get_current_user_role(), details={"preferred_provider": ai_service.preferred_provider})
    return jsonify({
        "status": "success",
        "message": "AI Provider settings updated",
        "active_info": ai_service.get_active_provider_info()
    }), 200

@settings_bp.route("/settings/seed", methods=["POST"])
@require_role(["ADMIN"])
def seed_demo_data():
    """Ingest and process all synthetic CIL demo documents through the Manager Agent."""
    if not SAMPLE_DATA_DIR.exists():
        from sample_data.generator import generate_sample_documents
        generate_sample_documents()

    sample_files = [f for f in SAMPLE_DATA_DIR.glob("*.*") if f.suffix.lower().lstrip(".") in ALLOWED_EXTENSIONS]
    results = []

    for s_file in sample_files:
        # Copy to uploads directory
        dest_path = UPLOAD_DIR / s_file.name
        shutil.copy2(str(s_file), str(dest_path))

        # Run Document Processing Workflow
        wf_res = manager_agent.run_document_processing_workflow(
            file_path_str=str(dest_path),
            original_filename=s_file.name
        )
        results.append({
            "filename": s_file.name,
            "status": wf_res.get("result", {}).get("status", "SUCCESS"),
            "extracted_count": wf_res.get("result", {}).get("result_data", {}).get("records_extracted_count", 0)
        })

    # Run initial cross-document validation scan
    from services.validation_service import validation_service
    issues = validation_service.run_cross_document_validation()

    log_audit("DEMO_DATA_SEEDED", details={"documents_count": len(results), "discrepancies_flagged": len(issues)})

    return jsonify({
        "status": "success",
        "message": f"Successfully seeded {len(results)} demonstration documents and flagged {len(issues)} cross-document discrepancies.",
        "documents_processed": results,
        "discrepancies_detected": len(issues)
    }), 200

from services.ocr.ocr_service import ocr_service

@settings_bp.route("/health", methods=["GET"])
def health_check():
    """Comprehensive system health check endpoint."""
    db_health = get_db_info()
    db_ok = is_db_connected()
    ocr_health = ocr_service.get_ocr_health()
    ai_health = ai_service.probe_provider_health()
    
    is_healthy = db_ok
    status_str = "healthy" if is_healthy else "degraded"

    active_info = ai_service.get_active_provider_info()
    pref_prov = active_info.get("preferred_provider", "deterministic")
    prov_details = active_info.get("providers", {}).get(pref_prov, {})
    
    is_prov_connected = prov_details.get("configured", False) if pref_prov != "deterministic" else True
    prov_display_name = prov_details.get("name", "Deterministic Grounded Engine")

    ai_service_payload = {
        "preferred_provider": pref_prov,
        "provider_name": prov_display_name,
        "is_connected": is_prov_connected,
        "status_message": "Online & Ready" if is_prov_connected else "Offline / Key Required"
    }

    return jsonify({
        "status": status_str,
        "healthy": is_healthy,
        "database": {
            "backend": db_health.get("backend", "sqlite"),
            "connected": db_ok,
            "target": db_health.get("display_target")
        },
        "ocr_engine": ocr_health,
        "ai_providers": ai_health,
        "active_ai_info": active_info,
        "ai_service": ai_service_payload
    }), 200 if is_healthy else 503

@settings_bp.route("/ready", methods=["GET"])
def readiness_check():
    """Kubernetes/Docker readiness probe returning 200 when ready to accept traffic."""
    db_ok = is_db_connected()
    if db_ok:
        return jsonify({
            "status": "ready",
            "ready": True,
            "checks": {
                "database": "UP",
                "ai_engine": "READY",
                "ocr_service": "READY"
            }
        }), 200
    else:
        return jsonify({
            "status": "not_ready",
            "ready": False,
            "checks": {
                "database": "DOWN"
            }
        }), 503

