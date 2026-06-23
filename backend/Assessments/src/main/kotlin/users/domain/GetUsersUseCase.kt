package org.example.users.domain

class GetUsersUseCase(private val repo: UserManagementRepository) {
    suspend fun execute(): List<UserEntry> = repo.findAll()
}
