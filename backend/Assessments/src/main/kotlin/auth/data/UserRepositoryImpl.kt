package org.example.auth.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.example.auth.domain.User
import org.example.auth.domain.UserRepository
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

class UserRepositoryImpl : UserRepository {

    override suspend fun findByEmail(email: String): User? =
        withContext(Dispatchers.IO) {
            transaction {
                UserTable.selectAll()
                    .where { UserTable.email eq email }
                    .map { row ->
                        User(
                            id = row[UserTable.id],
                            email = row[UserTable.email],
                            passwordHash = row[UserTable.passwordHash],
                            role = row[UserTable.role]
                        )
                    }
                    .singleOrNull()
            }
        }
}
