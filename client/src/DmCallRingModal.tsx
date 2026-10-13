import { Modal } from './Modal'
import type { PresenceUser } from './types'
import { PhoneIcon, PhoneOffIcon } from './Icon'

export function DmCallRingModal({
  fromUser,
  onAccept,
  onDecline,
}: {
  fromUser: PresenceUser
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <Modal onClose={onDecline} width={320}>
      <div className="dm-ring-modal">
        {fromUser.avatarImage ? (
          <img className="dm-ring-avatar-img" src={fromUser.avatarImage} alt="" />
        ) : (
          <div className="dm-ring-avatar-fallback" style={{ background: fromUser.color }}>
            {fromUser.username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="dm-ring-title">{fromUser.username}</div>
        <div className="dm-ring-subtitle">Chamada de voz recebida...</div>
        <div className="dm-ring-actions">
          <button className="voice-btn decline" onClick={onDecline} title="Recusar">
            <PhoneOffIcon size={20} />
          </button>
          <button className="voice-btn accept" onClick={onAccept} title="Aceitar">
            <PhoneIcon size={20} />
          </button>
        </div>
      </div>
    </Modal>
  )
}
