import type { DmConversation } from './api'
import { UserHoverCard } from './UserHoverCard'

export function DmSidebar({
  conversations,
  activeConversationId,
  onSelect,
}: {
  conversations: DmConversation[]
  activeConversationId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <aside className="channel-list">
      <div className="server-title">Mensagens diretas</div>
      <div className="dm-sidebar-list">
        {conversations.length === 0 && <div className="friends-empty">Nenhuma conversa ainda.</div>}
        {conversations.map((c) => (
          <button
            key={c.id}
            className={`dm-conversation-item ${c.id === activeConversationId ? 'active' : ''}`}
            onClick={() => onSelect(c.id)}
          >
            {c.user.avatarImage ? (
              <img className="friend-avatar-img" src={c.user.avatarImage} alt="" />
            ) : (
              <div className="friend-avatar-fallback" style={{ background: c.user.color }}>
                {c.user.username.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="dm-conversation-text">
              <UserHoverCard userId={c.user.id} className="dm-conversation-name">
                {c.user.username}
              </UserHoverCard>
              {c.lastMessage && <div className="dm-conversation-preview">{c.lastMessage.content}</div>}
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}
