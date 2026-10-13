import { prisma } from "./db.js";
import { emitToUser } from "./presence.js";
import { isValidAttachment, isBlockedEitherWay } from "./data.js";

function otherParticipant(conversation, userId) {
  return conversation.userAId === userId ? conversation.userBId : conversation.userAId;
}

export function registerDmHandlers(io, socket, dbUser) {
  socket.on("dm:send_message", async ({ conversationId, content, attachment }) => {
    const text = (content ?? "").trim().slice(0, 2000);
    if (!text && !attachment) return;
    if (!isValidAttachment(attachment)) return;
    const conversation = await prisma.dmConversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return;
    if (conversation.userAId !== dbUser.id && conversation.userBId !== dbUser.id) return;
    if (await isBlockedEitherWay(dbUser.id, otherParticipant(conversation, dbUser.id))) {
      socket.emit("dm:send_blocked", { conversationId });
      return;
    }

    const message = await prisma.dmMessage.create({
      data: {
        conversationId,
        senderId: dbUser.id,
        content: text,
        attachmentUrl: attachment?.url ?? null,
        attachmentName: attachment?.name ?? null,
        attachmentType: attachment?.type ?? null,
      },
    });

    const payload = {
      id: message.id,
      conversationId,
      senderId: dbUser.id,
      senderName: dbUser.username,
      senderColor: dbUser.color,
      senderAvatar: dbUser.avatarImage,
      content: message.content,
      attachmentUrl: message.attachmentUrl,
      attachmentName: message.attachmentName,
      attachmentType: message.attachmentType,
      ts: message.createdAt.getTime(),
    };
    emitToUser(io, dbUser.id, "dm:new_message", payload);
    emitToUser(io, otherParticipant(conversation, dbUser.id), "dm:new_message", payload);
  });

  socket.on("dm:call_invite", async ({ conversationId }) => {
    const conversation = await prisma.dmConversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return;
    if (conversation.userAId !== dbUser.id && conversation.userBId !== dbUser.id) return;
    emitToUser(io, otherParticipant(conversation, dbUser.id), "dm:incoming_call", {
      conversationId,
      fromUser: { id: dbUser.id, username: dbUser.username, color: dbUser.color, avatarImage: dbUser.avatarImage },
    });
  });

  socket.on("dm:call_response", async ({ conversationId, accepted }) => {
    const conversation = await prisma.dmConversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return;
    if (conversation.userAId !== dbUser.id && conversation.userBId !== dbUser.id) return;
    emitToUser(io, otherParticipant(conversation, dbUser.id), "dm:call_response", { conversationId, accepted });
  });

  socket.on("dm:call_cancel", async ({ conversationId }) => {
    const conversation = await prisma.dmConversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return;
    if (conversation.userAId !== dbUser.id && conversation.userBId !== dbUser.id) return;
    emitToUser(io, otherParticipant(conversation, dbUser.id), "dm:call_cancel", { conversationId });
  });
}
