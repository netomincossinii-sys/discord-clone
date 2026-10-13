import { Router } from "express";
import { prisma } from "../db.js";
import { hashPassword, verifyPassword, signToken, COOKIE_NAME, requireAuth } from "../auth.js";
import { pickColor } from "../data.js";

export const authRouter = Router();

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const isProd = process.env.NODE_ENV === "production";

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

authRouter.post("/register", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: "invalid_username" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "weak_password" });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return res.status(409).json({ error: "username_taken" });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, passwordHash, color: pickColor() },
  });

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ id: user.id, username: user.username, color: user.color });
});

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "invalid_credentials" });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ id: user.id, username: user.username, color: user.color });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: isProd ? "none" : "lax", secure: isProd });
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, username: true, color: true },
  });
  if (!user) return res.status(401).json({ error: "not_authenticated" });
  res.json(user);
});
