import { useEffect, useState } from 'react'
import * as api from './api'
import type { Profile } from './api'
import { STATUS_META } from './api'
import type { Section as SettingsSection } from './SettingsModal'
import { Modal } from './Modal'
import { useConfirm } from './ConfirmDialog'
import {
  RocketIcon,
  BellIcon,
  ShieldIcon,
  GearIcon,
  MessageCircleIcon,
  UserPlusIcon,
  UserXIcon,
  CheckIcon,
  BanIcon,
  SwapIcon,
} from './Icon'

export type FriendRelationship = 'self' | 'friends' | 'incoming' | 'outgoing' | 'none'

export interface ProfileServerContext {
  roles: { id: string; name: string; color: string; isAdmin: boolean }[]
  voiceChannels: { id: string; name: string }[]
  targetRoleIds: string[]
  isTargetOwner: boolean
  isTargetInVoice: boolean
}

function useElapsed(startedAt: string | null) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    if (!startedAt) {
      setElapsed('')
      return
    }
    const start = new Date(startedAt).getTime()
    function tick() {
      const totalSeconds = Math.max(0, Math.floor((Date.now() - start) / 1000))
      const h = Math.floor(totalSeconds / 3600)
      const m = Math.floor((totalSeconds % 3600) / 60)
      const s = totalSeconds % 60
      setElapsed(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])
  return elapsed
}

