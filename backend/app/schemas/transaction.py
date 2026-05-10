from datetime import date as Date
from decimal import Decimal
from pydantic import BaseModel, field_validator, model_validator
from app.models.transaction import TransactionStatus


class TransactionItemCreate(BaseModel):
    category_id: int
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("amount must be greater than 0")
        return v


class TransactionItemRead(BaseModel):
    id: int
    category_id: int
    category_name: str | None = None
    amount: Decimal

    model_config = {"from_attributes": True}


class TransactionCreate(BaseModel):
    period_id: int
    card_id: int | None = None
    date: Date
    description: str
    status: TransactionStatus = TransactionStatus.not_paid
    items: list[TransactionItemCreate]

    @field_validator("description")
    @classmethod
    def description_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("description must not be empty")
        return v

    @model_validator(mode="after")
    def at_least_one_item(self) -> "TransactionCreate":
        if not self.items:
            raise ValueError("at least one item is required")
        return self


class TransactionUpdate(BaseModel):
    card_id: int | None = None
    date: Date | None = None
    description: str | None = None
    status: TransactionStatus | None = None
    items: list[TransactionItemCreate] | None = None

    @field_validator("description")
    @classmethod
    def description_not_empty(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("description must not be empty")
        return v

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v: list | None) -> list | None:
        if v is not None and len(v) == 0:
            raise ValueError("items list cannot be empty")
        return v


class TransactionRead(BaseModel):
    id: int
    period_id: int
    card_id: int | None
    card_name: str | None
    date: Date
    description: str
    total_amount: Decimal
    status: TransactionStatus
    items: list[TransactionItemRead]

    model_config = {"from_attributes": True}
