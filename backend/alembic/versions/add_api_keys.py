"""add api_keys table

Revision ID: add_api_keys
Revises: add_users
Create Date: 2026-05-24

"""
from alembic import op
import sqlalchemy as sa

revision = 'add_api_keys'
down_revision = 'add_users'
branch_labels = None
depends_on = None


def _table_exists(conn, name: str) -> bool:
    return conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.TABLES "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :n"
    ), {"n": name}).scalar() > 0


def upgrade() -> None:
    conn = op.get_bind()
    if not _table_exists(conn, 'api_keys'):
        op.create_table(
            'api_keys',
            sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
            sa.Column('key', sa.String(64), nullable=False),
            sa.Column('name', sa.String(255), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('key', name='uq_api_keys_key'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_api_keys_user_id'),
        )
        op.create_index('ix_api_keys_id', 'api_keys', ['id'])
        op.create_index('ix_api_keys_key', 'api_keys', ['key'])
        op.create_index('ix_api_keys_user_id', 'api_keys', ['user_id'])


def downgrade() -> None:
    conn = op.get_bind()
    if _table_exists(conn, 'api_keys'):
        op.drop_index('ix_api_keys_user_id', 'api_keys')
        op.drop_index('ix_api_keys_key', 'api_keys')
        op.drop_index('ix_api_keys_id', 'api_keys')
        op.drop_table('api_keys')
