export type Screen = 'dashboard' | 'users' | 'templates'

export const SCREEN_PATHS: Record<Screen, string> = {
  dashboard: '/dashboard',
  users:     '/users',
  templates: '/templates',
}

export function pathToScreen(path: string): Screen | null {
  if (path === '/' || path === '/dashboard') return 'dashboard'
  if (path === '/users') return 'users'
  if (path === '/templates') return 'templates'
  return null
}
