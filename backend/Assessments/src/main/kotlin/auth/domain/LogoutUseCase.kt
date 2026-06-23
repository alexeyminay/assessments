package org.example.auth.domain

class LogoutUseCase(private val tokenRepository: TokenRepository) {
    suspend fun execute(refreshToken: String) {
        tokenRepository.deleteByHash(sha256Hex(refreshToken))
    }
}
