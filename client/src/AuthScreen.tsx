import { useState } from 'react'
import * as api from './api'
import type { AuthUser } from './api'
import { LogoIcon } from './LogoIcon'
import { GoogleIcon } from './Icon'
import { PasswordInput } from './PasswordInput'

type Mode = 'login' | 'register' | 'forgot' | 'forgot_sent'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_username: 'Usuário deve ter 3-20 caracteres (letras, números, _).',
  weak_password: 'Senha deve ter ao menos 6 caracteres.',
  username_taken: 'Esse usuário já existe.',
  invalid_credentials: 'Usuário ou senha incorretos.',
  invalid_email: 'Digite um e-mail válido.',
  email_taken: 'Esse e-mail já está em uso por outra conta.',
  invalid_token: 'Esse link expirou ou é inválido. Peça um novo.',
  google_unavailable: 'Login com Google ainda não está disponível.',
  google_failed: 'Não foi possível entrar com o Google. Tente novamente.',
}

function describeError(code: string) {
  return ERROR_MESSAGES[code] ?? 'Algo deu errado. Tente novamente.'
}

export function AuthScreen({
  onAuthenticated,
  initialError,
}: {
  onAuthenticated: (user: AuthUser) => void
  initialError?: string | null
}) {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [error, setError] = useState<string | null>(initialError ? describeError(initialError) : null)
  const [loading, setLoading] = useState(false)

  function loginWithGoogle() {
    window.location.href = `${api.API_URL}/api/auth/google`
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = mode === 'login' ? await api.login(username, password) : await api.register(username, password, email)
      onAuthenticated(user)
    } catch (err) {
      const code = err instanceof Error ? err.message : 'unknown'
      setError(describeError(code))
    } finally {
      setLoading(false)
    }
  }

  async function submitForgot(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.requestPasswordReset(forgotEmail)
      switchMode('forgot_sent')
    } catch {
      setError('Não foi possível enviar o e-mail. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'forgot' || mode === 'forgot_sent') {
    return (
      <div className="login-screen">
        <div className="login-card">
          <LogoIcon size={40} className="login-logo" />
          <h1>Callfy</h1>
          {mode === 'forgot' ? (
            <>
              <p>Esqueceu a senha?</p>
              <p className="auth-hint">Digite o e-mail da sua conta. Vamos te mandar um link pra redefinir a senha.</p>
              <form onSubmit={submitForgot}>
                <input
                  autoFocus
                  type="email"
                  placeholder="Seu e-mail"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                {error && <div className="auth-error">{error}</div>}
                <button type="submit" disabled={loading || !forgotEmail.trim()}>
                  {loading ? '...' : 'Enviar link'}
                </button>
              </form>
            </>
          ) : (
            <>
              <p>E-mail enviado!</p>
              <p className="auth-hint">
                Se existir uma conta com o e-mail <strong>{forgotEmail}</strong>, enviamos um link de redefinição.
                Confira também a caixa de spam.
              </p>
            </>
          )}
          <button className="auth-switch" onClick={() => switchMode('login')}>
            Voltar para o login
          </button>
        </div>
      </div>
    )
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
          {mode === 'register' && (
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
          <PasswordInput value={password} onChange={setPassword} maxLength={72} />
          {mode === 'login' && (
            <button type="button" className="auth-forgot-link" onClick={() => switchMode('forgot')}>
              Esqueceu a senha?
            </button>
          )}
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
        <div className="auth-divider">
          <span>ou</span>
        </div>
        <button type="button" className="auth-google-btn" onClick={loginWithGoogle}>
          <GoogleIcon size={18} />
          Continuar com o Google
        </button>
        <button className="auth-switch" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}
