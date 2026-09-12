"""
Mining Intelligence Agent for SIH26023 Multi-Agent Platform (Agent 4).
Specialized domain-intelligence agent responsible for extracting mining-specific entities,
normalizing measurement units, computing domain KPIs (stripping ratio, LTIFR),
identifying coal grades, seams, HEMM fleet statistics, and environmental metrics with strict page provenance.
"""

import re
import logging
from typing import Dict, Any, List, Optional
from agents.base_agent import BaseAgent
from agents.agent_messages import AgentTask, AgentResult, WorkflowContext, EvidenceItem, ProvenanceEdgeType
from database.db import get_db

logger = logging.getLogger(__name__)

# Standard CIL Coal Grade GCV bands (kcal/kg)
COAL_GRADE_GCV_MAP = {
    "G1": (7001, 8000), "G2": (6701, 7000), "G3": (6401, 6700), "G4": (6101, 6400),
    "G5": (5801, 6100), "G6": (5501, 5800), "G7": (5201, 5500), "G8": (4901, 5200),
    "G9": (4601, 4900), "G10": (4301, 4600), "G11": (4001, 4300), "G12": (3701, 4000),
    "G13": (3401, 3700), "G14": (3101, 3400), "G15": (2801, 3100), "G16": (2501, 2800),
    "G17": (2201, 2500)
}