export function ProfileCard({
  userId,
  isOwnProfile,
  onClose,
  onEdit,
  onOpenSettings,
  relationship = 'none',
  incomingRequestId,
  isBlocked = false,
  isManager = false,
  serverContext = null,
  onMessage,
  onAddFriend,
  onAcceptFriendRequest,
  onBlock,
  onUnblock,
  onSaveMemberRoles,
  onMoveMemberVoice,
  onKickMember,
}: {
  userId: string
  isOwnProfile: boolean
  onClose: () => void
  onEdit: () => void
  onOpenSettings?: (section: SettingsSection) => void
  relationship?: FriendRelationship
  incomingRequestId?: string
  isBlocked?: boolean
  isManager?: boolean
  serverContext?: ProfileServerContext | null
  onMessage?: () => void
  onAddFriend?: (username: string) => void
  onAcceptFriendRequest?: (requestId: string) => void
  onBlock?: (userId: string) => void
  onUnblock?: (userId: string) => void
  onSaveMemberRoles?: (userId: string, roleIds: string[]) => void
  onMoveMemberVoice?: (userId: string, channelId: string) => void
  onKickMember?: (userId: string) => void
}) {
  const { confirm, ConfirmDialog } = useConfirm()
  const [profile, setProfile] = useState<Profile | null>(null)
  const elapsed = useElapsed(profile?.activityStartedAt ?? null)
  const [showRoleEditor, setShowRoleEditor] = useState(false)
  const [pendingRoleIds, setPendingRoleIds] = useState<string[]>([])
  const [showVoicePicker, setShowVoicePicker] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.getProfile(userId).then((p) => {
      if (!cancelled) setProfile(p)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    setShowRoleEditor(false)
    setShowVoicePicker(false)
    setPendingRoleIds(serverContext?.targetRoleIds ?? [])
  }, [userId, serverContext])

  const canManageTarget = isManager && !!serverContext && !serverContext.isTargetOwner

  return (
    <Modal onClose={onClose} width={360}>
      {!profile ? (
        <div className="profile-loading">
          <div className="loading-spinner" />
          Carregando...
        </div>
      ) : (
        <div className="profile-card">
          <div
            className="profile-banner"
            style={
              profile.bannerImage
                ? { backgroundImage: `url(${profile.bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: profile.bannerColor }
            }
          />
          <div className="profile-avatar-wrap">
            {profile.avatarImage ? (
              <img className="profile-avatar-img" src={profile.avatarImage} alt="" />
            ) : (
              <div className="profile-avatar-fallback" style={{ background: profile.color }}>
                {profile.username.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="profile-avatar-status-dot" style={{ background: STATUS_META[profile.status].dotColor }} />
          </div>
          <div className="profile-body">
            <div className="profile-username">{profile.username}</div>
            <div className="profile-status-label">{STATUS_META[profile.status].label}</div>
            {profile.bio && <div className="profile-bio">{profile.bio}</div>}
            {profile.activityText && (
              <div className="profile-activity">
                <div className="profile-activity-label">JOGANDO</div>
                <div className="profile-activity-text">{profile.activityText}</div>
                {elapsed && <div className="profile-activity-elapsed">{elapsed}</div>}
              </div>
            )}
            {profile.interestTags.length > 0 && (
              <div className="profile-tags">
                <div className="profile-activity-label">INTERESSES</div>
                <div className="profile-tags-list">
                  {profile.interestTags.map((tag) => (
                    <span className="profile-tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {isOwnProfile ? (
              <>
                <button className="profile-edit-btn" onClick={onEdit}>
                  Editar perfil
                </button>
                <div className="profile-action-row">
                  <button className="profile-action-btn" onClick={() => onOpenSettings?.('boost')}>
                    <RocketIcon size={18} />
                    <span>Boost</span>
                  </button>
                  <button className="profile-action-btn" onClick={() => onOpenSettings?.('notif')}>
                    <BellIcon size={18} />
                    <span>Notificações</span>
                  </button>
                  <button className="profile-action-btn" onClick={() => onOpenSettings?.('privacidade')}>
                    <ShieldIcon size={18} />
                    <span>Privacidade</span>
                  </button>
                  <button className="profile-action-btn" onClick={() => onOpenSettings?.('conta')}>
                    <GearIcon size={18} />
                    <span>Configurações</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <button className="profile-edit-btn" onClick={onMessage}>
                  <MessageCircleIcon size={16} /> Enviar mensagem
                </button>

                {!isBlocked && relationship === 'none' && (
                  <button className="profile-secondary-btn" onClick={() => onAddFriend?.(profile.username)}>
                    <UserPlusIcon size={16} /> Adicionar amigo
                  </button>
                )}
                {!isBlocked && relationship === 'incoming' && incomingRequestId && (
                  <button
                    className="profile-secondary-btn"
                    onClick={() => onAcceptFriendRequest?.(incomingRequestId)}
                  >
                    <CheckIcon size={16} /> Aceitar pedido de amizade
                  </button>
                )}
                {!isBlocked && relationship === 'outgoing' && (
                  <div className="profile-hint-text">Pedido de amizade enviado</div>
                )}

                <button
                  className="profile-danger-btn"
                  onClick={async () => {
                    if (isBlocked) {
                      onUnblock?.(userId)
                      return
                    }
                    const ok = await confirm({
                      title: 'Bloquear usuário',
                      message: `Bloquear ${profile.username}? Essa pessoa não vai conseguir te mandar mensagem nem pedido de amizade, e as mensagens dela ficam escondidas nos servidores em comum.`,
                      confirmLabel: 'Bloquear',
                      danger: true,
                    })
                    if (ok) onBlock?.(userId)
                  }}
                >
                  <BanIcon size={16} /> {isBlocked ? 'Desbloquear' : 'Bloquear'}
                </button>

                {canManageTarget && (
                  <>
                    <div className="profile-divider" />

                    <button className="profile-secondary-btn" onClick={() => setShowRoleEditor((v) => !v)}>
                      <ShieldIcon size={16} /> Gerenciar cargos
                    </button>
                    {showRoleEditor && (
                      <div className="profile-inline-panel">
                        {serverContext!.roles.length === 0 ? (
                          <div className="profile-hint-text">Esse servidor ainda não tem cargos.</div>
                        ) : (
                          serverContext!.roles.map((role) => (
                            <label className="profile-role-check" key={role.id}>
                              <input
                                type="checkbox"
                                checked={pendingRoleIds.includes(role.id)}
                                onChange={(e) =>
                                  setPendingRoleIds((prev) =>
                                    e.target.checked ? [...prev, role.id] : prev.filter((id) => id !== role.id),
                                  )
                                }
                              />
                              <span className="profile-role-dot" style={{ background: role.color }} />
                              {role.name}
                            </label>
                          ))
                        )}
                        <button
                          className="profile-inline-save-btn"
                          onClick={() => {
                            onSaveMemberRoles?.(userId, pendingRoleIds)
                            setShowRoleEditor(false)
                          }}
                        >
                          Salvar
                        </button>
                      </div>
                    )}

                    {serverContext!.isTargetInVoice && (
                      <>
                        <button className="profile-secondary-btn" onClick={() => setShowVoicePicker((v) => !v)}>
                          <SwapIcon size={16} /> Mover de canal de voz
                        </button>
                        {showVoicePicker && (
                          <div className="profile-inline-panel">
                            {serverContext!.voiceChannels.map((channel) => (
                              <button
                                key={channel.id}
                                className="profile-voice-channel-option"
                                onClick={() => {
                                  onMoveMemberVoice?.(userId, channel.id)
                                  setShowVoicePicker(false)
                                }}
                              >
                                🔊 {channel.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <button
                      className="profile-danger-btn"
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Expulsar do servidor',
                          message: `Expulsar ${profile.username} do servidor?`,
                          confirmLabel: 'Expulsar',
                          danger: true,
                        })
                        if (ok) onKickMember?.(userId)
                      }}
                    >
                      <UserXIcon size={16} /> Expulsar do servidor
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {ConfirmDialog}
    </Modal>
  )
}
