"""
Multi-Agent Orchestration & Observability REST Routes for SIH26023.
Exposes real-time 8-agent registry status, execution graphs, tasks, DAG telemetry,
HITL pause/resume checkpoints, and quality gate decisions.
"""

import json
import logging
import time
from flask import Blueprint, request, jsonify, g
from agents.agent_registry import agent_registry
from agents.manager_agent import manager_agent
from database.db import get_db, log_audit
from routes.auth_middleware import require_role, get_current_user_role

logger = logging.getLogger(__name__)
agent_bp = Blueprint("agents", __name__, url_prefix="/api/agents")

def get_current_role() -> str:
    """Helper to extract user role from session/headers for RBAC validation."""
    return get_current_user_role()

@agent_bp.route("/status", methods=["GET"])
def get_agent_status():
    """Retrieve status, capabilities, and real telemetry for all 8 logical agents."""
    try:
        agents_data = agent_registry.list_agents()
        return jsonify({
            "status": "success",
            "count": len(agents_data),
            "agents": agents_data,
            "architecture": "8-Agent Orchestration DAG Architecture"
        }), 200
    except Exception as e:
        logger.error(f"Failed to fetch agent status: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@agent_bp.route("/workflows", methods=["GET"])
def list_workflows():
    """List recent agent workflows with filtering."""
    limit = int(request.args.get("limit", 20))
    status_filter = request.args.get("status")
    try:
        with get_db() as conn:
            sql = "SELECT * FROM agent_workflows"
            params = []
            if status_filter:
                sql += " WHERE status = ?"
                params.append(status_filter)
            sql += " ORDER BY start_time DESC LIMIT ?"
            params.append(limit)

            workflows = conn.execute(sql, params).fetchall()

            return jsonify({
                "status": "success",
                "count": len(workflows),
                "workflows": workflows
            }), 200
    except Exception as e:
        logger.error(f"Failed to list workflows: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@agent_bp.route("/workflows", methods=["POST"])
@require_role(["ADMIN", "OFFICER", "ANALYST"])
def create_workflow():
    """Dynamically trigger a multi-agent workflow based on intent."""
    data = request.get_json() or {}
    intent = data.get("intent", "AI_ASSISTANT_QUERY")
    query = data.get("query", "")
    role = get_current_role()

    try:
        if intent in ("AI_ASSISTANT_QUERY", "QUERY"):
            res = manager_agent.run_query_workflow(
                query=query,
                user_role=role,
                filter_subsidiary=data.get("subsidiary")
            )
        elif intent in ("REPORT_GENERATION", "REPORT"):
            res = manager_agent.run_report_generation_workflow(
                report_type=data.get("report_type", "Consolidated Mining Production Report"),
                title=data.get("title", "CIL Mining Report"),
                subsidiary=data.get("subsidiary"),
                reporting_period=data.get("reporting_period"),
                instructions=data.get("instructions", "")
            )
        elif intent in ("PARLIAMENTARY_INQUIRY", "INQUIRY"):
            res = manager_agent.run_inquiry_workflow(
                question_text=query,
                inquiry_ref=data.get("inquiry_ref", "LS-STARRED-2026"),
                ministry_body=data.get("ministry_body", "Ministry of Coal / Lok Sabha")
            )
        elif intent == "DISCREPANCY_INVESTIGATION":
            res = manager_agent.run_discrepancy_investigation_workflow(query=query or "Rajmahal production discrepancy")
        else:
            plan = manager_agent.plan_execution(intent, data)
            return jsonify({"status": "success", "plan": plan}), 200

        return jsonify({"status": "success", "result": res}), 200
    except Exception as e:
        logger.error(f"Workflow execution failed: {e}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500

@agent_bp.route("/workflows/<workflow_id>", methods=["GET"])
def get_workflow_details(workflow_id: str):
    """Retrieve complete execution graph, tasks, results, and quality report for a workflow."""
    try:
        with get_db() as conn:
            wf = conn.execute("SELECT * FROM agent_workflows WHERE id = ?", (workflow_id,)).fetchone()
            if not wf:
                return jsonify({"status": "error", "message": "Workflow not found"}), 404

            tasks = conn.execute("SELECT * FROM agent_tasks WHERE workflow_id = ? ORDER BY id ASC", (workflow_id,)).fetchall()
            results = conn.execute("SELECT * FROM agent_results WHERE workflow_id = ? ORDER BY id ASC", (workflow_id,)).fetchall()

            for t in tasks:
                t["input_data"] = json.loads(t["input_data_json"]) if t.get("input_data_json") else {}
                t["evidence_requirements"] = json.loads(t["evidence_req_json"]) if t.get("evidence_req_json") else []
                t["dependencies"] = json.loads(t["dependencies_json"]) if t.get("dependencies_json") else []

            for r in results:
                r["result_data"] = json.loads(r["result_data_json"]) if r.get("result_data_json") else {}
                r["evidence"] = json.loads(r["evidence_json"]) if r.get("evidence_json") else []
                r["warnings"] = json.loads(r["warnings_json"]) if r.get("warnings_json") else []
                r["errors"] = json.loads(r["errors_json"]) if r.get("errors_json") else []
                r["sources"] = json.loads(r["sources_json"]) if r.get("sources_json") else []

            provenance = json.loads(wf["provenance_summary"]) if wf.get("provenance_summary") else []
            provenance_dag = json.loads(wf["provenance_dag_json"]) if wf.get("provenance_dag_json") else {"nodes": [], "edges": []}
            quality_report = json.loads(wf["quality_report_json"]) if wf.get("quality_report_json") else {}

            return jsonify({
                "status": "success",
                "workflow": wf,
                "provenance_log": provenance,
                "provenance_dag": provenance_dag,
                "quality_report": quality_report,
                "tasks_count": len(tasks),
                "tasks": tasks,
                "results_count": len(results),
                "results": results
            }), 200
    except Exception as e:
        logger.error(f"Failed to fetch workflow details for {workflow_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@agent_bp.route("/workflows/<workflow_id>/tasks", methods=["GET"])
def get_workflow_tasks(workflow_id: str):
    """Retrieve list of tasks with dependency mapping for a workflow."""
    try:
        with get_db() as conn:
            tasks = conn.execute("SELECT * FROM agent_tasks WHERE workflow_id = ? ORDER BY id ASC", (workflow_id,)).fetchall()
            for t in tasks:
                t["dependencies"] = json.loads(t["dependencies_json"]) if t.get("dependencies_json") else []
                t["input_data"] = json.loads(t["input_data_json"]) if t.get("input_data_json") else {}
            return jsonify({"status": "success", "count": len(tasks), "tasks": tasks}), 200
    except Exception as e:
        logger.error(f"Failed to fetch tasks for {workflow_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@agent_bp.route("/workflows/<workflow_id>/provenance-dag", methods=["GET"])
def get_workflow_provenance_dag(workflow_id: str):
    """Retrieve full interactive provenance DAG nodes and edges."""
    try:
        with get_db() as conn:
            wf = conn.execute("SELECT provenance_dag_json, status, quality_decision FROM agent_workflows WHERE id = ?", (workflow_id,)).fetchone()
            if not wf:
                return jsonify({"status": "error", "message": "Workflow not found"}), 404

            dag = json.loads(wf["provenance_dag_json"]) if wf.get("provenance_dag_json") else {"nodes": [], "edges": []}
            return jsonify({
                "status": "success",
                "workflow_id": workflow_id,
                "dag": dag,
                "quality_decision": wf.get("quality_decision")
            }), 200
    except Exception as e:
        logger.error(f"Failed to fetch provenance DAG for {workflow_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@agent_bp.route("/workflows/<workflow_id>/pause", methods=["POST"])
@require_role(["ADMIN", "OFFICER", "ANALYST"])
def pause_workflow(workflow_id: str):
    """Pause workflow for Human-in-the-Loop review."""
    data = request.get_json() or {}
    reason = data.get("reason", "Human review requested.")
    task_id = data.get("task_id", "current_task")
    state = data.get("state", {})

    success = manager_agent.pause_workflow(workflow_id, task_id, reason, state)
    if success:
        return jsonify({"status": "success", "message": f"Workflow {workflow_id} successfully paused."}), 200
    return jsonify({"status": "error", "message": "Failed to pause workflow."}), 500

@agent_bp.route("/workflows/<workflow_id>/resume", methods=["POST"])
@require_role(["ADMIN", "OFFICER", "ANALYST"])
def resume_workflow(workflow_id: str):
    """Resume paused workflow with reviewer credentials."""
    data = request.get_json() or {}
    reviewer = data.get("reviewer", "Lead Analyst")
    role = data.get("reviewer_role") or get_current_role()
    note = data.get("reviewer_note", "Discrepancy reviewed and approved.")

    state = manager_agent.resume_workflow(workflow_id, reviewer, role, note)
    if state is not None:
        return jsonify({"status": "success", "message": f"Workflow {workflow_id} resumed.", "state": state}), 200
    return jsonify({"status": "error", "message": "No paused checkpoint found to resume."}), 404

@agent_bp.route("/workflows/<workflow_id>/cancel", methods=["POST"])
@require_role(["ADMIN", "OFFICER", "ANALYST"])
def cancel_workflow(workflow_id: str):
    """Cancel a running or paused workflow safely."""
    try:
        with get_db() as conn:
            conn.execute("UPDATE agent_workflows SET status = 'CANCELLED' WHERE id = ?", (workflow_id,))
            log_audit("WORKFLOW_CANCELLED", user_role=get_current_role(), resource_type="workflow", resource_id=workflow_id)
        return jsonify({"status": "success", "message": f"Workflow {workflow_id} cancelled."}), 200
    except Exception as e:
        logger.error(f"Failed to cancel workflow {workflow_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
