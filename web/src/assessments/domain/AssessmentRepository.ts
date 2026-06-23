import type { AssessmentListItem, AssessmentTabCounts, AssessmentDetail, CreateAssessmentRequest, AnswerDto } from './types'

export interface AssessmentRepository {
  list(tab: string): Promise<AssessmentListItem[]>
  counts(): Promise<AssessmentTabCounts>
  getById(id: number): Promise<AssessmentDetail>
  create(req: CreateAssessmentRequest): Promise<number>
  start(id: number): Promise<void>
  submit(id: number): Promise<void>
  beginReview(id: number): Promise<void>
  complete(id: number, finalComment: string): Promise<void>
  acquireLock(id: number): Promise<void>
  releaseLock(id: number): Promise<void>
  updateAnswers(id: number, answers: AnswerDto[]): Promise<void>
  upsertComment(id: number, itemId: number, text: string): Promise<void>
}
