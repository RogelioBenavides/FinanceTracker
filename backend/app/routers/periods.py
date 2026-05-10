from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.period import Period
from app.models.budget import Budget
from app.models.category import Category
from app.schemas.period import PeriodCreate, PeriodUpdate, PeriodRead

router = APIRouter(prefix="/periods", tags=["periods"])


@router.get("/", response_model=list[PeriodRead])
def list_periods(db: Session = Depends(get_db)):
    return db.query(Period).order_by(Period.start_date.desc()).all()


@router.get("/{period_id}", response_model=PeriodRead)
def get_period(period_id: int, db: Session = Depends(get_db)):
    period = db.query(Period).filter(Period.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    return period


@router.post("/", response_model=PeriodRead, status_code=201)
def create_period(payload: PeriodCreate, db: Session = Depends(get_db)):
    existing = db.query(Period).filter(Period.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Period name already exists")
    period = Period(**payload.model_dump())
    db.add(period)
    db.flush()  # get period.id before commit

    categories = (
        db.query(Category)
        .filter(Category.default_budget > Decimal("0.00"))
        .all()
    )
    for cat in categories:
        db.add(Budget(period_id=period.id, category_id=cat.id, amount=cat.default_budget))

    db.commit()
    db.refresh(period)
    return period


@router.put("/{period_id}", response_model=PeriodRead)
def update_period(period_id: int, payload: PeriodUpdate, db: Session = Depends(get_db)):
    period = db.query(Period).filter(Period.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    update_data = payload.model_dump(exclude_unset=True)
    if "name" in update_data:
        conflict = (
            db.query(Period)
            .filter(Period.name == update_data["name"], Period.id != period_id)
            .first()
        )
        if conflict:
            raise HTTPException(status_code=400, detail="Period name already exists")
    for field, value in update_data.items():
        setattr(period, field, value)
    # Validate date ordering after update
    start = update_data.get("start_date", period.start_date)
    end = update_data.get("end_date", period.end_date)
    if end < start:
        raise HTTPException(status_code=400, detail="end_date must be on or after start_date")
    db.commit()
    db.refresh(period)
    return period


@router.delete("/{period_id}", status_code=204)
def delete_period(period_id: int, db: Session = Depends(get_db)):
    period = db.query(Period).filter(Period.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    db.delete(period)
    db.commit()
