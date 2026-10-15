import { Router } from "express";
import crypto from "node:crypto";
import { prisma } from "../db.js";
import { hashPassword, signToken, setAuthCookie } from "../auth.js";
import { pickColor } from "../data.js";
import { CLIENT_URL } from "../mailer.js";

export const googleAuthRouter = Router();

const isProd = process.env.NODE_ENV === "production";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:4001/api/auth/google/callback";
const STATE_COOKIE = "google_oauth_state";
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

function stateCookieOptions() {
  return { httpOnly: true, sameSite: "lax", secure: isProd, maxAge: 10 * 60 * 1000 };
}

async function generateUsername(email) {
  const base = (email.split("@")[0] || "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 16);
  const seed = base.length >= 3 ? base : (base + "user").slice(0, 16);
  let candidate = seed.length >= 3 ? seed : seed.padEnd(3, "0");
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${seed}${suffix}`.slice(0, 20);
  }
  return candidate;
}

async function findOrCreateGoogleUser(profile) {
  const byGoogleId = await prisma.user.findUnique({ where: { googleId: profile.sub } });
  if (byGoogleId) return byGoogleId;

  const normalizedEmail = profile.email.trim().toLowerCase();
  const byEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (byEmail) {
    return prisma.user.update({ where: { id: byEmail.id }, data: { googleId: profile.sub } });
  }

  const username = await generateUsername(normalizedEmail);
  if (!USERNAME_RE.test(username)) throw new Error("could_not_generate_username");
  const passwordHash = await hashPassword(crypto.randomBytes(24).toString("hex"));
  return prisma.user.create({
    data: { username, email: normalizedEmail, googleId: profile.sub, passwordHash, color: pickColor() },
  });
}

googleAuthRouter.get("/auth/google", (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${CLIENT_URL}/?auth_error=google_unavailable`);
  }
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie(STATE_COOKIE, state, stateCookieOptions());
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

googleAuthRouter.get("/auth/google/callback", async (req, res) => {
  const { code, state, error } = req.query;
  const cookieState = req.cookies?.[STATE_COOKIE];
  res.clearCookie(STATE_COOKIE, stateCookieOptions());

  if (error || !code || !state || state !== cookieState) {
    return res.redirect(`${CLIENT_URL}/?auth_error=google_failed`);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: String(code),
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) throw new Error("token_exchange_failed");

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.sub || !profile.email) throw new Error("profile_fetch_failed");

    const user = await findOrCreateGoogleUser(profile);
    const token = signToken(user);
    setAuthCookie(res, token);
    res.redirect(`${CLIENT_URL}/`);
  } catch (err) {
    console.error("[auth] google oauth failed", err);
    res.redirect(`${CLIENT_URL}/?auth_error=google_failed`);
  }
});
