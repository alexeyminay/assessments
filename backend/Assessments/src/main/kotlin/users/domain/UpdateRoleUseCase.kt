package org.example.users.domain

class UpdateRoleUseCase(private val repo: UserManagementRepository) {

    sealed class Result {
        data object Success : Result()
        data object NotFound : Result()
        data object InvalidRole : Result()
    }

    private val allowedRoles = setOf("admin", "user")

    suspend fun execute(userId: Int, role: String): Result {
        if (role !in allowedRoles) return Result.InvalidRole
        return if (repo.updateRole(userId, role)) Result.Success else Result.NotFound
    }
}
