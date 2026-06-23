package org.example.users.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.example.auth.data.UserTable
import org.example.users.domain.UserEntry
import org.example.users.domain.UserManagementRepository
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

class UserManagementRepositoryImpl : UserManagementRepository {

    override suspend fun findAll(): List<UserEntry> = withContext(Dispatchers.IO) {
        transaction {
            UserTable.selectAll()
                .orderBy(UserTable.id)
                .map { row ->
                    UserEntry(
                        id    = row[UserTable.id],
                        email = row[UserTable.email],
                        role  = row[UserTable.role]
                    )
                }
        }
    }

    override suspend fun updateRole(userId: Int, role: String): Boolean = withContext(Dispatchers.IO) {
        transaction {
            UserTable.update({ UserTable.id eq userId }) {
                it[UserTable.role] = role
            } > 0
        }
    }
}
