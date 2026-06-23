package org.example.templates.data

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.datetime

object AssessmentTemplatesTable : Table("assessment_templates") {
    val id = integer("id").autoIncrement()
    val name = varchar("name", 255)
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object SkillGroupsTable : Table("skill_groups") {
    val id = integer("id").autoIncrement()
    val templateId = integer("template_id").references(AssessmentTemplatesTable.id)
    val name = varchar("name", 255)
    val position = integer("position")
    override val primaryKey = PrimaryKey(id)
}

object SkillsTable : Table("skills") {
    val id = integer("id").autoIncrement()
    val groupId = integer("group_id").references(SkillGroupsTable.id)
    val name = varchar("name", 255)
    val position = integer("position")
    override val primaryKey = PrimaryKey(id)
}

object KnowledgeSubgroupsTable : Table("knowledge_subgroups") {
    val id = integer("id").autoIncrement()
    val skillId = integer("skill_id").references(SkillsTable.id)
    val name = varchar("name", 255).nullable()
    val position = integer("position")
    override val primaryKey = PrimaryKey(id)
}

object KnowledgeItemsTable : Table("knowledge_items") {
    val id = integer("id").autoIncrement()
    val subgroupId = integer("subgroup_id").references(KnowledgeSubgroupsTable.id)
    val knowledge = text("knowledge")
    val description = text("description").nullable()
    val gradeLevel = varchar("grade_level", 20).nullable()
    val scorePoints = integer("score_points").nullable()
    val mandatory = bool("mandatory")
    val knowledgeType = varchar("knowledge_type", 30)
    val position = integer("position")
    override val primaryKey = PrimaryKey(id)
}
