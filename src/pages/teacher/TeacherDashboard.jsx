import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAllExams, deleteExam, setExamStatus } from '../../api/examApi'

export default function TeacherDashboard() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    getAllExams(auth.token)
      .then(setExams)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [auth.token])

  async function handleDelete(exam) {
    if (!window.confirm(`確定刪除「${exam.title}」？\n此操作無法復原，所有學生成績也將一併刪除。`)) return
    try {
      await deleteExam(auth.token, exam.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleToggle(exam) {
    const action = exam.active ? '關閉' : '開放'
    if (!window.confirm(`確定要${action}「${exam.title}」嗎？\n${exam.active ? '關閉後學生將無法作答此測驗。' : '開放後學生即可作答此測驗。'}`)) return
    try {
      await setExamStatus(auth.token, exam.id, !exam.active)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="loading">⏳ 載入中...</div>

  const activeCount = exams.filter(e => e.active).length

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">測驗管理</h1>
          <p className="text-muted text-sm">歡迎，{auth.displayName}（教師）</p>
        </div>
        <button className="btn btn-teacher" onClick={() => navigate('/teacher/exam/new')}>
          ＋ 建立新測驗
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--teacher)' }}>{exams.length}</div>
          <div className="stat-label">測驗總數</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{activeCount}</div>
          <div className="stat-label">開放中</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--gray-400)' }}>{exams.length - activeCount}</div>
          <div className="stat-label">已關閉</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {exams.reduce((s, e) => s + e.questionCount, 0)}
          </div>
          <div className="stat-label">題目總數</div>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📝</div>
          <p>尚未建立任何測驗</p>
          <button className="btn btn-teacher" style={{ marginTop: '1rem' }} onClick={() => navigate('/teacher/exam/new')}>
            建立第一份測驗
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>測驗名稱</th>
                  <th>題數</th>
                  <th>時間限制</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {exams.map(exam => (
                  <tr key={exam.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{exam.title}</div>
                      {exam.description && (
                        <div className="text-sm text-muted" style={{ marginTop: '.2rem' }}>
                          {exam.description}
                        </div>
                      )}
                    </td>
                    <td>{exam.questionCount} 題</td>
                    <td>{exam.timeLimit} 分鐘</td>
                    <td>
                      <span className={`badge ${exam.active ? 'badge-active' : 'badge-inactive'}`}>
                        {exam.active ? '✅ 開放中' : '🔒 已關閉'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/teacher/exam/${exam.id}`)}>
                          📋 題目管理
                        </button>
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/teacher/exam/${exam.id}/results`)}>
                          📊 查看成績
                        </button>
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/teacher/exam/${exam.id}/edit`)}>
                          ✏️ 編輯
                        </button>
                        <button
                          className={`btn btn-sm ${exam.active ? 'btn-inactive' : 'btn-teacher'}`}
                          onClick={() => handleToggle(exam)}
                          title={exam.active ? '關閉測驗' : '開放測驗'}
                        >
                          {exam.active ? '🔒 關閉' : '✅ 開放'}
                        </button>
                        <button className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(exam)}>
                          🗑 刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
