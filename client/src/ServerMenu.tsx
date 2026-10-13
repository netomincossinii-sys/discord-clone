export function ServerMenu({
  isOwner,
  onInvite,
  onLeaveOrDelete,
  onClose,
}: {
  isOwner: boolean
  onInvite: () => void
  onLeaveOrDelete: () => void
  onClose: () => void
}) {
  return (
    <>
      <div className="server-menu-backdrop" onClick={onClose} />
      <div className="server-menu">
        <button className="server-menu-item" onClick={onInvite}>
          Convidar para o servidor
        </button>
        <div className="server-menu-divider" />
        <button className="server-menu-item danger" onClick={onLeaveOrDelete}>
          {isOwner ? 'Deletar servidor' : 'Sair do servidor'}
        </button>
      </div>
    </>
  )
}
