import { useEffect, useRef } from 'react'
import type { DmConversation, DmMessage } from './api'
import type { Attachment } from './types'
import { Composer } from './Composer'
import { MessageAttachment } from './MessageAttachment'
import { PhoneIcon } from './Icon'

export function DmChatPanel({
  conversation,
  messages,
  draft,
  onDraftChange,
  onSend,
  onOpenProfile,
  onCall,
}: {
  conversation: DmConversation | null
  messages: DmMessage[]
  draft: string
  onDraftChange: (v: string) => void
  onSend: (attachment: Attachment | null) => void
  onOpenProfile: (id: string) => void
  onCall: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [conversation?.id, messages])

  if (!conversation) {
    return (
      <main className="chat-area">
        <div className="dm-empty-state">Selecione uma conversa ou mande mensagem pra um amigo.</div>
      </main>
    )
  }

  return (
    <main className="chat-area">
      <header className="chat-header dm-chat-header">
        <button className="dm-chat-header-identity" onClick={() => onOpenProfile(conversation.user.id)}>
          {conversation.user.avatarImage ? (
            <img className="friend-avatar-img" src={conversation.user.avatarImage} alt="" />
          ) : (
            <div className="friend-avatar-fallback" style={{ background: conversation.user.color }}>
              {conversation.user.username.slice(0, 1).toUpperCase()}
            </div>
          )}
          {conversation.user.username}
        </button>
        <button className="dm-call-btn" onClick={onCall} title="Iniciar chamada de voz">
          <PhoneIcon size={18} />
        </button>
      </header>
      <div className="messages" ref={scrollRef}>
        {messages.map((m) => (
          <div className={`message-row dm-message-row ${m.senderId !== conversation.user.id ? 'own' : ''}`} key={m.id}>
            <button className="avatar" style={{ background: m.senderColor }} onClick={() => onOpenProfile(m.senderId)}>
              {m.senderAvatar ? <img className="avatar-img" src={m.senderAvatar} alt="" /> : m.senderName.slice(0, 1).toUpperCase()}
            </button>
            <div className="message-body">
              <div className="message-meta">
                <span className="message-author" style={{ color: m.senderColor }}>
                  {m.senderName}
                </span>
                <span className="message-time">
                  {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {m.content && <div className="message-content">{m.content}</div>}
              {m.attachmentUrl && m.attachmentName && m.attachmentType && (
                <MessageAttachment url={m.attachmentUrl} name={m.attachmentName} type={m.attachmentType} />
              )}
            </div>
          </div>
        ))}
        {messages.length === 0 && <div className="empty-hint">Nenhuma mensagem ainda. Diga olá!</div>}
      </div>
      <Composer
        placeholder={`Conversar com ${conversation.user.username}`}
        draft={draft}
        onDraftChange={onDraftChange}
        onSend={onSend}
      />
    </main>
  )
}
