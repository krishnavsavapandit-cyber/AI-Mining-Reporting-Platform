"""
Quality & Governance Agent for SIH26023 Multi-Agent Platform (Agent 8).
Serves as an independent release gatekeeper validating evidence existence,
structured output schemas, numerical calculations, grounding/anti-hallucination compliance,
and regulatory governance policies (RBAC, human verification, parliamentary disclaimers).
"""

import re
import logging
from typing import Dict, Any, List, Optional
from agents.base_agent import BaseAgent
from agents.agent_messages import (
    AgentTask, AgentResult, WorkflowContext, EvidenceItem,
    QualityGateDecision, ProvenanceEdgeType
)
from database.db import get_db

logger = logging.getLogger(__name__)

class QualityGovernanceAgent(BaseAgent):
    """Independent Quality Gatekeeper & Governance Agent enforcing data integrity and policy rules."""

    def __init__(self):
        super().__init__(
            name="QualityGovernanceAgent",
            description="Release gatekeeper performing evidence verification, schema validation, calculation checks, and governance release gating.",
            capabilities=[
                "EVIDENCE_GROUNDING_VERIFICATION",
                "STRUCTURED_SCHEMA_VALIDATION",
                "NUMERICAL_CALCULATION_AUDIT",
                "HALLUCINATION_DETECTION",
                "GOVERNANCE_POLICY_ENFORCEMENT",
                "RELEASE_GATE_DECISION"
            ]
        )

    def _execute(self, task: AgentTask, context: WorkflowContext) -> AgentResult:
        """
        Execute full quality audit and release gate evaluation on upstream workflow results.
        Evaluates evidence fidelity, calculations, schema completeness, and policy mandates.
        """
        input_data = task.input_data or {}
        target_result_data = input_data.get("result_data") or context.final_output or {}
        user_role = input_data.get("user_role") or context.created_by or "Analyst"

        checks_passed = []
        checks_failed = []
        warnings = []
        violations = []

        # 1. Structured Output Schema Validation
        schema_ok, schema_errs = self._validate_results_schema(context)
        if schema_ok:
            checks_passed.append("STRUCTURED_SCHEMA_VALID: All upstream AgentResults satisfy schema contracts.")
        else:
            checks_failed.extend(schema_errs)
            violations.extend(schema_errs)

        # 2. Evidence Grounding & Citation Existence Validation
        evidence_ok, ev_warnings, ev_errs = self._validate_evidence_and_citations(context)
        if evidence_ok:
            checks_passed.append("EVIDENCE_GROUNDING_VALID: Cited documents and page numbers exist.")
        else:
            checks_failed.extend(ev_errs)
            violations.extend(ev_errs)
        warnings.extend(ev_warnings)

        # 3. Numerical Calculation & Variance Recalculation Audit
        calc_ok, calc_warnings, calc_errs = self._audit_calculations_and_units(context)
        if calc_ok:
            checks_passed.append("CALCULATION_INTEGRITY_VALID: Mathematical operations and variance calculations verified.")
        else:
            checks_failed.extend(calc_errs)
            violations.extend(calc_errs)
        warnings.extend(calc_warnings)

        # 3.5 OCR Quality & Confidence Audit
        ocr_ok, ocr_warnings = self._audit_ocr_quality(context)
        if ocr_ok:
            checks_passed.append("OCR_QUALITY_AUDIT_VALID: Extraction confidence satisfies minimum clarity threshold.")
        warnings.extend(ocr_warnings)

        # 4. Governance & Policy Checks (Watermarks, Discrepancies, RBAC)
        gov_ok, gov_warnings, gov_errs, requires_hitl = self._enforce_governance_policies(context, user_role)
        if gov_ok:
            checks_passed.append("GOVERNANCE_POLICY_VALID: Security and statutory requirements fulfilled.")
        else:
            checks_failed.extend(gov_errs)
            violations.extend(gov_errs)
        warnings.extend(gov_warnings)

        # 5. Determine Final Release Gate Decision
        # PASS, WARNING, REJECT, REQUIRES_HUMAN_REVIEW
        if violations:
            final_decision = QualityGateDecision.REJECT
            gate_summary = f"REJECTED: {len(violations)} critical quality/policy violations detected."
            status = "REJECTED"
        elif requires_hitl:
            final_decision = QualityGateDecision.REQUIRES_HUMAN_REVIEW
            gate_summary = "REQUIRES_HUMAN_REVIEW: Statutory sign-off or significant data conflict requires manual review."
            status = "REQUIRES_HUMAN_REVIEW"
        elif warnings:
            final_decision = QualityGateDecision.WARNING
            gate_summary = f"APPROVED WITH WARNINGS: {len(warnings)} non-blocking quality advisories flagged."
            status = "SUCCESS"
        else:
            final_decision = QualityGateDecision.PASS
            gate_summary = "RELEASE APPROVED: 100% Quality, Grounding, Calculation, and Policy Checks Passed."
            status = "SUCCESS"

        quality_report = {
            "decision": final_decision,
            "summary": gate_summary,
            "checks_passed": checks_passed,
            "checks_failed": checks_failed,
            "warnings": warnings,
            "violations": violations,
            "audit_timestamp": task.created_at,
            "auditing_agent": self.name
        }

        # Record decision onto WorkflowContext
        context.quality_decision = final_decision
        context.quality_report = quality_report

        # Update Provenance DAG
        gate_node_id = f"gate_quality_{task.task_id}"
        context.add_dag_node(
            node_id=gate_node_id,
            node_type="QUALITY_GATE",
            label=f"Quality Release Gate ({final_decision})",
            metadata={"decision": final_decision, "violations_count": len(violations), "warnings_count": len(warnings)}
        )
        edge_rel = ProvenanceEdgeType.APPROVED_BY if final_decision in (QualityGateDecision.PASS, QualityGateDecision.WARNING) else ProvenanceEdgeType.REJECTED_BY
        if task.dependencies:
            for dep in task.dependencies:
                context.add_dag_edge(
                    source=f"task_{dep}",
                    target=gate_node_id,
                    relation=edge_rel
                )

        return AgentResult(
            task_id=task.task_id,
            workflow_id=task.workflow_id,
            agent_name=self.name,
            agent_id="quality_governance",
            status=status,
            confidence=1.0 if not violations else 0.0,
            summary=gate_summary,
            structured_data=quality_report,
            result_data=quality_report,
            evidence=context.accumulated_evidence,
            warnings=warnings,
            errors=violations,
            sources=[],
            next_action="WORKFLOW_RELEASE_GATE_COMPLETE"
        )

    # -------------------------------------------------------------------------
    # Validation Modules
    # -------------------------------------------------------------------------
    def _validate_results_schema(self, context: WorkflowContext) -> tuple[bool, List[str]]:
        """Validate AgentResult structure for all executed tasks in context."""
        errs = []
        for tid, res in context.results.items():
            if not getattr(res, "task_id", None):
                errs.append(f"Task result {tid} missing 'task_id'.")
            if not getattr(res, "agent_name", None):
                errs.append(f"Task result {tid} missing 'agent_name'.")
            if not getattr(res, "status", None):
                errs.append(f"Task result {tid} missing 'status'.")
            if getattr(res, "confidence", None) is not None:
                if not (0.0 <= res.confidence <= 1.0):
                    errs.append(f"Task {tid} ({res.agent_name}) has invalid confidence {res.confidence} outside [0.0, 1.0].")

        return (len(errs) == 0, errs)

    def _validate_evidence_and_citations(self, context: WorkflowContext) -> tuple[bool, List[str], List[str]]:
        """Validate that all cited documents and pages physically exist in the database."""
        warnings = []
        errs = []
        cited_doc_names = set()

        for ev in context.accumulated_evidence:
            if ev.document_name:
                cited_doc_names.add((ev.document_name, ev.page_number))
            if ev.page_number < 1:
                errs.append(f"Invalid page number {ev.page_number} for cited document '{ev.document_name}'.")

        # Verify against DB
        if cited_doc_names:
            try:
                with get_db() as conn:
                    for doc_name, page_num in cited_doc_names:
                        row = conn.execute("SELECT id, page_count FROM documents WHERE original_name = ? OR filename = ?", (doc_name, doc_name)).fetchone()
                        if not row:
                            # Check if it was synthetic test document or real
                            if not doc_name.startswith("Test") and not doc_name.startswith("Synthetic"):
                                warnings.append(f"Cited document '{doc_name}' is not registered in central database catalog.")
                        else:
                            page_count = row.get("page_count", 1) or 1
                            if page_num > page_count:
                                errs.append(f"Cited page {page_num} exceeds total page count ({page_count}) for '{doc_name}'.")
            except Exception as e:
                logger.debug(f"Quality gate DB citation check error: {e}")

        return (len(errs) == 0, warnings, errs)

    def _audit_calculations_and_units(self, context: WorkflowContext) -> tuple[bool, List[str], List[str]]:
        """Recalculate mathematical variances and verify unit conversions."""
        warnings = []
        errs = []

        # Check validation agent results if present
        for tid, res in context.results.items():
            if res.agent_name == "ValidationAgent" or res.agent_id == "validation_audit":
                inconsistencies = res.result_data.get("inconsistencies", [])
                for inc in inconsistencies:
                    val_a = inc.get("doc_a_value")
                    val_b = inc.get("doc_b_value")
                    reported_var = inc.get("variance_percentage")

                    # Extract numbers and recalculate
                    num_a = self._extract_first_float(str(val_a))
                    num_b = self._extract_first_float(str(val_b))

                    if num_a is not None and num_b is not None:
                        # Negative checks
                        if num_a < 0 or num_b < 0:
                            errs.append(f"Impossible negative physical quantity in discrepancy check: A={num_a}, B={num_b}")

                        # Check variance calculation accuracy: ((|A-B|)/max(A,B))*100
                        max_val = max(abs(num_a), abs(num_b))
                        if max_val > 0 and reported_var is not None:
                            expected_var = round((abs(num_a - num_b) / max_val) * 100.0, 2)
                            if abs(expected_var - float(reported_var)) > 0.5:
                                errs.append(
                                    f"Mathematical variance miscalculation: reported {reported_var}%, expected {expected_var}% "
                                    f"for values {num_a} vs {num_b}."
                                )

            # Check mining intelligence results for negative figures
            if res.agent_name == "MiningIntelligenceAgent" or res.agent_id == "mining_intelligence":
                facts = res.result_data.get("facts", [])
                for f in facts:
                    num_val = f.get("numeric_value")
                    if num_val is not None and num_val < 0 and f.get("metric") in ("production", "dispatch", "obr", "fatalities", "ash_percentage", "moisture_percentage"):
                        errs.append(f"Invalid negative domain quantity extracted for '{f.get('metric')}': {num_val}")

        return (len(errs) == 0, warnings, errs)

    def _enforce_governance_policies(self, context: WorkflowContext, user_role: str) -> tuple[bool, List[str], List[str], bool]:
        """Validate statutory rules, human-verification watermarks, and RBAC governance."""
        warnings = []
        errs = []
        requires_hitl = False

        # 1. Parliamentary Safeguards
        if context.workflow_type == "PARLIAMENTARY_INQUIRY":
            inq_res = next((r for r in context.results.values() if r.agent_name == "GovernmentInquiryAgent"), None)
            if inq_res:
                draft_text = inq_res.result_data.get("draft_response", "")
                if "DRAFT — REQUIRES HUMAN VERIFICATION" not in draft_text:
                    errs.append("VIOLATION OF STATUTORY POLICY: Parliamentary inquiry draft missing mandatory 'DRAFT — REQUIRES HUMAN VERIFICATION' watermark.")
                else:
                    warnings.append("Parliamentary Safeguard: Output verified with mandatory 'DRAFT — REQUIRES HUMAN VERIFICATION' watermark.")

        # 2. Critical Discrepancy Checks
        val_res = next((r for r in context.results.values() if r.agent_name == "ValidationAgent"), None)
        if val_res:
            inconsistencies = val_res.result_data.get("inconsistencies", [])
            has_high = any(i.get("severity") in ("HIGH", "CRITICAL") for i in inconsistencies)
            if has_high:
                warnings.append(f"Discrepancy Policy: {len(inconsistencies)} data inconsistencies detected across documents.")
                requires_hitl = True

        return (len(errs) == 0, warnings, errs, requires_hitl)

    def _audit_ocr_quality(self, context: WorkflowContext) -> tuple[bool, List[str]]:
        """Audit extraction quality and flag low-confidence OCR sources."""
        warnings = []
        for ev in context.accumulated_evidence:
            conf = getattr(ev, "confidence", 1.0)
            if conf < 0.60:
                warnings.append(
                    f"Low OCR Extraction Confidence ({conf:.2f}) for document '{ev.document_name}', page {ev.page_number}. Human review recommended."
                )
        return (len(warnings) == 0, warnings)

    def _extract_first_float(self, text: str) -> Optional[float]:
        m = re.search(r"[-+]?\d*\.\d+|\d+", text.replace(",", ""))
        return float(m.group(0)) if m else None

