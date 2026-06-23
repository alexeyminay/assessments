export interface UserInfo {
  id: number
  email: string
}

export interface AnswerDto {
  itemId: number
  checked: boolean
}

export interface CommentDto {
  itemId: number
  text: string
  authorId: number
  authorEmail: string
  updatedAt: string
}

export interface AssessmentListItem {
  id: number
  templateName: string
  assessee: UserInfo
  status: AssessmentStatus
  createdAt: string
  lockUserEmail: string | null
  lockExpiresAt: string | null
}

export interface AssessmentTabCounts {
  all: number
  review: number
  mine: number
}

export interface AssessmentDetail {
  id: number
  templateName: string
  assessee: UserInfo
  assignedBy: UserInfo
  reviewers: UserInfo[]
  status: AssessmentStatus
  snapshotJson: string
  answers: AnswerDto[]
  comments: CommentDto[]
  finalComment: string | null
  lockUserId: number | null
  lockUserEmail: string | null
  lockExpiresAt: string | null
  createdAt: string
  startedAt: string | null
  submittedAt: string | null
  reviewStartedAt: string | null
  completedAt: string | null
}

export interface CreateAssessmentRequest {
  templateId: number
  assesseeId: number
  reviewerIds: number[]
}

export type AssessmentStatus =
  | 'assigned'
  | 'in_progress'
  | 'pending_review'
  | 'reviewing'
  | 'completed'

export type AssessmentTab = 'all' | 'review' | 'mine'

export const STATUS_LABELS: Record<AssessmentStatus, string> = {
  assigned:       'Назначен',
  in_progress:    'В процессе',
  pending_review: 'На проверку',
  reviewing:      'Проверяется',
  completed:      'Завершён',
}
