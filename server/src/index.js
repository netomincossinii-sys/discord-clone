import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { parseCookie } from "cookie";
import { Server } from "socket.io";
import { prisma } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { profileRouter } from "./routes/profile.js";
import { friendsRouter } from "./routes/friends.js";
import { dmsRouter } from "./routes/dms.js";
import { serversRouter } from "./routes/servers.js";
import { turnRouter } from "./routes/turn.js";
import { requireAuth, verifyToken, COOKIE_NAME } from "./auth.js";
import { getServersForUser, getChannelWithAccess, getHistory, addMessage, isValidAttachment } from "./data.js";
import { registerVoiceHandlers, getChannelPresence } from "./voice.js";
import { registerDmHandlers } from "./dmSocket.js";
import { addSocket, removeSocket, isOnline, emitToUser } from "./presence.js";

const PORT = process.env.PORT || 4001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api", authRouter);
app.use("/api", profileRouter);
app.use("/api", dmsRouter);
app.use("/api", serversRouter);
app.use("/api", turnRouter);

app.get("/api/state", requireAuth, async (req, res) => {
  const servers = await getServersForUser(req.userId);
  res.json({ servers });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, credentials: true },
  maxHttpBufferSize: 12 * 1024 * 1024,
});

app.use("/api", friendsRouter(io));

io.use((socket, next) => {
  const header = socket.handshake.headers.cookie;
  const token = header ? parseCookie(header)[COOKIE_NAME] : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return next(new Error("unauthorized"));
  socket.data.userId = payload.sub;
  socket.data.username = payload.username;
  next();
});

async function joinServerRooms(socket, servers) {
  servers.forEach((s) => socket.join(`server:${s.id}`));
  const voiceChannels = servers.flatMap((s) => s.channels.filter((c) => c.type === "VOICE"));
  socket.emit(
    "voice:snapshot",
    voiceChannels.map((c) => ({ channelId: c.id, users: getChannelPresence(c.id) }))
  );
}

async function notifyFriendsPresence(userId, online) {
  const friendships = await prisma.friendship.findMany({
    where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] },
  });
  for (const f of friendships) {
    const friendId = f.requesterId === userId ? f.addresseeId : f.requesterId;
    emitToUser(io, friendId, "presence:update", { userId, online });
  }
}

io.on("connection", async (socket) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: socket.data.userId },
    select: { id: true, username: true, color: true, avatarImage: true },
  });
  if (!dbUser) {
    socket.disconnect(true);
    return;
  }

  const wasOnline = isOnline(dbUser.id);
  addSocket(dbUser.id, socket.id);
  if (!wasOnline) notifyFriendsPresence(dbUser.id, true);

  registerVoiceHandlers(io, socket, dbUser);
  registerDmHandlers(io, socket, dbUser);

  await joinServerRooms(socket, await getServersForUser(dbUser.id));
  socket.on("rooms:sync", async () => {
    await joinServerRooms(socket, await getServersForUser(dbUser.id));
  });

  socket.on("join_channel", async (channelId) => {
    const channel = await getChannelWithAccess(channelId, socket.data.userId);
    if (!channel) return;
    for (const r of socket.rooms) {
      if (r !== socket.id && !r.startsWith("voice:")) socket.leave(r);
    }
    socket.join(channelId);
    const messages = await getHistory(channelId);
    socket.emit("history", { channelId, messages });
  });

  socket.on("send_message", async ({ channelId, content, attachment }) => {
    const text = (content ?? "").trim().slice(0, 2000);
    if (!text && !attachment) return;
    if (!isValidAttachment(attachment)) return;
    const channel = await getChannelWithAccess(channelId, socket.data.userId);
    if (!channel || channel.type !== "TEXT") return;
    const message = await addMessage(channelId, socket.data.userId, text, attachment);
    io.to(channelId).emit("new_message", message);
  });

  socket.on("disconnect", () => {
    removeSocket(dbUser.id, socket.id);
    if (!isOnline(dbUser.id)) notifyFriendsPresence(dbUser.id, false);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[callfy-server] listening on http://localhost:${PORT}`);
});
