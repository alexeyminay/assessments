package org.example.auth.data

import org.jetbrains.exposed.sql.Table

object UserTable : Table("users") {
    val id = integer("id").autoIncrement()
    val email = varchar("email", 255).uniqueIndex()
    val passwordHash = varchar("password_hash", 255)
    val role = varchar("role", 50)
    val firstName = varchar("first_name", 100).nullable()
    val lastName = varchar("last_name", 100).nullable()

    override val primaryKey = PrimaryKey(id)
}
