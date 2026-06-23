package org.example.assessments.presentation

import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.example.assessments.domain.*
import org.example.auth.presentation.ErrorResponse
import org.example.auth.presentation.requireAdmin
import org.example.auth.presentation.requireAuth
import org.example.templates.domain.GetTemplateDetailUseCase

fun Route.assessmentRoutes(
    createUseCase: CreateAssessmentUseCase,
    listUseCase: ListAssessmentsUseCase,
    getDetailUseCase: GetAssessmentDetailUseCase,
    transitionUseCase: AssessmentTransitionUseCase,
    lockUseCase: AssessmentLockUseCase,
    updateUseCase: UpdateAssessmentUseCase,
    getTemplateDetailUseCase: GetTemplateDetailUseCase,
) {
    route("/assessments") {

        get {
            val ctx = call.requireAuth() ?: return@get
            val tab = call.request.queryParameters["tab"] ?: "all"
            call.respond(listUseCase.execute(ctx.userId, ctx.role, tab))
        }

        get("/counts") {
            val ctx = call.requireAuth() ?: return@get
            call.respond(listUseCase.counts(ctx.userId, ctx.role))
        }

        post {
            val ctx = call.requireAdmin() ?: return@post
            val req = call.receive<CreateAssessmentRequest>()

            val template = getTemplateDetailUseCase.execute(req.templateId)
                ?: return@post call.respond(HttpStatusCode.BadRequest, ErrorResponse("Шаблон не найден"))

            if (req.reviewerIds.isEmpty() || req.reviewerIds.size > 3)
                return@post call.respond(HttpStatusCode.BadRequest, ErrorResponse("Требуется от 1 до 3 проверяющих"))

            val id = createUseCase.execute(req, ctx.userId, template, template.name)
            call.respond(HttpStatusCode.Created, mapOf("id" to id))
        }

        get("/{id}") {
            call.requireAuth() ?: return@get
            val id = call.parameters["id"]?.toIntOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest, ErrorResponse("Некорректный id"))
            val detail = getDetailUseCase.execute(id)
                ?: return@get call.respond(HttpStatusCode.NotFound, ErrorResponse("Ассессмент не найден"))
            call.respond(detail)
        }

        post("/{id}/start") {
            val ctx = call.requireAuth() ?: return@post
            val id = call.parameters["id"]?.toIntOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, ErrorResponse("Некорректный id"))
            when (transitionUseCase.start(id, ctx.userId)) {
                TransitionResult.Success              -> call.respond(HttpStatusCode.OK)
                TransitionResult.NotFound             -> call.respond(HttpStatusCode.NotFound, ErrorResponse("Ассессмент не найден"))
                TransitionResult.Forbidden            -> call.respond(HttpStatusCode.Forbidden, ErrorResponse("Нет доступа"))
                is TransitionResult.InvalidTransition -> call.respond(HttpStatusCode.Conflict, ErrorResponse("Недопустимый переход статуса"))
            }
        }

        post("/{id}/submit") {
            val ctx = call.requireAuth() ?: return@post
            val id = call.parameters["id"]?.toIntOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, ErrorResponse("Некорректный id"))
            when (transitionUseCase.submit(id, ctx.userId)) {
                TransitionResult.Success              -> call.respond(HttpStatusCode.OK)
                TransitionResult.NotFound             -> call.respond(HttpStatusCode.NotFound, ErrorResponse("Ассессмент не найден"))
                TransitionResult.Forbidden            -> call.respond(HttpStatusCode.Forbidden, ErrorResponse("Нет доступа"))
                is TransitionResult.InvalidTransition -> call.respond(HttpStatusCode.Conflict, ErrorResponse("Недопустимый переход статуса"))
            }
        }

        post("/{id}/begin-review") {
            val ctx = call.requireAuth() ?: return@post
            val id = call.parameters["id"]?.toIntOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, ErrorResponse("Некорректный id"))
            when (transitionUseCase.beginReview(id, ctx.userId)) {
                TransitionResult.Success              -> call.respond(HttpStatusCode.OK)
                TransitionResult.NotFound             -> call.respond(HttpStatusCode.NotFound, ErrorResponse("Ассессмент не найден"))
                TransitionResult.Forbidden            -> call.respond(HttpStatusCode.Forbidden, ErrorResponse("Нет доступа"))
                is TransitionResult.InvalidTransition -> call.respond(HttpStatusCode.Conflict, ErrorResponse("Недопустимый переход статуса"))
            }
        }

        post("/{id}/complete") {
            val ctx = call.requireAuth() ?: return@post
            val id = call.parameters["id"]?.toIntOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, ErrorResponse("Некорректный id"))
            val req = call.receive<CompleteAssessmentRequest>()
            when (transitionUseCase.complete(id, ctx.userId, req.finalComment)) {
                TransitionResult.Success              -> call.respond(HttpStatusCode.OK)
                TransitionResult.NotFound             -> call.respond(HttpStatusCode.NotFound, ErrorResponse("Ассессмент не найден"))
                TransitionResult.Forbidden            -> call.respond(HttpStatusCode.Forbidden, ErrorResponse("Нет доступа"))
                is TransitionResult.InvalidTransition -> call.respond(HttpStatusCode.Conflict, ErrorResponse("Недопустимый переход статуса"))
            }
        }

        post("/{id}/lock") {
            val ctx = call.requireAuth() ?: return@post
            val id = call.parameters["id"]?.toIntOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, ErrorResponse("Некорректный id"))
            when (val result = lockUseCase.acquire(id, ctx.userId)) {
                LockResult.Acquired      -> call.respond(HttpStatusCode.OK)
                LockResult.AlreadyOwned  -> call.respond(HttpStatusCode.OK)
                LockResult.NotFound      -> call.respond(HttpStatusCode.NotFound, ErrorResponse("Ассессмент не найден"))
                LockResult.Forbidden     -> call.respond(HttpStatusCode.Forbidden, ErrorResponse("Нет доступа"))
                is LockResult.LockedByOther -> call.respond(
                    HttpStatusCode.Conflict,
                    mapOf("error" to "Редактируется пользователем ${result.email}", "expiresAt" to result.expiresAt)
                )
            }
        }

        delete("/{id}/lock") {
            val ctx = call.requireAuth() ?: return@delete
            val id = call.parameters["id"]?.toIntOrNull()
                ?: return@delete call.respond(HttpStatusCode.BadRequest, ErrorResponse("Некорректный id"))
            lockUseCase.release(id, ctx.userId)
            call.respond(HttpStatusCode.NoContent)
        }

        put("/{id}/answers") {
            val ctx = call.requireAuth() ?: return@put
            val id = call.parameters["id"]?.toIntOrNull()
                ?: return@put call.respond(HttpStatusCode.BadRequest, ErrorResponse("Некорректный id"))
            val req = call.receive<UpdateAnswersRequest>()
            when (val result = updateUseCase.answers(id, ctx.userId, req.answers)) {
                UpdateResult.Success    -> call.respond(HttpStatusCode.OK)
                UpdateResult.NotFound   -> call.respond(HttpStatusCode.NotFound, ErrorResponse("Ассессмент не найден"))
                UpdateResult.Forbidden  -> call.respond(HttpStatusCode.Forbidden, ErrorResponse("Нет доступа"))
                is UpdateResult.LockRequired -> call.respond(
                    HttpStatusCode.Conflict,
                    mapOf("error" to "Требуется захват блокировки", "lockedByEmail" to result.lockedByEmail, "expiresAt" to result.expiresAt)
                )
            }
        }

        put("/{id}/comment/{itemId}") {
            val ctx = call.requireAuth() ?: return@put
            val id = call.parameters["id"]?.toIntOrNull()
                ?: return@put call.respond(HttpStatusCode.BadRequest, ErrorResponse("Некорректный id"))
            val itemId = call.parameters["itemId"]?.toIntOrNull()
                ?: return@put call.respond(HttpStatusCode.BadRequest, ErrorResponse("Некорректный itemId"))
            val req = call.receive<UpdateCommentRequest>()
            when (val result = updateUseCase.comment(id, ctx.userId, itemId, req.text)) {
                UpdateResult.Success    -> call.respond(HttpStatusCode.OK)
                UpdateResult.NotFound   -> call.respond(HttpStatusCode.NotFound, ErrorResponse("Ассессмент не найден"))
                UpdateResult.Forbidden  -> call.respond(HttpStatusCode.Forbidden, ErrorResponse("Нет доступа"))
                is UpdateResult.LockRequired -> call.respond(
                    HttpStatusCode.Conflict,
                    mapOf("error" to "Требуется захват блокировки", "lockedByEmail" to result.lockedByEmail, "expiresAt" to result.expiresAt)
                )
            }
        }
    }
}
