import { randomBytes } from "node:crypto";
import { prisma } from "./db.js";

const COLORS = ["#f23f42", "#5865f2", "#57f287", "#fee75c", "#eb459e", "#ed4245"];

export function pickColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export const INVITE_LIFETIME_DAYS = 30;

export function generateInviteCode() {
  return randomBytes(6).toString("base64url");
}

export function inviteExpiresAt(createdAt) {
  return new Date(createdAt.getTime() + INVITE_LIFETIME_DAYS * 24 * 60 * 60 * 1000);
}

export function isInviteExpired(server) {
  if (!server.inviteCode || !server.inviteCodeCreatedAt) return true;
  return inviteExpiresAt(server.inviteCodeCreatedAt).getTime() < Date.now();
}

export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

export function isValidAttachment(attachment) {
  if (attachment == null) return true;
  if (typeof attachment !== "object") return false;
  const { url, name, type } = attachment;
  if (typeof url !== "string" || !url.startsWith("data:")) return false;
  if (typeof name !== "string" || !name.trim() || name.length > 200) return false;
  if (typeof type !== "string" || type.length > 100) return false;
  const base64 = url.slice(url.indexOf(",") + 1);
  const approxBytes = (base64.length * 3) / 4;
  return approxBytes <= MAX_ATTACHMENT_BYTES;
}

export async function getServersForUser(userId) {
  const servers = await prisma.server.findMany({
    where: { memberships: { some: { userId } } },
    include: {
      channels: { orderBy: { name: "asc" }, include: { roleAccess: true } },
      categories: { orderBy: { name: "asc" } },
      roles: { orderBy: { name: "asc" } },
      memberships: {
        include: {
          user: { select: { id: true, username: true, color: true, avatarImage: true } },
          roles: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return servers.map((server) => {
    const isOwner = server.ownerId === userId;
    const myMembership = server.memberships.find((m) => m.userId === userId);
    const myRoleIds = new Set((myMembership?.roles ?? []).map((mr) => mr.roleId));
    const isManager = isOwner || server.roles.some((r) => r.isAdmin && myRoleIds.has(r.id));
    const channels = server.channels
      .filter((c) => isManager || c.roleAccess.length === 0 || c.roleAccess.some((ra) => myRoleIds.has(ra.roleId)))
      .map((c) => ({
        ...c,
        locked: c.roleAccess.length > 0,
        roleIds: c.roleAccess.map((ra) => ra.roleId),
        roleAccess: undefined,
      }));
    return { ...server, channels };
  });
}

export async function isBlockedEitherWay(userAId, userBId) {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userAId, blockedId: userBId },
        { blockerId: userBId, blockedId: userAId },
      ],
    },
  });
  return !!block;
}

export async function isServerManager(serverId, userId) {
  const server = await prisma.server.findUnique({ where: { id: serverId }, select: { ownerId: true } });
  if (!server) return false;
  if (server.ownerId === userId) return true;
  const membership = await prisma.membership.findUnique({
    where: { userId_serverId: { userId, serverId } },
    include: { roles: { include: { role: true } } },
  });
  return !!membership?.roles.some((mr) => mr.role.isAdmin);
}

export async function getChannelWithAccess(channelId, userId) {
  const channel = await prisma.channel.findFirst({
    where: { id: channelId, server: { memberships: { some: { userId } } } },
    include: { server: true, roleAccess: true },
  });
  if (!channel) return null;
  if (channel.roleAccess.length === 0) return channel;
  if (channel.server.ownerId === userId) return channel;
  const hasAccess = await prisma.membershipRole.findFirst({
    where: {
      roleId: { in: channel.roleAccess.map((ra) => ra.roleId) },
      membership: { userId, serverId: channel.serverId },
    },
  });
  return hasAccess ? channel : null;
}

export async function getHistory(channelId, limit = 100) {
  const messages = await prisma.message.findMany({
    where: { channelId },
    include: { author: { select: { id: true, username: true, color: true, avatarImage: true } } },
    orderBy: { createdAt: "asc" },
    take: -limit,
  });
  return messages.map(formatMessage);
}

export async function addMessage(channelId, authorId, content, attachment) {
  const message = await prisma.message.create({
    data: {
      channelId,
      authorId,
      content,
      attachmentUrl: attachment?.url ?? null,
      attachmentName: attachment?.name ?? null,
      attachmentType: attachment?.type ?? null,
    },
    include: { author: { select: { id: true, username: true, color: true, avatarImage: true } } },
  });
  return formatMessage(message);
}

function formatMessage(message) {
  return {
    id: message.id,
    channelId: message.channelId,
    authorId: message.authorId,
    authorName: message.author.username,
    authorColor: message.author.color,
    authorAvatar: message.author.avatarImage,
    content: message.content,
    attachmentUrl: message.attachmentUrl,
    attachmentName: message.attachmentName,
    attachmentType: message.attachmentType,
    ts: message.createdAt.getTime(),
  };
}
