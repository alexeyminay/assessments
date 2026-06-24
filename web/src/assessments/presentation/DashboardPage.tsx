import { useEffect, useState } from 'react'
import type { ListAssessmentsUseCase, CreateAssessmentUseCase } from '../domain/useCases'
import type { GetUsersUseCase } from '../../users/domain/GetUsersUseCase'
import type { GetTemplatesUseCase } from '../../templates/domain/GetTemplatesUseCase'
import type { AssessmentListItem, AssessmentTabCounts, AssessmentTab } from '../domain/types'
import { STATUS_LABELS, displayUser } from '../domain/types'
import { AssignModal } from './AssignModal'

interface Props {
  listUseCase: ListAssessmentsUseCase
  createUseCase: CreateAssessmentUseCase
  getUsersUseCase: GetUsersUseCase
  getTemplatesUseCase: GetTemplatesUseCase
  role: string
  onView: (id: number) => void
}

const TABS: { key: AssessmentTab; label: string }[] = [
  { key: 'all',    label: 'Все' },
  { key: 'review', label: 'На проверку' },
  { key: 'mine',   label: 'Мои' },
]

export function DashboardPage({ listUseCase, createUseCase, getUsersUseCase, getTemplatesUseCase, role, onView }: Props) {
  const [tab, setTab] = useState<AssessmentTab>('all')
  const [items, setItems] = useState<AssessmentListItem[]>([])
  const [counts, setCounts] = useState<AssessmentTabCounts>({ all: 0, review: 0, mine: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAssign, setShowAssign] = useState(false)

  const load = async (t: AssessmentTab) => {
    setLoading(true)
    setError(null)
    try {
      const [list, cnts] = await Promise.all([listUseCase.execute(t), listUseCase.counts()])
      setItems(list)
      setCounts(cnts)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(tab) }, [tab])

  const handleTabChange = (t: AssessmentTab) => { setTab(t); }

  const handleCreated = (_id: number) => {
    setShowAssign(false)
    load(tab)
  }

  const countFor = (t: AssessmentTab) => {
    const n = counts[t]
    return n > 0 ? ` (${n})` : ''
  }

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <h2 className="page-title">Ассессменты</h2>
        {role === 'admin' && (
          <button className="btn-primary" onClick={() => setShowAssign(true)}>
            + Назначить
          </button>
        )}
      </div>

      <div className="tabs">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`tab-btn${tab === key ? ' active' : ''}`}
            onClick={() => handleTabChange(key)}
          >
            {label}{countFor(key)}
          </button>
        ))}
      </div>

      {error && <p className="page-error">{error}</p>}

      {loading ? (
        <p className="page-placeholder">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="page-placeholder">Нет ассессментов</p>
      ) : (
        <div className="assessment-list">
          {items.map(item => (
            <div key={item.id} className="assessment-card" onClick={() => onView(item.id)}>
              <div className="assessment-card-top">
                <span className="assessment-template-name">{item.templateName}</span>
                <span className={`status-badge status-${item.status}`}>
                  {STATUS_LABELS[item.status]}
                </span>
              </div>
              <div className="assessment-card-bottom">
                <span className="assessment-assessee">{displayUser(item.assessee)}</span>
                {item.lockUserEmail && (
                  <span className="assessment-lock-hint" title={`Блокировка до ${item.lockExpiresAt}`}>
                    🔒 {item.lockUserEmail}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAssign && (
        <AssignModal
          createUseCase={createUseCase}
          getUsersUseCase={getUsersUseCase}
          getTemplatesUseCase={getTemplatesUseCase}
          onCreated={handleCreated}
          onClose={() => setShowAssign(false)}
        />
      )}
    </div>
  )
}
