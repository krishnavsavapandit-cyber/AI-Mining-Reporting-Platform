"""
Structured Agent Messaging Architecture for SIH26023 Multi-Agent Platform.
Provides formal types, data models, evidence envelopes, DAG tracking, and serialization helpers.
"""

from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional, Union
import uuid
import time

class WorkflowStatus:
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REQUIRES_HUMAN_REVIEW = "REQUIRES_HUMAN_REVIEW"
    REJECTED = "REJECTED"

class QualityGateDecision:
    PASS = "PASS"
    WARNING = "WARNING"
    REJECT = "REJECT"
    REQUIRES_HUMAN_REVIEW = "REQUIRES_HUMAN_REVIEW"

class AgentStatusCode:
    IDLE = "IDLE"
    BUSY = "BUSY"
    ERROR = "ERROR"
    OFFLINE = "OFFLINE"

class ProvenanceEdgeType:
    SOURCE_OF = "SOURCE_OF"
    EXTRACTED_FROM = "EXTRACTED_FROM"
    RETRIEVED_FOR = "RETRIEVED_FOR"
    DERIVED_FROM = "DERIVED_FROM"
    VALIDATED_BY = "VALIDATED_BY"
    GENERATED_FROM = "GENERATED_FROM"
    APPROVED_BY = "APPROVED_BY"
    REJECTED_BY = "REJECTED_BY"

@dataclass
class EvidenceItem:
    """Individual piece of grounded evidence extracted from a source document."""
    document_id: Optional[int]
    document_name: str
    page_number: int
    section_title: str
    source_text: str
    relevance_score: float = 1.0
    field_name: Optional[str] = None
    extracted_value: Optional[Any] = None
    confidence: float = 1.0
    producing_agent: str = "RetrievalAgent"
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "EvidenceItem":
        return cls(**data)

@dataclass
class AgentTask:
    """Structured task dispatched from Manager or between collaborating agents in a DAG."""
    task_id: str
    workflow_id: str
    source_agent: str
    destination_agent: str
    task_type: str
    input_data: Dict[str, Any] = field(default_factory=dict)
    evidence_requirements: List[str] = field(default_factory=list)
    priority: int = 2
    status: str = "PENDING"  # PENDING, RUNNING, COMPLETED, FAILED, TIMEOUT, SKIPPED, PAUSED
    dependencies: List[str] = field(default_factory=list)
    timeout_seconds: float = 30.0
    retry_count: int = 0
    max_retries: int = 2
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    error_message: Optional[str] = None
    created_at: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AgentTask":
        return cls(**data)

@dataclass
class AgentResult:
    """Structured result returned by a specialized agent to the Manager or peer agent."""
    task_id: str
    workflow_id: str
    agent_name: str
    status: str  # SUCCESS, PARTIAL, FAILED, TIMEOUT, REQUIRES_HUMAN_REVIEW, REJECTED
    result_data: Dict[str, Any] = field(default_factory=dict)
    evidence: List[EvidenceItem] = field(default_factory=list)
    confidence: float = 1.0
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    sources: List[Dict[str, Any]] = field(default_factory=list)
    next_action: Optional[str] = None
    execution_time_ms: int = 0
    agent_id: Optional[str] = None
    summary: Optional[str] = None
    structured_data: Dict[str, Any] = field(default_factory=dict)
    metrics: Dict[str, Any] = field(default_factory=dict)
    provenance: List[Dict[str, Any]] = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)

    def __post_init__(self):
        # Synchronize result_data and structured_data for complete backwards/forwards compatibility
        if self.result_data and not self.structured_data:
            self.structured_data = self.result_data
        elif self.structured_data and not self.result_data:
            self.result_data = self.structured_data
        if not self.summary:
            if "answer" in self.result_data:
                self.summary = str(self.result_data["answer"])[:200]
            elif "message" in self.result_data:
                self.summary = str(self.result_data["message"])[:200]
            elif self.errors:
                self.summary = f"Errors: {'; '.join(self.errors)}"
            else:
                self.summary = f"Completed by {self.agent_name}"

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d['evidence'] = [e.to_dict() if isinstance(e, EvidenceItem) else e for e in self.evidence]
        return d

