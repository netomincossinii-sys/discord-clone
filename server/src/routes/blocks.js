import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";
import { emitToUser } from "../presence.js";

const USER_SUMMARY_SELECT = { id: true, username: true, color: true, avatarImage: true };

export function blocksRouter(io) {
  const router = Router();

  router.get("/blocks", requireAuth, async (req, res) => {
    const blocks = await prisma.block.findMany({
      where: { blockerId: req.userId },
      include: { blocked: { select: USER_SUMMARY_SELECT } },
    });
    res.json({ blocked: blocks.map((b) => b.blocked) });
  });

  router.post("/blocks/:userId", requireAuth, async (req, res) => {
    const targetId = req.params.userId;
    if (targetId === req.userId) return res.status(400).json({ error: "cannot_block_self" });
    const target = await prisma.user.findUnique({ where: { id: targetId }, select: USER_SUMMARY_SELECT });
    if (!target) return res.status(404).json({ error: "user_not_found" });

    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: req.userId, blockedId: targetId } },
      create: { blockerId: req.userId, blockedId: targetId },
      update: {},
    });

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.userId, addresseeId: targetId },
          { requesterId: targetId, addresseeId: req.userId },
        ],
      },
    });
    if (friendship) {
      await prisma.friendship.delete({ where: { id: friendship.id } });
      emitToUser(io, targetId, "friend:removed", { id: friendship.id });
    }

    res.json({ ok: true });
  });

  router.delete("/blocks/:userId", requireAuth, async (req, res) => {
    await prisma.block.deleteMany({ where: { blockerId: req.userId, blockedId: req.params.userId } });
    res.json({ ok: true });
  });

  return router;
}
