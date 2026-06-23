import { useEffect, useState } from 'react'
import type { GetUsersUseCase } from '../domain/GetUsersUseCase'
import type { UpdateRoleUseCase } from '../domain/UpdateRoleUseCase'
import type { UserEntry } from '../domain/types'

interface Props {
  getUsersUseCase: GetUsersUseCase
  updateRoleUseCase: UpdateRoleUseCase
  currentUserId: number | null
}

export function UsersPage({ getUsersUseCase, updateRoleUseCase, currentUserId }: Props) {
  const [users, setUsers] = useState<UserEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<number | null>(null)

  useEffect(() => {
    getUsersUseCase.execute()
      .then(setUsers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (user: UserEntry, newRole: string) => {
    setSaving(user.id)
    try {
      await updateRoleUseCase.execute(user.id, newRole)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <div className="page"><p className="page-placeholder">Загрузка…</p></div>

  return (
    <div className="page">
      <h2 className="page-title">Пользователи</h2>
      {error && <p className="page-error">{error}</p>}
      <div className="users-list">
        {users.map(user => (
          <div key={user.id} className="user-row">
            <span className="user-email">{user.email}</span>
            <select
              className="role-select"
              value={user.role}
              disabled={saving === user.id || user.id === currentUserId}
              onChange={e => handleRoleChange(user, e.target.value)}
            >
              <option value="admin">Администратор</option>
              <option value="user">Пользователь</option>
            </select>
            {user.id === currentUserId && (
              <span className="user-self-badge">вы</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
