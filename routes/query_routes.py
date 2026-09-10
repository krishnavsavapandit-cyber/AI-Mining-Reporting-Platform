"""
Mining Intelligence Assistant Query REST Routes for SIH26023.
Handles conversational questions and triggers multi-agent inquiry workflows.
"""

import logging
from flask import Blueprint, request, jsonify
from agents.manager_agent import manager_agent
from database.db import get_db

logger = logging.getLogger(__name__)
query_bp = Blueprint("query", __name__, url_prefix="/api/query")

@query_bp.route("", methods=["POST"])
def ask_question():
    """Execute grounded question answering through multi-agent orchestration."""
    data = request.get_json() or {}
    query = data.get("query", "").strip()
    user_role = data.get("user_role", "Analyst")
    filter_sub = data.get("subsidiary")
    history = data.get("chat_history", [])

    if not query:
        return jsonify({"status": "error", "message": "Query cannot be empty"}), 400

    try:
        wf_res = manager_agent.run_query_workflow(
            query=query,
            user_role=user_role,
            filter_subsidiary=filter_sub,
            chat_history=history
        )

        return jsonify({
            "status": "success",
            "answer": wf_res.get("answer"),
            "provider_info": wf_res.get("provider_info"),
            "evidence": wf_res.get("evidence"),
            "sources": wf_res.get("sources"),
            "validation_warnings": wf_res.get("validation_warnings"),
            "duration_ms": wf_res.get("duration_ms"),
            "workflow": wf_res.get("workflow")
        }), 200
    except Exception as e:
        logger.error(f"Query API error: {e}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500

@query_bp.route("/history", methods=["GET"])
def get_query_history():
    """Fetch recent AI queries and execution metrics."""
    try:
        with get_db() as conn:
            queries = conn.execute(
                "SELECT * FROM queries ORDER BY id DESC LIMIT 25"
            ).fetchall()

            return jsonify({
                "status": "success",
                "count": len(queries),
                "queries": queries
            }), 200
    except Exception as e:
        logger.error(f"Failed to fetch query history: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
