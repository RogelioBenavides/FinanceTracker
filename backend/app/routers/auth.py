from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.schemas.user import UserRead
from app.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleTokenPayload(BaseModel):
    token: str


class AuthResponse(BaseModel):
    access_token: str
    user: UserRead


@router.post("/google", response_model=AuthResponse)
def google_auth(payload: GoogleTokenPayload, db: Session = Depends(get_db)):
    try:
        info = id_token.verify_oauth2_token(
            payload.token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    google_id = info["sub"]
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = User(
            google_id=google_id,
            email=info["email"],
            name=info.get("name", info["email"]),
            picture=info.get("picture"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    token = jwt.encode({"sub": str(user.id), "exp": expire}, settings.JWT_SECRET, algorithm="HS256")
    return AuthResponse(access_token=token, user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user
