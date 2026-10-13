import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import * as api from './api'
import type { ServerInfo, ServerInvite } from './types'
import { XIcon } from './Icon'

export function ServerInviteModal({ server, onClose }: { server: ServerInfo; onClose: () => void }) {
  const [invite, setInvite] = useState<ServerInvite | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.getServerInvite(server.id).then((d) => setInvite(d.invite)).finally(() => setLoading(false))
  }, [server.id])

  async function handleRegenerate() {
    if (regenerating) return
    setRegenerating(true)
    try {
      const d = await api.regenerateServerInvite(server.id)
      setInvite(d.invite)
      setCopied(false)
    } finally {
      setRegenerating(false)
    }
  }

  function handleCopy() {
    if (!invite) return
    navigator.clipboard.writeText(inviteUrl(invite.code)).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function inviteUrl(code: string) {
    return `${window.location.origin}/?invite=${code}`
  }

  const daysLeft = invite ? Math.max(0, Math.ceil((invite.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))) : 0

  return (
    <Modal onClose={onClose} width={420}>
      <div className="add-server-modal">
        <div className="modal-header-row">
          <h2>Convidar amigos para {server.name}</h2>
          <button className="modal-close-btn" onClick={onClose}><XIcon size={16} /></button>
        </div>
        <p className="modal-section-label">Qualquer pessoa com esse link pode entrar no servidor.</p>

        {loading || !invite ? (
          <p className="friends-empty">Gerando convite...</p>
        ) : (
          <>
            <div className="invite-link-row">
              <input
                readOnly
                className="invite-link-input"
                value={inviteUrl(invite.code)}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button className={`invite-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="invite-expiry-hint">
              {invite.expired
                ? 'Esse link de convite expirou. '
                : daysLeft > 0
                  ? `Esse link de convite expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}. `
                  : 'Esse link de convite expira em menos de um dia. '}
              <button className="invite-regenerate-link" disabled={regenerating} onClick={handleRegenerate}>
                {regenerating ? 'Gerando novo link...' : 'Gerar novo link.'}
              </button>
            </p>
          </>
        )}
      </div>
    </Modal>
  )
}
