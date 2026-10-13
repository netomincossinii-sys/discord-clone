import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";
import { generateInviteCode, inviteExpiresAt, isInviteExpired } from "../data.js";

export const serversRouter = Router();

function serializeInvite(server) {
  if (!server.inviteCode || !server.inviteCodeCreatedAt) return null;
  return {
    code: server.inviteCode,
    createdAt: server.inviteCodeCreatedAt.getTime(),
    expiresAt: inviteExpiresAt(server.inviteCodeCreatedAt).getTime(),
    expired: isInviteExpired(server),
  };
}

serversRouter.post("/servers", requireAuth, async (req, res) => {
  const { name, icon } = req.body ?? {};
  if (typeof name !== "string" || !name.trim() || name.trim().length > 60) {
    return res.status(400).json({ error: "invalid_name" });
  }
  const cleanIcon = typeof icon === "string" && icon.trim() ? icon.trim().slice(0, 4) : name.trim().slice(0, 2).toUpperCase();

  const server = await prisma.server.create({
    data: {
      name: name.trim(),
      icon: cleanIcon,
      ownerId: req.userId,
      memberships: { create: { userId: req.userId } },
      channels: {
        create: [
          { name: "geral", type: "TEXT" },
          { name: "Geral", type: "VOICE" },
        ],
      },
    },
    include: { channels: { orderBy: { name: "asc" } } },
  });

  res.status(201).json({ server });
});

serversRouter.post("/servers/join", requireAuth, async (req, res) => {
  const { code } = req.body ?? {};
  if (typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ error: "invalid_code" });
  }

  const match = code.trim().match(/[A-Za-z0-9_-]{6,}$/);
  const cleanCode = match ? match[0] : code.trim();

  const server = await prisma.server.findUnique({
    where: { inviteCode: cleanCode },
    include: { channels: { orderBy: { name: "asc" } } },
  });
  if (!server) return res.status(404).json({ error: "invite_not_found" });
  if (isInviteExpired(server)) return res.status(410).json({ error: "invite_expired" });

  await prisma.membership.upsert({
    where: { userId_serverId: { userId: req.userId, serverId: server.id } },
    create: { userId: req.userId, serverId: server.id },
    update: {},
  });

  res.json({ server });
});

serversRouter.get("/servers/:id/invite", requireAuth, async (req, res) => {
  const membership = await prisma.membership.findUnique({
    where: { userId_serverId: { userId: req.userId, serverId: req.params.id } },
  });
  if (!membership) return res.status(403).json({ error: "not_a_member" });

  let server = await prisma.server.findUnique({ where: { id: req.params.id } });
  if (!server) return res.status(404).json({ error: "not_found" });

  if (!server.inviteCode || isInviteExpired(server)) {
    server = await prisma.server.update({
      where: { id: server.id },
      data: { inviteCode: generateInviteCode(), inviteCodeCreatedAt: new Date() },
    });
  }

  res.json({ invite: serializeInvite(server) });
});

serversRouter.post("/servers/:id/invite/regenerate", requireAuth, async (req, res) => {
  const membership = await prisma.membership.findUnique({
    where: { userId_serverId: { userId: req.userId, serverId: req.params.id } },
  });
  if (!membership) return res.status(403).json({ error: "not_a_member" });

  const server = await prisma.server.update({
    where: { id: req.params.id },
    data: { inviteCode: generateInviteCode(), inviteCodeCreatedAt: new Date() },
  });

  res.json({ invite: serializeInvite(server) });
});

serversRouter.post("/servers/:id/leave", requireAuth, async (req, res) => {
  const server = await prisma.server.findUnique({ where: { id: req.params.id } });
  if (!server) return res.status(404).json({ error: "not_found" });
  if (server.ownerId === req.userId) return res.status(400).json({ error: "owner_cannot_leave" });

  await prisma.membership.deleteMany({ where: { userId: req.userId, serverId: req.params.id } });
  res.json({ ok: true });
});

serversRouter.delete("/servers/:id", requireAuth, async (req, res) => {
  const server = await prisma.server.findUnique({ where: { id: req.params.id } });
  if (!server) return res.status(404).json({ error: "not_found" });
  if (server.ownerId !== req.userId) return res.status(403).json({ error: "not_owner" });

  await prisma.server.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
