"""add not_paid status

Revision ID: add_not_paid_status
Revises: 102926398d4e
Create Date: 2026-05-10

"""
from alembic import op

revision = 'add_not_paid_status'
down_revision = '102926398d4e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE transactions MODIFY COLUMN status "
        "ENUM('paid', 'pending', 'not_paid') NOT NULL DEFAULT 'not_paid'"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE transactions SET status = 'pending' WHERE status = 'not_paid'"
    )
    op.execute(
        "ALTER TABLE transactions MODIFY COLUMN status "
        "ENUM('paid', 'pending') NOT NULL DEFAULT 'pending'"
    )
