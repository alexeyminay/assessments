import type { SkillGroupDto, SkillDto } from '../../templates/domain/AssessmentTemplate'

export const GRADE_WEIGHTS: Record<string, number> = {
  Intern: 0.5,
  Junior: 1.0,
  Middle: 1.5,
  Senior: 2.0,
}

export interface SkillResult {
  skillId: number
  skillName: string
  isAdditional: boolean
  achievedScore: number
  maxScore: number
  grade: string | null
  nextGrade: string | null
  progressToNext: number | null  // 0-100, score / nextGradeThreshold * 100
  normalizedScore: number        // 0-1 for radar
}

export interface GroupResult {
  groupId: number
  groupName: string
  mainSkills: SkillResult[]
  additionalSkills: SkillResult[]
  achievedScore: number
  maxScore: number
  grade: string | null
  nextGrade: string | null
  progressToNext: number | null
  normalizedScore: number  // 0-1 for radar
}

interface GradeThreshold { grade: string; threshold: number }

function buildThresholds(items: Array<{ gradeLevel: string | null }>): GradeThreshold[] {
  const count = (g: string) => items.filter(i => i.gradeLevel === g).length
  const internMax  = count('Intern')  * 0.5
  const juniorMax  = internMax  + count('Junior')  * 1.0
  const middleMax  = juniorMax  + count('Middle')  * 1.5
  const seniorMax  = middleMax  + count('Senior')  * 2.0
  const out: GradeThreshold[] = []
  if (internMax > 0)              out.push({ grade: 'Intern', threshold: internMax })
  if (juniorMax > internMax)      out.push({ grade: 'Junior', threshold: juniorMax })
  if (middleMax > juniorMax)      out.push({ grade: 'Middle', threshold: middleMax })
  if (seniorMax > middleMax)      out.push({ grade: 'Senior', threshold: seniorMax })
  if (out.length > 0 && out[out.length - 1].grade !== 'Senior') {
    out.push({ grade: 'Senior', threshold: seniorMax })
  }
  return out
}

function resolveGrade(
  score: number,
  thresholds: GradeThreshold[],
): { grade: string | null; nextGrade: string | null; progressToNext: number | null } {
  if (thresholds.length === 0) return { grade: null, nextGrade: null, progressToNext: null }

  let idx = -1
  for (let i = 0; i < thresholds.length; i++) {
    if (score >= thresholds[i].threshold) idx = i
  }

  const cur  = idx >= 0 ? thresholds[idx] : null
  const next = idx < thresholds.length - 1 ? thresholds[idx + 1] : null

  let progressToNext: number | null = null
  if (next && next.threshold > 0) {
    progressToNext = Math.min(100, Math.max(0, Math.round((score / next.threshold) * 100)))
  }

  return { grade: cur?.grade ?? null, nextGrade: next?.grade ?? null, progressToNext }
}

export function calcSkillResult(skill: SkillDto, checkedIds: Set<number>): SkillResult {
  const allItems = skill.subgroups.flatMap(s => s.items)
  const gradeItems = allItems.filter(i => i.gradeLevel != null && GRADE_WEIGHTS[i.gradeLevel] !== undefined)

  const isAdditional = gradeItems.length === 0

  if (isAdditional) {
    const scoreItems = allItems.filter(i => i.scorePoints != null)
    const maxScore = scoreItems.reduce((s, i) => s + (i.scorePoints ?? 0), 0)
    const achievedScore = scoreItems.filter(i => checkedIds.has(i.id)).reduce((s, i) => s + (i.scorePoints ?? 0), 0)
    return {
      skillId: skill.id, skillName: skill.name,
      isAdditional: true, achievedScore, maxScore,
      grade: null, nextGrade: null, progressToNext: null,
      normalizedScore: maxScore > 0 ? achievedScore / maxScore : 0,
    }
  }

  let achievedScore = 0
  for (const item of gradeItems) {
    if (checkedIds.has(item.id)) achievedScore += GRADE_WEIGHTS[item.gradeLevel!]
  }

  const thresholds = buildThresholds(gradeItems)
  const maxScore = thresholds.length > 0 ? thresholds[thresholds.length - 1].threshold : 0
  const { grade, nextGrade, progressToNext } = resolveGrade(achievedScore, thresholds)

  return {
    skillId: skill.id, skillName: skill.name,
    isAdditional: false, achievedScore, maxScore,
    grade, nextGrade, progressToNext,
    normalizedScore: maxScore > 0 ? Math.min(1, achievedScore / maxScore) : 0,
  }
}

function effectiveGradeWeight(skill: SkillResult): number {
  if (!skill.grade) return 0
  if (skill.progressToNext !== null && skill.progressToNext >= 90 && skill.nextGrade) {
    return GRADE_WEIGHTS[skill.nextGrade] ?? GRADE_WEIGHTS[skill.grade] ?? 0
  }
  return GRADE_WEIGHTS[skill.grade] ?? 0
}

export function calcGroupResult(group: SkillGroupDto, checkedIds: Set<number>): GroupResult {
  const skillResults     = group.skills.map(s => calcSkillResult(s, checkedIds))
  const mainSkills       = skillResults.filter(s => !s.isAdditional)
  const additionalSkills = skillResults.filter(s =>  s.isAdditional)

  // Group score = sum of effective grade weights per main skill.
  // If progressToNext >= 90%, the skill contributes the NEXT grade's weight.
  const achievedScore = mainSkills.reduce((sum, s) => sum + effectiveGradeWeight(s), 0)

  // Fixed thresholds: N skills × grade weight.
  // Equivalent to "average skill grade ≥ threshold grade".
  const n = mainSkills.length
  const thresholds: GradeThreshold[] = n === 0 ? [] : [
    { grade: 'Intern', threshold: n * 0.5 },
    { grade: 'Junior', threshold: n * 1.0 },
    { grade: 'Middle', threshold: n * 1.5 },
    { grade: 'Senior', threshold: n * 2.0 },
  ]

  const maxScore = n * 2.0
  const { grade, nextGrade, progressToNext } = resolveGrade(achievedScore, thresholds)
  const normalizedScore = maxScore > 0 ? Math.min(1, achievedScore / maxScore) : 0

  return { groupId: group.id, groupName: group.name, mainSkills, additionalSkills, achievedScore, maxScore, grade, nextGrade, progressToNext, normalizedScore }
}
