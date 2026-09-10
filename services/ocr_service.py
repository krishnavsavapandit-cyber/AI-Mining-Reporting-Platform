"""
OCR Service Facade for SIH26023 Mining Platform.
Maintains backward compatibility while routing requests to the modular services.ocr package.
"""

from services.ocr import (
    OCRService,
    ocr_service,
    OCREngineType,
    OCRQualityLevel,
    QualityAssessment,
    PageOCRResult,
    DocumentOCRResult,
    ImagePreprocessor,
    QualityDetector,
    BaseOCREngine,
    TesseractEngine,
    AdvancedOCREngine,
    is_ocr_available,
    extract_text_from_image,
    extract_text_from_pixmap
)

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
