"""
Google Gemini Primary AI Provider Implementation for SIH26023.
Communicates via REST API to ensure zero dependency bloat and maximum compatibility.
"""

import os
import json
import logging
import requests
from typing import List, Dict, Any, Optional
from services.ai_provider import AIProvider
from config.settings import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)

class GeminiProvider(AIProvider):
    """Primary Cloud AI Provider using Google Gemini models."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", GEMINI_API_KEY)
        self.model = model or os.getenv("GEMINI_MODEL", GEMINI_MODEL)
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    def is_available(self) -> bool:
        """Check if Gemini API key is configured."""
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def provider_name(self) -> str:
        return f"Google Gemini ({self.model})"

    def _format_evidence_context(self, evidence: List[Dict[str, Any]]) -> str:
        """Format grounded evidence items for prompt injection."""
        if not evidence:
            return "NO EVIDENCE AVAILABLE FROM DOCUMENTS."
        
        ctx = ["--- GROUNDED EVIDENCE FROM CIL/CMPDI DOCUMENTS ---"]
        for idx, item in enumerate(evidence, 1):
            doc = item.get("document_name", "Unknown Document")
            page = item.get("page_number", "N/A")
            section = item.get("section_title", "General")
            text = item.get("source_text", "").strip()
            ctx.append(f"[{idx}] Source Document: {doc} | Page: {page} | Section: {section}\nEvidence Text: {text}\n")
        ctx.append("--- END OF EVIDENCE ---")
        return "\n".join(ctx)

    def _call_gemini_api(self, contents: List[Dict[str, Any]], system_instruction: str) -> str:
        """Execute HTTP POST to Gemini API endpoint."""
        if not self.is_available():
            raise ValueError("Gemini API key is not configured or invalid.")

        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": contents,
            "systemInstruction": {
                "parts": [{"text": system_instruction}]
            },
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 2048,
                "topP": 0.8
            }
        }

        url = f"{self.api_url}?key={self.api_key}"
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code != 200:
            error_details = response.text
            logger.error(f"Gemini API returned status {response.status_code}: {error_details}")
            raise RuntimeError(f"Gemini API Error ({response.status_code}): {error_details}")

        data = response.json()
        try:
            candidates = data.get("candidates", [])
            if candidates and "content" in candidates[0]:
                parts = candidates[0]["content"].get("parts", [])
                if parts:
                    return parts[0].get("text", "")
            return "Insufficient information found in the available documents."
        except Exception as e:
            logger.error(f"Failed to parse Gemini response: {e}")
            raise

    def generate_chat_response(
        self,
        prompt: str,
        system_prompt: str,
        evidence: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        evidence_str = self._format_evidence_context(evidence)
        full_system = f"""{system_prompt}

CRITICAL RULES:
1. Base your answer STRICTLY and EXCLUSIVELY on the provided grounded evidence.
2. If the evidence does not contain sufficient details to answer the user's question, state clearly:
   "Insufficient information found in the available documents."
3. Never invent, fabricate, or assume production figures, geological borehole data, or safety metrics.
4. For every claim, cite the document name and page number.
5. Highlight any contradictions or uncertainties present in the evidence.

{evidence_str}
"""
        contents = []
        if chat_history:
            for msg in chat_history[-6:]:  # Keep recent history
                role = "user" if msg.get("role") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": msg.get("content", "")}]})
        
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        text = self._call_gemini_api(contents, full_system)
        return {
            "text": text,
            "provider": "gemini",
            "model": self.model,
            "confidence": 0.95
        }

    def generate_report_section(
        self,
        section_name: str,
        topic: str,
        evidence: List[Dict[str, Any]],
        instructions: str
    ) -> Dict[str, Any]:
        evidence_str = self._format_evidence_context(evidence)
        system_prompt = f"""You are the Lead Mining Report Generation AI for Coal India Limited / CMPDI.
Generate the report section '{section_name}' for topic '{topic}'.
Follow these instructions: {instructions}
Ground every sentence in the provided evidence. If data for certain KPIs is missing, note it explicitly rather than fabricating.

{evidence_str}
"""
        contents = [{"role": "user", "parts": [{"text": f"Generate formal CIL executive report section for: {section_name}"}]}]
        text = self._call_gemini_api(contents, system_prompt)
        return {
            "text": text,
            "provider": "gemini",
            "model": self.model,
            "confidence": 0.95
        }

    def generate_inquiry_response(
        self,
        question: str,
        evidence: List[Dict[str, Any]],
        validation_warnings: List[str]
    ) -> Dict[str, Any]:
        evidence_str = self._format_evidence_context(evidence)
        warnings_str = "\n".join([f"- {w}" for w in validation_warnings]) if validation_warnings else "None detected."
        
        system_prompt = f"""You are the Parliamentary and Government Inquiry AI Specialist for the Ministry of Coal.
You must draft a formal, evidence-grounded parliamentary answer for the Question below.

MANDATORY RULES:
1. Every answer MUST start with the clear watermarked header: 'DRAFT — REQUIRES HUMAN VERIFICATION'
2. Structure the answer matching the sub-clauses of the inquiry (e.g. (a), (b), (c)).
3. Cite the exact subsidiary, mine, document, and page for each figure.
4. Flag any inconsistencies:
{warnings_str}
5. Never assert official status or speculate beyond verified CIL document excerpts.

{evidence_str}
"""
        contents = [{"role": "user", "parts": [{"text": f"Draft formal Parliamentary Inquiry response for:\n{question}"}]}]
        text = self._call_gemini_api(contents, system_prompt)
        return {
            "text": text,
            "provider": "gemini",
            "model": self.model,
            "confidence": 0.95
        }
