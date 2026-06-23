package org.example.templates.domain

class ImportTemplateUseCase(private val repo: TemplateRepository) {
    suspend fun execute(name: String, parsed: ParsedTemplate): ImportResult =
        repo.importTemplate(name, parsed)
}
