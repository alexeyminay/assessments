package org.example.assessments.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.example.assessments.domain.*
import org.example.auth.data.UserTable
import org.example.templates.domain.TemplateDetailDto
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.inList
import org.jetbrains.exposed.sql.SqlExpressionBuilder.neq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.time.temporal.ChronoUnit

private val json = Json { ignoreUnknownKeys = true }
private fun now() = Instant.now().toString()
private fun lockExpiry() = Instant.now().plus(7, ChronoUnit.DAYS).toString()

class AssessmentRepositoryImpl : AssessmentRepository {

    override suspend fun create(
        req: CreateAssessmentRequest,
        adminId: Int,
        snapshot: TemplateDetailDto,
        templateName: String,
    ): Int = withContext(Dispatchers.IO) {
        transaction {
            val newId = AssessmentsTable.insert {
                it[AssessmentsTable.templateId]   = req.templateId as Int?
                it[AssessmentsTable.templateName] = templateName
                it[assesseeId]    = req.assesseeId
                it[assignedById]  = adminId
                it[status]        = "assigned"
                it[AssessmentsTable.snapshot] = json.encodeToString(snapshot)
                it[createdAt]     = now()
            }[AssessmentsTable.id]
            req.reviewerIds.forEach { reviewerId ->
                AssessmentReviewersTable.insert {
                    it[AssessmentReviewersTable.assessmentId] = newId
                    it[AssessmentReviewersTable.userId]       = reviewerId
                }
            }
            newId
        }
    }

    override suspend fun list(userId: Int, userRole: String, tab: String): List<AssessmentListItem> =
        withContext(Dispatchers.IO) {
            transaction {
                val reviewIds = reviewerIds(userId)
                val base = AssessmentsTable
                    .join(UserTable, JoinType.INNER, AssessmentsTable.assesseeId, UserTable.id)
                    .selectAll()
                val filtered = when (tab) {
                    "review" -> base.where { AssessmentsTable.id inList reviewIds }
                    "mine"   -> base.where { AssessmentsTable.assesseeId eq userId }
                    else     -> if (userRole == "admin") base
                                else base.where {
                                    (AssessmentsTable.assesseeId eq userId) or
                                    (AssessmentsTable.id inList reviewIds)
                                }
                }
                filtered.orderBy(AssessmentsTable.createdAt, SortOrder.DESC).map { row ->
                    AssessmentListItem(
                        id            = row[AssessmentsTable.id],
                        templateName  = row[AssessmentsTable.templateName],
                        assessee      = UserInfo(row[AssessmentsTable.assesseeId], row[UserTable.email]),
                        status        = row[AssessmentsTable.status],
                        createdAt     = row[AssessmentsTable.createdAt],
                        lockUserEmail = lockEmail(row[AssessmentsTable.lockUserId]),
                        lockExpiresAt = row[AssessmentsTable.lockExpiresAt],
                    )
                }
            }
        }

    override suspend fun tabCounts(userId: Int, userRole: String): AssessmentTabCounts =
        withContext(Dispatchers.IO) {
            transaction {
                val reviewIds = reviewerIds(userId)
                fun count(op: Op<Boolean>) =
                    AssessmentsTable.selectAll()
                        .where { (AssessmentsTable.status neq "completed") and op }
                        .count().toInt()
                val all = if (userRole == "admin")
                    AssessmentsTable.selectAll().where { AssessmentsTable.status neq "completed" }.count().toInt()
                else
                    count((AssessmentsTable.assesseeId eq userId) or (AssessmentsTable.id inList reviewIds))
                AssessmentTabCounts(
                    all    = all,
                    review = count(AssessmentsTable.id inList reviewIds),
                    mine   = count(AssessmentsTable.assesseeId eq userId),
                )
            }
        }

