import { getChannelWithAccess } from "./data.js";

// channelId -> Map<socketId, { id, username, color }>
const voiceRooms = new Map();

function room(channelId) {
  if (!voiceRooms.has(channelId)) voiceRooms.set(channelId, new Map());
  return voiceRooms.get(channelId);
}

function presenceList(channelId) {
  return Array.from(room(channelId).entries()).map(([peerId, user]) => ({ peerId, user }));
}

export function getChannelPresence(channelId) {
  return presenceList(channelId).map(({ user }) => user);
}

export function forceLeaveChannel(io, channelId) {
  for (const socket of io.sockets.sockets.values()) {
    if (socket.data.voiceChannelId === channelId) {
      socket.emit("voice:channel_deleted", { channelId });
    }
  }
}

export function forceMoveUser(io, userId, serverId, channelId) {
  for (const socket of io.sockets.sockets.values()) {
    if (socket.data.userId === userId && socket.data.voiceServerId === serverId && socket.data.voiceChannelId) {
      socket.emit("voice:force_move", { channelId });
      return true;
    }
  }
  return false;
}

function broadcastChannelPresence(io, serverId, channelId) {
  io.to(`server:${serverId}`).emit("voice:channel-update", {
    channelId,
    users: getChannelPresence(channelId),
  });
}

export function registerVoiceHandlers(io, socket, user) {
  socket.on("voice:join", async (channelId) => {
    if (!channelId) return;
    const channel = await getChannelWithAccess(channelId, user.id);
    if (!channel) return;

    const existingPeers = presenceList(channelId);
    const presenceUser = { ...user, micOn: true, deafened: false, sharingScreen: false };
    room(channelId).set(socket.id, presenceUser);
    socket.join(`voice:${channelId}`);
    socket.data.voiceChannelId = channelId;
    socket.data.voiceServerId = channel.serverId;

    socket.emit("voice:peers", { channelId, peers: existingPeers });
    socket.to(`voice:${channelId}`).emit("voice:peer-joined", {
      channelId,
      peerId: socket.id,
      user: presenceUser,
    });
    broadcastChannelPresence(io, channel.serverId, channelId);
  });

  socket.on("voice:signal", ({ to, data }) => {
    if (!to || !data) return;
    io.to(to).emit("voice:signal", { from: socket.id, data });
  });

  socket.on("voice:state", (state) => {
    const channelId = socket.data.voiceChannelId;
    if (!channelId) return;
    const current = room(channelId).get(socket.id);
    if (!current) return;
    const updated = {
      ...current,
      micOn: typeof state?.micOn === "boolean" ? state.micOn : current.micOn,
      deafened: typeof state?.deafened === "boolean" ? state.deafened : current.deafened,
      sharingScreen: typeof state?.sharingScreen === "boolean" ? state.sharingScreen : current.sharingScreen,
    };
    room(channelId).set(socket.id, updated);
    socket.to(`voice:${channelId}`).emit("voice:peer-state", { peerId: socket.id, state: updated });
    if (socket.data.voiceServerId) broadcastChannelPresence(io, socket.data.voiceServerId, channelId);
  });

  socket.on("voice:leave", () => leaveVoice(io, socket));
  socket.on("disconnect", () => leaveVoice(io, socket));
}

function leaveVoice(io, socket) {
  const channelId = socket.data.voiceChannelId;
  if (!channelId) return;
  const serverId = socket.data.voiceServerId;
  room(channelId).delete(socket.id);
  socket.leave(`voice:${channelId}`);
  socket.data.voiceChannelId = null;
  socket.data.voiceServerId = null;
  io.to(`voice:${channelId}`).emit("voice:peer-left", { channelId, peerId: socket.id });
  if (serverId) broadcastChannelPresence(io, serverId, channelId);
}
