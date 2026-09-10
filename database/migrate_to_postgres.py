"""
Safe SQLite to PostgreSQL Data Migration Utility for SIH26023 Mining Platform.
Migrates all 12 tables preserving primary keys, timestamps, JSON payloads, foreign key integrity, and serial sequences.
"""

import sys
import os
import argparse
import sqlite3
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from database.config import parse_database_url
from database.schema import SCHEMA_SQL_POSTGRES
from database.adapters.postgres_adapter import PostgresAdapter, _PSYCOPG_AVAILABLE

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("migration")

# Table migration order respecting Foreign Key constraints
MIGRATION_TABLES = [
    "documents",
    "agent_workflows",
    "agent_tasks",
    "document_chunks",
    "extracted_data",
    "topics",
    "queries",
    "reports",
    "inquiries",
    "validation_issues",
    "agent_results",
    "audit_logs"
]

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def migrate_sqlite_to_postgres(sqlite_path: Path, pg_url: str, dry_run: bool = False) -> Dict[str, int]:
    """
    Safely migrate records from SQLite to PostgreSQL.
    """
    if not sqlite_path.exists():
        raise FileNotFoundError(f"Source SQLite database not found at {sqlite_path}")

    if not _PSYCOPG_AVAILABLE:
        raise RuntimeError("PostgreSQL driver (psycopg) is not installed. Run: pip install 'psycopg[binary]'")

    pg_config = parse_database_url(pg_url)
    if pg_config.backend != "postgresql":
        raise ValueError(f"Target URL is not a PostgreSQL URL: {pg_config.display_url}")

    logger.info(f"Source SQLite Database: {sqlite_path}")
    logger.info(f"Target PostgreSQL Database: {pg_config.display_url}")
    logger.info(f"Mode: {'DRY RUN (Inspection Only)' if dry_run else 'LIVE MIGRATION'}")

    # 1. Connect to SQLite
    sqlite_conn = sqlite3.connect(str(sqlite_path))
    sqlite_conn.row_factory = dict_factory

    migration_counts: Dict[str, int] = {}

    if dry_run:
        logger.info("Inspecting SQLite source database tables and rows...")
        try:
            for table in MIGRATION_TABLES:
                cur = sqlite_conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
                if not cur.fetchone():
                    migration_counts[table] = 0
                    continue
                cnt = sqlite_conn.execute(f"SELECT COUNT(*) AS cnt FROM {table}").fetchone()["cnt"]
                migration_counts[table] = cnt
                logger.info(f"  {table:<22}: {cnt} rows found")
            return migration_counts
        finally:
            sqlite_conn.close()

    # 2. Live Migration: Connect to PostgreSQL & Initialize Schema
    pg_adapter = PostgresAdapter(pg_config)
    logger.info("Initializing PostgreSQL tables and indices...")
    pg_adapter.initialize_schema()

    pg_conn = pg_adapter.get_connection()

    try:
        for table in MIGRATION_TABLES:
            # Check if table exists in SQLite
            cur = sqlite_conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
            if not cur.fetchone():
                logger.warning(f"Table '{table}' does not exist in SQLite source. Skipping.")
                migration_counts[table] = 0
                continue

            # Fetch rows from SQLite
            rows = sqlite_conn.execute(f"SELECT * FROM {table}").fetchall()
            row_count = len(rows)
            logger.info(f"Found {row_count} rows in table '{table}'")

            if row_count == 0 or dry_run:
                migration_counts[table] = row_count
                continue

            # Get column names
            columns = list(rows[0].keys())
            col_names_str = ", ".join(columns)
            placeholders = ", ".join(["%s"] * len(columns))
            insert_sql = f"INSERT INTO {table} ({col_names_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"

            # Execute batch insert on PostgreSQL
            records_data = [[row[c] for c in columns] for row in rows]
            with pg_conn.cursor() as pg_cur:
                pg_cur.executemany(insert_sql, records_data)

            # Synchronize sequence for auto-increment tables
            if table != "agent_workflows":
                try:
                    seq_reset_sql = f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE((SELECT MAX(id) FROM {table}), 1));"
                    with pg_conn.cursor() as pg_cur:
                        pg_cur.execute(seq_reset_sql)
                except Exception as seq_err:
                    logger.debug(f"Note on sequence reset for {table}: {seq_err}")

            pg_conn.commit()
            migration_counts[table] = row_count
            logger.info(f"Successfully migrated {row_count} rows into PostgreSQL '{table}'.")

        logger.info("=" * 60)
        logger.info("MIGRATION COMPLETED SUCCESSFULLY")
        logger.info("=" * 60)
        for tbl, cnt in migration_counts.items():
            logger.info(f"  {tbl:<22}: {cnt} records")
        logger.info("=" * 60)

    except Exception as e:
        pg_conn.rollback()
        logger.error(f"Migration failed with error: {e}")
        raise
    finally:
        sqlite_conn.close()
        pg_adapter.close()

    return migration_counts

def main():
    parser = argparse.ArgumentParser(description="SIH26023 SQLite to PostgreSQL Migration Utility")
    parser.add_argument("--sqlite-path", type=str, default=str(ROOT_DIR / "database" / "mining_platform.db"),
                        help="Path to source SQLite database file")
    parser.add_argument("--pg-url", type=str, default=os.getenv("DATABASE_URL", ""),
                        help="PostgreSQL target URL (e.g. postgresql://user:pass@localhost:5432/sih26023)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Inspect source SQLite database without writing to PostgreSQL")

    args = parser.parse_args()
    if not args.pg_url and not args.dry_run:
        print("ERROR: Please specify --pg-url or set DATABASE_URL environment variable.")
        sys.exit(1)

    migrate_sqlite_to_postgres(
        sqlite_path=Path(args.sqlite_path),
        pg_url=args.pg_url or "postgresql://localhost:5432/dry_run",
        dry_run=args.dry_run
    )

if __name__ == "__main__":
    main()
