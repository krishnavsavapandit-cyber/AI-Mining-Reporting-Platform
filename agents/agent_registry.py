"""
Agent Registry and Inter-Agent Message Broker for SIH26023 Platform.
Maintains live agent references for all 8 agents, dispatches tasks,
handles DAG dependencies, bounded retries, timeouts, and state persistence.
"""

import json
import logging
import time
from typing import Dict, Any, List, Optional
from agents.base_agent import BaseAgent
from agents.agent_messages import (
    AgentTask, AgentResult, WorkflowContext, WorkflowStatus, QualityGateDecision
)
from database.db import get_db

from config.settings import (
    AGENT_TASK_TIMEOUT_SECONDS,
    MAX_TASK_RETRIES,
    RETRY_BACKOFF_FACTOR
)

logger = logging.getLogger(__name__)

# Canonical 8-agent logical ID mappings
AGENT_ALIAS_MAP = {
    "manager": "ManagerAgent",
    "manager_agent": "ManagerAgent",
    "document": "DocumentIntelligenceAgent",
    "document_intelligence": "DocumentIntelligenceAgent",
    "document_agent": "DocumentIntelligenceAgent",
    "retrieval": "RetrievalAgent",
    "retrieval_evidence": "RetrievalAgent",
    "retrieval_agent": "RetrievalAgent",
    "mining": "MiningIntelligenceAgent",
    "mining_intelligence": "MiningIntelligenceAgent",
    "mining_agent": "MiningIntelligenceAgent",
    "validation": "ValidationAgent",
    "validation_audit": "ValidationAgent",
    "validation_agent": "ValidationAgent",
    "report": "ReportGenerationAgent",
    "report_generation": "ReportGenerationAgent",
    "report_agent": "ReportGenerationAgent",
    "inquiry": "GovernmentInquiryAgent",
    "government_inquiry": "GovernmentInquiryAgent",
    "inquiry_agent": "GovernmentInquiryAgent",
    "quality": "QualityGovernanceAgent",
    "quality_governance": "QualityGovernanceAgent",
    "quality_agent": "QualityGovernanceAgent"
}

