package org.example.auth.domain

import java.time.Instant
import java.util.UUID

class RefreshTokenUseCase(
    private val tokenRepository: TokenRepository,
    private val userRepository: UserRepository
) {

    sealed class Result {
        data class Success(val userId: Int, val email: String, val role: String, val refreshToken: String) : Result()
        data object InvalidToken : Result()
    }

    suspend fun execute(refreshToken: String): Result {
        val hash = sha256Hex(refreshToken)
        val existing = tokenRepository.findByHash(hash) ?: return Result.InvalidToken

        val now = Instant.now()
        if (Instant.parse(existing.expiresAt).isBefore(now)) {
            tokenRepository.deleteByHash(hash)
            return Result.InvalidToken
        }

        val user = userRepository.findByEmail(existing.userEmail) ?: return Result.InvalidToken

        val newRaw = UUID.randomUUID().toString()
        val newToken = Token(
            id = 0,
            userId = existing.userId,
            userEmail = existing.userEmail,
            tokenHash = sha256Hex(newRaw),
            expiresAt = now.plusSeconds(30L * 24 * 3600).toString(),
            createdAt = now.toString()
        )
        tokenRepository.rotateToken(hash, newToken) ?: return Result.InvalidToken
        return Result.Success(existing.userId, existing.userEmail, user.role, newRaw)
    }
}
