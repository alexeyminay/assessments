package org.example.templates.domain

import kotlinx.serialization.Serializable

@Serializable
data class AssessmentTemplate(
    val id: Int,
    val name: String,
    val createdAt: String,
)
