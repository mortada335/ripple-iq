"""add reviewed knowledge submissions

Revision ID: 7dbd3e4912ab
Revises: 2f3e05c71afe
Create Date: 2026-10-16 12:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "7dbd3e4912ab"
down_revision: str | None = "2f3e05c71afe"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "knowledge_submissions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("submitted_by_user_id", sa.Integer(), nullable=True),
        sa.Column("scenario_key", sa.String(length=100), nullable=False),
        sa.Column("contributor_role", sa.String(length=100), nullable=False),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("source_name", sa.String(length=255), nullable=True),
        sa.Column("source_date", sa.String(length=30), nullable=True),
        sa.Column("consent_to_review", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["submitted_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    for column in ("id", "organization_id", "submitted_by_user_id", "scenario_key", "status"):
        op.create_index(op.f(f"ix_knowledge_submissions_{column}"), "knowledge_submissions", [column], unique=False)


def downgrade() -> None:
    for column in ("status", "scenario_key", "submitted_by_user_id", "organization_id", "id"):
        op.drop_index(op.f(f"ix_knowledge_submissions_{column}"), table_name="knowledge_submissions")
    op.drop_table("knowledge_submissions")
