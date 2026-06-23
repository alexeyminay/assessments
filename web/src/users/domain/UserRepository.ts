import type { UserEntry } from './types'

export interface UserRepository {
  getAll(): Promise<UserEntry[]>
  updateRole(userId: number, role: string): Promise<void>
  updateProfile(userId: number, firstName: string, lastName: string): Promise<void>
}
