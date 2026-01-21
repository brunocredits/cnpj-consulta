import { useState, FormEvent } from 'react'
import { login } from '../services/authService'

interface LoginPageProps {
  onLoginSuccess: () => void
}

function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    const emailTrimmed = email.trim().toLowerCase()
    
    if (!emailTrimmed) {
      setError('Digite seu email')
      return
    }
    
    if (!emailTrimmed.includes('@')) {
      setError('Email inválido')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await login(emailTrimmed)
      onLoginSuccess()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Erro ao fazer login. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: 400, margin: '60px auto' }}>
      <div className="logo">
        <img src="/logo-credits.svg" alt="Credits Brasil" className="logo-img" />
        <h1>Consulta CNPJ</h1>
        <p>Acesso restrito a colaboradores</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="email">Email corporativo</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            placeholder="seu.nome@creditsbrasil.com.br"
            autoComplete="email"
            disabled={loading}
            autoFocus
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading || !email.trim()}
          style={{ width: '100%' }}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
              Entrando...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/>
              </svg>
              Entrar
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="alert alert-danger" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}
      
      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#6c757d' }}>
        Apenas emails @creditsbrasil.com.br são permitidos
      </div>
    </div>
  )
}

export default LoginPage
