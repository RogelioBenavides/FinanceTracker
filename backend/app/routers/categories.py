from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.category import Category
from app.models.transaction import TransactionItem
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryRead

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryRead])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Category).filter(Category.user_id == current_user.id).order_by(Category.name).all()


@router.get("/{category_id}", response_model=CategoryRead)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = db.query(Category).filter(Category.id == category_id, Category.user_id == current_user.id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.post("/", response_model=CategoryRead, status_code=201)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Category).filter(Category.user_id == current_user.id, Category.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
    category = Category(**payload.model_dump(), user_id=current_user.id)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = db.query(Category).filter(Category.id == category_id, Category.user_id == current_user.id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    update_data = payload.model_dump(exclude_unset=True)
    if "name" in update_data:
        conflict = (
            db.query(Category)
            .filter(Category.user_id == current_user.id, Category.name == update_data["name"], Category.id != category_id)
            .first()
        )
        if conflict:
            raise HTTPException(status_code=400, detail="Category name already exists")
    for field, value in update_data.items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = db.query(Category).filter(Category.id == category_id, Category.user_id == current_user.id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    in_use = db.query(TransactionItem).filter(TransactionItem.category_id == category_id).count()
    if in_use:
        raise HTTPException(
            status_code=409,
            detail=f"Category is used by {in_use} transaction{'s' if in_use != 1 else ''}. "
                   "Reassign or delete them first.",
        )
    db.delete(category)
    db.commit()
