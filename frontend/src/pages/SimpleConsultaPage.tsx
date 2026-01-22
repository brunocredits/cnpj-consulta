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
  const [consultasRealizadas, setConsultasRealizadas] = useState(0)

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

  const handleClear = () => {
    setCnpj('')
    setResult(null)
    setError(null)
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
      setConsultasRealizadas(prev => prev + 1)
    } catch (err) {
      if (err instanceof Error) {
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

  const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="consulta-page">
      {/* Header Full Width */}
      <header className="main-header">
        <div className="header-container">
          <div className="header-left">
            <div className="header-logo">
              <img src="/logo-credits.svg" alt="Credits Brasil" />
              <div className="header-title">
                <h1>Credits Brasil</h1>
                <span>Sistema de Consulta</span>
              </div>
            </div>
          </div>
          
          <div className="header-center">
            <div className="header-stats">
              <div className="stat-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <div className="stat-content">
                  <span className="stat-value">{consultasRealizadas}</span>
                  <span className="stat-label">Consultas</span>
                </div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <div className="stat-content">
                  <span className="stat-value">{currentTime}</span>
                  <span className="stat-label">{currentDate}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="header-right">
            <div className="user-menu">
              <div className="user-info">
                <div className="user-avatar">
                  {userInitials}
                </div>
                <div className="user-details">
                  <span className="user-name">{userName}</span>
                  <span className="user-email">{userEmail}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="logout-btn" title="Sair da conta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper">
          {/* Page Title */}
          <div className="page-header">
            <div className="page-title">
              <h2>Consulta de CNPJ</h2>
              <p>Pesquise informações detalhadas de clientes cadastrados no sistema</p>
            </div>
            <div className="page-actions">
              <div className="action-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Digite o CNPJ completo para buscar</span>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="search-section">
            <div className="search-card">
              <div className="search-header">
                <div className="search-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4"/>
                  </svg>
                </div>
                <div className="search-title">
                  <h3>Buscar Empresa</h3>
                  <p>Informe o CNPJ da empresa que deseja consultar</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="search-form">
                <div className="search-input-group">
                  <div className="input-container">
                    <label htmlFor="cnpj">CNPJ da Empresa</label>
                    <div className="input-field">
                      <input
                        type="text"
                        id="cnpj"
                        value={cnpj}
                        onChange={handleCnpjChange}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        autoComplete="off"
                        disabled={loading}
                        autoFocus
                      />
                      {cnpj && (
                        <button 
                          type="button" 
                          className="clear-btn"
                          onClick={handleClear}
                          title="Limpar"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="input-hint">
                      <span className={`digit-count ${cnpj.replace(/\D/g, '').length === 14 ? 'complete' : ''}`}>
                        {cnpj.replace(/\D/g, '').length}/14 dígitos
                      </span>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="search-btn"
                    disabled={loading || cnpj.replace(/\D/g, '').length !== 14}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        <span>Consultando...</span>
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="11" cy="11" r="8"/>
                          <path d="m21 21-4.35-4.35"/>
                        </svg>
                        <span>Consultar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {error && (
                <div className="error-alert">
                  <div className="error-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <div className="error-content">
                    <strong>Erro na consulta</strong>
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div className="results-section">
              <div className="results-header">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  Resultado da Consulta
                </h3>
                <span className="results-timestamp">
                  Consultado às {new Date().toLocaleTimeString('pt-BR')}
                </span>
              </div>
              <ResultCard result={result} />
            </div>
          )}

          {/* Empty State */}
          {!result && !error && !loading && (
            <div className="empty-state">
              <div className="empty-illustration">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <h4>Nenhuma consulta realizada</h4>
              <p>Digite um CNPJ válido no campo acima para buscar informações da empresa</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-content">
          <span>© 2026 Credits Brasil. Todos os direitos reservados.</span>
          <span className="footer-version">v1.0.0</span>
        </div>
      </footer>
    </div>
  )
}

export default SimpleConsultaPage
