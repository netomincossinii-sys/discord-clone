import { useState } from 'react'
import * as api from './api'
import { LogoIcon } from './LogoIcon'
import { PasswordInput } from './PasswordInput'

export function ResetPasswordScreen({ token, onDone }: { token: string; onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const errorMessages: Record<string, string> = {
    invalid_token: 'Esse link expirou ou já foi usado. Peça um novo link de redefinição.',
    weak_password: 'Senha deve ter ao menos 6 caracteres.',
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    setLoading(true)
    try {
      await api.confirmPasswordReset(token, password)
      setDone(true)
    } catch (err) {
      const code = err instanceof Error ? err.message : 'unknown'
      setError(errorMessages[code] ?? 'Algo deu errado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <LogoIcon size={40} className="login-logo" />
        <h1>Callfy</h1>
        {done ? (
          <>
            <p>Senha redefinida!</p>
            <p className="auth-hint">Sua senha foi alterada com sucesso. Já pode entrar com a senha nova.</p>
            <button onClick={onDone}>Ir para o login</button>
          </>
        ) : (
          <>
            <p>Escolha uma nova senha</p>
            <form onSubmit={submit}>
              <PasswordInput value={password} onChange={setPassword} placeholder="Nova senha" autoFocus maxLength={72} />
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirme a nova senha"
                maxLength={72}
              />
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" disabled={loading}>
                {loading ? '...' : 'Redefinir senha'}
              </button>
            </form>
            <button className="auth-switch" onClick={onDone}>
              Voltar para o login
            </button>
          </>
        )}
      </div>
    </div>
  )
}
