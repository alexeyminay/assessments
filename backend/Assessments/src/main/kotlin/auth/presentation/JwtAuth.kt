package org.example.auth.presentation

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

data class AuthContext(val userId: Int, val email: String, val role: String)

private val jwtSecret get() = System.getenv("JWT_SECRET") ?: "change-me-in-production"

suspend fun RoutingCall.requireAuth(): AuthContext? {
    val header = request.headers["Authorization"] ?: run {
        respond(HttpStatusCode.Unauthorized, ErrorResponse("Требуется авторизация"))
        return null
    }
    val token = header.removePrefix("Bearer ").trim()
    return try {
        val decoded = JWT.require(Algorithm.HMAC256(jwtSecret)).build().verify(token)
        AuthContext(
            userId = decoded.subject.toInt(),
            email  = decoded.getClaim("email").asString(),
            role   = decoded.getClaim("role").asString()
        )
    } catch (e: Exception) {
        respond(HttpStatusCode.Unauthorized, ErrorResponse("Недействительный токен"))
        null
    }
}

suspend fun RoutingCall.requireAdmin(): AuthContext? {
    val ctx = requireAuth() ?: return null
    if (ctx.role != "admin") {
        respond(HttpStatusCode.Forbidden, ErrorResponse("Недостаточно прав"))
        return null
    }
    return ctx
}
