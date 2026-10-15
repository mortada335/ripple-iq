import pytest
from scripts.import_sqlite_to_postgres import expected_migration_heads, import_database


def test_importer_requires_a_postgresql_target(tmp_path):
    source = tmp_path / "source.sqlite3"
    source.touch()

    with pytest.raises(ValueError, match="Import target must be PostgreSQL"):
        import_database(source, target_url="sqlite:///:memory:")


def test_importer_finds_current_migration_head():
    assert expected_migration_heads()
