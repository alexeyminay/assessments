import type { Screen } from './types'

interface NavItem {
  screen: Screen
  label: string
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { screen: 'dashboard', label: 'Дашборд' },
  { screen: 'users',     label: 'Пользователи', adminOnly: true },
  { screen: 'templates', label: 'Шаблоны ассессментов' },
]

interface Props {
  active: Screen
  role: string | null
  onChange: (screen: Screen) => void
}

export function NavBar({ active, role, onChange }: Props) {
  const visible = NAV_ITEMS.filter(item => !item.adminOnly || role === 'admin')
  return (
    <nav className="nav-bar">
      {visible.map(item => (
        <button
          key={item.screen}
          className={`nav-item${active === item.screen ? ' active' : ''}`}
          onClick={() => onChange(item.screen)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
