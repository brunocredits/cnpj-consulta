import { useState, useEffect } from 'react'
import SimpleLoginPage from './pages/SimpleLoginPage'
import SimpleConsultaPage from './pages/SimpleConsultaPage'
import { isLoggedIn } from './services/authService'

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Verifica se já está logado
    setAuthenticated(isLoggedIn())
    setChecking(false)
  }, [])

  const handleLoginSuccess = () => {
    setAuthenticated(true)
  }

  const handleLogout = () => {
    setAuthenticated(false)
  }

  if (checking) {
    return (
      <div className="app-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <span className="spinner"></span>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {authenticated ? (
        <SimpleConsultaPage onLogout={handleLogout} />
      ) : (
        <SimpleLoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  )
}

export default App
