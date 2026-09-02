import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login } from '../api/examApi'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form)
      authLogin(data)
      navigate(data.role === 'ROLE_TEACHER' ? '/teacher' : '/student')
    } catch (err) {
      setError(err.message || '帳號或密碼錯誤')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '.5rem' }}>📝</div>
        <h1 className="auth-title">線上測驗系統</h1>
        <p className="auth-subtitle">請輸入帳號密碼登入</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">帳號</label>
            <input
              className="form-input"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="輸入帳號"
              autoFocus
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
              placeholder="輸入密碼"
              required
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '.625rem' }}
            disabled={loading}
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        <hr className="divider" />
        <p className="text-sm text-muted" style={{ textAlign: 'center' }}>
          還沒有帳號？ <Link to="/register">學生註冊</Link>
        </p>

        <div className="alert alert-info" style={{ marginTop: '1rem', fontSize: '.8rem' }}>
          <strong>測試帳號：</strong><br />
          🎓 教師：<code>teacher</code> / <code>password123</code><br />
          👨‍🎓 學生：<code>student1</code> / <code>password123</code>
        </div>
      </div>
    </div>
  )
}
