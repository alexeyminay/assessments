import type { UserRepository } from './UserRepository'

export class UpdateProfileUseCase {
  constructor(private readonly repo: UserRepository) {}

  async execute(userId: number, firstName: string, lastName: string): Promise<void> {
    await this.repo.updateProfile(userId, firstName, lastName)
  }
}
