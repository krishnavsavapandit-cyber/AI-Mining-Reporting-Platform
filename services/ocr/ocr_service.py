"""
Central OCR Orchestration Service for SIH26023.
Manages dynamic quality assessment, engine routing (AUTO / TESSERACT / ADVANCED),
multi-stage resilient fallback, provenance assembly, and audit logging.
"""

import io
import time
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Union
from PIL import Image
import pymupdf

from config.settings import (
    OCR_ENGINE as CONFIG_OCR_ENGINE,
    ADVANCED_OCR_ENABLED as CONFIG_ADVANCED_ENABLED,
    OCR_LANGUAGE as CONFIG_OCR_LANG,
    OCR_MAX_PAGE_PIXELS as CONFIG_MAX_PIXELS
)
from database.db import log_audit
from services.ocr.models import (
    QualityAssessment,
    PageOCRResult,
    DocumentOCRResult,
    OCREngineType,
    OCRQualityLevel
)
from services.ocr.quality import QualityDetector
from services.ocr.preprocessing import ImagePreprocessor
from services.ocr.base_engine import BaseOCREngine
from services.ocr.tesseract_engine import TesseractEngine
from services.ocr.advanced_engine import AdvancedOCREngine

logger = logging.getLogger(__name__)

class OCRService:
    """
    Central coordinator for document OCR operations in SIH26023.
    Guarantees zero-crash execution, transparent fallback, and rich provenance tracking.
    """

    def __init__(self):
        self.tesseract_engine = TesseractEngine()
        self.advanced_engine = AdvancedOCREngine()
        self.default_mode = CONFIG_OCR_ENGINE.upper() if CONFIG_OCR_ENGINE else "AUTO"
        self.advanced_enabled = CONFIG_ADVANCED_ENABLED

    def is_ocr_available(self) -> bool:
        """Check if at least one OCR engine backend is operational."""
        return self.tesseract_engine.is_available() or self.advanced_engine.is_available()

    def determine_document_quality(self, img: Image.Image, dpi: int = 150) -> QualityAssessment:
        """Evaluate image heuristics and determine if Advanced OCR is recommended."""
        return QualityDetector.assess_image(img, dpi=dpi)

    def select_ocr_engine(self, quality: QualityAssessment, requested_mode: Optional[str] = None) -> BaseOCREngine:
        """
        Dynamically choose the optimal OCR engine based on quality assessment and configuration.
        """
        mode = (requested_mode or self.default_mode).upper()

        if mode == "ADVANCED" and self.advanced_enabled and self.advanced_engine.is_available():
            return self.advanced_engine

        if mode == "NORMAL" or mode == "TESSERACT":
            return self.tesseract_engine

        # AUTO mode: route based on quality assessment
        if self.advanced_enabled and quality.quality_level in (OCRQualityLevel.LOW.value, OCRQualityLevel.MEDIUM.value) and self.advanced_engine.is_available():
            return self.advanced_engine

        # Default fallback to standard Tesseract
        return self.tesseract_engine

    def process_page(
        self,
        image_or_pixmap: Union[Image.Image, pymupdf.Pixmap, bytes],
        page_number: int = 1,
        filename: str = "document",
        engine_mode: Optional[str] = None,
        lang: str = CONFIG_OCR_LANG
    ) -> PageOCRResult:
        """
        Execute robust OCR on a single page or pixmap with multi-tier fallback.
        """
        start_time = time.time()
        img: Optional[Image.Image] = None

        # 1. Convert input to PIL Image safely
        try:
            if isinstance(image_or_pixmap, pymupdf.Pixmap):
                img_bytes = image_or_pixmap.tobytes("png")
                img = Image.open(io.BytesIO(img_bytes))
            elif isinstance(image_or_pixmap, bytes):
                img = Image.open(io.BytesIO(image_or_pixmap))
            elif isinstance(image_or_pixmap, Image.Image):
                img = image_or_pixmap
            else:
                return PageOCRResult(
                    page_number=page_number,
                    text="",
                    engine_used="None",
                    quality_level=OCRQualityLevel.FAILED.value,
                    confidence=0.0,
                    warnings=["Unsupported image object provided for OCR."],
                    human_review_required=True
                )

            # Check safe resolution bounds to prevent memory exhaustion on low-end machines
            w, h = img.size
            if w * h > CONFIG_MAX_PIXELS:
                logger.warning(f"Image {filename} Pg {page_number} exceeds max pixels ({w}x{h}). Downsampling...")
                img.thumbnail((2000, 2000), Image.Resampling.LANCZOS)

        except Exception as e:
            logger.error(f"Failed to prepare image for OCR (Pg {page_number}): {e}")
            return PageOCRResult(
                page_number=page_number,
                text="",
                engine_used="None",
                quality_level=OCRQualityLevel.FAILED.value,
                confidence=0.0,
                warnings=[f"Image decode error: {str(e)}"],
                human_review_required=True
            )

        # 2. Quality Assessment
        quality_assessment = self.determine_document_quality(img)
        if not quality_assessment.ocr_required:
            return PageOCRResult(
                page_number=page_number,
                text="",
                engine_used="None",
                quality_level=OCRQualityLevel.NOT_REQUIRED.value,
                confidence=1.0,
                warnings=quality_assessment.reasons,
                human_review_required=False
            )

        # 3. Engine Selection
        primary_engine = self.select_ocr_engine(quality_assessment, requested_mode=engine_mode)
        applied_preprocessing: List[str] = []
        warnings: List[str] = list(quality_assessment.reasons)
        extracted_text = ""
        confidence = 0.0
        engine_used_name = primary_engine.name

        # 4. Resilient Execution with Fallback Chain
        # Tier A: Try Primary Selected Engine
        try:
            extracted_text, confidence, engine_warnings = primary_engine.extract_text_and_confidence(img, lang=lang)
            warnings.extend(engine_warnings)
        except Exception as e:
            logger.warning(f"{primary_engine.name} failed on Pg {page_number}: {e}. Triggering fallback.")
            log_audit("OCR_FALLBACK_TRIGGERED", details={
                "page": page_number,
                "primary_engine": primary_engine.name,
                "error": str(e),
                "filename": filename
            })

            # Tier B: Fallback to Tesseract if Advanced failed
            if primary_engine.name != self.tesseract_engine.name and self.tesseract_engine.is_available():
                try:
                    engine_used_name = self.tesseract_engine.name + " (Fallback)"
                    extracted_text, confidence, engine_warnings = self.tesseract_engine.extract_text_and_confidence(img, lang=lang)
                    warnings.extend(engine_warnings)
                    warnings.append("Advanced OCR failed; successfully extracted via standard Tesseract fallback.")
                except Exception as t_err:
                    logger.error(f"Fallback Tesseract also failed on Pg {page_number}: {t_err}")
                    extracted_text = ""
                    confidence = 0.0
                    warnings.append(f"All OCR engines failed: {str(t_err)}")
            else:
                extracted_text = ""
                confidence = 0.0
                warnings.append(f"OCR execution failure: {str(e)}")

        # 5. Evaluate Final Quality Level and Human Review Flag
        elapsed_ms = int((time.time() - start_time) * 1000)
        human_review = False
        final_quality = OCRQualityLevel.HIGH.value

        if not extracted_text or confidence < 0.30:
            final_quality = OCRQualityLevel.FAILED.value
            human_review = True
            confidence = 0.0
        elif confidence < 0.65 or len(extracted_text) < 25:
            final_quality = OCRQualityLevel.LOW.value
            human_review = True
            log_audit("OCR_LOW_CONFIDENCE_FLAGGED", details={
                "page": page_number,
                "filename": filename,
                "confidence": confidence,
                "engine": engine_used_name
            })
        elif confidence < 0.85:
            final_quality = OCRQualityLevel.MEDIUM.value

        # Clean up image memory
        try:
            img.close()
        except Exception:
            pass

        return PageOCRResult(
            page_number=page_number,
            text=extracted_text,
            engine_used=engine_used_name,
            quality_level=final_quality,
            confidence=round(confidence, 2),
            preprocessing_applied=applied_preprocessing,
            warnings=list(set(warnings)),
            execution_time_ms=elapsed_ms,
            human_review_required=human_review
        )

    def process_image_file(self, file_path: Path, engine_mode: Optional[str] = None) -> PageOCRResult:
        """Process a standalone image file (PNG/JPG/JPEG)."""
        if not file_path.exists():
            return PageOCRResult(
                page_number=1,
                text="",
                engine_used="None",
                quality_level=OCRQualityLevel.FAILED.value,
                confidence=0.0,
                warnings=[f"Image file not found at {file_path}"],
                human_review_required=True
            )

        try:
            with Image.open(file_path) as img:
                return self.process_page(img, page_number=1, filename=file_path.name, engine_mode=engine_mode)
        except Exception as e:
            logger.error(f"Failed to open image {file_path}: {e}")
            return PageOCRResult(
                page_number=1,
                text=f"[Image File: {file_path.name} — OCR processing engine encountered error: {str(e)}]",
                engine_used="None",
                quality_level=OCRQualityLevel.FAILED.value,
                confidence=0.0,
                warnings=[str(e)],
                human_review_required=True
            )

# Global Singleton OCR service instance
ocr_service = OCRService()
