package org.example.auth.domain

interface TokenRepository {
    suspend fun save(token: Token)
    suspend fun findByHash(hash: String): Token?
    suspend fun deleteByHash(hash: String)
    suspend fun rotateToken(oldHash: String, newToken: Token): Token?
}
