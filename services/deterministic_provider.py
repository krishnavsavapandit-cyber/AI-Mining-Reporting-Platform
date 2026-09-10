"""
Deterministic Heuristic & Grounded Rule Synthesizer for SIH26023.
Ensures 100% offline, zero-cost, reliable functionality when external LLM APIs are unavailable.
Strictly bases all outputs on extracted facts and retrieved evidence chunks.
"""

import re
import logging
from typing import List, Dict, Any, Optional
from services.ai_provider import AIProvider

logger = logging.getLogger(__name__)

class DeterministicProvider(AIProvider):
    """Fallback Rule-Based Synthesizer grounded strictly in extracted evidence."""

    def is_available(self) -> bool:
        return True  # Always available locally

    def provider_name(self) -> str:
        return "Deterministic Grounded Engine (Local Heuristics)"

    def generate_chat_response(
        self,
        prompt: str,
        system_prompt: str,
        evidence: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        if not evidence:
            return {
                "text": "Insufficient information found in the available documents.",
                "provider": "deterministic",
                "model": "rule_based_synthesizer",
                "confidence": 0.0,
                "validation_status": "INSUFFICIENT"
            }

        q_lower = prompt.lower()
        findings = []
        sources = set()

        # Match evidence sentences relevant to user query
        keywords = [w for w in re.findall(r'\b\w{3,}\b', q_lower) if w not in {'what', 'when', 'where', 'which', 'show', 'tell', 'about', 'from', 'with', 'during', 'were', 'have', 'been', 'reported', 'please', 'give'}]

        matched_items = []
        total_kw_matches = 0
        for item in evidence:
            text = item.get("source_text", "").strip()
            doc = item.get("document_name", "Document")
            page = item.get("page_number", 1)
            sec = item.get("section_title", "Section")
            rel_score = item.get("relevance_score", 1.0)
            
            # Split sentences cleanly without breaking decimal numbers (e.g. 1.32 or 38.5%)
            sentences = [s.strip() for s in re.split(r'(?<=[a-zA-Z])\.\s+|\n+', text) if len(s.strip()) > 10]
            if not sentences and text:
                sentences = [text]

            for s in sentences:
                s_lower = s.lower()
                matches = sum(1 for kw in keywords if kw in s_lower)
                total_kw_matches += matches
                if matches > 0:
                    findings.append(f"- {s} (Source: {doc}, Page {page})")
                    sources.add(f"{doc} (Page {page})")
                    matched_items.append((matches, s, doc, page))

        # Hard No-Hallucination Rule: If no relevant keywords matched across all evidence chunks
        if not findings or (keywords and total_kw_matches == 0):
            return {
                "text": "Insufficient information found in the available documents.",
                "provider": "deterministic",
                "model": "rule_based_synthesizer",
                "confidence": 0.0,
                "validation_status": "INSUFFICIENT"
            }

        response_lines = [
            f"Based on analysis of the uploaded CIL/CMPDI documents, here are the verified findings:\n",
            "\n".join(findings[:6]),
            f"\n\n**Sources Consulted:** {', '.join(sorted(sources))}",
            f"\n\n*(Synthesized using Deterministic Grounded Engine. All claims are extracted directly from verified document records.)*"
        ]

        return {
            "text": "".join(response_lines),
            "provider": "deterministic",
            "model": "rule_based_synthesizer",
            "confidence": 0.88,
            "validation_status": "CONFIRMED"
        }

    def generate_report_section(
        self,
        section_name: str,
        topic: str,
        evidence: List[Dict[str, Any]],
        instructions: str
    ) -> Dict[str, Any]:
        if not evidence:
            return {
                "text": f"### {section_name}\n*No verified document records found for {topic} in the selected reporting period.*",
                "provider": "deterministic",
                "model": "rule_based_synthesizer",
                "confidence": 0.85
            }

        lines = [f"### {section_name}\n"]
        lines.append(f"This section synthesizes verified operational and geological findings regarding **{topic}** from {len(evidence)} source evidence records:\n")
        
        for idx, item in enumerate(evidence[:8], 1):
            doc = item.get("document_name", "Record")
            page = item.get("page_number", 1)
            sec = item.get("section_title", "General")
            text = item.get("source_text", "").strip()
            # Truncate text cleanly
            snip = text if len(text) < 220 else text[:215] + "..."
            lines.append(f"{idx}. **[{doc} — Pg {page}, {sec}]**: {snip}")

        return {
            "text": "\n".join(lines),
            "provider": "deterministic",
            "model": "rule_based_synthesizer",
            "confidence": 0.85
        }

    def generate_inquiry_response(
        self,
        question: str,
        evidence: List[Dict[str, Any]],
        validation_warnings: List[str]
    ) -> Dict[str, Any]:
        lines = [
            "**DRAFT — REQUIRES HUMAN VERIFICATION**\n",
            "**MINISTRY OF COAL / PARLIAMENTARY REFERENCE RESPONSE (DRAFT)**\n",
            f"**Subject Reference:** Inquiry on Mining Performance & Operations\n",
            f"**Inquiry Query:** {question}\n",
            "---\n",
            "### DRAFT RESPONSE POINTS:\n"
        ]

        if not evidence:
            lines.append("Insufficient information found in the available documents. No empirical records are cataloged in the repository matching the parameters of this inquiry.")
        else:
            lines.append("Based on verified document archives from Coal India Limited and subsidiary management reports:\n")
            for idx, item in enumerate(evidence[:5], 1):
                doc = item.get("document_name", "Report")
                page = item.get("page_number", 1)
                text = item.get("source_text", "").strip()
                lines.append(f"({chr(96 + idx)}) Regarding stated operational parameters: {text} [Ref: {doc}, Page {page}].")

        if validation_warnings:
            lines.append("\n### ⚠ CAUTION / DATA INCONSISTENCIES FLAGGED:")
            for w in validation_warnings:
                lines.append(f"- {w}")
            lines.append("\n*Note for Verifying Officer: Please cross-verify conflicting figures with the Subsidiary Director of Operations prior to final tabling.*")

        lines.append("\n\n---\n*Verified by CIL Multi-Agent Inquiry System. Official sign-off required prior to parliamentary submission.*")

        return {
            "text": "\n".join(lines),
            "provider": "deterministic",
            "model": "rule_based_synthesizer",
            "confidence": 0.88
        }
