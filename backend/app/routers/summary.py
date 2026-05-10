from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.models.period import Period
from app.models.budget import Budget
from app.models.transaction import Transaction, TransactionItem, TransactionStatus
from app.models.category import Category
from app.schemas.summary import CategorySummary, PeriodSummary

router = APIRouter(prefix="/summary", tags=["summary"])

ZERO = Decimal("0.00")


@router.get("/{period_id}", response_model=PeriodSummary)
def get_period_summary(period_id: int, db: Session = Depends(get_db)):
    period = db.query(Period).filter(Period.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")

    budgets = (
        db.query(Budget)
        .join(Budget.category)
        .filter(Budget.period_id == period_id)
        .all()
    )

    # Join transaction_items → transactions to get status
    rows = (
        db.query(TransactionItem, Transaction.status)
        .join(Transaction, TransactionItem.transaction_id == Transaction.id)
        .filter(Transaction.period_id == period_id)
        .all()
    )

    budget_map: dict[int, Decimal] = {}
    category_map: dict[int, Category] = {}
    for b in budgets:
        budget_map[b.category_id] = b.amount
        category_map[b.category_id] = b.category

    paid_map: dict[int, Decimal] = {}
    pending_map: dict[int, Decimal] = {}
    not_paid_map: dict[int, Decimal] = {}

    for item, status in rows:
        if item.category_id not in category_map:
            category_map[item.category_id] = item.category
        if status == TransactionStatus.paid:
            paid_map[item.category_id] = paid_map.get(item.category_id, ZERO) + item.amount
        elif status == TransactionStatus.pending:
            pending_map[item.category_id] = pending_map.get(item.category_id, ZERO) + item.amount
        else:
            not_paid_map[item.category_id] = not_paid_map.get(item.category_id, ZERO) + item.amount

    all_ids = (
        set(budget_map) | set(paid_map) | set(pending_map) | set(not_paid_map)
    )

    summaries: list[CategorySummary] = []
    for cat_id in sorted(all_ids):
        cat = category_map.get(cat_id) or db.query(Category).filter(Category.id == cat_id).first()
        budget = budget_map.get(cat_id, ZERO)
        paid = paid_map.get(cat_id, ZERO)
        pending = pending_map.get(cat_id, ZERO)
        not_paid = not_paid_map.get(cat_id, ZERO)
        summaries.append(CategorySummary(
            category_id=cat_id,
            category_name=cat.name if cat else f"Category {cat_id}",
            category_color=cat.color if cat else "#6366f1",
            budget=budget,
            paid=paid,
            pending=pending,
            not_paid=not_paid,
            available=budget - paid - pending - not_paid,
        ))

    total_budget = sum((s.budget for s in summaries), ZERO)
    total_paid = sum((s.paid for s in summaries), ZERO)
    total_pending = sum((s.pending for s in summaries), ZERO)
    total_not_paid = sum((s.not_paid for s in summaries), ZERO)

    return PeriodSummary(
        period_id=period_id,
        period_name=period.name,
        total_budget=total_budget,
        total_paid=total_paid,
        total_pending=total_pending,
        total_not_paid=total_not_paid,
        total_available=total_budget - total_paid - total_pending - total_not_paid,
        categories=summaries,
    )
