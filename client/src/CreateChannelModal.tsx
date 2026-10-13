import { useState } from 'react'
import { Modal } from './Modal'
import { XIcon } from './Icon'
import type { Category, ChannelType } from './types'

export function CreateChannelModal({
  categories,
  onClose,
  onCreate,
}: {
  categories: Category[]
  onClose: () => void
  onCreate: (name: string, type: ChannelType, categoryId: string | null) => Promise<void>
}) {
  const [step, setStep] = useState<'type' | 'name'>('type')
  const [type, setType] = useState<ChannelType>('TEXT')
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function chooseType(next: ChannelType) {
    setType(next)
    setStep('name')
  }

  async function handleCreate() {
    if (!name.trim() || creating) return
    setCreating(true)
    setError(null)
    try {
      await onCreate(name.trim(), type, categoryId || null)
      onClose()
    } catch {
      setError('Não foi possível criar o canal.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal onClose={onClose} width={420}>
      {step === 'type' && (
        <div className="add-server-modal">
          <div className="modal-header-row">
            <h2>Criar canal</h2>
            <button className="modal-close-btn" onClick={onClose}><XIcon size={16} /></button>
          </div>

          <button className="add-server-type-card" onClick={() => chooseType('TEXT')}>
            <p className="add-server-option-title"># Canal de texto</p>
            <p className="add-server-option-desc">Mande mensagens, imagens e arquivos</p>
          </button>

          <button className="add-server-type-card" onClick={() => chooseType('VOICE')}>
            <p className="add-server-option-title">🔊 Canal de voz</p>
            <p className="add-server-option-desc">Converse por voz e vídeo, ou compartilhe a tela</p>
          </button>
        </div>
      )}

      {step === 'name' && (
        <div className="add-server-modal">
          <div className="modal-header-row">
            <h2>{type === 'TEXT' ? 'Criar canal de texto' : 'Criar canal de voz'}</h2>
            <button className="modal-close-btn" onClick={onClose}><XIcon size={16} /></button>
          </div>

          <label className="edit-label">Nome do canal</label>
          <input
            className="edit-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder={type === 'TEXT' ? 'novo-canal' : 'Canal de voz'}
            autoFocus
          />

          {categories.length > 0 && (
            <>
              <label className="edit-label">Categoria</label>
              <select className="settings-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Nenhuma categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {error && <p className="auth-error">{error}</p>}

          <div className="add-server-actions">
            <button className="add-server-back-btn" onClick={() => setStep('type')}>
              Voltar
            </button>
            <button className="edit-save-btn" disabled={!name.trim() || creating} onClick={handleCreate}>
              {creating ? 'Criando...' : 'Criar canal'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
