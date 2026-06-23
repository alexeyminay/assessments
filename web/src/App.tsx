import { useEffect, useState } from 'react'
import { AuthFetch } from './auth/data/AuthFetch'
import { HttpAuthRepository } from './auth/data/HttpAuthRepository'
import { LocalStorageTokenStorage } from './auth/data/LocalStorageTokenStorage'
import { LoginUseCase } from './auth/domain/LoginUseCase'
import { LogoutUseCase } from './auth/domain/LogoutUseCase'
import { LoginPage } from './auth/presentation/LoginPage'
import { useAuth } from './auth/presentation/useAuth'
import { NavBar } from './navigation/NavBar'
import { type Screen, SCREEN_PATHS, pathToScreen, pathToTemplateId, pathToAssessmentId } from './navigation/types'
import { TemplatesPage } from './templates/presentation/TemplatesPage'
import { TemplateViewerPage } from './templates/presentation/TemplateViewerPage'
import { UsersPage } from './users/presentation/UsersPage'
import { HttpUserRepository } from './users/data/HttpUserRepository'
import { GetUsersUseCase } from './users/domain/GetUsersUseCase'
import { UpdateRoleUseCase } from './users/domain/UpdateRoleUseCase'
import { UpdateProfileUseCase } from './users/domain/UpdateProfileUseCase'
import { HttpTemplateRepository } from './templates/data/HttpTemplateRepository'
import { GetTemplatesUseCase } from './templates/domain/GetTemplatesUseCase'
import { ImportTemplateUseCase } from './templates/domain/ImportTemplateUseCase'
import { DeleteTemplateUseCase } from './templates/domain/DeleteTemplateUseCase'
import { GetTemplateDetailUseCase } from './templates/domain/GetTemplateDetailUseCase'
import { HttpAssessmentRepository } from './assessments/data/HttpAssessmentRepository'
import {
  ListAssessmentsUseCase, CreateAssessmentUseCase, GetAssessmentDetailUseCase,
  AssessmentTransitionUseCase, AssessmentLockUseCase, UpdateAssessmentUseCase,
} from './assessments/domain/useCases'
import { DashboardPage } from './assessments/presentation/DashboardPage'
import { AssessmentViewerPage } from './assessments/presentation/AssessmentViewerPage'

const tokenStorage = new LocalStorageTokenStorage()
const authRepo = new HttpAuthRepository()
const loginUseCase = new LoginUseCase(authRepo, tokenStorage)
const logoutUseCase = new LogoutUseCase(authRepo, tokenStorage)
const authFetch = new AuthFetch(tokenStorage)

const userRepo = new HttpUserRepository(authFetch)
const getUsersUseCase = new GetUsersUseCase(userRepo)
const updateRoleUseCase = new UpdateRoleUseCase(userRepo)
const updateProfileUseCase = new UpdateProfileUseCase(userRepo)

const templateRepo = new HttpTemplateRepository(authFetch)
const getTemplatesUseCase = new GetTemplatesUseCase(templateRepo)
const importTemplateUseCase = new ImportTemplateUseCase(templateRepo)
const deleteTemplateUseCase = new DeleteTemplateUseCase(templateRepo)
const getTemplateDetailUseCase = new GetTemplateDetailUseCase(templateRepo)

const assessmentRepo = new HttpAssessmentRepository(authFetch)
const listAssessmentsUseCase = new ListAssessmentsUseCase(assessmentRepo)
const createAssessmentUseCase = new CreateAssessmentUseCase(assessmentRepo)
const getAssessmentDetailUseCase = new GetAssessmentDetailUseCase(assessmentRepo)
const assessmentTransitionUseCase = new AssessmentTransitionUseCase(assessmentRepo)
const assessmentLockUseCase = new AssessmentLockUseCase(assessmentRepo)
const updateAssessmentUseCase = new UpdateAssessmentUseCase(assessmentRepo)

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
  const [viewingTemplateId, setViewingTemplateId] = useState<number | null>(
    () => pathToTemplateId(window.location.pathname)
  )
  const [viewingAssessmentId, setViewingAssessmentId] = useState<number | null>(
    () => pathToAssessmentId(window.location.pathname)
  )

  useEffect(() => {
    authFetch.onUnauthenticated = () => forceLogout()
  }, [forceLogout])

  useEffect(() => {
    const onPop = () => {
      setScreen(pathToScreen(window.location.pathname) ?? 'dashboard')
      setViewingTemplateId(pathToTemplateId(window.location.pathname))
      setViewingAssessmentId(pathToAssessmentId(window.location.pathname))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (isAuthenticated && !viewingTemplateId && !viewingAssessmentId) {
      window.history.replaceState({}, '', SCREEN_PATHS[screen])
    }
  }, [isAuthenticated])

  const handleScreenChange = (s: Screen) => {
    window.history.pushState({}, '', SCREEN_PATHS[s])
    setScreen(s)
    setViewingTemplateId(null)
    setViewingAssessmentId(null)
  }

  const handleViewTemplate = (id: number) => {
    window.history.pushState({}, '', `/templates/${id}`)
    setViewingTemplateId(id)
  }

  const handleBackFromTemplate = () => {
    window.history.pushState({}, '', '/templates')
    setViewingTemplateId(null)
  }

  const handleViewAssessment = (id: number) => {
    window.history.pushState({}, '', `/assessments/${id}`)
    setScreen('dashboard')
    setViewingAssessmentId(id)
    setViewingTemplateId(null)
  }

  const handleBackFromAssessment = () => {
    window.history.pushState({}, '', '/dashboard')
    setViewingAssessmentId(null)
  }

  const handleLogout = async () => {
    await logout()
    window.history.replaceState({}, '', '/dashboard')
  }

  const handleLogin = async (credentials: Parameters<typeof login>[0]) => {
    await login(credentials)
    setScreen('dashboard')
    window.history.replaceState({}, '', SCREEN_PATHS['dashboard'])
  }

  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} />

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
        {screen === 'dashboard' && viewingAssessmentId !== null && currentUserId !== null ? (
          <AssessmentViewerPage
            assessmentId={viewingAssessmentId}
            currentUserId={currentUserId}
            getDetailUseCase={getAssessmentDetailUseCase}
            transitionUseCase={assessmentTransitionUseCase}
            lockUseCase={assessmentLockUseCase}
            updateUseCase={updateAssessmentUseCase}
            onBack={handleBackFromAssessment}
          />
        ) : screen === 'dashboard' ? (
          <DashboardPage
            listUseCase={listAssessmentsUseCase}
            createUseCase={createAssessmentUseCase}
            getUsersUseCase={getUsersUseCase}
            getTemplatesUseCase={getTemplatesUseCase}
            role={role ?? ''}
            onView={handleViewAssessment}
          />
        ) : screen === 'users' ? (
          <UsersPage
            getUsersUseCase={getUsersUseCase}
            updateRoleUseCase={updateRoleUseCase}
            updateProfileUseCase={updateProfileUseCase}
            currentUserId={currentUserId}
          />
        ) : screen === 'templates' && viewingTemplateId !== null ? (
          <TemplateViewerPage
            templateId={viewingTemplateId}
            getTemplateDetailUseCase={getTemplateDetailUseCase}
            onBack={handleBackFromTemplate}
          />
        ) : (
          <TemplatesPage
            getTemplatesUseCase={getTemplatesUseCase}
            importTemplateUseCase={importTemplateUseCase}
            deleteTemplateUseCase={deleteTemplateUseCase}
            onView={handleViewTemplate}
          />
        )}
      </main>
    </div>
  )
}

export default App
