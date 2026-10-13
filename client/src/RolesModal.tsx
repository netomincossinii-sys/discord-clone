import { useState } from 'react'
import { Modal } from './Modal'
import { XIcon, ChevronDownIcon, PlusIcon, TrashIcon } from './Icon'
import { BANNER_COLORS } from './api'
import type { ServerMember, ServerRole } from './types'

function RoleEditor({
  role,
  members,
  onSave,
  onDelete,
  onCancel,
}: {
  role: ServerRole | null
  members: ServerMember[]
  onSave: (update: { name: string; color: string; isAdmin: boolean; memberIds: string[] }) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(role?.name ?? '')
  const [color, setColor] = useState(role?.color ?? BANNER_COLORS[0])
  const [isAdmin, setIsAdmin] = useState(role?.isAdmin ?? false)
  const [memberIds, setMemberIds] = useState<string[]>(
    role ? members.filter((m) => m.roleIds.includes(role.id)).map((m) => m.id) : [],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleMember(id: string) {
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  async function handleSave() {
    if (!name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), color, isAdmin, memberIds })
    } catch {
      setError('Não foi possível salvar o cargo.')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!onDelete || saving) return
    setSaving(true)
    try {
      await onDelete()
    } catch {
      setError('Não foi possível remover o cargo.')
      setSaving(false)
    }
  }

  return (
    <div className="role-editor">
      <label className="edit-label">Nome do cargo</label>
      <input className="edit-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus={!role} />

      <label className="edit-label">Cor</label>
      <div className="banner-color-list">
        {BANNER_COLORS.map((c) => (
          <button
            key={c}
            className={`banner-color-swatch ${color === c ? 'active' : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>

      <div className="settings-toggle-row">
        <div>
          <p className="settings-toggle-label">Administrador</p>
          <p className="settings-toggle-desc">Pode editar o servidor, criar canais, categorias e cargos.</p>
        </div>
        <button className={`settings-switch ${isAdmin ? 'on' : ''}`} onClick={() => setIsAdmin((v) => !v)}>
          <span className="settings-switch-knob" />
        </button>
      </div>

      {role && (
        <>
          <label className="edit-label">Membros com esse cargo</label>
          <div className="role-member-checklist">
            {members.map((member) => (
              <label className="role-member-row" key={member.id}>
                <input type="checkbox" checked={memberIds.includes(member.id)} onChange={() => toggleMember(member.id)} />
                {member.avatarImage ? (
                  <img className="role-member-avatar-img" src={member.avatarImage} alt="" />
                ) : (
                  <div className="role-member-avatar-fallback" style={{ background: member.color }}>
                    {member.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
                {member.username}
              </label>
            ))}
          </div>
        </>
      )}

      {error && <p className="auth-error">{error}</p>}

      <div className="add-server-actions">
        {onDelete && (
          <button className="add-server-back-btn danger" onClick={handleDelete} disabled={saving}>
            <TrashIcon size={14} /> Remover
          </button>
        )}
        <button className="add-server-back-btn" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button className="edit-save-btn" disabled={!name.trim() || saving} onClick={handleSave}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

export function RolesModal({
  roles,
  members,
  onClose,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
}: {
  roles: ServerRole[]
  members: ServerMember[]
  onClose: () => void
  onCreateRole: (update: { name: string; color: string; isAdmin: boolean; memberIds: string[] }) => Promise<void>
  onUpdateRole: (roleId: string, update: { name: string; color: string; isAdmin: boolean; memberIds: string[] }) => Promise<void>
  onDeleteRole: (roleId: string) => Promise<void>
}) {
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)

  return (
    <Modal onClose={onClose} width={440}>
      <div className="add-server-modal">
        <div className="modal-header-row">
          <h2>Cargos</h2>
          <button className="modal-close-btn" onClick={onClose}><XIcon size={16} /></button>
        </div>
        <p className="modal-section-label">
          Crie cargos e defina o que cada um pode fazer no servidor. Clique num cargo pra ver e editar as permissões
          dele.
        </p>

        {!creatingNew && (
          <button
            className="edit-save-btn add-server-wide-btn"
            onClick={() => {
              setCreatingNew(true)
              setExpandedRoleId(null)
            }}
          >
            <PlusIcon size={16} /> Criar cargo
          </button>
        )}

        {creatingNew && (
          <RoleEditor
            role={null}
            members={members}
            onCancel={() => setCreatingNew(false)}
            onSave={async (update) => {
              await onCreateRole(update)
              setCreatingNew(false)
            }}
          />
        )}

        <div className="role-list">
          {roles.map((role) => (
            <div key={role.id}>
              <button
                className="role-list-row"
                onClick={() => setExpandedRoleId(expandedRoleId === role.id ? null : role.id)}
              >
                <span className="role-color-dot" style={{ background: role.color }} />
                {role.name}
                <ChevronDownIcon size={14} className={`role-list-chevron ${expandedRoleId === role.id ? 'open' : ''}`} />
              </button>
              {expandedRoleId === role.id && (
                <RoleEditor
                  role={role}
                  members={members}
                  onCancel={() => setExpandedRoleId(null)}
                  onSave={async (update) => {
                    await onUpdateRole(role.id, update)
                    setExpandedRoleId(null)
                  }}
                  onDelete={async () => {
                    await onDeleteRole(role.id)
                    setExpandedRoleId(null)
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
