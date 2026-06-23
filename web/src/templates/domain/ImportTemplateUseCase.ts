import type { TemplateRepository } from './TemplateRepository'
import type { ImportedTemplate } from './AssessmentTemplate'

export class ImportTemplateUseCase {
  constructor(private readonly repo: TemplateRepository) {}
  execute(name: string, file: File): Promise<ImportedTemplate> {
    return this.repo.importTemplate(name, file)
  }
}
