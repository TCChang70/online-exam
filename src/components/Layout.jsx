import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ role }) {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()
  const isTeacher = role === 'teacher'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      <nav className={`navbar${isTeacher ? ' teacher' : ''}`}>
        <span className="navbar-brand">
          {isTeacher ? '🎓 測驗管理後台' : '📝 線上測驗系統'}
        </span>
        <div className="navbar-links">
          {isTeacher ? (
            <>
              <Link to="/teacher" className="btn btn-ghost btn-sm">測驗管理</Link>
              <Link to="/teacher/students" className="btn btn-ghost btn-sm">👥 學生管理</Link>
              <Link to="/teacher/teachers" className="btn btn-ghost btn-sm">👨‍🏫 教師管理</Link>
            </>
          ) : (
            <>
              <Link to="/student" className="btn btn-ghost btn-sm">測驗列表</Link>
              <Link to="/student/results" className="btn btn-ghost btn-sm">我的成績</Link>
            </>
          )}
          <span className="navbar-user">
            👤 {auth?.displayName}
            {!isTeacher && auth?.className && (
              <span style={{ marginLeft:'.4rem', fontSize:'.75rem', background:'#dbeafe', color:'#1e40af', padding:'.15rem .45rem', borderRadius:999 }}>
                {auth.className}
              </span>
            )}
          </span>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm">登出</button>
        </div>
      </nav>
      <main className="page-container">
        <Outlet />
      </main>
    </>
  )
}
