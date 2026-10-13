import type { ReactNode } from 'react'

export function Modal({ onClose, children, width = 420 }: { onClose: () => void; children: ReactNode; width?: number }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
