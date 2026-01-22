import { ConsultaResult } from '../services/apiService'

interface ResultCardProps {
  result: ConsultaResult
}

function getStatusClass(status: string): string {
  const statusLower = status.toLowerCase()
  if (statusLower.includes('ativo') || statusLower.includes('ativa')) return 'status-ativo'
  if (statusLower.includes('inativo') || statusLower.includes('inativa')) return 'status-inativo'
  return 'status-pendente'
}

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return cnpj
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
}

function ResultCard({ result }: ResultCardProps) {
  if (!result.encontrado) {
    return (
      <div className="result-not-found">
        <div className="not-found-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </div>
        <div className="not-found-content">
          <h4>Cliente não encontrado</h4>
          <p>{result.mensagem}</p>
        </div>
        <div className="not-found-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Verifique se o CNPJ está correto ou se o cliente está cadastrado no sistema</span>
        </div>
      </div>
    )
  }

  const cliente = result.cliente!

  return (
    <div className="result-found">
      {/* Success Header */}
      <div className="result-success-header">
        <div className="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div className="success-content">
          <h4>Cliente Encontrado</h4>
          <p>Informações carregadas com sucesso</p>
        </div>
        <span className={`status-badge-large ${getStatusClass(cliente.status_conta)}`}>
          {cliente.status_conta}
        </span>
      </div>

      {/* Company Info */}
      <div className="company-info-card">
        <div className="company-header">
          <div className="company-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4"/>
            </svg>
          </div>
          <div className="company-title">
            <span className="label">Razão Social</span>
            <h3>{cliente.razao_social}</h3>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="details-grid">
        <div className="detail-card">
          <div className="detail-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="detail-content">
            <span className="detail-label">CNPJ</span>
            <span className="detail-value cnpj-value">{formatCnpj(cliente.cnpj)}</span>
          </div>
          <button 
            className="copy-btn" 
            onClick={() => navigator.clipboard.writeText(cliente.cnpj)}
            title="Copiar CNPJ"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>

        <div className="detail-card">
          <div className="detail-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="detail-content">
            <span className="detail-label">Responsável</span>
            <span className="detail-value">{cliente.responsavel}</span>
          </div>
        </div>

        <div className="detail-card full-width">
          <div className="detail-icon status-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div className="detail-content">
            <span className="detail-label">Status da Conta</span>
            <div className="status-display">
              <span className={`status-indicator ${getStatusClass(cliente.status_conta)}`}></span>
              <span className="detail-value">{cliente.status_conta}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="result-actions">
        <button 
          className="action-btn secondary"
          onClick={() => window.print()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Imprimir
        </button>
        <button 
          className="action-btn secondary"
          onClick={() => {
            const text = `CNPJ: ${formatCnpj(cliente.cnpj)}\nRazão Social: ${cliente.razao_social}\nResponsável: ${cliente.responsavel}\nStatus: ${cliente.status_conta}`
            navigator.clipboard.writeText(text)
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copiar Dados
        </button>
      </div>
    </div>
  )
}

export default ResultCard
