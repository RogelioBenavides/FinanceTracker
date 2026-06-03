from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction, TransactionItem
from app.models.period import Period
from app.models.category import Category
from app.models.card import Card
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionRead, TransactionItemRead, TransactionBulkUpdate

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _owned_period(period_id: int, user_id: int, db: Session) -> Period:
    period = db.query(Period).filter(Period.id == period_id, Period.user_id == user_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    return period


def _load(tx: Transaction) -> TransactionRead:
    return TransactionRead(
        id=tx.id,
        period_id=tx.period_id,
        card_id=tx.card_id,
        card_name=tx.card.name if tx.card else None,
        date=tx.date,
        description=tx.description,
        total_amount=tx.total_amount,
        status=tx.status,
        items=[
            TransactionItemRead(
                id=item.id,
                category_id=item.category_id,
                category_name=item.category.name if item.category else None,
                amount=item.amount,
            )
            for item in tx.items
        ],
    )


def _q(db: Session):
    return (
        db.query(Transaction)
        .options(selectinload(Transaction.items).selectinload(TransactionItem.category))
        .options(selectinload(Transaction.card))
    )


@router.get("/", response_model=list[TransactionRead])
def list_transactions(
    period_id: int | None = None,
    category_id: int | None = None,
    card_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = _q(db).join(Period, Transaction.period_id == Period.id).filter(Period.user_id == current_user.id)
    if period_id is not None:
        _owned_period(period_id, current_user.id, db)
        q = q.filter(Transaction.period_id == period_id)
    if card_id is not None:
        q = q.filter(Transaction.card_id == card_id)
    if status is not None:
        q = q.filter(Transaction.status == status)
    txs = q.order_by(Transaction.date.desc()).all()

    if category_id is not None:
        txs = [tx for tx in txs if any(i.category_id == category_id for i in tx.items)]

    return [_load(tx) for tx in txs]


@router.patch("/bulk", response_model=list[TransactionRead])
def bulk_update_transactions(
    payload: TransactionBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.transaction_ids:
        return []
    if payload.set_card and payload.card_id is not None:
        if not db.query(Card).filter(Card.id == payload.card_id, Card.user_id == current_user.id).first():
            raise HTTPException(status_code=404, detail="Card not found")

    txs = (
        _q(db)
        .join(Period, Transaction.period_id == Period.id)
        .filter(Transaction.id.in_(payload.transaction_ids), Period.user_id == current_user.id)
        .all()
    )

    for tx in txs:
        if payload.status is not None:
            tx.status = payload.status
        if payload.set_card:
            tx.card_id = payload.card_id

    db.commit()
    updated_ids = [tx.id for tx in txs]
    updated = _q(db).filter(Transaction.id.in_(updated_ids)).all()
    return [_load(tx) for tx in updated]


@router.get("/{transaction_id}", response_model=TransactionRead)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = (
        _q(db)
        .join(Period, Transaction.period_id == Period.id)
        .filter(Transaction.id == transaction_id, Period.user_id == current_user.id)
        .first()
    )
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return _load(tx)


@router.post("/", response_model=TransactionRead, status_code=201)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_period(payload.period_id, current_user.id, db)
    if payload.card_id and not db.query(Card).filter(Card.id == payload.card_id, Card.user_id == current_user.id).first():
        raise HTTPException(status_code=404, detail="Card not found")
    for item in payload.items:
        if not db.query(Category).filter(Category.id == item.category_id, Category.user_id == current_user.id).first():
            raise HTTPException(status_code=404, detail=f"Category {item.category_id} not found")

    total = sum(i.amount for i in payload.items)
    tx = Transaction(
        period_id=payload.period_id,
        card_id=payload.card_id,
        date=payload.date,
        description=payload.description,
        total_amount=total,
        status=payload.status,
    )
    db.add(tx)
    db.flush()
    for item in payload.items:
        db.add(TransactionItem(transaction_id=tx.id, category_id=item.category_id, amount=item.amount))
    db.commit()
    return get_transaction(tx.id, db, current_user)


@router.put("/{transaction_id}", response_model=TransactionRead)
def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = (
        db.query(Transaction)
        .join(Period, Transaction.period_id == Period.id)
        .filter(Transaction.id == transaction_id, Period.user_id == current_user.id)
        .first()
    )
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if payload.card_id and not db.query(Card).filter(Card.id == payload.card_id, Card.user_id == current_user.id).first():
        raise HTTPException(status_code=404, detail="Card not found")

    update_data = payload.model_dump(exclude_unset=True)
    items_data = update_data.pop("items", None)

    for field, value in update_data.items():
        setattr(tx, field, value)

    if items_data is not None:
        for old in list(tx.items):
            db.delete(old)
        db.flush()
        for item in items_data:
            db.add(TransactionItem(transaction_id=tx.id, category_id=item["category_id"], amount=item["amount"]))
        tx.total_amount = sum(Decimal(str(i["amount"])) for i in items_data)

    db.commit()
    return get_transaction(tx.id, db, current_user)


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = (
        db.query(Transaction)
        .join(Period, Transaction.period_id == Period.id)
        .filter(Transaction.id == transaction_id, Period.user_id == current_user.id)
        .first()
    )
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()
