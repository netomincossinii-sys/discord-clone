import { useState } from 'react'
import * as api from './api'
import type { AuthUser } from './api'
import { LogoIcon } from './LogoIcon'

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const errorMessages: Record<string, string> = {
    invalid_username: 'Usuário deve ter 3-20 caracteres (letras, números, _).',
    weak_password: 'Senha deve ter ao menos 6 caracteres.',
    username_taken: 'Esse usuário já existe.',
    invalid_credentials: 'Usuário ou senha incorretos.',
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = mode === 'login' ? await api.login(username, password) : await api.register(username, password)
      onAuthenticated(user)
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
        <p>{mode === 'login' ? 'Entre na sua conta' : 'Crie uma conta nova'}</p>
        <form onSubmit={submit}>
          <input
            autoFocus
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={72}
          />
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
        <button className="auth-switch" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}
