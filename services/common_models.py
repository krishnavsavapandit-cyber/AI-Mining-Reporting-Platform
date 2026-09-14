"""
Unified Failure Classification, Common Data Envelopes & Lineage Models for SIH26023.
Provides structured failure categories, standardized API response envelopes,
evidence lineage models, and system health status definitions.
"""

from enum import Enum
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional, Union
import time
import uuid

class FailureCategory(str, Enum):
    """Unified failure classification across all backend subsystems."""
    TRANSIENT = "TRANSIENT"                         # Temporary network hiccup, IO lock
    RETRYABLE = "RETRYABLE"                         # Rate limit (429), gateway timeout (504), service busy
    NON_RETRYABLE = "NON_RETRYABLE"                 # Bad Request (400), schema mismatch, invalid syntax
    DEPENDENCY_FAILURE = "DEPENDENCY_FAILURE"       # External API down, DB unreachable, missing binary
    DATA_QUALITY_FAILURE = "DATA_QUALITY_FAILURE"   # Low OCR confidence, unreadable scan, corrupted file
    AUTHORIZATION_FAILURE = "AUTHORIZATION_FAILURE" # 401 unauthenticated, 403 forbidden, token expired
    VALIDATION_FAILURE = "VALIDATION_FAILURE"       # Mathematical conflict, impossible values, critical discrepancy
    HUMAN_REVIEW_REQUIRED = "HUMAN_REVIEW_REQUIRED" # Statutory sign-off needed, high variance detected
    SYSTEM_FAILURE = "SYSTEM_FAILURE"               # Unhandled internal exception, out of memory

class HealthStatus(str, Enum):
    """System and dependency health status levels."""
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    UNHEALTHY = "UNHEALTHY"

@dataclass
class StructuredError:
    """Standardized error details attached to failed API responses and agent results."""
    error_code: str
    message: str
    category: FailureCategory = FailureCategory.SYSTEM_FAILURE
    details: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)
    request_id: Optional[str] = None
    retry_after_seconds: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error_code": self.error_code,
            "message": self.message,
            "category": self.category.value if isinstance(self.category, FailureCategory) else str(self.category),
            "details": self.details,
            "timestamp": self.timestamp,
            "request_id": self.request_id,
            "retry_after_seconds": self.retry_after_seconds
        }

@dataclass
class EvidenceLineage:
    """Complete provenance chain linking a generated fact/claim to its source document."""
    evidence_id: str = field(default_factory=lambda: f"ev_{uuid.uuid4().hex[:8]}")
    document_id: Optional[int] = None
    document_name: str = "Unknown Document"
    document_version: int = 1
    page_number: int = 1
    section_title: str = "General"
    chunk_index: Optional[int] = None
    chunk_hash: Optional[str] = None
    source_type: str = "DIGITAL_TEXT"  # DIGITAL_TEXT, OCR_TEXT, TABLE_RECORD, DERIVED_CALCULATION
    ocr_engine: Optional[str] = None
    ocr_quality: Optional[str] = None
    ocr_confidence: float = 1.0
    extraction_method: str = "REGEX_RULE"  # REGEX_RULE, LLM_EXTRACTION, PANDAS_TABLE, USER_INPUT
    confidence: float = 1.0
    contradiction_state: str = "CONFIRMED"  # CONFIRMED, UNVERIFIED, CONFLICT, CONTRADICTED
    citation_text: str = ""
    producing_agent: str = "RetrievalAgent"
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

def make_api_response(
    status: str = "success",
    data: Optional[Dict[str, Any]] = None,
    error: Optional[Union[StructuredError, Dict[str, Any], str]] = None,
    request_id: Optional[str] = None,
    duration_ms: Optional[int] = None,
    extra_root_keys: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Construct a backward-compatible standard API response envelope.
    Merges extra_root_keys at root level so existing frontend callers receive expected fields directly.
    """
    resp: Dict[str, Any] = {
        "status": status,
        "meta": {
            "request_id": request_id or str(uuid.uuid4()),
            "timestamp": time.time(),
            "duration_ms": duration_ms
        }
    }

    if data is not None:
        resp["data"] = data

    if error is not None:
        if isinstance(error, StructuredError):
            resp["error"] = error.to_dict()
            resp["message"] = error.message
            resp["error_code"] = error.error_code
        elif isinstance(error, dict):
            resp["error"] = error
            resp["message"] = error.get("message", "An error occurred")
            resp["error_code"] = error.get("error_code", "ERROR")
        else:
            resp["error"] = {"message": str(error), "error_code": "ERROR"}
            resp["message"] = str(error)
            resp["error_code"] = "ERROR"

    if extra_root_keys:
        for k, v in extra_root_keys.items():
            resp[k] = v

    return resp
