package org.example.assessments.data

import org.jetbrains.exposed.sql.Table

object AssessmentsTable : Table("assessments") {
    val id             = integer("id").autoIncrement()
    val templateId     = integer("template_id").nullable()
    val templateName   = varchar("template_name", 255)
    val assesseeId     = integer("assessee_id")
    val assignedById   = integer("assigned_by_id")
    val status         = varchar("status", 30)
    val snapshot       = text("snapshot")
    val finalComment   = text("final_comment").nullable()
    val lockUserId     = integer("lock_user_id").nullable()
    val lockExpiresAt  = varchar("lock_expires_at", 50).nullable()
    val createdAt      = varchar("created_at", 50)
    val startedAt      = varchar("started_at", 50).nullable()
    val submittedAt    = varchar("submitted_at", 50).nullable()
    val reviewStartedAt = varchar("review_started_at", 50).nullable()
    val completedAt    = varchar("completed_at", 50).nullable()
    override val primaryKey = PrimaryKey(id)
}

object AssessmentReviewersTable : Table("assessment_reviewers") {
    val assessmentId = integer("assessment_id")
    val userId       = integer("user_id")
    override val primaryKey = PrimaryKey(assessmentId, userId)
}

object AssessmentAnswersTable : Table("assessment_answers") {
    val id            = integer("id").autoIncrement()
    val assessmentId  = integer("assessment_id")
    val itemId        = integer("item_id")
    val checked       = bool("checked")
    val updatedById   = integer("updated_by_id").nullable()
    val updatedAt     = varchar("updated_at", 50)
    override val primaryKey = PrimaryKey(id)
}

object AssessmentCommentsTable : Table("assessment_comments") {
    val id            = integer("id").autoIncrement()
    val assessmentId  = integer("assessment_id")
    val itemId        = integer("item_id")
    val text          = text("text")
    val authorId      = integer("author_id")
    val createdAt     = varchar("created_at", 50)
    val updatedAt     = varchar("updated_at", 50)
    override val primaryKey = PrimaryKey(id)
}
