"""add default_budget to categories

Revision ID: add_default_budget_to_categories
Revises: add_card_type
Create Date: 2026-05-10

"""
from alembic import op
import sqlalchemy as sa

revision = 'add_default_budget_to_categories'
down_revision = 'add_card_type'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'categories',
        sa.Column('default_budget', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
    )


def downgrade() -> None:
    op.drop_column('categories', 'default_budget')
