package org.example.auth.presentation

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import org.example.auth.data.UserTable
import org.example.auth.domain.LoginUseCase
import org.example.auth.domain.LogoutUseCase
import org.example.auth.domain.RefreshTokenUseCase
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.Date

@Serializable
private data class RefreshRequest(@SerialName("refresh_token") val refreshToken: String)

@Serializable
private data class LogoutRequest(@SerialName("refresh_token") val refreshToken: String)

@Serializable
private data class MeResponse(val email: String, val firstName: String?, val lastName: String?)

fun Route.authRoutes(
    loginUseCase: LoginUseCase,
    refreshTokenUseCase: RefreshTokenUseCase,
    logoutUseCase: LogoutUseCase,
    jwtSecret: String = System.getenv("JWT_SECRET") ?: "change-me-in-production"
) {
    fun buildJwt(userId: Int, email: String, role: String): String =
        JWT.create()
            .withSubject(userId.toString())
            .withClaim("email", email)
            .withClaim("role", role)
            .withExpiresAt(Date(System.currentTimeMillis() + 86_400_000L))
            .sign(Algorithm.HMAC256(jwtSecret))

    post("/login") {
        val request = call.receive<LoginRequest>()
        when (val result = loginUseCase.execute(request.email, request.password)) {
            is LoginUseCase.Result.Success -> {
                val accessToken = buildJwt(result.userId, result.email, result.role)
                call.respond(LoginResponse(accessToken, result.refreshToken, result.role))
            }
            LoginUseCase.Result.InvalidCredentials ->
                call.respond(HttpStatusCode.Unauthorized, ErrorResponse("Неверный email или пароль"))
        }
    }

    post("/refresh") {
        val request = call.receive<RefreshRequest>()
        when (val result = refreshTokenUseCase.execute(request.refreshToken)) {
            is RefreshTokenUseCase.Result.Success -> {
                val accessToken = buildJwt(result.userId, result.email, result.role)
                call.respond(LoginResponse(accessToken, result.refreshToken, result.role))
            }
            RefreshTokenUseCase.Result.InvalidToken ->
                call.respond(HttpStatusCode.Unauthorized, ErrorResponse("Недействительный или просроченный токен обновления"))
        }
    }

    post("/logout") {
        val request = call.receive<LogoutRequest>()
        logoutUseCase.execute(request.refreshToken)
        call.respond(HttpStatusCode.OK)
    }

    get("/me") {
        val ctx = call.requireAuth() ?: return@get
        val row = transaction {
            UserTable.selectAll().where { UserTable.id eq ctx.userId }.singleOrNull()
        } ?: return@get call.respond(HttpStatusCode.NotFound, ErrorResponse("Пользователь не найден"))
        call.respond(MeResponse(row[UserTable.email], row[UserTable.firstName], row[UserTable.lastName]))
    }
}
