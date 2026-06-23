package org.example.templates.domain

class GetTemplateDetailUseCase(private val repo: TemplateRepository) {
    suspend fun execute(id: Int): TemplateDetailDto? = repo.getById(id)
}
