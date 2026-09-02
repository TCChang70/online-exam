import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getExamForStudent, submitExam } from '../../api/examApi'
import OptionText from '../../components/OptionText'

const GRADE_COLOR = { A: '#065f46', B: '#1e40af', C: '#92400e', D: '#9a3412', F: '#991b1b' }

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function OptionRow({ q, opt, selected, onSelect, readOnly }) {
  const checked = selected === opt
  return (
    <button
      type="button"
      className={`option${checked ? ' selected' : ''}`}
      style={{ width: '100%', textAlign: 'left', cursor: readOnly ? 'default' : 'pointer' }}
      onClick={() => { if (!readOnly) onSelect(opt) }}
    >
      <span className="option-label">{opt}</span>
      <OptionText value={q[`option${opt}`]} />
      {checked && <span style={{ marginLeft: 'auto', color: 'var(--success)', fontWeight: 700 }}>✓</span>}
    </button>
  )
}

export default function TakeExamPage() {
  const { id } = useParams()
  const { auth } = useAuth()
  const navigate = useNavigate()

  const [exam, setExam] = useState(null)
  const [answers, setAnswers] = useState({})    // { "questionId": "A" }
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase] = useState('exam')    // 'exam' | 'review'
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    getExamForStudent(auth.token, id)
      .then(data => { setExam(data); setTimeLeft(data.timeLimit * 60) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [auth.token, id])

  useEffect(() => {
    if (!timeLeft || timeLeft <= 0 || result) return
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, result])

  useEffect(() => {
    if (!exam || phase !== 'exam') return
    if (timeLeft === 0) setPhase('review')
  }, [timeLeft, exam, phase])

  function gotoQuestion(i) {
    setCurrentIdx(i)
    setPhase('exam')
  }

  async function handleSubmit() {
    const unanswered = (exam?.questions?.length ?? 0) - Object.keys(answers).length
    if (unanswered > 0 && !window.confirm(`尚有 ${unanswered} 題未作答，確定要提交嗎？`)) return
    setSubmitting(true)
    setError('')
    try {
      const data = await submitExam(auth.token, id, answers)
      setResult(data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading">⏳ 載入題目中...</div>

  if (error && !exam) return (
    <div>
      <div className="alert alert-error">{error}</div>
      <button className="btn btn-ghost" onClick={() => navigate('/student')}>← 返回測驗列表</button>
    </div>
  )

  /* ── Result Screen ── */
  if (result) {
    return (
      <div className="card" style={{ maxWidth: 520, margin: '2rem auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '.75rem' }}>
          {result.grade === 'A' ? '🏆' : result.grade === 'B' ? '🎉' : result.grade === 'C' ? '👍' : '📚'}
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '.25rem' }}>測驗完成！</h2>
        <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>{result.examTitle}</p>

        <div className="result-big-score">{result.score} / {result.totalPoints}</div>
        <div className="result-grade" style={{ color: GRADE_COLOR[result.grade] ?? '#374151' }}>
          {result.grade}
        </div>
        <p className="text-muted" style={{ marginTop: '.5rem' }}>{result.percentage}%</p>

        <div
          style={{
            background: '#f9fafb', borderRadius: '.5rem', padding: '.875rem',
            margin: '1.25rem 0', fontSize: '.875rem', color: '#4b5563'
          }}
        >
          {result.percentage >= 90 ? '🌟 優秀！繼續保持！'
            : result.percentage >= 70 ? '💪 不錯，再接再厲！'
            : '📖 建議複習相關章節後再次挑戰！'}
        </div>

        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/student')}>
            返回測驗列表
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/student/results')}>
            查看所有成績
          </button>
        </div>
      </div>
    )
  }

  const total = exam.questions.length
  const answered = Object.keys(answers).length
  const isWarning = timeLeft !== null && timeLeft < 300
  const q = exam.questions[currentIdx]

  if (total === 0) return (
    <div className="card" style={{ maxWidth: 480, margin: '2rem auto', textAlign: 'center' }}>
      <div className="empty-icon">❗</div>
      <h2 style={{ fontWeight: 700, margin: '.5rem 0' }}>此測驗尚無題目</h2>
      <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>請等待教師新增題目後再作答。</p>
      <button className="btn btn-primary" onClick={() => navigate('/student')}>返回測驗列表</button>
    </div>
  )

  return (
    <>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 56, background: 'white',
        borderBottom: '1px solid #e5e7eb', padding: '.75rem 0',
        marginBottom: '1.5rem', zIndex: 50,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
          <div>
            <span style={{ fontWeight: 700 }}>{exam.title}</span>
            <span className="text-muted text-sm" style={{ marginLeft: '.75rem' }}>
              {phase === 'review'
                ? '📋 檢查答案（複習頁）'
                : `第 ${currentIdx + 1} / ${total} 題`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {timeLeft !== null && (
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: isWarning ? '#ef4444' : '#374151' }}>
                ⏱ {formatTime(timeLeft)}
                {isWarning && <span style={{ fontSize: '.75rem', marginLeft: '.4rem' }}>⚠ 時間不多了</span>}
              </span>
            )}
          </div>
        </div>
        <div className="progress-bar-bg" style={{ height: 6 }}>
          <div className="progress-bar-fill" style={{ width: `${(answered / total) * 100}%`, background: '#3b82f6' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '.6rem' }}>
          <span className="text-sm text-muted">已作答 {answered} / {total} 題</span>
          <button className="btn btn-success btn-sm" onClick={() => setPhase('review')}>
            📋 檢查並提交
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Question palette */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '.75rem 1rem' }}>
        <div className="text-sm text-muted" style={{ marginBottom: '.5rem', fontWeight: 500 }}>答題導覽</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.45rem' }}>
          {exam.questions.map((qq, i) => {
            const isAnswered = Boolean(answers[String(qq.id)])
            return (
              <button
                key={qq.id}
                className={`btn btn-sm ${isAnswered ? 'btn-success' : 'btn-ghost'}`}
                style={{
                  minWidth: 38,
                  border: phase === 'exam' && i === currentIdx ? '2px solid var(--primary)' : undefined,
                  opacity: !isAnswered ? 0.85 : undefined,
                }}
                onClick={() => gotoQuestion(i)}
                title={isAnswered ? `第 ${i + 1} 題：已回答` : `第 ${i + 1} 題：未回答`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>

      {phase === 'review' ? (
        /* ── Review screen ── */
        <div>
          {exam.questions.map((qq, i) => {
            const selected = answers[String(qq.id)]
            return (
              <div key={qq.id} className="question-card" style={{ borderLeft: selected ? '4px solid var(--success)' : '4px solid var(--gray-200)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                  <div className="question-number">第 {i + 1} 題 · {qq.points} 分</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => gotoQuestion(i)}>
                    ✏️ 修改答案
                  </button>
                </div>
                <div className="question-text">{qq.questionText}</div>
                <div className="options" style={{ pointerEvents: 'none' }}>
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div key={opt} className={`option${selected === opt ? ' selected' : ''}`}>
                      <span className="option-label">{opt}</span>
                      <OptionText value={qq[`option${opt}`]} />
                      {selected === opt && <span style={{ marginLeft: 'auto', color: 'var(--success)', fontWeight: 700 }}>我的答案</span>}
                    </div>
                  ))}
                </div>
                {!selected && (
                  <div className="text-sm" style={{ marginTop: '.5rem', color: '#ef4444', fontWeight: 500 }}>
                    ⚠ 尚未作答
                  </div>
                )}
              </div>
            )
          })}

          <div className="card" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
            <div className="text-sm text-muted">
              已作答 <strong>{answered}</strong> / {total} 題
              {answered < total && (
                <span style={{ color: '#ef4444', marginLeft: '.5rem' }}>尚有 {total - answered} 題未作答</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setPhase('exam')}>← 返回作答</button>
              <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>
                {submitting ? '提交中...' : `✅ 確認提交作答`}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Single question screen ── */
        <div>
          <div className="question-card">
            <div className="question-number">第 {currentIdx + 1} 題 · {q.points} 分</div>
            <div className="question-text">{q.questionText}</div>
            <div className="options">
              {['A', 'B', 'C', 'D'].map(opt => (
                <OptionRow
                  key={opt}
                  q={q}
                  opt={opt}
                  selected={answers[String(q.id)]}
                  onSelect={o => setAnswers(prev => ({ ...prev, [String(q.id)]: o }))}
                />
              ))}
            </div>
          </div>

          {/* Prev / Next navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0 2rem' }}>
            <button
              className="btn btn-ghost"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(currentIdx - 1)}
            >
              ← 上一題
            </button>
            {currentIdx < total - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setCurrentIdx(currentIdx + 1)}
              >
                下一題 →
              </button>
            ) : (
              <button className="btn btn-success" onClick={() => setPhase('review')}>
                📋 檢查並提交
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
