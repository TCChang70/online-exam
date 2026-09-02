import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register } from '../api/examApi'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', displayName: '', className: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await register(form)
      authLogin(data)
      navigate('/student')
    } catch (err) {
      setError(err.message || '註冊失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '.5rem' }}>👨‍🎓</div>
        <h1 className="auth-title">學生帳號註冊</h1>
        <p className="auth-subtitle">建立您的個人帳號</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">帳號</label>
            <input
              className="form-input"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="3–50 個字元"
              autoFocus
              required
              minLength={3}
            />
          </div>
          <div className="form-group">
            <label className="form-label">顯示名稱</label>
            <input
              className="form-input"
              value={form.displayName}
              onChange={e => setForm({ ...form, displayName: e.target.value })}
              placeholder="您的姓名"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">屬於班級 *</label>
            <input
              className="form-input"
              value={form.className}
              onChange={e => setForm({ ...form, className: e.target.value })}
              placeholder="例如：資工三甲、資工三乙"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">密碼</label>
            <input
              type="password"
              className="form-input"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="至少 6 個字元"
              required
              minLength={6}
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '.625rem' }}
            disabled={loading}
          >
            {loading ? '建立中...' : '建立帳號'}
          </button>
        </form>

        <hr className="divider" />
        <p className="text-sm text-muted" style={{ textAlign: 'center' }}>
          已有帳號？ <Link to="/login">立即登入</Link>
        </p>
      </div>
    </div>
  )
}
