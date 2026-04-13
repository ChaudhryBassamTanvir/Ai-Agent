// ─── Option A: Next.js API route  app/api/auth/login/route.ts ───────────────
// Drop this file at  app/api/auth/login/route.ts  if your frontend and backend
// live in the same Next.js project.

import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }

  // Persist session token in an httpOnly cookie
  const response = NextResponse.json({ ok: true })
  response.cookies.set("admin_token", data.token ?? "", {
    httpOnly: true,
    path:     "/",
    maxAge:   60 * 60 * 8,   // 8 hours
  })
  return response
}


// ─── Option B: FastAPI endpoint  api/routes/auth.py ──────────────────────────
// Use this if your backend is a standalone FastAPI app.
//
// from fastapi import APIRouter, HTTPException
// from pydantic import BaseModel
// from db.database import get_admin_by_email
//
// router = APIRouter(prefix="/auth", tags=["auth"])
//
// class LoginRequest(BaseModel):
//     email:    str
//     password: str
//
// @router.post("/login")
// def login(payload: LoginRequest):
//     admin = get_admin_by_email(payload.email)
//     if not admin:
//         raise HTTPException(status_code=401, detail="Invalid email or password.")
//
//     # Plain-text check (dev).  Replace with bcrypt.checkpw() in production.
//     if admin["password"] != payload.password:
//         raise HTTPException(status_code=401, detail="Invalid email or password.")
//
//     # Return a real JWT in production (e.g. python-jose / authlib)
//     return {"ok": True, "token": "dev-token", "name": admin["name"]}