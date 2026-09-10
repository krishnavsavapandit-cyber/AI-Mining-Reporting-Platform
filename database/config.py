"""
Database Configuration and URL Parsing for SIH26023 Mining Platform.
Supports PostgreSQL (Primary/Enterprise) and SQLite (Fallback/Development).
"""

import os
import re
import urllib.parse
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, Dict, Any
from config.settings import DATABASE_PATH, DATABASE_URL

@dataclass
class DatabaseConfig:
    """Structured database configuration details."""
    backend: str                        # "postgresql" or "sqlite"
    raw_url: str                        # Full raw connection URL
    display_url: str                    # Sanitized URL with password masked
    is_explicit_postgres: bool = False  # True if user explicitly provided a postgres DATABASE_URL
    sqlite_path: Optional[Path] = None  # Path to SQLite file if sqlite
    host: Optional[str] = None
    port: Optional[int] = None
    user: Optional[str] = None
    password: Optional[str] = field(default=None, repr=False)
    dbname: Optional[str] = None
    options: Dict[str, Any] = field(default_factory=dict)

def parse_database_url(url_string: Optional[str] = None) -> DatabaseConfig:
    """
    Parse a database URL or fallback to SQLite configuration.
    
    Rules:
    - If URL is empty or None: defaults to SQLite (mining_platform.db).
    - If URL starts with sqlite:// or sqlite:///: parsed as SQLite.
    - If URL starts with postgresql:// or postgres://: parsed as PostgreSQL.
    - Password is sanitized in display_url.
    """
    raw_url = (url_string if url_string is not None else os.getenv("DATABASE_URL", DATABASE_URL)).strip()
    
    if not raw_url:
        sqlite_file = Path(DATABASE_PATH)
        return DatabaseConfig(
            backend="sqlite",
            raw_url=f"sqlite:///{sqlite_file.as_posix()}",
            display_url=f"sqlite:///{sqlite_file.name}",
            is_explicit_postgres=False,
            sqlite_path=sqlite_file
        )
    
    url_lower = raw_url.lower()
    
    # 1. SQLite backend
    if url_lower.startswith("sqlite://"):
        # Strip scheme
        path_part = raw_url[len("sqlite://"):]
        if path_part.startswith("/"):
            path_part = path_part[1:]
        
        # If in-memory
        if path_part == ":memory:" or not path_part:
            return DatabaseConfig(
                backend="sqlite",
                raw_url="sqlite:///:memory:",
                display_url="sqlite:///:memory:",
                is_explicit_postgres=False,
                sqlite_path=Path(":memory:")
            )
        
        sqlite_file = Path(path_part)
        return DatabaseConfig(
            backend="sqlite",
            raw_url=raw_url,
            display_url=f"sqlite:///{sqlite_file.name}",
            is_explicit_postgres=False,
            sqlite_path=sqlite_file
        )
    
    # 2. PostgreSQL backend
    if url_lower.startswith("postgresql://") or url_lower.startswith("postgres://"):
        # Normalize prefix to postgresql://
        normalized_url = raw_url
        if url_lower.startswith("postgres://"):
            normalized_url = "postgresql://" + raw_url[len("postgres://"):]
        
        parsed = urllib.parse.urlparse(normalized_url)
        
        # Extract components
        user = parsed.username or "postgres"
        password = parsed.password
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        dbname = parsed.path.lstrip("/") if parsed.path else "sih26023"
        
        # Build masked display URL
        masked_user_info = f"{user}:***@" if password else (f"{user}@" if user else "")
        display_url = f"postgresql://{masked_user_info}{host}:{port}/{dbname}"
        
        # Parse query params
        query_params = urllib.parse.parse_qs(parsed.query)
        options = {k: v[0] if len(v) == 1 else v for k, v in query_params.items()}
        
        return DatabaseConfig(
            backend="postgresql",
            raw_url=normalized_url,
            display_url=display_url,
            is_explicit_postgres=True,
            host=host,
            port=port,
            user=user,
            password=password,
            dbname=dbname,
            options=options
        )
    
    # Fallback for unrecognized URL format: default to SQLite
    sqlite_file = Path(DATABASE_PATH)
    return DatabaseConfig(
        backend="sqlite",
        raw_url=f"sqlite:///{sqlite_file.as_posix()}",
        display_url=f"sqlite:///{sqlite_file.name}",
        is_explicit_postgres=False,
        sqlite_path=sqlite_file
    )
