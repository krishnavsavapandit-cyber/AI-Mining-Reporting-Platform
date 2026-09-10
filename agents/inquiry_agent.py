"""
Government & Parliamentary Inquiry Agent for SIH26023 Multi-Agent Platform.
Specializes in parsing Lok Sabha / Rajya Sabha parliamentary questions, VIP references,
gathering verified evidence, flagging conflicting data, and drafting formal answers
with mandatory 'DRAFT — REQUIRES HUMAN VERIFICATION' disclaimers.
"""

import json
import logging
from typing import Dict, Any, List
from agents.base_agent import BaseAgent
from agents.agent_messages import AgentTask, AgentResult, WorkflowContext, EvidenceItem
from services.ai_service import ai_service
from database.db import get_db, log_audit

logger = logging.getLogger(__name__)

class GovernmentInquiryAgent(BaseAgent):
    """Specialized agent for drafting evidence-grounded parliamentary and ministry inquiries."""

    def __init__(self):
        super().__init__(
            name="GovernmentInquiryAgent",
            description="Decomposes parliamentary questions, aggregates grounded evidence, flags conflicts, and formats draft answers.",
            capabilities=[
                "PARLIAMENTARY_QA",
                "MINISTRY_INQUIRY_DECOMPOSITION",
                "EVIDENCE_GROUNDED_DRAFTING",
                "VERIFICATION_WATERMARKING",
                "CONFLICT_ANNOTATION"
            ]
        )

    def _execute(self, task: AgentTask, context: WorkflowContext) -> AgentResult:
        input_data = task.input_data or {}
        question_text = input_data.get("question_text", "").strip()
        inquiry_ref = input_data.get("inquiry_ref", "LS-UNSTARRED-REF-2026")
        ministry_body = input_data.get("ministry_body", "Ministry of Coal / Parliament of India")
        validation_warnings = input_data.get("validation_warnings", [])

        if not question_text:
            return AgentResult(
                task_id=task.task_id,
                workflow_id=task.workflow_id,
                agent_name=self.name,
                status="FAILED",
                errors=["No question text provided for parliamentary inquiry."]
            )

        evidence = [e.to_dict() if hasattr(e, 'to_dict') else e for e in context.accumulated_evidence]

        # Generate evidence-grounded draft response via AI Service
        inquiry_res = ai_service.generate_inquiry_response(
            question=question_text,
            evidence=evidence,
            validation_warnings=validation_warnings
        )

        draft_response = inquiry_res.get("text", "")
        # Ensure mandatory watermark exists
        if "DRAFT — REQUIRES HUMAN VERIFICATION" not in draft_response:
            draft_response = "### DRAFT — REQUIRES HUMAN VERIFICATION\n\n" + draft_response

        # Save to database
        inquiry_id = None
        try:
            with get_db() as conn:
                cursor = conn.execute(
                    """
                    INSERT INTO inquiries 
                    (inquiry_ref, ministry_body, question_text, parsed_requirements_json, draft_response, status, confidence, validation_notes, human_approved)
                    VALUES (?, ?, ?, ?, ?, 'DRAFT_GENERATED', ?, ?, 0)
                    """,
                    (
                        inquiry_ref, ministry_body, question_text,
                        json.dumps({"warnings": validation_warnings}),
                        draft_response, inquiry_res.get("confidence", 0.90),
                        "\n".join(validation_warnings) if validation_warnings else None
                    )
                )
                inquiry_id = cursor.lastrowid
                log_audit("INQUIRY_DRAFT_GENERATED", resource_type="inquiry", resource_id=inquiry_id, details={
                    "inquiry_ref": inquiry_ref,
                    "evidence_count": len(evidence)
                })
        except Exception as e:
            logger.error(f"Failed to persist inquiry draft in database: {e}")

        sources_list = [
            {"document_name": e.get("document_name"), "page": e.get("page_number", 1), "text_snippet": e.get("source_text", "")[:120]}
            for e in evidence[:8]
        ]

        return AgentResult(
            task_id=task.task_id,
            workflow_id=task.workflow_id,
            agent_name=self.name,
            status="SUCCESS",
            result_data={
                "inquiry_id": inquiry_id,
                "inquiry_ref": inquiry_ref,
                "ministry_body": ministry_body,
                "question_text": question_text,
                "draft_response": draft_response,
                "human_approval_required": True,
                "validation_warnings_count": len(validation_warnings),
                "validation_warnings": validation_warnings,
                "evidence_table": evidence[:8]
            },
            evidence=context.accumulated_evidence,
            confidence=inquiry_res.get("confidence", 0.90),
            warnings=["Requires mandatory sign-off by competent authority prior to submission."] + validation_warnings,
            sources=sources_list,
            next_action="AWAITING_HUMAN_APPROVAL"
        )
