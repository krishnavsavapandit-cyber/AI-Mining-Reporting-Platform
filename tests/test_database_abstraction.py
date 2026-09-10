"""
Automated Test Suite for Database Abstraction, Multi-Dialect Support & Migration in SIH26023.
Tests SQLite fallback, PostgreSQL configuration, parameter rewriting, transactions, and migration tools.
"""

import unittest
import tempfile
import os
from pathlib import Path

from database.config import parse_database_url, DatabaseConfig
from database.schema import SCHEMA_SQL_SQLITE, SCHEMA_SQL_POSTGRES, get_schema_sql
from database.adapters.postgres_adapter import translate_qmark_to_pyformat, PostgresCursorWrapper
from database.adapters.sqlite_adapter import SQLiteAdapter
from database.db import (
    get_db, get_db_connection, init_db, set_database_url, reset_db_adapter,
    get_db_type, is_db_connected, get_db_info, log_audit
)
from database.migrate_to_postgres import migrate_sqlite_to_postgres, MIGRATION_TABLES

class TestDatabaseAbstraction(unittest.TestCase):
    """Test suite verifying database portability and abstraction."""

    def setUp(self):
        # Create a temporary SQLite database for test isolation
        self.temp_dir = tempfile.TemporaryDirectory()
        self.test_db_path = Path(self.temp_dir.name) / "test_mining.db"
        self.adapter = set_database_url(f"sqlite:///{self.test_db_path.as_posix()}")
        init_db()

    def tearDown(self):
        reset_db_adapter()
        try:
            self.temp_dir.cleanup()
        except Exception:
            pass

    def test_default_sqlite_fallback(self):
        """Test that empty or None DATABASE_URL defaults cleanly to SQLite."""
        config = parse_database_url("")
        self.assertEqual(config.backend, "sqlite")
        self.assertFalse(config.is_explicit_postgres)
        self.assertTrue(config.display_url.startswith("sqlite:///"))

        config_none = parse_database_url(None)
        self.assertEqual(config_none.backend, "sqlite")

    def test_sqlite_url_parsing(self):
        """Test explicit sqlite:/// URLs."""
        config = parse_database_url("sqlite:///database/custom_test.db")
        self.assertEqual(config.backend, "sqlite")
        self.assertIn("custom_test.db", config.display_url)

        mem_config = parse_database_url("sqlite:///:memory:")
        self.assertEqual(mem_config.backend, "sqlite")
        self.assertEqual(mem_config.display_url, "sqlite:///:memory:")

    def test_postgres_url_parsing_and_credential_masking(self):
        """Test PostgreSQL URL parsing, normalization, and password masking."""
        raw_url = "postgresql://cil_admin:SuperSecretPass123@10.0.0.5:5432/mining_enterprise"
        config = parse_database_url(raw_url)
        
        self.assertEqual(config.backend, "postgresql")
        self.assertTrue(config.is_explicit_postgres)
        self.assertEqual(config.user, "cil_admin")
        self.assertEqual(config.password, "SuperSecretPass123")
        self.assertEqual(config.host, "10.0.0.5")
        self.assertEqual(config.port, 5432)
        self.assertEqual(config.dbname, "mining_enterprise")

        # Crucial security assertion: password MUST NOT appear in display_url
        self.assertNotIn("SuperSecretPass123", config.display_url)
        self.assertEqual(config.display_url, "postgresql://cil_admin:***@10.0.0.5:5432/mining_enterprise")

    def test_postgres_url_prefix_normalization(self):
        """Test normalization of postgres:// to postgresql://."""
        raw_url = "postgres://usr:pwd@localhost:5432/db"
        config = parse_database_url(raw_url)
        self.assertEqual(config.backend, "postgresql")
        self.assertTrue(config.raw_url.startswith("postgresql://"))

    def test_schema_ddl_containment(self):
        """Test that all 12 tables exist in both SQLite and PostgreSQL schemas."""
        tables = [
            "documents", "document_chunks", "extracted_data", "topics",
            "queries", "reports", "inquiries", "validation_issues",
            "agent_workflows", "agent_tasks", "agent_results", "audit_logs"
        ]
        sqlite_ddl = get_schema_sql("sqlite")
        postgres_ddl = get_schema_sql("postgresql")

        for tbl in tables:
            self.assertIn(f"CREATE TABLE IF NOT EXISTS {tbl}", sqlite_ddl)
            self.assertIn(f"CREATE TABLE IF NOT EXISTS {tbl}", postgres_ddl)

        # Check Postgres-specific types
        self.assertIn("SERIAL PRIMARY KEY", postgres_ddl)
        self.assertIn("DOUBLE PRECISION", postgres_ddl)

    def test_qmark_to_pyformat_translator(self):
        """Test translating ? markers to %s while preserving ? inside string literals."""
        # Simple query
        sql1 = "SELECT * FROM documents WHERE id = ? AND subsidiary = ?"
        self.assertEqual(translate_qmark_to_pyformat(sql1), "SELECT * FROM documents WHERE id = %s AND subsidiary = %s")

        # Query with question mark in string literal
        sql2 = "SELECT * FROM inquiries WHERE question_text = 'Is this 100% accurate?' AND id = ?"
        self.assertEqual(
            translate_qmark_to_pyformat(sql2),
            "SELECT * FROM inquiries WHERE question_text = 'Is this 100% accurate?' AND id = %s"
        )

        # Insert statement
        sql3 = "INSERT INTO topics (topic_name, frequency) VALUES (?, ?)"
        self.assertEqual(translate_qmark_to_pyformat(sql3), "INSERT INTO topics (topic_name, frequency) VALUES (%s, %s)")

    def test_sqlite_crud_and_transaction_commit(self):
        """Test standard CRUD operations and transaction commit on active database."""
        with get_db() as conn:
            cur = conn.execute(
                """
                INSERT INTO documents (filename, original_name, file_type, file_size, file_path, subsidiary, mine, reporting_period, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                ("doc_test_1.pdf", "doc_test_1.pdf", "pdf", 1024, "uploads/doc_test_1.pdf", "ECL", "Rajmahal", "May 2025", "PROCESSED")
            )
            doc_id = cur.lastrowid
            self.assertIsNotNone(doc_id)
            self.assertGreater(doc_id, 0)

            # Insert chunk
            conn.execute(
                """
                INSERT INTO document_chunks (document_id, chunk_index, page_number, content)
                VALUES (?, ?, ?, ?)
                """,
                (doc_id, 0, 1, "ECL Rajmahal coal production 3.42 MT.")
            )

        # Verify in a new connection/transaction
        with get_db() as conn:
            doc = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
            self.assertIsNotNone(doc)
            self.assertEqual(doc["filename"], "doc_test_1.pdf")
            self.assertEqual(doc["subsidiary"], "ECL")

            chunks = conn.execute("SELECT * FROM document_chunks WHERE document_id = ?", (doc_id,)).fetchall()
            self.assertEqual(len(chunks), 1)
            self.assertEqual(chunks[0]["content"], "ECL Rajmahal coal production 3.42 MT.")

    def test_sqlite_transaction_rollback(self):
        """Test that exceptions cleanly rollback uncommitted transactions."""
        try:
            with get_db() as conn:
                conn.execute(
                    """
                    INSERT INTO documents (filename, original_name, file_type, file_size, file_path)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    ("rollback_doc.pdf", "rollback_doc.pdf", "pdf", 512, "uploads/rollback_doc.pdf")
                )
                raise RuntimeError("Simulated failure during document processing workflow")
        except RuntimeError:
            pass

        # Verify row was rolled back
        with get_db() as conn:
            doc = conn.execute("SELECT * FROM documents WHERE filename = ?", ("rollback_doc.pdf",)).fetchone()
            self.assertIsNone(doc)

    def test_explicit_postgres_failure_does_not_silently_fallback(self):
        """
        Verify that configuring an invalid/unreachable PostgreSQL DATABASE_URL
        raises a clear error and does NOT silently switch to SQLite.
        """
        invalid_pg_url = "postgresql://nonexistent_user:wrongpass@127.0.0.1:54399/nonexistent_db"
        
        # Setting the URL should configure the Postgres adapter
        set_database_url(invalid_pg_url)
        self.assertEqual(get_db_type(), "postgresql")

        # Attempting to connect MUST fail with ConnectionError or Exception, NOT silently fallback
        with self.assertRaises((ConnectionError, Exception)):
            get_db_connection()

        # Ensure active backend remained postgresql and did not silently become sqlite
        self.assertEqual(get_db_type(), "postgresql")

    def test_agent_workflow_and_tasks_persistence(self):
        """Test ANSI ON CONFLICT support on agent workflows and tasks."""
        with get_db() as conn:
            # 1. Insert workflow
            conn.execute(
                """
                INSERT INTO agent_workflows (id, workflow_type, initial_prompt, status)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
                """,
                ("wf-test-101", "QUERY_ANSWERING", "Production summary", "RUNNING")
            )

            # 2. Insert Task
            conn.execute(
                """
                INSERT INTO agent_tasks (workflow_id, task_id, source_agent, destination_agent, task_type, status)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (task_id) DO UPDATE SET status = EXCLUDED.status
                """,
                ("wf-test-101", "task-retrieval-1", "ManagerAgent", "RetrievalAgent", "RETRIEVE", "COMPLETED")
            )

            # 3. Update Task on conflict
            conn.execute(
                """
                INSERT INTO agent_tasks (workflow_id, task_id, source_agent, destination_agent, task_type, status)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (task_id) DO UPDATE SET status = EXCLUDED.status
                """,
                ("wf-test-101", "task-retrieval-1", "ManagerAgent", "RetrievalAgent", "RETRIEVE", "VERIFIED")
            )

        # Verify updated status
        with get_db() as conn:
            task = conn.execute("SELECT * FROM agent_tasks WHERE task_id = ?", ("task-retrieval-1",)).fetchone()
            self.assertIsNotNone(task)
            self.assertEqual(task["status"], "VERIFIED")

    def test_audit_log_recording(self):
        """Test immutable audit logging through database helper."""
        log_audit(
            action_type="TEST_SECURITY_CHECK",
            user_role="ADMIN",
            resource_type="DOCUMENT",
            resource_id="999",
            details={"ip": "127.0.0.1", "action": "Verify RBAC"}
        )

        with get_db() as conn:
            logs = conn.execute("SELECT * FROM audit_logs WHERE action_type = 'TEST_SECURITY_CHECK'").fetchall()
            self.assertGreaterEqual(len(logs), 1)
            self.assertEqual(logs[0]["user_role"], "ADMIN")
            self.assertEqual(logs[0]["resource_id"], "999")

    def test_migration_dry_run(self):
        """Test that migration utility inspects tables and counts without error."""
        # Insert a test document in SQLite
        with get_db() as conn:
            conn.execute(
                """
                INSERT INTO documents (filename, original_name, file_type, file_size, file_path)
                VALUES (?, ?, ?, ?, ?)
                """,
                ("mig_doc.pdf", "mig_doc.pdf", "pdf", 2048, "uploads/mig_doc.pdf")
            )

        counts = migrate_sqlite_to_postgres(
            sqlite_path=self.test_db_path,
            pg_url="postgresql://localhost:5432/dry_run_test",
            dry_run=True
        )

        self.assertIn("documents", counts)
        self.assertGreaterEqual(counts["documents"], 1)
        for tbl in MIGRATION_TABLES:
            self.assertIn(tbl, counts)

    def test_database_health_info(self):
        """Test get_db_info() returns safe, non-leaking configuration."""
        info = get_db_info()
        self.assertIn("backend", info)
        self.assertIn("status", info)
        self.assertIn("display_target", info)
        self.assertEqual(info["backend"], "sqlite")
        self.assertEqual(info["status"], "connected")
        self.assertFalse(info["is_primary_enterprise"])


if __name__ == "__main__":
    unittest.main()
