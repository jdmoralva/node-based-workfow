"""Create analytical data models table."""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "003_data_models"
down_revision = "002_database_connections"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analytical_data_models",
        sa.Column("id", sa.String(length=40), primary_key=True),
        sa.Column("user_id", sa.String(length=40), sa.ForeignKey("internal_users.id"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("normalized_name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=1024), nullable=True),
        sa.Column("model_json", sa.JSON(), nullable=False),
        sa.Column("test_status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("last_tested_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("last_test_succeeded_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("last_test_failed_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("last_test_errors_json", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("last_test_warnings_json", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("diagnostics_stale", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), nullable=False),
        sa.UniqueConstraint("user_id", "normalized_name", name="uq_analytical_data_models_user_normalized_name"),
    )
    op.create_index("ix_analytical_data_models_user_id", "analytical_data_models", ["user_id"], unique=False)
    op.create_index("ix_analytical_data_models_normalized_name", "analytical_data_models", ["normalized_name"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_analytical_data_models_normalized_name", table_name="analytical_data_models")
    op.drop_index("ix_analytical_data_models_user_id", table_name="analytical_data_models")
    op.drop_table("analytical_data_models")
