import type { UserRepository } from './UserRepository'

export class UpdateRoleUseCase {
  constructor(private readonly repo: UserRepository) {}
  execute(userId: number, role: string): Promise<void> { return this.repo.updateRole(userId, role) }
}
