"""Create database connections table."""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "002_database_connections"
down_revision = "001_auth_foundation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "database_connections",
        sa.Column("id", sa.String(length=40), primary_key=True),
        sa.Column("user_id", sa.String(length=40), sa.ForeignKey("internal_users.id"), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("normalized_label", sa.String(length=255), nullable=False),
        sa.Column("driver", sa.String(length=32), nullable=False),
        sa.Column("database_path", sa.String(length=1024), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("last_tested_at", sa.DateTime(timezone=False), nullable=True),
        sa.UniqueConstraint("user_id", "normalized_label", name="uq_database_connections_user_normalized_label"),
    )
    op.create_index("ix_database_connections_user_id", "database_connections", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_database_connections_user_id", table_name="database_connections")
    op.drop_table("database_connections")
