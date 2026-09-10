"""
Advanced OCR Subsystem for SIH26023 Mining Platform.
Provides modular image preprocessing, quality assessment, multi-pass engine routing,
and transparent fallback across Tesseract and Advanced OCR backends.
"""

from services.ocr.models import (
    OCREngineType,
    OCRQualityLevel,
    QualityAssessment,
    PageOCRResult,
    DocumentOCRResult
)
from services.ocr.preprocessing import ImagePreprocessor
from services.ocr.quality import QualityDetector
from services.ocr.base_engine import BaseOCREngine
from services.ocr.tesseract_engine import TesseractEngine
from services.ocr.advanced_engine import AdvancedOCREngine
from services.ocr.ocr_service import OCRService, ocr_service

# Backward-compatible convenience functions
def is_ocr_available() -> bool:
    """Check if any OCR engine is available."""
    return ocr_service.is_ocr_available()

def extract_text_from_image(image_path) -> str:
    """Extract text from an image path."""
    from pathlib import Path
    res = ocr_service.process_image_file(Path(image_path))
    return res.text.strip() if res.text else f"[Image File: {Path(image_path).name} — No readable text extracted]"

def extract_text_from_pixmap(pixmap) -> str:
    """Extract text from a PyMuPDF Pixmap."""
    res = ocr_service.process_page(pixmap)
    return res.text.strip()

__all__ = [
    "OCRService",
    "ocr_service",
    "OCREngineType",
    "OCRQualityLevel",
    "QualityAssessment",
    "PageOCRResult",
    "DocumentOCRResult",
    "ImagePreprocessor",
    "QualityDetector",
    "BaseOCREngine",
    "TesseractEngine",
    "AdvancedOCREngine",
    "is_ocr_available",
    "extract_text_from_image",
    "extract_text_from_pixmap"
]