    override suspend fun getById(id: Int): AssessmentDetail? = withContext(Dispatchers.IO) {
        transaction {
            val row = AssessmentsTable.selectAll().where { AssessmentsTable.id eq id }
                .singleOrNull() ?: return@transaction null
            AssessmentDetail(
                id              = row[AssessmentsTable.id],
                templateName    = row[AssessmentsTable.templateName],
                assessee        = userInfo(row[AssessmentsTable.assesseeId]),
                assignedBy      = userInfo(row[AssessmentsTable.assignedById]),
                reviewers       = AssessmentReviewersTable
                    .join(UserTable, JoinType.INNER, AssessmentReviewersTable.userId, UserTable.id)
                    .selectAll().where { AssessmentReviewersTable.assessmentId eq id }
                    .map { UserInfo(it[UserTable.id], it[UserTable.email]) },
                status          = row[AssessmentsTable.status],
                snapshotJson    = row[AssessmentsTable.snapshot],
                answers         = AssessmentAnswersTable.selectAll()
                    .where { AssessmentAnswersTable.assessmentId eq id }
                    .map { AnswerDto(it[AssessmentAnswersTable.itemId], it[AssessmentAnswersTable.checked]) },
                comments        = AssessmentCommentsTable
                    .join(UserTable, JoinType.INNER, AssessmentCommentsTable.authorId, UserTable.id)
                    .selectAll().where { AssessmentCommentsTable.assessmentId eq id }
                    .map {
                        CommentDto(
                            itemId      = it[AssessmentCommentsTable.itemId],
                            text        = it[AssessmentCommentsTable.text],
                            authorId    = it[AssessmentCommentsTable.authorId],
                            authorEmail = it[UserTable.email],
                            updatedAt   = it[AssessmentCommentsTable.updatedAt],
                        )
                    },
                finalComment    = row[AssessmentsTable.finalComment],
                lockUserId      = row[AssessmentsTable.lockUserId],
                lockUserEmail   = lockEmail(row[AssessmentsTable.lockUserId]),
                lockExpiresAt   = row[AssessmentsTable.lockExpiresAt],
                createdAt       = row[AssessmentsTable.createdAt],
                startedAt       = row[AssessmentsTable.startedAt],
                submittedAt     = row[AssessmentsTable.submittedAt],
                reviewStartedAt = row[AssessmentsTable.reviewStartedAt],
                completedAt     = row[AssessmentsTable.completedAt],
            )
        }
    }

    override suspend fun start(id: Int, userId: Int): TransitionResult = inTransaction(id) { row ->
        if (row[AssessmentsTable.assesseeId] != userId) return@inTransaction TransitionResult.Forbidden
        if (row[AssessmentsTable.status] != "assigned") return@inTransaction TransitionResult.InvalidTransition(row[AssessmentsTable.status])
        AssessmentsTable.update({ AssessmentsTable.id eq id }) {
            it[status]    = "in_progress"
            it[startedAt] = now()
        }
        TransitionResult.Success
    }

    override suspend fun submit(id: Int, userId: Int): TransitionResult = inTransaction(id) { row ->
        if (row[AssessmentsTable.assesseeId] != userId) return@inTransaction TransitionResult.Forbidden
        if (row[AssessmentsTable.status] != "in_progress") return@inTransaction TransitionResult.InvalidTransition(row[AssessmentsTable.status])
        AssessmentsTable.update({ AssessmentsTable.id eq id }) {
            it[status]        = "pending_review"
            it[submittedAt]   = now()
            it[lockUserId]    = null
            it[lockExpiresAt] = null
        }
        TransitionResult.Success
    }

    override suspend fun beginReview(id: Int, userId: Int): TransitionResult = inTransaction(id) { row ->
        if (row[AssessmentsTable.status] != "pending_review") return@inTransaction TransitionResult.InvalidTransition(row[AssessmentsTable.status])
        val isReviewer = AssessmentReviewersTable.selectAll()
            .where { (AssessmentReviewersTable.assessmentId eq id) and (AssessmentReviewersTable.userId eq userId) }
            .count() > 0
        if (!isReviewer) return@inTransaction TransitionResult.Forbidden
        AssessmentsTable.update({ AssessmentsTable.id eq id }) {
            it[status]          = "reviewing"
            it[reviewStartedAt] = now()
            it[lockUserId]      = userId
            it[lockExpiresAt]   = lockExpiry()
        }
        TransitionResult.Success
    }

