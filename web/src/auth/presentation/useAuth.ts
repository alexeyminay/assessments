import { useCallback, useState } from 'react'
import type { LoginUseCase } from '../domain/LoginUseCase'
import type { LogoutUseCase } from '../domain/LogoutUseCase'
import type { TokenStorage } from '../domain/TokenStorage'
import type { Credentials } from '../domain/types'

export function useAuth(
  loginUseCase: LoginUseCase,
  logoutUseCase: LogoutUseCase,
  tokenStorage: TokenStorage,
) {
  const [accessToken, setAccessToken] = useState<string | null>(
    () => tokenStorage.getAccessToken(),
  )
  const [role, setRole] = useState<string | null>(() => tokenStorage.getRole())

  const login = async (credentials: Credentials): Promise<void> => {
    await loginUseCase.execute(credentials)
    setAccessToken(tokenStorage.getAccessToken())
    setRole(tokenStorage.getRole())
  }

  const logout = async (): Promise<void> => {
    await logoutUseCase.execute()
    setAccessToken(null)
    setRole(null)
  }

  const forceLogout = useCallback((): void => {
    tokenStorage.clear()
    setAccessToken(null)
    setRole(null)
  }, [tokenStorage])

  return {
    isAuthenticated: accessToken !== null,
    accessToken,
    role,
    login,
    logout,
    forceLogout,
  }
}