class AgentRegistry:
    """Central registry and communication bus for all 8 platform agents."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AgentRegistry, cls).__new__(cls)
            cls._instance._agents = {}
            cls._instance._active_workflows = {}
        return cls._instance

    def register_agent(self, agent: BaseAgent):
        """Register a specialized agent instance."""
        self._agents[agent.name] = agent
        logger.info(f"Registered agent: {agent.name} with capabilities: {agent.capabilities}")

    def get_agent(self, agent_name_or_alias: str) -> Optional[BaseAgent]:
        """Retrieve registered agent by canonical name or alias."""
        if agent_name_or_alias in self._agents:
            return self._agents[agent_name_or_alias]
        canonical = AGENT_ALIAS_MAP.get(agent_name_or_alias.lower())
        if canonical and canonical in self._agents:
            return self._agents[canonical]
        return None

    def list_agents(self) -> List[Dict[str, Any]]:
        """List all registered agents and their health metrics."""
        return [agent.get_health() for agent in self._agents.values()]

    def get_registered_agent_names(self) -> List[str]:
        """Return list of canonical registered agent names."""
        return list(self._agents.keys())

    def dispatch_task(self, task: AgentTask, context: WorkflowContext) -> AgentResult:
        """Route and execute task on the destination agent with bounded retries and timeout awareness."""
        agent = self.get_agent(task.destination_agent)
        if not agent:
            error_msg = f"Destination agent '{task.destination_agent}' not found in 8-agent registry."
            logger.error(error_msg)
            task.status = "FAILED"
            task.error_message = error_msg
            task.completed_at = time.time()
            self._persist_task(task)
            return AgentResult(
                task_id=task.task_id,
                workflow_id=task.workflow_id,
                agent_name=task.destination_agent,
                status="FAILED",
                result_data={},
                evidence=[],
                confidence=0.0,
                warnings=[],
                errors=[error_msg],
                sources=[]
            )

        task.status = "RUNNING"
        task.started_at = time.time()
        effective_timeout = task.timeout_seconds if task.timeout_seconds else AGENT_TASK_TIMEOUT_SECONDS
        task.timeout_seconds = effective_timeout
        effective_max_retries = task.max_retries if task.max_retries is not None else MAX_TASK_RETRIES
        task.max_retries = effective_max_retries
        self._persist_task(task)

        # Bounded retry loop for transient agent execution with exponential backoff
        last_result = None
        for attempt in range(task.retry_count, task.max_retries + 1):
            task.retry_count = attempt
            start_t = time.time()
            try:
                result = agent.process(task, context)
                elapsed = time.time() - start_t
                
                # Check for timeout
                if effective_timeout and elapsed > effective_timeout:
                    logger.warning(f"Task {task.task_id} timed out after {elapsed:.2f}s (limit: {effective_timeout}s)")
                    result.status = "TIMEOUT"
                    result.errors.append(f"Task timed out after {elapsed:.2f}s (threshold: {effective_timeout}s).")
                    task.status = "TIMEOUT"
                else:
                    task.status = "COMPLETED" if result.status in ("SUCCESS", "PARTIAL") else result.status

                task.completed_at = time.time()
                last_result = result

                # If successful or requires human review or explicitly rejected, don't retry
                if result.status in ("SUCCESS", "PARTIAL", "REQUIRES_HUMAN_REVIEW", "REJECTED"):
                    break
                elif attempt < task.max_retries:
                    backoff = 0.1 * (RETRY_BACKOFF_FACTOR ** attempt)
                    logger.warning(f"Task {task.task_id} returned {result.status}, retrying ({attempt + 1}/{task.max_retries}) in {backoff:.2f}s...")
                    time.sleep(backoff)

            except Exception as e:
                logger.error(f"Execution error on task {task.task_id} (attempt {attempt}): {e}")
                task.status = "FAILED"
                task.error_message = str(e)
                task.completed_at = time.time()
                last_result = AgentResult(
                    task_id=task.task_id,
                    workflow_id=task.workflow_id,
                    agent_name=agent.name,
                    status="FAILED",
                    result_data={},
                    evidence=[],
                    confidence=0.0,
                    warnings=[],
                    errors=[str(e)],
                    sources=[]
                )
                if attempt < task.max_retries:
                    backoff = 0.1 * (RETRY_BACKOFF_FACTOR ** attempt)
                    time.sleep(backoff)

        # Record result in context and database
        context.tasks[task.task_id] = task
        if last_result:
            context.results[task.task_id] = last_result
            if last_result.evidence:
                context.accumulated_evidence.extend(last_result.evidence)
            self._persist_result(last_result)

        self._persist_task(task)
        return last_result

    def _persist_task(self, task: AgentTask):
        """Record task into database."""
        try:
            with get_db() as conn:
                conn.execute(
                    """
                    INSERT INTO agent_tasks 
                    (workflow_id, task_id, source_agent, destination_agent, task_type, input_data_json, evidence_req_json, dependencies_json, priority, status, timeout_seconds, retry_count, error_message, completed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT (task_id) DO UPDATE SET
                        source_agent = EXCLUDED.source_agent,
                        destination_agent = EXCLUDED.destination_agent,
                        task_type = EXCLUDED.task_type,
                        input_data_json = EXCLUDED.input_data_json,
                        evidence_req_json = EXCLUDED.evidence_req_json,
                        dependencies_json = EXCLUDED.dependencies_json,
                        priority = EXCLUDED.priority,
                        status = EXCLUDED.status,
                        timeout_seconds = EXCLUDED.timeout_seconds,
                        retry_count = EXCLUDED.retry_count,
                        error_message = EXCLUDED.error_message,
                        completed_at = EXCLUDED.completed_at
                    """,
                    (
                        task.workflow_id,
                        task.task_id,
                        task.source_agent,
                        task.destination_agent,
                        task.task_type,
                        json.dumps(task.input_data or {}),
                        json.dumps(task.evidence_requirements or []),
                        json.dumps(task.dependencies or []),
                        task.priority,
                        task.status,
                        task.timeout_seconds,
                        task.retry_count,
                        task.error_message,
                        task.completed_at
                    )
                )
        except Exception as e:
            logger.error(f"Failed to persist task {task.task_id}: {e}")

    def _persist_result(self, result: AgentResult):
        """Record agent result into database."""
        try:
            with get_db() as conn:
                conn.execute(
                    """
                    INSERT INTO agent_results 
                    (workflow_id, task_id, agent_name, agent_id, status, result_data_json, evidence_json, confidence, warnings_json, errors_json, sources_json, next_action, execution_time_ms)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        result.workflow_id,
                        result.task_id,
                        result.agent_name,
                        result.agent_id or result.agent_name,
                        result.status,
                        json.dumps(result.result_data or result.structured_data or {}),
                        json.dumps([e.to_dict() if hasattr(e, 'to_dict') else e for e in result.evidence]),
                        result.confidence,
                        json.dumps(result.warnings or []),
                        json.dumps(result.errors or []),
                        json.dumps(result.sources or []),
                        result.next_action,
                        result.execution_time_ms
                    )
                )
        except Exception as e:
            logger.error(f"Failed to persist agent result {result.task_id}: {e}")

    def persist_workflow_start(self, context: WorkflowContext):
        """Save workflow start record in DB."""
        try:
            with get_db() as conn:
                conn.execute(
                    """
                    INSERT INTO agent_workflows
                    (id, workflow_type, initial_prompt, status, start_time, created_by)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
                    ON CONFLICT (id) DO UPDATE SET
                        workflow_type = EXCLUDED.workflow_type,
                        initial_prompt = EXCLUDED.initial_prompt,
                        status = EXCLUDED.status,
                        created_by = EXCLUDED.created_by
                    """,
                    (context.workflow_id, context.workflow_type, context.initial_prompt, context.status, context.created_by)
                )
        except Exception as e:
            logger.error(f"Failed to persist workflow start {context.workflow_id}: {e}")

    def persist_workflow_end(self, context: WorkflowContext):
        """Save workflow completion / error state in DB."""
        try:
            with get_db() as conn:
                conn.execute(
                    """
                    UPDATE agent_workflows
                    SET status = ?, end_time = CURRENT_TIMESTAMP, error_message = ?, provenance_summary = ?,
                        quality_decision = ?, paused_reason = ?, resume_state_json = ?, quality_report_json = ?, provenance_dag_json = ?
                    WHERE id = ?
                    """,
                    (
                        context.status,
                        context.error,
                        json.dumps(context.provenance_log),
                        context.quality_decision,
                        context.paused_reason,
                        json.dumps(context.resume_state) if context.resume_state else None,
                        json.dumps(context.quality_report) if context.quality_report else None,
                        json.dumps(context.provenance_dag),
                        context.workflow_id
                    )
                )
        except Exception as e:
            logger.error(f"Failed to persist workflow end {context.workflow_id}: {e}")

    def save_checkpoint(self, workflow_id: str, paused_task_id: str, reason: str, state: Dict[str, Any], reviewer: Optional[str] = None, role: Optional[str] = None) -> int:
        """Save HITL checkpoint for pause/resume lifecycle."""
        try:
            with get_db() as conn:
                cur = conn.execute(
                    """
                    INSERT INTO workflow_checkpoints
                    (workflow_id, paused_task_id, paused_reason, state_json, reviewer, reviewer_role, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'PAUSED')
                    """,
                    (workflow_id, paused_task_id, reason, json.dumps(state), reviewer, role)
                )
                return cur.lastrowid
        except Exception as e:
            logger.error(f"Failed to save workflow checkpoint {workflow_id}: {e}")
            return 0

    def resume_checkpoint(self, workflow_id: str, reviewer: str, reviewer_role: str, reviewer_note: str) -> Optional[Dict[str, Any]]:
        """Retrieve and mark latest checkpoint resumed."""
        try:
            with get_db() as conn:
                row = conn.execute(
                    """
                    SELECT * FROM workflow_checkpoints 
                    WHERE workflow_id = ? AND status = 'PAUSED' 
                    ORDER BY id DESC LIMIT 1
                    """,
                    (workflow_id,)
                ).fetchone()
                if not row:
                    return None

                checkpoint_id = row["id"]
                conn.execute(
                    """
                    UPDATE workflow_checkpoints
                    SET status = 'RESUMED', reviewer = ?, reviewer_role = ?, reviewer_note = ?, resumed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """,
                    (reviewer, reviewer_role, reviewer_note, checkpoint_id)
                )
                state = json.loads(row["state_json"])
                return state
        except Exception as e:
            logger.error(f"Failed to resume checkpoint {workflow_id}: {e}")
            return None

# Global singleton instance
agent_registry = AgentRegistry()
