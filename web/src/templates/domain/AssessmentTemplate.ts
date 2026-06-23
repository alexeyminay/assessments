export interface AssessmentTemplate {
  id: number
  name: string
  createdAt: string
}

export interface ImportedTemplate {
  id: number
  name: string
  itemCount: number
}

export interface KnowledgeItemDto {
  id: number
  knowledge: string
  description: string | null
  gradeLevel: string | null
  scorePoints: number | null
  mandatory: boolean
  knowledgeType: string
}

export interface SubgroupDto {
  id: number
  name: string | null
  items: KnowledgeItemDto[]
}

export interface SkillDto {
  id: number
  name: string
  subgroups: SubgroupDto[]
}

export interface SkillGroupDto {
  id: number
  name: string
  skills: SkillDto[]
}

export interface TemplateDetailDto {
  id: number
  name: string
  skillGroups: SkillGroupDto[]
}
