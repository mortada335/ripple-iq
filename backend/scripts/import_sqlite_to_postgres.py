"""Import a SQLite application database into an empty, migrated PostgreSQL DB.

Run from any directory with DATABASE_URL configured, for example:
    python backend/scripts/import_sqlite_to_postgres.py --source backend/rippleiq_demo.db

The importer never deletes or overwrites target rows. It preserves IDs and
relationships, commits all records atomically, then advances PostgreSQL ID
sequences to the imported maximum values.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from alembic.script import ScriptDirectory

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app import models  # noqa: E402, F401 - register all ORM tables on Base.metadata
from app.config import settings  # noqa: E402
from app.database import Base  # noqa: E402
from sqlalchemy import create_engine, func, inspect, select, text  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        type=Path,
        default=BACKEND_DIR / "rippleiq_demo.db",
        help="SQLite database file to import (default: backend/rippleiq_demo.db)",
    )
    return parser.parse_args()


def expected_migration_heads() -> set[str]:
    versions_dir = BACKEND_DIR / "alembic" / "versions"
    script = ScriptDirectory(str(BACKEND_DIR / "alembic"), version_locations=[str(versions_dir)])
    return set(script.get_heads())


def import_database(source_path: Path, *, target_url: str | None = None) -> dict[str, int]:
    if not source_path.is_file():
        raise FileNotFoundError(f"SQLite source database does not exist: {source_path}")

    target_url = target_url or settings.sqlalchemy_database_url
    target_engine = create_engine(target_url, pool_pre_ping=True)
    if target_engine.dialect.name != "postgresql":
        target_engine.dispose()
        raise ValueError("Import target must be PostgreSQL; DATABASE_URL currently selects another backend.")

    tables = list(Base.metadata.sorted_tables)
    table_names = {table.name for table in tables}
    source_engine = create_engine(f"sqlite:///{source_path.resolve().as_posix()}")

    with source_engine.connect() as source:
        source_tables = set(inspect(source).get_table_names())
        missing_source_tables = table_names - source_tables
        if missing_source_tables:
            raise ValueError(f"SQLite source is missing application tables: {sorted(missing_source_tables)}")

        for table in tables:
            source_columns = {column["name"] for column in inspect(source).get_columns(table.name)}
            expected_columns = {column.name for column in table.columns}
            if source_columns != expected_columns:
                raise ValueError(
                    f"SQLite schema mismatch for {table.name}: "
                    f"missing={sorted(expected_columns - source_columns)}, "
                    f"extra={sorted(source_columns - expected_columns)}"
                )

        source_rows = {table.name: source.execute(select(table)).mappings().all() for table in tables}

    with target_engine.begin() as target:
        inspector = inspect(target)
        target_tables = set(inspector.get_table_names(schema="public"))
        missing_target_tables = table_names - target_tables
        if missing_target_tables:
            raise ValueError(f"PostgreSQL schema is missing application tables: {sorted(missing_target_tables)}")

        for table in tables:
            target_columns = {column["name"] for column in inspector.get_columns(table.name, schema="public")}
            expected_columns = {column.name for column in table.columns}
            if target_columns != expected_columns:
                raise ValueError(
                    f"PostgreSQL schema mismatch for {table.name}: "
                    f"missing={sorted(expected_columns - target_columns)}, "
                    f"extra={sorted(target_columns - expected_columns)}"
                )

        version_rows = target.execute(text("SELECT version_num FROM alembic_version")).scalars().all()
        if set(version_rows) != expected_migration_heads():
            raise ValueError("PostgreSQL schema is not at the current Alembic head; run `alembic upgrade head` first.")

        existing_counts = {
            table.name: target.execute(select(func.count()).select_from(table)).scalar_one() for table in tables
        }
        populated = {name: count for name, count in existing_counts.items() if count}
        if populated:
            raise ValueError(
                "Import refused because PostgreSQL already contains application rows: "
                f"{populated}. No rows were changed."
            )

        imported_counts: dict[str, int] = {}
        for table in tables:
            rows = [dict(row) for row in source_rows[table.name]]
            if rows:
                target.execute(table.insert(), rows)
            imported_counts[table.name] = len(rows)

        for table in tables:
            id_column = table.columns.get("id")
            if id_column is None or not id_column.primary_key:
                continue
            maximum_id = target.execute(select(func.max(id_column))).scalar_one()
            sequence_name = target.execute(
                text("SELECT pg_get_serial_sequence(:table_name, :column_name)"),
                {"table_name": f"public.{table.name}", "column_name": "id"},
            ).scalar_one()
            if sequence_name:
                target.execute(
                    text("SELECT setval(CAST(:sequence_name AS regclass), :value, :is_called)"),
                    {"sequence_name": sequence_name, "value": maximum_id or 1, "is_called": maximum_id is not None},
                )

    with target_engine.connect() as target:
        for table in tables:
            actual_count = target.execute(select(func.count()).select_from(table)).scalar_one()
            if actual_count != imported_counts[table.name]:
                raise RuntimeError(f"Post-import count verification failed for {table.name}.")

    source_engine.dispose()
    target_engine.dispose()
    return imported_counts


def main() -> None:
    args = parse_args()
    counts = import_database(args.source)
    total = sum(counts.values())
    print(
        f"Imported and verified {total} records across {sum(count > 0 for count in counts.values())} populated tables."
    )
    for table_name, count in counts.items():
        if count:
            print(f"{table_name}: {count}")


if __name__ == "__main__":
    main()
