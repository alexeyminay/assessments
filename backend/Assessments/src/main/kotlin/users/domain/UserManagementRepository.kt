package org.example.users.domain

interface UserManagementRepository {
    suspend fun findAll(): List<UserEntry>
    suspend fun updateRole(userId: Int, role: String): Boolean
}
