package org.example.templates.presentation

import io.ktor.http.*
import io.ktor.http.content.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.utils.io.readRemaining
import kotlinx.io.readByteArray
import kotlinx.serialization.Serializable
import org.example.auth.presentation.ErrorResponse
import org.example.auth.presentation.requireAdmin
import org.example.templates.data.AssessmentTemplateParser
import org.example.templates.data.XlsxParser
import org.example.templates.domain.DeleteTemplateUseCase
import org.example.templates.domain.GetTemplateDetailUseCase
import org.example.templates.domain.GetTemplatesUseCase
import org.example.templates.domain.ImportResult
import org.example.templates.domain.ImportTemplateUseCase

@Serializable
private data class ImportResponse(val id: Int, val name: String, val itemCount: Int)

fun Route.templateRoutes(
    getTemplatesUseCase: GetTemplatesUseCase,
    importTemplateUseCase: ImportTemplateUseCase,
    deleteTemplateUseCase: DeleteTemplateUseCase,
    getTemplateDetailUseCase: GetTemplateDetailUseCase,
) {
    route("/templates") {

        get {
            call.requireAdmin() ?: return@get
            call.respond(getTemplatesUseCase.execute())
        }

        post {
            call.requireAdmin() ?: return@post

            val multipart = call.receiveMultipart()
            var name: String? = null
            var fileBytes: ByteArray? = null

            multipart.forEachPart { part ->
                when {
                    part is PartData.FormItem && part.name == "name" -> name = part.value.trim()
                    part is PartData.FileItem && part.name == "file" -> fileBytes = part.provider().readRemaining().readByteArray()
                }
                part.dispose()
            }

            val templateName = name?.takeIf { it.isNotEmpty() }
                ?: return@post call.respond(HttpStatusCode.BadRequest, ErrorResponse("Название шаблона обязательно"))
            val bytes = fileBytes
                ?: return@post call.respond(HttpStatusCode.BadRequest, ErrorResponse("Файл не получен"))

            val rows = runCatching { XlsxParser.parse(bytes.inputStream()) }
                .getOrElse {
                    return@post call.respond(
                        HttpStatusCode.UnprocessableEntity,
                        ErrorResponse("Ошибка чтения файла: ${it.message}")
                    )
                }

            val parsed = runCatching { AssessmentTemplateParser.parse(rows) }
                .getOrElse {
                    return@post call.respond(
                        HttpStatusCode.UnprocessableEntity,
                        ErrorResponse("Ошибка разбора структуры: ${it.message}")
                    )
                }

            if (parsed.skillGroups.isEmpty())
                return@post call.respond(
                    HttpStatusCode.UnprocessableEntity,
                    ErrorResponse("Файл не содержит данных")
                )

            val result = importTemplateUseCase.execute(templateName, parsed) as ImportResult.Success
            call.respond(HttpStatusCode.Created, ImportResponse(result.templateId, templateName, result.itemCount))
        }

        get("/{id}") {
            call.requireAdmin() ?: return@get
            val id = call.parameters["id"]?.toIntOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest, ErrorResponse("Некорректный id"))
            val detail = getTemplateDetailUseCase.execute(id)
                ?: return@get call.respond(HttpStatusCode.NotFound, ErrorResponse("Шаблон не найден"))
            call.respond(detail)
        }

        delete("/{id}") {
            call.requireAdmin() ?: return@delete
            val id = call.parameters["id"]?.toIntOrNull()
                ?: return@delete call.respond(HttpStatusCode.BadRequest, ErrorResponse("Некорректный id"))
            if (deleteTemplateUseCase.execute(id)) {
                call.respond(HttpStatusCode.NoContent)
            } else {
                call.respond(HttpStatusCode.NotFound, ErrorResponse("Шаблон не найден"))
            }
        }
    }
}
