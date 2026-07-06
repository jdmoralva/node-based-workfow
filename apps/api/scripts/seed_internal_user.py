from __future__ import annotations

import argparse
from pathlib import Path
import sys

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.core import database as database_module  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.modules.auth.models import InternalUser  # noqa: E402
from app.modules.auth.repository import get_user_by_username  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed an internal user for the Risk Viewer API.")
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    database_module.initialize_database()
    database_module.create_all_tables()
    assert database_module.SessionLocal is not None

    with database_module.SessionLocal() as db:
        existing_user = get_user_by_username(db, args.username)
        if existing_user is not None:
            print(f"User '{args.username}' already exists.")
            return 0

        db.add(
            InternalUser(
                username=args.username,
                password_hash=hash_password(args.password),
            )
        )
        db.commit()

    print(f"Created user '{args.username}'.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
