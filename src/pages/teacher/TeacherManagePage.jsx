import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../../api/examApi'

const EMPTY_CREATE = { username: '', password: '', displayName: '' }
const EMPTY_EDIT   = { displayName: '', newPassword: '' }

export default function TeacherManagePage() {
  const { auth } = useAuth()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE)
  const [editForm, setEditForm]     = useState(EMPTY_EDIT)
  const [saving, setSaving] = useState(false)

  const reload = useCallback(() => {
    setLoading(true)
    getTeachers(auth.token)
      .then(setTeachers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [auth.token])

  useEffect(() => { reload() }, [reload])

  async function handleCreate(e) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await createTeacher(auth.token, createForm)
      setShowAdd(false); setCreateForm(EMPTY_CREATE); reload()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleUpdate(e) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await updateTeacher(auth.token, editingId, editForm)
      setEditingId(null); reload()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(t) {
    if (!window.confirm(`確定刪除教師「${t.displayName}」（${t.username}）？\n注意：若此教師尚有測驗，系統將拒絕刪除。`)) return
    setError('')
    try { await deleteTeacher(auth.token, t.id); reload() }
    catch (err) { setError(err.message) }
  }

  function startEdit(t) {
    setEditingId(t.id)
    setEditForm({ displayName: t.displayName, newPassword: '' })
    setShowAdd(false)
  }

  const isSelf = (t) => t.username === auth.username

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">教師管理</h1>
          <p className="text-muted text-sm">共 {teachers.length} 位教師</p>
        </div>
        <button className="btn btn-teacher"
          onClick={() => { setShowAdd(v => !v); setEditingId(null) }}>
          {showAdd ? '✕ 取消' : '＋ 新增教師'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ── Create form ── */}
      {showAdd && (
        <div className="card" style={{ border: '2px solid var(--teacher)', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--teacher)', marginBottom: '1rem' }}>➕ 新增教師帳號</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">帳號 *</label>
                <input className="form-input" value={createForm.username}
                  onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder="3–50 字元" required minLength={3} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">顯示姓名 *</label>
                <input className="form-input" value={createForm.displayName}
                  onChange={e => setCreateForm({ ...createForm, displayName: e.target.value })}
                  placeholder="例如：李老師" required />
              </div>
              <div className="form-group">
                <label className="form-label">初始密碼 *</label>
                <input type="password" className="form-input" value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="至少 6 個字元" required minLength={6} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>取消</button>
              <button type="submit" className="btn btn-teacher" disabled={saving}>
                {saving ? '建立中...' : '建立教師帳號'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Teacher table ── */}
      {loading ? (
        <div className="loading">⏳ 載入中...</div>
      ) : teachers.length === 0 ? (
        <div className="empty"><div className="empty-icon">👨‍🏫</div><p>尚無教師資料</p></div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>姓名</th><th>帳號</th><th>操作</th></tr>
              </thead>
              <tbody>
                {teachers.map((t, idx) =>
                  editingId === t.id ? (
                    <tr key={t.id} style={{ background: '#f5f3ff' }}>
                      <td colSpan={4}>
                        <form onSubmit={handleUpdate}
                          style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-end', padding: '.375rem 0', flexWrap: 'wrap' }}>
                          <div className="form-group" style={{ margin: 0, flex: '1 1 160px' }}>
                            <label className="form-label">顯示姓名</label>
                            <input className="form-input" value={editForm.displayName}
                              onChange={e => setEditForm({ ...editForm, displayName: e.target.value })} required />
                          </div>
                          <div className="form-group" style={{ margin: 0, flex: '1 1 180px' }}>
                            <label className="form-label">新密碼（留空不變）</label>
                            <input type="password" className="form-input" value={editForm.newPassword}
                              onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })}
                              placeholder="留空 = 不修改" minLength={6} />
                          </div>
                          <div style={{ display: 'flex', gap: '.4rem', paddingBottom: '1px' }}>
                            <button type="submit" className="btn btn-teacher btn-sm" disabled={saving}>
                              {saving ? '...' : '✅ 儲存'}
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm"
                              onClick={() => setEditingId(null)}>取消</button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={t.id}>
                      <td className="text-muted text-sm">{idx + 1}</td>
                      <td style={{ fontWeight: 500 }}>
                        {t.displayName}
                        {isSelf(t) && (
                          <span style={{ marginLeft: '.5rem', background: '#f3e8ff', color: '#7c3aed', padding: '.1rem .45rem', borderRadius: 999, fontSize: '.75rem' }}>
                            自己
                          </span>
                        )}
                      </td>
                      <td className="text-muted">{t.username}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '.4rem' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => startEdit(t)}>✏️ 編輯</button>
                          <button className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(t)}
                            disabled={isSelf(t)}
                            title={isSelf(t) ? '無法刪除自己的帳號' : ''}>
                            🗑 刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          <div className="alert alert-info" style={{ marginTop: '1rem', fontSize: '.8rem' }}>
            ℹ️ 自己的帳號無法刪除。若教師尚有測驗，系統將拒絕刪除，請先刪除其名下所有測驗後再移除帳號。
          </div>
        </div>
      )}
    </>
  )
}
