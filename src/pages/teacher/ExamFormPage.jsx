import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createExam, updateExam, getExamDetail } from '../../api/examApi'

export default function ExamFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { auth } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ title: '', description: '', timeLimit: 60 })
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    getExamDetail(auth.token, id)
      .then(data => setForm({ title: data.title, description: data.description ?? '', timeLimit: data.timeLimit }))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [auth.token, id, isEdit])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      isEdit
        ? await updateExam(auth.token, id, form)
        : await createExam(auth.token, form)
      navigate('/teacher')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">⏳ 載入中...</div>

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? '✏️ 編輯測驗' : '➕ 建立新測驗'}</h1>
        <button className="btn btn-ghost" onClick={() => navigate('/teacher')}>← 返回</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">測驗標題 *</label>
            <input
              className="form-input"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="例如：Java 基礎概念測驗"
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">測驗描述</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="說明測驗範圍與目標（選填）"
            />
          </div>
          <div className="form-group">
            <label className="form-label">時間限制（分鐘）</label>
            <input
              type="number"
              className="form-input"
              value={form.timeLimit}
              onChange={e => setForm({ ...form, timeLimit: Number(e.target.value) })}
              min={1}
              max={360}
              style={{ maxWidth: 160 }}
            />
          </div>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/teacher')}>取消</button>
            <button type="submit" className="btn btn-teacher" disabled={saving}>
              {saving ? '儲存中...' : isEdit ? '更新測驗' : '建立測驗'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
