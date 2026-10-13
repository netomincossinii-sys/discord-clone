import { useEffect, useRef } from 'react'
import * as api from './api'
import { STATUS_META } from './api'
import type { UserStatus } from './api'

const ORDER: UserStatus[] = ['ONLINE', 'IDLE', 'DND', 'INVISIBLE']

export function StatusMenu({
  current,
  onChange,
  onClose,
}: {
  current: UserStatus
  onChange: (status: UserStatus) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  async function select(status: UserStatus) {
    onChange(status)
    onClose()
    await api.updateProfile({ status })
  }

  return (
    <div className="status-menu" ref={ref}>
      {ORDER.map((status) => (
        <button key={status} className={`status-menu-item ${status === current ? 'active' : ''}`} onClick={() => select(status)}>
          <span className="status-dot" style={{ background: STATUS_META[status].dotColor }} />
          {STATUS_META[status].label}
        </button>
      ))}
    </div>
  )
}
