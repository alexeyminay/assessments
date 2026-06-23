import { useCallback, useEffect, useState } from 'react'
import type { GetAssessmentDetailUseCase, AssessmentTransitionUseCase, AssessmentLockUseCase, UpdateAssessmentUseCase } from '../domain/useCases'
import type { AssessmentDetail, CommentDto } from '../domain/types'
import { STATUS_LABELS } from '../domain/types'
import type { TemplateDetailDto, SkillDto } from '../../templates/domain/AssessmentTemplate'

interface Props {
  assessmentId: number
  currentUserId: number
  getDetailUseCase: GetAssessmentDetailUseCase
  transitionUseCase: AssessmentTransitionUseCase
  lockUseCase: AssessmentLockUseCase
  updateUseCase: UpdateAssessmentUseCase
  onBack: () => void
}

export function AssessmentViewerPage({
  assessmentId, currentUserId,
  getDetailUseCase, transitionUseCase, lockUseCase, updateUseCase,
  onBack,
}: Props) {
  const [detail, setDetail] = useState<AssessmentDetail | null>(null)
  const [snapshot, setSnapshot] = useState<TemplateDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [answers, setAnswers] = useState<Map<number, boolean>>(new Map())
  const [comments, setComments] = useState<Map<number, CommentDto>>(new Map())

  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set())

  const [activeCommentItemId, setActiveCommentItemId] = useState<number | null>(null)
  const [commentDraft, setCommentDraft] = useState('')

  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const [showCompletePanel, setShowCompletePanel] = useState(false)
  const [finalComment, setFinalComment] = useState('')

  const loadDetail = useCallback(async () => {
    try {
      const d = await getDetailUseCase.execute(assessmentId)
      setDetail(d)
      const snap = JSON.parse(d.snapshotJson) as TemplateDetailDto
      setSnapshot(snap)
      setAnswers(new Map(d.answers.map(a => [a.itemId, a.checked])))
      setComments(new Map(d.comments.map(c => [c.itemId, c])))
      if (!selectedSkillId) {
        const first = snap.skillGroups[0]?.skills[0]
        if (first) setSelectedSkillId(first.id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }, [assessmentId])

  useEffect(() => { loadDetail() }, [loadDetail])

  const isAssessee   = detail?.assessee.id === currentUserId
  const isReviewer   = detail?.reviewers.some(r => r.id === currentUserId) ?? false
  const isMeLocked   = detail?.lockUserId === currentUserId
  const lockExpired  = detail?.lockExpiresAt
    ? new Date(detail.lockExpiresAt) < new Date()
    : true
  const canEdit      = isMeLocked && !lockExpired

  const doAction = async (action: () => Promise<void>) => {
    setActionLoading(true)
    setActionError(null)
    try {
      await action()
      await loadDetail()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckbox = async (itemId: number, checked: boolean) => {
    if (!canEdit) return
    setAnswers(prev => new Map(prev).set(itemId, checked))
    try {
      await updateUseCase.answers(assessmentId, [{ itemId, checked }])
    } catch (e) {
      setAnswers(prev => new Map(prev).set(itemId, !checked))
      setActionError(e instanceof Error ? e.message : 'Ошибка сохранения')
    }
  }

  const handleCommentOpen = (itemId: number) => {
    if (!canEdit) return
    const existing = comments.get(itemId)?.text ?? ''
    setCommentDraft(existing)
    setActiveCommentItemId(itemId)
  }

  const handleCommentSave = async (itemId: number) => {
    try {
      await updateUseCase.comment(assessmentId, itemId, commentDraft)
      setComments(prev => {
        const m = new Map(prev)
        m.set(itemId, { itemId, text: commentDraft, authorId: currentUserId, authorEmail: '', updatedAt: new Date().toISOString() })
        return m
      })
      setActiveCommentItemId(null)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Ошибка сохранения комментария')
    }
  }

  const toggleGroup = (id: number) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const allSkills = snapshot?.skillGroups.flatMap(g => g.skills) ?? []
  const selectedSkill = allSkills.find(s => s.id === selectedSkillId) ?? null

  if (loading) return <div className="viewer-loading"><p className="page-placeholder">Загрузка…</p></div>
  if (error || !detail || !snapshot) return (
    <div className="viewer-loading">
      <p className="page-error">{error ?? 'Не найдено'}</p>
      <button className="viewer-back-btn" onClick={onBack}>← Назад</button>
    </div>
  )

  return (
    <div className="viewer">
      <div className="viewer-header">
        <button className="viewer-back-btn" onClick={onBack}>← Назад</button>
        <span className="viewer-title">{detail.templateName}</span>
        <span className={`status-badge status-${detail.status}`}>{STATUS_LABELS[detail.status]}</span>
      </div>

      {/* action panel */}
      <div className="assessment-action-panel">
        <div className="action-panel-info">
          <span className="action-info-label">Проходит:</span>
          <span className="action-info-value">{detail.assessee.email}</span>
          {detail.lockUserEmail && (
            <span className="action-lock-badge" title={`до ${detail.lockExpiresAt}`}>
              🔒 {isMeLocked ? 'вы редактируете' : detail.lockUserEmail}
            </span>
          )}
        </div>
        <div className="action-panel-buttons">
          {detail.status === 'assigned' && isAssessee && (
            <button className="btn-primary" disabled={actionLoading} onClick={() => doAction(() => transitionUseCase.start(assessmentId))}>
              Начать
            </button>
          )}
          {detail.status === 'in_progress' && isAssessee && !canEdit && (
            <button className="btn-secondary" disabled={actionLoading} onClick={() => doAction(() => lockUseCase.acquire(assessmentId))}>
              Редактировать
            </button>
          )}
          {detail.status === 'in_progress' && isAssessee && canEdit && (
            <button className="btn-primary" disabled={actionLoading} onClick={() => doAction(() => transitionUseCase.submit(assessmentId))}>
              Отправить на проверку
            </button>
          )}
          {detail.status === 'pending_review' && isReviewer && (
            <button className="btn-primary" disabled={actionLoading} onClick={() => doAction(() => transitionUseCase.beginReview(assessmentId))}>
              Начать проверку
            </button>
          )}
          {detail.status === 'reviewing' && isReviewer && canEdit && !showCompletePanel && (
            <button className="btn-primary" disabled={actionLoading} onClick={() => setShowCompletePanel(true)}>
              Завершить
            </button>
          )}
        </div>
        {showCompletePanel && (
          <div className="complete-panel">
            <textarea
              className="complete-textarea"
              placeholder="Итоговый комментарий (необязательно)"
              value={finalComment}
              onChange={e => setFinalComment(e.target.value)}
              rows={3}
            />
            <div className="complete-panel-actions">
              <button className="btn-secondary" onClick={() => setShowCompletePanel(false)}>Отмена</button>
              <button className="btn-primary" disabled={actionLoading} onClick={() => doAction(async () => {
                await transitionUseCase.complete(assessmentId, finalComment)
                setShowCompletePanel(false)
              })}>
                Подтвердить завершение
              </button>
            </div>
          </div>
        )}
        {actionError && <p className="page-error action-error">{actionError}</p>}
      </div>

      <div className="viewer-body">
        <aside className="viewer-sidebar">
          {snapshot.skillGroups.map(group => (
            <div key={group.id} className="sidebar-group">
              <button className="sidebar-group-header" onClick={() => toggleGroup(group.id)}>
                <span className="sidebar-group-name">{group.name}</span>
                <span className={`sidebar-chevron${collapsedGroups.has(group.id) ? ' collapsed' : ''}`}>▾</span>
              </button>
              {!collapsedGroups.has(group.id) && (
                <div className="sidebar-skills">
                  {group.skills.map(skill => (
                    <button
                      key={skill.id}
                      className={`sidebar-skill${skill.id === selectedSkillId ? ' active' : ''}`}
                      onClick={() => setSelectedSkillId(skill.id)}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </aside>

        <main className="viewer-content">
          {selectedSkill ? (
            <ActiveSkillContent
              skill={selectedSkill}
              canEdit={canEdit}
              answers={answers}
              comments={comments}
              activeCommentItemId={activeCommentItemId}
              commentDraft={commentDraft}
              onCheckbox={handleCheckbox}
              onCommentOpen={handleCommentOpen}
              onCommentDraftChange={setCommentDraft}
              onCommentSave={handleCommentSave}
              onCommentCancel={() => setActiveCommentItemId(null)}
            />
          ) : (
            <p className="page-placeholder">Выберите навык</p>
          )}
        </main>
      </div>
    </div>
  )
}

interface SkillContentProps {
  skill: SkillDto
  canEdit: boolean
  answers: Map<number, boolean>
  comments: Map<number, CommentDto>
  activeCommentItemId: number | null
  commentDraft: string
  onCheckbox: (itemId: number, checked: boolean) => void
  onCommentOpen: (itemId: number) => void
  onCommentDraftChange: (text: string) => void
  onCommentSave: (itemId: number) => void
  onCommentCancel: () => void
}

function ActiveSkillContent({
  skill, canEdit, answers, comments,
  activeCommentItemId, commentDraft,
  onCheckbox, onCommentOpen, onCommentDraftChange, onCommentSave, onCommentCancel,
}: SkillContentProps) {
  const itemCount = skill.subgroups.reduce((n, s) => n + s.items.length, 0)

  return (
    <div className="skill-content">
      <div className="skill-content-header">
        <h3 className="skill-content-title">{skill.name}</h3>
        <span className="skill-item-count">{itemCount} {pluralItems(itemCount)}</span>
      </div>

      {skill.subgroups.map(subgroup => (
        <div key={subgroup.id} className="subgroup-section">
          {subgroup.name && <div className="subgroup-divider">{subgroup.name}</div>}
          <div className="knowledge-cards">
            {subgroup.items.map(item => {
              const checked = answers.get(item.id) ?? false
              const comment = comments.get(item.id)
              const isEditingComment = activeCommentItemId === item.id

              return (
                <div key={item.id} className="knowledge-card">
                  <input
                    type="checkbox"
                    className="knowledge-checkbox"
                    checked={checked}
                    disabled={!canEdit}
                    onChange={e => onCheckbox(item.id, e.target.checked)}
                  />
                  <div className="knowledge-card-body">
                    <p className="knowledge-text">{item.knowledge}</p>
                    {item.description && (
                      <p className="knowledge-description">{item.description}</p>
                    )}
                    {comment && !isEditingComment && (
                      <div className="knowledge-comment">
                        <span className="knowledge-comment-text">{comment.text}</span>
                      </div>
                    )}
                    {isEditingComment && (
                      <div className="comment-editor">
                        <textarea
                          className="comment-textarea"
                          value={commentDraft}
                          onChange={e => onCommentDraftChange(e.target.value)}
                          rows={3}
                          autoFocus
                          placeholder="Введите комментарий…"
                        />
                        <div className="comment-editor-actions">
                          <button className="btn-secondary btn-xs" onClick={onCommentCancel}>Отмена</button>
                          <button className="btn-primary btn-xs" onClick={() => onCommentSave(item.id)}>Сохранить</button>
                        </div>
                      </div>
                    )}
                    <div className="knowledge-card-footer">
                      <div className="knowledge-badges">
                        {item.gradeLevel && (
                          <span className={`badge badge-level badge-${item.gradeLevel.toLowerCase()}`}>
                            {item.gradeLevel}
                          </span>
                        )}
                        {item.scorePoints !== null && item.scorePoints !== undefined && (
                          <span className="badge badge-score">{item.scorePoints} балл</span>
                        )}
                        {item.mandatory && (
                          <span className="badge badge-mandatory">обязательный</span>
                        )}
                        <span className="badge badge-type">{item.knowledgeType}</span>
                      </div>
                      <button
                        className={`comment-btn${comment ? ' has-comment' : ''}`}
                        disabled={!canEdit}
                        onClick={() => onCommentOpen(item.id)}
                      >
                        {comment ? 'Изменить комментарий' : 'Оставить комментарий'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function pluralItems(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return 'знаний'
  if (mod10 === 1) return 'знание'
  if (mod10 >= 2 && mod10 <= 4) return 'знания'
  return 'знаний'
}
