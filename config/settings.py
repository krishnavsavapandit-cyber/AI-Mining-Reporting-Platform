"""
Configuration module for SIH26023 Mining Platform.
Handles environment variables, paths, constants, and AI provider settings.
"""

import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
GENERATED_REPORTS_DIR = BASE_DIR / "generated_reports"
VECTOR_STORE_DIR = BASE_DIR / "vector_store"
DATABASE_DIR = BASE_DIR / "database"
SAMPLE_DATA_DIR = BASE_DIR / "sample_data"

# Create directories if they don't exist
for d in [UPLOAD_DIR, GENERATED_REPORTS_DIR, VECTOR_STORE_DIR, DATABASE_DIR, SAMPLE_DATA_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Database
DATABASE_PATH = DATABASE_DIR / "mining_platform.db"
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

def get_database_backend() -> str:
    """Determine database backend type from configuration."""
    if not DATABASE_URL:
        return "sqlite"
    url_lower = DATABASE_URL.lower()
    if url_lower.startswith("postgresql://") or url_lower.startswith("postgres://"):
        return "postgresql"
    if url_lower.startswith("sqlite://"):
        return "sqlite"
    return "sqlite"

DATABASE_BACKEND = get_database_backend()

# Flask & Environment Settings
ENV = os.getenv("FLASK_ENV", os.getenv("ENVIRONMENT", "development")).lower()
IS_PRODUCTION = ENV in ("production", "prod")

_ENV_SECRET_KEY = os.getenv("SECRET_KEY") or os.getenv("FLASK_SECRET_KEY")
if IS_PRODUCTION:
    if not _ENV_SECRET_KEY or _ENV_SECRET_KEY in ("sih26023-cil-cmpdi-secure-key-2026", "dev", "default"):
        raise RuntimeError(
            "CRITICAL SECURITY CONFIGURATION ERROR: A cryptographically strong, non-default SECRET_KEY "
            "environment variable MUST be set in production environments."
        )
    SECRET_KEY = _ENV_SECRET_KEY
else:
    # Development fallback for local development only
    SECRET_KEY = _ENV_SECRET_KEY or "sih26023-cil-cmpdi-secure-key-2026"

MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 50 * 1024 * 1024)) # 50 MB
ALLOWED_EXTENSIONS = {"pdf", "docx", "csv", "xlsx", "xls", "png", "jpg", "jpeg", "txt"}

# AI Provider Configuration
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini").lower()
AI_FALLBACK_PROVIDER = os.getenv("AI_FALLBACK_PROVIDER", "open_model").lower()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

OPEN_MODEL_ENDPOINT = os.getenv("OPEN_MODEL_ENDPOINT", "http://localhost:11434/v1/chat/completions")
OPEN_MODEL_API_KEY = os.getenv("OPEN_MODEL_API_KEY", "")
OPEN_MODEL_NAME = os.getenv("OPEN_MODEL_NAME", "llama3.2:3b")

# OCR settings
TESSERACT_CMD = os.getenv("TESSERACT_CMD", "tesseract")
OCR_ENGINE = os.getenv("OCR_ENGINE", "auto").lower()
ADVANCED_OCR_ENABLED = os.getenv("ADVANCED_OCR_ENABLED", "true").lower() in ("true", "1", "yes")
OCR_MAX_PAGE_PIXELS = int(os.getenv("OCR_MAX_PAGE_PIXELS", 4000 * 4000))
OCR_TIMEOUT_SECONDS = int(os.getenv("OCR_TIMEOUT_SECONDS", 30))
OCR_LANGUAGE = os.getenv("OCR_LANGUAGE", "eng")

# Vector Store
VECTOR_INDEX_FILE = VECTOR_STORE_DIR / "hybrid_index.pkl"


# CIL Subsidiary & Mining Domain Constants
CIL_SUBSIDIARIES = {
    "ECL": "Eastern Coalfields Limited (Sanctoria, West Bengal)",
    "BCCL": "Bharat Coking Coal Limited (Dhanbad, Jharkhand)",
    "CCL": "Central Coalfields Limited (Ranchi, Jharkhand)",
    "WCL": "Western Coalfields Limited (Nagpur, Maharashtra)",
    "SECL": "South Eastern Coalfields Limited (Bilaspur, Chhattisgarh)",
    "MCL": "Mahanadi Coalfields Limited (Sambalpur, Odisha)",
    "NCL": "Northern Coalfields Limited (Singrauli, Madhya Pradesh)",
    "CMPDI": "Central Mine Planning and Design Institute (Ranchi, Jharkhand)",
    "NEC": "North Eastern Coalfields (Margherita, Assam)",
    "CIL_HQ": "Coal India Limited Headquarters (Kolkata, West Bengal)"
}

MINING_TOPICS = [
    "Coal Production & Offtake",
    "Overburden Removal (OBR)",
    "Geological Exploration & Drilling",
    "HEMM & Equipment Availability",
    "Mine Safety & Accident Analysis",
    "Environmental Compliance & Air/Water Quality",
    "Dispatch & Railway Rake Logistics",
    "Mine Planning & Seam Quality"
]
