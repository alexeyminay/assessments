import type { TokenStorage } from '../domain/TokenStorage'
import type { Tokens } from '../domain/types'

export class LocalStorageTokenStorage implements TokenStorage {
  private readonly ACCESS_KEY = 'access_token'
  private readonly REFRESH_KEY = 'refresh_token'
  private readonly ROLE_KEY = 'role'

  save(tokens: Tokens): void {
    localStorage.setItem(this.ACCESS_KEY, tokens.accessToken)
    localStorage.setItem(this.REFRESH_KEY, tokens.refreshToken)
    localStorage.setItem(this.ROLE_KEY, tokens.role)
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY)
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY)
  }

  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY)
  }

  clear(): void {
    localStorage.removeItem(this.ACCESS_KEY)
    localStorage.removeItem(this.REFRESH_KEY)
    localStorage.removeItem(this.ROLE_KEY)
  }
}
