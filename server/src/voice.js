// channelId -> Map<socketId, { id, username, color }>
const voiceRooms = new Map();

function room(channelId) {
  if (!voiceRooms.has(channelId)) voiceRooms.set(channelId, new Map());
  return voiceRooms.get(channelId);
}

function presenceList(channelId) {
  return Array.from(room(channelId).entries()).map(([peerId, user]) => ({ peerId, user }));
}

export function registerVoiceHandlers(io, socket, user) {
  socket.on("voice:join", (channelId) => {
    if (!channelId) return;
    const existingPeers = presenceList(channelId);
    room(channelId).set(socket.id, user);
    socket.join(`voice:${channelId}`);
    socket.data.voiceChannelId = channelId;

    socket.emit("voice:peers", { channelId, peers: existingPeers });
    socket.to(`voice:${channelId}`).emit("voice:peer-joined", {
      channelId,
      peerId: socket.id,
      user,
    });
  });

  socket.on("voice:signal", ({ to, data }) => {
    if (!to || !data) return;
    io.to(to).emit("voice:signal", { from: socket.id, data });
  });

  socket.on("voice:leave", () => leaveVoice(io, socket));
  socket.on("disconnect", () => leaveVoice(io, socket));
}

function leaveVoice(io, socket) {
  const channelId = socket.data.voiceChannelId;
  if (!channelId) return;
  room(channelId).delete(socket.id);
  socket.leave(`voice:${channelId}`);
  socket.data.voiceChannelId = null;
  io.to(`voice:${channelId}`).emit("voice:peer-left", { channelId, peerId: socket.id });
}
