package org.example.templates.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.example.templates.domain.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDateTime

class TemplateRepositoryImpl : TemplateRepository {

    override suspend fun importTemplate(name: String, parsed: ParsedTemplate): ImportResult =
        withContext(Dispatchers.IO) {
            transaction {
                val templateId = AssessmentTemplatesTable.insert {
                    it[AssessmentTemplatesTable.name] = name
                    it[createdAt] = LocalDateTime.now()
                }[AssessmentTemplatesTable.id]

                var itemCount = 0

                parsed.skillGroups.forEachIndexed { gi, group ->
                    val groupId = SkillGroupsTable.insert {
                        it[SkillGroupsTable.templateId] = templateId
                        it[SkillGroupsTable.name] = group.name
                        it[SkillGroupsTable.position] = gi
                    }[SkillGroupsTable.id]

                    group.skills.forEachIndexed { si, skill ->
                        val skillId = SkillsTable.insert {
                            it[SkillsTable.groupId] = groupId
                            it[SkillsTable.name] = skill.name
                            it[SkillsTable.position] = si
                        }[SkillsTable.id]

                        skill.subgroups.forEachIndexed { sgi, subgroup ->
                            val subgroupId = KnowledgeSubgroupsTable.insert {
                                it[KnowledgeSubgroupsTable.skillId] = skillId
                                it[KnowledgeSubgroupsTable.name] = subgroup.name
                                it[KnowledgeSubgroupsTable.position] = sgi
                            }[KnowledgeSubgroupsTable.id]

                            subgroup.items.forEachIndexed { ii, item ->
                                KnowledgeItemsTable.insert {
                                    it[KnowledgeItemsTable.subgroupId] = subgroupId
                                    it[KnowledgeItemsTable.knowledge] = item.knowledge
                                    it[KnowledgeItemsTable.description] = item.description
                                    it[KnowledgeItemsTable.gradeLevel] = item.gradeLevel
                                    it[KnowledgeItemsTable.scorePoints] = item.scorePoints
                                    it[KnowledgeItemsTable.mandatory] = item.mandatory
                                    it[KnowledgeItemsTable.knowledgeType] = item.knowledgeType
                                    it[KnowledgeItemsTable.position] = ii
                                }
                                itemCount++
                            }
                        }
                    }
                }

                ImportResult.Success(templateId, itemCount)
            }
        }

    override suspend fun getAll(): List<AssessmentTemplate> =
        withContext(Dispatchers.IO) {
            transaction {
                AssessmentTemplatesTable
                    .selectAll()
                    .orderBy(AssessmentTemplatesTable.createdAt, SortOrder.DESC)
                    .map {
                        AssessmentTemplate(
                            id = it[AssessmentTemplatesTable.id],
                            name = it[AssessmentTemplatesTable.name],
                            createdAt = it[AssessmentTemplatesTable.createdAt].toString(),
                        )
                    }
            }
        }

    override suspend fun delete(id: Int): Boolean =
        withContext(Dispatchers.IO) {
            transaction {
                AssessmentTemplatesTable.deleteWhere { AssessmentTemplatesTable.id eq id } > 0
            }
        }
}
