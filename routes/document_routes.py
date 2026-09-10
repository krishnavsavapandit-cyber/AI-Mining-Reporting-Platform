"""
Document Management REST Routes for SIH26023.
Handles document upload, listing, inspection, deletion, and reprocessing via Manager Agent.
"""

import os
import shutil
import logging
from pathlib import Path
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from config.settings import UPLOAD_DIR, ALLOWED_EXTENSIONS, MAX_CONTENT_LENGTH
from database.db import get_db, log_audit
from agents.manager_agent import manager_agent
from routes.auth_middleware import require_role, get_current_user_role

logger = logging.getLogger(__name__)
document_bp = Blueprint("documents", __name__, url_prefix="/api/documents")

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@document_bp.route("", methods=["GET"])
def list_documents():
    """List documents with optional subsidiary, status, or search filters."""
    subsidiary = request.args.get("subsidiary")
    status = request.args.get("status")
    search = request.args.get("search")

    try:
        with get_db() as conn:
            sql = "SELECT * FROM documents WHERE 1=1"
            params = []

            if subsidiary:
                sql += " AND subsidiary = ?"
                params.append(subsidiary)
            if status:
                sql += " AND status = ?"
                params.append(status)
            if search:
                sql += " AND (original_name LIKE ? OR mine LIKE ?)"
                params.extend([f"%{search}%", f"%{search}%"])

            sql += " ORDER BY id DESC"
            docs = conn.execute(sql, params).fetchall()

            return jsonify({
                "status": "success",
                "count": len(docs),
                "documents": docs
            }), 200
    except Exception as e:
        logger.error(f"Failed to list documents: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@document_bp.route("/<int:doc_id>", methods=["GET"])
def get_document_details(doc_id: int):
    """Retrieve full document details, chunks, extracted records, and OCR metadata."""
    try:
        with get_db() as conn:
            doc = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
            if not doc:
                return jsonify({"status": "error", "message": "Document not found"}), 404

            chunks = conn.execute("SELECT * FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC", (doc_id,)).fetchall()
            records = conn.execute("SELECT * FROM extracted_data WHERE document_id = ? ORDER BY id ASC", (doc_id,)).fetchall()
            
            # Parse doc_metadata_json if present
            doc_dict = dict(doc)
            ocr_info = {}
            if doc_dict.get("doc_metadata_json"):
                try:
                    import json
                    meta = json.loads(doc_dict["doc_metadata_json"])
                    ocr_info = meta.get("ocr_summary", {})
                except Exception:
                    pass

            return jsonify({
                "status": "success",
                "document": doc_dict,
                "chunks_count": len(chunks),
                "chunks": chunks,
                "extracted_records_count": len(records),
                "extracted_records": records,
                "ocr_info": ocr_info
            }), 200
    except Exception as e:
        logger.error(f"Failed to get document details for id {doc_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@document_bp.route("/<int:doc_id>/ocr-status", methods=["GET"])
def get_document_ocr_status(doc_id: int):
    """Retrieve structured OCR processing status and quality metadata for a document."""
    try:
        with get_db() as conn:
            doc = conn.execute("SELECT id, original_name, file_type, page_count, status, doc_metadata_json FROM documents WHERE id = ?", (doc_id,)).fetchone()
            if not doc:
                return jsonify({"status": "error", "message": "Document not found"}), 404

            doc_dict = dict(doc)
            ocr_summary = {
                "ocr_performed": False,
                "status": "NOT_REQUIRED",
                "engine": "None",
                "quality": "NOT_REQUIRED",
                "confidence": 1.0,
                "human_review_required": False,
                "warnings": []
            }

            if doc_dict.get("doc_metadata_json"):
                try:
                    import json
                    meta = json.loads(doc_dict["doc_metadata_json"])
                    if "ocr_summary" in meta:
                        ocr_summary = meta["ocr_summary"]
                except Exception:
                    pass

            return jsonify({
                "status": "success",
                "document_id": doc_id,
                "original_name": doc_dict.get("original_name"),
                "file_type": doc_dict.get("file_type"),
                "ocr_status": ocr_summary
            }), 200
    except Exception as e:
        logger.error(f"Failed to get OCR status for document {doc_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@document_bp.route("/upload", methods=["POST"])
@require_role(["ADMIN", "OFFICER", "ANALYST"])
def upload_documents():
    """Upload one or more documents and trigger DocumentIntelligenceAgent workflow."""
    if "files" not in request.files and "file" not in request.files:
        return jsonify({"status": "error", "message": "No file part in request"}), 400

    uploaded_files = request.files.getlist("files") or [request.files["file"]]
    processed_results = []
    current_role = get_current_user_role()

    for file_obj in uploaded_files:
        if file_obj.filename == "":
            continue

        if not allowed_file(file_obj.filename):
            processed_results.append({
                "filename": file_obj.filename,
                "status": "FAILED",
                "error": f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            })
            continue

        orig_filename = secure_filename(file_obj.filename)
        # Unique disk filename
        timestamp_prefix = f"{int(os.times()[4])}_{orig_filename}"
        save_path = UPLOAD_DIR / timestamp_prefix
        
        try:
            file_obj.save(str(save_path))
            log_audit("DOCUMENT_UPLOADED", user_role=current_role, resource_type="document", details={"filename": orig_filename, "size": save_path.stat().st_size})

            # Run Document Processing via Manager Agent
            wf_result = manager_agent.run_document_processing_workflow(
                file_path_str=str(save_path),
                original_filename=orig_filename
            )
            processed_results.append({
                "filename": orig_filename,
                "status": wf_result.get("result", {}).get("status", "SUCCESS"),
                "result": wf_result.get("result", {}).get("result_data", {})
            })
        except Exception as e:
            logger.error(f"Error saving/processing uploaded file {orig_filename}: {e}")
            processed_results.append({
                "filename": orig_filename,
                "status": "FAILED",
                "error": str(e)
            })

    return jsonify({
        "status": "success",
        "processed_count": len(processed_results),
        "results": processed_results
    }), 200

@document_bp.route("/<int:doc_id>/reprocess", methods=["POST"])
@require_role(["ADMIN", "OFFICER", "ANALYST"])
def reprocess_document(doc_id: int):
    """Reprocess an existing document through DocumentIntelligenceAgent."""
    try:
        with get_db() as conn:
            doc = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
            if not doc:
                return jsonify({"status": "error", "message": "Document not found"}), 404

            file_path = doc["file_path"]
            orig_name = doc["original_name"]

        wf_result = manager_agent.run_document_processing_workflow(
            file_path_str=file_path,
            original_filename=orig_name,
            document_id=doc_id
        )

        return jsonify({
            "status": "success",
            "message": "Document reprocessed successfully",
            "workflow": wf_result
        }), 200
    except Exception as e:
        logger.error(f"Failed to reprocess document {doc_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@document_bp.route("/<int:doc_id>", methods=["DELETE"])
@require_role(["ADMIN"])
def delete_document(doc_id: int):
    """Delete a document and cascade associated chunks and records."""
    try:
        with get_db() as conn:
            doc = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
            if not doc:
                return jsonify({"status": "error", "message": "Document not found"}), 404

            file_path = Path(doc["file_path"])
            if file_path.exists():
                try:
                    file_path.unlink()
                except Exception:
                    pass

            conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
            log_audit("DOCUMENT_DELETED", user_role=get_current_user_role(), resource_type="document", resource_id=doc_id, details={"filename": doc["original_name"]})

        # Reindex vector store
        from agents.document_agent import DocumentIntelligenceAgent
        doc_agent = DocumentIntelligenceAgent()
        doc_agent._reindex_vector_store()

        return jsonify({"status": "success", "message": "Document deleted successfully"}), 200
    except Exception as e:
        logger.error(f"Failed to delete document {doc_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