@dataclass
class AgentMessage:
    """Inter-agent notification or query message envelope."""
    message_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    sender: str = ""
    receiver: str = ""
    message_type: str = "NOTIFICATION"
    payload: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)

@dataclass
class WorkflowContext:
    """State container tracking multi-agent execution pipeline, DAG, and provenance."""
    workflow_id: str
    workflow_type: str
    initial_prompt: str
    status: str = WorkflowStatus.RUNNING
    current_step: int = 0
    total_steps: int = 0
    tasks: Dict[str, AgentTask] = field(default_factory=dict)
    results: Dict[str, AgentResult] = field(default_factory=dict)
    accumulated_evidence: List[EvidenceItem] = field(default_factory=list)
    provenance_log: List[Dict[str, Any]] = field(default_factory=list)
    provenance_dag: Dict[str, Any] = field(default_factory=lambda: {"nodes": [], "edges": []})
    final_output: Optional[Dict[str, Any]] = None
    start_time: float = field(default_factory=time.time)
    end_time: Optional[float] = None
    created_by: str = "System"
    error: Optional[str] = None
    paused_reason: Optional[str] = None
    resume_state: Optional[Dict[str, Any]] = None
    quality_decision: Optional[str] = None
    quality_report: Optional[Dict[str, Any]] = None

    def add_provenance(self, agent: str, action: str, details: Dict[str, Any]):
        self.provenance_log.append({
            "timestamp": time.time(),
            "agent": agent,
            "action": action,
            "details": details
        })

    def add_dag_node(self, node_id: str, node_type: str, label: str, metadata: Optional[Dict[str, Any]] = None):
        """Add node to provenance DAG if not already present."""
        for n in self.provenance_dag["nodes"]:
            if n["id"] == node_id:
                return
        self.provenance_dag["nodes"].append({
            "id": node_id,
            "type": node_type,  # USER_REQUEST, DOCUMENT, EXTRACTION, EVIDENCE, FACT, VALIDATION, REPORT, INQUIRY, QUALITY_GATE
            "label": label,
            "metadata": metadata or {},
            "timestamp": time.time()
        })

    def add_dag_edge(self, source: str, target: str, relation: str, metadata: Optional[Dict[str, Any]] = None):
        """Add directed edge with relationship type to provenance DAG."""
        self.provenance_dag["edges"].append({
            "source": source,
            "target": target,
            "relation": relation,  # SOURCE_OF, EXTRACTED_FROM, RETRIEVED_FOR, DERIVED_FROM, VALIDATED_BY, GENERATED_FROM, APPROVED_BY, REJECTED_BY
            "metadata": metadata or {},
            "timestamp": time.time()
        })

    def to_dict(self) -> Dict[str, Any]:
        return {
            "workflow_id": self.workflow_id,
            "workflow_type": self.workflow_type,
            "initial_prompt": self.initial_prompt,
            "status": self.status,
            "current_step": self.current_step,
            "total_steps": self.total_steps,
            "tasks": {k: v.to_dict() for k, v in self.tasks.items()},
            "results": {k: v.to_dict() for k, v in self.results.items()},
            "evidence_count": len(self.accumulated_evidence),
            "evidence": [e.to_dict() for e in self.accumulated_evidence],
            "provenance_log": self.provenance_log,
            "provenance_dag": self.provenance_dag,
            "final_output": self.final_output,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration_ms": int(( (self.end_time or time.time()) - self.start_time ) * 1000),
            "created_by": self.created_by,
            "error": self.error,
            "paused_reason": self.paused_reason,
            "resume_state": self.resume_state,
            "quality_decision": self.quality_decision,
            "quality_report": self.quality_report
        }
