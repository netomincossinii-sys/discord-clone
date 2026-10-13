import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";

export const profileRouter = Router();

export const BANNER_COLORS = [
  "#f37108", // orange
  "#57F287", // green
  "#FEE75C", // yellow
  "#EB459E", // pink
  "#ED4245", // red
  "#3498DB", // blue
  "#1ABC9C", // turquoise
];

const MAX_BIO = 190;
const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 24;
const MAX_ACTIVITY_LENGTH = 60;
const MAX_AVATAR_BASE64_LENGTH = 600_000; // ~450KB decoded, generous for a small square avatar

const USER_STATUSES = ["ONLINE", "IDLE", "DND", "INVISIBLE"];

const PROFILE_SELECT = {
  id: true,
  username: true,
  color: true,
  bio: true,
  avatarImage: true,
  bannerColor: true,
  activityText: true,
  activityStartedAt: true,
  interestTags: true,
  status: true,
};

profileRouter.get("/profile/:userId", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.userId },
    select: PROFILE_SELECT,
  });
  if (!user) return res.status(404).json({ error: "not_found" });
  res.json(user);
});

profileRouter.patch("/profile/me", requireAuth, async (req, res) => {
  const body = req.body ?? {};
  const data = {};

  if (body.bio !== undefined) {
    if (typeof body.bio !== "string" || body.bio.length > MAX_BIO) {
      return res.status(400).json({ error: "invalid_bio" });
    }
    data.bio = body.bio.trim() || null;
  }

  if (body.bannerColor !== undefined) {
    if (!BANNER_COLORS.includes(body.bannerColor)) {
      return res.status(400).json({ error: "invalid_banner_color" });
    }
    data.bannerColor = body.bannerColor;
  }

  if (body.interestTags !== undefined) {
    if (
      !Array.isArray(body.interestTags) ||
      body.interestTags.length > MAX_TAGS ||
      body.interestTags.some(
        (tag) => typeof tag !== "string" || tag.length === 0 || tag.length > MAX_TAG_LENGTH,
      )
    ) {
      return res.status(400).json({ error: "invalid_interest_tags" });
    }
    data.interestTags = [...new Set(body.interestTags.map((t) => t.trim()))].slice(0, MAX_TAGS);
  }

  if (body.activityText !== undefined) {
    if (typeof body.activityText !== "string" || body.activityText.length > MAX_ACTIVITY_LENGTH) {
      return res.status(400).json({ error: "invalid_activity_text" });
    }
    const trimmed = body.activityText.trim();
    const current = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { activityText: true },
    });
    if (!trimmed) {
      data.activityText = null;
      data.activityStartedAt = null;
    } else if (trimmed !== current?.activityText) {
      data.activityText = trimmed;
      data.activityStartedAt = new Date();
    }
  }

  if (body.status !== undefined) {
    if (!USER_STATUSES.includes(body.status)) {
      return res.status(400).json({ error: "invalid_status" });
    }
    data.status = body.status;
  }

  if (body.avatarImage !== undefined) {
    if (body.avatarImage === null) {
      data.avatarImage = null;
    } else if (
      typeof body.avatarImage !== "string" ||
      !body.avatarImage.startsWith("data:image/") ||
      body.avatarImage.length > MAX_AVATAR_BASE64_LENGTH
    ) {
      return res.status(400).json({ error: "invalid_avatar_image" });
    } else {
      data.avatarImage = body.avatarImage;
    }
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data,
    select: PROFILE_SELECT,
  });
  res.json(user);
});
