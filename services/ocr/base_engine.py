"""
Base OCR Engine Interface for SIH26023.
Defines common execution contracts and confidence calculation methods for all OCR engines.
"""

from abc import ABC, abstractmethod
from typing import Tuple, List, Dict, Any
from PIL import Image

class BaseOCREngine(ABC):
    """Abstract Base Class for OCR extraction backends."""

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def is_available(self) -> bool:
        """Return True if the underlying OCR binary or model library is functional."""
        pass

    @abstractmethod
    def extract_text_and_confidence(self, img: Image.Image, lang: str = "eng", **kwargs) -> Tuple[str, float, List[str]]:
        """
        Extract text from an image.
        Returns:
            (extracted_text: str, confidence_score: float, warnings: List[str])
        """
        pass

    def extract_layout_blocks(self, img: Image.Image) -> List[Dict[str, Any]]:
        """Optional layout block segmentation (paragraphs, headers, tables)."""
        return []
