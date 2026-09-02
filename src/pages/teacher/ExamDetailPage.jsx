import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getExamDetail, addQuestion, updateQuestion, deleteQuestion, setExamStatus, batchImportQuestions } from '../../api/examApi'
import OptionText from '../../components/OptionText'

const EMPTY = {
  questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
  correctAnswer: 'A', points: 1,
}

// 下載 CSV 範例模板
function downloadTemplate() {
  const template =
    '題目\t選項A\t選項B\t選項C\t選項D\t正確答案\t配分\n' +
    'Java 中哪個關鍵字用於建立物件實例？\tcreate\tnew\tinstance\tmake\tB\t2\n' +
    '以下哪個不是 Java 的基本資料型別？\tint\tboolean\tString\tdouble\tC\t2\n'
  const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '題目匯入範例.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function QuestionForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="card" style={{ border: '2px solid var(--teacher)', marginBottom: '1rem' }}>
      <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--teacher)' }}>
        {initial.questionText ? '✏️ 編輯題目' : '➕ 新增題目'}
      </h3>
      <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
        <div className="form-group">
          <label className="form-label">題目內容 *</label>
          <textarea className="form-textarea" value={form.questionText}
            onChange={e => set('questionText', e.target.value)}
            placeholder="輸入題目內容" required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {['A', 'B', 'C', 'D'].map(opt => (
            <div key={opt} className="form-group">
              <label className="form-label">
                選項 {opt}
                {form.correctAnswer === opt && (
                  <span style={{ marginLeft: '.5rem', color: 'var(--success)', fontSize: '.8rem' }}>✓ 正確答案</span>
                )}
              </label>
              <input className="form-input" value={form[`option${opt}`]}
                onChange={e => set(`option${opt}`, e.target.value)}
                placeholder={`選項 ${opt}`} required />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">正確答案 *</label>
            <select className="form-select" value={form.correctAnswer}
              onChange={e => set('correctAnswer', e.target.value)}>
              {['A', 'B', 'C', 'D'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">配分</label>
            <input type="number" className="form-input" value={form.points}
              onChange={e => set('points', Number(e.target.value))} min={1} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>取消</button>
          <button type="submit" className="btn btn-teacher" disabled={saving}>
            {saving ? '儲存中...' : (initial.questionText ? '更新題目' : '新增題目')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function ExamDetailPage() {
  const { id } = useParams()
  const { auth } = useAuth()
  const navigate = useNavigate()

  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [importMode, setImportMode] = useState('file')   // 'file' | 'paste'
  const [importText, setImportText] = useState('')
  const [importFileName, setImportFileName] = useState('')
  const [importPreview, setImportPreview] = useState([])  // 解析後預覽的題目
  const [importError, setImportError] = useState('')
  const [importResult, setImportResult] = useState('')
  const [showFormatHelp, setShowFormatHelp] = useState(true)
  const fileInputRef = useRef(null)

  const load = useCallback(() => {
    getExamDetail(auth.token, id)
      .then(setExam)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [auth.token, id])

  useEffect(load, [load])

  async function handleSave(form, qId) {
    setSaving(true)
    setError('')
    try {
      qId ? await updateQuestion(auth.token, qId, form) : await addQuestion(auth.token, id, form)
      setShowAddForm(false)
      setEditingId(null)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(qId) {
    if (!window.confirm('確定刪除此題目？')) return
    try {
      await deleteQuestion(auth.token, qId)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleToggle() {
    const action = exam.active ? '關閉' : '開放'
    if (!window.confirm(`確定要${action}「${exam.title}」嗎？\n${exam.active ? '關閉後學生將無法作答此測驗。' : '開放後學生即可作答此測驗。'}`)) return
    try {
      await setExamStatus(auth.token, id, !exam.active)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  // ── 批次匯入：解析 ──────────────────────────────────────────────
  function splitCsvLine(line) {
    // 支援標準 CSV 引號欄位（含逗號、Tab、雙引號）
    const out = []; let cur = ''; let inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
        else if (ch === '"') inQ = false
        else cur += ch
      } else if (ch === '"') inQ = true
      else if (ch === ',' || ch === '\t') { out.push(cur); cur = '' }
      else cur += ch
    }
    out.push(cur)
    return out
  }

  function parseImportText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trimEnd()).filter(l => l.trim() !== '')
    if (lines.length === 0) throw new Error('沒有可匯入的內容')

    // 若第一行是標題列（含「題目」「問題」「question」等關鍵字），略過
    let start = 0
    const first = lines[0].toLowerCase()
    if (/(題目|問題|question|題號|選項a)/.test(first) && lines.length > 1) start = 1

    // 用「第一筆資料列」判斷分隔符：分別以 Tab / 逗號解析，取欄數較多者
    const probe = lines[start]
    const tabCols = probe.split('\t').length
    const commaCols = splitCsvLine(probe).length
    const useTab = tabCols > commaCols

    const questions = []
    for (let i = start; i < lines.length; i++) {
      const cols = useTab
        ? lines[i].split('\t').map(c => c.trim())
        : splitCsvLine(lines[i]).map(c => c.trim())
      const lineNo = i + 1
      if (cols.length < 7) {
        throw new Error(`第 ${lineNo} 行僅有 ${cols.length} 欄，需包含 7 欄：題目、選項A、選項B、選項C、選項D、正確答案、配分`)
      }
      const correct = cols[5].toUpperCase()
      if (!['A', 'B', 'C', 'D'].includes(correct)) {
        throw new Error(`第 ${lineNo} 行正確答案「${cols[5]}」無效，必須是 A / B / C / D`)
      }
      const points = parseInt(cols[6], 10)
      questions.push({
        lineNo,
        questionText: cols[0],
        optionA: cols[1], optionB: cols[2], optionC: cols[3], optionD: cols[4],
        correctAnswer: correct,
        points: Number.isNaN(points) || points < 1 ? 1 : points,
      })
    }
    return questions
  }

  function handleParseText() {
    setImportError(''); setImportResult('')
    try {
      const parsed = parseImportText(importText)
      setImportPreview(parsed)
    } catch (err) {
      setImportPreview([])
      setImportError(err.message)
    }
  }

  function handleFileSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(''); setImportResult(''); setImportFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result)
        const parsed = parseImportText(text)
        setImportPreview(parsed)
      } catch (err) {
        setImportPreview([])
        setImportError(err.message)
      }
    }
    reader.onerror = () => { setImportPreview([]); setImportError('讀取檔案失敗，請重新選取') }
    reader.readAsText(file)
  }

  async function handleConfirmImport() {
    if (importPreview.length === 0) return
    setSaving(true)
    setImportError(''); setImportResult('')
    try {
      const body = importPreview.map(({ lineNo, ...q }) => q)
      const saved = await batchImportQuestions(auth.token, id, body)
      setImportResult(`✅ 成功匯入 ${saved.length} 題`)
      setImportPreview([]); setImportText(''); setImportFileName('')
      setShowImport(false)
      load()
    } catch (err) {
      setImportError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function resetImport() {
    setShowImport(false); setImportText(''); setImportPreview([])
    setImportError(''); setImportResult(''); setImportFileName('')
  }

  if (loading) return <div className="loading">⏳ 載入中...</div>
  if (!exam) return <div className="alert alert-error">{error || '找不到測驗'}</div>

  const totalPoints = exam.questions.reduce((s, q) => s + q.points, 0)

  return (
    <>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/teacher')}>← 返回</button>
          <h1 className="page-title" style={{ marginTop: '.5rem' }}>{exam.title}</h1>
          <p className="text-muted text-sm" style={{ marginTop: '.25rem' }}>
            ⏱ {exam.timeLimit} 分鐘 · 📋 {exam.questions.length} 題 · 💯 共 {totalPoints} 分 ·&nbsp;
            <span className={`badge ${exam.active ? 'badge-active' : 'badge-inactive'}`}>
              {exam.active ? '開放中' : '已關閉'}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/teacher/exam/${id}/results`)}>
            📊 查看成績
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/teacher/exam/${id}/edit`)}>
            ✏️ 編輯測驗
          </button>
          <button
            className={`btn btn-sm ${exam.active ? 'btn-inactive' : 'btn-teacher'}`}
            onClick={handleToggle}
            title={exam.active ? '關閉測驗' : '開放測驗'}
          >
            {exam.active ? '🔒 關閉測驗' : '✅ 開放測驗'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setShowImport(v => !v); setShowAddForm(false); setEditingId(null) }}>
            📥 批次匯入
          </button>
          <button className="btn btn-teacher" onClick={() => { setShowAddForm(true); setEditingId(null); setShowImport(false) }}>
            ＋ 新增題目
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {importResult && <div className="alert alert-success">{importResult}</div>}

      {/* Batch import form */}
      {showImport && (
        <div className="card" style={{ border: '2px solid var(--teacher)', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '.5rem', color: 'var(--teacher)' }}>
            📥 批次匯入題目
            <button className="btn btn-ghost btn-sm" style={{ float: 'right' }}
              onClick={() => setShowFormatHelp(v => !v)}>
              {showFormatHelp ? '▲ 收合說明' : '▼ 展開說明'}
            </button>
          </h3>

          {/* ── 輸入說明（展開） ── */}
          {showFormatHelp && (
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '.5rem' }}>📋 檔案格式說明</div>
              <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '.875rem', lineHeight: 1.8 }}>
                <li>
                  支援 <strong>.csv</strong> 檔或直接貼上文字；欄位可用 <strong>逗號（,）</strong> 或 <strong>Tab</strong> 分隔，系統會自動判斷。
                </li>
                <li>
                  每「行」代表一題，固定 <strong>7 欄</strong>，順序如下：
                </li>
              </ol>
              <div className="table-wrapper" style={{ margin: '.5rem 0' }}>
                <table style={{ fontSize: '.8rem' }}>
                  <thead>
                    <tr>
                      <th>欄位</th><th>說明</th><th>範例</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>1. 題目</td><td>題幹文字</td><td>Java 中哪個關鍵字建立物件？</td></tr>
                    <tr><td>2. 選項A</td><td>選項 A 內容</td><td>new</td></tr>
                    <tr><td>3. 選項B</td><td>選項 B 內容</td><td>create</td></tr>
                    <tr><td>4. 選項C</td><td>選項 C 內容</td><td>make</td></tr>
                    <tr><td>5. 選項D</td><td>選項 D 內容</td><td>instance</td></tr>
                    <tr><td>6. 正確答案</td><td>僅可填 A / B / C / D</td><td>A</td></tr>
                    <tr><td>7. 配分</td><td>正整數，預設 1</td><td>2</td></tr>
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: '.8rem', lineHeight: 1.7 }}>
                <div>✅ 第一行若為標題列（如「題目,選項A,...」）會自動略過。</div>
                <div>🔹 分隔符：逗號 或 Tab 皆可；分數可留空（預設 1 分）。</div>
                <div>📝 完整「一行」範例：</div>
                <code style={{ display: 'block', background: '#fff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '.5rem .75rem', margin: '.35rem 0', whiteSpace: 'pre-wrap' }}>
                  Java 中哪個關鍵字建立物件？,new,create,make,instance,A,2
                </code>
                <button className="btn btn-ghost btn-sm" onClick={downloadTemplate}
                  style={{ marginTop: '.25rem' }}>
                  ⬇ 下載 CSV 範例檔（含標題列 + 2 題）
                </button>
              </div>
            </div>
          )}

          {/* ── 輸入方式切換 ── */}
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
            <button className={`btn btn-sm ${importMode === 'file' ? 'btn-teacher' : 'btn-ghost'}`}
              onClick={() => { setImportMode('file'); setImportText(''); setImportPreview([]); setImportError('') }}>
              📄 上傳 CSV 檔
            </button>
            <button className={`btn btn-sm ${importMode === 'paste' ? 'btn-teacher' : 'btn-ghost'}`}
              onClick={() => { setImportMode('paste'); setImportPreview([]); setImportError('') }}>
              ✍️ 手動貼上
            </button>
          </div>

          {/* ── 檔案上傳模式 ── */}
          {importMode === 'file' && (
            <div style={{ border: '2px dashed var(--gray-200)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center', marginBottom: '1rem', background: '#fafafa' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                style={{ display: 'none' }}
                onChange={handleFileSelected}
              />
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📂</div>
              {importFileName ? (
                <>
                  <div style={{ fontWeight: 600 }}>{importFileName}</div>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: '.5rem' }}
                    onClick={() => fileInputRef.current.click()}>
                    重新選擇檔案
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
                    點選按鈕選擇 .csv 檔（TXT 亦可，用 Tab 分隔）
                  </p>
                  <button className="btn btn-teacher" onClick={() => fileInputRef.current.click()}>
                    選擇 CSV 檔案
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── 手動貼上模式 ── */}
          {importMode === 'paste' && (
            <div className="form-group">
              <textarea
                className="form-textarea"
                rows={7}
                style={{ fontFamily: 'monospace', fontSize: '.85rem' }}
                value={importText}
                onChange={e => { setImportText(e.target.value); setImportPreview([]) }}
                placeholder={'每行一題，欄位用 Tab 或逗號分隔：\nJava 中哪個關鍵字建立物件？\tnew\tcreate\tmake\tinstance\tA\t2\n以下哪個非基本資料型別？\tint\tboolean\tString\tdouble\tC\t2'}
              />
              {(importText.trim() && importPreview.length === 0) && (
                <button className="btn btn-ghost btn-sm" style={{ marginTop: '.5rem' }}
                  onClick={handleParseText}>
                  🔍 預覽解析結果
                </button>
              )}
            </div>
          )}

          {/* ── 解析錯誤 ── */}
          {importError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{importError}</div>}

          {/* ── 預覽結果 ── */}
          {importPreview.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem', background: '#f9fafb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                <span style={{ fontWeight: 600 }}>
                  🔎 預覽：共 {importPreview.length} 題，請確認無誤後再匯入
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => setImportPreview([])}>清除</button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>#</th><th>題目</th><th>A</th><th>B</th><th>C</th><th>D</th><th>答案</th><th>分</th></tr>
                  </thead>
                  <tbody>
                    {importPreview.slice(0, 10).map((q, idx) => (
                      <tr key={idx}>
                        <td className="text-muted text-sm">{idx + 1}</td>
                        <td className="text-sm">{q.questionText}</td>
                        <td className="text-sm">{q.optionA}</td>
                        <td className="text-sm">{q.optionB}</td>
                        <td className="text-sm">{q.optionC}</td>
                        <td className="text-sm">{q.optionD}</td>
                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>{q.correctAnswer}</td>
                        <td className="text-sm">{q.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importPreview.length > 10 && (
                <div className="text-sm text-muted" style={{ marginTop: '.5rem' }}>
                  … 其餘 {importPreview.length - 10} 題（一併匯入）
                </div>
              )}
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '.75rem' }}>
                <button className="btn btn-ghost" onClick={() => setImportPreview([])}>重新編輯</button>
                <button className="btn btn-teacher" onClick={handleConfirmImport} disabled={saving}>
                  {saving ? '匯入中...' : `✅ 確認匯入 ${importPreview.length} 題`}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={resetImport}>關閉</button>
          </div>
        </div>
      )}

      {/* Add form at top */}
      {showAddForm && (
        <QuestionForm
          initial={EMPTY}
          onSave={form => handleSave(form, null)}
          onCancel={() => setShowAddForm(false)}
          saving={saving}
        />
      )}

      {exam.questions.length === 0 && !showAddForm ? (
        <div className="empty">
          <div className="empty-icon">❓</div>
          <p>尚未新增任何題目</p>
          <button className="btn btn-teacher" style={{ marginTop: '1rem' }}
            onClick={() => setShowAddForm(true)}>
            新增第一題
          </button>
        </div>
      ) : (
        exam.questions.map((q, idx) => {
          if (editingId === q.id) {
            return (
              <QuestionForm
                key={q.id}
                initial={{ questionText: q.questionText, optionA: q.optionA, optionB: q.optionB,
                           optionC: q.optionC, optionD: q.optionD, correctAnswer: q.correctAnswer, points: q.points }}
                onSave={form => handleSave(form, q.id)}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            )
          }
          return (
            <div key={q.id} className="question-card" style={{ borderLeft: '4px solid var(--teacher)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                <div className="question-number">第 {idx + 1} 題 · {q.points} 分</div>
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  <button className="btn btn-ghost btn-sm"
                    onClick={() => { setEditingId(q.id); setShowAddForm(false) }}>
                    ✏️ 編輯
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id)}>
                    🗑 刪除
                  </button>
                </div>
              </div>
              <div className="question-text">{q.questionText}</div>
              <div className="options" style={{ pointerEvents: 'none' }}>
                {['A', 'B', 'C', 'D'].map(opt => (
                  <div key={opt} className={`option${q.correctAnswer === opt ? ' correct' : ''}`}>
                    <span className="option-label"
                      style={q.correctAnswer === opt ? { background: 'var(--success)', color: 'white' } : {}}>
                      {opt}
                    </span>
                    <OptionText value={q[`option${opt}`]} />
                    {q.correctAnswer === opt && (
                      <span style={{ marginLeft: 'auto', fontSize: '.75rem', color: 'var(--success)', fontWeight: 700 }}>
                        ✓ 正確答案
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}

      {exam.questions.length > 0 && !showAddForm && !editingId && (
        <div style={{ textAlign: 'center', marginTop: '1rem', paddingBottom: '2rem' }}>
          <button className="btn btn-teacher" onClick={() => setShowAddForm(true)}>
            ＋ 繼續新增題目
          </button>
        </div>
      )}
    </>
  )
}
