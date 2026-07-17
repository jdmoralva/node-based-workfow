from __future__ import annotations

from pathlib import Path
import sqlite3

import pandas as pd


DATASET_FILES = {
    "loans": "loans.sav",
    "behavior": "behavior.sav",
}


def build_demo_db(source_dir: Path, output_path: Path) -> Path:
    source_dir = Path(source_dir)
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if output_path.exists():
        output_path.unlink()

    with sqlite3.connect(output_path) as connection:
        for table_name, filename in DATASET_FILES.items():
            dataset_path = source_dir / filename
            dataframe = pd.read_spss(dataset_path)
            dataframe.to_sql(table_name, connection, if_exists="replace", index=False)

    return output_path


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    source_dir = repo_root / "data" / "demo"
    output_path = repo_root / "data" / "datasets" / "demo.db"
    build_demo_db(source_dir, output_path)


if __name__ == "__main__":
    main()
