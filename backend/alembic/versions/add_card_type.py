"""add card_type to cards

Revision ID: add_card_type
Revises: add_not_paid_status
Create Date: 2026-05-10

"""
from alembic import op
import sqlalchemy as sa

revision = 'add_card_type'
down_revision = 'add_not_paid_status'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'cards',
        sa.Column(
            'card_type',
            sa.Enum('debit', 'credit', name='cardtype'),
            nullable=False,
            server_default='credit',
        ),
    )


def downgrade() -> None:
    op.drop_column('cards', 'card_type')
