const onlineSockets = new Map(); // userId -> Set<socketId>

export function addSocket(userId, socketId) {
  if (!onlineSockets.has(userId)) onlineSockets.set(userId, new Set());
  onlineSockets.get(userId).add(socketId);
}

export function removeSocket(userId, socketId) {
  const set = onlineSockets.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) onlineSockets.delete(userId);
}

export function isOnline(userId) {
  return onlineSockets.has(userId);
}

export function getSocketIds(userId) {
  return Array.from(onlineSockets.get(userId) ?? []);
}

export function emitToUser(io, userId, event, payload) {
  for (const socketId of getSocketIds(userId)) {
    io.to(socketId).emit(event, payload);
  }
}
