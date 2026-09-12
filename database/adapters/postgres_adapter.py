"""
PostgreSQL Database Adapter for SIH26023 Mining Platform (Primary / Enterprise).
Uses modern psycopg (v3) with fallback to psycopg2.
Translates SQL parameter markers and provides standard dictionary row access and lastrowid emulation.
"""

import re
import threading
import logging
from typing import Any, Optional, List, Tuple, Dict, Union
from database.adapters.base import BaseDatabaseAdapter
from database.config import DatabaseConfig
from database.schema import SCHEMA_SQL_POSTGRES

logger = logging.getLogger(__name__)

# Try importing psycopg (v3) or psycopg2
_PSYCOPG_AVAILABLE = False
_PSYCOPG_VERSION = None
try:
    import psycopg
    from psycopg.rows import dict_row
    _PSYCOPG_AVAILABLE = True
    _PSYCOPG_VERSION = 3
except ImportError:
    try:
        import psycopg2
        import psycopg2.extras
        _PSYCOPG_AVAILABLE = True
        _PSYCOPG_VERSION = 2
    except ImportError:
        _PSYCOPG_AVAILABLE = False
        _PSYCOPG_VERSION = None

def translate_qmark_to_pyformat(sql: str) -> str:
    """
    Replace '?' placeholders outside of quotes with '%s' for PostgreSQL compatibility.
    """
    out = []
    in_quote = False
    quote_char = None
    i = 0
    length = len(sql)
    while i < length:
        c = sql[i]
        if in_quote:
            out.append(c)
            if c == quote_char:
                if i + 1 < length and sql[i + 1] == quote_char:
                    out.append(sql[i + 1])
                    i += 1
                else:
                    in_quote = False
                    quote_char = None
        else:
            if c in ("'", '"'):
                in_quote = True
                quote_char = c
                out.append(c)
            elif c == '?':
                out.append('%s')
            else:
                out.append(c)
        i += 1
    return "".join(out)

class PostgresCursorWrapper:
    """Wrapper around psycopg cursor to ensure uniform DB-API behavior and lastrowid emulation."""

    def __init__(self, raw_cursor):
        self._raw_cursor = raw_cursor
        self.lastrowid = None

    def execute(self, sql: str, params: Optional[Union[Tuple, List, Dict]] = None):
        translated_sql = translate_qmark_to_pyformat(sql)
        sql_upper = translated_sql.strip().upper()
        
        # Check if INSERT without explicit RETURNING
        auto_return_id = False
        if sql_upper.startswith("INSERT INTO") and "RETURNING" not in sql_upper and "AGENT_WORKFLOWS" not in sql_upper:
            translated_sql = translated_sql.rstrip().rstrip(";") + " RETURNING id;"
            auto_return_id = True

        if params is not None:
            self._raw_cursor.execute(translated_sql, params)
        else:
            self._raw_cursor.execute(translated_sql)

        if auto_return_id:
            try:
                row = self._raw_cursor.fetchone()
                if row:
                    if isinstance(row, dict) and "id" in row:
                        self.lastrowid = row["id"]
                    elif isinstance(row, (list, tuple)) and len(row) > 0:
                        self.lastrowid = row[0]
            except Exception:
                pass

        return self

    def executemany(self, sql: str, params_list: List[Any]):
        translated_sql = translate_qmark_to_pyformat(sql)
        return self._raw_cursor.executemany(translated_sql, params_list)

    def fetchone(self):
        return self._raw_cursor.fetchone()

    def fetchall(self):
        return self._raw_cursor.fetchall()

    def fetchmany(self, size=None):
        return self._raw_cursor.fetchmany(size) if size else self._raw_cursor.fetchmany()

    @property
    def description(self):
        return self._raw_cursor.description

    @property
    def rowcount(self):
        return self._raw_cursor.rowcount

    def close(self):
        return self._raw_cursor.close()

    def __iter__(self):
        return iter(self._raw_cursor)


class PostgresConnectionWrapper:
    """Connection wrapper ensuring thread-local compatibility with SQLite DB-API methods."""

    def __init__(self, raw_conn):
        self._raw_conn = raw_conn

    def cursor(self):
        if _PSYCOPG_VERSION == 3:
            return PostgresCursorWrapper(self._raw_conn.cursor(row_factory=dict_row))
        elif _PSYCOPG_VERSION == 2:
            return PostgresCursorWrapper(self._raw_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor))
        return PostgresCursorWrapper(self._raw_conn.cursor())

    def execute(self, sql: str, params: Optional[Union[Tuple, List, Dict]] = None):
        cur = self.cursor()
        cur.execute(sql, params)
        return cur

    def executemany(self, sql: str, params_list: List[Any]):
        cur = self.cursor()
        cur.executemany(sql, params_list)
        return cur

    def executescript(self, script_sql: str):
        """Execute multi-statement SQL script."""
        with self.cursor() as cur:
            cur.execute(script_sql)
        self.commit()

    def commit(self):
        return self._raw_conn.commit()

    def rollback(self):
        return self._raw_conn.rollback()

    def close(self):
        return self._raw_conn.close()

    @property
    def closed(self):
        return getattr(self._raw_conn, "closed", False)


