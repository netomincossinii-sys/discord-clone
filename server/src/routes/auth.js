import { Router } from "express";
import crypto from "node:crypto";
import { prisma } from "../db.js";
import { hashPassword, verifyPassword, signToken, requireAuth, setAuthCookie, COOKIE_NAME } from "../auth.js";
import { pickColor } from "../data.js";
import { sendPasswordResetEmail, CLIENT_URL } from "../mailer.js";

export const authRouter = Router();

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isProd = process.env.NODE_ENV === "production";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESET_REQUEST_COOLDOWN_MS = 60 * 1000; // 1 minute per email
const lastResetRequestByEmail = new Map();

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

authRouter.post("/register", async (req, res) => {
  const { username, password, email } = req.body ?? {};
  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: "invalid_username" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "weak_password" });
  }
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(normalizedEmail)) {
    return res.status(400).json({ error: "invalid_email" });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return res.status(409).json({ error: "username_taken" });
  }
  const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingEmail) {
    return res.status(409).json({ error: "email_taken" });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, passwordHash, color: pickColor(), email: normalizedEmail },
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
    select: { id: true, username: true, color: true, email: true },
  });
  if (!user) return res.status(401).json({ error: "not_authenticated" });
  res.json(user);
});

authRouter.patch("/me/email", requireAuth, async (req, res) => {
  const { email } = req.body ?? {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(normalizedEmail)) {
    return res.status(400).json({ error: "invalid_email" });
  }
  const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingEmail && existingEmail.id !== req.userId) {
    return res.status(409).json({ error: "email_taken" });
  }
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { email: normalizedEmail },
    select: { id: true, username: true, color: true, email: true },
  });
  res.json(user);
});

authRouter.post("/password-reset/request", async (req, res) => {
  const { email } = req.body ?? {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(normalizedEmail)) {
    return res.status(400).json({ error: "invalid_email" });
  }

  const now = Date.now();
  const last = lastResetRequestByEmail.get(normalizedEmail);
  if (last && now - last < RESET_REQUEST_COOLDOWN_MS) {
    return res.json({ ok: true });
  }
  lastResetRequestByEmail.set(normalizedEmail, now);

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (user) {
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(now + RESET_TOKEN_TTL_MS),
      },
    });
    const resetUrl = `${CLIENT_URL}/?reset_token=${rawToken}`;
    sendPasswordResetEmail({ to: normalizedEmail, username: user.username, resetUrl }).catch((err) => {
      console.error("[auth] failed to send password reset email", err);
    });
  }

  res.json({ ok: true });
});

authRouter.post("/password-reset/confirm", async (req, res) => {
  const { token, newPassword } = req.body ?? {};
  if (typeof token !== "string" || !token) {
    return res.status(400).json({ error: "invalid_token" });
  }
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({ error: "weak_password" });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ error: "invalid_token" });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.updateMany({
      where: { userId: resetToken.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  res.json({ ok: true });
});
