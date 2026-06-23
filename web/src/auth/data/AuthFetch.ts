import type { TokenStorage } from '../domain/TokenStorage'

const BASE = '/api'

export class AuthFetch {
  onUnauthenticated: (() => void) | null = null
  private refreshPromise: Promise<boolean> | null = null

  constructor(private readonly tokenStorage: TokenStorage) {}

  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const token = this.tokenStorage.getAccessToken()
    const res = await fetch(input, this.withAuth(init, token))

    if (res.status !== 401) return res

    const refreshToken = this.tokenStorage.getRefreshToken()
    if (!refreshToken) {
      this.onUnauthenticated?.()
      return res
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.doRefresh(refreshToken).finally(() => {
        this.refreshPromise = null
      })
    }

    const refreshed = await this.refreshPromise
    if (!refreshed) return res

    const newToken = this.tokenStorage.getAccessToken()
    return fetch(input, this.withAuth(init, newToken))
  }

  private async doRefresh(refreshToken: string): Promise<boolean> {
    try {
      const refreshRes = await fetch(`${BASE}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!refreshRes.ok) {
        this.tokenStorage.clear()
        this.onUnauthenticated?.()
        return false
      }

      const data = await refreshRes.json()
      this.tokenStorage.save({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        role: data.role,
      })
      return true
    } catch {
      this.tokenStorage.clear()
      this.onUnauthenticated?.()
      return false
    }
  }

  private withAuth(init: RequestInit | undefined, token: string | null): RequestInit {
    return {
      ...init,
      headers: {
        ...init?.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  }
}
