import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { UserIcon, AtSignIcon, MessageCircleIcon, PhoneIcon, StickyNoteIcon, Volume2Icon, MicOffIcon, CheckIcon } from './Icon'
import { getUserNote, setUserNote } from './userNotes'

const MENU_WIDTH = 230

export function UserContextMenu({
  x,
  y,
  userId,
  isSelf,
  canControlAudio,
  volume,
  muted,
  onClose,
  onProfile,
  onMention,
  onMessage,
  onStartCall,
  onVolumeChange,
  onToggleMute,
}: {
  x: number
  y: number
  userId: string
  isSelf: boolean
  canControlAudio: boolean
  volume: number
  muted: boolean
  onClose: () => void
  onProfile: () => void
  onMention: () => void
  onMessage: () => void
  onStartCall: () => void
  onVolumeChange: (v: number) => void
  onToggleMute: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [note, setNote] = useState(() => getUserNote(userId))

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  function changeNote(value: string) {
    setNote(value)
    setUserNote(userId, value)
  }

  const estimatedHeight = isSelf ? 50 : canControlAudio ? 430 : 230
  const left = Math.min(Math.max(8, x), window.innerWidth - MENU_WIDTH - 12)
  const top = Math.min(Math.max(8, y), window.innerHeight - estimatedHeight)

  return createPortal(
    <div
      ref={ref}
      className="user-context-menu"
      style={{ top, left, width: MENU_WIDTH }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        className="voice-device-menu-item"
        onClick={() => {
          onProfile()
          onClose()
        }}
      >
        <UserIcon size={15} /> Perfil
      </button>
      {!isSelf && (
        <>
          <button
            className="voice-device-menu-item"
            onClick={() => {
              onMention()
              onClose()
            }}
          >
            <AtSignIcon size={15} /> Mencionar
          </button>
          <button
            className="voice-device-menu-item"
            onClick={() => {
              onMessage()
              onClose()
            }}
          >
            <MessageCircleIcon size={15} /> Mensagem
          </button>
          <button
            className="voice-device-menu-item"
            onClick={() => {
              onStartCall()
              onClose()
            }}
          >
            <PhoneIcon size={15} /> Iniciar chamada
          </button>
          <div className="voice-device-menu-divider" />
          <div className="user-context-menu-note">
            <div className="voice-device-menu-label">
              <StickyNoteIcon size={14} /> Adicionar nota
            </div>
            <textarea
              value={note}
              onChange={(e) => changeNote(e.target.value)}
              placeholder="Clique para adicionar uma nota"
              rows={2}
            />
            <div className="user-context-menu-note-hint">Visível apenas para você</div>
          </div>
          {canControlAudio && (
            <>
              <div className="voice-device-menu-divider" />
              <div className="voice-device-menu-label">
                <Volume2Icon size={14} /> Volume do usuário — {volume}%
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="settings-slider"
              />
              <div className="voice-device-menu-divider" />
              <button className="voice-device-menu-item user-context-menu-mute" onClick={onToggleMute}>
                <span className="user-context-menu-checkbox">{muted && <CheckIcon size={12} />}</span>
                <MicOffIcon size={15} /> Silenciar
              </button>
            </>
          )}
        </>
      )}
    </div>,
    document.body,
  )
}
