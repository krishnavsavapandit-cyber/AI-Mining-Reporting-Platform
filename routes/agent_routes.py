"""
Multi-Agent Orchestration & Observability REST Routes for SIH26023.
Exposes real-time agent registry status, execution graphs, tasks, and provenance DAGs.
"""

import json
import logging
from flask import Blueprint, request, jsonify
from agents.agent_registry import agent_registry
from database.db import get_db

logger = logging.getLogger(__name__)
agent_bp = Blueprint("agents", __name__, url_prefix="/api/agents")

@agent_bp.route("/status", methods=["GET"])
def get_agent_status():
    """Retrieve status, capabilities, and telemetry for all active agents."""
    try:
        agents_data = agent_registry.list_agents()
        return jsonify({
            "status": "success",
            "count": len(agents_data),
            "agents": agents_data
        }), 200
    except Exception as e:
        logger.error(f"Failed to fetch agent status: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@agent_bp.route("/workflows", methods=["GET"])
def list_workflows():
    """List recent agent workflows."""
    limit = int(request.args.get("limit", 20))
    try:
        with get_db() as conn:
            workflows = conn.execute(
                "SELECT * FROM agent_workflows ORDER BY start_time DESC LIMIT ?",
                (limit,)
            ).fetchall()

            return jsonify({
                "status": "success",
                "count": len(workflows),
                "workflows": workflows
            }), 200
    except Exception as e:
        logger.error(f"Failed to list workflows: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@agent_bp.route("/workflows/<workflow_id>", methods=["GET"])
def get_workflow_details(workflow_id: str):
    """Retrieve complete execution graph, tasks, and results for a workflow."""
    try:
        with get_db() as conn:
            wf = conn.execute("SELECT * FROM agent_workflows WHERE id = ?", (workflow_id,)).fetchone()
            if not wf:
                return jsonify({"status": "error", "message": "Workflow not found"}), 404

            tasks = conn.execute("SELECT * FROM agent_tasks WHERE workflow_id = ? ORDER BY id ASC", (workflow_id,)).fetchall()
            results = conn.execute("SELECT * FROM agent_results WHERE workflow_id = ? ORDER BY id ASC", (workflow_id,)).fetchall()

            # Parse JSON fields
            for t in tasks:
                t["input_data"] = json.loads(t["input_data_json"]) if t.get("input_data_json") else {}
                t["evidence_requirements"] = json.loads(t["evidence_req_json"]) if t.get("evidence_req_json") else []

            for r in results:
                r["result_data"] = json.loads(r["result_data_json"]) if r.get("result_data_json") else {}
                r["evidence"] = json.loads(r["evidence_json"]) if r.get("evidence_json") else []
                r["warnings"] = json.loads(r["warnings_json"]) if r.get("warnings_json") else []
                r["errors"] = json.loads(r["errors_json"]) if r.get("errors_json") else []
                r["sources"] = json.loads(r["sources_json"]) if r.get("sources_json") else []

            provenance = json.loads(wf["provenance_summary"]) if wf.get("provenance_summary") else []

            return jsonify({
                "status": "success",
                "workflow": wf,
                "provenance_log": provenance,
                "tasks_count": len(tasks),
                "tasks": tasks,
                "results_count": len(results),
                "results": results
            }), 200
    except Exception as e:
        logger.error(f"Failed to fetch workflow details for {workflow_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
