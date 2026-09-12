"""
Manager / Orchestrator Agent for SIH26023 Multi-Agent Platform (Agent 1).
Coordinates all 8 specialized agents via dynamic intent planning, dependency-aware DAG scheduling,
concurrent task execution via ThreadPoolExecutor, bounded retries, timeout enforcement,
provenance DAG construction, and release gate quality governance.
"""

import uuid
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, List, Optional, Set
from agents.base_agent import BaseAgent
from agents.agent_messages import (
    AgentTask, AgentResult, WorkflowContext, WorkflowStatus, EvidenceItem,
    QualityGateDecision, ProvenanceEdgeType
)
from agents.agent_registry import agent_registry
from agents.document_agent import DocumentIntelligenceAgent
from agents.retrieval_agent import RetrievalAgent
from agents.mining_agent import MiningIntelligenceAgent
from agents.validation_agent import ValidationAgent
from agents.report_agent import ReportGenerationAgent
from agents.inquiry_agent import GovernmentInquiryAgent
from agents.quality_agent import QualityGovernanceAgent
from services.ai_service import ai_service, MANDATORY_NO_EVIDENCE_RESPONSE
from database.db import get_db, log_audit

logger = logging.getLogger(__name__)

class ManagerAgent(BaseAgent):
    """Lead Orchestrator Agent responsible for 8-agent multi-agent workflow execution."""

    def __init__(self):
        super().__init__(
            name="ManagerAgent",
            description="Coordinates 8 specialized agents, schedules dependency DAGs, executes concurrent tasks, enforces quality gates, and tracks full provenance.",
            capabilities=[
                "INTENT_PLANNING",
                "DYNAMIC_ORCHESTRATION",
                "DAG_DEPENDENCY_SCHEDULING",
                "PARALLEL_TASK_EXECUTION",
                "FAILURE_RECOVERY",
                "TIMEOUT_ENFORCEMENT",
                "HUMAN_IN_THE_LOOP_COORDINATION",
                "QUALITY_GATE_ROUTING",
                "PROVENANCE_DAG_TRACKING"
            ]
        )
        self._register_all_8_agents()

    def _register_all_8_agents(self):
        """Register all 8 specialized agent instances into the central registry."""
        agent_registry.register_agent(self)                                # Agent 1
        agent_registry.register_agent(DocumentIntelligenceAgent())          # Agent 2
        agent_registry.register_agent(RetrievalAgent())                    # Agent 3
        agent_registry.register_agent(MiningIntelligenceAgent())           # Agent 4 (NEW)
        agent_registry.register_agent(ValidationAgent())                   # Agent 5
        agent_registry.register_agent(ReportGenerationAgent())             # Agent 6
        agent_registry.register_agent(GovernmentInquiryAgent())            # Agent 7
        agent_registry.register_agent(QualityGovernanceAgent())            # Agent 8 (NEW)
        logger.info("Successfully registered all 8 logical agents.")

    def _execute(self, task: AgentTask, context: WorkflowContext) -> AgentResult:
        """Fallback implementation if manager is invoked as a subtask."""
        return AgentResult(
            task_id=task.task_id,
            workflow_id=task.workflow_id,
            agent_name=self.name,
            agent_id="manager",
            status="SUCCESS",
            result_data={"message": "Manager coordinator ready."}
        )

    # -------------------------------------------------------------------------
    # Dynamic Intent Planning & DAG Construction
    # -------------------------------------------------------------------------
    def plan_execution(self, intent: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Dynamic Orchestration Planner: Decomposes incoming requests into a dependency DAG
        with declared tasks, agent assignments, and dependencies.
        """
        params = params or {}
        plan = {
            "intent": intent,
            "required_agents": [],
            "dag_tasks": [],
            "parallel_stages": []
        }

        if intent == "DOCUMENT_INGESTION":
            plan["required_agents"] = ["DocumentIntelligenceAgent", "QualityGovernanceAgent"]
            plan["dag_tasks"] = [
                {"task_id": "doc_ingest", "agent": "DocumentIntelligenceAgent", "action": "PARSE_OCR_EXTRACT_AND_INDEX", "dependencies": []},
                {"task_id": "quality_gate", "agent": "QualityGovernanceAgent", "action": "AUDIT_RELEASE_GATE", "dependencies": ["doc_ingest"]}
            ]
        elif intent == "AI_ASSISTANT_QUERY":
            plan["required_agents"] = ["RetrievalAgent", "MiningIntelligenceAgent", "ValidationAgent", "QualityGovernanceAgent"]
            plan["dag_tasks"] = [
                {"task_id": "retrieval", "agent": "RetrievalAgent", "action": "RETRIEVE_EVIDENCE", "dependencies": []},
                {"task_id": "mining_facts", "agent": "MiningIntelligenceAgent", "action": "EXTRACT_AND_NORMALIZE_FACTS", "dependencies": []},
                {"task_id": "validation", "agent": "ValidationAgent", "action": "CHECK_CONSISTENCY", "dependencies": ["retrieval", "mining_facts"]},
                {"task_id": "quality_gate", "agent": "QualityGovernanceAgent", "action": "AUDIT_RELEASE_GATE", "dependencies": ["validation"]}
            ]
        elif intent == "REPORT_GENERATION":
            plan["required_agents"] = ["RetrievalAgent", "MiningIntelligenceAgent", "ValidationAgent", "ReportGenerationAgent", "QualityGovernanceAgent"]
            plan["dag_tasks"] = [
                {"task_id": "retrieval", "agent": "RetrievalAgent", "action": "RETRIEVE_DOMAIN_EVIDENCE", "dependencies": []},
                {"task_id": "mining_facts", "agent": "MiningIntelligenceAgent", "action": "EXTRACT_AND_NORMALIZE_FACTS", "dependencies": []},
                {"task_id": "validation", "agent": "ValidationAgent", "action": "CHECK_DISCREPANCIES", "dependencies": ["retrieval", "mining_facts"]},
                {"task_id": "report_gen", "agent": "ReportGenerationAgent", "action": "SYNTHESIZE_SECTIONS_AND_EXPORTS", "dependencies": ["validation"]},
                {"task_id": "quality_gate", "agent": "QualityGovernanceAgent", "action": "AUDIT_RELEASE_GATE", "dependencies": ["report_gen"]}
            ]
        elif intent == "PARLIAMENTARY_INQUIRY":
            plan["required_agents"] = ["RetrievalAgent", "MiningIntelligenceAgent", "ValidationAgent", "GovernmentInquiryAgent", "QualityGovernanceAgent"]
            plan["dag_tasks"] = [
                {"task_id": "retrieval", "agent": "RetrievalAgent", "action": "RETRIEVE_INQUIRY_EVIDENCE", "dependencies": []},
                {"task_id": "mining_facts", "agent": "MiningIntelligenceAgent", "action": "EXTRACT_AND_NORMALIZE_FACTS", "dependencies": []},
                {"task_id": "validation", "agent": "ValidationAgent", "action": "SCAN_METRIC_CONFLICTS", "dependencies": ["retrieval", "mining_facts"]},
                {"task_id": "inquiry_draft", "agent": "GovernmentInquiryAgent", "action": "DRAFT_PARLIAMENTARY_RESPONSE", "dependencies": ["validation"]},
                {"task_id": "quality_gate", "agent": "QualityGovernanceAgent", "action": "AUDIT_RELEASE_GATE", "dependencies": ["inquiry_draft"]}
            ]
        elif intent == "MINING_KPI_ANALYSIS":
            plan["required_agents"] = ["RetrievalAgent", "MiningIntelligenceAgent", "QualityGovernanceAgent"]
            plan["dag_tasks"] = [
                {"task_id": "retrieval", "agent": "RetrievalAgent", "action": "RETRIEVE_KPI_DATA", "dependencies": []},
                {"task_id": "mining_facts", "agent": "MiningIntelligenceAgent", "action": "COMPUTE_DOMAIN_KPIS", "dependencies": ["retrieval"]},
                {"task_id": "quality_gate", "agent": "QualityGovernanceAgent", "action": "AUDIT_RELEASE_GATE", "dependencies": ["mining_facts"]}
            ]
        elif intent == "DISCREPANCY_INVESTIGATION":
            plan["required_agents"] = ["RetrievalAgent", "MiningIntelligenceAgent", "ValidationAgent", "QualityGovernanceAgent"]
            plan["dag_tasks"] = [
                {"task_id": "retrieval", "agent": "RetrievalAgent", "action": "RETRIEVE_EVIDENCE", "dependencies": []},
                {"task_id": "mining_facts", "agent": "MiningIntelligenceAgent", "action": "EXTRACT_MINING_ENTITIES", "dependencies": []},
                {"task_id": "validation", "agent": "ValidationAgent", "action": "ANALYZE_VARIANCE_AND_SEVERITY", "dependencies": ["retrieval", "mining_facts"]},
                {"task_id": "quality_gate", "agent": "QualityGovernanceAgent", "action": "AUDIT_RELEASE_GATE", "dependencies": ["validation"]}
            ]
        else:
            plan["required_agents"] = ["RetrievalAgent", "QualityGovernanceAgent"]
            plan["dag_tasks"] = [
                {"task_id": "retrieval", "agent": "RetrievalAgent", "action": "GENERIC_SEARCH", "dependencies": []},
                {"task_id": "quality_gate", "agent": "QualityGovernanceAgent", "action": "AUDIT_RELEASE_GATE", "dependencies": ["retrieval"]}
            ]

        return plan

    # -------------------------------------------------------------------------
    # Core DAG Execution Engine with Concurrency & Error Safety
    # -------------------------------------------------------------------------
    def execute_dag(self, tasks: List[AgentTask], context: WorkflowContext, max_workers: int = 4) -> Dict[str, AgentResult]:
        """
        Execute a list of AgentTasks respecting explicit dependency constraints.
        Independent tasks execute concurrently via ThreadPoolExecutor.
        """
        # 1. Validate for Cyclic Dependencies
        if self._has_cyclic_dependencies(tasks):
            raise ValueError("Cyclic dependency detected in task graph. Workflow execution halted.")

        # Register initial DAG nodes
        context.add_dag_node(
            node_id=f"req_{context.workflow_id}",
            node_type="USER_REQUEST",
            label=f"Request: {context.workflow_type}",
            metadata={"initial_prompt": context.initial_prompt}
        )

        for t in tasks:
            context.tasks[t.task_id] = t
            context.add_dag_node(
                node_id=f"task_{t.task_id}",
                node_type="AGENT_TASK",
                label=f"{t.destination_agent}: {t.task_type}",
                metadata={"agent": t.destination_agent, "dependencies": t.dependencies}
            )
            for dep in t.dependencies:
                context.add_dag_edge(
                    source=f"task_{dep}",
                    target=f"task_{t.task_id}",
                    relation=ProvenanceEdgeType.DERIVED_FROM
                )

        completed_tasks: Set[str] = set()
        failed_tasks: Set[str] = set()
        results: Dict[str, AgentResult] = {}
        pending_tasks = {t.task_id: t for t in tasks}

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            while pending_tasks:
                # Identify tasks whose dependencies have all completed successfully
                ready_task_ids = []
                for tid, task in pending_tasks.items():
                    deps = set(task.dependencies)
                    if deps.issubset(completed_tasks):
                        ready_task_ids.append(tid)
                    elif any(dep in failed_tasks for dep in deps):
                        # Upstream dependency failed -> fail this task
                        task.status = "SKIPPED"
                        task.error_message = "Skipped due to upstream dependency failure."
                        task.completed_at = time.time()
                        agent_registry._persist_task(task)
                        failed_tasks.add(tid)
                        ready_task_ids.append(tid)

                if not ready_task_ids:
                    # Deadlock or unresolvable dependencies
                    for tid, task in pending_tasks.items():
                        task.status = "FAILED"
                        task.error_message = "Unresolvable dependency or deadlock."
                        failed_tasks.add(tid)
                    break

                # Launch ready tasks concurrently
                futures = {}
                for tid in ready_task_ids:
                    task = pending_tasks.pop(tid)
                    if task.status == "SKIPPED":
                        continue
                    futures[executor.submit(agent_registry.dispatch_task, task, context)] = task

                for future in as_completed(futures):
                    task = futures[future]
                    try:
                        res = future.result()
                        results[task.task_id] = res
                        if res.status in ("SUCCESS", "PARTIAL", "REQUIRES_HUMAN_REVIEW"):
                            completed_tasks.add(task.task_id)
                        else:
                            failed_tasks.add(task.task_id)
                    except Exception as e:
                        logger.error(f"Task {task.task_id} raised unexpected exception: {e}")
                        failed_tasks.add(task.task_id)

        return results

    def _has_cyclic_dependencies(self, tasks: List[AgentTask]) -> bool:
        """Check if graph contains cycles using topological sort / DFS."""
        adj = {t.task_id: set(t.dependencies) for t in tasks}
        visited = {}  # 0 = unvisited, 1 = visiting, 2 = visited

        def dfs(node):
            if visited.get(node) == 1:
                return True
            if visited.get(node) == 2:
                return False
            visited[node] = 1
            for neighbor in adj.get(node, []):
                if dfs(neighbor):
                    return True
            visited[node] = 2
            return False

        for t in tasks:
            if dfs(t.task_id):
                return True
        return False

    # -------------------------------------------------------------------------
    # 1. Document Ingestion Workflow (8-Agent Upgraded)
    # -------------------------------------------------------------------------
    def run_document_processing_workflow(self, file_path_str: str, original_filename: str, document_id: Optional[int] = None) -> Dict[str, Any]:
        """Workflow: Manager -> DocumentIntelligenceAgent -> QualityGovernanceAgent."""
        workflow_id = f"wf_doc_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        context = WorkflowContext(
            workflow_id=workflow_id,
            workflow_type="DOCUMENT_INGESTION",
            initial_prompt=f"Ingest and process document: {original_filename}",
            total_steps=2
        )
        agent_registry.persist_workflow_start(context)

        # Task 1: Ingestion
        t_doc = AgentTask(
            task_id=f"task_doc_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="DocumentIntelligenceAgent",
            task_type="PROCESS_DOCUMENT",
            input_data={"file_path": file_path_str, "original_filename": original_filename, "document_id": document_id},
            dependencies=[]
        )

        # Task 2: Quality Gate
        t_qual = AgentTask(
            task_id=f"task_qual_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="QualityGovernanceAgent",
            task_type="AUDIT_RELEASE_GATE",
            dependencies=[t_doc.task_id]
        )

        self.execute_dag([t_doc, t_qual], context)

        doc_res = context.results.get(t_doc.task_id)
        qual_res = context.results.get(t_qual.task_id)

        if qual_res and qual_res.status == "REJECTED":
            context.status = WorkflowStatus.REJECTED
            context.error = "; ".join(qual_res.errors)
        elif doc_res and doc_res.status == "SUCCESS":
            context.status = WorkflowStatus.COMPLETED
            context.final_output = doc_res.result_data
        else:
            context.status = WorkflowStatus.FAILED
            context.error = "; ".join(doc_res.errors) if doc_res else "Ingestion failed."

        context.end_time = time.time()
        agent_registry.persist_workflow_end(context)
        return {
            "workflow": context.to_dict(),
            "result": doc_res.to_dict() if doc_res else {},
            "quality_decision": context.quality_decision,
            "quality_report": context.quality_report
        }

    # -------------------------------------------------------------------------
    # 2. Mining Intelligence Assistant Query Workflow (8-Agent Concurrent DAG)
    # -------------------------------------------------------------------------
    def run_query_workflow(
        self,
        query: str,
        user_role: str = "Analyst",
        filter_subsidiary: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Workflow: Manager -> [RetrievalAgent || MiningIntelligenceAgent] in parallel
                          -> ValidationAgent (Cross-Document Consistency)
                          -> AIService Grounded Reasoning
                          -> QualityGovernanceAgent (Independent Release Gate).
        """
        workflow_id = f"wf_qry_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        context = WorkflowContext(
            workflow_id=workflow_id,
            workflow_type="AI_ASSISTANT_QUERY",
            initial_prompt=query,
            total_steps=5,
            created_by=user_role
        )
        agent_registry.persist_workflow_start(context)
        start_time = time.time()

        # Step 1 & 2: Concurrent Retrieval and Mining Extraction
        t_ret = AgentTask(
            task_id=f"task_ret_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="RetrievalAgent",
            task_type="RETRIEVE_EVIDENCE",
            input_data={"query": query, "top_k": 8, "filter_subsidiary": filter_subsidiary},
            dependencies=[]
        )

        t_mine = AgentTask(
            task_id=f"task_mine_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="MiningIntelligenceAgent",
            task_type="EXTRACT_AND_NORMALIZE_FACTS",
            input_data={"text": query, "subsidiary": filter_subsidiary},
            dependencies=[]
        )

        # Step 3: Validation (depends on Retrieval & Mining)
        t_val = AgentTask(
            task_id=f"task_val_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="ValidationAgent",
            task_type="CHECK_CONSISTENCY",
            input_data={"subsidiary": filter_subsidiary},
            dependencies=[t_ret.task_id, t_mine.task_id]
        )

        # Step 4: Quality Gate
        t_qual = AgentTask(
            task_id=f"task_qual_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="QualityGovernanceAgent",
            task_type="AUDIT_RELEASE_GATE",
            input_data={"user_role": user_role},
            dependencies=[t_val.task_id]
        )

        # Execute DAG
        self.execute_dag([t_ret, t_mine, t_val, t_qual], context)

        ret_res = context.results.get(t_ret.task_id)
        mine_res = context.results.get(t_mine.task_id)
        val_res = context.results.get(t_val.task_id)
        qual_res = context.results.get(t_qual.task_id)

        evidence_dicts = [e.to_dict() if hasattr(e, 'to_dict') else e for e in context.accumulated_evidence]
        val_warnings = val_res.warnings if val_res else []

        # Step 3: AI Reasoning grounded strictly in evidence
        system_prompt = (
            "You are the Mining Intelligence Assistant for Coal India Limited and CMPDI. "
            "Your answers must be grounded strictly in verified document excerpts. "
            "Provide explicit document names, page numbers, and sections."
        )

        ai_out = ai_service.generate_chat_response(
            prompt=query,
            system_prompt=system_prompt,
            evidence=evidence_dicts,
            chat_history=chat_history
        )

        answer_text = ai_out.get("text", MANDATORY_NO_EVIDENCE_RESPONSE)
        provider_used = ai_out.get("provider", "deterministic")
        model_used = ai_out.get("model", "unknown")
        confidence_semantics = ai_out.get("confidence_semantics", {})

        if val_warnings and MANDATORY_NO_EVIDENCE_RESPONSE not in answer_text:
            discrepancy_notice = "\n\n> ⚠ **Potential Data Inconsistency Flagged by Validation Agent:**\n" + "\n".join([f"> - {w}" for w in val_warnings[:2]])
            answer_text += discrepancy_notice

        exec_ms = int((time.time() - start_time) * 1000)

        # Record query in database
        query_id = None
        try:
            with get_db() as conn:
                cursor = conn.execute(
                    """
                    INSERT INTO queries 
                    (query_text, user_role, workflow_id, response_text, ai_provider_used, execution_time_ms, evidence_count)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (query, user_role, workflow_id, answer_text, f"{provider_used} ({model_used})", exec_ms, len(evidence_dicts))
                )
                query_id = cursor.lastrowid
                log_audit("AI_QUERY_EXECUTED", user_role=user_role, resource_type="query", resource_id=query_id, details={
                    "query": query, "provider": provider_used, "evidence_count": len(evidence_dicts), "quality": context.quality_decision
                })
        except Exception as e:
            logger.error(f"Failed to save query log: {e}")

        # Final workflow status evaluation
        if qual_res and qual_res.status == "REJECTED":
            context.status = WorkflowStatus.REJECTED
            context.error = "; ".join(qual_res.errors)
        else:
            context.status = WorkflowStatus.COMPLETED

        context.end_time = time.time()
        context.final_output = {
            "query_id": query_id,
            "answer": answer_text,
            "provider_used": provider_used,
            "model_used": model_used,
            "evidence_count": len(evidence_dicts),
            "evidence": evidence_dicts,
            "sources": ret_res.sources if ret_res else [],
            "validation_warnings": val_warnings,
            "confidence_semantics": confidence_semantics,
            "mining_facts": mine_res.result_data.get("facts", []) if mine_res else [],
            "duration_ms": exec_ms,
            "quality_decision": context.quality_decision,
            "quality_report": context.quality_report
        }

        agent_registry.persist_workflow_end(context)
        return {
            "workflow": context.to_dict(),
            "answer": answer_text,
            "provider_info": {"provider": provider_used, "model": model_used},
            "evidence": evidence_dicts,
            "sources": ret_res.sources if ret_res else [],
            "validation_warnings": val_warnings,
            "confidence_semantics": confidence_semantics,
            "mining_facts": mine_res.result_data.get("facts", []) if mine_res else [],
            "duration_ms": exec_ms,
            "quality_decision": context.quality_decision,
            "quality_report": context.quality_report
        }

    # -------------------------------------------------------------------------
    # 3. Automated Report Generation Workflow (8-Agent Multi-Stage DAG)
    # -------------------------------------------------------------------------
    def run_report_generation_workflow(
        self,
        report_type: str,
        title: str,
        subsidiary: Optional[str] = None,
        reporting_period: Optional[str] = None,
        instructions: str = ""
    ) -> Dict[str, Any]:
        """
        Workflow: Manager -> [Retrieval || Mining Intelligence] in parallel
                          -> ValidationAgent -> ReportGenerationAgent -> QualityGovernanceAgent.
        """
        workflow_id = f"wf_rep_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        context = WorkflowContext(
            workflow_id=workflow_id,
            workflow_type="REPORT_GENERATION",
            initial_prompt=f"Generate {report_type}: {title}",
            total_steps=5
        )
        agent_registry.persist_workflow_start(context)

        search_query = f"{report_type} {subsidiary or ''} {reporting_period or ''} production excavation geology safety equipment"

        t_ret = AgentTask(
            task_id=f"task_ret_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="RetrievalAgent",
            task_type="RETRIEVE_EVIDENCE",
            input_data={"query": search_query, "top_k": 15, "filter_subsidiary": subsidiary},
            dependencies=[]
        )

        t_mine = AgentTask(
            task_id=f"task_mine_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="MiningIntelligenceAgent",
            task_type="EXTRACT_AND_NORMALIZE_FACTS",
            input_data={"subsidiary": subsidiary, "reporting_period": reporting_period},
            dependencies=[]
        )

        t_val = AgentTask(
            task_id=f"task_val_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="ValidationAgent",
            task_type="CHECK_CONSISTENCY",
            input_data={"subsidiary": subsidiary, "reporting_period": reporting_period},
            dependencies=[t_ret.task_id, t_mine.task_id]
        )

        t_rep = AgentTask(
            task_id=f"task_rep_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="ReportGenerationAgent",
            task_type="GENERATE_REPORT",
            input_data={
                "report_type": report_type,
                "title": title,
                "subsidiary": subsidiary,
                "reporting_period": reporting_period,
                "instructions": instructions
            },
            dependencies=[t_val.task_id]
        )

        t_qual = AgentTask(
            task_id=f"task_qual_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="QualityGovernanceAgent",
            task_type="AUDIT_RELEASE_GATE",
            dependencies=[t_rep.task_id]
        )

        self.execute_dag([t_ret, t_mine, t_val, t_rep, t_qual], context)

        rep_res = context.results.get(t_rep.task_id)
        qual_res = context.results.get(t_qual.task_id)

        if qual_res and qual_res.status == "REJECTED":
            context.status = WorkflowStatus.REJECTED
            context.error = "; ".join(qual_res.errors)
        elif rep_res and rep_res.status == "SUCCESS":
            context.status = WorkflowStatus.COMPLETED
            context.final_output = rep_res.result_data
        else:
            context.status = WorkflowStatus.FAILED

        context.end_time = time.time()
        agent_registry.persist_workflow_end(context)
        return {
            "workflow": context.to_dict(),
            "report": rep_res.result_data if rep_res else {},
            "quality_decision": context.quality_decision,
            "quality_report": context.quality_report
        }

    # -------------------------------------------------------------------------
    # 4. Parliamentary / Government Inquiry Workflow (8-Agent Governance)
    # -------------------------------------------------------------------------
    def run_inquiry_workflow(
        self,
        question_text: str,
        inquiry_ref: str = "LS-STARRED-2026",
        ministry_body: str = "Ministry of Coal / Lok Sabha"
    ) -> Dict[str, Any]:
        """
        Workflow: Manager -> [Retrieval || Mining Intelligence] in parallel
                          -> ValidationAgent -> GovernmentInquiryAgent -> QualityGovernanceAgent.
        """
        workflow_id = f"wf_inq_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        context = WorkflowContext(
            workflow_id=workflow_id,
            workflow_type="PARLIAMENTARY_INQUIRY",
            initial_prompt=f"Parliamentary Inquiry [{inquiry_ref}]: {question_text}",
            total_steps=5
        )
        agent_registry.persist_workflow_start(context)

        t_ret = AgentTask(
            task_id=f"task_ret_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="RetrievalAgent",
            task_type="RETRIEVE_EVIDENCE",
            input_data={"query": question_text, "top_k": 12},
            dependencies=[]
        )

        t_mine = AgentTask(
            task_id=f"task_mine_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="MiningIntelligenceAgent",
            task_type="EXTRACT_AND_NORMALIZE_FACTS",
            input_data={"text": question_text},
            dependencies=[]
        )

        t_val = AgentTask(
            task_id=f"task_val_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="ValidationAgent",
            task_type="CHECK_CONSISTENCY",
            input_data={},
            dependencies=[t_ret.task_id, t_mine.task_id]
        )

        t_inq = AgentTask(
            task_id=f"task_inq_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="GovernmentInquiryAgent",
            task_type="DRAFT_INQUIRY_RESPONSE",
            input_data={
                "question_text": question_text,
                "inquiry_ref": inquiry_ref,
                "ministry_body": ministry_body
            },
            dependencies=[t_val.task_id]
        )

        t_qual = AgentTask(
            task_id=f"task_qual_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="QualityGovernanceAgent",
            task_type="AUDIT_RELEASE_GATE",
            dependencies=[t_inq.task_id]
        )

        self.execute_dag([t_ret, t_mine, t_val, t_inq, t_qual], context)

        inq_res = context.results.get(t_inq.task_id)
        qual_res = context.results.get(t_qual.task_id)

        if qual_res and qual_res.status == "REJECTED":
            context.status = WorkflowStatus.REJECTED
            context.error = "; ".join(qual_res.errors)
        elif qual_res and qual_res.status == "REQUIRES_HUMAN_REVIEW":
            context.status = WorkflowStatus.REQUIRES_HUMAN_REVIEW
            context.final_output = inq_res.result_data if inq_res else {}
        elif inq_res and inq_res.status == "SUCCESS":
            context.status = WorkflowStatus.COMPLETED
            context.final_output = inq_res.result_data
        else:
            context.status = WorkflowStatus.FAILED

        context.end_time = time.time()
        agent_registry.persist_workflow_end(context)
        return {
            "workflow": context.to_dict(),
            "inquiry": inq_res.result_data if inq_res else {},
            "quality_decision": context.quality_decision,
            "quality_report": context.quality_report
        }

    # -------------------------------------------------------------------------
    # 5. Dedicated Demo & Discrepancy Investigation Workflow
    # -------------------------------------------------------------------------
    def run_discrepancy_investigation_workflow(self, query: str = "Rajmahal production discrepancy") -> Dict[str, Any]:
        """
        Specialized multi-agent scenario:
        1. Retrieval fetches Rajmahal production reports
        2. Mining Intelligence extracts normalized production metrics
        3. Validation calculates variance, severity, and flags conflicting sources
        4. Report Generation compiles comparative executive briefing
        5. Quality & Governance release gate validates calculations and evidence.
        """
        workflow_id = f"wf_demo_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        context = WorkflowContext(
            workflow_id=workflow_id,
            workflow_type="DISCREPANCY_INVESTIGATION",
            initial_prompt=f"Investigate discrepancy: {query}",
            total_steps=5
        )
        agent_registry.persist_workflow_start(context)

        t_ret = AgentTask(
            task_id=f"task_ret_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="RetrievalAgent",
            task_type="RETRIEVE_EVIDENCE",
            input_data={"query": query, "top_k": 10},
            dependencies=[]
        )

        t_mine = AgentTask(
            task_id=f"task_mine_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="MiningIntelligenceAgent",
            task_type="EXTRACT_AND_NORMALIZE_FACTS",
            input_data={"text": query, "mine": "Rajmahal"},
            dependencies=[]
        )

        t_val = AgentTask(
            task_id=f"task_val_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="ValidationAgent",
            task_type="CHECK_CONSISTENCY",
            input_data={"subsidiary": "ECL"},
            dependencies=[t_ret.task_id, t_mine.task_id]
        )

        t_rep = AgentTask(
            task_id=f"task_rep_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="ReportGenerationAgent",
            task_type="GENERATE_REPORT",
            input_data={
                "report_type": "Executive Discrepancy & Production Audit Report",
                "title": "Rajmahal Production Variance Investigation Report",
                "subsidiary": "ECL"
            },
            dependencies=[t_val.task_id]
        )

        t_qual = AgentTask(
            task_id=f"task_qual_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="QualityGovernanceAgent",
            task_type="AUDIT_RELEASE_GATE",
            dependencies=[t_rep.task_id]
        )

        self.execute_dag([t_ret, t_mine, t_val, t_rep, t_qual], context)

        val_res = context.results.get(t_val.task_id)
        rep_res = context.results.get(t_rep.task_id)
        qual_res = context.results.get(t_qual.task_id)

        context.status = WorkflowStatus.COMPLETED if (qual_res and qual_res.status in ("SUCCESS", "WARNING", "REQUIRES_HUMAN_REVIEW")) else WorkflowStatus.FAILED
        context.end_time = time.time()
        context.final_output = {
            "validation": val_res.result_data if val_res else {},
            "report": rep_res.result_data if rep_res else {},
            "quality_decision": context.quality_decision,
            "quality_report": context.quality_report
        }

        agent_registry.persist_workflow_end(context)
        return {
            "workflow": context.to_dict(),
            "validation": val_res.result_data if val_res else {},
            "report": rep_res.result_data if rep_res else {},
            "quality_decision": context.quality_decision,
            "quality_report": context.quality_report
        }

    # -------------------------------------------------------------------------
    # 6. Human-In-The-Loop Pause and Resume
    # -------------------------------------------------------------------------
    def pause_workflow(self, workflow_id: str, paused_task_id: str, reason: str, state: Optional[Dict[str, Any]] = None) -> bool:
        """Pause an ongoing workflow for human review."""
        try:
            agent_registry.save_checkpoint(workflow_id, paused_task_id, reason, state or {})
            with get_db() as conn:
                conn.execute(
                    "UPDATE agent_workflows SET status = 'PAUSED', paused_reason = ? WHERE id = ?",
                    (reason, workflow_id)
                )
            return True
        except Exception as e:
            logger.error(f"Failed to pause workflow {workflow_id}: {e}")
            return False

    def resume_workflow(self, workflow_id: str, reviewer: str, reviewer_role: str, reviewer_note: str) -> Optional[Dict[str, Any]]:
        """Resume a paused workflow after human review."""
        try:
            state = agent_registry.resume_checkpoint(workflow_id, reviewer, reviewer_role, reviewer_note)
            if state is not None:
                with get_db() as conn:
                    conn.execute(
                        "UPDATE agent_workflows SET status = 'RUNNING', paused_reason = NULL WHERE id = ?",
                        (workflow_id,)
                    )
                log_audit("WORKFLOW_RESUMED", user_role=reviewer_role, resource_type="workflow", resource_id=workflow_id, details={
                    "reviewer": reviewer, "note": reviewer_note
                })
            return state
        except Exception as e:
            logger.error(f"Failed to resume workflow {workflow_id}: {e}")
            return None

# Global manager agent instance
manager_agent = ManagerAgent()
