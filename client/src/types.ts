export type ChannelType = 'TEXT' | 'VOICE'

export interface Channel {
  id: string
  name: string
  type: ChannelType
  categoryId: string | null
  locked: boolean
  roleIds: string[]
}

export interface Category {
  id: string
  name: string
}

export interface ServerRole {
  id: string
  name: string
  color: string
  isAdmin: boolean
}

export interface ServerMember {
  id: string
  username: string
  color: string
  avatarImage: string | null
  online: boolean
  roleIds: string[]
}

export interface ServerInfo {
  id: string
  name: string
  icon: string
  iconImage: string | null
  bannerColor: string | null
  bannerImage: string | null
  ownerId: string | null
  channels: Channel[]
  categories: Category[]
  roles: ServerRole[]
  members: ServerMember[]
}

export interface ServerInvite {
  code: string
  createdAt: number
  expiresAt: number
  expired: boolean
}

export interface Attachment {
  url: string
  name: string
  type: string
}

export interface ChatMessage {
  id: string
  channelId: string
  authorId: string
  authorName: string
  authorColor: string
  authorAvatar: string | null
  content: string
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentType?: string | null
  ts: number
}

export interface PresenceUser {
  id: string
  username: string
  color: string
  avatarImage?: string | null
}
