from pathlib import Path
import sqlite3
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from build_portfolio_db import build_portfolio_db


def test_build_portfolio_db_creates_loans_and_behavior_tables(tmp_path):
    source_dir = Path(__file__).resolve().parent
    output_path = tmp_path / "portfolio.db"

    result = build_portfolio_db(source_dir, output_path)

    assert result == output_path

    with sqlite3.connect(output_path) as connection:
        tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            )
        }

        assert tables == {"loans", "behavior"}
        for table_name in tables:
            row_count = connection.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
            assert row_count > 0
