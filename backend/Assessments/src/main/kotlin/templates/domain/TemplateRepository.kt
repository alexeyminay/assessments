package org.example.templates.domain

interface TemplateRepository {
    suspend fun importTemplate(name: String, parsed: ParsedTemplate): ImportResult
    suspend fun getAll(): List<AssessmentTemplate>
    suspend fun getById(id: Int): TemplateDetailDto?
    suspend fun delete(id: Int): Boolean
}

sealed class ImportResult {
    data class Success(val templateId: Int, val itemCount: Int) : ImportResult()
}
