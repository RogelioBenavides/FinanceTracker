from __future__ import annotations
import enum
from sqlalchemy import String, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class CardType(str, enum.Enum):
    debit = "debit"
    credit = "credit"


class Card(Base):
    __tablename__ = "cards"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_cards_user_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    card_type: Mapped[CardType] = mapped_column(
        Enum(CardType), nullable=False, default=CardType.credit
    )

    transactions: Mapped[list["Transaction"]] = relationship(  # noqa: F821
        "Transaction", back_populates="card"
    )
