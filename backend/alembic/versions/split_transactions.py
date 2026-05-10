"""split transactions into items

Revision ID: split_transactions
Revises: add_default_budget_to_categories
Create Date: 2026-05-10

"""
from alembic import op
import sqlalchemy as sa

revision = 'split_transactions'
down_revision = 'add_default_budget_to_categories'
branch_labels = None
depends_on = None


def _table_exists(conn, name: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.TABLES "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :n"
    ), {"n": name})
    return result.scalar() > 0


def _column_exists(conn, table: str, column: str) -> bool:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t AND COLUMN_NAME = :c"
    ), {"t": table, "c": column})
    return result.scalar() > 0


def _get_fk_name(conn, table: str, column: str, ref_table: str) -> str | None:
    result = conn.execute(sa.text(
        "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t "
        "AND COLUMN_NAME = :c AND REFERENCED_TABLE_NAME = :r"
    ), {"t": table, "c": column, "r": ref_table})
    row = result.fetchone()
    return row[0] if row else None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Create transaction_items if it doesn't exist yet
    if not _table_exists(conn, 'transaction_items'):
        op.create_table(
            'transaction_items',
            sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
            sa.Column('transaction_id', sa.Integer(), nullable=False),
            sa.Column('category_id', sa.Integer(), nullable=False),
            sa.Column('amount', sa.Numeric(12, 2), nullable=False),
            sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['category_id'], ['categories.id']),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('ix_transaction_items_transaction_id', 'transaction_items', ['transaction_id'])
        op.create_index('ix_transaction_items_category_id', 'transaction_items', ['category_id'])

    # 2. Migrate data only if category_id still exists on transactions
    if _column_exists(conn, 'transactions', 'category_id'):
        row_count = conn.execute(sa.text("SELECT COUNT(*) FROM transaction_items")).scalar()
        if row_count == 0:
            op.execute(
                "INSERT INTO transaction_items (transaction_id, category_id, amount) "
                "SELECT id, category_id, amount FROM transactions"
            )

        # 3. Rename amount → total_amount if needed
        if _column_exists(conn, 'transactions', 'amount'):
            op.execute(
                "ALTER TABLE transactions "
                "CHANGE COLUMN amount total_amount DECIMAL(12,2) NOT NULL"
            )

        # 4. Drop the FK on category_id (look up real name)
        fk_name = _get_fk_name(conn, 'transactions', 'category_id', 'categories')
        if fk_name:
            op.execute(f"ALTER TABLE transactions DROP FOREIGN KEY `{fk_name}`")

        # 5. Drop the index on category_id if it exists
        idx = conn.execute(sa.text(
            "SELECT INDEX_NAME FROM information_schema.STATISTICS "
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' "
            "AND COLUMN_NAME = 'category_id' AND INDEX_NAME != 'PRIMARY'"
        )).fetchone()
        if idx:
            op.execute(f"ALTER TABLE transactions DROP INDEX `{idx[0]}`")

        # 6. Drop the column
        op.execute("ALTER TABLE transactions DROP COLUMN category_id")


def downgrade() -> None:
    op.execute("ALTER TABLE transactions ADD COLUMN category_id INT NOT NULL DEFAULT 0")
    op.execute(
        "UPDATE transactions t "
        "JOIN (SELECT transaction_id, category_id FROM transaction_items "
        "      GROUP BY transaction_id) ti ON t.id = ti.transaction_id "
        "SET t.category_id = ti.category_id"
    )
    op.execute(
        "ALTER TABLE transactions "
        "CHANGE COLUMN total_amount amount DECIMAL(12,2) NOT NULL"
    )
    op.drop_index('ix_transaction_items_transaction_id', 'transaction_items')
    op.drop_index('ix_transaction_items_category_id', 'transaction_items')
    op.drop_table('transaction_items')
