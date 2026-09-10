"""
Validation Agent for SIH26023 Multi-Agent Platform.
Responsible for detecting conflicting figures across documents, flagging inconsistencies,
evaluating evidence quality, and enforcing human-in-the-loop review.
"""

import logging
from typing import Dict, Any, List
from agents.base_agent import BaseAgent
from agents.agent_messages import AgentTask, AgentResult, WorkflowContext, EvidenceItem
from services.validation_service import validation_service

logger = logging.getLogger(__name__)

class ValidationAgent(BaseAgent):
    """Specialized agent for cross-document consistency checking and anomaly detection."""

    def __init__(self):
        super().__init__(
            name="ValidationAgent",
            description="Analyzes cross-document figures, detects numerical discrepancies, and flags data inconsistencies.",
            capabilities=[
                "CROSS_DOCUMENT_VALIDATION",
                "DISCREPANCY_DETECTION",
                "NUMERICAL_VARIANCE_ANALYSIS",
                "UNCERTAINTY_FLAGGING"
            ]
        )

    def _execute(self, task: AgentTask, context: WorkflowContext) -> AgentResult:
        input_data = task.input_data or {}
        filter_sub = input_data.get("subsidiary")
        filter_period = input_data.get("reporting_period")

        # 1. Run or fetch cross-document validation issues
        all_issues = validation_service.run_cross_document_validation()

        # Filter relevant issues if subsidiary or period is specified
        relevant_issues = []
        warnings = []
        for issue in all_issues:
            if filter_sub and issue.get("subsidiary") and issue.get("subsidiary") != filter_sub:
                continue
            if filter_period and issue.get("reporting_period") and issue.get("reporting_period") != filter_period:
                continue

            relevant_issues.append(issue)
            warning_msg = (
                f"POTENTIAL DATA INCONSISTENCY: {issue.get('field_name')} for {issue.get('subsidiary')} ({issue.get('reporting_period')}) "
                f"— Doc A [{issue.get('doc_a_name')}, Pg {issue.get('doc_a_page')}]: {issue.get('doc_a_value')} vs "
                f"Doc B [{issue.get('doc_b_name')}, Pg {issue.get('doc_b_page')}]: {issue.get('doc_b_value')} "
                f"(Variance: {issue.get('variance_percentage')}%, Severity: {issue.get('severity')})"
            )
            warnings.append(warning_msg)

        status = "REQUIRES_HUMAN_REVIEW" if relevant_issues else "SUCCESS"

        # Construct evidence items for detected discrepancies
        discrepancy_evidence = []
        for iss in relevant_issues:
            discrepancy_evidence.append(EvidenceItem(
                document_id=iss.get("doc_a_id"),
                document_name=iss.get("doc_a_name", "Doc A"),
                page_number=iss.get("doc_a_page", 1),
                section_title="Validation Conflict",
                source_text=f"Value reported: {iss.get('doc_a_value')} (Conflicts with {iss.get('doc_b_name')}: {iss.get('doc_b_value')})",
                relevance_score=0.98,
                field_name=iss.get("field_name"),
                extracted_value=iss.get("doc_a_value"),
                confidence=0.90,
                producing_agent=self.name,
                metadata={"variance": iss.get("variance_percentage"), "severity": iss.get("severity")}
            ))

        return AgentResult(
            task_id=task.task_id,
            workflow_id=task.workflow_id,
            agent_name=self.name,
            status=status,
            result_data={
                "total_issues_found": len(relevant_issues),
                "inconsistencies": relevant_issues,
                "has_high_severity": any(i.get("severity") == "HIGH" for i in relevant_issues)
            },
            evidence=discrepancy_evidence,
            confidence=0.98,
            warnings=warnings,
            sources=[
                {"document_name": i.get("doc_a_name"), "page": i.get("doc_a_page")}
                for i in relevant_issues
            ],
            next_action="PROCEED_WITH_WARNINGS" if relevant_issues else "VALIDATED_CLEAN"
        )
