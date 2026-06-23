package org.example.assessments.domain

import org.example.templates.domain.TemplateDetailDto

class CreateAssessmentUseCase(private val repo: AssessmentRepository) {
    suspend fun execute(req: CreateAssessmentRequest, adminId: Int, snapshot: TemplateDetailDto, templateName: String): Int =
        repo.create(req, adminId, snapshot, templateName)
}

class ListAssessmentsUseCase(private val repo: AssessmentRepository) {
    suspend fun execute(userId: Int, userRole: String, tab: String): List<AssessmentListItem> =
        repo.list(userId, userRole, tab)

    suspend fun counts(userId: Int, userRole: String): AssessmentTabCounts =
        repo.tabCounts(userId, userRole)
}

class GetAssessmentDetailUseCase(private val repo: AssessmentRepository) {
    suspend fun execute(id: Int): AssessmentDetail? = repo.getById(id)
}

class AssessmentTransitionUseCase(private val repo: AssessmentRepository) {
    suspend fun start(id: Int, userId: Int) = repo.start(id, userId)
    suspend fun submit(id: Int, userId: Int) = repo.submit(id, userId)
    suspend fun beginReview(id: Int, userId: Int) = repo.beginReview(id, userId)
    suspend fun complete(id: Int, userId: Int, finalComment: String) = repo.complete(id, userId, finalComment)
}

class AssessmentLockUseCase(private val repo: AssessmentRepository) {
    suspend fun acquire(id: Int, userId: Int) = repo.acquireLock(id, userId)
    suspend fun release(id: Int, userId: Int) = repo.releaseLock(id, userId)
}

class UpdateAssessmentUseCase(private val repo: AssessmentRepository) {
    suspend fun answers(id: Int, userId: Int, answers: List<AnswerDto>) = repo.updateAnswers(id, userId, answers)
    suspend fun comment(id: Int, userId: Int, itemId: Int, text: String) = repo.upsertComment(id, userId, itemId, text)
}
