package org.example.templates.domain

class GetTemplatesUseCase(private val repo: TemplateRepository) {
    suspend fun execute(): List<AssessmentTemplate> = repo.getAll()
}