    override suspend fun complete(id: Int, userId: Int, finalComment: String): TransitionResult = inTransaction(id) { row ->
        if (row[AssessmentsTable.status] != "reviewing") return@inTransaction TransitionResult.InvalidTransition(row[AssessmentsTable.status])
        if (!isActiveLockOwner(row, userId)) return@inTransaction TransitionResult.Forbidden
        AssessmentsTable.update({ AssessmentsTable.id eq id }) {
            it[status]                        = "completed"
            it[AssessmentsTable.finalComment] = finalComment
            it[completedAt]                   = now()
            it[lockUserId]                    = null
            it[lockExpiresAt]                 = null
        }
        TransitionResult.Success
    }

    override suspend fun acquireLock(id: Int, userId: Int): LockResult = withContext(Dispatchers.IO) {
        transaction {
            val row = AssessmentsTable.selectAll().where { AssessmentsTable.id eq id }
                .singleOrNull() ?: return@transaction LockResult.NotFound
            val isParticipant = row[AssessmentsTable.assesseeId] == userId ||
                    AssessmentReviewersTable.selectAll()
                        .where { (AssessmentReviewersTable.assessmentId eq id) and (AssessmentReviewersTable.userId eq userId) }
                        .count() > 0
            if (!isParticipant) return@transaction LockResult.Forbidden
            if (row[AssessmentsTable.lockUserId] == userId) return@transaction LockResult.AlreadyOwned
            val currentLockId = row[AssessmentsTable.lockUserId]
            val currentExpiry = row[AssessmentsTable.lockExpiresAt]
            if (currentLockId != null && currentExpiry != null) {
                val expiry = runCatching { Instant.parse(currentExpiry) }.getOrNull()
                if (expiry != null && expiry.isAfter(Instant.now())) {
                    val email = lockEmail(currentLockId) ?: "другой пользователь"
                    return@transaction LockResult.LockedByOther(email, currentExpiry)
                }
            }
            AssessmentsTable.update({ AssessmentsTable.id eq id }) {
                it[lockUserId]    = userId
                it[lockExpiresAt] = lockExpiry()
            }
            LockResult.Acquired
        }
    }

    override suspend fun releaseLock(id: Int, userId: Int): Boolean = withContext(Dispatchers.IO) {
        transaction {
            val row = AssessmentsTable.selectAll().where { AssessmentsTable.id eq id }
                .singleOrNull() ?: return@transaction false
            if (row[AssessmentsTable.lockUserId] != userId) return@transaction false
            AssessmentsTable.update({ AssessmentsTable.id eq id }) {
                it[lockUserId]    = null
                it[lockExpiresAt] = null
            }
            true
        }
    }

    override suspend fun updateAnswers(id: Int, userId: Int, answers: List<AnswerDto>): UpdateResult =
        withContext(Dispatchers.IO) {
            transaction {
                val err = checkWriteAccess(id, userId)
                if (err != null) return@transaction err
                answers.forEach { answer ->
                    val exists = AssessmentAnswersTable.selectAll()
                        .where { (AssessmentAnswersTable.assessmentId eq id) and (AssessmentAnswersTable.itemId eq answer.itemId) }
                        .count() > 0
                    if (exists) {
                        AssessmentAnswersTable.update({
                            (AssessmentAnswersTable.assessmentId eq id) and (AssessmentAnswersTable.itemId eq answer.itemId)
                        }) {
                            it[checked]     = answer.checked
                            it[updatedById] = userId
                            it[updatedAt]   = now()
                        }
                    } else {
                        AssessmentAnswersTable.insert {
                            it[assessmentId] = id
                            it[itemId]       = answer.itemId
                            it[checked]      = answer.checked
                            it[updatedById]  = userId
                            it[updatedAt]    = now()
                        }
                    }
                }
                UpdateResult.Success
            }
        }

