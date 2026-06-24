import type { AssessmentDetail } from '../domain/types'
import type { TemplateDetailDto } from '../../templates/domain/AssessmentTemplate'
import { calcGroupResult, type GroupResult, type SkillResult } from '../domain/scoring'
import { RadarChart, RADAR_COLORS, type RadarColor } from './RadarChart'

interface Props {
  detail: AssessmentDetail
  snapshot: TemplateDetailDto
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
    return <span className="result-progress">0% до {result.nextGrade}</span>
  }
  if (result.grade === 'Senior' || (!result.nextGrade && result.grade)) {
    return <span className="result-progress result-progress-max">максимум</span>
  }
  if (result.progressToNext !== null && result.nextGrade) {
    return <span className="result-progress">{result.progressToNext}% до {result.nextGrade}</span>
  }
  return null
}

function GroupSection({ group, color }: { group: GroupResult; color: RadarColor }) {
  const hasMain = group.mainSkills.length > 0
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

export function AssessmentResultView({ detail, snapshot }: Props) {
  const checkedIds = new Set(detail.answers.filter(a => a.checked).map(a => a.itemId))
  const groups = snapshot.skillGroups.map(g => calcGroupResult(g, checkedIds))

  return (
    <div className="result-view">
      {detail.finalComment && (
        <div className="result-final-comment">
          <p className="result-final-comment-label">Итоговый комментарий</p>
          <p className="result-final-comment-text">{detail.finalComment}</p>
        </div>
      )}

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
