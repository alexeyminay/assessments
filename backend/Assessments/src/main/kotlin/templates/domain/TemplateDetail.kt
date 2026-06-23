package org.example.templates.domain

import kotlinx.serialization.Serializable

@Serializable
data class KnowledgeItemDto(
    val id: Int,
    val knowledge: String,
    val description: String?,
    val gradeLevel: String?,
    val scorePoints: Int?,
    val mandatory: Boolean,
    val knowledgeType: String,
)

@Serializable
data class SubgroupDto(
    val id: Int,
    val name: String?,
    val items: List<KnowledgeItemDto>,
)

@Serializable
data class SkillDto(
    val id: Int,
    val name: String,
    val subgroups: List<SubgroupDto>,
)

@Serializable
data class SkillGroupDto(
    val id: Int,
    val name: String,
    val skills: List<SkillDto>,
)

@Serializable
data class TemplateDetailDto(
    val id: Int,
    val name: String,
    val skillGroups: List<SkillGroupDto>,
)
