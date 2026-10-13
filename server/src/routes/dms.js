import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";
import { isOnline } from "../presence.js";

const USER_SUMMARY_SELECT = { id: true, username: true, color: true, avatarImage: true, status: true };

function withOnline(user) {
  return { ...user, online: isOnline(user.id) };
}

async function getOrCreateConversation(userId, otherUserId) {
  const [userAId, userBId] = [userId, otherUserId].sort();
  return prisma.dmConversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId },
    update: {},
  });
}

export function otherParticipantId(conversation, userId) {
  return conversation.userAId === userId ? conversation.userBId : conversation.userAId;
}

export const dmsRouter = Router();

dmsRouter.get("/dms", requireAuth, async (req, res) => {
  const conversations = await prisma.dmConversation.findMany({
    where: { OR: [{ userAId: req.userId }, { userBId: req.userId }] },
    include: {
      userA: { select: USER_SUMMARY_SELECT },
      userB: { select: USER_SUMMARY_SELECT },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const result = conversations
    .map((c) => {
      const other = c.userAId === req.userId ? c.userB : c.userA;
      const last = c.messages[0];
      return {
        id: c.id,
        user: withOnline(other),
        lastMessage: last ? { content: last.content, createdAt: last.createdAt.getTime() } : null,
        lastActivity: (last?.createdAt ?? c.createdAt).getTime(),
      };
    })
    .sort((a, b) => b.lastActivity - a.lastActivity);

  res.json({ conversations: result });
});

dmsRouter.post("/dms/with/:userId", requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({
    where: { id: req.params.userId },
    select: USER_SUMMARY_SELECT,
  });
  if (!target) return res.status(404).json({ error: "user_not_found" });
  if (target.id === req.userId) return res.status(400).json({ error: "cannot_dm_self" });

  const conversation = await getOrCreateConversation(req.userId, target.id);
  res.json({ id: conversation.id, user: withOnline(target) });
});

dmsRouter.get("/dms/:conversationId/messages", requireAuth, async (req, res) => {
  const conversation = await prisma.dmConversation.findUnique({ where: { id: req.params.conversationId } });
  if (!conversation || (conversation.userAId !== req.userId && conversation.userBId !== req.userId)) {
    return res.status(404).json({ error: "not_found" });
  }
  const messages = await prisma.dmMessage.findMany({
    where: { conversationId: conversation.id },
    include: { sender: { select: USER_SUMMARY_SELECT } },
    orderBy: { createdAt: "asc" },
    take: -100,
  });
  res.json({
    messages: messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: m.sender.username,
      senderColor: m.sender.color,
      senderAvatar: m.sender.avatarImage,
      content: m.content,
      attachmentUrl: m.attachmentUrl,
      attachmentName: m.attachmentName,
      attachmentType: m.attachmentType,
      ts: m.createdAt.getTime(),
    })),
  });
});
