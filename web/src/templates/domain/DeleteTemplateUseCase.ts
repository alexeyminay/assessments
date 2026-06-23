import type { TemplateRepository } from './TemplateRepository'

export class DeleteTemplateUseCase {
  constructor(private readonly repo: TemplateRepository) {}
  execute(id: number): Promise<void> { return this.repo.deleteTemplate(id) }
}
