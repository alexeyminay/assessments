package org.example.auth.domain

import java.time.Instant
import java.util.UUID

class LoginUseCase(
    private val userRepository: UserRepository,
    private val tokenRepository: TokenRepository,
    private val passwordHasher: PasswordHasher
) {

    sealed class Result {
        data class Success(val userId: Int, val email: String, val role: String, val refreshToken: String) : Result()
        data object InvalidCredentials : Result()
    }

    suspend fun execute(email: String, password: String): Result {
        val user = userRepository.findByEmail(email) ?: return Result.InvalidCredentials
        if (!passwordHasher.verify(password, user.passwordHash)) return Result.InvalidCredentials

        val rawToken = UUID.randomUUID().toString()
        val now = Instant.now()
        tokenRepository.save(
            Token(
                id = 0,
                userId = user.id,
                userEmail = user.email,
                tokenHash = sha256Hex(rawToken),
                expiresAt = now.plusSeconds(30L * 24 * 3600).toString(),
                createdAt = now.toString()
            )
        )
        return Result.Success(user.id, user.email, user.role, rawToken)
    }
}
