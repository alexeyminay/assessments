import type { AuthRepository } from '../domain/AuthRepository'
import type { Credentials, Tokens } from '../domain/types'

const BASE = '/api'

export class HttpAuthRepository implements AuthRepository {
  async login(credentials: Credentials): Promise<Tokens> {
    const res = await fetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Login failed')
    }
    const data = await res.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      role: data.role,
    }
  }

  async refresh(refreshToken: string): Promise<Tokens> {
    const res = await fetch(`${BASE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Token refresh failed')
    }
    const data = await res.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      role: data.role,
    }
  }

  async logout(refreshToken: string): Promise<void> {
    await fetch(`${BASE}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  }
}
