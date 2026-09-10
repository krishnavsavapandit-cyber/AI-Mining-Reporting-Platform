"""
Unit tests for AI Provider abstraction and fallback chain (Gemini -> OpenModel -> Deterministic).
"""

import sys
import unittest
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from services.deterministic_provider import DeterministicProvider
from services.gemini_provider import GeminiProvider
from services.open_model_provider import OpenModelProvider
from services.ai_service import AIService

class TestAIProviders(unittest.TestCase):

    def test_deterministic_provider_grounding(self):
        provider = DeterministicProvider()
        self.assertTrue(provider.is_available())

        evidence = [{
            "document_name": "ECL_Report.pdf",
            "page_number": 1,
            "section_title": "Production",
            "source_text": "Coal Production was 1.32 Million Tonnes in May 2025."
        }]

        res = provider.generate_chat_response(
            prompt="What was the production?",
            system_prompt="Test",
            evidence=evidence
        )
        self.assertEqual(res["provider"], "deterministic")
        self.assertIn("1.32", res["text"])
        self.assertIn("ECL_Report.pdf", res["text"])

    def test_deterministic_insufficient_evidence(self):
        provider = DeterministicProvider()
        res = provider.generate_chat_response(
            prompt="What is the weather in Paris?",
            system_prompt="Test",
            evidence=[]
        )
        self.assertIn("Insufficient information found in the available documents", res["text"])

    def test_ai_service_fallback_chain(self):
        service = AIService()
        # Ensure that even if Gemini/OpenModel keys are absent, fallback to deterministic works seamlessly
        evidence = [{
            "document_name": "Test_Doc.pdf",
            "page_number": 2,
            "section_title": "Geology",
            "source_text": "Seam-II was identified with 38.5% ash content."
        }]
        out = service.generate_chat_response("What is the ash content?", "System", evidence)
        self.assertIn("text", out)
        self.assertIn("38.5%", out["text"])

if __name__ == "__main__":
    unittest.main()
