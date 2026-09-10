"""
Focused Verification Test: Fallback Chain Execution Sequence.
Verifies that:
1. When Gemini fails, OpenModelProvider is attempted.
2. If OpenModelProvider succeeds, its response is returned.
3. If OpenModelProvider also fails (e.g. endpoint down/unreachable), DeterministicProvider is invoked.
4. Normal startup occurs without requiring local models or Gemini keys.
"""

import unittest
from unittest.mock import MagicMock, patch
from services.ai_service import AIService
from services.open_model_provider import OpenModelProvider
from services.gemini_provider import GeminiProvider
from services.deterministic_provider import DeterministicProvider

class TestFallbackChainTrace(unittest.TestCase):

    def setUp(self):
        self.ai_service = AIService()

    def test_gemini_to_openmodel_fallback(self):
        """Confirm that Gemini failure triggers OpenModelProvider."""
        call_log = []

        # Mock Gemini available but throwing an API error
        self.ai_service.gemini.is_available = lambda: True
        def mock_gemini_call(*args, **kwargs):
            call_log.append("GEMINI_ATTEMPTED")
            raise RuntimeError("Gemini Quota Exceeded (429)")
        self.ai_service.gemini.generate_chat_response = mock_gemini_call

        # Mock OpenModel available and succeeding
        self.ai_service.open_model.is_available = lambda: True
        def mock_openmodel_call(*args, **kwargs):
            call_log.append("OPENMODEL_ATTEMPTED")
            return {
                "text": "Answer from OpenModel (Llama-3.2)",
                "provider": "open_model",
                "model": "llama3.2:3b",
                "confidence": 0.90
            }
        self.ai_service.open_model.generate_chat_response = mock_openmodel_call

        # Mock Deterministic
        def mock_deterministic_call(*args, **kwargs):
            call_log.append("DETERMINISTIC_ATTEMPTED")
            return {"text": "Deterministic answer", "provider": "deterministic"}
        self.ai_service.deterministic.generate_chat_response = mock_deterministic_call

        evidence = [{
            "document_name": "Test.pdf",
            "page_number": 1,
            "section_title": "Production",
            "source_text": "Coal production reached 10.5 MT in Q1.",
            "relevance_score": 0.9
        }]

        res = self.ai_service.generate_chat_response("What is the coal production?", "System", evidence)

        self.assertEqual(call_log, ["GEMINI_ATTEMPTED", "OPENMODEL_ATTEMPTED"])
        self.assertEqual(res.get("provider"), "open_model")
        self.assertIn("Llama-3.2", res.get("text"))

    def test_gemini_and_openmodel_failure_triggers_deterministic(self):
        """Confirm that when both Gemini and OpenModel fail, DeterministicProvider is reached."""
        call_log = []

        # Mock Gemini failing
        self.ai_service.gemini.is_available = lambda: True
        def mock_gemini_call(*args, **kwargs):
            call_log.append("GEMINI_ATTEMPTED")
            raise RuntimeError("Network Timeout")
        self.ai_service.gemini.generate_chat_response = mock_gemini_call

        # Mock OpenModel failing
        self.ai_service.open_model.is_available = lambda: True
        def mock_openmodel_call(*args, **kwargs):
            call_log.append("OPENMODEL_ATTEMPTED")
            raise ConnectionError("Local Ollama endpoint connection refused")
        self.ai_service.open_model.generate_chat_response = mock_openmodel_call

        # Real Deterministic provider
        evidence = [{
            "document_name": "Test_Doc.pdf",
            "page_number": 1,
            "section_title": "Production",
            "source_text": "Coal production was 15.2 MT.",
            "relevance_score": 0.9
        }]

        res = self.ai_service.generate_chat_response("What was the coal production?", "System", evidence)

        self.assertEqual(call_log, ["GEMINI_ATTEMPTED", "OPENMODEL_ATTEMPTED"])
        self.assertEqual(res.get("provider"), "deterministic")
        self.assertIn("15.2 MT", res.get("text"))

    def test_startup_without_local_model_or_api_keys(self):
        """Confirm that OpenModelProvider is_available() is False and safe when endpoint is down."""
        provider = OpenModelProvider(endpoint="http://localhost:9999/invalid/endpoint")
        self.assertFalse(provider.is_available())
        self.assertIn("Open-Source Endpoint", provider.provider_name())

if __name__ == "__main__":
    unittest.main()
