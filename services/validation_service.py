"""
Cross-Document Data Validation & Discrepancy Detection Engine for SIH26023.
Compares extracted metrics across different documents for the same subsidiary, mine,
and reporting period, flagging numerical conflicts, computing direction of difference,
calculating percentage variance safely, and managing the discrepancy lifecycle.
"""

import logging
from typing import List, Dict, Any, Optional
from database.db import get_db, log_audit

logger = logging.getLogger(__name__)

class DiscrepancyLifecycleStatus:
    UNRESOLVED = "UNRESOLVED"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"

class ValidationService:
    """Automated consistency and variance checker for mining records."""

    def run_cross_document_validation(self) -> List[Dict[str, Any]]:
        """
        Scan all extracted structured data records in the database.
        Find metric pairs sharing the same field_name, subsidiary, and reporting_period,
        originating from DIFFERENT documents with differing numeric values.
        """
        detected_issues = []

        try:
            with get_db() as conn:
                query = """
                    SELECT 
                        a.id as id_a, a.document_id as doc_a_id, da.original_name as doc_a_name, a.page_number as doc_a_page,
                        a.raw_value as doc_a_value, a.numeric_value as num_a, a.field_name, a.subsidiary, a.reporting_period,
                        b.id as id_b, b.document_id as doc_b_id, db.original_name as doc_b_name, b.page_number as doc_b_page,
                        b.raw_value as doc_b_value, b.numeric_value as num_b
                    FROM extracted_data a
                    JOIN extracted_data b ON a.field_name = b.field_name 
                                         AND a.subsidiary = b.subsidiary 
                                         AND a.reporting_period = b.reporting_period
                                         AND a.document_id < b.document_id
                    JOIN documents da ON a.document_id = da.id
                    JOIN documents db ON b.document_id = db.id
                    WHERE a.numeric_value IS NOT NULL 
                      AND b.numeric_value IS NOT NULL
                      AND a.numeric_value != b.numeric_value
                """
                cursor = conn.execute(query)
                rows = cursor.fetchall()

                for r in rows:
                    num_a = r["num_a"]
                    num_b = r["num_b"]
                    max_val = max(abs(num_a), abs(num_b))
                    if max_val == 0:
                        continue

                    diff = abs(num_a - num_b)
                    var_pct = round((diff / max_val) * 100.0, 2)

                    # Direction of difference
                    if num_a > num_b:
                        direction = f"Source A is higher than Source B by {round(diff, 4)}"
                    else:
                        direction = f"Source A is lower than Source B by {round(diff, 4)}"

                    # Determine severity: CRITICAL, HIGH, MEDIUM, LOW
                    if var_pct > 20.0:
                        severity = "CRITICAL"
                    elif var_pct >= 10.0:
                        severity = "HIGH"
                    elif var_pct >= 2.0:
                        severity = "MEDIUM"
                    else:
                        severity = "LOW"

                    issue_data = {
                        "issue_type": "NUMERICAL_DISCREPANCY",
                        "field_name": r["field_name"],
                        "subsidiary": r["subsidiary"],
                        "reporting_period": r["reporting_period"],
                        "doc_a_id": r["doc_a_id"],
                        "doc_a_name": r["doc_a_name"],
                        "doc_a_page": r["doc_a_page"],
                        "doc_a_value": r["doc_a_value"],
                        "doc_b_id": r["doc_b_id"],
                        "doc_b_name": r["doc_b_name"],
                        "doc_b_page": r["doc_b_page"],
                        "doc_b_value": r["doc_b_value"],
                        "variance_percentage": var_pct,
                        "difference_amount": round(diff, 4),
                        "direction": direction,
                        "severity": severity,
                        "status": DiscrepancyLifecycleStatus.UNRESOLVED
                    }

                    # Check if this exact issue is already logged
                    existing = conn.execute(
                        """
                        SELECT id, status FROM validation_issues 
                        WHERE doc_a_id = ? AND doc_b_id = ? AND field_name = ?
                        """,
                        (r["doc_a_id"], r["doc_b_id"], r["field_name"])
                    ).fetchone()

                    if not existing:
                        conn.execute(
                            """
                            INSERT INTO validation_issues 
                            (issue_type, field_name, subsidiary, reporting_period, doc_a_id, doc_a_name, doc_a_page, doc_a_value, doc_b_id, doc_b_name, doc_b_page, doc_b_value, variance_percentage, severity, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                            (
                                issue_data["issue_type"], issue_data["field_name"], issue_data["subsidiary"],
                                issue_data["reporting_period"], issue_data["doc_a_id"], issue_data["doc_a_name"],
                                issue_data["doc_a_page"], issue_data["doc_a_value"], issue_data["doc_b_id"],
                                issue_data["doc_b_name"], issue_data["doc_b_page"], issue_data["doc_b_value"],
                                issue_data["variance_percentage"], issue_data["severity"], issue_data["status"]
                            )
                        )
                        log_audit("VALIDATION_ISSUE_DETECTED", resource_type="validation", details=issue_data)
                    else:
                        issue_data["status"] = existing["status"]

                    detected_issues.append(issue_data)

        except Exception as e:
            logger.error(f"Cross-document validation scan failed: {e}")

        return detected_issues

    def get_all_issues(self, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve recorded validation issues."""
        try:
            with get_db() as conn:
                sql = "SELECT * FROM validation_issues"
                params = []
                if status_filter:
                    sql += " WHERE status = ?"
                    params.append(status_filter)
                sql += " ORDER BY CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, created_at DESC"
                return conn.execute(sql, params).fetchall()
        except Exception as e:
            logger.error(f"Failed to fetch validation issues: {e}")
            return []

    def update_issue_lifecycle(self, issue_id: int, new_status: str, reviewer: str = "Analyst", reviewer_role: str = "Analyst", reviewer_note: Optional[str] = None) -> bool:
        """
        Transition discrepancy along lifecycle: UNRESOLVED -> UNDER_REVIEW -> RESOLVED / DISMISSED.
        Records reviewer identity, reviewer role, note, and timestamp.
        """
        allowed = {
            DiscrepancyLifecycleStatus.UNRESOLVED,
            DiscrepancyLifecycleStatus.UNDER_REVIEW,
            DiscrepancyLifecycleStatus.RESOLVED,
            DiscrepancyLifecycleStatus.DISMISSED
        }
        if new_status not in allowed:
            logger.warning(f"Invalid discrepancy status: {new_status}")
            return False

        try:
            with get_db() as conn:
                conn.execute(
                    """
                    UPDATE validation_issues 
                    SET status = ?, resolved_by = ?, resolved_note = ?, resolved_at = CURRENT_TIMESTAMP 
                    WHERE id = ?
                    """,
                    (new_status, reviewer, reviewer_note, issue_id)
                )
                log_audit(f"VALIDATION_ISSUE_{new_status}", user_role=reviewer_role, resource_type="validation", resource_id=issue_id, details={
                    "status": new_status, "reviewer": reviewer, "note": reviewer_note
                })
                return True
        except Exception as e:
            logger.error(f"Failed to update validation issue {issue_id}: {e}")
            return False

    def resolve_issue(self, issue_id: int, resolved_by: str = "Analyst") -> bool:
        """Backwards-compatible convenience alias to mark issue RESOLVED."""
        return self.update_issue_lifecycle(issue_id, DiscrepancyLifecycleStatus.RESOLVED, reviewer=resolved_by)

# Global validation service
validation_service = ValidationService()
