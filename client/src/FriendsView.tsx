import { useState } from 'react'
import * as api from './api'
import type { FriendUser, PendingRequest } from './api'
import { MessageCircleIcon, CheckIcon, XIcon } from './Icon'
import { UserHoverCard } from './UserHoverCard'

function FriendRow({
  user,
  onOpenProfile,
  onMessage,
  actions,
}: {
  user: FriendUser
  onOpenProfile: (id: string) => void
  onMessage?: (id: string) => void
  actions?: React.ReactNode
}) {
  return (
    <div className="friend-row">
      <button className="friend-row-identity" onClick={() => onOpenProfile(user.id)}>
        {user.avatarImage ? (
          <img className="friend-avatar-img" src={user.avatarImage} alt="" />
        ) : (
          <div className="friend-avatar-fallback" style={{ background: user.color }}>
            {user.username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <UserHoverCard userId={user.id} className="friend-username">
            {user.username}
          </UserHoverCard>
          <div className="friend-status">{user.online ? 'Online' : 'Offline'}</div>
        </div>
      </button>
      <div className="friend-row-actions">
        {onMessage && (
          <button className="friend-action-btn" onClick={() => onMessage(user.id)} title="Enviar mensagem">
            <MessageCircleIcon size={16} />
          </button>
        )}
        {actions}
      </div>
    </div>
  )
}

export function FriendsView({
  friends,
  incoming,
  outgoing,
  onOpenProfile,
  onMessage,
  onAccept,
  onRemove,
  onSendRequest,
}: {
  friends: FriendUser[]
  incoming: PendingRequest[]
  outgoing: PendingRequest[]
  onOpenProfile: (id: string) => void
  onMessage: (id: string) => void
  onAccept: (id: string) => void
  onRemove: (id: string) => void
  onSendRequest: (req: PendingRequest) => void
}) {
  const [tab, setTab] = useState<'all' | 'pending' | 'add'>('all')
  const [usernameDraft, setUsernameDraft] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault()
    const username = usernameDraft.trim()
    if (!username) return
    try {
      const result = await api.sendFriendRequest(username)
      setFeedback({ type: 'ok', text: `Pedido enviado para ${username}.` })
      setUsernameDraft('')
      onSendRequest({ id: result.id, user: result.user })
    } catch (err) {
      const code = err instanceof Error ? err.message : 'unknown'
      const messages: Record<string, string> = {
        user_not_found: 'Não existe ninguém com esse usuário.',
        cannot_add_self: 'Você não pode adicionar a si mesmo.',
        already_exists: 'Já existe um pedido ou amizade com essa pessoa.',
      }
      setFeedback({ type: 'error', text: messages[code] ?? 'Não foi possível enviar o pedido.' })
    }
  }

  return (
    <div className="friends-view">
      <div className="friends-tabs">
        <button className={`friends-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          Todos — {friends.length}
        </button>
        <button className={`friends-tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
          Pendentes {incoming.length > 0 && <span className="friends-tab-badge">{incoming.length}</span>}
        </button>
        <button className="friends-tab-add" onClick={() => setTab('add')}>
          Adicionar amigo
        </button>
      </div>

      <div className="friends-list">
        {tab === 'all' &&
          (friends.length === 0 ? (
            <div className="friends-empty">Você ainda não tem amigos. Adicione alguém!</div>
          ) : (
            friends.map((f) => <FriendRow key={f.id} user={f} onOpenProfile={onOpenProfile} onMessage={onMessage} />)
          ))}

        {tab === 'pending' && (
          <>
            {incoming.length > 0 && (
              <>
                <div className="friends-section-label">PEDIDOS RECEBIDOS — {incoming.length}</div>
                {incoming.map((req) => (
                  <FriendRow
                    key={req.id}
                    user={req.user}
                    onOpenProfile={onOpenProfile}
                    actions={
                      <>
                        <button className="friend-action-btn accept" onClick={() => onAccept(req.id)} title="Aceitar">
                          <CheckIcon size={16} />
                        </button>
                        <button className="friend-action-btn decline" onClick={() => onRemove(req.id)} title="Recusar">
                          <XIcon size={16} />
                        </button>
                      </>
                    }
                  />
                ))}
              </>
            )}
            {outgoing.length > 0 && (
              <>
                <div className="friends-section-label">PEDIDOS ENVIADOS — {outgoing.length}</div>
                {outgoing.map((req) => (
                  <FriendRow
                    key={req.id}
                    user={req.user}
                    onOpenProfile={onOpenProfile}
                    actions={
                      <button className="friend-action-btn decline" onClick={() => onRemove(req.id)} title="Cancelar">
                        <XIcon size={16} />
                      </button>
                    }
                  />
                ))}
              </>
            )}
            {incoming.length === 0 && outgoing.length === 0 && (
              <div className="friends-empty">Nenhum pedido pendente.</div>
            )}
          </>
        )}

        {tab === 'add' && (
          <form className="friends-add-form" onSubmit={submitAdd}>
            <label className="edit-label">Adicionar amigo pelo usuário</label>
            <div className="friends-add-row">
              <input
                className="edit-input"
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(e.target.value)}
                placeholder="Usuário"
              />
              <button className="edit-save-btn" type="submit">
                Enviar pedido
              </button>
            </div>
            {feedback && (
              <div className={feedback.type === 'error' ? 'auth-error' : 'friends-feedback-ok'}>{feedback.text}</div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
