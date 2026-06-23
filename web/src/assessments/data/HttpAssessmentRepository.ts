import type { AuthFetch } from '../../auth/data/AuthFetch'
import type { AssessmentRepository } from '../domain/AssessmentRepository'
import type { AssessmentListItem, AssessmentTabCounts, AssessmentDetail, CreateAssessmentRequest, AnswerDto } from '../domain/types'

const BASE = '/api/assessments'

async function expectOk(res: Response): Promise<void> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  }
}

export class HttpAssessmentRepository implements AssessmentRepository {
  constructor(private readonly authFetch: AuthFetch) {}

  async list(tab: string): Promise<AssessmentListItem[]> {
    const res = await this.authFetch.fetch(`${BASE}?tab=${tab}`)
    await expectOk(res)
    return res.json()
  }

  async counts(): Promise<AssessmentTabCounts> {
    const res = await this.authFetch.fetch(`${BASE}/counts`)
    await expectOk(res)
    return res.json()
  }

  async getById(id: number): Promise<AssessmentDetail> {
    const res = await this.authFetch.fetch(`${BASE}/${id}`)
    await expectOk(res)
    return res.json()
  }

  async create(req: CreateAssessmentRequest): Promise<number> {
    const res = await this.authFetch.fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
    await expectOk(res)
    const data = await res.json()
    return (data as { id: number }).id
  }

  async start(id: number): Promise<void> {
    await expectOk(await this.authFetch.fetch(`${BASE}/${id}/start`, { method: 'POST' }))
  }

  async submit(id: number): Promise<void> {
    await expectOk(await this.authFetch.fetch(`${BASE}/${id}/submit`, { method: 'POST' }))
  }

  async beginReview(id: number): Promise<void> {
    await expectOk(await this.authFetch.fetch(`${BASE}/${id}/begin-review`, { method: 'POST' }))
  }

  async complete(id: number, finalComment: string): Promise<void> {
    await expectOk(await this.authFetch.fetch(`${BASE}/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finalComment }),
    }))
  }

  async acquireLock(id: number): Promise<void> {
    await expectOk(await this.authFetch.fetch(`${BASE}/${id}/lock`, { method: 'POST' }))
  }

  async releaseLock(id: number): Promise<void> {
    const res = await this.authFetch.fetch(`${BASE}/${id}/lock`, { method: 'DELETE' })
    if (!res.ok && res.status !== 404) await expectOk(res)
  }

  async updateAnswers(id: number, answers: AnswerDto[]): Promise<void> {
    await expectOk(await this.authFetch.fetch(`${BASE}/${id}/answers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    }))
  }

  async upsertComment(id: number, itemId: number, text: string): Promise<void> {
    await expectOk(await this.authFetch.fetch(`${BASE}/${id}/comment/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }))
  }
}
