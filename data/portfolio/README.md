# Portfolio Database

This directory contains the raw portfolio sources and the generated SQLite database used for portfolio queries.

## Files

- `loans.sav`: source dataset for the `loans` table
- `behavior.sav`: source dataset for the `behavior` table
- `portfolio.db`: generated SQLite database built from the two `.sav` files

## SQLite Database

`portfolio.db` contains two tables:

- `behavior` with `120000` rows
- `loans` with `622489` rows

Both tables are materialized directly from the corresponding SPSS source files.

## Rebuild

Run the importer from the repository root:

```bash
python data/portfolio/build_portfolio_db.py
```

The script recreates `data/portfolio/portfolio.db` from the current `.sav` files.
