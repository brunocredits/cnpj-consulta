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
      <div className="alert alert-warning" style={{ marginTop: '24px' }}>
        <strong>⚠️ Não encontrado</strong>
        <p style={{ marginTop: '8px' }}>{result.mensagem}</p>
      </div>
    )
  }

  const cliente = result.cliente!

  return (
    <div className="result-card">
      <h3>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--success-color)">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
        Cliente Encontrado
      </h3>

      <div className="result-row">
        <span className="result-label">CNPJ</span>
        <span className="result-value" style={{ fontFamily: 'monospace' }}>
          {formatCnpj(cliente.cnpj)}
        </span>
      </div>

      <div className="result-row">
        <span className="result-label">Razão Social</span>
        <span className="result-value">{cliente.razao_social}</span>
      </div>

      <div className="result-row">
        <span className="result-label">Responsável</span>
        <span className="result-value">{cliente.responsavel}</span>
      </div>

      <div className="result-row">
        <span className="result-label">Status da Conta</span>
        <span className={`status-badge ${getStatusClass(cliente.status_conta)}`}>
          {cliente.status_conta}
        </span>
      </div>
    </div>
  )
}

export default ResultCard
