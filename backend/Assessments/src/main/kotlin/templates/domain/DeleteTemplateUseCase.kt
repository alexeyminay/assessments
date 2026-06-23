package org.example.templates.domain

class DeleteTemplateUseCase(private val repo: TemplateRepository) {
    suspend fun execute(id: Int): Boolean = repo.delete(id)
}
