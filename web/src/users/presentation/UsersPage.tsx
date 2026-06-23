import { useEffect, useState } from 'react'
import type { GetUsersUseCase } from '../domain/GetUsersUseCase'
import type { UpdateRoleUseCase } from '../domain/UpdateRoleUseCase'
import type { UpdateProfileUseCase } from '../domain/UpdateProfileUseCase'
import type { UserEntry } from '../domain/types'

interface Props {
  getUsersUseCase: GetUsersUseCase
  updateRoleUseCase: UpdateRoleUseCase
  updateProfileUseCase: UpdateProfileUseCase
  currentUserId: number | null
}

interface EditState {
  user: UserEntry
  firstName: string
  lastName: string
  role: string
}

export function UsersPage({ getUsersUseCase, updateRoleUseCase, updateProfileUseCase, currentUserId }: Props) {
  const [users, setUsers] = useState<UserEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  useEffect(() => {
    getUsersUseCase.execute()
      .then(setUsers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const openEdit = (user: UserEntry) => {
    setEdit({
      user,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      role: user.role,
    })
    setModalError(null)
  }

  const closeEdit = () => {
    if (!saving) setEdit(null)
  }

  const handleSave = async () => {
    if (!edit) return
    setSaving(true)
    setModalError(null)
    try {
      await updateProfileUseCase.execute(edit.user.id, edit.firstName, edit.lastName)
      if (edit.role !== edit.user.role) {
        await updateRoleUseCase.execute(edit.user.id, edit.role)
      }
      setUsers(prev => prev.map(u =>
        u.id === edit.user.id
          ? {
              ...u,
              firstName: edit.firstName.trim() || null,
              lastName: edit.lastName.trim() || null,
              role: edit.role,
            }
          : u
      ))
      setEdit(null)
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page"><p className="page-placeholder">Загрузка…</p></div>

  return (
    <div className="page">
      <h2 className="page-title">Пользователи</h2>
      {error && <p className="page-error">{error}</p>}
      <div className="users-list">
        {users.map(user => {
          const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
          return (
            <div key={user.id} className="user-row">
              <div className="user-info">
                <span className="user-email">{user.email}</span>
                {fullName && <span className="user-name">{fullName}</span>}
              </div>
              <span className={`role-badge-inline ${user.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
              </span>
              {user.id === currentUserId && (
                <span className="user-self-badge">вы</span>
              )}
              <button className="user-edit-btn" onClick={() => openEdit(user)}>
                Редактировать
              </button>
            </div>
          )
        })}
      </div>

      {edit && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Редактирование пользователя</span>
              <button className="modal-close" onClick={closeEdit}>✕</button>
            </div>
            <div className="modal-form">
              <p className="user-modal-email">{edit.user.email}</p>
              <div className="form-field">
                <label className="form-label">Имя</label>
                <input
                  className="user-modal-input"
                  placeholder="Имя"
                  value={edit.firstName}
                  onChange={e => setEdit(prev => prev && { ...prev, firstName: e.target.value })}
                  disabled={saving}
                  maxLength={100}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Фамилия</label>
                <input
                  className="user-modal-input"
                  placeholder="Фамилия"
                  value={edit.lastName}
                  onChange={e => setEdit(prev => prev && { ...prev, lastName: e.target.value })}
                  disabled={saving}
                  maxLength={100}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Роль</label>
                <select
                  className="form-select"
                  value={edit.role}
                  disabled={saving || edit.user.id === currentUserId}
                  onChange={e => setEdit(prev => prev && { ...prev, role: e.target.value })}
                >
                  <option value="admin">Администратор</option>
                  <option value="user">Пользователь</option>
                </select>
              </div>
              {modalError && <p className="form-error">{modalError}</p>}
              <div className="modal-actions">
                <button className="modal-cancel-btn" disabled={saving} onClick={closeEdit}>
                  Отмена
                </button>
                <button className="modal-submit-btn" disabled={saving} onClick={handleSave}>
                  {saving ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
