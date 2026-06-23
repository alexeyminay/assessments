package org.example.users.presentation

import io.ktor.http.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.example.auth.presentation.ErrorResponse
import org.example.auth.presentation.requireAdmin
import org.example.users.domain.GetUsersUseCase
import org.example.users.domain.UpdateRoleUseCase
import org.example.users.domain.UpdateProfileUseCase
import io.ktor.server.request.*

@Serializable
private data class UserResponse(
    val id: Int, val email: String, val role: String,
    val firstName: String?, val lastName: String?
)

@Serializable
private data class UpdateRoleRequest(val role: String)

@Serializable
private data class UpdateProfileRequest(val firstName: String?, val lastName: String?)

fun Route.userRoutes(
    getUsersUseCase: GetUsersUseCase,
    updateRoleUseCase: UpdateRoleUseCase,
    updateProfileUseCase: UpdateProfileUseCase,
) {
    get("/users") {
        call.requireAdmin() ?: return@get
        val users = getUsersUseCase.execute()
        call.respond(users.map { UserResponse(it.id, it.email, it.role, it.firstName, it.lastName) })
    }

    patch("/users/{id}/role") {
        call.requireAdmin() ?: return@patch
        val userId = call.parameters["id"]?.toIntOrNull() ?: run {
            call.respond(HttpStatusCode.BadRequest, ErrorResponse("Неверный id"))
            return@patch
        }
        val body = call.receive<UpdateRoleRequest>()
        when (updateRoleUseCase.execute(userId, body.role)) {
            UpdateRoleUseCase.Result.Success     -> call.respond(HttpStatusCode.OK)
            UpdateRoleUseCase.Result.NotFound    -> call.respond(HttpStatusCode.NotFound, ErrorResponse("Пользователь не найден"))
            UpdateRoleUseCase.Result.InvalidRole -> call.respond(HttpStatusCode.BadRequest, ErrorResponse("Недопустимая роль"))
        }
    }

    patch("/users/{id}/profile") {
        call.requireAdmin() ?: return@patch
        val userId = call.parameters["id"]?.toIntOrNull() ?: run {
            call.respond(HttpStatusCode.BadRequest, ErrorResponse("Неверный id"))
            return@patch
        }
        val body = call.receive<UpdateProfileRequest>()
        when (updateProfileUseCase.execute(userId, body.firstName, body.lastName)) {
            UpdateProfileUseCase.Result.Success  -> call.respond(HttpStatusCode.OK)
            UpdateProfileUseCase.Result.NotFound -> call.respond(HttpStatusCode.NotFound, ErrorResponse("Пользователь не найден"))
        }
    }
}
