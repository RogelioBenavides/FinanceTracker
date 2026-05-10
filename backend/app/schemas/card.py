from pydantic import BaseModel, field_validator
from app.models.card import CardType


class CardBase(BaseModel):
    name: str
    card_type: CardType = CardType.credit

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be empty")
        return v


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    name: str | None = None
    card_type: CardType | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("name must not be empty")
        return v


class CardRead(CardBase):
    id: int

    model_config = {"from_attributes": True}
