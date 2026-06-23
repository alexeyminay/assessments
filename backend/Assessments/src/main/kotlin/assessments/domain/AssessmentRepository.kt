package org.example.assessments.domain

import org.example.templates.domain.TemplateDetailDto

interface AssessmentRepository {
    suspend fun create(req: CreateAssessmentRequest, adminId: Int, snapshot: TemplateDetailDto, templateName: String): Int
    suspend fun list(userId: Int, userRole: String, tab: String): List<AssessmentListItem>
    suspend fun tabCounts(userId: Int, userRole: String): AssessmentTabCounts
    suspend fun getById(id: Int): AssessmentDetail?

    suspend fun start(id: Int, userId: Int): TransitionResult
    suspend fun submit(id: Int, userId: Int): TransitionResult
    suspend fun beginReview(id: Int, userId: Int): TransitionResult
    suspend fun complete(id: Int, userId: Int, finalComment: String): TransitionResult

    suspend fun acquireLock(id: Int, userId: Int): LockResult
    suspend fun releaseLock(id: Int, userId: Int): Boolean

    suspend fun updateAnswers(id: Int, userId: Int, answers: List<AnswerDto>): UpdateResult
    suspend fun upsertComment(id: Int, userId: Int, itemId: Int, text: String): UpdateResult
}
