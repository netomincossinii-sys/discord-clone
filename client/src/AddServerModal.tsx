import { useRef, useState } from 'react'
import { Modal } from './Modal'
import { XIcon, PlusIcon } from './Icon'
import { ImageEditorModal } from './ImageEditorModal'
import { AVATAR_OUTPUT_SIZE, MAX_AVATAR_UPLOAD_BYTES, isAnimatedImage, readFileAsDataUrl } from './imageUtils'

const JOIN_ERROR_MESSAGES: Record<string, string> = {
  invalid_code: 'Cole um código ou link de convite válido.',
  invite_not_found: 'Esse convite não existe ou foi revogado.',
  invite_expired: 'Esse convite expirou. Peça um novo link para quem te convidou.',
}

function extractInviteCode(raw: string): string {
  const trimmed = raw.trim()
  const paramMatch = trimmed.match(/invite=([A-Za-z0-9_-]{6,})/)
  if (paramMatch) return paramMatch[1]
  if (/^[A-Za-z0-9_-]{6,}$/.test(trimmed)) return trimmed
  const anyMatch = trimmed.match(/[A-Za-z0-9_-]{6,}/)
  return anyMatch ? anyMatch[0] : trimmed
}

export function AddServerModal({
  username,
  initialInviteCode,
  onClose,
  onJoin,
  onCreate,
}: {
  username: string
  initialInviteCode?: string
  onClose: () => void
  onJoin: (code: string) => Promise<void>
  onCreate: (name: string, icon: string, iconImage: string | null) => Promise<void>
}) {
  const [step, setStep] = useState<'hub' | 'type' | 'customize'>('hub')
  const [inviteCode, setInviteCode] = useState(initialInviteCode ?? '')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  const [name, setName] = useState(`Servidor de ${username}`)
  const [iconImage, setIconImage] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [iconEditFile, setIconEditFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleJoin() {
    if (!inviteCode.trim() || joining) return
    setJoining(true)
    setJoinError('')
    try {
      await onJoin(extractInviteCode(inviteCode))
    } catch (err) {
      const code = err instanceof Error ? err.message : 'unknown'
      setJoinError(JOIN_ERROR_MESSAGES[code] ?? 'Não foi possível entrar nesse servidor.')
    } finally {
      setJoining(false)
    }
  }

  async function handleIconFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (isAnimatedImage(file)) {
      try {
        setIconImage(await readFileAsDataUrl(file, MAX_AVATAR_UPLOAD_BYTES))
        setImageError(null)
      } catch {
        setImageError('Esse GIF é muito grande ou inválido.')
      }
      return
    }
    setIconEditFile(file)
  }

  async function handleCreate() {
    if (!name.trim() || creating) return
    setCreating(true)
    setCreateError('')
    try {
      await onCreate(name.trim(), name.trim().slice(0, 2).toUpperCase(), iconImage)
    } catch {
      setCreateError('Não foi possível criar o servidor.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
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

          <button className="add-server-option" onClick={() => setStep('type')}>
            <span className="add-server-option-icon"><PlusIcon size={20} /></span>
            <span>
              <p className="add-server-option-title">Criar um servidor</p>
              <p className="add-server-option-desc">Um lugar seu, com os canais e as pessoas que você escolher.</p>
            </span>
          </button>
        </div>
      )}

      {step === 'type' && (
        <div className="add-server-modal">
          <div className="modal-header-row">
            <h2>Crie seu servidor</h2>
            <button className="modal-close-btn" onClick={onClose}><XIcon size={16} /></button>
          </div>
          <p className="modal-section-label">Para quem é este servidor? Dá para mudar depois.</p>

          <button className="add-server-type-card selected" onClick={() => setStep('customize')}>
            <p className="add-server-option-title">Para mim e meus amigos</p>
            <p className="add-server-option-desc">Um espaço fechado: só entra quem receber convite. Fora da Descoberta.</p>
          </button>

          <button className="add-server-type-card disabled" disabled title="Em breve">
            <p className="add-server-option-title">
              Para uma comunidade <span className="add-server-type-badge">Em breve</span>
            </p>
            <p className="add-server-option-desc">Aberto na Descoberta: qualquer pessoa encontra e entra sem convite.</p>
          </button>

          <div className="add-server-actions">
            <button className="add-server-back-btn" onClick={() => setStep('hub')}>
              Voltar
            </button>
          </div>
        </div>
      )}

      {step === 'customize' && (
        <div className="add-server-modal">
          <div className="modal-header-row">
            <h2>Personalize seu servidor</h2>
            <button className="modal-close-btn" onClick={onClose}><XIcon size={16} /></button>
          </div>
          <p className="modal-section-label">
            Dê uma cara ao seu servidor. A foto e o nome aparecem para todo mundo que entrar.
          </p>

          <div className="add-server-icon-wrap">
            <button
              className="add-server-icon-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Clique para escolher uma foto"
            >
              {iconImage ? <img className="add-server-icon-img" src={iconImage} alt="" /> : <span>Enviar foto</span>}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleIconFileChange} />
          </div>
          {imageError && <p className="auth-error">{imageError}</p>}

          <label className="edit-label">Nome do servidor</label>
          <input
            className="edit-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Servidor da galera"
            autoFocus
          />
          <p className="edit-hint">Só quem tiver o convite consegue entrar.</p>

          {createError && <p className="auth-error">{createError}</p>}

          <div className="add-server-actions">
            <button className="add-server-back-btn" onClick={() => setStep('type')}>
              Voltar
            </button>
            <button className="edit-save-btn" disabled={!name.trim() || creating} onClick={handleCreate}>
              {creating ? 'Criando...' : 'Criar servidor'}
            </button>
          </div>
        </div>
      )}
    </Modal>

    {iconEditFile && (
      <ImageEditorModal
        file={iconEditFile}
        aspect={1}
        outputWidth={AVATAR_OUTPUT_SIZE}
        outputHeight={AVATAR_OUTPUT_SIZE}
        round
        title="Ajustar ícone do servidor"
        onCancel={() => setIconEditFile(null)}
        onConfirm={(dataUrl) => {
          setIconImage(dataUrl)
          setIconEditFile(null)
        }}
      />
    )}
    </>
  )
}
