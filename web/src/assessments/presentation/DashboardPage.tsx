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

function monthKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}`
}

function monthLabel(iso: string): string {
  const label = new Date(iso).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByMonth(items: AssessmentListItem[]) {
  const groups: { key: string; label: string; items: AssessmentListItem[] }[] = []
  for (const item of items) {
    const key = monthKey(item.createdAt)
    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.items.push(item)
    } else {
      groups.push({ key, label: monthLabel(item.createdAt), items: [item] })
    }
  }
  return groups
}

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

  const handleCreated = (_id: number) => {
    setShowAssign(false)
    load(tab)
  }

  const countFor = (t: AssessmentTab) => {
    const n = counts[t]
    return n > 0 ? ` (${n})` : ''
  }

  const groups = groupByMonth(items)

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
            onClick={() => setTab(key)}
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
        <div className="assessment-groups">
          {groups.map(group => (
            <div key={group.key} className="assessment-month-group">
              <h3 className="assessment-month-label">{group.label}</h3>
              <div className="assessment-list">
                {group.items.map(item => (
                  <div key={item.id} className="assessment-card" onClick={() => onView(item.id)}>
                    <div className="assessment-card-top">
                      <span className="assessment-template-name">{item.templateName}</span>
                      <span className={`status-badge status-${item.status}`}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </div>
                    <div className="assessment-card-middle">
                      <span className="assessment-assessee">{displayUser(item.assessee)}</span>
                    </div>
                    <div className="assessment-card-bottom">
                      <span className="assessment-date">Назначен: {formatDate(item.createdAt)}</span>
                      {item.completedAt && (
                        <span className="assessment-date assessment-date-completed">
                          Завершён: {formatDate(item.completedAt)}
                        </span>
                      )}
                      {item.lockUserEmail && (
                        <span className="assessment-lock-hint" title={`Блокировка до ${item.lockExpiresAt}`}>
                          🔒 {item.lockUserEmail}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
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
