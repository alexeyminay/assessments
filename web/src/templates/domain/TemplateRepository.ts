import type { AssessmentTemplate, ImportedTemplate } from './AssessmentTemplate'

export interface TemplateRepository {
  getAll(): Promise<AssessmentTemplate[]>
  importTemplate(name: string, file: File): Promise<ImportedTemplate>
  deleteTemplate(id: number): Promise<void>
}
