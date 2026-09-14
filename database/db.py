"""
Database connection and execution manager for SIH26023 Mining Platform.
Supports PostgreSQL (Primary / Enterprise) and SQLite (Fallback / Local Development).
"""

import json
import logging
from contextlib import contextmanager
from typing import Optional, Dict, Any

from database.config import parse_database_url, DatabaseConfig
from database.adapters.base import BaseDatabaseAdapter
from database.adapters.sqlite_adapter import SQLiteAdapter
from database.adapters.postgres_adapter import PostgresAdapter

logger = logging.getLogger(__name__)

_active_adapter: Optional[BaseDatabaseAdapter] = None
_active_config: Optional[DatabaseConfig] = None

def get_database_config() -> DatabaseConfig:
    """Retrieve current parsed database configuration."""
    global _active_config
    if _active_config is None:
        _active_config = parse_database_url()
    return _active_config

def get_db_adapter() -> BaseDatabaseAdapter:
    """Return the active database adapter based on configuration."""
    global _active_adapter, _active_config
    if _active_adapter is None:
        config = get_database_config()
        if config.backend == "postgresql":
            _active_adapter = PostgresAdapter(config)
        else:
            _active_adapter = SQLiteAdapter(config.sqlite_path)
    return _active_adapter

def set_database_url(url: Optional[str] = None) -> BaseDatabaseAdapter:
    """
    Dynamically update active database URL and reload adapter (primarily used in tests and migrations).
    """
    global _active_adapter, _active_config
    if _active_adapter:
        try:
            _active_adapter.close()
        except Exception:
            pass
    _active_config = parse_database_url(url)
    _active_adapter = None
    return get_db_adapter()

def reset_db_adapter() -> None:
    """Reset cached database adapter to default environment config."""
    global _active_adapter, _active_config
    if _active_adapter:
        try:
            _active_adapter.close()
        except Exception:
            pass
    _active_adapter = None
    _active_config = None

def get_db_connection():
    """Create or retrieve a thread-local database connection with dictionary row formatting."""
    return get_db_adapter().get_connection()

@contextmanager
def get_db():
    """Context manager for database transactions with automatic commit and rollback."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database error during transaction: {e}")
        raise

def init_db() -> None:
    """Initialize active database with schema tables, relationships, and indices."""
    adapter = get_db_adapter()
    adapter.initialize_schema()

def get_db_type() -> str:
    """Return 'postgresql' or 'sqlite' for active connection."""
    return get_db_adapter().backend_name

def is_db_connected() -> bool:
    """Verify connectivity with active database."""
    return get_db_adapter().check_connection()

def get_db_info() -> Dict[str, Any]:
    """Return sanitized database metadata for health checks and settings UI."""
    config = get_database_config()
    connected = is_db_connected()
    return {
        "backend": config.backend,
        "status": "connected" if connected else "disconnected",
        "display_target": config.display_url,
        "is_primary_enterprise": (config.backend == "postgresql")
    }

def log_audit(action_type, user_role='Analyst', resource_type=None, resource_id=None, details=None, ip_address='127.0.0.1'):
    """Helper method to record immutable audit events."""
    try:
        details_str = json.dumps(details or {}) if isinstance(details, (dict, list)) else str(details or "")
        with get_db() as conn:
            conn.execute(
                """
                INSERT INTO audit_logs (action_type, user_role, resource_type, resource_id, details_json, ip_address)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (action_type, user_role, resource_type, str(resource_id) if resource_id else None, details_str, ip_address)
            )
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")

def revoke_token(token_str: str, user_email: Optional[str] = None, expires_at: Optional[str] = None) -> bool:
    """
    Persistently blacklist a token hash in the database.
    Survives server restarts and synchronizes across workers.
    """
    import hashlib
    if not token_str:
        return False
    try:
        token_hash = hashlib.sha256(token_str.strip().encode("utf-8")).hexdigest()
        with get_db() as conn:
            conn.execute(
                """
                INSERT INTO revoked_tokens (token_hash, user_email, expires_at)
                VALUES (?, ?, ?)
                """,
                (token_hash, user_email, expires_at)
            )
        return True
    except Exception as e:
        # If already revoked (UNIQUE constraint), treat as success
        logger.debug(f"Token revocation record status: {e}")
        return True

def is_token_revoked(token_str: str) -> bool:
    """
    Check if a token hash exists in the persistent revoked_tokens table.
    """
    import hashlib
    if not token_str:
        return False
    try:
        token_hash = hashlib.sha256(token_str.strip().encode("utf-8")).hexdigest()
        with get_db() as conn:
            row = conn.execute(
                "SELECT id FROM revoked_tokens WHERE token_hash = ?",
                (token_hash,)
            ).fetchone()
            return bool(row)
    except Exception as e:
        logger.debug(f"Token revocation query status: {e}")
        return False

def check_db_health() -> Dict[str, Any]:
    """Execute active database query check and return detailed health metrics."""
    import time
    start = time.time()
    config = get_database_config()
    try:
        with get_db() as conn:
            conn.execute("SELECT 1").fetchone()
        latency_ms = round((time.time() - start) * 1000, 2)
        return {
            "status": "HEALTHY",
            "backend": config.backend,
            "connected": True,
            "latency_ms": latency_ms,
            "display_target": config.display_url
        }
    except Exception as e:
        latency_ms = round((time.time() - start) * 1000, 2)
        return {
            "status": "UNHEALTHY",
            "backend": config.backend,
            "connected": False,
            "latency_ms": latency_ms,
            "error": str(e)
        }

