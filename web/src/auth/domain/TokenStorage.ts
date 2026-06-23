import type { Tokens } from './types'

export interface TokenStorage {
  save(tokens: Tokens): void
  getAccessToken(): string | null
  getRefreshToken(): string | null
  getRole(): string | null
  clear(): void
}
