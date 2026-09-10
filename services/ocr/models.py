"""
Data models and type definitions for SIH26023 Advanced OCR Subsystem.
Defines strongly-typed quality assessments, page results, and document results.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any, Optional
import time

class OCREngineType(str, Enum):
    AUTO = "AUTO"
    TESSERACT = "TESSERACT"
    ADVANCED = "ADVANCED"
    NONE = "NONE"

class OCRQualityLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    FAILED = "FAILED"
    NOT_REQUIRED = "NOT_REQUIRED"

@dataclass
class QualityAssessment:
    """Pre-OCR heuristic assessment of image/page legibility and noise."""
    ocr_required: bool = True
    quality_level: str = OCRQualityLevel.HIGH.value
    recommended_engine: str = OCREngineType.TESSERACT.value
    confidence_heuristic: float = 0.90
    resolution_dpi: int = 150
    contrast_ratio: float = 1.0
    noise_estimate: float = 0.0
    is_rotated: bool = False
    rotation_angle: int = 0
    reasons: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ocr_required": self.ocr_required,
            "quality": self.quality_level,
            "recommended_engine": self.recommended_engine,
            "confidence_heuristic": round(self.confidence_heuristic, 2),
            "resolution_dpi": self.resolution_dpi,
            "contrast_ratio": round(self.contrast_ratio, 2),
            "noise_estimate": round(self.noise_estimate, 2),
            "is_rotated": self.is_rotated,
            "rotation_angle": self.rotation_angle,
            "reasons": self.reasons
        }

@dataclass
class PageOCRResult:
    """Structured OCR extraction result for an individual document page."""
    page_number: int = 1
    text: str = ""
    engine_used: str = "Tesseract"
    quality_level: str = OCRQualityLevel.HIGH.value
    confidence: float = 0.90
    preprocessing_applied: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    tables: List[Dict[str, Any]] = field(default_factory=list)
    execution_time_ms: int = 0
    human_review_required: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "page_number": self.page_number,
            "text": self.text,
            "engine_used": self.engine_used,
            "ocr_quality": self.quality_level,
            "confidence": round(self.confidence, 2),
            "preprocessing_applied": self.preprocessing_applied,
            "warnings": self.warnings,
            "tables": self.tables,
            "execution_time_ms": self.execution_time_ms,
            "human_review_required": self.human_review_required
        }

@dataclass
class DocumentOCRResult:
    """Consolidated document-level OCR summary."""
    document_id: Optional[int] = None
    filename: str = ""
    total_pages: int = 1
    pages_ocr_processed: int = 0
    overall_quality: str = OCRQualityLevel.HIGH.value
    overall_confidence: float = 0.90
    primary_engine: str = "Tesseract"
    pages: List[PageOCRResult] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    human_review_required: bool = False
    timestamp: str = field(default_factory=lambda: time.strftime("%Y-%m-%d %H:%M:%S"))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "document_id": self.document_id,
            "filename": self.filename,
            "total_pages": self.total_pages,
            "pages_ocr_processed": self.pages_ocr_processed,
            "overall_quality": self.overall_quality,
            "overall_confidence": round(self.overall_confidence, 2),
            "primary_engine": self.primary_engine,
            "pages": [p.to_dict() for p in self.pages],
            "warnings": self.warnings,
            "human_review_required": self.human_review_required,
            "timestamp": self.timestamp
        }
