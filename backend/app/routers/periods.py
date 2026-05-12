from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.period import Period
from app.models.budget import Budget
from app.models.category import Category
from app.schemas.period import PeriodCreate, PeriodUpdate, PeriodRead

router = APIRouter(prefix="/periods", tags=["periods"])


@router.get("/", response_model=list[PeriodRead])
def list_periods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Period).filter(Period.user_id == current_user.id).order_by(Period.start_date.desc()).all()


@router.get("/{period_id}", response_model=PeriodRead)
def get_period(
    period_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    period = db.query(Period).filter(Period.id == period_id, Period.user_id == current_user.id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    return period


@router.post("/", response_model=PeriodRead, status_code=201)
def create_period(
    payload: PeriodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Period).filter(Period.user_id == current_user.id, Period.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Period name already exists")
    period = Period(**payload.model_dump(), user_id=current_user.id)
    db.add(period)
    db.flush()

    categories = (
        db.query(Category)
        .filter(Category.user_id == current_user.id, Category.default_budget > Decimal("0.00"))
        .all()
    )
    for cat in categories:
        db.add(Budget(period_id=period.id, category_id=cat.id, amount=cat.default_budget))

    db.commit()
    db.refresh(period)
    return period


@router.put("/{period_id}", response_model=PeriodRead)
def update_period(
    period_id: int,
    payload: PeriodUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    period = db.query(Period).filter(Period.id == period_id, Period.user_id == current_user.id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    update_data = payload.model_dump(exclude_unset=True)
    if "name" in update_data:
        conflict = (
            db.query(Period)
            .filter(Period.user_id == current_user.id, Period.name == update_data["name"], Period.id != period_id)
            .first()
        )
        if conflict:
            raise HTTPException(status_code=400, detail="Period name already exists")
    for field, value in update_data.items():
        setattr(period, field, value)
    start = update_data.get("start_date", period.start_date)
    end = update_data.get("end_date", period.end_date)
    if end < start:
        raise HTTPException(status_code=400, detail="end_date must be on or after start_date")
    db.commit()
    db.refresh(period)
    return period


@router.delete("/{period_id}", status_code=204)
def delete_period(
    period_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    period = db.query(Period).filter(Period.id == period_id, Period.user_id == current_user.id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    db.delete(period)
    db.commit()
