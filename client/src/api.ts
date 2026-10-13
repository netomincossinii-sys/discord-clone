export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4001'

export interface AuthUser {
  id: string
  username: string
  color: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `request_failed_${res.status}`)
  }
  return res.json()
}

export function fetchTurnCredentials() {
  return request<{ iceServers: RTCIceServer[] }>('/api/turn-credentials')
}

export function register(username: string, password: string) {
  return request<AuthUser>('/api/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function login(username: string, password: string) {
  return request<AuthUser>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function logout() {
  return request<{ ok: true }>('/api/logout', { method: 'POST' })
}

export function me() {
  return request<AuthUser>('/api/me')
}

export function getState() {
  return request<{ servers: import('./types').ServerInfo[] }>('/api/state')
}

export function createServer(name: string, icon?: string) {
  return request<{ server: import('./types').ServerInfo }>('/api/servers', {
    method: 'POST',
    body: JSON.stringify({ name, icon }),
  })
}

export function joinServerByInvite(code: string) {
  return request<{ server: import('./types').ServerInfo }>('/api/servers/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

export function getServerInvite(serverId: string) {
  return request<{ invite: import('./types').ServerInvite }>(`/api/servers/${serverId}/invite`)
}

export function regenerateServerInvite(serverId: string) {
  return request<{ invite: import('./types').ServerInvite }>(`/api/servers/${serverId}/invite/regenerate`, {
    method: 'POST',
  })
}

export function leaveServer(serverId: string) {
  return request<{ ok: true }>(`/api/servers/${serverId}/leave`, { method: 'POST' })
}

export function deleteServer(serverId: string) {
  return request<{ ok: true }>(`/api/servers/${serverId}`, { method: 'DELETE' })
}

export interface Profile {
  id: string
  username: string
  color: string
  bio: string | null
  avatarImage: string | null
  bannerColor: string
  activityText: string | null
  activityStartedAt: string | null
  interestTags: string[]
  status: UserStatus
}

export type UserStatus = 'ONLINE' | 'IDLE' | 'DND' | 'INVISIBLE'

export const BANNER_COLORS = ['#f37108', '#57F287', '#FEE75C', '#EB459E', '#ED4245', '#3498DB', '#1ABC9C']

export const STATUS_META: Record<UserStatus, { label: string; dotColor: string }> = {
  ONLINE: { label: 'Disponível', dotColor: 'var(--color-online)' },
  IDLE: { label: 'Ausente', dotColor: 'var(--color-idle)' },
  DND: { label: 'Não perturbe', dotColor: 'var(--color-dnd)' },
  INVISIBLE: { label: 'Invisível', dotColor: 'var(--color-offline)' },
}

export function getProfile(userId: string) {
  return request<Profile>(`/api/profile/${userId}`)
}

export interface ProfileUpdate {
  bio?: string
  bannerColor?: string
  interestTags?: string[]
  activityText?: string
  avatarImage?: string | null
  status?: UserStatus
}

export function updateProfile(update: ProfileUpdate) {
  return request<Profile>('/api/profile/me', {
    method: 'PATCH',
    body: JSON.stringify(update),
  })
}

export interface FriendUser {
  id: string
  username: string
  color: string
  avatarImage: string | null
  status: UserStatus
  online: boolean
}

export interface PendingRequest {
  id: string
  user: FriendUser
}

export function getFriends() {
  return request<{ friends: FriendUser[] }>('/api/friends')
}

export function getPendingRequests() {
  return request<{ incoming: PendingRequest[]; outgoing: PendingRequest[] }>('/api/friends/pending')
}

export function sendFriendRequest(username: string) {
  return request<{ id: string; user: FriendUser }>('/api/friends/requests', {
    method: 'POST',
    body: JSON.stringify({ username }),
  })
}

export function acceptFriendRequest(id: string) {
  return request<{ ok: true }>(`/api/friends/requests/${id}/accept`, { method: 'POST' })
}

export function removeFriendRequest(id: string) {
  return request<{ ok: true }>(`/api/friends/requests/${id}`, { method: 'DELETE' })
}

export interface DmConversation {
  id: string
  user: FriendUser
  lastMessage: { content: string; createdAt: number } | null
  lastActivity: number
}

export interface DmMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderColor: string
  senderAvatar: string | null
  content: string
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentType?: string | null
  ts: number
}

export function getDmConversations() {
  return request<{ conversations: DmConversation[] }>('/api/dms')
}

export function startDm(userId: string) {
  return request<{ id: string; user: FriendUser }>(`/api/dms/with/${userId}`, { method: 'POST' })
}

export function getDmMessages(conversationId: string) {
  return request<{ messages: DmMessage[] }>(`/api/dms/${conversationId}/messages`)
}
