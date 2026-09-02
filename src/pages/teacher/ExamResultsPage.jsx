import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getExamResults } from '../../api/examApi'

const GRADE_BG = { A:'#10b981', B:'#3b82f6', C:'#f59e0b', D:'#f97316', F:'#ef4444' }

export default function ExamResultsPage() {
  const { id } = useParams()
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getExamResults(auth.token, id)
      .then(setResults)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [auth.token, id])

  if (loading) return <div className="loading">⏳ 載入成績中...</div>

  const examTitle = results[0]?.examTitle ?? '測驗'
  const gradeCount = results.reduce((acc, r) => { acc[r.grade] = (acc[r.grade] ?? 0) + 1; return acc }, {})
  const avg = results.length
    ? (results.reduce((s, r) => s + r.percentage, 0) / results.length).toFixed(1)
    : 0
  const highest = results.length ? Math.max(...results.map(r => r.percentage)) : 0
  const lowest  = results.length ? Math.min(...results.map(r => r.percentage)) : 0

  return (
    <>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/teacher/exam/${id}`)}>
            ← 返回題目管理
          </button>
          <h1 className="page-title" style={{ marginTop: '.5rem' }}>{examTitle}</h1>
          <p className="text-muted text-sm">成績總覽</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {results.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📊</div>
          <p>尚無學生提交此測驗</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--teacher)' }}>{results.length}</div>
              <div className="stat-label">已作答人數</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--primary)' }}>{avg}%</div>
              <div className="stat-label">班級平均</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--success)' }}>{highest}%</div>
              <div className="stat-label">最高分</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{lowest}%</div>
              <div className="stat-label">最低分</div>
            </div>
          </div>

          {/* Grade distribution */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 className="card-title">等級分布</h3>
            {['A', 'B', 'C', 'D', 'F'].map(grade => {
              const count = gradeCount[grade] ?? 0
              const pct = results.length ? (count / results.length * 100) : 0
              return (
                <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.5rem' }}>
                  <span className={`badge badge-grade-${grade}`} style={{ width: '2rem', justifyContent: 'center', fontWeight: 700 }}>
                    {grade}
                  </span>
                  <div className="progress-bar-bg" style={{ flex: 1, height: 22, borderRadius: '.375rem' }}>
                    <div style={{
                      width: `${pct}%`,
                      background: GRADE_BG[grade],
                      height: 22,
                      borderRadius: '.375rem',
                      transition: 'width .4s',
                      display: 'flex', alignItems: 'center', paddingLeft: '.5rem',
                      color: 'white', fontSize: '.75rem', fontWeight: 600,
                    }}>
                      {count > 0 && `${count} 人`}
                    </div>
                  </div>
                  <span className="text-sm text-muted" style={{ minWidth: 40 }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>

          {/* Results table */}
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>班級</th>
                    <th>學生姓名</th>
                    <th>得分</th>
                    <th>得分率</th>
                    <th>等級</th>
                    <th>提交時間</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={r.id}>
                      <td style={{ color: idx < 3 ? ['#f59e0b','#9ca3af','#b45309'][idx] : '#d1d5db', fontWeight: 700 }}>
                        #{idx + 1}
                      </td>
                      <td>
                        {r.studentClass
                          ? <span style={{ background:'#dbeafe', color:'#1e40af', padding:'.15rem .5rem', borderRadius:999, fontSize:'.8rem', fontWeight:500 }}>{r.studentClass}</span>
                          : <span className="text-muted text-sm">—</span>
                        }
                      </td>
                      <td style={{ fontWeight: 500 }}>{r.studentName}</td>
                      <td>{r.score} / {r.totalPoints}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          <div className="progress-bar-bg" style={{ flex: 1, height: 8, minWidth: 60 }}>
                            <div className="progress-bar-fill" style={{
                              width: `${r.percentage}%`,
                              background: 'var(--teacher)',
                              height: 8,
                            }} />
                          </div>
                          <span style={{ minWidth: 42, textAlign: 'right' }}>{r.percentage}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-grade-${r.grade}`} style={{ fontWeight: 700 }}>
                          {r.grade}
                        </span>
                      </td>
                      <td className="text-sm text-muted">
                        {new Date(r.submittedAt).toLocaleString('zh-TW')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}
