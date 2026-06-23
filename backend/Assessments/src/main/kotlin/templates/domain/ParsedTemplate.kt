package org.example.templates.domain

data class ParsedTemplate(val skillGroups: List<ParsedSkillGroup>)

data class ParsedSkillGroup(val name: String, val skills: List<ParsedSkill>)

data class ParsedSkill(val name: String, val subgroups: List<ParsedSubgroup>)

data class ParsedSubgroup(
    val name: String?,
    val items: List<ParsedItem>,
)

data class ParsedItem(
    val knowledge: String,
    val description: String?,
    val gradeLevel: String?,
    val scorePoints: Int?,
    val mandatory: Boolean,
    val knowledgeType: String,
)
