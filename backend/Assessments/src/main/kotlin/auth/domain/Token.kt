package org.example.auth.domain

data class Token(
    val id: Int,
    val userId: Int,
    val userEmail: String,
    val tokenHash: String,
    val expiresAt: String,
    val createdAt: String
)
