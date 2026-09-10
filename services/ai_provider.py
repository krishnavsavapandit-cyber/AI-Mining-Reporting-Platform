"""
Abstract Base Class for AI Provider Abstraction in SIH26023.
Decouples agent and business logic from specific LLM vendors.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class AIProvider(ABC):
    """Abstract interface for all language model providers."""

    @abstractmethod
    def is_available(self) -> bool:
        """Check if provider is configured and reachable."""
        pass

    @abstractmethod
    def provider_name(self) -> str:
        """Return human-readable provider and model identifier."""
        pass

    @abstractmethod
    def generate_chat_response(
        self,
        prompt: str,
        system_prompt: str,
        evidence: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Generate grounded conversational response using retrieved evidence.
        Returns dict: {"text": str, "provider": str, "model": str, "confidence": float}
        """
        pass

    @abstractmethod
    def generate_report_section(
        self,
        section_name: str,
        topic: str,
        evidence: List[Dict[str, Any]],
        instructions: str
    ) -> Dict[str, Any]:
        """Generate structured text for a specific report section."""
        pass

    @abstractmethod
    def generate_inquiry_response(
        self,
        question: str,
        evidence: List[Dict[str, Any]],
        validation_warnings: List[str]
    ) -> Dict[str, Any]:
        """Generate formal government / parliamentary inquiry draft."""
        pass
