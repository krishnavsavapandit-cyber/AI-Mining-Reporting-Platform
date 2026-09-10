"""
AI Service Orchestrator for SIH26023.
Manages provider selection, dynamic fallback chain (Gemini -> OpenModel -> Deterministic),
evidence sufficiency evaluation (Hard No-Hallucination Gate), and semantic confidence breakdown.
"""

import re
import logging
from typing import List, Dict, Any, Optional
from services.ai_provider import AIProvider
from services.gemini_provider import GeminiProvider
from services.open_model_provider import OpenModelProvider
from services.deterministic_provider import DeterministicProvider
from config.settings import AI_PROVIDER, AI_FALLBACK_PROVIDER

logger = logging.getLogger(__name__)

MANDATORY_NO_EVIDENCE_RESPONSE = "Insufficient information found in the available documents."

class AIService:
    """Central AI interface managing primary and fallback model execution and strict hallucination gating."""

    def __init__(self):
        self.gemini = GeminiProvider()
        self.open_model = OpenModelProvider()
        self.deterministic = DeterministicProvider()
        self.preferred_provider = AI_PROVIDER
        self.fallback_provider = AI_FALLBACK_PROVIDER

    def get_active_provider_info(self) -> Dict[str, Any]:
        """Return operational status of all configured AI providers."""
        return {
            "preferred_provider": self.preferred_provider,
            "fallback_provider": self.fallback_provider,
            "providers": {
                "gemini": {
                    "configured": self.gemini.is_available(),
                    "name": self.gemini.provider_name(),
                    "model": self.gemini.model
                },
                "open_model": {
                    "configured": self.open_model.is_available(),
                    "name": self.open_model.provider_name(),
                    "endpoint": self.open_model.endpoint
                },
                "deterministic": {
                    "configured": True,
                    "name": self.deterministic.provider_name(),
                    "status": "READY (Always Available)"
                }
            }
        }

    def is_evidence_sufficient(self, prompt: str, evidence: List[Dict[str, Any]]) -> bool:
        """
        Evaluate if retrieved evidence contains sufficient substantive content
        to empirically answer the prompt. Gated at the application level.
        """
        if not evidence or len(evidence) == 0:
            return False

        # Check relevance scores (default to 1.0 if not specified in manual test dicts)
        max_rel = max((e.get("relevance_score", 1.0) for e in evidence), default=0.0)
        if max_rel < 0.10:
            return False

        # Extract discriminating terms from query
        q_clean = prompt.lower()
        stopwords = {
            'what', 'when', 'where', 'which', 'show', 'tell', 'about', 'from', 'with',
            'during', 'were', 'have', 'been', 'reported', 'please', 'give', 'the', 'for',
            'and', 'are', 'was', 'state', 'will', 'minister', 'coal', 'india', 'cil',
            'operations', 'details', 'information', 'status', 'total', 'average', 'has', 'any'
        }
        keywords = [w for w in re.findall(r'\b[a-zA-Z]{3,}\b', q_clean) if w not in stopwords]

        if not keywords:
            return True  # Generic prompt with high relevance

        combined_evidence_text = " ".join([e.get("source_text", "").lower() for e in evidence])
        matched_kw = sum(1 for kw in keywords if kw in combined_evidence_text)

        # Overlap ratio: If discriminating keywords are present, require at least 40% overlap or at least 2 keywords
        overlap_ratio = float(matched_kw) / max(len(keywords), 1)
        if len(keywords) == 1:
            return matched_kw == 1
        elif len(keywords) == 2:
            return matched_kw >= 1
        else:
            return matched_kw >= 2 or overlap_ratio >= 0.35

    def compute_confidence_semantics(
        self,
        evidence: List[Dict[str, Any]],
        validation_warnings: Optional[List[str]] = None,
        is_sufficient: bool = True
    ) -> Dict[str, Any]:
        """
        Compute multi-dimensional confidence breakdown adhering to SIH26023 Section 8:
        - OCR / Extraction confidence
        - Retrieval relevance
        - Validation status (CONFIRMED / CONFLICT / UNVERIFIED / INSUFFICIENT)
        - Interpretation type (EXTRACTED_FACT / AI_INTERPRETATION / AI_RECOMMENDATION / HUMAN_APPROVED)
        """
        if not is_sufficient or not evidence:
            return {
                "overall_confidence": 0.0,
                "extraction_confidence": 0.0,
                "retrieval_relevance": 0.0,
                "validation_status": "INSUFFICIENT",
                "interpretation_type": "INSUFFICIENT_EVIDENCE"
            }

        # Average extraction confidence from producing records
        ext_confs = [e.get("confidence", 0.95) for e in evidence if "confidence" in e]
        avg_ext_conf = round(sum(ext_confs) / max(len(ext_confs), 1), 3)

        # Max and mean retrieval relevance
        rel_scores = [e.get("relevance_score", 0.8) for e in evidence]
        max_rel = round(max(rel_scores), 3) if rel_scores else 0.8

        # Validation status
        if validation_warnings and len(validation_warnings) > 0:
            val_status = "CONFLICT"
        elif len(evidence) > 0:
            val_status = "CONFIRMED"
        else:
            val_status = "UNVERIFIED"

        return {
            "overall_confidence": round(avg_ext_conf * 0.5 + max_rel * 0.5, 3),
            "extraction_confidence": avg_ext_conf,
            "retrieval_relevance": max_rel,
            "validation_status": val_status,
            "interpretation_type": "AI_INTERPRETATION"
        }

    def generate_chat_response(
        self,
        prompt: str,
        system_prompt: str,
        evidence: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """Execute chat query through the fallback chain with strict evidence gating."""
        # Hard No-Hallucination Pre-Check
        if not self.is_evidence_sufficient(prompt, evidence):
            logger.info("Hard No-Hallucination Gate triggered: Insufficient evidence found.")
            semantics = self.compute_confidence_semantics(evidence, is_sufficient=False)
            return {
                "text": MANDATORY_NO_EVIDENCE_RESPONSE,
                "provider": "application_gate",
                "model": "grounding_filter",
                "confidence": 0.0,
                "confidence_semantics": semantics
            }

        # 1. Attempt Primary Provider
        if self.preferred_provider == "gemini" and self.gemini.is_available():
            try:
                logger.info("Executing chat query via Primary Provider (Gemini)")
                res = self.gemini.generate_chat_response(prompt, system_prompt, evidence, chat_history)
                res["confidence_semantics"] = self.compute_confidence_semantics(evidence, is_sufficient=True)
                return res
            except Exception as e:
                logger.warning(f"Gemini provider failed ({e}). Falling back...")

        # 2. Attempt Fallback Provider
        if self.fallback_provider == "open_model" and self.open_model.is_available():
            try:
                logger.info("Executing chat query via Fallback Provider (OpenModel)")
                res = self.open_model.generate_chat_response(prompt, system_prompt, evidence, chat_history)
                res["confidence_semantics"] = self.compute_confidence_semantics(evidence, is_sufficient=True)
                return res
            except Exception as e:
                logger.warning(f"OpenModel fallback failed ({e}). Falling back to Deterministic...")

        # 3. Final Fallback: Deterministic Grounded Engine
        logger.info("Executing chat query via Deterministic Grounded Engine")
        res = self.deterministic.generate_chat_response(prompt, system_prompt, evidence, chat_history)
        res["confidence_semantics"] = self.compute_confidence_semantics(evidence, is_sufficient=True)
        return res

    def generate_report_section(
        self,
        section_name: str,
        topic: str,
        evidence: List[Dict[str, Any]],
        instructions: str = ""
    ) -> Dict[str, Any]:
        """Generate report section via fallback chain."""
        if not evidence or len(evidence) == 0:
            return self.deterministic.generate_report_section(section_name, topic, evidence, instructions)

        if self.preferred_provider == "gemini" and self.gemini.is_available():
            try:
                return self.gemini.generate_report_section(section_name, topic, evidence, instructions)
            except Exception as e:
                logger.warning(f"Gemini report generation failed ({e}). Falling back...")

        if self.fallback_provider == "open_model" and self.open_model.is_available():
            try:
                return self.open_model.generate_report_section(section_name, topic, evidence, instructions)
            except Exception as e:
                logger.warning(f"OpenModel report generation failed ({e}). Falling back...")

        return self.deterministic.generate_report_section(section_name, topic, evidence, instructions)

    def generate_inquiry_response(
        self,
        question: str,
        evidence: List[Dict[str, Any]],
        validation_warnings: List[str]
    ) -> Dict[str, Any]:
        """Generate parliamentary inquiry response via fallback chain with watermark and evidence gating."""
        if not self.is_evidence_sufficient(question, evidence):
            logger.info("Inquiry No-Evidence Gate triggered.")
            no_ev_text = (
                "**DRAFT — REQUIRES HUMAN VERIFICATION**\n\n"
                "**MINISTRY OF COAL / PARLIAMENTARY INQUIRY DRAFT**\n"
                f"**Inquiry Query:** {question}\n\n"
                "**Response:**\n"
                f"{MANDATORY_NO_EVIDENCE_RESPONSE}\n"
                "No empirical records or production figures matching the inquiry parameters exist in the currently cataloged document repository."
            )
            return {
                "text": no_ev_text,
                "provider": "application_gate",
                "model": "grounding_filter",
                "confidence": 0.0,
                "confidence_semantics": self.compute_confidence_semantics(evidence, validation_warnings, is_sufficient=False)
            }

        if self.preferred_provider == "gemini" and self.gemini.is_available():
            try:
                res = self.gemini.generate_inquiry_response(question, evidence, validation_warnings)
                res["confidence_semantics"] = self.compute_confidence_semantics(evidence, validation_warnings, is_sufficient=True)
                return res
            except Exception as e:
                logger.warning(f"Gemini inquiry generation failed ({e}). Falling back...")

        if self.fallback_provider == "open_model" and self.open_model.is_available():
            try:
                res = self.open_model.generate_inquiry_response(question, evidence, validation_warnings)
                res["confidence_semantics"] = self.compute_confidence_semantics(evidence, validation_warnings, is_sufficient=True)
                return res
            except Exception as e:
                logger.warning(f"OpenModel inquiry generation failed ({e}). Falling back...")

        res = self.deterministic.generate_inquiry_response(question, evidence, validation_warnings)
        res["confidence_semantics"] = self.compute_confidence_semantics(evidence, validation_warnings, is_sufficient=True)
        return res

# Global AI Service instance
ai_service = AIService()
