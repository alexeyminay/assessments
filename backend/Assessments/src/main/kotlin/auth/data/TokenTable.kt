package org.example.auth.data

import org.jetbrains.exposed.sql.Table

object TokenTable : Table("tokens") {
    val id = integer("id").autoIncrement()
    val userId = integer("user_id").references(UserTable.id)
    val userEmail = varchar("user_email", 255)
    val tokenHash = varchar("token_hash", 64).uniqueIndex()
    val expiresAt = varchar("expires_at", 50)
    val createdAt = varchar("created_at", 50)

    override val primaryKey = PrimaryKey(id)
}
