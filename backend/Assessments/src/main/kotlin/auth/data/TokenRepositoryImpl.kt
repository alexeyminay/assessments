package org.example.auth.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.example.auth.domain.Token
import org.example.auth.domain.TokenRepository
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

class TokenRepositoryImpl : TokenRepository {

    override suspend fun save(token: Token) = withContext(Dispatchers.IO) {
        transaction {
            TokenTable.insert {
                it[userId] = token.userId
                it[userEmail] = token.userEmail
                it[tokenHash] = token.tokenHash
                it[expiresAt] = token.expiresAt
                it[createdAt] = token.createdAt
            }
        }
        Unit
    }

    override suspend fun findByHash(hash: String): Token? = withContext(Dispatchers.IO) {
        transaction {
            TokenTable.selectAll()
                .where { TokenTable.tokenHash eq hash }
                .map { row ->
                    Token(
                        id = row[TokenTable.id],
                        userId = row[TokenTable.userId],
                        userEmail = row[TokenTable.userEmail],
                        tokenHash = row[TokenTable.tokenHash],
                        expiresAt = row[TokenTable.expiresAt],
                        createdAt = row[TokenTable.createdAt]
                    )
                }
                .singleOrNull()
        }
    }

    override suspend fun deleteByHash(hash: String) = withContext(Dispatchers.IO) {
        transaction { TokenTable.deleteWhere { TokenTable.tokenHash eq hash } }
        Unit
    }

    override suspend fun rotateToken(oldHash: String, newToken: Token): Token? = withContext(Dispatchers.IO) {
        transaction {
            val deleted = TokenTable.deleteWhere { TokenTable.tokenHash eq oldHash }
            if (deleted == 0) return@transaction null
            TokenTable.insert {
                it[userId] = newToken.userId
                it[userEmail] = newToken.userEmail
                it[tokenHash] = newToken.tokenHash
                it[expiresAt] = newToken.expiresAt
                it[createdAt] = newToken.createdAt
            }
            newToken
        }
    }
}
