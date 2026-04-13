# api/routes/auth.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db.database import get_admin_by_email

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(payload: LoginRequest):
    admin = get_admin_by_email(payload.email)

    if not admin or admin["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # ⚠️  Replace with a real JWT in production
    return {"ok": True, "name": admin["name"], "token": "dev-token"}