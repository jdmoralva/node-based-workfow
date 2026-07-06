"""Create internal users and authenticated sessions tables."""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "001_auth_foundation"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "internal_users",
        sa.Column("id", sa.String(length=40), primary_key=True),
        sa.Column("username", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=512), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), nullable=False),
    )
    op.create_index("ix_internal_users_username", "internal_users", ["username"], unique=True)

    op.create_table(
        "authenticated_sessions",
        sa.Column("id", sa.String(length=48), primary_key=True),
        sa.Column("user_id", sa.String(length=40), sa.ForeignKey("internal_users.id"), nullable=False),
        sa.Column("session_token_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=False), nullable=True),
    )
    op.create_index(
        "ix_authenticated_sessions_session_token_hash",
        "authenticated_sessions",
        ["session_token_hash"],
        unique=True,
    )
    op.create_index("ix_authenticated_sessions_user_id", "authenticated_sessions", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_authenticated_sessions_user_id", table_name="authenticated_sessions")
    op.drop_index("ix_authenticated_sessions_session_token_hash", table_name="authenticated_sessions")
    op.drop_table("authenticated_sessions")
    op.drop_index("ix_internal_users_username", table_name="internal_users")
    op.drop_table("internal_users")
