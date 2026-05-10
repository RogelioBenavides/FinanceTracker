import re
from decimal import Decimal
from pydantic import BaseModel, field_validator


class CategoryBase(BaseModel):
    name: str
    color: str = "#6366f1"
    default_budget: Decimal = Decimal("0.00")

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be empty")
        return v

    @field_validator("color")
    @classmethod
    def color_is_hex(cls, v: str) -> str:
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("color must be a valid hex color (e.g. #6366f1)")
        return v


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    default_budget: Decimal | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("name must not be empty")
        return v

    @field_validator("color")
    @classmethod
    def color_is_hex(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("color must be a valid hex color (e.g. #6366f1)")
        return v


class CategoryRead(CategoryBase):
    id: int

    model_config = {"from_attributes": True}
