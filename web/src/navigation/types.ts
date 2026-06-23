export type Screen = 'dashboard' | 'users' | 'templates'

export const SCREEN_PATHS: Record<Screen, string> = {
  dashboard: '/dashboard',
  users:     '/users',
  templates: '/templates',
}

export function pathToScreen(path: string): Screen | null {
  if (path === '/' || path === '/dashboard') return 'dashboard'
  if (path === '/users') return 'users'
  if (path.startsWith('/templates')) return 'templates'
  if (path.startsWith('/assessments')) return 'dashboard'
  return null
}

export function pathToTemplateId(path: string): number | null {
  const match = path.match(/^\/templates\/(\d+)$/)
  return match ? parseInt(match[1], 10) : null
}

export function pathToAssessmentId(path: string): number | null {
  const match = path.match(/^\/assessments\/(\d+)$/)
  return match ? parseInt(match[1], 10) : null
}
