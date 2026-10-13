import { useState } from 'react'
import { Modal } from './Modal'
import { XIcon } from './Icon'

export function CreateCategoryModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim() || creating) return
    setCreating(true)
    setError(null)
    try {
      await onCreate(name.trim())
      onClose()
    } catch {
      setError('Não foi possível criar a categoria.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal onClose={onClose} width={420}>
      <div className="add-server-modal">
        <div className="modal-header-row">
          <h2>Criar categoria</h2>
          <button className="modal-close-btn" onClick={onClose}><XIcon size={16} /></button>
        </div>

        <label className="edit-label">Nome da categoria</label>
        <input
          className="edit-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="NOVA CATEGORIA"
          autoFocus
        />

        {error && <p className="auth-error">{error}</p>}

        <div className="add-server-actions">
          <button className="add-server-back-btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="edit-save-btn" disabled={!name.trim() || creating} onClick={handleCreate}>
            {creating ? 'Criando...' : 'Criar categoria'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
