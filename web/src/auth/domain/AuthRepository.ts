import type { Credentials, Tokens } from './types'

export interface AuthRepository {
  login(credentials: Credentials): Promise<Tokens>
  refresh(refreshToken: string): Promise<Tokens>
  logout(refreshToken: string): Promise<void>
}
