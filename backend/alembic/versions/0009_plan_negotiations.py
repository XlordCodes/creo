"""0009_plan_negotiations

Creates plan_negotiations table for custom plan negotiation workflows.

Revision ID: 0009_plan_negotiations
Revises: 0008_calendar_sequencing
Create Date: 2026-09-30 15:50:00.000000
"""

from collections.abc import Sequence
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0009_plan_negotiations"
down_revision: str | None = "0008_calendar_sequencing"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE IF NOT EXISTS plan_negotiations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_email VARCHAR(255) NOT NULL,
        client_name VARCHAR(255),
        proposed_budget VARCHAR(255),
        contact_phone VARCHAR(50) NOT NULL,
        preferred_window VARCHAR(100) NOT NULL,
        target_topic VARCHAR(255),
        notes TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
        agreed_amount INTEGER,
        razorpay_custom_plan_id VARCHAR(255),
        order_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_negotiations_client_id ON plan_negotiations(client_id);
    CREATE INDEX IF NOT EXISTS idx_negotiations_status ON plan_negotiations(status);
    CREATE INDEX IF NOT EXISTS idx_negotiations_created_at ON plan_negotiations(created_at);
    """)


def downgrade() -> None:
    op.execute("""
    DROP TABLE IF EXISTS plan_negotiations;
    """)
