import type { AuthRepository } from './AuthRepository'
import type { TokenStorage } from './TokenStorage'

export class LogoutUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly tokenStorage: TokenStorage,
  ) {}

  async execute(): Promise<void> {
    const refreshToken = this.tokenStorage.getRefreshToken()
    if (refreshToken) {
      await this.authRepo.logout(refreshToken).catch(() => {})
    }
    this.tokenStorage.clear()
  }
}
