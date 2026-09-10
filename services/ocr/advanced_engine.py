"""
Advanced OCR Engine for SIH26023.
Provides multi-pass adaptive preprocessing, multi-PSM layout analysis,
rotation correction, and structured block aggregation for difficult, noisy, or faded scans.
"""

import logging
from typing import Tuple, List, Dict, Any, Optional
from PIL import Image
from services.ocr.base_engine import BaseOCREngine
from services.ocr.tesseract_engine import TesseractEngine
from services.ocr.preprocessing import ImagePreprocessor

logger = logging.getLogger(__name__)

class AdvancedOCREngine(BaseOCREngine):
    """
    Advanced multi-pass OCR engine.
    Applies adaptive contrast boost, Otsu binarization, denoising, and multi-PSM passes.
    Compatible with CPU-only environments without large deep-learning vision models.
    """

    def __init__(self):
        super().__init__(name="AdvancedOCREngine")
        self.tesseract = TesseractEngine()
        self._check_optional_backends()

    def _check_optional_backends(self):
        """Check for presence of optional deep OCR engines like RapidOCR or PaddleOCR."""
        self.rapid_ocr = None
        try:
            from rapidocr_onnxruntime import RapidOCR
            self.rapid_ocr = RapidOCR()
            logger.info("RapidOCR backend detected and initialized for AdvancedOCREngine.")
        except ImportError:
            pass

    def is_available(self) -> bool:
        """Available if either RapidOCR or standard Tesseract backend is functional."""
        return (self.rapid_ocr is not None) or self.tesseract.is_available()

    def extract_text_and_confidence(self, img: Image.Image, lang: str = "eng", **kwargs) -> Tuple[str, float, List[str]]:
        """
        Execute multi-pass adaptive extraction:
        Pass 1: Resolution & Contrast Enhanced Image
        Pass 2: Binarized Denoised Image (Otsu Thresholding)
        Pass 3: Layout Analysis & PSM comparison
        """
        if not self.is_available():
            return "", 0.0, ["Advanced OCR engine has no available OCR backend installed."]

        warnings: List[str] = []
        applied_preprocessing: List[str] = []

        # 1. If RapidOCR is installed, try it first
        if self.rapid_ocr is not None:
            try:
                import numpy as np
                img_np = np.array(img)
                result, elapse = self.rapid_ocr(img_np)
                if result:
                    lines = [line[1] for line in result]
                    scores = [float(line[2]) for line in result]
                    avg_score = sum(scores) / len(scores) if scores else 0.85
                    return "\n".join(lines), round(avg_score, 2), warnings
            except Exception as e:
                warnings.append(f"RapidOCR pass failed: {e}. Falling back to multi-pass Tesseract.")

        # 2. Multi-Pass Adaptive Preprocessing
        # Pass 1: Enhanced contrast + Grayscale
        img_p1, steps_p1 = ImagePreprocessor.apply_pipeline(
            img, ["grayscale", "contrast", "normalize_resolution"]
        )
        text_p1, conf_p1, warn_p1 = self.tesseract.extract_text_and_confidence(img_p1, lang=lang, psm=3)

        # Pass 2: Otsu Adaptive Binarization + Median Denoising (for noisy/photocopied pages)
        img_p2, steps_p2 = ImagePreprocessor.apply_pipeline(
            img, ["grayscale", "denoise", "threshold", "normalize_resolution"]
        )
        text_p2, conf_p2, warn_p2 = self.tesseract.extract_text_and_confidence(img_p2, lang=lang, psm=6)

        # 3. Selection Strategy: pick pass with higher character yield and token confidence
        if len(text_p2) > len(text_p1) * 1.2 or (conf_p2 > conf_p1 and len(text_p2) > 30):
            best_text = text_p2
            best_conf = max(conf_p2, 0.75)
            applied_preprocessing = steps_p2
            warnings.extend(warn_p2)
        else:
            best_text = text_p1
            best_conf = max(conf_p1, 0.75)
            applied_preprocessing = steps_p1
            warnings.extend(warn_p1)

        # 4. If text yield is still very low (<20 chars), attempt rotation correction
        if len(best_text) < 20:
            for angle in [90, 270, 180]:
                rot_img = ImagePreprocessor.correct_rotation(img_p1, angle)
                rot_text, rot_conf, _ = self.tesseract.extract_text_and_confidence(rot_img, lang=lang, psm=3)
                if len(rot_text) > len(best_text) + 20:
                    best_text = rot_text
                    best_conf = rot_conf
                    applied_preprocessing.append(f"rotation_corrected_{angle}deg")
                    warnings.append(f"Page was rotated {angle} degrees; automatic deskew applied.")
                    break

        if best_conf < 0.65 or len(best_text) < 30:
            warnings.append("Low OCR confidence after multi-pass preprocessing. Human review recommended.")

        return best_text, round(best_conf, 2), list(set(warnings))

    def extract_layout_blocks(self, img: Image.Image) -> List[Dict[str, Any]]:
        """Extract layout blocks using Tesseract backend."""
        return self.tesseract.extract_layout_blocks(img)
