import { UserPlusIcon, PencilIcon, ShieldIcon, PlusIcon, FolderPlusIcon, TrashIcon } from './Icon'

export function ServerMenu({
  isOwner,
  isManager,
  onInvite,
  onEditServer,
  onRoles,
  onCreateChannel,
  onCreateCategory,
  onLeaveOrDelete,
  onClose,
}: {
  isOwner: boolean
  isManager: boolean
  onInvite: () => void
  onEditServer: () => void
  onRoles: () => void
  onCreateChannel: () => void
  onCreateCategory: () => void
  onLeaveOrDelete: () => void
  onClose: () => void
}) {
  return (
    <>
      <div className="server-menu-backdrop" onClick={onClose} />
      <div className="server-menu">
        <button className="server-menu-item" onClick={onInvite}>
          <UserPlusIcon size={16} /> Convidar para o servidor
        </button>
        {isManager && (
          <>
            <button className="server-menu-item" onClick={onEditServer}>
              <PencilIcon size={16} /> Editar servidor
            </button>
            <button className="server-menu-item" onClick={onRoles}>
              <ShieldIcon size={16} /> Cargos
            </button>
            <div className="server-menu-divider" />
            <button className="server-menu-item" onClick={onCreateChannel}>
              <PlusIcon size={16} /> Criar canal
            </button>
            <button className="server-menu-item" onClick={onCreateCategory}>
              <FolderPlusIcon size={16} /> Criar categoria
            </button>
          </>
        )}
        <div className="server-menu-divider" />
        <button className="server-menu-item danger" onClick={onLeaveOrDelete}>
          <TrashIcon size={16} /> {isOwner ? 'Deletar servidor' : 'Sair do servidor'}
        </button>
      </div>
    </>
  )
}
