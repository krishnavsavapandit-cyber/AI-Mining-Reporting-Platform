"""
Mining Domain Structured Information Extraction Service for SIH26023.
Extracts CIL subsidiaries, mines, reporting periods, production figures, OBR,
geological seam details, safety logs, and HEMM equipment metrics.
"""

import re
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

SUBSIDIARIES_MAP = {
    "ECL": ["Eastern Coalfields", "ECL", "Rajmahal", "Sonepur Bazari", "Raniganj", "Kenda"],
    "BCCL": ["Bharat Coking Coal", "BCCL", "Jharia", "Katras", "Kusunda", "Sijua", "Moonidih"],
    "CCL": ["Central Coalfields", "CCL", "Bokaro", "Piparwar", "North Karanpura", "Kathara", "Argada"],
    "WCL": ["Western Coalfields", "WCL", "Nagpur", "Wardha", "Chandrapur", "Umrer", "Pench", "Kanhan"],
    "SECL": ["South Eastern Coalfields", "SECL", "Korba", "Gevra", "Kusmunda", "Dipka", "Raigarh", "Sohagpur"],
    "MCL": ["Mahanadi Coalfields", "MCL", "Talcher", "Ib Valley", "Lakhanpur", "Basundhara", "Kulda"],
    "NCL": ["Northern Coalfields", "NCL", "Singrauli", "Jayant", "Nigahi", "Dudhichua", "Bina", "Amlohri"],
    "CMPDI": ["CMPDI", "Central Mine Planning", "RI-I", "RI-II", "RI-III", "RI-IV", "RI-V", "RI-VI", "RI-VII"],
    "NEC": ["North Eastern Coalfields", "NEC", "Margherita", "Tikak", "Tipong", "Ledo"]
}

KNOWN_MINES = [
    "Rajmahal", "Sonepur Bazari", "Jharia", "Moonidih", "Katras", "Piparwar",
    "Gevra", "Kusmunda", "Dipka", "Korba", "Talcher", "Lakhanpur", "Jayant",
    "Nigahi", "Dudhichua", "Bina", "Wardha", "Umrer", "Bokaro", "Kusunda"
]

