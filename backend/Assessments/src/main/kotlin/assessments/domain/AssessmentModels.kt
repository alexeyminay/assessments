package org.example.assessments.domain

import kotlinx.serialization.Serializable

@Serializable
data class UserInfo(val id: Int, val email: String, val firstName: String?, val lastName: String?)

@Serializable
data class AnswerDto(val itemId: Int, val checked: Boolean)

@Serializable
data class CommentDto(
    val itemId: Int,
    val text: String,
    val authorId: Int,
    val authorEmail: String,
    val updatedAt: String,
)

@Serializable
data class AssessmentListItem(
    val id: Int,
    val templateName: String,
    val assessee: UserInfo,
    val status: String,
    val createdAt: String,
    val completedAt: String?,
    val lockUserEmail: String?,
    val lockExpiresAt: String?,
)

@Serializable
data class AssessmentTabCounts(val all: Int, val review: Int, val mine: Int)

@Serializable
data class AssessmentDetail(
    val id: Int,
    val templateName: String,
    val assessee: UserInfo,
    val assignedBy: UserInfo,
    val reviewers: List<UserInfo>,
    val status: String,
    val snapshotJson: String,
    val answers: List<AnswerDto>,
    val comments: List<CommentDto>,
    val finalComment: String?,
    val lockUserId: Int?,
    val lockUserEmail: String?,
    val lockExpiresAt: String?,
    val createdAt: String,
    val startedAt: String?,
    val submittedAt: String?,
    val reviewStartedAt: String?,
    val completedAt: String?,
)

@Serializable
data class CreateAssessmentRequest(
    val templateId: Int,
    val assesseeId: Int,
    val reviewerIds: List<Int>,
)

@Serializable
data class CompleteAssessmentRequest(val finalComment: String)

@Serializable
data class UpdateAnswersRequest(val answers: List<AnswerDto>)

@Serializable
data class UpdateCommentRequest(val text: String)

sealed class TransitionResult {
    object Success : TransitionResult()
    object NotFound : TransitionResult()
    object Forbidden : TransitionResult()
    data class InvalidTransition(val current: String) : TransitionResult()
}

sealed class LockResult {
    object Acquired : LockResult()
    object AlreadyOwned : LockResult()
    object NotFound : LockResult()
    object Forbidden : LockResult()
    data class LockedByOther(val email: String, val expiresAt: String) : LockResult()
}

sealed class UpdateResult {
    object Success : UpdateResult()
    object NotFound : UpdateResult()
    object Forbidden : UpdateResult()
    data class LockRequired(val lockedByEmail: String?, val expiresAt: String?) : UpdateResult()
}
