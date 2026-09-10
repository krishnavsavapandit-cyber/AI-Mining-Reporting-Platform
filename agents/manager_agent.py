"""
Manager / Orchestrator Agent for SIH26023 Multi-Agent Platform.
Coordinates multi-agent workflows, generates execution plans, passes structured contexts,
monitors task states, maintains provenance, handles errors/retries gracefully, and enforces
strict grounding and confidence semantics.
"""

import uuid
import time
import logging
from typing import Dict, Any, List, Optional
from agents.base_agent import BaseAgent
from agents.agent_messages import (
    AgentTask, AgentResult, WorkflowContext, WorkflowStatus, EvidenceItem
)
from agents.agent_registry import agent_registry
from agents.document_agent import DocumentIntelligenceAgent
from agents.retrieval_agent import RetrievalAgent
from agents.validation_agent import ValidationAgent
from agents.report_agent import ReportGenerationAgent
from agents.inquiry_agent import GovernmentInquiryAgent
from services.ai_service import ai_service, MANDATORY_NO_EVIDENCE_RESPONSE
from database.db import get_db, log_audit

logger = logging.getLogger(__name__)

class ManagerAgent(BaseAgent):
    """Lead Orchestrator Agent responsible for end-to-end multi-agent workflow execution."""

    def __init__(self):
        super().__init__(
            name="ManagerAgent",
            description="Coordinates specialized agents, generates dynamic execution plans, aggregates grounded evidence, and preserves provenance.",
            capabilities=[
                "INTENT_PLANNING",
                "DYNAMIC_ORCHESTRATION",
                "AGENT_COORDINATION",
                "FAILURE_RECOVERY",
                "PROVENANCE_CHAIN_TRACKING",
                "CONFIDENCE_SEMANTICS_EVALUATION"
            ]
        )
        self._register_subagents()

    def _register_subagents(self):
        """Register all specialized agent instances into the central registry."""
        agent_registry.register_agent(self)
        agent_registry.register_agent(DocumentIntelligenceAgent())
        agent_registry.register_agent(RetrievalAgent())
        agent_registry.register_agent(ValidationAgent())
        agent_registry.register_agent(ReportGenerationAgent())
        agent_registry.register_agent(GovernmentInquiryAgent())

    def _execute(self, task: AgentTask, context: WorkflowContext) -> AgentResult:
        """Fallback implementation if manager is invoked as a subtask."""
        return AgentResult(
            task_id=task.task_id,
            workflow_id=task.workflow_id,
            agent_name=self.name,
            status="SUCCESS",
            result_data={"message": "Manager coordinator ready."}
        )

    def plan_execution(self, intent: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dynamic Orchestration Planner: Decomposes incoming user/system requests,
        determines necessary specialized agents, and returns a tailored execution DAG.
        """
        plan = {
            "intent": intent,
            "required_agents": [],
            "execution_steps": [],
            "contingency_rules": []
        }

        if intent == "DOCUMENT_INGESTION":
            plan["required_agents"] = ["DocumentIntelligenceAgent", "ValidationAgent"]
            plan["execution_steps"] = [
                {"step": 1, "agent": "DocumentIntelligenceAgent", "action": "PARSE_OCR_EXTRACT_AND_INDEX"},
                {"step": 2, "agent": "ValidationAgent", "action": "CROSS_DOCUMENT_CONFLICT_SCAN", "conditional": "if_metrics_extracted"}
            ]
        elif intent == "AI_ASSISTANT_QUERY":
            plan["required_agents"] = ["RetrievalAgent", "ValidationAgent"]
            plan["execution_steps"] = [
                {"step": 1, "agent": "RetrievalAgent", "action": "RETRIEVE_EVIDENCE"},
                {"step": 2, "agent": "ValidationAgent", "action": "CHECK_CONSISTENCY", "conditional": "if_evidence_sufficient"},
                {"step": 3, "agent": "ManagerAgent", "action": "GROUNDED_SYNTHESIS_AND_CONFIDENCE_SCORING"}
            ]
        elif intent == "REPORT_GENERATION":
            plan["required_agents"] = ["RetrievalAgent", "ValidationAgent", "ReportGenerationAgent"]
            plan["execution_steps"] = [
                {"step": 1, "agent": "RetrievalAgent", "action": "RETRIEVE_DOMAIN_EVIDENCE"},
                {"step": 2, "agent": "ValidationAgent", "action": "CHECK_DISCREPANCIES"},
                {"step": 3, "agent": "ReportGenerationAgent", "action": "SYNTHESIZE_SECTIONS_AND_EXPORTS"}
            ]
        elif intent == "PARLIAMENTARY_INQUIRY":
            plan["required_agents"] = ["RetrievalAgent", "ValidationAgent", "GovernmentInquiryAgent"]
            plan["execution_steps"] = [
                {"step": 1, "agent": "RetrievalAgent", "action": "RETRIEVE_INQUIRY_EVIDENCE"},
                {"step": 2, "agent": "ValidationAgent", "action": "SCAN_METRIC_CONFLICTS"},
                {"step": 3, "agent": "GovernmentInquiryAgent", "action": "DRAFT_PARLIAMENTARY_RESPONSE"}
            ]
        else:
            plan["required_agents"] = ["RetrievalAgent"]
            plan["execution_steps"] = [{"step": 1, "agent": "RetrievalAgent", "action": "GENERIC_SEARCH"}]

        return plan

    # -------------------------------------------------------------
    # 1. Document Ingestion Workflow
    # -------------------------------------------------------------
    def run_document_processing_workflow(self, file_path_str: str, original_filename: str, document_id: Optional[int] = None) -> Dict[str, Any]:
        """Workflow: Ingest Document -> Parse & OCR -> Extract Mining Entities -> Chunk & Index -> Conflict Scan."""
        workflow_id = f"wf_doc_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        context = WorkflowContext(
            workflow_id=workflow_id,
            workflow_type="DOCUMENT_INGESTION",
            initial_prompt=f"Ingest and process document: {original_filename}",
            total_steps=2
        )
        agent_registry.persist_workflow_start(context)

        # Step 1: Dispatch to DocumentIntelligenceAgent
        context.current_step = 1
        task_id = f"task_{uuid.uuid4().hex[:8]}"
        doc_task = AgentTask(
            task_id=task_id,
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="DocumentIntelligenceAgent",
            task_type="PROCESS_DOCUMENT",
            input_data={
                "file_path": file_path_str,
                "original_filename": original_filename,
                "document_id": document_id
            }
        )

        res = agent_registry.dispatch_task(doc_task, context)

        # Step 2: If document processed successfully, run validation scan to detect conflicts with existing documents
        if res.status == "SUCCESS":
            context.current_step = 2
            val_task = AgentTask(
                task_id=f"task_val_{uuid.uuid4().hex[:8]}",
                workflow_id=workflow_id,
                source_agent=self.name,
                destination_agent="ValidationAgent",
                task_type="CHECK_CONSISTENCY",
                input_data={}
            )
            val_res = agent_registry.dispatch_task(val_task, context)
            res.result_data["conflicts_detected"] = len(val_res.warnings)

        context.status = WorkflowStatus.COMPLETED if res.status == "SUCCESS" else WorkflowStatus.FAILED
        context.end_time = time.time()
        context.final_output = res.result_data
        if res.status != "SUCCESS":
            context.error = "; ".join(res.errors)

        agent_registry.persist_workflow_end(context)
        return {
            "workflow": context.to_dict(),
            "result": res.to_dict()
        }

    # -------------------------------------------------------------
    # 2. Mining Intelligence Assistant Query Workflow
    # -------------------------------------------------------------
    def run_query_workflow(
        self,
        query: str,
        user_role: str = "Analyst",
        filter_subsidiary: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Workflow: User Question -> RetrievalAgent (Get Evidence) 
                  -> Evidence Sufficiency Check (Hard No-Hallucination Gate)
                  -> ValidationAgent (Check Discrepancies) 
                  -> AIService Reasoning -> Grounded Answer with Provenance & Confidence Semantics.
        """
        workflow_id = f"wf_qry_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        context = WorkflowContext(
            workflow_id=workflow_id,
            workflow_type="AI_ASSISTANT_QUERY",
            initial_prompt=query,
            total_steps=3,
            created_by=user_role
        )
        agent_registry.persist_workflow_start(context)
        start_time = time.time()

        # Step 1: Retrieval Task
        context.current_step = 1
        retrieval_task = AgentTask(
            task_id=f"task_ret_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="RetrievalAgent",
            task_type="RETRIEVE_EVIDENCE",
            input_data={"query": query, "top_k": 8, "filter_subsidiary": filter_subsidiary}
        )
        ret_res = agent_registry.dispatch_task(retrieval_task, context)

        evidence_dicts = [e.to_dict() if hasattr(e, 'to_dict') else e for e in context.accumulated_evidence]

        # Step 2: Validation Task (Check if retrieved figures have cross-document conflicts)
        context.current_step = 2
        val_warnings = []
        if evidence_dicts:
            val_task = AgentTask(
                task_id=f"task_val_{uuid.uuid4().hex[:6]}",
                workflow_id=workflow_id,
                source_agent=self.name,
                destination_agent="ValidationAgent",
                task_type="CHECK_CONSISTENCY",
                input_data={"subsidiary": filter_subsidiary}
            )
            val_res = agent_registry.dispatch_task(val_task, context)
            val_warnings = val_res.warnings

        # Step 3: AI Reasoning grounded strictly in evidence
        context.current_step = 3
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

        # Append discrepancy notice if conflicting values are present
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
                    "query": query, "provider": provider_used, "evidence_count": len(evidence_dicts)
                })
        except Exception as e:
            logger.error(f"Failed to save query log: {e}")

        context.status = WorkflowStatus.COMPLETED
        context.end_time = time.time()
        context.final_output = {
            "query_id": query_id,
            "answer": answer_text,
            "provider_used": provider_used,
            "model_used": model_used,
            "evidence_count": len(evidence_dicts),
            "evidence": evidence_dicts,
            "sources": ret_res.sources,
            "validation_warnings": val_warnings,
            "confidence_semantics": confidence_semantics,
            "duration_ms": exec_ms
        }

        agent_registry.persist_workflow_end(context)
        return {
            "workflow": context.to_dict(),
            "answer": answer_text,
            "provider_info": {"provider": provider_used, "model": model_used},
            "evidence": evidence_dicts,
            "sources": ret_res.sources,
            "validation_warnings": val_warnings,
            "confidence_semantics": confidence_semantics,
            "duration_ms": exec_ms
        }

    # -------------------------------------------------------------
    # 3. Automated Report Generation Workflow
    # -------------------------------------------------------------
    def run_report_generation_workflow(
        self,
        report_type: str,
        title: str,
        subsidiary: Optional[str] = None,
        reporting_period: Optional[str] = None,
        instructions: str = ""
    ) -> Dict[str, Any]:
        """Workflow: Manager -> RetrievalAgent -> ValidationAgent -> ReportGenerationAgent."""
        workflow_id = f"wf_rep_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        context = WorkflowContext(
            workflow_id=workflow_id,
            workflow_type="REPORT_GENERATION",
            initial_prompt=f"Generate {report_type}: {title}",
            total_steps=3
        )
        agent_registry.persist_workflow_start(context)

        # Step 1: Retrieval for Report Domain
        context.current_step = 1
        search_query = f"{report_type} {subsidiary or ''} {reporting_period or ''} production excavation geology safety equipment"
        ret_task = AgentTask(
            task_id=f"task_ret_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="RetrievalAgent",
            task_type="RETRIEVE_EVIDENCE",
            input_data={"query": search_query, "top_k": 15, "filter_subsidiary": subsidiary}
        )
        agent_registry.dispatch_task(ret_task, context)

        # Step 2: Validation Scan
        context.current_step = 2
        val_task = AgentTask(
            task_id=f"task_val_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="ValidationAgent",
            task_type="CHECK_CONSISTENCY",
            input_data={"subsidiary": subsidiary, "reporting_period": reporting_period}
        )
        val_res = agent_registry.dispatch_task(val_task, context)

        # Step 3: Report Synthesis
        context.current_step = 3
        rep_task = AgentTask(
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
                "instructions": instructions,
                "inconsistencies": val_res.result_data.get("inconsistencies", [])
            }
        )
        rep_res = agent_registry.dispatch_task(rep_task, context)

        context.status = WorkflowStatus.COMPLETED if rep_res.status == "SUCCESS" else WorkflowStatus.FAILED
        context.end_time = time.time()
        context.final_output = rep_res.result_data

        agent_registry.persist_workflow_end(context)
        return {
            "workflow": context.to_dict(),
            "report": rep_res.result_data
        }

    # -------------------------------------------------------------
    # 4. Parliamentary / Government Inquiry Workflow
    # -------------------------------------------------------------
    def run_inquiry_workflow(
        self,
        question_text: str,
        inquiry_ref: str = "LS-STARRED-2026",
        ministry_body: str = "Ministry of Coal / Lok Sabha"
    ) -> Dict[str, Any]:
        """Workflow: Question -> Manager -> RetrievalAgent -> ValidationAgent -> GovernmentInquiryAgent."""
        workflow_id = f"wf_inq_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        context = WorkflowContext(
            workflow_id=workflow_id,
            workflow_type="PARLIAMENTARY_INQUIRY",
            initial_prompt=f"Parliamentary Inquiry [{inquiry_ref}]: {question_text}",
            total_steps=3
        )
        agent_registry.persist_workflow_start(context)

        # Step 1: Retrieval
        context.current_step = 1
        ret_task = AgentTask(
            task_id=f"task_ret_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="RetrievalAgent",
            task_type="RETRIEVE_EVIDENCE",
            input_data={"query": question_text, "top_k": 12}
        )
        agent_registry.dispatch_task(ret_task, context)

        # Step 2: Cross-Validation
        context.current_step = 2
        val_task = AgentTask(
            task_id=f"task_val_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="ValidationAgent",
            task_type="CHECK_CONSISTENCY",
            input_data={}
        )
        val_res = agent_registry.dispatch_task(val_task, context)

        # Step 3: Inquiry Response Generation
        context.current_step = 3
        inq_task = AgentTask(
            task_id=f"task_inq_{uuid.uuid4().hex[:6]}",
            workflow_id=workflow_id,
            source_agent=self.name,
            destination_agent="GovernmentInquiryAgent",
            task_type="DRAFT_INQUIRY_RESPONSE",
            input_data={
                "question_text": question_text,
                "inquiry_ref": inquiry_ref,
                "ministry_body": ministry_body,
                "validation_warnings": val_res.warnings
            }
        )
        inq_res = agent_registry.dispatch_task(inq_task, context)

        context.status = WorkflowStatus.COMPLETED if inq_res.status == "SUCCESS" else WorkflowStatus.FAILED
        context.end_time = time.time()
        context.final_output = inq_res.result_data

        agent_registry.persist_workflow_end(context)
        return {
            "workflow": context.to_dict(),
            "inquiry": inq_res.result_data
        }

# Global manager agent instance
manager_agent = ManagerAgent()
