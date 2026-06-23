import type { AssessmentTemplate, ImportedTemplate, TemplateDetailDto } from './AssessmentTemplate'

export interface TemplateRepository {
  getAll(): Promise<AssessmentTemplate[]>
  getById(id: number): Promise<TemplateDetailDto>
  importTemplate(name: string, file: File): Promise<ImportedTemplate>
  deleteTemplate(id: number): Promise<void>
}
