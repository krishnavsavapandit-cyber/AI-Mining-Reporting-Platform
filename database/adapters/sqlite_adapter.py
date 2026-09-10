"""
SQLite Database Adapter for SIH26023 Mining Platform (Local / Development / Fallback).
"""

import sqlite3
import threading
import logging
from pathlib import Path
from typing import Any, Optional
from database.adapters.base import BaseDatabaseAdapter
from database.schema import SCHEMA_SQL_SQLITE

logger = logging.getLogger(__name__)

def dict_factory(cursor, row):
    """Convert SQLite row tuple to python dictionary with column keys."""
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

class SQLiteAdapter(BaseDatabaseAdapter):
    """SQLite engine adapter supporting thread-local connections and WAL mode."""

    def __init__(self, db_path: Path, timeout: float = 45.0):
        self.db_path = Path(db_path)
        self.timeout = timeout
        self._local = threading.local()

    @property
    def backend_name(self) -> str:
        return "sqlite"

    def get_connection(self) -> sqlite3.Connection:
        """Return a thread-local SQLite connection with dictionary row factory."""
        conn = getattr(self._local, "connection", None)
        if conn is None:
            # Ensure parent directory exists for file-based DB
            if str(self.db_path) != ":memory:":
                self.db_path.parent.mkdir(parents=True, exist_ok=True)

            conn = sqlite3.connect(str(self.db_path), timeout=self.timeout)
            conn.row_factory = dict_factory
            
            # SQLite performance & constraint PRAGMAs
            conn.execute("PRAGMA foreign_keys = ON")
            if str(self.db_path) != ":memory:":
                try:
                    conn.execute("PRAGMA journal_mode = WAL")
                except Exception as e:
                    logger.debug(f"Could not enable WAL mode: {e}")
            conn.execute("PRAGMA busy_timeout = 30000")
            
            self._local.connection = conn
        return conn

    def initialize_schema(self) -> None:
        """Execute SQLite DDL schema creation script."""
        conn = self.get_connection()
        try:
            conn.executescript(SCHEMA_SQL_SQLITE)
            conn.commit()
            logger.info(f"SQLite database initialized successfully at {self.db_path}")
        except Exception as e:
            conn.rollback()
            logger.error(f"Failed to initialize SQLite schema: {e}")
            raise

    def check_connection(self) -> bool:
        """Probe SQLite connectivity."""
        try:
            conn = self.get_connection()
            cur = conn.execute("SELECT 1")
            res = cur.fetchone()
            return res is not None
        except Exception as e:
            logger.error(f"SQLite connectivity check failed: {e}")
            return False

    def close(self) -> None:
        """Close thread-local SQLite connection."""
        conn = getattr(self._local, "connection", None)
        if conn:
            try:
                conn.close()
            except Exception:
                pass
            self._local.connection = None
