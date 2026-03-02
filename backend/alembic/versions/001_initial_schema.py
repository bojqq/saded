"""Initial schema — survey_records + validation_audit_logs

Revision ID: 001
Revises:
Create Date: 2026-02-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "survey_records",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("survey_id", sa.String(), nullable=False, index=True),
        sa.Column("respondent_id", sa.String(), nullable=False),
        sa.Column("fields", JSONB, nullable=False),
        sa.Column("trust_score", sa.Integer(), nullable=False),
        sa.Column("severity", sa.String(), nullable=False),
        sa.Column("flags", JSONB, nullable=False, server_default="[]"),
        sa.Column("classification", sa.String(), nullable=True),
        sa.Column("processing_time_ms", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
    )

    op.create_table(
        "validation_audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("survey_record_id", sa.String(), nullable=False, index=True),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("payload", JSONB, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
    )


def downgrade():
    op.drop_table("validation_audit_logs")
    op.drop_table("survey_records")