class PostgresAdapter(BaseDatabaseAdapter):
    """PostgreSQL engine adapter with thread-local pooling and automatic dialect adaptation."""

    def __init__(self, config: DatabaseConfig, timeout: int = 3):
        self.config = config
        self.timeout = timeout
        self._local = threading.local()

        if not _PSYCOPG_AVAILABLE:
            raise RuntimeError(
                "PostgreSQL driver is missing. Please install psycopg with: pip install 'psycopg[binary]'"
            )

    @property
    def backend_name(self) -> str:
        return "postgresql"

    def get_connection(self) -> PostgresConnectionWrapper:
        """Return a thread-local PostgreSQL connection with dictionary row formatting."""
        conn_wrapper = getattr(self._local, "conn_wrapper", None)
        if conn_wrapper is None or conn_wrapper.closed:
            try:
                if _PSYCOPG_VERSION == 3:
                    raw_conn = psycopg.connect(
                        self.config.raw_url,
                        row_factory=dict_row,
                        autocommit=False,
                        connect_timeout=self.timeout
                    )
                else:
                    raw_conn = psycopg2.connect(
                        self.config.raw_url,
                        connect_timeout=self.timeout
                    )
                
                conn_wrapper = PostgresConnectionWrapper(raw_conn)
                self._local.conn_wrapper = conn_wrapper
            except Exception as e:
                logger.error(f"Failed to connect to PostgreSQL at {self.config.display_url}: {e}")
                raise ConnectionError(
                    f"PostgreSQL connection failed at {self.config.display_url}. Error: {e}"
                ) from e
        return conn_wrapper

    def initialize_schema(self) -> None:
        """Execute PostgreSQL DDL schema creation script and apply column migrations."""
        conn = self.get_connection()
        try:
            conn.executescript(SCHEMA_SQL_POSTGRES)
            self._run_column_migrations(conn)
            logger.info(f"PostgreSQL schema initialized successfully on {self.config.display_url}")
        except Exception as e:
            conn.rollback()
            logger.error(f"Failed to initialize PostgreSQL schema on {self.config.display_url}: {e}")
            raise

    def _run_column_migrations(self, conn: PostgresConnectionWrapper) -> None:
        """Add any missing columns to existing PostgreSQL tables for backwards compatibility."""
        migrations = [
            ("documents", "checksum", "VARCHAR(128)"),
            ("agent_tasks", "dependencies_json", "TEXT"),
            ("agent_tasks", "timeout_seconds", "REAL DEFAULT 30.0"),
            ("agent_tasks", "retry_count", "INTEGER DEFAULT 0"),
            ("agent_tasks", "error_message", "TEXT"),
            ("agent_tasks", "completed_at", "TIMESTAMP"),
            ("agent_results", "agent_id", "VARCHAR(128)"),
            ("agent_workflows", "quality_decision", "VARCHAR(64)"),
            ("agent_workflows", "paused_reason", "TEXT"),
            ("agent_workflows", "resume_state_json", "TEXT"),
            ("agent_workflows", "quality_report_json", "TEXT"),
            ("agent_workflows", "provenance_dag_json", "TEXT"),
            ("validation_issues", "resolved_by", "VARCHAR(128)"),
            ("validation_issues", "resolved_note", "TEXT"),
        ]
        for table, column, col_type in migrations:
            try:
                conn.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {col_type};")
            except Exception as e:
                logger.debug(f"Postgres migration check skipped for {table}.{column}: {e}")

    def check_connection(self) -> bool:
        """Probe PostgreSQL connectivity."""
        try:
            conn = self.get_connection()
            cur = conn.execute("SELECT 1 AS probe")
            res = cur.fetchone()
            return res is not None and (res.get("probe") == 1 if isinstance(res, dict) else res[0] == 1)
        except Exception as e:
            logger.error(f"PostgreSQL connectivity check failed on {self.config.display_url}: {e}")
            return False

    def close(self) -> None:
        """Close thread-local connection."""
        conn_wrapper = getattr(self._local, "conn_wrapper", None)
        if conn_wrapper:
            try:
                conn_wrapper.close()
            except Exception:
                pass
            self._local.conn_wrapper = None
