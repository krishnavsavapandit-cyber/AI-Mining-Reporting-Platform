"""
Agent Registry and Inter-Agent Message Broker for SIH26023 Platform.
Maintains live agent references, dispatches tasks, and logs workflows to SQLite.
"""

import json
import logging
import time
from typing import Dict, Any, List, Optional
from agents.base_agent import BaseAgent
from agents.agent_messages import AgentTask, AgentResult, WorkflowContext
from database.db import get_db

logger = logging.getLogger(__name__)

class AgentRegistry:
    """Central registry and communication bus for all platform agents."""
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

    def get_agent(self, agent_name: str) -> Optional[BaseAgent]:
        """Retrieve registered agent by name."""
        return self._agents.get(agent_name)

    def list_agents(self) -> List[Dict[str, Any]]:
        """List all registered agents and their health metrics."""
        return [agent.get_health() for agent in self._agents.values()]

    def dispatch_task(self, task: AgentTask, context: WorkflowContext) -> AgentResult:
        """Route and execute task on the destination agent."""
        agent = self.get_agent(task.destination_agent)
        if not agent:
            error_msg = f"Destination agent '{task.destination_agent}' not found in registry."
            logger.error(error_msg)
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

        # Log task dispatch to DB
        self._persist_task(task)

        # Execute
        result = agent.process(task, context)

        # Record result in context and DB
        context.tasks[task.task_id] = task
        context.results[task.task_id] = result
        if result.evidence:
            context.accumulated_evidence.extend(result.evidence)

        self._persist_result(result)
        return result

    def _persist_task(self, task: AgentTask):
        """Record task into SQLite database."""
        try:
            with get_db() as conn:
                conn.execute(
                    """
                    INSERT INTO agent_tasks 
                    (workflow_id, task_id, source_agent, destination_agent, task_type, input_data_json, evidence_req_json, priority, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT (task_id) DO UPDATE SET
                        source_agent = EXCLUDED.source_agent,
                        destination_agent = EXCLUDED.destination_agent,
                        task_type = EXCLUDED.task_type,
                        input_data_json = EXCLUDED.input_data_json,
                        evidence_req_json = EXCLUDED.evidence_req_json,
                        priority = EXCLUDED.priority,
                        status = EXCLUDED.status
                    """,
                    (
                        task.workflow_id,
                        task.task_id,
                        task.source_agent,
                        task.destination_agent,
                        task.task_type,
                        json.dumps(task.input_data or {}),
                        json.dumps(task.evidence_requirements or []),
                        task.priority,
                        task.status
                    )
                )
        except Exception as e:
            logger.error(f"Failed to persist task {task.task_id}: {e}")

    def _persist_result(self, result: AgentResult):
        """Record agent result into SQLite database."""
        try:
            with get_db() as conn:
                conn.execute(
                    """
                    INSERT INTO agent_results 
                    (workflow_id, task_id, agent_name, status, result_data_json, evidence_json, confidence, warnings_json, errors_json, sources_json, next_action, execution_time_ms)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        result.workflow_id,
                        result.task_id,
                        result.agent_name,
                        result.status,
                        json.dumps(result.result_data or {}),
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
                    SET status = ?, end_time = CURRENT_TIMESTAMP, error_message = ?, provenance_summary = ?
                    WHERE id = ?
                    """,
                    (
                        context.status,
                        context.error,
                        json.dumps(context.provenance_log),
                        context.workflow_id
                    )
                )
        except Exception as e:
            logger.error(f"Failed to persist workflow end {context.workflow_id}: {e}")

# Global singleton instance
agent_registry = AgentRegistry()
