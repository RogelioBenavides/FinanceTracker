from __future__ import annotations

from datetime import date
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric, String, Date, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class TransactionStatus(str, enum.Enum):
    paid = "paid"
    pending = "pending"
    not_paid = "not_paid"


class TransactionItem(Base):
    __tablename__ = "transaction_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    transaction_id: Mapped[int] = mapped_column(
        ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id"), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    transaction: Mapped["Transaction"] = relationship("Transaction", back_populates="items")
    category: Mapped["Category"] = relationship("Category")  # noqa: F821


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    period_id: Mapped[int] = mapped_column(ForeignKey("periods.id"), nullable=False, index=True)
    card_id: Mapped[int | None] = mapped_column(ForeignKey("cards.id"), nullable=True, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[TransactionStatus] = mapped_column(
        Enum(TransactionStatus), nullable=False, default=TransactionStatus.not_paid
    )

    period: Mapped["Period"] = relationship("Period", back_populates="transactions")  # noqa: F821
    card: Mapped["Card | None"] = relationship("Card", back_populates="transactions")  # noqa: F821
    items: Mapped[list[TransactionItem]] = relationship(
        "TransactionItem", back_populates="transaction",
        cascade="all, delete-orphan", lazy="selectin"
    )
