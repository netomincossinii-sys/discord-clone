import { useEffect, useState } from 'react'
import * as api from './api'
import type { Profile } from './api'
import { STATUS_META } from './api'
import type { Section as SettingsSection } from './SettingsModal'
import { Modal } from './Modal'
import { RocketIcon, BellIcon, ShieldIcon, GearIcon } from './Icon'

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
}: {
  userId: string
  isOwnProfile: boolean
  onClose: () => void
  onEdit: () => void
  onOpenSettings?: (section: SettingsSection) => void
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const elapsed = useElapsed(profile?.activityStartedAt ?? null)

  useEffect(() => {
    let cancelled = false
    api.getProfile(userId).then((p) => {
      if (!cancelled) setProfile(p)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <Modal onClose={onClose} width={360}>
      {!profile ? (
        <div className="profile-loading">Carregando...</div>
      ) : (
        <div className="profile-card">
          <div className="profile-banner" style={{ background: profile.bannerColor }} />
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
              <button className="profile-edit-btn" onClick={onEdit}>
                Editar perfil
              </button>
            ) : (
              <button className="profile-edit-btn" onClick={onClose}>
                Fechar
              </button>
            )}
            {isOwnProfile && (
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
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
