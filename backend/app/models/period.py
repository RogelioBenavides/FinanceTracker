from __future__ import annotations

from datetime import date
from sqlalchemy import String, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Period(Base):
    __tablename__ = "periods"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_periods_user_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)

    budgets: Mapped[list["Budget"]] = relationship(  # noqa: F821
        "Budget", back_populates="period", cascade="all, delete-orphan"
    )
    transactions: Mapped[list["Transaction"]] = relationship(  # noqa: F821
        "Transaction", back_populates="period"
    )
