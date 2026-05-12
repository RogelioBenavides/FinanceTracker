from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.budget import Budget
from app.models.period import Period
from app.models.category import Category
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetRead

router = APIRouter(prefix="/budgets", tags=["budgets"])


def _owned_period(period_id: int, user_id: int, db: Session) -> Period:
    period = db.query(Period).filter(Period.id == period_id, Period.user_id == user_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    return period


def _owned_budget(budget_id: int, user_id: int, db: Session) -> Budget:
    budget = (
        db.query(Budget)
        .join(Period, Budget.period_id == Period.id)
        .filter(Budget.id == budget_id, Period.user_id == user_id)
        .first()
    )
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget


@router.get("/", response_model=list[BudgetRead])
def list_budgets(
    period_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Budget).join(Period, Budget.period_id == Period.id).filter(Period.user_id == current_user.id)
    if period_id is not None:
        _owned_period(period_id, current_user.id, db)
        query = query.filter(Budget.period_id == period_id)
    return query.all()


@router.get("/{budget_id}", response_model=BudgetRead)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _owned_budget(budget_id, current_user.id, db)


@router.post("/", response_model=BudgetRead, status_code=201)
def create_budget(
    payload: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_period(payload.period_id, current_user.id, db)
    if not db.query(Category).filter(Category.id == payload.category_id, Category.user_id == current_user.id).first():
        raise HTTPException(status_code=404, detail="Category not found")
    existing = db.query(Budget).filter(Budget.period_id == payload.period_id, Budget.category_id == payload.category_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Budget for this period and category already exists")
    budget = Budget(**payload.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


@router.put("/{budget_id}", response_model=BudgetRead)
def update_budget(
    budget_id: int,
    payload: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = _owned_budget(budget_id, current_user.id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(budget, field, value)
    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=204)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = _owned_budget(budget_id, current_user.id, db)
    db.delete(budget)
    db.commit()
