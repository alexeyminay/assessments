import type { AuthFetch } from '../../auth/data/AuthFetch'
import type { TemplateRepository } from '../domain/TemplateRepository'
import type { AssessmentTemplate, ImportedTemplate } from '../domain/AssessmentTemplate'

const BASE = '/api/templates'

export class HttpTemplateRepository implements TemplateRepository {
  constructor(private readonly authFetch: AuthFetch) {}

  async getAll(): Promise<AssessmentTemplate[]> {
    const res = await this.authFetch.fetch(BASE)
    if (!res.ok) throw new Error('Не удалось загрузить шаблоны')
    return res.json()
  }

  async importTemplate(name: string, file: File): Promise<ImportedTemplate> {
    const form = new FormData()
    form.append('name', name)
    form.append('file', file)
    const res = await this.authFetch.fetch(BASE, { method: 'POST', body: form })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error ?? 'Ошибка импорта')
    return data as ImportedTemplate
  }

  async deleteTemplate(id: number): Promise<void> {
    const res = await this.authFetch.fetch(`${BASE}/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Ошибка удаления')
    }
  }
}
