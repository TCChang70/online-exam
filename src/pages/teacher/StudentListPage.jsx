import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getStudents, getStudentClasses, createStudent, updateStudent, deleteStudent } from '../../api/examApi'

const EMPTY_CREATE = { username: '', password: '', displayName: '', className: '' }
const EMPTY_EDIT   = { displayName: '', className: '', newPassword: '' }

export default function StudentListPage() {
  const { auth } = useAuth()
  const [students, setStudents] = useState([])
  const [classes, setClasses]   = useState([])
  const [filter, setFilter]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE)
  const [editForm, setEditForm]     = useState(EMPTY_EDIT)
  const [saving, setSaving] = useState(false)

  const reload = useCallback(() => {
    setLoading(true)
    Promise.all([
      getStudents(auth.token, filter || undefined),
      getStudentClasses(auth.token),
    ]).then(([s, c]) => { setStudents(s); setClasses(c) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [auth.token, filter])

  useEffect(() => { reload() }, [reload])

  async function handleCreate(e) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await createStudent(auth.token, createForm)
      setShowAdd(false); setCreateForm(EMPTY_CREATE); reload()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleUpdate(e) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await updateStudent(auth.token, editingId, editForm)
      setEditingId(null); reload()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(s) {
    if (!window.confirm(`確定刪除「${s.displayName}」（${s.username}）？\n此操作也將刪除其所有考試記錄，且無法復原。`)) return
    setError('')
    try { await deleteStudent(auth.token, s.id); reload() }
    catch (err) { setError(err.message) }
  }

  function startEdit(s) {
    setEditingId(s.id)
    setEditForm({ displayName: s.displayName, className: s.className ?? '', newPassword: '' })
    setShowAdd(false)
  }

  const filtered = filter ? students.filter(s => s.className === filter) : students
  const classCounts = students.reduce((acc, s) => {
    const k = s.className || '（未設定）'; acc[k] = (acc[k] ?? 0) + 1; return acc
  }, {})

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">學生管理</h1>
          <p className="text-muted text-sm">共 {students.length} 位學生 · {classes.length} 個班級</p>
        </div>
        <button className="btn btn-teacher"
          onClick={() => { setShowAdd(v => !v); setEditingId(null) }}>
          {showAdd ? '✕ 取消' : '＋ 新增學生'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ── Create form ── */}
      {showAdd && (
        <div className="card" style={{ border: '2px solid var(--teacher)', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--teacher)', marginBottom: '1rem' }}>➕ 新增學生帳號</h3>
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
                  placeholder="學生姓名" required />
              </div>
              <div className="form-group">
                <label className="form-label">班級 *</label>
                <input className="form-input" list="cls-opts" value={createForm.className}
                  onChange={e => setCreateForm({ ...createForm, className: e.target.value })}
                  placeholder="例如：資工三甲" required />
                <datalist id="cls-opts">{classes.map(c => <option key={c} value={c} />)}</datalist>
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
                {saving ? '建立中...' : '建立帳號'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Stats per class ── */}
      {!filter && classes.length > 0 && (
        <div className="stats-row">
          {Object.entries(classCounts).map(([cls, cnt]) => (
            <div key={cls} className="stat-card"
              style={{ cursor: 'pointer', borderLeft: '3px solid var(--teacher)' }}
              onClick={() => setFilter(cls === '（未設定）' ? '' : cls)}>
              <div className="stat-value" style={{ color: 'var(--teacher)', fontSize: '1.5rem' }}>{cnt}</div>
              <div className="stat-label">{cls}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Class filter tabs ── */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <span className="text-sm" style={{ fontWeight: 500, color: 'var(--gray-700)' }}>篩選班級：</span>
        <button className={`btn btn-sm ${!filter ? 'btn-teacher' : 'btn-ghost'}`} onClick={() => setFilter('')}>
          全部（{students.length}）
        </button>
        {classes.map(cls => (
          <button key={cls} className={`btn btn-sm ${filter === cls ? 'btn-teacher' : 'btn-ghost'}`}
            onClick={() => setFilter(cls)}>
            {cls}（{students.filter(s => s.className === cls).length}）
          </button>
        ))}
      </div>

      {/* ── Student table ── */}
      {loading ? (
        <div className="loading">⏳ 載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="empty"><div className="empty-icon">👥</div><p>尚無學生資料</p></div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>姓名</th><th>帳號</th><th>班級</th><th>操作</th></tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) =>
                  editingId === s.id ? (
                    <tr key={s.id} style={{ background: '#f5f3ff' }}>
                      <td colSpan={5}>
                        <form onSubmit={handleUpdate}
                          style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-end', padding: '.375rem 0', flexWrap: 'wrap' }}>
                          <div className="form-group" style={{ margin: 0, flex: '1 1 140px' }}>
                            <label className="form-label">姓名</label>
                            <input className="form-input" value={editForm.displayName}
                              onChange={e => setEditForm({ ...editForm, displayName: e.target.value })} required />
                          </div>
                          <div className="form-group" style={{ margin: 0, flex: '1 1 140px' }}>
                            <label className="form-label">班級</label>
                            <input className="form-input" list="cls-opts-edit" value={editForm.className}
                              onChange={e => setEditForm({ ...editForm, className: e.target.value })} />
                            <datalist id="cls-opts-edit">{classes.map(c => <option key={c} value={c} />)}</datalist>
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
                    <tr key={s.id}>
                      <td className="text-muted text-sm">{idx + 1}</td>
                      <td style={{ fontWeight: 500 }}>{s.displayName}</td>
                      <td className="text-muted">{s.username}</td>
                      <td>
                        {s.className
                          ? <span style={{ background: '#dbeafe', color: '#1e40af', padding: '.15rem .55rem', borderRadius: 999, fontSize: '.8rem', fontWeight: 500 }}>{s.className}</span>
                          : <span className="text-muted text-sm">—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '.4rem' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => startEdit(s)}>✏️ 編輯</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s)}>🗑 刪除</button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
