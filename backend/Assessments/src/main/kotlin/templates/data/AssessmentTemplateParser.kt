package org.example.templates.data

import org.example.templates.domain.*

object AssessmentTemplateParser {

    private val gradeLevels = setOf("Intern", "Junior", "Middle", "Senior")
    private val scoreRegex = Regex("^(\\d+) балл.*$")

    fun parse(rows: List<Map<String, String>>): ParsedTemplate {
        // skip header row
        val dataRows = rows.drop(1)

        val skillGroups = mutableListOf<ParsedSkillGroup>()
        val skills = mutableListOf<ParsedSkill>()
        val subgroups = mutableListOf<ParsedSubgroup>()
        val items = mutableListOf<ParsedItem>()

        var currentGroupName = ""
        var currentSkillName = ""
        var currentSubgroupName: String? = null

        fun flushSubgroup() {
            if (items.isNotEmpty()) {
                subgroups.add(ParsedSubgroup(currentSubgroupName, items.toList()))
                items.clear()
            }
        }

        fun flushSkill() {
            flushSubgroup()
            if (subgroups.isNotEmpty()) {
                skills.add(ParsedSkill(currentSkillName, subgroups.toList()))
                subgroups.clear()
            }
        }

        fun flushGroup() {
            flushSkill()
            if (skills.isNotEmpty()) {
                skillGroups.add(ParsedSkillGroup(currentGroupName, skills.toList()))
                skills.clear()
            }
        }

        for (row in dataRows) {
            val enabled = row["I"]?.trim()?.lowercase()
            if (enabled == "выкл") continue

            val colA = row["A"]?.trim()?.takeIf { it.isNotEmpty() }
            val colB = row["B"]?.trim()?.takeIf { it.isNotEmpty() }
            val colC = row["C"]?.trim()?.takeIf { it.isNotEmpty() && it != "—" }
            val colD = row["D"]?.trim()?.takeIf { it.isNotEmpty() } ?: continue
            val colE = row["E"]?.trim()?.takeIf { it.isNotEmpty() && it != "—" }
            val colF = row["F"]?.trim() ?: ""
            val colG = row["G"]?.trim()?.lowercase() == "да"
            val colH = row["H"]?.trim() ?: "самостоятельное"

            if (colA != null && colA != currentGroupName) {
                flushGroup()
                currentGroupName = colA
                currentSkillName = ""
                currentSubgroupName = null
            }

            if (colB != null && colB != currentSkillName) {
                flushSkill()
                currentSkillName = colB
                currentSubgroupName = null
            }

            if (colC != currentSubgroupName) {
                flushSubgroup()
                currentSubgroupName = colC
            }

            val (gradeLevel, scorePoints) = parseLevel(colF)
            items.add(
                ParsedItem(
                    knowledge = colD,
                    description = colE,
                    gradeLevel = gradeLevel,
                    scorePoints = scorePoints,
                    mandatory = colG,
                    knowledgeType = colH,
                )
            )
        }

        flushGroup()
        return ParsedTemplate(skillGroups)
    }

    private fun parseLevel(value: String): Pair<String?, Int?> {
        if (value in gradeLevels) return Pair(value, null)
        val match = scoreRegex.matchEntire(value)
        if (match != null) return Pair(null, match.groupValues[1].toIntOrNull())
        return Pair(value.ifEmpty { null }, null)
    }

    fun countItems(parsed: ParsedTemplate): Int =
        parsed.skillGroups.sumOf { g ->
            g.skills.sumOf { s ->
                s.subgroups.sumOf { sub -> sub.items.size }
            }
        }
}
