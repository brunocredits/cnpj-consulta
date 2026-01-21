import { useState, FormEvent } from 'react'
import ResultCard from '../components/ResultCard'
import { consultarCnpj, ConsultaResult } from '../services/apiService'
import { logout, getUserEmail } from '../services/authService'

interface SimpleConsultaPageProps {
  onLogout: () => void
}

function SimpleConsultaPage({ onLogout }: SimpleConsultaPageProps) {
  const [cnpj, setCnpj] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ConsultaResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const userEmail = getUserEmail() || ''
  const userName = userEmail.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ')
  const userInitials = userEmail.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2)

  const formatCnpj = (value: string): string => {
    const digits = value.replace(/\D/g, '')
    
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnpj(e.target.value)
    setCnpj(formatted)
    setError(null)
    setResult(null)
  }

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    const cnpjDigits = cnpj.replace(/\D/g, '')
    
    if (cnpjDigits.length !== 14) {
      setError('CNPJ deve ter 14 dígitos')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await consultarCnpj(cnpjDigits)
      setResult(data)
    } catch (err) {
      if (err instanceof Error) {
        // Se sessão expirou, faz logout
        if (err.message.includes('Sessão expirada')) {
          handleLogout()
          return
        }
        setError(err.message)
      } else {
        setError('Erro ao consultar CNPJ. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <img src="/logo-credits.svg" alt="Credits Brasil" />
          </div>
          <div className="header-user">
            <div className="user-pill">
              <div className="user-avatar">{userInitials}</div>
              <span className="user-name">{userName}</span>
            </div>
            <button onClick={handleLogout} className="btn-logout" title="Sair">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* Conteúdo */}
      <div className="card" style={{ marginTop: 100 }}>
        <div className="logo">
          <img src="/logo-credits.svg" alt="Credits Brasil" className="logo-img" />
          <h1>Consulta CNPJ</h1>
          <p>Pesquise informações de clientes</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="cnpj">CNPJ</label>
            <input
              type="text"
              id="cnpj"
              value={cnpj}
              onChange={handleCnpjChange}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              autoComplete="off"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || cnpj.replace(/\D/g, '').length !== 14}
            style={{ width: '100%' }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                Consultando...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                Consultar
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {result && <ResultCard result={result} />}
      </div>
    </>
  )
}

export default SimpleConsultaPage
