package org.example

import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.cio.*
import io.ktor.server.engine.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.routing.*
import org.example.auth.data.BcryptPasswordHasher
import org.example.auth.data.DatabaseFactory
import org.example.auth.data.TokenRepositoryImpl
import org.example.auth.data.UserRepositoryImpl
import org.example.auth.domain.LoginUseCase
import org.example.auth.domain.LogoutUseCase
import org.example.auth.domain.RefreshTokenUseCase
import org.example.auth.presentation.authRoutes
import org.example.users.data.UserManagementRepositoryImpl
import org.example.users.domain.GetUsersUseCase
import org.example.users.domain.UpdateRoleUseCase
import org.example.users.presentation.userRoutes
import org.example.templates.data.TemplateRepositoryImpl
import org.example.templates.domain.DeleteTemplateUseCase
import org.example.templates.domain.GetTemplateDetailUseCase
import org.example.templates.domain.GetTemplatesUseCase
import org.example.templates.domain.ImportTemplateUseCase
import org.example.templates.presentation.templateRoutes

fun main() {
    DatabaseFactory.init()

    val userRepository = UserRepositoryImpl()
    val tokenRepository = TokenRepositoryImpl()
    val passwordHasher = BcryptPasswordHasher()
    val loginUseCase = LoginUseCase(userRepository, tokenRepository, passwordHasher)
    val refreshTokenUseCase = RefreshTokenUseCase(tokenRepository, userRepository)
    val logoutUseCase = LogoutUseCase(tokenRepository)

    val userManagementRepository = UserManagementRepositoryImpl()
    val getUsersUseCase = GetUsersUseCase(userManagementRepository)
    val updateRoleUseCase = UpdateRoleUseCase(userManagementRepository)

    val templateRepository = TemplateRepositoryImpl()
    val getTemplatesUseCase = GetTemplatesUseCase(templateRepository)
    val importTemplateUseCase = ImportTemplateUseCase(templateRepository)
    val deleteTemplateUseCase = DeleteTemplateUseCase(templateRepository)
    val getTemplateDetailUseCase = GetTemplateDetailUseCase(templateRepository)

    embeddedServer(CIO, port = 8080) {
        install(ContentNegotiation) { json() }
        routing {
            authRoutes(loginUseCase, refreshTokenUseCase, logoutUseCase)
            userRoutes(getUsersUseCase, updateRoleUseCase)
            templateRoutes(getTemplatesUseCase, importTemplateUseCase, deleteTemplateUseCase, getTemplateDetailUseCase)
        }
    }.start(wait = true)
}
