import { useEffect, useState } from 'react'
import type { GetTemplatesUseCase } from '../domain/GetTemplatesUseCase'
import type { ImportTemplateUseCase } from '../domain/ImportTemplateUseCase'
import type { DeleteTemplateUseCase } from '../domain/DeleteTemplateUseCase'
import type { AssessmentTemplate } from '../domain/AssessmentTemplate'
import { ImportModal } from './ImportModal'

interface Props {
  getTemplatesUseCase: GetTemplatesUseCase
  importTemplateUseCase: ImportTemplateUseCase
  deleteTemplateUseCase: DeleteTemplateUseCase
}

export function TemplatesPage({ getTemplatesUseCase, importTemplateUseCase, deleteTemplateUseCase }: Props) {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    getTemplatesUseCase.execute()
      .then(setTemplates)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await deleteTemplateUseCase.execute(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Шаблоны ассессментов</h2>
        <button className="import-btn" onClick={() => setShowModal(true)}>
          Импортировать шаблон
        </button>
      </div>

      {error && <p className="page-error">{error}</p>}

      {loading ? (
        <p className="page-placeholder">Загрузка…</p>
      ) : templates.length === 0 ? (
        <p className="page-placeholder">Нет шаблонов. Импортируйте первый.</p>
      ) : (
        <div className="templates-list">
          {templates.map(t => (
            <div key={t.id} className="template-row">
              <span className="template-name">{t.name}</span>
              <span className="template-date">{formatDate(t.createdAt)}</span>
              <button
                className="template-delete-btn"
                disabled={deletingId === t.id}
                onClick={() => handleDelete(t.id)}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ImportModal
          importTemplateUseCase={importTemplateUseCase}
          onSuccess={result => {
            setShowModal(false)
            setTemplates(prev => [{
              id: result.id,
              name: result.name,
              createdAt: new Date().toISOString(),
            }, ...prev])
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
