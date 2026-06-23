import { useEffect, useState } from 'react'
import type { GetUsersUseCase } from '../../users/domain/GetUsersUseCase'
import type { GetTemplatesUseCase } from '../../templates/domain/GetTemplatesUseCase'
import type { CreateAssessmentUseCase } from '../domain/useCases'
import type { UserEntry } from '../../users/domain/types'
import type { AssessmentTemplate } from '../../templates/domain/AssessmentTemplate'

interface Props {
  createUseCase: CreateAssessmentUseCase
  getUsersUseCase: GetUsersUseCase
  getTemplatesUseCase: GetTemplatesUseCase
  onCreated: (id: number) => void
  onClose: () => void
}

export function AssignModal({ createUseCase, getUsersUseCase, getTemplatesUseCase, onCreated, onClose }: Props) {
  const [users, setUsers] = useState<UserEntry[]>([])
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const [templateId, setTemplateId] = useState<number | ''>('')
  const [assesseeId, setAssesseeId] = useState<number | ''>('')
  const [reviewerIds, setReviewerIds] = useState<number[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getUsersUseCase.execute(), getTemplatesUseCase.execute()])
      .then(([u, t]) => { setUsers(u); setTemplates(t) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const toggleReviewer = (id: number) => {
    setReviewerIds(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (templateId === '' || assesseeId === '') return
    if (reviewerIds.length === 0) { setError('Выберите хотя бы одного проверяющего'); return }
    setSaving(true)
    setError(null)
    try {
      const id = await createUseCase.execute({
        templateId: templateId as number,
        assesseeId: assesseeId as number,
        reviewerIds,
      })
      onCreated(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Назначить ассессмент</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p className="modal-loading">Загрузка…</p>
        ) : (
          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label">Шаблон</label>
              <select
                className="form-select"
                value={templateId}
                onChange={e => setTemplateId(e.target.value === '' ? '' : parseInt(e.target.value))}
                required
              >
                <option value="">Выберите шаблон…</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Проходит ассессмент</label>
              <select
                className="form-select"
                value={assesseeId}
                onChange={e => setAssesseeId(e.target.value === '' ? '' : parseInt(e.target.value))}
                required
              >
                <option value="">Выберите пользователя…</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">
                Проверяющие <span className="form-label-hint">(1–3)</span>
              </label>
              <div className="reviewer-list">
                {users.map(u => {
                  const selected = reviewerIds.includes(u.id)
                  const disabled = !selected && reviewerIds.length >= 3
                  return (
                    <label key={u.id} className={`reviewer-item${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={disabled}
                        onChange={() => toggleReviewer(u.id)}
                      />
                      {u.email}
                    </label>
                  )
                })}
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Отмена</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Сохранение…' : 'Назначить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
