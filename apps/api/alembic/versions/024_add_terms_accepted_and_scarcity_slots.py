"""add_terms_accepted_and_scarcity_slots

Revision ID: 024
Revises: 023
Create Date: 2026-06-20

"""
from alembic import op
import sqlalchemy as sa


revision = "024"
down_revision = "023"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "terms_accepted",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )
    op.add_column(
        "platform_settings",
        sa.Column(
            "scarcity_slots_available",
            sa.Integer(),
            nullable=False,
            server_default="5",
        ),
    )


def downgrade() -> None:
    op.drop_column("platform_settings", "scarcity_slots_available")
    op.drop_column("users", "terms_accepted")
