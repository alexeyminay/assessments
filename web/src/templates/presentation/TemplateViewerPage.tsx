import { useEffect, useState } from 'react'
import type { GetTemplateDetailUseCase } from '../domain/GetTemplateDetailUseCase'
import type { TemplateDetailDto, SkillDto } from '../domain/AssessmentTemplate'

interface Props {
  templateId: number
  getTemplateDetailUseCase: GetTemplateDetailUseCase
  onBack: () => void
}

export function TemplateViewerPage({ templateId, getTemplateDetailUseCase, onBack }: Props) {
  const [template, setTemplate] = useState<TemplateDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set())

  useEffect(() => {
    getTemplateDetailUseCase.execute(templateId)
      .then(data => {
        setTemplate(data)
        const firstSkill = data.skillGroups[0]?.skills[0]
        if (firstSkill) setSelectedSkillId(firstSkill.id)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [templateId])

  const toggleGroup = (groupId: number) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const allSkills = template?.skillGroups.flatMap(g => g.skills) ?? []
  const selectedSkill = allSkills.find(s => s.id === selectedSkillId) ?? null

  if (loading) {
    return (
      <div className="viewer-loading">
        <p className="page-placeholder">Загрузка шаблона…</p>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="viewer-loading">
        <p className="page-error">{error ?? 'Шаблон не найден'}</p>
        <button className="viewer-back-btn" onClick={onBack}>← Назад</button>
      </div>
    )
  }

  return (
    <div className="viewer">
      <div className="viewer-header">
        <button className="viewer-back-btn" onClick={onBack}>← Назад</button>
        <span className="viewer-title">{template.name}</span>
      </div>

      <div className="viewer-body">
        <aside className="viewer-sidebar">
          {template.skillGroups.map(group => (
            <div key={group.id} className="sidebar-group">
              <button
                className="sidebar-group-header"
                onClick={() => toggleGroup(group.id)}
              >
                <span className="sidebar-group-name">{group.name}</span>
                <span className={`sidebar-chevron ${collapsedGroups.has(group.id) ? 'collapsed' : ''}`}>▾</span>
              </button>
              {!collapsedGroups.has(group.id) && (
                <div className="sidebar-skills">
                  {group.skills.map(skill => (
                    <button
                      key={skill.id}
                      className={`sidebar-skill ${skill.id === selectedSkillId ? 'active' : ''}`}
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
            <SkillContent skill={selectedSkill} />
          ) : (
            <p className="page-placeholder">Выберите навык</p>
          )}
        </main>
      </div>
    </div>
  )
}

function SkillContent({ skill }: { skill: SkillDto }) {
  const itemCount = skill.subgroups.reduce((n, s) => n + s.items.length, 0)

  return (
    <div className="skill-content">
      <div className="skill-content-header">
        <h3 className="skill-content-title">{skill.name}</h3>
        <span className="skill-item-count">{itemCount} {pluralItems(itemCount)}</span>
      </div>

      {skill.subgroups.map(subgroup => (
        <div key={subgroup.id} className="subgroup-section">
          {subgroup.name && (
            <div className="subgroup-divider">{subgroup.name}</div>
          )}
          <div className="knowledge-cards">
            {subgroup.items.map(item => (
              <div key={item.id} className="knowledge-card">
                <input type="checkbox" className="knowledge-checkbox" disabled />
                <div className="knowledge-card-body">
                  <p className="knowledge-text">{item.knowledge}</p>
                  {item.description && (
                    <p className="knowledge-description">{item.description}</p>
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
                    <button className="comment-btn" disabled>Оставить комментарий</button>
                  </div>
                </div>
              </div>
            ))}
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
