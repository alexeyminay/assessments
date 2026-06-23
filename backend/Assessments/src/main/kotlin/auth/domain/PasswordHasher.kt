package org.example.auth.domain

interface PasswordHasher {
    fun verify(rawPassword: String, hash: String): Boolean
}
