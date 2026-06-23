import type { TemplateRepository } from './TemplateRepository'
import type { AssessmentTemplate } from './AssessmentTemplate'

export class GetTemplatesUseCase {
  constructor(private readonly repo: TemplateRepository) {}
  execute(): Promise<AssessmentTemplate[]> { return this.repo.getAll() }
}
