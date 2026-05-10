from datetime import date as Date
from pydantic import BaseModel, field_validator, model_validator


class PeriodBase(BaseModel):
    name: str
    start_date: Date
    end_date: Date

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be empty")
        return v

    @model_validator(mode="after")
    def end_after_start(self) -> "PeriodBase":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class PeriodCreate(PeriodBase):
    pass


class PeriodUpdate(BaseModel):
    name: str | None = None
    start_date: Date | None = None
    end_date: Date | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("name must not be empty")
        return v


class PeriodRead(PeriodBase):
    id: int

    model_config = {"from_attributes": True}
