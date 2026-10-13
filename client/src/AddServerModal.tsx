import { useState } from 'react'
import { Modal } from './Modal'
import { XIcon } from './Icon'

const JOIN_ERROR_MESSAGES: Record<string, string> = {
  invalid_code: 'Cole um código ou link de convite válido.',
  invite_not_found: 'Esse convite não existe ou foi revogado.',
  invite_expired: 'Esse convite expirou. Peça um novo link para quem te convidou.',
}

export function AddServerModal({
  initialInviteCode,
  onClose,
  onJoin,
  onCreate,
}: {
  initialInviteCode?: string
  onClose: () => void
  onJoin: (code: string) => Promise<void>
  onCreate: (name: string, icon: string) => Promise<void>
}) {
  const [step, setStep] = useState<'hub' | 'customize'>('hub')
  const [inviteCode, setInviteCode] = useState(initialInviteCode ?? '')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  async function handleJoin() {
    if (!inviteCode.trim() || joining) return
    setJoining(true)
    setJoinError('')
    try {
      await onJoin(inviteCode.trim())
    } catch (err) {
      const code = err instanceof Error ? err.message : 'unknown'
      setJoinError(JOIN_ERROR_MESSAGES[code] ?? 'Não foi possível entrar nesse servidor.')
    } finally {
      setJoining(false)
    }
  }

  async function handleCreate() {
    if (!name.trim() || creating) return
    setCreating(true)
    setCreateError('')
    try {
      await onCreate(name.trim(), name.trim().slice(0, 2).toUpperCase())
    } catch {
      setCreateError('Não foi possível criar o servidor.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal onClose={onClose} width={420}>
      {step === 'hub' && (
        <div className="add-server-modal">
          <div className="modal-header-row">
            <h2>Adicionar um servidor</h2>
            <button className="modal-close-btn" onClick={onClose}><XIcon size={16} /></button>
          </div>

          <p className="modal-section-label">Convite</p>
          <input
            className="edit-input"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="Cole o link ou o código do convite"
          />
          {joinError && <p className="auth-error">{joinError}</p>}
          <button
            className="edit-save-btn add-server-wide-btn"
            disabled={!inviteCode.trim() || joining}
            onClick={handleJoin}
          >
            {joining ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="modal-divider" />

          <button className="add-server-option" onClick={() => setStep('customize')}>
            <span className="add-server-option-icon">+</span>
            <span>
              <p className="add-server-option-title">Criar um servidor</p>
              <p className="add-server-option-desc">Um lugar seu, com os canais e as pessoas que você escolher.</p>
            </span>
          </button>
        </div>
      )}

      {step === 'customize' && (
        <div className="add-server-modal">
          <div className="modal-header-row">
            <h2>Personalize seu servidor</h2>
            <button className="modal-close-btn" onClick={onClose}><XIcon size={16} /></button>
          </div>
          <p className="modal-section-label">Dê um nome ao seu servidor. Você pode mudar depois.</p>

          <label className="edit-label">Nome do servidor</label>
          <input
            className="edit-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Servidor da galera"
            autoFocus
          />

          {createError && <p className="auth-error">{createError}</p>}

          <div className="add-server-actions">
            <button className="add-server-back-btn" onClick={() => setStep('hub')}>
              Voltar
            </button>
            <button className="edit-save-btn" disabled={!name.trim() || creating} onClick={handleCreate}>
              {creating ? 'Criando...' : 'Criar servidor'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
