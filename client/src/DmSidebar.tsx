import type { DmConversation } from './api'
import { UserHoverCard } from './UserHoverCard'
import { XIcon } from './Icon'

export function DmSidebar({
  conversations,
  activeConversationId,
  onSelect,
  onHide,
}: {
  conversations: DmConversation[]
  activeConversationId: string | null
  onSelect: (id: string) => void
  onHide: (id: string) => void
}) {
  return (
    <aside className="channel-list">
      <div className="server-title">Mensagens diretas</div>
      <div className="dm-sidebar-list">
        {conversations.length === 0 && <div className="friends-empty">Nenhuma conversa ainda.</div>}
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`dm-conversation-row-wrap ${c.id === activeConversationId ? 'active' : ''}`}
          >
            <button className="dm-conversation-item" onClick={() => onSelect(c.id)}>
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
            <button className="dm-conversation-close-btn" onClick={() => onHide(c.id)} title="Remover conversa">
              <XIcon size={14} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  )
}
