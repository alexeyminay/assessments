import type { UserRepository } from './UserRepository'
import type { UserEntry } from './types'

export class GetUsersUseCase {
  constructor(private readonly repo: UserRepository) {}
  execute(): Promise<UserEntry[]> { return this.repo.getAll() }
}
