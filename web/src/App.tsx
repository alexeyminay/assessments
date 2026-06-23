import { useEffect, useState } from 'react'
import { AuthFetch } from './auth/data/AuthFetch'
import { HttpAuthRepository } from './auth/data/HttpAuthRepository'
import { LocalStorageTokenStorage } from './auth/data/LocalStorageTokenStorage'
import { LoginUseCase } from './auth/domain/LoginUseCase'
import { LogoutUseCase } from './auth/domain/LogoutUseCase'
import { LoginPage } from './auth/presentation/LoginPage'
import { useAuth } from './auth/presentation/useAuth'
import { NavBar } from './navigation/NavBar'
import { type Screen, SCREEN_PATHS, pathToScreen } from './navigation/types'
import { DashboardPage } from './dashboard/presentation/DashboardPage'
import { TemplatesPage } from './templates/presentation/TemplatesPage'
import { UsersPage } from './users/presentation/UsersPage'
import { HttpUserRepository } from './users/data/HttpUserRepository'
import { GetUsersUseCase } from './users/domain/GetUsersUseCase'
import { UpdateRoleUseCase } from './users/domain/UpdateRoleUseCase'
import { HttpTemplateRepository } from './templates/data/HttpTemplateRepository'
import { GetTemplatesUseCase } from './templates/domain/GetTemplatesUseCase'
import { ImportTemplateUseCase } from './templates/domain/ImportTemplateUseCase'
import { DeleteTemplateUseCase } from './templates/domain/DeleteTemplateUseCase'

const tokenStorage = new LocalStorageTokenStorage()
const authRepo = new HttpAuthRepository()
const loginUseCase = new LoginUseCase(authRepo, tokenStorage)
const logoutUseCase = new LogoutUseCase(authRepo, tokenStorage)
const authFetch = new AuthFetch(tokenStorage)

const userRepo = new HttpUserRepository(authFetch)
const getUsersUseCase = new GetUsersUseCase(userRepo)
const updateRoleUseCase = new UpdateRoleUseCase(userRepo)

const templateRepo = new HttpTemplateRepository(authFetch)
const getTemplatesUseCase = new GetTemplatesUseCase(templateRepo)
const importTemplateUseCase = new ImportTemplateUseCase(templateRepo)
const deleteTemplateUseCase = new DeleteTemplateUseCase(templateRepo)

function parseCurrentUserId(): number | null {
  const token = tokenStorage.getAccessToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return parseInt(payload.sub, 10) || null
  } catch {
    return null
  }
}

function App() {
  const { isAuthenticated, role, login, logout, forceLogout } = useAuth(
    loginUseCase, logoutUseCase, tokenStorage,
  )

  const [screen, setScreen] = useState<Screen>(
    () => pathToScreen(window.location.pathname) ?? 'dashboard'
  )

  useEffect(() => {
    authFetch.onUnauthenticated = () => forceLogout()
  }, [forceLogout])

  useEffect(() => {
    const onPop = () => setScreen(pathToScreen(window.location.pathname) ?? 'dashboard')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      window.history.replaceState({}, '', SCREEN_PATHS[screen])
    }
  }, [isAuthenticated])

  const handleScreenChange = (s: Screen) => {
    window.history.pushState({}, '', SCREEN_PATHS[s])
    setScreen(s)
  }

  const handleLogout = async () => {
    await logout()
    window.history.replaceState({}, '', '/dashboard')
  }

  if (!isAuthenticated) return <LoginPage onLogin={login} />

  const currentUserId = parseCurrentUserId()

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <span className="app-logo">A</span>
          <span className="app-title">Ассессменты</span>
          <NavBar active={screen} role={role} onChange={handleScreenChange} />
        </div>
        <div className="app-header-right">
          {role && (
            <span className="role-badge">
              {role === 'admin' ? 'Администратор' : 'Пользователь'}
            </span>
          )}
          <button className="logout-btn" onClick={handleLogout}>Выйти</button>
        </div>
      </header>
      <main className="app-main">
        {screen === 'dashboard' && <DashboardPage />}
        {screen === 'users'     && <UsersPage getUsersUseCase={getUsersUseCase} updateRoleUseCase={updateRoleUseCase} currentUserId={currentUserId} />}
        {screen === 'templates' && (
          <TemplatesPage
            getTemplatesUseCase={getTemplatesUseCase}
            importTemplateUseCase={importTemplateUseCase}
            deleteTemplateUseCase={deleteTemplateUseCase}
          />
        )}
      </main>
    </div>
  )
}

export default App
