import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";
import { generateInviteCode, inviteExpiresAt, isInviteExpired, isServerManager } from "../data.js";
import { emitToUser } from "../presence.js";
import { forceMoveUser } from "../voice.js";

const MAX_ICON_BASE64_LENGTH = 600_000; // ~450KB decoded, generous for a small square icon
const MAX_BANNER_BASE64_LENGTH = 1_500_000; // ~1.1MB decoded, generous for a wide banner

function isValidImage(value, maxLength) {
  return typeof value === "string" && value.startsWith("data:image/") && value.length <= maxLength;
}

function serializeInvite(server) {
  if (!server.inviteCode || !server.inviteCodeCreatedAt) return null;
  return {
    code: server.inviteCode,
    createdAt: server.inviteCodeCreatedAt.getTime(),
    expiresAt: inviteExpiresAt(server.inviteCodeCreatedAt).getTime(),
    expired: isInviteExpired(server),
  };
}

async function requireManager(req, res, next) {
  const allowed = await isServerManager(req.params.id, req.userId);
  if (!allowed) return res.status(403).json({ error: "not_a_manager" });
  next();
}

export function serversRouter(io) {
  const router = Router();

  function notifyServerUpdated(serverId) {
    io.to(`server:${serverId}`).emit("server:updated", { serverId });
  }

  router.post("/servers", requireAuth, async (req, res) => {
    const { name, icon, iconImage } = req.body ?? {};
    if (typeof name !== "string" || !name.trim() || name.trim().length > 60) {
      return res.status(400).json({ error: "invalid_name" });
    }
    if (iconImage !== undefined && iconImage !== null && !isValidImage(iconImage, MAX_ICON_BASE64_LENGTH)) {
      return res.status(400).json({ error: "invalid_icon_image" });
    }
    const cleanIcon = typeof icon === "string" && icon.trim() ? icon.trim().slice(0, 4) : name.trim().slice(0, 2).toUpperCase();

    const server = await prisma.server.create({
      data: {
        name: name.trim(),
        icon: cleanIcon,
        iconImage: iconImage || null,
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

  router.post("/servers/join", requireAuth, async (req, res) => {
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

    notifyServerUpdated(server.id);
    res.json({ server });
  });

  router.get("/servers/:id/invite", requireAuth, async (req, res) => {
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

  router.post("/servers/:id/invite/regenerate", requireAuth, async (req, res) => {
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

  router.post("/servers/:id/leave", requireAuth, async (req, res) => {
    const server = await prisma.server.findUnique({ where: { id: req.params.id } });
    if (!server) return res.status(404).json({ error: "not_found" });
    if (server.ownerId === req.userId) return res.status(400).json({ error: "owner_cannot_leave" });

    await prisma.membership.deleteMany({ where: { userId: req.userId, serverId: req.params.id } });
    res.json({ ok: true });
  });

  router.delete("/servers/:id", requireAuth, async (req, res) => {
    const server = await prisma.server.findUnique({ where: { id: req.params.id } });
    if (!server) return res.status(404).json({ error: "not_found" });
    if (server.ownerId !== req.userId) return res.status(403).json({ error: "not_owner" });

    await prisma.server.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  });

  router.patch("/servers/:id", requireAuth, requireManager, async (req, res) => {
    const { name, icon, iconImage, bannerColor, bannerImage } = req.body ?? {};
    const data = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 60) {
        return res.status(400).json({ error: "invalid_name" });
      }
      data.name = name.trim();
    }
    if (icon !== undefined) data.icon = typeof icon === "string" ? icon.trim().slice(0, 4) : null;
    if (iconImage !== undefined) {
      if (iconImage !== null && !isValidImage(iconImage, MAX_ICON_BASE64_LENGTH)) {
        return res.status(400).json({ error: "invalid_icon_image" });
      }
      data.iconImage = iconImage;
    }
    if (bannerColor !== undefined) data.bannerColor = bannerColor;
    if (bannerImage !== undefined) {
      if (bannerImage !== null && !isValidImage(bannerImage, MAX_BANNER_BASE64_LENGTH)) {
        return res.status(400).json({ error: "invalid_banner_image" });
      }
      data.bannerImage = bannerImage;
    }

    const server = await prisma.server.update({ where: { id: req.params.id }, data });
    notifyServerUpdated(server.id);
    res.json({ server });
  });

  router.post("/servers/:id/channels", requireAuth, requireManager, async (req, res) => {
    const { name, type, categoryId } = req.body ?? {};
    if (typeof name !== "string" || !name.trim() || name.trim().length > 60) {
      return res.status(400).json({ error: "invalid_name" });
    }
    if (type !== "TEXT" && type !== "VOICE") {
      return res.status(400).json({ error: "invalid_type" });
    }
    if (categoryId) {
      const category = await prisma.category.findFirst({ where: { id: categoryId, serverId: req.params.id } });
      if (!category) return res.status(400).json({ error: "invalid_category" });
    }

    const channel = await prisma.channel.create({
      data: { name: name.trim(), type, serverId: req.params.id, categoryId: categoryId || null },
    });
    notifyServerUpdated(req.params.id);
    res.status(201).json({ channel });
  });

  router.patch("/servers/:id/channels/:channelId", requireAuth, requireManager, async (req, res) => {
    const channel = await prisma.channel.findFirst({ where: { id: req.params.channelId, serverId: req.params.id } });
    if (!channel) return res.status(404).json({ error: "not_found" });

    const { name, categoryId, roleIds } = req.body ?? {};
    const data = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 60) {
        return res.status(400).json({ error: "invalid_name" });
      }
      data.name = name.trim();
    }
    if (categoryId !== undefined) data.categoryId = categoryId || null;

    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.channel.update({ where: { id: channel.id }, data });
      }
      if (Array.isArray(roleIds)) {
        await tx.channelRoleAccess.deleteMany({ where: { channelId: channel.id } });
        if (roleIds.length > 0) {
          await tx.channelRoleAccess.createMany({
            data: roleIds.map((roleId) => ({ channelId: channel.id, roleId })),
          });
        }
      }
    });

    notifyServerUpdated(req.params.id);
    res.json({ ok: true });
  });

  router.post("/servers/:id/categories", requireAuth, requireManager, async (req, res) => {
    const { name } = req.body ?? {};
    if (typeof name !== "string" || !name.trim() || name.trim().length > 60) {
      return res.status(400).json({ error: "invalid_name" });
    }
    const category = await prisma.category.create({ data: { name: name.trim(), serverId: req.params.id } });
    notifyServerUpdated(req.params.id);
    res.status(201).json({ category });
  });

  router.post("/servers/:id/roles", requireAuth, requireManager, async (req, res) => {
    const { name, color, isAdmin } = req.body ?? {};
    if (typeof name !== "string" || !name.trim() || name.trim().length > 40) {
      return res.status(400).json({ error: "invalid_name" });
    }
    if (typeof color !== "string" || !color.trim()) {
      return res.status(400).json({ error: "invalid_color" });
    }
    const role = await prisma.role.create({
      data: { name: name.trim(), color, isAdmin: !!isAdmin, serverId: req.params.id },
    });
    notifyServerUpdated(req.params.id);
    res.status(201).json({ role });
  });

  router.patch("/servers/:id/roles/:roleId", requireAuth, requireManager, async (req, res) => {
    const role = await prisma.role.findFirst({ where: { id: req.params.roleId, serverId: req.params.id } });
    if (!role) return res.status(404).json({ error: "not_found" });

    const { name, color, isAdmin, memberIds } = req.body ?? {};
    const data = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 40) {
        return res.status(400).json({ error: "invalid_name" });
      }
      data.name = name.trim();
    }
    if (color !== undefined) data.color = color;
    if (isAdmin !== undefined) data.isAdmin = !!isAdmin;

    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.role.update({ where: { id: role.id }, data });
      }
      if (Array.isArray(memberIds)) {
        const memberships = await tx.membership.findMany({
          where: { serverId: req.params.id, userId: { in: memberIds } },
          select: { id: true },
        });
        await tx.membershipRole.deleteMany({ where: { roleId: role.id } });
        if (memberships.length > 0) {
          await tx.membershipRole.createMany({
            data: memberships.map((m) => ({ membershipId: m.id, roleId: role.id })),
          });
        }
      }
    });

    notifyServerUpdated(req.params.id);
    res.json({ ok: true });
  });

  router.delete("/servers/:id/roles/:roleId", requireAuth, requireManager, async (req, res) => {
    const role = await prisma.role.findFirst({ where: { id: req.params.roleId, serverId: req.params.id } });
    if (!role) return res.status(404).json({ error: "not_found" });

    await prisma.role.delete({ where: { id: role.id } });
    notifyServerUpdated(req.params.id);
    res.json({ ok: true });
  });

  router.patch("/servers/:id/members/:userId/roles", requireAuth, requireManager, async (req, res) => {
    const membership = await prisma.membership.findUnique({
      where: { userId_serverId: { userId: req.params.userId, serverId: req.params.id } },
    });
    if (!membership) return res.status(404).json({ error: "not_found" });

    const { roleIds } = req.body ?? {};
    if (!Array.isArray(roleIds)) return res.status(400).json({ error: "invalid_roleIds" });

    const validRoles = await prisma.role.findMany({
      where: { serverId: req.params.id, id: { in: roleIds } },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.membershipRole.deleteMany({ where: { membershipId: membership.id } }),
      ...(validRoles.length > 0
        ? [
            prisma.membershipRole.createMany({
              data: validRoles.map((r) => ({ membershipId: membership.id, roleId: r.id })),
            }),
          ]
        : []),
    ]);

    notifyServerUpdated(req.params.id);
    res.json({ ok: true });
  });

  router.post("/servers/:id/members/:userId/move-voice", requireAuth, requireManager, async (req, res) => {
    const { channelId } = req.body ?? {};
    const channel = await prisma.channel.findFirst({ where: { id: channelId, serverId: req.params.id, type: "VOICE" } });
    if (!channel) return res.status(400).json({ error: "invalid_channel" });

    const moved = forceMoveUser(io, req.params.userId, req.params.id, channel.id);
    if (!moved) return res.status(400).json({ error: "user_not_in_voice" });
    res.json({ ok: true });
  });

  router.delete("/servers/:id/members/:userId", requireAuth, requireManager, async (req, res) => {
    const server = await prisma.server.findUnique({ where: { id: req.params.id } });
    if (!server) return res.status(404).json({ error: "not_found" });
    if (server.ownerId === req.params.userId) return res.status(400).json({ error: "cannot_kick_owner" });

    const { count } = await prisma.membership.deleteMany({
      where: { userId: req.params.userId, serverId: req.params.id },
    });
    if (count === 0) return res.status(404).json({ error: "not_found" });

    emitToUser(io, req.params.userId, "server:kicked", { serverId: req.params.id, serverName: server.name });
    notifyServerUpdated(req.params.id);
    res.json({ ok: true });
  });

  return router;
}
