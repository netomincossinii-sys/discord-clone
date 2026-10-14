import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Modal } from './Modal'

interface ConfirmOptions {
  title?: string
  icon?: ReactNode
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions | string) => {
    setOptions(typeof opts === 'string' ? { message: opts } : opts)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  function settle(result: boolean) {
    setOptions(null)
    resolverRef.current?.(result)
    resolverRef.current = null
  }

  const ConfirmDialog = options ? (
    <Modal onClose={() => settle(false)} width={380}>
      <div className="add-server-modal">
        {options.icon && <div className="confirm-dialog-icon">{options.icon}</div>}
        {options.title && (
          <div className="modal-header-row">
            <h2>{options.title}</h2>
          </div>
        )}
        <p className="confirm-dialog-message">{options.message}</p>
        <div className="add-server-actions">
          <button className="add-server-back-btn" onClick={() => settle(false)}>
            {options.cancelLabel ?? 'Cancelar'}
          </button>
          <button
            className={`edit-save-btn ${options.danger ? 'danger' : ''}`}
            onClick={() => settle(true)}
            autoFocus
          >
            {options.confirmLabel ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </Modal>
  ) : null

  return { confirm, ConfirmDialog }
}
