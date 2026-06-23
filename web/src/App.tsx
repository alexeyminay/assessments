import { useEffect } from 'react'
import { AuthFetch } from './auth/data/AuthFetch'
import { HttpAuthRepository } from './auth/data/HttpAuthRepository'
import { LocalStorageTokenStorage } from './auth/data/LocalStorageTokenStorage'
import { LoginUseCase } from './auth/domain/LoginUseCase'
import { LogoutUseCase } from './auth/domain/LogoutUseCase'
import { LoginPage } from './auth/presentation/LoginPage'
import { useAuth } from './auth/presentation/useAuth'

const tokenStorage = new LocalStorageTokenStorage()
const authRepo = new HttpAuthRepository()
const loginUseCase = new LoginUseCase(authRepo, tokenStorage)
const logoutUseCase = new LogoutUseCase(authRepo, tokenStorage)
const authFetch = new AuthFetch(tokenStorage)

function App() {
  const { isAuthenticated, role, login, logout, forceLogout } = useAuth(
    loginUseCase,
    logoutUseCase,
    tokenStorage,
  )

  useEffect(() => {
    authFetch.onUnauthenticated = () => {
      forceLogout()
    }
  }, [forceLogout])

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Ассессменты</h1>
        <div className="app-header-right">
          {role && <span className="role-badge role-badge--{role}">{role === 'admin' ? 'Администратор' : 'Пользователь'}</span>}
          <button className="logout-btn" onClick={logout}>Выйти</button>
        </div>
      </header>
      <main className="app-main">
        <p className="app-placeholder">Добро пожаловать в систему ассессментов</p>
      </main>
    </div>
  )
}

export default App
