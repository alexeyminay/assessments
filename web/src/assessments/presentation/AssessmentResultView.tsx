import type { AssessmentDetail } from '../domain/types'
import { displayUser } from '../domain/types'
import type { TemplateDetailDto } from '../../templates/domain/AssessmentTemplate'
import { calcGroupResult, type GroupResult, type SkillResult } from '../domain/scoring'
import { RadarChart, RADAR_COLORS, type RadarColor } from './RadarChart'

interface Props {
  detail:               AssessmentDetail
  snapshot:             TemplateDetailDto
  onSwitchToQuestions:  () => void
}

const GRADE_CLASS: Record<string, string> = {
  Intern: 'badge-intern',
  Junior: 'badge-junior',
  Middle: 'badge-middle',
  Senior: 'badge-senior',
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span className="result-no-grade">—</span>
  return <span className={`badge ${GRADE_CLASS[grade] ?? 'badge-level'}`}>{grade}</span>
}

function ProgressLabel({ result }: { result: SkillResult | GroupResult }) {
  if (!result.grade && result.nextGrade) {
    return <span className="result-progress">осталось 100% до {result.nextGrade}</span>
  }
  if (result.grade === 'Senior' || (!result.nextGrade && result.grade)) {
    return <span className="result-progress result-progress-max">максимум</span>
  }
  if (result.progressToNext !== null && result.nextGrade) {
    return <span className="result-progress">осталось {result.progressToNext}% до {result.nextGrade}</span>
  }
  return null
}

function GroupSection({ group, color }: { group: GroupResult; color: RadarColor }) {
  const hasMain       = group.mainSkills.length > 0
  const hasAdditional = group.additionalSkills.length > 0

  return (
    <div className="result-group">
      <div className="result-group-header">
        <span className="result-group-name">{group.groupName}</span>
        {hasMain && (
          <span className="result-group-grade">
            <GradeBadge grade={group.grade} />
            <ProgressLabel result={group} />
          </span>
        )}
      </div>

      {hasMain && (
        <div className="result-group-body">
          {group.mainSkills.length >= 2 && (
            <div className="result-radar-wrap">
              <RadarChart
                labels={group.mainSkills.map(s => s.skillName)}
                values={group.mainSkills.map(s => s.normalizedScore)}
                color={color}
              />
            </div>
          )}
          <div className="result-skills-table">
            {group.mainSkills.map(skill => (
              <div key={skill.skillId} className="result-skill-row">
                <span className="result-skill-name">{skill.skillName}</span>
                <GradeBadge grade={skill.grade} />
                <ProgressLabel result={skill} />
              </div>
            ))}
          </div>
        </div>
      )}

      {hasAdditional && (
        <div className="result-additional">
          <p className="result-additional-label">Дополнительные баллы</p>
          {group.additionalSkills.map(skill => (
            <div key={skill.skillId} className="result-skill-row">
              <span className="result-skill-name">{skill.skillName}</span>
              <span className="result-score">
                {skill.achievedScore} / {skill.maxScore} балл.
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    .replace(' г.', '')
}

export function AssessmentResultView({ detail, snapshot, onSwitchToQuestions }: Props) {
  const checkedIds = new Set(detail.answers.filter(a => a.checked).map(a => a.itemId))
  const groups     = snapshot.skillGroups.map(g => calcGroupResult(g, checkedIds))

  return (
    <div className="result-view">

      {/* Info card */}
      <div className="result-info-card">
        <div className="result-info-top">
          <span className="result-info-heading">Сводка по ассессменту</span>
          <button className="btn-secondary result-to-questions-btn" onClick={onSwitchToQuestions}>
            К вопросам →
          </button>
        </div>

        <div className="result-info-grid">
          <span className="result-info-label">Проходил</span>
          <span className="result-info-value">
            {displayUser(detail.assessee)}
            {(detail.assessee.firstName || detail.assessee.lastName) && (
              <span className="result-info-email"> · {detail.assessee.email}</span>
            )}
          </span>

          <span className="result-info-label">Назначил</span>
          <span className="result-info-value">{displayUser(detail.assignedBy)}</span>

          {detail.reviewers.length > 0 && <>
            <span className="result-info-label">Проверяющие</span>
            <span className="result-info-value">{detail.reviewers.map(displayUser).join(', ')}</span>
          </>}

          <span className="result-info-label">Назначен</span>
          <span className="result-info-value">{formatDate(detail.createdAt)}</span>

          {detail.startedAt && <>
            <span className="result-info-label">Начат</span>
            <span className="result-info-value">{formatDate(detail.startedAt)}</span>
          </>}

          {detail.submittedAt && <>
            <span className="result-info-label">Отправлен</span>
            <span className="result-info-value">{formatDate(detail.submittedAt)}</span>
          </>}

          {detail.reviewStartedAt && <>
            <span className="result-info-label">Проверка начата</span>
            <span className="result-info-value">{formatDate(detail.reviewStartedAt)}</span>
          </>}

          {detail.completedAt && <>
            <span className="result-info-label">Завершён</span>
            <span className="result-info-value">{formatDate(detail.completedAt)}</span>
          </>}
        </div>
      </div>

      {/* Final comment */}
      {detail.finalComment && (
        <div className="result-final-comment">
          <p className="result-final-comment-label">Итоговый комментарий</p>
          <p className="result-final-comment-text">{detail.finalComment}</p>
        </div>
      )}

      {/* Skill groups */}
      {groups.map((group, idx) => (
        <GroupSection
          key={group.groupId}
          group={group}
          color={RADAR_COLORS[idx % RADAR_COLORS.length]}
        />
      ))}
    </div>
  )
}
