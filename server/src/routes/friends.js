import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";
import { isOnline, emitToUser } from "../presence.js";
import { isBlockedEitherWay } from "../data.js";

const USER_SUMMARY_SELECT = { id: true, username: true, color: true, avatarImage: true, status: true };

function withOnline(user) {
  return { ...user, online: isOnline(user.id) };
}

export function friendsRouter(io) {
  const router = Router();

  router.get("/friends", requireAuth, async (req, res) => {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: req.userId }, { addresseeId: req.userId }],
      },
      include: {
        requester: { select: USER_SUMMARY_SELECT },
        addressee: { select: USER_SUMMARY_SELECT },
      },
    });
    const friends = friendships.map((f) =>
      withOnline(f.requesterId === req.userId ? f.addressee : f.requester),
    );
    res.json({ friends });
  });

  router.get("/friends/pending", requireAuth, async (req, res) => {
    const pending = await prisma.friendship.findMany({
      where: { status: "PENDING", OR: [{ requesterId: req.userId }, { addresseeId: req.userId }] },
      include: {
        requester: { select: USER_SUMMARY_SELECT },
        addressee: { select: USER_SUMMARY_SELECT },
      },
    });
    const incoming = pending
      .filter((f) => f.addresseeId === req.userId)
      .map((f) => ({ id: f.id, user: withOnline(f.requester) }));
    const outgoing = pending
      .filter((f) => f.requesterId === req.userId)
      .map((f) => ({ id: f.id, user: withOnline(f.addressee) }));
    res.json({ incoming, outgoing });
  });

  router.post("/friends/requests", requireAuth, async (req, res) => {
    const { username } = req.body ?? {};
    if (typeof username !== "string" || !username.trim()) {
      return res.status(400).json({ error: "invalid_username" });
    }
    const target = await prisma.user.findUnique({
      where: { username: username.trim() },
      select: USER_SUMMARY_SELECT,
    });
    if (!target) return res.status(404).json({ error: "user_not_found" });
    if (target.id === req.userId) return res.status(400).json({ error: "cannot_add_self" });
    if (await isBlockedEitherWay(req.userId, target.id)) return res.status(403).json({ error: "blocked" });

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.userId, addresseeId: target.id },
          { requesterId: target.id, addresseeId: req.userId },
        ],
      },
    });
    if (existing) return res.status(409).json({ error: "already_exists" });

    const friendship = await prisma.friendship.create({
      data: { requesterId: req.userId, addresseeId: target.id },
      include: { requester: { select: USER_SUMMARY_SELECT } },
    });

    emitToUser(io, target.id, "friend:request_received", {
      id: friendship.id,
      user: withOnline(friendship.requester),
    });

    res.json({ id: friendship.id, user: withOnline(target) });
  });

  router.post("/friends/requests/:id/accept", requireAuth, async (req, res) => {
    const friendship = await prisma.friendship.findUnique({ where: { id: req.params.id } });
    if (!friendship || friendship.addresseeId !== req.userId || friendship.status !== "PENDING") {
      return res.status(404).json({ error: "not_found" });
    }
    const updated = await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
      include: { addressee: { select: USER_SUMMARY_SELECT } },
    });

    emitToUser(io, friendship.requesterId, "friend:request_accepted", {
      id: friendship.id,
      user: withOnline(updated.addressee),
    });

    res.json({ ok: true });
  });

  router.delete("/friends/requests/:id", requireAuth, async (req, res) => {
    const friendship = await prisma.friendship.findUnique({ where: { id: req.params.id } });
    if (!friendship || (friendship.requesterId !== req.userId && friendship.addresseeId !== req.userId)) {
      return res.status(404).json({ error: "not_found" });
    }
    await prisma.friendship.delete({ where: { id: friendship.id } });

    const otherId = friendship.requesterId === req.userId ? friendship.addresseeId : friendship.requesterId;
    emitToUser(io, otherId, "friend:removed", { id: friendship.id });

    res.json({ ok: true });
  });

  return router;
}
