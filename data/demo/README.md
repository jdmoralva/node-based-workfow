# Portfolio Database

This directory contains the raw demo sources and the generated SQLite database used for demo queries.

## Files

- `loans.sav`: source dataset for the `loans` table
- `behavior.sav`: source dataset for the `behavior` table
- `demo.db`: generated SQLite database built from the two `.sav` files

## SQLite Database

`demo.db` contains two tables:

- `behavior` with `120000` rows
- `loans` with `622489` rows

Both tables are materialized directly from the corresponding SPSS source files.

## Rebuild

Run the importer from the repository root:

```bash
python data/demo/build_demo_db.py
```

The script recreates `data/datasets/demo.db` from the current `.sav` files.

## Tests

Run tests from:

```bash
python data/demo/test_demo_db.py
```