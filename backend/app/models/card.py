from __future__ import annotations
import enum
from sqlalchemy import String, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class CardType(str, enum.Enum):
    debit = "debit"
    credit = "credit"


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    card_type: Mapped[CardType] = mapped_column(
        Enum(CardType), nullable=False, default=CardType.credit
    )

    transactions: Mapped[list["Transaction"]] = relationship(  # noqa: F821
        "Transaction", back_populates="card"
    )
