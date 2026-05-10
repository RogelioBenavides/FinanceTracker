from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.budget import Budget
from app.models.period import Period
from app.models.category import Category
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetRead

router = APIRouter(prefix="/budgets", tags=["budgets"])


def _assert_period_exists(period_id: int, db: Session) -> None:
    if not db.query(Period).filter(Period.id == period_id).first():
        raise HTTPException(status_code=404, detail="Period not found")


def _assert_category_exists(category_id: int, db: Session) -> None:
    if not db.query(Category).filter(Category.id == category_id).first():
        raise HTTPException(status_code=404, detail="Category not found")


@router.get("/", response_model=list[BudgetRead])
def list_budgets(period_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Budget)
    if period_id is not None:
        query = query.filter(Budget.period_id == period_id)
    return query.all()


@router.get("/{budget_id}", response_model=BudgetRead)
def get_budget(budget_id: int, db: Session = Depends(get_db)):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget


@router.post("/", response_model=BudgetRead, status_code=201)
def create_budget(payload: BudgetCreate, db: Session = Depends(get_db)):
    _assert_period_exists(payload.period_id, db)
    _assert_category_exists(payload.category_id, db)
    existing = (
        db.query(Budget)
        .filter(
            Budget.period_id == payload.period_id,
            Budget.category_id == payload.category_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Budget for this period and category already exists",
        )
    budget = Budget(**payload.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


@router.put("/{budget_id}", response_model=BudgetRead)
def update_budget(budget_id: int, payload: BudgetUpdate, db: Session = Depends(get_db)):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(budget, field, value)
    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=204)
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
