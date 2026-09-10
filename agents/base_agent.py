"""
Base Agent Abstract Class for SIH26023 Multi-Agent Platform.
Provides lifecycle hooks, execution metrics, error safety, and logging.
"""

import time
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from agents.agent_messages import (
    AgentTask, AgentResult, AgentStatusCode, WorkflowContext, EvidenceItem
)

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """Abstract Base Class for all specialized agents in the CIL Mining Platform."""

    def __init__(self, name: str, description: str, capabilities: List[str]):
        self.name = name
        self.description = description
        self.capabilities = capabilities
        self.status = AgentStatusCode.IDLE
        self.total_tasks_processed = 0
        self.total_errors = 0
        self.last_active = time.time()

    def process(self, task: AgentTask, context: WorkflowContext) -> AgentResult:
        """
        Public wrapper around _execute that handles status transitions,
        metric recording, error interception, and timing.
        """
        self.status = AgentStatusCode.BUSY
        self.last_active = time.time()
        start_time = time.time()

        try:
            logger.info(f"[{self.name}] Executing task: {task.task_id} (type: {task.task_type})")
            context.add_provenance(self.name, f"STARTED_{task.task_type}", {"task_id": task.task_id})

            result = self._execute(task, context)
            
            elapsed_ms = int((time.time() - start_time) * 1000)
            result.execution_time_ms = elapsed_ms
            
            self.total_tasks_processed += 1
            self.status = AgentStatusCode.IDLE
            
            context.add_provenance(self.name, f"COMPLETED_{task.task_type}", {
                "task_id": task.task_id,
                "status": result.status,
                "evidence_count": len(result.evidence),
                "duration_ms": elapsed_ms
            })
            
            return result

        except Exception as e:
            self.total_errors += 1
            self.status = AgentStatusCode.ERROR
            elapsed_ms = int((time.time() - start_time) * 1000)
            logger.error(f"[{self.name}] Task {task.task_id} failed with error: {e}", exc_info=True)
            
            context.add_provenance(self.name, f"FAILED_{task.task_type}", {
                "task_id": task.task_id,
                "error": str(e),
                "duration_ms": elapsed_ms
            })
            
            return AgentResult(
                task_id=task.task_id,
                workflow_id=task.workflow_id,
                agent_name=self.name,
                status="FAILED",
                result_data={},
                evidence=[],
                confidence=0.0,
                warnings=[],
                errors=[str(e)],
                sources=[],
                next_action="HANDLE_ERROR",
                execution_time_ms=elapsed_ms
            )

    @abstractmethod
    def _execute(self, task: AgentTask, context: WorkflowContext) -> AgentResult:
        """Concrete agent logic implemented by subclasses."""
        pass

    def get_health(self) -> Dict[str, Any]:
        """Return agent status and health metrics."""
        return {
            "name": self.name,
            "description": self.description,
            "capabilities": self.capabilities,
            "status": self.status,
            "tasks_processed": self.total_tasks_processed,
            "errors": self.total_errors,
            "last_active": self.last_active
        }
