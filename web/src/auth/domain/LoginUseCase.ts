import type { AuthRepository } from './AuthRepository'
import type { TokenStorage } from './TokenStorage'
import type { Credentials } from './types'

export class LoginUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly tokenStorage: TokenStorage,
  ) {}

  async execute(credentials: Credentials): Promise<void> {
    const tokens = await this.authRepo.login(credentials)
    this.tokenStorage.save(tokens)
  }
}
