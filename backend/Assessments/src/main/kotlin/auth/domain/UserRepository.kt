package org.example.auth.domain

interface UserRepository {
    suspend fun findByEmail(email: String): User?
}
