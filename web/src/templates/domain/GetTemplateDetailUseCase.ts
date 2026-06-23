import type { TemplateRepository } from './TemplateRepository'
import type { TemplateDetailDto } from './AssessmentTemplate'

export class GetTemplateDetailUseCase {
  constructor(private readonly repo: TemplateRepository) {}
  execute(id: number): Promise<TemplateDetailDto> { return this.repo.getById(id) }
}
