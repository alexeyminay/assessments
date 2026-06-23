import type { AssessmentRepository } from './AssessmentRepository'
import type { CreateAssessmentRequest, AnswerDto } from './types'

export class ListAssessmentsUseCase {
  constructor(private repo: AssessmentRepository) {}
  execute(tab: string) { return this.repo.list(tab) }
  counts()             { return this.repo.counts() }
}

export class GetAssessmentDetailUseCase {
  constructor(private repo: AssessmentRepository) {}
  execute(id: number) { return this.repo.getById(id) }
}

export class CreateAssessmentUseCase {
  constructor(private repo: AssessmentRepository) {}
  execute(req: CreateAssessmentRequest) { return this.repo.create(req) }
}

export class AssessmentTransitionUseCase {
  constructor(private repo: AssessmentRepository) {}
  start(id: number)                            { return this.repo.start(id) }
  submit(id: number)                           { return this.repo.submit(id) }
  beginReview(id: number)                      { return this.repo.beginReview(id) }
  complete(id: number, finalComment: string)   { return this.repo.complete(id, finalComment) }
}

export class AssessmentLockUseCase {
  constructor(private repo: AssessmentRepository) {}
  acquire(id: number) { return this.repo.acquireLock(id) }
  release(id: number) { return this.repo.releaseLock(id) }
}

export class UpdateAssessmentUseCase {
  constructor(private repo: AssessmentRepository) {}
  answers(id: number, answers: AnswerDto[])             { return this.repo.updateAnswers(id, answers) }
  comment(id: number, itemId: number, text: string)     { return this.repo.upsertComment(id, itemId, text) }
}