class MiningIntelligenceAgent(BaseAgent):
    """Specialized Domain-Intelligence Agent for Coal India & CMPDI Mining Operations."""

    def __init__(self):
        super().__init__(
            name="MiningIntelligenceAgent",
            description="Extracts mining entities, normalizes units, calculates stripping ratios, LTIFR, coal grades, HEMM metrics, and structures domain facts.",
            capabilities=[
                "MINING_ENTITY_EXTRACTION",
                "UNIT_NORMALIZATION",
                "STRIPPING_RATIO_CALCULATION",
                "COAL_GRADE_CLASSIFICATION",
                "SAFETY_METRICS_PARSING",
                "HEMM_FLEET_ANALYSIS",
                "ENVIRONMENTAL_METRICS_EXTRACTION",
                "DOMAIN_PROVENANCE_STRUCTURING"
            ]
        )

    def _execute(self, task: AgentTask, context: WorkflowContext) -> AgentResult:
        """
        Execute mining intelligence extraction and normalization.
        Input data can supply 'text', 'evidence', 'document_id', 'subsidiary', or 'mine'.
        """
        input_data = task.input_data or {}
        raw_text = input_data.get("text", "")
        mine = input_data.get("mine")
        subsidiary = input_data.get("subsidiary")
        period = input_data.get("reporting_period")
        doc_id = input_data.get("document_id")

        extracted_facts: List[Dict[str, Any]] = []
        evidence_items: List[EvidenceItem] = []

        # 1. If text is provided directly or extracted from accumulated evidence
        text_sources = []
        if raw_text:
            text_sources.append({
                "text": raw_text,
                "doc_id": doc_id,
                "doc_name": input_data.get("document_name", "Input Text"),
                "page": input_data.get("page_number", 1),
                "section": input_data.get("section_title", "Operational Intelligence")
            })

        # Also inspect accumulated evidence chunks if available
        for ev in context.accumulated_evidence:
            text_sources.append({
                "text": ev.source_text,
                "doc_id": ev.document_id,
                "doc_name": ev.document_name,
                "page": ev.page_number,
                "section": ev.section_title
            })

        # 2. Extract and Normalize domain metrics across all sources
        seen_keys = set()
        for src in text_sources:
            facts = self._extract_facts_from_text(
                text=src["text"],
                doc_id=src["doc_id"],
                doc_name=src["doc_name"],
                page=src["page"],
                section=src["section"],
                default_sub=subsidiary,
                default_mine=mine,
                default_period=period
            )
            for f in facts:
                dedup_key = (f.get("metric"), f.get("mine"), f.get("reporting_period"), f.get("raw_value"), f.get("source_document"), f.get("page"))
                if dedup_key not in seen_keys:
                    seen_keys.add(dedup_key)
                    extracted_facts.append(f)

                    # Build grounded evidence item
                    evidence_items.append(EvidenceItem(
                        document_id=f.get("document_id"),
                        document_name=f.get("source_document", "Unknown"),
                        page_number=f.get("page", 1),
                        section_title=f.get("section", "Mining Intelligence"),
                        source_text=f.get("source_excerpt", f.get("raw_value", "")),
                        relevance_score=0.95,
                        field_name=f.get("metric"),
                        extracted_value=f.get("raw_value"),
                        confidence=f.get("confidence", 0.95),
                        producing_agent=self.name,
                        metadata={
                            "numeric_value": f.get("numeric_value"),
                            "unit": f.get("unit"),
                            "normalized_value": f.get("normalized_value"),
                            "normalized_unit": f.get("normalized_unit")
                        }
                    ))

        # 3. Perform Domain Calculations (e.g. Stripping Ratio if OBR and Production are present)
        calculated_kpis = self._compute_domain_kpis(extracted_facts)

        # 4. Update Provenance DAG
        task_node_id = f"fact_mining_{task.task_id}"
        context.add_dag_node(
            node_id=task_node_id,
            node_type="MINING_INTELLIGENCE",
            label=f"Mining Facts ({len(extracted_facts)} items)",
            metadata={"facts_count": len(extracted_facts), "kpis": list(calculated_kpis.keys())}
        )
        if task.dependencies:
            for dep in task.dependencies:
                context.add_dag_edge(
                    source=f"task_{dep}",
                    target=task_node_id,
                    relation=ProvenanceEdgeType.EXTRACTED_FROM
                )

        status = "SUCCESS" if extracted_facts or calculated_kpis else "PARTIAL"
        warnings = []
        if not extracted_facts:
            warnings.append("No specialized mining domain entities could be extracted from input sources.")

        structured_data = {
            "facts_count": len(extracted_facts),
            "facts": extracted_facts,
            "calculated_kpis": calculated_kpis,
            "units_normalized": True
        }

        return AgentResult(
            task_id=task.task_id,
            workflow_id=task.workflow_id,
            agent_name=self.name,
            agent_id="mining_intelligence",
            status=status,
            summary=f"Extracted {len(extracted_facts)} mining domain facts and calculated {len(calculated_kpis)} KPIs.",
            structured_data=structured_data,
            result_data=structured_data,
            evidence=evidence_items,
            confidence=0.96 if extracted_facts else 0.50,
            warnings=warnings,
            errors=[],
            sources=[
                {"document_id": f.get("document_id"), "document_name": f.get("source_document"), "page": f.get("page")}
                for f in extracted_facts
            ],
            next_action="MINING_FACTS_STRUCTURED"
        )

    # -------------------------------------------------------------------------
    # Internal Domain Extractors & Unit Normalizers
    # -------------------------------------------------------------------------
    def normalize_production_unit(self, value_str: str) -> Dict[str, Any]:
        """
        Normalize production/offtake/OBR units to standard MT (Million Tonnes) or M.Cum.
        Supported inputs: '1.32 MT', '13.2 Lakh Tonnes', '1320000 Tonnes', '1320000 T', etc.
        """
        val_str = str(value_str).strip()
        num_match = re.search(r"[-+]?\d*\.\d+|\d+", val_str.replace(",", ""))
        if not num_match:
            return {"raw_value": val_str, "numeric_value": None, "unit": "UNKNOWN", "normalized_value": None, "normalized_unit": "MT"}

        raw_num = float(num_match.group(0))
        upper = val_str.upper()

        if "LAKH TONNE" in upper or "LT" in upper or "LAKH T" in upper:
            norm_val = round(raw_num * 0.1, 4)
            return {"raw_value": val_str, "numeric_value": raw_num, "unit": "LT", "normalized_value": norm_val, "normalized_unit": "MT"}
        elif "CRORE TONNE" in upper or "CR TONNE" in upper:
            norm_val = round(raw_num * 10.0, 4)
            return {"raw_value": val_str, "numeric_value": raw_num, "unit": "Cr Tonnes", "normalized_value": norm_val, "normalized_unit": "MT"}
        elif "MILLION TONNE" in upper or "MT" in upper or "M.T" in upper or "MTE" in upper:
            return {"raw_value": val_str, "numeric_value": raw_num, "unit": "MT", "normalized_value": raw_num, "normalized_unit": "MT"}
        elif "LAKH CU" in upper or "L.CUM" in upper or "LAKH M3" in upper:
            norm_val = round(raw_num * 0.1, 4)
            return {"raw_value": val_str, "numeric_value": raw_num, "unit": "L.Cum", "normalized_value": norm_val, "normalized_unit": "M.Cum"}
        elif "MILLION CU" in upper or "M.CUM" in upper or "MCUM" in upper or "M M3" in upper:
            return {"raw_value": val_str, "numeric_value": raw_num, "unit": "M.Cum", "normalized_value": raw_num, "normalized_unit": "M.Cum"}
        elif "CU.M" in upper or "CUBIC METRE" in upper or "M3" in upper:
            norm_val = round(raw_num / 1_000_000.0, 6)
            return {"raw_value": val_str, "numeric_value": raw_num, "unit": "Cu.M", "normalized_value": norm_val, "normalized_unit": "M.Cum"}
        elif "TONNE" in upper or "TON" in upper or " T" in upper or upper.endswith("T"):
            norm_val = round(raw_num / 1_000_000.0, 6)
            return {"raw_value": val_str, "numeric_value": raw_num, "unit": "Tonnes", "normalized_value": norm_val, "normalized_unit": "MT"}

        return {"raw_value": val_str, "numeric_value": raw_num, "unit": "MT", "normalized_value": raw_num, "normalized_unit": "MT"}

    def _extract_facts_from_text(
        self,
        text: str,
        doc_id: Optional[int],
        doc_name: str,
        page: int,
        section: str,
        default_sub: Optional[str] = None,
        default_mine: Optional[str] = None,
        default_period: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Extract all domain-specific metrics with provenance from text snippet."""
        facts = []

        # 1. Detect Mine Name & Subsidiary from text
        mine_match = re.search(r"\b(Rajmahal|Gevra|Kusmunda|Dipka|Jayant|Nigahi|Dudhichua|Bhubaneswari|Lakhanpur|Samaleswari|Amrapali|Magadh|Piprawar|Ashoka|Belpahar|Ananta|Kalinga|Piparwar|Bina|Kakri|Khudia|Jhingurdah|Talcher)\b", text, re.I)
        detected_mine = mine_match.group(1).capitalize() if mine_match else default_mine

        sub_match = re.search(r"\b(ECL|BCCL|CCL|NCL|WCL|SECL|MCL|NEC|CMPDI|CIL)\b", text, re.I)
        detected_sub = sub_match.group(1).upper() if sub_match else default_sub

        period_match = re.search(r"\b(FY\s*20\d{2}[-–]?\d{2,4}|Q[1-4]\s*FY\s*20\d{2}|Q[1-4]|202[0-9]-[0-9]{2}|April\s*20\d{2}|May\s*20\d{2}|June\s*20\d{2}|July\s*20\d{2}|August\s*20\d{2}|September\s*20\d{2}|October\s*20\d{2}|November\s*20\d{2}|December\s*20\d{2}|January\s*20\d{2}|February\s*20\d{2}|March\s*20\d{2})\b", text, re.I)
        detected_period = period_match.group(1).strip() if period_match else default_period

        # 2. Production Patterns
        prod_patterns = [
            (r"(?:coal\s+production|raw\s+coal|production\s+achieved|total\s+production|actual\s+production)\s*(?:of|was|is|:|=)?\s*([0-9.,]+\s*(?:MT|Million\s*Tonnes?|Lakh\s*Tonnes?|LT|Tonnes?|T))", "production"),
            (r"\b([0-9.,]+\s*(?:MT|Million\s*Tonnes?|Lakh\s*Tonnes?|LT))\s*(?:of\s+coal\s+produced|produced|of\s+raw\s+coal)", "production"),
            (r"(?:produced|achieved)\s*([0-9.,]+\s*(?:MT|Million\s*Tonnes?|Lakh\s*Tonnes?|LT|Tonnes?|T))", "production"),
            (r"Rajmahal\s+(?:opencast\s+project\s+)?(?:produced|production|target)\s*(?:is|was|:|=)?\s*([0-9.,]+\s*(?:MT|Million\s*Tonnes?|Lakh\s*Tonnes?|LT|Tonnes?|T))", "production")
        ]
        for pat, metric in prod_patterns:
            for m in re.finditer(pat, text, re.I):
                raw_val = m.group(1).strip()
                norm = self.normalize_production_unit(raw_val)
                start_pos = max(0, m.start() - 40)
                end_pos = min(len(text), m.end() + 40)
                facts.append({
                    "metric": metric,
                    "raw_value": raw_val,
                    "numeric_value": norm["numeric_value"],
                    "unit": norm["unit"],
                    "normalized_value": norm["normalized_value"],
                    "normalized_unit": norm["normalized_unit"],
                    "reporting_period": detected_period,
                    "mine": detected_mine,
                    "subsidiary": detected_sub,
                    "source_document": doc_name,
                    "document_id": doc_id,
                    "page": page,
                    "section": section,
                    "source_excerpt": text[start_pos:end_pos].strip(),
                    "confidence": 0.96
                })

        # 3. Offtake / Dispatch Patterns
        dispatch_patterns = [
            (r"(?:coal\s+dispatch|offtake|total\s+dispatch|dispatched)\s*(?:of|was|is|:|=)?\s*([0-9.,]+\s*(?:MT|Million\s*Tonnes?|Lakh\s*Tonnes?|LT|Tonnes?|T))", "dispatch"),
            (r"dispatch\s+target\s*(?:of|was|is|:|=)?\s*([0-9.,]+\s*(?:MT|Million\s*Tonnes?|Lakh\s*Tonnes?|LT|Tonnes?|T))", "dispatch_target")
        ]
        for pat, metric in dispatch_patterns:
            for m in re.finditer(pat, text, re.I):
                raw_val = m.group(1).strip()
                norm = self.normalize_production_unit(raw_val)
                start_pos = max(0, m.start() - 40)
                end_pos = min(len(text), m.end() + 40)
                facts.append({
                    "metric": metric,
                    "raw_value": raw_val,
                    "numeric_value": norm["numeric_value"],
                    "unit": norm["unit"],
                    "normalized_value": norm["normalized_value"],
                    "normalized_unit": norm["normalized_unit"],
                    "reporting_period": detected_period,
                    "mine": detected_mine,
                    "subsidiary": detected_sub,
                    "source_document": doc_name,
                    "document_id": doc_id,
                    "page": page,
                    "section": section,
                    "source_excerpt": text[start_pos:end_pos].strip(),
                    "confidence": 0.95
                })

        # 4. Overburden Removal (OBR) Patterns
        obr_patterns = [
            (r"(?:overburden\s+removal|OBR|overburden|excavation)\s*(?:of|was|is|:|=)?\s*([0-9.,]+\s*(?:M\.Cum|Million\s*Cu\.M|Lakh\s*Cu\.M|L\.Cum|Cu\.M|M3))", "obr"),
            (r"stripping\s+ratio\s*(?:of|was|is|:|=)?\s*([0-9.,]+(?:\s*:\s*1|\s*Cu\.M/Tonne|\s*M\.Cum/MT)?)", "stripping_ratio")
        ]
        for pat, metric in obr_patterns:
            for m in re.finditer(pat, text, re.I):
                raw_val = m.group(1).strip()
                norm = self.normalize_production_unit(raw_val)
                start_pos = max(0, m.start() - 40)
                end_pos = min(len(text), m.end() + 40)
                facts.append({
                    "metric": metric,
                    "raw_value": raw_val,
                    "numeric_value": norm["numeric_value"],
                    "unit": norm["unit"],
                    "normalized_value": norm["normalized_value"],
                    "normalized_unit": norm["normalized_unit"] if metric == "obr" else "ratio",
                    "reporting_period": detected_period,
                    "mine": detected_mine,
                    "subsidiary": detected_sub,
                    "source_document": doc_name,
                    "document_id": doc_id,
                    "page": page,
                    "section": section,
                    "source_excerpt": text[start_pos:end_pos].strip(),
                    "confidence": 0.94
                })

        # 5. Coal Quality & Grades (Ash, Moisture, GCV, Grades G1-G17)
        quality_patterns = [
            (r"Ash\s*(?:content|percentage|%|:|=)\s*([0-9.,]+\s*%)", "ash_percentage", "%"),
            (r"Moisture\s*(?:content|percentage|%|:|=)\s*([0-9.,]+\s*%)", "moisture_percentage", "%"),
            (r"GCV\s*(?:value|:|=)?\s*([0-9.,]+\s*(?:kcal/kg|cal/g)?)", "gcv", "kcal/kg"),
            (r"\b(Grade\s*(?:G-?[1-9]|G-?1[0-7]))\b", "coal_grade", "Grade")
        ]
        for pat, metric, d_unit in quality_patterns:
            for m in re.finditer(pat, text, re.I):
                raw_val = m.group(1).strip()
                num_m = re.search(r"[-+]?\d*\.\d+|\d+", raw_val)
                num_val = float(num_m.group(0)) if num_m else None
                start_pos = max(0, m.start() - 40)
                end_pos = min(len(text), m.end() + 40)
                facts.append({
                    "metric": metric,
                    "raw_value": raw_val,
                    "numeric_value": num_val,
                    "unit": d_unit,
                    "normalized_value": num_val,
                    "normalized_unit": d_unit,
                    "reporting_period": detected_period,
                    "mine": detected_mine,
                    "subsidiary": detected_sub,
                    "source_document": doc_name,
                    "document_id": doc_id,
                    "page": page,
                    "section": section,
                    "source_excerpt": text[start_pos:end_pos].strip(),
                    "confidence": 0.95
                })

        # 6. Safety Metrics (Fatalities, Serious Injuries, LTIFR)
        safety_patterns = [
            (r"(?:fatalities|fatal\s+accidents?|deaths?)\s*(?:of|was|is|:|=)?\s*(\d+)", "fatalities", "count"),
            (r"(?:serious\s+injuries|injuries|reportable\s+accidents?)\s*(?:of|was|is|:|=)?\s*(\d+)", "serious_injuries", "count"),
            (r"LTIFR\s*(?:of|was|is|:|=)?\s*([0-9.,]+)", "ltifr", "rate")
        ]
        for pat, metric, d_unit in safety_patterns:
            for m in re.finditer(pat, text, re.I):
                raw_val = m.group(1).strip()
                num_val = float(raw_val) if "." in raw_val else int(raw_val)
                start_pos = max(0, m.start() - 40)
                end_pos = min(len(text), m.end() + 40)
                facts.append({
                    "metric": metric,
                    "raw_value": raw_val,
                    "numeric_value": num_val,
                    "unit": d_unit,
                    "normalized_value": num_val,
                    "normalized_unit": d_unit,
                    "reporting_period": detected_period,
                    "mine": detected_mine,
                    "subsidiary": detected_sub,
                    "source_document": doc_name,
                    "document_id": doc_id,
                    "page": page,
                    "section": section,
                    "source_excerpt": text[start_pos:end_pos].strip(),
                    "confidence": 0.97
                })

        # 7. HEMM Fleet (Draglines, Shovels, Dumpers, Availability %, Utilization %)
        hemm_patterns = [
            (r"(?:Draglines?|Shovels?|Dumpers?|Surface\s*Miners?|Dozers?)\s*(?:availability|avail)\s*(?:is|was|:|=)?\s*([0-9.,]+\s*%)", "hemm_availability", "%"),
            (r"(?:Draglines?|Shovels?|Dumpers?|Surface\s*Miners?|Dozers?)\s*(?:utilization|util)\s*(?:is|was|:|=)?\s*([0-9.,]+\s*%)", "hemm_utilization", "%")
        ]
        for pat, metric, d_unit in hemm_patterns:
            for m in re.finditer(pat, text, re.I):
                raw_val = m.group(1).strip()
                num_m = re.search(r"[-+]?\d*\.\d+|\d+", raw_val)
                num_val = float(num_m.group(0)) if num_m else None
                start_pos = max(0, m.start() - 40)
                end_pos = min(len(text), m.end() + 40)
                facts.append({
                    "metric": metric,
                    "raw_value": raw_val,
                    "numeric_value": num_val,
                    "unit": d_unit,
                    "normalized_value": num_val,
                    "normalized_unit": d_unit,
                    "reporting_period": detected_period,
                    "mine": detected_mine,
                    "subsidiary": detected_sub,
                    "source_document": doc_name,
                    "document_id": doc_id,
                    "page": page,
                    "section": section,
                    "source_excerpt": text[start_pos:end_pos].strip(),
                    "confidence": 0.93
                })

        # 8. Environmental Metrics (PM10, PM2.5, pH, Afforestation)
        env_patterns = [
            (r"PM\s*10\s*(?:level|is|was|:|=)?\s*([0-9.,]+\s*(?:µg/m3|ug/m3|micrograms/m3)?)", "pm10", "µg/m3"),
            (r"PM\s*2\.5\s*(?:level|is|was|:|=)?\s*([0-9.,]+\s*(?:µg/m3|ug/m3|micrograms/m3)?)", "pm2.5", "µg/m3"),
            (r"pH\s*(?:level|value|is|was|:|=)?\s*([0-9.,]+)", "water_ph", "pH"),
            (r"(?:saplings\s+planted|afforestation|plantation)\s*(?:of|was|is|:|=)?\s*(\d+[\d,]*\s*(?:saplings|trees|hectares|ha)?)", "afforestation", "saplings")
        ]
        for pat, metric, d_unit in env_patterns:
            for m in re.finditer(pat, text, re.I):
                raw_val = m.group(1).strip()
                num_m = re.search(r"[-+]?\d*\.\d+|\d+", raw_val.replace(",", ""))
                num_val = float(num_m.group(0)) if num_m else None
                start_pos = max(0, m.start() - 40)
                end_pos = min(len(text), m.end() + 40)
                facts.append({
                    "metric": metric,
                    "raw_value": raw_val,
                    "numeric_value": num_val,
                    "unit": d_unit,
                    "normalized_value": num_val,
                    "normalized_unit": d_unit,
                    "reporting_period": detected_period,
                    "mine": detected_mine,
                    "subsidiary": detected_sub,
                    "source_document": doc_name,
                    "document_id": doc_id,
                    "page": page,
                    "section": section,
                    "source_excerpt": text[start_pos:end_pos].strip(),
                    "confidence": 0.94
                })

        return facts

    def _compute_domain_kpis(self, facts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compute derived mining domain metrics from structured facts."""
        kpis = {}
        # Find latest/highest production and OBR
        prods = [f["normalized_value"] for f in facts if f.get("metric") == "production" and f.get("normalized_value") and f.get("normalized_value") > 0]
        obrs = [f["normalized_value"] for f in facts if f.get("metric") == "obr" and f.get("normalized_value") and f.get("normalized_value") > 0]

        if prods and obrs:
            prod_val = prods[0]
            obr_val = obrs[0]
            if prod_val > 0:
                ratio = round(obr_val / prod_val, 2)
                kpis["derived_stripping_ratio"] = {
                    "value": ratio,
                    "unit": "M.Cum/MT",
                    "formula": "OBR (M.Cum) / Production (MT)",
                    "obr_used": obr_val,
                    "prod_used": prod_val
                }

        # Check coal grades
        grades = [f["raw_value"] for f in facts if f.get("metric") == "coal_grade"]
        if grades:
            kpis["identified_coal_grades"] = list(set(grades))

        # Check fatal accidents
        fatalities = [f["numeric_value"] for f in facts if f.get("metric") == "fatalities"]
        if fatalities:
            kpis["total_fatalities_reported"] = sum(fatalities)

        return kpis
