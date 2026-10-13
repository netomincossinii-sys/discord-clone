import { useState } from 'react'
import { Modal } from './Modal'
import type { Channel, ServerRole } from './types'

export function ChannelSettingsModal({
  channel,
  roles,
  onClose,
  onSave,
}: {
  channel: Channel
  roles: ServerRole[]
  onClose: () => void
  onSave: (update: { name: string; roleIds: string[] }) => Promise<void>
}) {
  const [name, setName] = useState(channel.name)
  const [roleIds, setRoleIds] = useState<string[]>(channel.roleIds)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleRole(roleId: string) {
    setRoleIds((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]))
  }

  async function handleSave() {
    if (!name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), roleIds })
      onClose()
    } catch {
      setError('Não foi possível salvar o canal.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} width={420}>
      <div className="add-server-modal">
        <div className="modal-header-row">
          <h2>{channel.type === 'VOICE' ? '🔊 Editar canal de voz' : '# Editar canal de texto'}</h2>
        </div>

        <label className="edit-label">Nome do canal</label>
        <input className="edit-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />

        <label className="edit-label">Restringir acesso</label>
        <p className="edit-hint">
          Marque os cargos que podem acessar esse canal. Ninguém marcado = todo mundo acessa (padrão).
        </p>
        <div className="role-checklist">
          {roles.length === 0 && <p className="edit-hint">Esse servidor ainda não tem cargos criados.</p>}
          {roles.map((role) => (
            <label className="role-checklist-row" key={role.id}>
              <input type="checkbox" checked={roleIds.includes(role.id)} onChange={() => toggleRole(role.id)} />
              <span className="role-color-dot" style={{ background: role.color }} />
              {role.name}
            </label>
          ))}
        </div>

        {error && <p className="auth-error">{error}</p>}

        <div className="add-server-actions">
          <button className="add-server-back-btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="edit-save-btn" disabled={!name.trim() || saving} onClick={handleSave}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
