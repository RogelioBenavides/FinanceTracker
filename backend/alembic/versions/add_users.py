"""add users and user_id scoping

Revision ID: add_users
Revises: split_transactions
Create Date: 2026-05-11

"""
from alembic import op
import sqlalchemy as sa

revision = 'add_users'
down_revision = 'split_transactions'
branch_labels = None
depends_on = None


def _table_exists(conn, name: str) -> bool:
    return conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.TABLES "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :n"
    ), {"n": name}).scalar() > 0


def _column_exists(conn, table: str, column: str) -> bool:
    return conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t AND COLUMN_NAME = :c"
    ), {"t": table, "c": column}).scalar() > 0


def _fk_exists(conn, table: str, constraint_name: str) -> bool:
    return conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t "
        "AND CONSTRAINT_NAME = :n AND CONSTRAINT_TYPE = 'FOREIGN KEY'"
    ), {"t": table, "n": constraint_name}).scalar() > 0


def _index_exists(conn, table: str, index_name: str) -> bool:
    return conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.STATISTICS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t AND INDEX_NAME = :n"
    ), {"t": table, "n": index_name}).scalar() > 0


def _unique_exists(conn, table: str, constraint_name: str) -> bool:
    return conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t "
        "AND CONSTRAINT_NAME = :n AND CONSTRAINT_TYPE = 'UNIQUE'"
    ), {"t": table, "n": constraint_name}).scalar() > 0


def _get_name_unique_constraint(conn, table: str) -> str | None:
    """Return the name of the unique constraint/index on the `name` column."""
    row = conn.execute(sa.text(
        "SELECT tc.CONSTRAINT_NAME "
        "FROM information_schema.TABLE_CONSTRAINTS tc "
        "JOIN information_schema.KEY_COLUMN_USAGE kcu "
        "  ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME "
        "  AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA "
        "  AND tc.TABLE_NAME = kcu.TABLE_NAME "
        "WHERE tc.TABLE_SCHEMA = DATABASE() AND tc.TABLE_NAME = :t "
        "AND tc.CONSTRAINT_TYPE = 'UNIQUE' AND kcu.COLUMN_NAME = 'name'"
    ), {"t": table}).fetchone()
    return row[0] if row else None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Create users table
    if not _table_exists(conn, 'users'):
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
            sa.Column('google_id', sa.String(128), nullable=False),
            sa.Column('email', sa.String(255), nullable=False),
            sa.Column('name', sa.String(255), nullable=False),
            sa.Column('picture', sa.String(500), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('google_id', name='uq_users_google_id'),
            sa.UniqueConstraint('email', name='uq_users_email'),
        )
        op.create_index('ix_users_id', 'users', ['id'])
        op.create_index('ix_users_google_id', 'users', ['google_id'])
        op.create_index('ix_users_email', 'users', ['email'])

    # 2. Add user_id to categories, cards, periods
    for table in ('categories', 'cards', 'periods'):
        fk_name = f'fk_{table}_user_id'
        idx_name = f'ix_{table}_user_id'
        uq_name = f'uq_{table}_user_name'

        if not _column_exists(conn, table, 'user_id'):
            op.add_column(table, sa.Column('user_id', sa.Integer(), nullable=True))

        if not _fk_exists(conn, table, fk_name):
            op.execute(f"ALTER TABLE `{table}` ADD CONSTRAINT `{fk_name}` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)")

        if not _index_exists(conn, table, idx_name):
            op.create_index(idx_name, table, ['user_id'])

        # Drop old global unique constraint on name
        old_uq = _get_name_unique_constraint(conn, table)
        if old_uq:
            op.execute(f"ALTER TABLE `{table}` DROP INDEX `{old_uq}`")

        # Add per-user unique constraint
        if not _unique_exists(conn, table, uq_name):
            op.create_unique_constraint(uq_name, table, ['user_id', 'name'])


def downgrade() -> None:
    conn = op.get_bind()
    for table in ('categories', 'cards', 'periods'):
        uq_name = f'uq_{table}_user_name'
        fk_name = f'fk_{table}_user_id'
        idx_name = f'ix_{table}_user_id'

        if _unique_exists(conn, table, uq_name):
            op.drop_constraint(uq_name, table, type_='unique')
        if _index_exists(conn, table, idx_name):
            op.drop_index(idx_name, table)
        if _fk_exists(conn, table, fk_name):
            op.execute(f"ALTER TABLE `{table}` DROP FOREIGN KEY `{fk_name}`")
        if _column_exists(conn, table, 'user_id'):
            op.drop_column(table, 'user_id')
        if not _unique_exists(conn, table, 'name'):
            op.create_unique_constraint(f'uq_{table}_name_legacy', table, ['name'])

    if _table_exists(conn, 'users'):
        for idx in ('ix_users_email', 'ix_users_google_id', 'ix_users_id'):
            if _index_exists(conn, 'users', idx):
                op.drop_index(idx, 'users')
        op.drop_table('users')
