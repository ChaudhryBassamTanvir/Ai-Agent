# api/routes/auth.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db.database import get_admin_by_email
from services.auth import verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email:    str
    password: str

@router.post("/login")
def login(payload: LoginRequest):
    admin = get_admin_by_email(payload.email)

    if not admin:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(payload.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_token({
        "user_id":  admin["id"],
        "email":    admin["email"],
        "is_admin": True
    })

    return {
        "ok":       True,
        "token":    token,
        "name":     admin["name"],
        "email":    admin["email"],
        "is_admin": True
    }