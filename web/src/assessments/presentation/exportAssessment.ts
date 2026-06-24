import * as XLSX from 'xlsx'
import type { AssessmentDetail } from '../domain/types'
import { displayUser } from '../domain/types'
import type { TemplateDetailDto } from '../../templates/domain/AssessmentTemplate'
import { calcGroupResult } from '../domain/scoring'

function fmtDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    .replace(' г.', '')
}

function fmtDateFile(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU').replace(/\./g, '-')
}

export function exportAssessmentToXlsx(
  detail:   AssessmentDetail,
  snapshot: TemplateDetailDto,
) {
  const checkedIds  = new Set(detail.answers.filter(a => a.checked).map(a => a.itemId))
  const commentMap  = new Map(detail.comments.map(c => [c.itemId, c.text]))
  const groups      = snapshot.skillGroups.map(g => calcGroupResult(g, checkedIds))

  const rows: (string | number | null)[][] = []

  // ── Info ────────────────────────────────────────────────────────
  rows.push(['Ассессмент', detail.templateName])
  const assesseeName = displayUser(detail.assessee)
  const assesseeExtra = (detail.assessee.firstName || detail.assessee.lastName)
    ? detail.assessee.email : null
  rows.push(['Проходил', assesseeName, assesseeExtra])
  rows.push(['Назначил', displayUser(detail.assignedBy)])
  if (detail.reviewers.length > 0)
    rows.push(['Проверяющие', detail.reviewers.map(displayUser).join(', ')])
  rows.push(['Назначен', fmtDate(detail.createdAt)])
  if (detail.startedAt)       rows.push(['Начат',            fmtDate(detail.startedAt)])
  if (detail.submittedAt)     rows.push(['Отправлен',        fmtDate(detail.submittedAt)])
  if (detail.reviewStartedAt) rows.push(['Проверка начата',  fmtDate(detail.reviewStartedAt)])
  if (detail.completedAt)     rows.push(['Завершён',         fmtDate(detail.completedAt)])
  if (detail.finalComment)    rows.push(['Итоговый комментарий', detail.finalComment])
  rows.push([])

  // ── Grades summary ──────────────────────────────────────────────
  rows.push(['Группа навыков', 'Навык', 'Грейд', 'Следующий грейд', 'До следующего'])
  for (const group of groups) {
    for (const skill of group.mainSkills) {
      const prog = skill.progressToNext !== null && skill.nextGrade
        ? `осталось ${skill.progressToNext}% до ${skill.nextGrade}`
        : skill.grade === 'Senior' ? 'максимум' : ''
      rows.push([group.groupName, skill.skillName, skill.grade ?? '—', skill.nextGrade ?? '—', prog])
    }
    if (group.mainSkills.length > 0) {
      const prog = group.progressToNext !== null && group.nextGrade
        ? `осталось ${group.progressToNext}% до ${group.nextGrade}`
        : group.grade === 'Senior' ? 'максимум' : ''
      rows.push([group.groupName, '(итого по группе)', group.grade ?? '—', group.nextGrade ?? '—', prog])
    }
    if (group.additionalSkills.length > 0) {
      for (const skill of group.additionalSkills) {
        rows.push([group.groupName, skill.skillName, `${skill.achievedScore} / ${skill.maxScore} балл.`, '', ''])
      }
    }
    rows.push([])
  }

  // ── Questions (import-compatible format + result columns) ───────
  rows.push([
    'Группа навыков', 'Навык', 'Подгруппа', 'Знание', 'Описание',
    'Уровень', 'Обязательный', 'Тип',
    'Выполнено', 'Комментарий',
  ])

  for (const group of snapshot.skillGroups) {
    let lastGroup = ''
    let lastSkill = ''
    for (const skill of group.skills) {
      let lastSub = ''
      for (const subgroup of skill.subgroups) {
        for (const item of subgroup.items) {
          const colA = lastGroup !== group.name ? group.name : ''
          const colB = lastSkill !== skill.name ? skill.name : ''
          const colC = lastSub !== (subgroup.name ?? '') ? (subgroup.name ?? '—') : ''
          lastGroup = group.name
          lastSkill = skill.name
          lastSub   = subgroup.name ?? ''

          const level = item.gradeLevel
            ?? (item.scorePoints != null ? `${item.scorePoints} балл` : '—')

          rows.push([
            colA,
            colB,
            colC,
            item.knowledge,
            item.description ?? '—',
            level,
            item.mandatory ? 'да' : 'нет',
            item.knowledgeType,
            checkedIds.has(item.id) ? 'да' : 'нет',
            commentMap.get(item.id) ?? '',
          ])
        }
      }
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 22 }, // A
    { wch: 22 }, // B
    { wch: 18 }, // C
    { wch: 55 }, // D — knowledge text (longest)
    { wch: 35 }, // E — description
    { wch: 10 }, // F — level
    { wch: 13 }, // G — mandatory
    { wch: 16 }, // H — type
    { wch: 11 }, // I — checked
    { wch: 40 }, // J — comment
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Результаты')

  const dateStr  = fmtDateFile(detail.completedAt ?? detail.createdAt)
  const fileName = `${detail.templateName}_${displayUser(detail.assessee)}_${dateStr}.xlsx`
    .replace(/[/\\?%*:|"<>]/g, '_')

  XLSX.writeFile(wb, fileName)
}
