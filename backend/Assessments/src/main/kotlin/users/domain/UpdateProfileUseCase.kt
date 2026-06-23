package org.example.users.domain

class UpdateProfileUseCase(private val repo: UserManagementRepository) {

    sealed class Result {
        data object Success : Result()
        data object NotFound : Result()
    }

    suspend fun execute(userId: Int, firstName: String?, lastName: String?): Result =
        if (repo.updateProfile(userId, firstName, lastName)) Result.Success else Result.NotFound
}