    override suspend fun upsertComment(id: Int, userId: Int, itemId: Int, text: String): UpdateResult =
        withContext(Dispatchers.IO) {
            transaction {
                val err = checkWriteAccess(id, userId)
                if (err != null) return@transaction err
                val exists = AssessmentCommentsTable.selectAll()
                    .where { (AssessmentCommentsTable.assessmentId eq id) and (AssessmentCommentsTable.itemId eq itemId) }
                    .count() > 0
                if (exists) {
                    AssessmentCommentsTable.update({
                        (AssessmentCommentsTable.assessmentId eq id) and (AssessmentCommentsTable.itemId eq itemId)
                    }) {
                        it[AssessmentCommentsTable.text] = text
                        it[authorId]  = userId
                        it[updatedAt] = now()
                    }
                } else {
                    AssessmentCommentsTable.insert {
                        it[assessmentId]                  = id
                        it[AssessmentCommentsTable.itemId] = itemId
                        it[AssessmentCommentsTable.text]   = text
                        it[authorId]   = userId
                        it[createdAt]  = now()
                        it[updatedAt]  = now()
                    }
                }
                UpdateResult.Success
            }
        }

    // ── Private helpers ──────────────────────────────────────────────────────

    /** Returns an UpdateResult error if write should be blocked, or null if the caller may proceed. */
    private fun checkWriteAccess(id: Int, userId: Int): UpdateResult? {
        val row = AssessmentsTable.selectAll().where { AssessmentsTable.id eq id }
            .singleOrNull() ?: return UpdateResult.NotFound
        val isParticipant = row[AssessmentsTable.assesseeId] == userId ||
                AssessmentReviewersTable.selectAll()
                    .where { (AssessmentReviewersTable.assessmentId eq id) and (AssessmentReviewersTable.userId eq userId) }
                    .count() > 0
        if (!isParticipant) return UpdateResult.Forbidden
        if (!isActiveLockOwner(row, userId)) return UpdateResult.LockRequired(
            lockedByEmail = lockEmail(row[AssessmentsTable.lockUserId]),
            expiresAt     = row[AssessmentsTable.lockExpiresAt],
        )
        return null
    }

    private fun isActiveLockOwner(row: ResultRow, userId: Int): Boolean {
        val lid    = row[AssessmentsTable.lockUserId] ?: return false
        val expStr = row[AssessmentsTable.lockExpiresAt] ?: return false
        val expiry = runCatching { Instant.parse(expStr) }.getOrNull() ?: return false
        return lid == userId && expiry.isAfter(Instant.now())
    }

    private fun reviewerIds(userId: Int): Set<Int> =
        AssessmentReviewersTable.selectAll()
            .where { AssessmentReviewersTable.userId eq userId }
            .map { it[AssessmentReviewersTable.assessmentId] }.toSet()

    private fun userInfo(id: Int): UserInfo =
        UserTable.selectAll().where { UserTable.id eq id }
            .single().let { UserInfo(it[UserTable.id], it[UserTable.email]) }

    private fun lockEmail(lockUserId: Int?): String? =
        lockUserId?.let { lid ->
            UserTable.selectAll().where { UserTable.id eq lid }.singleOrNull()?.get(UserTable.email)
        }

    private suspend fun inTransaction(id: Int, block: (ResultRow) -> TransitionResult): TransitionResult =
        withContext(Dispatchers.IO) {
            transaction {
                val row = AssessmentsTable.selectAll().where { AssessmentsTable.id eq id }
                    .singleOrNull() ?: return@transaction TransitionResult.NotFound
                block(row)
            }
        }
}