class ExtractionService:
    """Domain-specific deterministic entity and KPI extractor for coal mining records."""

    def extract_metadata_and_records(self, full_text: str, pages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze document content and extract:
        - Primary metadata (subsidiary, mine, reporting_period, doc_type)
        - List of structured data records with page & excerpt provenance
        """
        detected_subsidiary = self._detect_subsidiary(full_text)
        detected_mine = self._detect_mine(full_text)
        detected_period = self._detect_reporting_period(full_text)
        detected_doc_type = self._detect_doc_type(full_text)

        extracted_records = []

        # Iterate through pages to pull page-grounded records
        for p in pages:
            page_num = p.get("page_number", 1)
            text = p.get("text", "")
            if not text:
                continue

            # 1. Extract Production Figures
            prod_records = self._extract_production(text, detected_subsidiary, detected_mine, detected_period, page_num)
            extracted_records.extend(prod_records)

            # 2. Extract Overburden Removal (OBR)
            obr_records = self._extract_obr(text, detected_subsidiary, detected_mine, detected_period, page_num)
            extracted_records.extend(obr_records)

            # 3. Extract Safety & Incident Metrics
            safety_records = self._extract_safety(text, detected_subsidiary, detected_mine, detected_period, page_num)
            extracted_records.extend(safety_records)

            # 4. Extract Geological & Seam Data
            geo_records = self._extract_geological(text, detected_subsidiary, detected_mine, detected_period, page_num)
            extracted_records.extend(geo_records)

            # 5. Extract HEMM Equipment Data
            equip_records = self._extract_equipment(text, detected_subsidiary, detected_mine, detected_period, page_num)
            extracted_records.extend(equip_records)

        return {
            "subsidiary": detected_subsidiary,
            "mine": detected_mine,
            "reporting_period": detected_period,
            "document_type": detected_doc_type,
            "records": extracted_records
        }

    def _detect_subsidiary(self, text: str) -> str:
        counts = {}
        for sub, aliases in SUBSIDIARIES_MAP.items():
            cnt = sum(len(re.findall(rf"\b{re.escape(alias)}\b", text, re.IGNORECASE)) for alias in aliases)
            if cnt > 0:
                counts[sub] = cnt
        if counts:
            return max(counts.items(), key=lambda x: x[1])[0]
        return "CIL"

    def _detect_mine(self, text: str) -> Optional[str]:
        for mine in KNOWN_MINES:
            if re.search(rf"\b{re.escape(mine)}\b", text, re.IGNORECASE):
                return mine
        return None

    def _detect_reporting_period(self, text: str) -> Optional[str]:
        # Match months and years e.g., "May 2024", "May 2025", "Q1 FY24-25", "2024-25"
        m = re.search(r"\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(202[0-9])\b", text, re.IGNORECASE)
        if m:
            return f"{m.group(1).capitalize()} {m.group(2)}"
        
        q = re.search(r"\b(Q[1-4]|Quarter\s+[1-4])\s+(?:FY|FY\s+)?(202[0-9](?:-[0-9]{2,4})?)\b", text, re.IGNORECASE)
        if q:
            return f"{q.group(1).upper()} {q.group(2)}"

        fy = re.search(r"\bFY\s*(202[0-9]-[0-9]{2,4})\b", text, re.IGNORECASE)
        if fy:
            return f"FY {fy.group(1)}"

        return None

    def _detect_doc_type(self, text: str) -> str:
        t_lower = text.lower()
        if "geological" in t_lower or "borehole" in t_lower or "seam" in t_lower or "drilling" in t_lower:
            return "Geological Survey Report"
        elif "production" in t_lower or "offtake" in t_lower or "dispatch" in t_lower:
            return "Production & Offtake Report"
        elif "safety" in t_lower or "accident" in t_lower or "dgms" in t_lower or "ltifr" in t_lower:
            return "Safety & Statutory Review"
        elif "equipment" in t_lower or "dragline" in t_lower or "shovel" in t_lower or "hemm" in t_lower:
            return "HEMM Operational Report"
        elif "parliamentary" in t_lower or "lok sabha" in t_lower or "rajya sabha" in t_lower:
            return "Parliamentary / Inquiry Document"
        elif "environment" in t_lower or "air quality" in t_lower or "effluent" in t_lower:
            return "Environmental Compliance Audit"
        return "General Administrative Report"

    def _extract_production(self, text: str, sub: str, mine: Optional[str], period: Optional[str], page: int) -> List[Dict[str, Any]]:
        records = []
        patterns = [
            (r"(?:Coal\s+)?Production\s*(?:=|:|\bwas\b|\bof\b)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(Tonnes|Ton|MT|LT|Lakh\s+Tonnes|Million\s+Tonnes)", "Coal Production"),
            (r"(?:Production\s+)?Target\s*(?:=|:|\bwas\b|\bof\b)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(Tonnes|Ton|MT|LT|Lakh\s+Tonnes|Million\s+Tonnes)", "Production Target"),
            (r"Offtake\s*(?:=|:|\bwas\b|\bof\b)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(Tonnes|Ton|MT|LT|Lakh\s+Tonnes)", "Coal Offtake / Dispatch")
        ]

        for pat, field_name in patterns:
            for match in re.finditer(pat, text, re.IGNORECASE):
                raw_val = match.group(1).replace(",", "")
                unit = match.group(2)
                try:
                    num_val = float(raw_val)
                    # Normalize to Million Tonnes (MT) if unit is Lakh Tonnes or Tonnes
                    if "lakh" in unit.lower() or unit.upper() == "LT":
                        num_val_mt = num_val * 0.1
                    elif "million" in unit.lower() or unit.upper() == "MT":
                        num_val_mt = num_val
                    elif num_val > 10000: # Assumed in Tonnes
                        num_val_mt = num_val / 1000000.0
                    else:
                        num_val_mt = num_val

                    start = max(0, match.start() - 60)
                    end = min(len(text), match.end() + 60)
                    excerpt = text[start:end].replace("\n", " ").strip()

                    records.append({
                        "field_name": field_name,
                        "field_category": "Production",
                        "raw_value": f"{match.group(1)} {unit}",
                        "numeric_value": round(num_val_mt, 4),
                        "unit": "Million Tonnes (MT)",
                        "subsidiary": sub,
                        "mine": mine,
                        "reporting_period": period,
                        "page_number": page,
                        "section_name": "Production Metrics",
                        "source_excerpt": excerpt,
                        "confidence": 0.96
                    })
                except ValueError:
                    pass

        return records

    def _extract_obr(self, text: str, sub: str, mine: Optional[str], period: Optional[str], page: int) -> List[Dict[str, Any]]:
        records = []
        pat = r"(?:OBR|Overburden\s+Removal|Overburden\s+Excavation)\s*(?:=|:|\bwas\b|\bof\b)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(M\.Cum|Million\s+Cubic\s+Metres|L\.Cum|Lakh\s+Cu\.M|Cu\.M)"
        for match in re.finditer(pat, text, re.IGNORECASE):
            raw_val = match.group(1).replace(",", "")
            unit = match.group(2)
            try:
                num_val = float(raw_val)
                start = max(0, match.start() - 60)
                end = min(len(text), match.end() + 60)
                excerpt = text[start:end].replace("\n", " ").strip()

                records.append({
                    "field_name": "Overburden Removal (OBR)",
                    "field_category": "Excavation",
                    "raw_value": f"{match.group(1)} {unit}",
                    "numeric_value": num_val,
                    "unit": unit,
                    "subsidiary": sub,
                    "mine": mine,
                    "reporting_period": period,
                    "page_number": page,
                    "section_name": "OBR & Stripping",
                    "source_excerpt": excerpt,
                    "confidence": 0.95
                })
            except ValueError:
                pass
        return records

    def _extract_safety(self, text: str, sub: str, mine: Optional[str], period: Optional[str], page: int) -> List[Dict[str, Any]]:
        records = []
        pats = [
            (r"(?:Fatal\s+Accidents|Fatalities)\s*(?:=|:|\bwas\b|\bof\b)?\s*([0-9]+)", "Fatal Accidents"),
            (r"(?:Serious\s+Injuries|Serious\s+Accidents)\s*(?:=|:|\bwas\b|\bof\b)?\s*([0-9]+)", "Serious Accidents"),
            (r"LTIFR\s*(?:=|:|\bwas\b|\bof\b)?\s*([0-9]+(?:\.[0-9]+)?)", "Lost Time Injury Frequency Rate (LTIFR)")
        ]
        for pat, field_name in pats:
            for match in re.finditer(pat, text, re.IGNORECASE):
                try:
                    num_val = float(match.group(1))
                    start = max(0, match.start() - 60)
                    end = min(len(text), match.end() + 60)
                    excerpt = text[start:end].replace("\n", " ").strip()
                    records.append({
                        "field_name": field_name,
                        "field_category": "Safety",
                        "raw_value": match.group(0),
                        "numeric_value": num_val,
                        "unit": "Count" if "LTIFR" not in field_name else "Rate",
                        "subsidiary": sub,
                        "mine": mine,
                        "reporting_period": period,
                        "page_number": page,
                        "section_name": "Safety & Statutory Compliance",
                        "source_excerpt": excerpt,
                        "confidence": 0.94
                    })
                except ValueError:
                    pass
        return records

    def _extract_geological(self, text: str, sub: str, mine: Optional[str], period: Optional[str], page: int) -> List[Dict[str, Any]]:
        records = []
        # Seam detection
        seam_matches = re.finditer(r"\b(Seam\s*[-–]?[A-Z0-9IVX]+|Queen\s+Seam|King\s+Seam)\b", text, re.IGNORECASE)
        for match in seam_matches:
            start = max(0, match.start() - 60)
            end = min(len(text), match.end() + 60)
            excerpt = text[start:end].replace("\n", " ").strip()
            records.append({
                "field_name": "Geological Coal Seam",
                "field_category": "Geology",
                "raw_value": match.group(1),
                "numeric_value": None,
                "unit": "Seam Name",
                "subsidiary": sub,
                "mine": mine,
                "reporting_period": period,
                "page_number": page,
                "section_name": "Geological Exploration",
                "source_excerpt": excerpt,
                "confidence": 0.92
            })

        # Ash content & Moisture
        ash_m = re.search(r"Ash\s+Content\s*(?:=|:|\bwas\b|\bof\b)?\s*([0-9]+(?:\.[0-9]+)?)\s*%", text, re.IGNORECASE)
        if ash_m:
            records.append({
                "field_name": "Coal Ash Content",
                "field_category": "Geology",
                "raw_value": f"{ash_m.group(1)} %",
                "numeric_value": float(ash_m.group(1)),
                "unit": "%",
                "subsidiary": sub,
                "mine": mine,
                "reporting_period": period,
                "page_number": page,
                "section_name": "Coal Quality",
                "source_excerpt": text[max(0, ash_m.start() - 50):min(len(text), ash_m.end() + 50)].strip(),
                "confidence": 0.95
            })

        return records

    def _extract_equipment(self, text: str, sub: str, mine: Optional[str], period: Optional[str], page: int) -> List[Dict[str, Any]]:
        records = []
        pats = [
            (r"(?:HEMM|Equipment)\s+Availability\s*(?:=|:|\bwas\b|\bof\b)?\s*([0-9]+(?:\.[0-9]+)?)\s*%", "HEMM Availability %"),
            (r"(?:HEMM|Equipment)\s+Utilization\s*(?:=|:|\bwas\b|\bof\b)?\s*([0-9]+(?:\.[0-9]+)?)\s*%", "HEMM Utilization %"),
            (r"(Dragline|Shovel|Dumper|Surface\s+Miner)\s+(?:Availability|Breakdown|Count)\s*(?:=|:)?\s*([0-9]+(?:\.[0-9]+)?)", "Machinery Metric")
        ]
        for pat, field_name in pats:
            for match in re.finditer(pat, text, re.IGNORECASE):
                try:
                    val = float(match.group(1) if "%" in field_name else match.group(2))
                    start = max(0, match.start() - 60)
                    end = min(len(text), match.end() + 60)
                    excerpt = text[start:end].replace("\n", " ").strip()
                    records.append({
                        "field_name": field_name,
                        "field_category": "Equipment",
                        "raw_value": match.group(0),
                        "numeric_value": val,
                        "unit": "%" if "%" in field_name else "Units",
                        "subsidiary": sub,
                        "mine": mine,
                        "reporting_period": period,
                        "page_number": page,
                        "section_name": "HEMM Equipment Performance",
                        "source_excerpt": excerpt,
                        "confidence": 0.93
                    })
                except (ValueError, IndexError):
                    pass
        return records

# Global extraction service instance
extraction_service = ExtractionService()
