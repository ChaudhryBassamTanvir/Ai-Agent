# services/auth.py

import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from db.database import get_admin_by_email, SessionLocal, Admin

SECRET_KEY  = os.getenv("JWT_SECRET", "ds-tech-secret-key-2024")
ALGORITHM   = "HS256"
EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        # fallback for plain text passwords (dev/seed)
        return plain == hashed

def create_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(days=EXPIRE_DAYS)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

def login_user(email: str, password: str):
    admin = get_admin_by_email(email)
    if not admin:
        return None, None, "User not found"
    if not verify_password(password, admin["password"]):
        return None, None, "Incorrect password"
    token = create_token({
        "user_id":  admin["id"],
        "email":    admin["email"],
        "is_admin": True
    })
    return token, admin, None