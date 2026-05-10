from decimal import Decimal
from pydantic import BaseModel, field_validator


class BudgetBase(BaseModel):
    period_id: int
    category_id: int
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("amount must be greater than 0")
        return v


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: Decimal | None = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Decimal | None) -> Decimal | None:
        if v is not None and v <= 0:
            raise ValueError("amount must be greater than 0")
        return v


class BudgetRead(BudgetBase):
    id: int

    model_config = {"from_attributes": True}
