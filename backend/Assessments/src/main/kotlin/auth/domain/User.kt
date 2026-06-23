package org.example.auth.domain

data class User(
    val id: Int,
    val email: String,
    val passwordHash: String,
    val role: String
)
