from decimal import Decimal
from pydantic import BaseModel


class CategorySummary(BaseModel):
    category_id: int
    category_name: str
    category_color: str
    budget: Decimal
    paid: Decimal
    pending: Decimal
    not_paid: Decimal
    available: Decimal  # budget - paid - pending - not_paid

    model_config = {"from_attributes": True}


class PeriodSummary(BaseModel):
    period_id: int
    period_name: str
    total_budget: Decimal
    total_paid: Decimal
    total_pending: Decimal
    total_not_paid: Decimal
    total_available: Decimal
    categories: list[CategorySummary]

    model_config = {"from_attributes": True}
