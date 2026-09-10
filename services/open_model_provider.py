"""
Open-Source / Open-Weight Model Fallback Provider for SIH26023.
Supports Ollama, vLLM, LMStudio, LocalAI, and remote OpenAI-compatible endpoints.
"""

import os
import sys
import time
import json
import logging
import requests
from typing import List, Dict, Any, Optional
from services.ai_provider import AIProvider
from config.settings import OPEN_MODEL_ENDPOINT, OPEN_MODEL_API_KEY, OPEN_MODEL_NAME

logger = logging.getLogger(__name__)

class OpenModelProvider(AIProvider):
    """Fallback Open-Weight AI Provider using standard OpenAI-compatible REST API."""

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None
    ):
        self.endpoint = endpoint or os.getenv("OPEN_MODEL_ENDPOINT", OPEN_MODEL_ENDPOINT)
        self.api_key = api_key or os.getenv("OPEN_MODEL_API_KEY", OPEN_MODEL_API_KEY)
        self.model_name = model_name or os.getenv("OPEN_MODEL_NAME", OPEN_MODEL_NAME)
        self._cached_available = None
        self._last_check_time = 0

    def is_available(self) -> bool:
        """Test if endpoint is configured and active with 30s caching."""
        if not self.endpoint:
            return False
        
        current_time = time.time()
        if self._cached_available is not None and (current_time - self._last_check_time) < 30:
            return self._cached_available

        try:
            headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
            base_url = self.endpoint.replace("/chat/completions", "/models")
            res = requests.get(base_url, headers=headers, timeout=0.8)
            self._cached_available = (res.status_code == 200)
        except Exception:
            self._cached_available = False

        self._last_check_time = current_time
        return self._cached_available

    def provider_name(self) -> str:
        return f"Open-Source Endpoint ({self.model_name})"

    def _format_evidence(self, evidence: List[Dict[str, Any]]) -> str:
        if not evidence:
            return "NO EVIDENCE AVAILABLE."
        items = []
        for idx, e in enumerate(evidence, 1):
            doc = e.get("document_name", "Doc")
            page = e.get("page_number", "1")
            text = e.get("source_text", "").strip()
            items.append(f"[{idx}] {doc} (Page {page}): {text}")
        return "\n".join(items)

    def _call_endpoint(self, messages: List[Dict[str, str]]) -> str:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 2048
        }

        try:
            res = requests.post(self.endpoint, headers=headers, json=payload, timeout=25)
            if res.status_code != 200:
                raise RuntimeError(f"OpenModel endpoint returned {res.status_code}: {res.text}")
            data = res.json()
            choices = data.get("choices", [])
            if choices and "message" in choices[0]:
                return choices[0]["message"].get("content", "")
            return "Insufficient information found in the available documents."
        except Exception as e:
            logger.error(f"OpenModel request failed: {e}")
            raise

    def generate_chat_response(
        self,
        prompt: str,
        system_prompt: str,
        evidence: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        evidence_str = self._format_evidence(evidence)
        sys_msg = f"{system_prompt}\n\nEVIDENCE:\n{evidence_str}\n\nAnswer strictly from evidence or state: 'Insufficient information found in the available documents.'"
        messages = [{"role": "system", "content": sys_msg}]
        if chat_history:
            messages.extend(chat_history[-4:])
        messages.append({"role": "user", "content": prompt})

        text = self._call_endpoint(messages)
        return {
            "text": text,
            "provider": "open_model",
            "model": self.model_name,
            "confidence": 0.90
        }

    def generate_report_section(
        self,
        section_name: str,
        topic: str,
        evidence: List[Dict[str, Any]],
        instructions: str
    ) -> Dict[str, Any]:
        evidence_str = self._format_evidence(evidence)
        sys_msg = f"Generate report section '{section_name}' for topic '{topic}'. {instructions}\n\nEvidence:\n{evidence_str}"
        messages = [
            {"role": "system", "content": sys_msg},
            {"role": "user", "content": f"Generate section: {section_name}"}
        ]
        text = self._call_endpoint(messages)
        return {
            "text": text,
            "provider": "open_model",
            "model": self.model_name,
            "confidence": 0.90
        }

    def generate_inquiry_response(
        self,
        question: str,
        evidence: List[Dict[str, Any]],
        validation_warnings: List[str]
    ) -> Dict[str, Any]:
        evidence_str = self._format_evidence(evidence)
        sys_msg = f"Draft Parliamentary Inquiry response for Ministry of Coal.\nMUST start with 'DRAFT — REQUIRES HUMAN VERIFICATION'\n\nEvidence:\n{evidence_str}"
        messages = [
            {"role": "system", "content": sys_msg},
            {"role": "user", "content": question}
        ]
        text = self._call_endpoint(messages)
        return {
            "text": text,
            "provider": "open_model",
            "model": self.model_name,
            "confidence": 0.90
        }
