from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (
        UniqueConstraint("period_id", "category_id", name="uq_budget_period_category"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    period_id: Mapped[int] = mapped_column(ForeignKey("periods.id"), nullable=False, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    period: Mapped["Period"] = relationship("Period", back_populates="budgets")  # noqa: F821
    category: Mapped["Category"] = relationship("Category", back_populates="budgets")  # noqa: F821
