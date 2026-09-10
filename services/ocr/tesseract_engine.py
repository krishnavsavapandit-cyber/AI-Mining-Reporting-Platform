"""
Tesseract OCR Engine for SIH26023.
Wraps pytesseract with word-level confidence scoring and PSM configurations.
"""

import logging
from typing import Tuple, List, Dict, Any
from PIL import Image
import pytesseract
from pytesseract import Output
from config.settings import TESSERACT_CMD
from services.ocr.base_engine import BaseOCREngine

logger = logging.getLogger(__name__)

# Configure pytesseract path if non-default
if TESSERACT_CMD and TESSERACT_CMD != "tesseract":
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

class TesseractEngine(BaseOCREngine):
    """Standard fast Tesseract engine with token-level confidence extraction."""

    def __init__(self):
        super().__init__(name="TesseractEngine")

    def is_available(self) -> bool:
        """Verify Tesseract executable is responsive."""
        try:
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False

    def extract_text_and_confidence(self, img: Image.Image, lang: str = "eng", **kwargs) -> Tuple[str, float, List[str]]:
        """
        Extract text and evaluate word-level OCR confidence.
        """
        if not self.is_available():
            return "", 0.0, ["Tesseract OCR engine is not installed or unreachable on this host."]

        warnings: List[str] = []
        psm = kwargs.get("psm", 3)
        config = f"--psm {psm}"

        try:
            # 1. Extract Full Text
            raw_text = pytesseract.image_to_string(img, lang=lang, config=config).strip()
            
            # 2. Extract Token Confidences
            data = pytesseract.image_to_data(img, lang=lang, config=config, output_type=Output.DICT)
            conf_scores = []
            
            if "conf" in data:
                for c in data["conf"]:
                    try:
                        c_val = float(c)
                        if c_val >= 0:  # -1 represents whitespace/structural block markers in Tesseract
                            conf_scores.append(c_val)
                    except (ValueError, TypeError):
                        pass

            if conf_scores:
                avg_conf = (sum(conf_scores) / len(conf_scores)) / 100.0  # Normalize 0.0 to 1.0
            else:
                avg_conf = 0.85 if len(raw_text) > 50 else 0.50

            if avg_conf < 0.60:
                warnings.append("Low average token recognition confidence (<60%)")

            return raw_text, round(avg_conf, 2), warnings

        except Exception as e:
            logger.warning(f"Tesseract OCR extraction failed: {e}")
            return "", 0.0, [f"Tesseract error: {str(e)}"]

    def extract_layout_blocks(self, img: Image.Image) -> List[Dict[str, Any]]:
        """Extract bounding boxes and paragraph blocks."""
        if not self.is_available():
            return []

        try:
            data = pytesseract.image_to_data(img, output_type=Output.DICT)
            blocks = []
            n_boxes = len(data.get("text", []))
            for i in range(n_boxes):
                txt = data["text"][i].strip()
                if txt:
                    blocks.append({
                        "text": txt,
                        "left": data["left"][i],
                        "top": data["top"][i],
                        "width": data["width"][i],
                        "height": data["height"][i],
                        "confidence": float(data["conf"][i]) / 100.0 if float(data["conf"][i]) >= 0 else 0.5
                    })
            return blocks
        except Exception as e:
            logger.warning(f"Failed to extract layout blocks from Tesseract: {e}")
            return []
