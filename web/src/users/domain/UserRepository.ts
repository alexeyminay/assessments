import type { UserEntry } from './types'

export interface UserRepository {
  getAll(): Promise<UserEntry[]>
  updateRole(userId: number, role: string): Promise<void>
}
