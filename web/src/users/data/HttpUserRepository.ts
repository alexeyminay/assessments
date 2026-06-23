import type { AuthFetch } from '../../auth/data/AuthFetch'
import type { UserRepository } from '../domain/UserRepository'
import type { UserEntry } from '../domain/types'

const BASE = '/api'

export class HttpUserRepository implements UserRepository {
  constructor(private readonly authFetch: AuthFetch) {}

  async getAll(): Promise<UserEntry[]> {
    const res = await this.authFetch.fetch(`${BASE}/users`)
    if (!res.ok) throw new Error('Не удалось загрузить пользователей')
    return res.json()
  }

  async updateRole(userId: number, role: string): Promise<void> {
    const res = await this.authFetch.fetch(`${BASE}/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Не удалось изменить роль')
    }
  }

  async updateProfile(userId: number, firstName: string, lastName: string): Promise<void> {
    const res = await this.authFetch.fetch(`${BASE}/users/${userId}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Не удалось сохранить профиль')
    }
  }
}
