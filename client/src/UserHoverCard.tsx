import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import * as api from './api'
import { STATUS_META } from './api'
import type { Profile } from './api'
import { CrownIcon } from './Icon'

const CARD_WIDTH = 280
const HOVER_DELAY = 300

export function UserHoverCard({
  userId,
  isOwner,
  className,
  style,
  children,
}: {
  userId: string
  isOwner?: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    api.getProfile(userId).then((p) => {
      if (!cancelled) setProfile(p)
    })
    return () => {
      cancelled = true
    }
  }, [open, userId])

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },
    [],
  )

  function handleEnter() {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      const rect = wrapRef.current?.getBoundingClientRect()
      if (!rect) return
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - CARD_WIDTH - 12)
      const top = Math.min(rect.bottom + 6, window.innerHeight - 280)
      setPos({ top: Math.max(8, top), left })
      setOpen(true)
    }, HOVER_DELAY)
  }

  function handleLeave() {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setOpen(false)
  }

  return (
    <span
      ref={wrapRef}
      className={className}
      style={style}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onContextMenu={handleLeave}
    >
      {children}
      {open &&
        profile &&
        pos &&
        createPortal(
          <div className="user-hover-card" style={{ top: pos.top, left: pos.left, width: CARD_WIDTH }}>
            <div
              className="user-hover-banner"
              style={
                profile.bannerImage
                  ? { backgroundImage: `url(${profile.bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: profile.bannerColor }
              }
            />
            <div className="user-hover-avatar-wrap">
              {profile.avatarImage ? (
                <img className="user-hover-avatar-img" src={profile.avatarImage} alt="" />
              ) : (
                <div className="user-hover-avatar-fallback" style={{ background: profile.color }}>
                  {profile.username.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="user-hover-status-dot" style={{ background: STATUS_META[profile.status].dotColor }} />
            </div>
            <div className="user-hover-body">
              <div className="user-hover-username-row">
                <span className="user-hover-username">{profile.username}</span>
                {isOwner && <CrownIcon size={13} className="user-hover-crown" />}
              </div>
              <div className="user-hover-status-label">{STATUS_META[profile.status].label}</div>
              {profile.activityText && (
                <div className="user-hover-activity">
                  <div className="user-hover-activity-label">JOGANDO</div>
                  <div className="user-hover-activity-text">{profile.activityText}</div>
                </div>
              )}
              {profile.bio && <div className="user-hover-bio">{profile.bio}</div>}
              {profile.interestTags.length > 0 && (
                <div className="user-hover-tags">
                  {profile.interestTags.map((tag) => (
                    <span className="user-hover-tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </span>
  )
}
