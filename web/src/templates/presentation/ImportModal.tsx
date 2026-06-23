import { useRef, useState } from 'react'
import type { ImportTemplateUseCase } from '../domain/ImportTemplateUseCase'
import type { ImportedTemplate } from '../domain/AssessmentTemplate'

interface Props {
  importTemplateUseCase: ImportTemplateUseCase
  onSuccess: (result: ImportedTemplate) => void
  onClose: () => void
}

export function ImportModal({ importTemplateUseCase, onSuccess, onClose }: Props) {
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const canSubmit = name.trim().length > 0 && file !== null && !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !file) return
    setLoading(true)
    setError(null)
    try {
      const result = await importTemplateUseCase.execute(name.trim(), file)
      onSuccess(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка импорта')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <h3 className="modal-title">Импорт шаблона ассессмента</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Название шаблона</label>
            <input
              type="text"
              placeholder="Например: Android Developer"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Файл (.xlsx)</label>
            <div className="file-input-wrap">
              <button
                type="button"
                className="file-choose-btn"
                onClick={() => fileRef.current?.click()}
                disabled={loading}
              >
                Выбрать файл
              </button>
              <span className="file-name">
                {file ? file.name : 'Файл не выбран'}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              style={{ display: 'none' }}
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="modal-cancel-btn" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button type="submit" className="modal-submit-btn" disabled={!canSubmit}>
              {loading ? 'Импорт…' : 'Импортировать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
