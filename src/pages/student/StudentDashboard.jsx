import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getActiveExams } from '../../api/examApi'

export default function StudentDashboard() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getActiveExams(auth.token)
      .then(setExams)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [auth.token])

  if (loading) return <div className="loading">⏳ 載入測驗列表中...</div>
  if (error) return <div className="alert alert-error">{error}</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">可用測驗</h1>
          <p className="text-muted text-sm">
            歡迎回來，<strong>{auth.displayName}</strong>！請選擇要參加的測驗。
          </p>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📭</div>
          <p>目前沒有開放中的測驗，請稍後再查看。</p>
        </div>
      ) : (
        <div className="exam-grid">
          {exams.map(exam => (
            <div key={exam.id} className="exam-card">
              <h3>{exam.title}</h3>
              <p>{exam.description || '點擊下方按鈕開始測驗'}</p>
              <div className="exam-meta">
                <span>📋 {exam.questionCount} 題</span>
                <span>⏱ {exam.timeLimit} 分鐘</span>
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                onClick={() => navigate(`/student/exam/${exam.id}`)}
              >
                開始測驗 →
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
