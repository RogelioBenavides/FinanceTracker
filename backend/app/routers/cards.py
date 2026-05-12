from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.card import Card
from app.schemas.card import CardCreate, CardUpdate, CardRead

router = APIRouter(prefix="/cards", tags=["cards"])


@router.get("/", response_model=list[CardRead])
def list_cards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Card).filter(Card.user_id == current_user.id).order_by(Card.name).all()


@router.get("/{card_id}", response_model=CardRead)
def get_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.post("/", response_model=CardRead, status_code=201)
def create_card(
    payload: CardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Card).filter(Card.user_id == current_user.id, Card.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Card name already exists")
    card = Card(**payload.model_dump(), user_id=current_user.id)
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.put("/{card_id}", response_model=CardRead)
def update_card(
    card_id: int,
    payload: CardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    update_data = payload.model_dump(exclude_unset=True)
    if "name" in update_data:
        conflict = (
            db.query(Card)
            .filter(Card.user_id == current_user.id, Card.name == update_data["name"], Card.id != card_id)
            .first()
        )
        if conflict:
            raise HTTPException(status_code=400, detail="Card name already exists")
    for field, value in update_data.items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return card


@router.delete("/{card_id}", status_code=204)
def delete_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()
