"""
Pre-OCR Document Quality Assessment Module for SIH26023.
Calculates objective, lightweight image quality heuristics (resolution, contrast, noise, orientation)
to dynamically select the optimal OCR engine and preprocessing pipeline.
"""

import logging
from typing import List, Tuple
from PIL import Image
import numpy as np
from services.ocr.models import QualityAssessment, OCRQualityLevel, OCREngineType

logger = logging.getLogger(__name__)

class QualityDetector:
    """Evaluates image legibility, contrast, and noise heuristics without heavy deep learning models."""

    @classmethod
    def assess_image(cls, img: Image.Image, dpi: int = 150) -> QualityAssessment:
        """
        Evaluate image attributes and return a structured QualityAssessment.
        """
        if img is None:
            return QualityAssessment(
                ocr_required=False,
                quality_level=OCRQualityLevel.FAILED.value,
                recommended_engine=OCREngineType.NONE.value,
                confidence_heuristic=0.0,
                reasons=["Null image provided"]
            )

        width, height = img.size
        reasons: List[str] = []
        is_rotated = False
        rotation_angle = 0

        # 1. Blank Page Detection (all white / transparent / tiny)
        if width < 20 or height < 20:
            return QualityAssessment(
                ocr_required=False,
                quality_level=OCRQualityLevel.NOT_REQUIRED.value,
                recommended_engine=OCREngineType.NONE.value,
                confidence_heuristic=1.0,
                reasons=["Image dimension below minimum readable threshold (blank/empty)"]
            )

        # Convert to grayscale array for mathematical heuristics
        try:
            gray_img = img.convert("L")
            arr = np.array(gray_img, dtype=np.float32)
        except Exception as e:
            logger.warning(f"Failed to convert image to array for quality check: {e}")
            return QualityAssessment(reasons=[f"Image array conversion warning: {e}"])

        # 1. Blank Page & Dynamic Range Evaluation
        min_val = float(np.min(arr))
        max_val = float(np.max(arr))
        pixel_range = max_val - min_val

        if pixel_range < 12.0:
            # Almost uniform pixel values across the entire page (blank or solid color)
            return QualityAssessment(
                ocr_required=False,
                quality_level=OCRQualityLevel.NOT_REQUIRED.value,
                recommended_engine=OCREngineType.NONE.value,
                confidence_heuristic=1.0,
                reasons=["Blank or solid-color page detected"]
            )

        # 2. Contrast Assessment
        contrast_ratio = min(pixel_range / 200.0, 1.0)
        if pixel_range < 65.0:
            reasons.append("Low contrast between text and background")

        # 3. Noise Estimation (High frequency pixel variation)
        diff_h = np.abs(arr[1:, :] - arr[:-1, :])
        diff_w = np.abs(arr[:, 1:] - arr[:, :-1])
        noise_metric = float((np.mean(diff_h) + np.mean(diff_w)) / 2.0)
        noise_estimate = min(noise_metric / 40.0, 1.0)

        if noise_metric > 35.0:
            reasons.append("High image noise / photocopy grain detected")


        # 4. Aspect Ratio & Orientation Heuristics
        aspect_ratio = width / max(height, 1)
        if aspect_ratio > 3.0 or aspect_ratio < 0.25:
            is_rotated = True
            rotation_angle = 90
            reasons.append("Unusual orientation / extreme aspect ratio detected")

        # 5. Resolution / DPI Check
        effective_dpi = dpi
        if (width < 350 and height < 350) or dpi < 90:
            reasons.append("Low resolution image (upscaling recommended)")
            effective_dpi = max(int(width / 8.5), 72)

        # 6. Overall Quality Determination
        quality = OCRQualityLevel.HIGH.value
        recommended_engine = OCREngineType.TESSERACT.value
        confidence = 0.92

        if pixel_range < 40.0 or noise_metric > 40.0 or len(reasons) >= 2:
            quality = OCRQualityLevel.LOW.value
            recommended_engine = OCREngineType.ADVANCED.value
            confidence = 0.65
        elif len(reasons) >= 1 or pixel_range < 90.0 or noise_metric > 25.0:
            quality = OCRQualityLevel.MEDIUM.value
            recommended_engine = OCREngineType.ADVANCED.value
            confidence = 0.80

        return QualityAssessment(
            ocr_required=True,
            quality_level=quality,
            recommended_engine=recommended_engine,
            confidence_heuristic=confidence,
            resolution_dpi=effective_dpi,
            contrast_ratio=contrast_ratio,
            noise_estimate=noise_estimate,
            is_rotated=is_rotated,
            rotation_angle=rotation_angle,
            reasons=reasons
        )


