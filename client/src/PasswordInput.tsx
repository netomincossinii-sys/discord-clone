import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from './Icon'

export function PasswordInput({
  value,
  onChange,
  placeholder = 'Senha',
  autoFocus,
  maxLength,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  maxLength?: number
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-input-wrap">
      <input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        maxLength={maxLength}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        title={visible ? 'Esconder senha' : 'Mostrar senha'}
      >
        {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  )
}
