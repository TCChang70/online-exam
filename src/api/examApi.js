const BASE = '/api'   // Vite proxy → http://localhost:8080

function authHeader(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

async function handle(res) {
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

/* ── Auth ─────────────────────────────────────────── */
export const login    = (body) => fetch(`${BASE}/auth/login`,    { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }).then(handle)
export const register = (body) => fetch(`${BASE}/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }).then(handle)

/* ── Exams ────────────────────────────────────────── */
export const getActiveExams    = (token)         => fetch(`${BASE}/exams`,           { headers: authHeader(token) }).then(handle)
export const getAllExams        = (token)         => fetch(`${BASE}/exams/all`,        { headers: authHeader(token) }).then(handle)
export const getExamForStudent = (token, examId) => fetch(`${BASE}/exams/${examId}/take`,   { headers: authHeader(token) }).then(handle)
export const getExamDetail     = (token, examId) => fetch(`${BASE}/exams/${examId}/detail`, { headers: authHeader(token) }).then(handle)

export const createExam = (token, body)         => fetch(`${BASE}/exams`,            { method:'POST',   headers:authHeader(token), body:JSON.stringify(body) }).then(handle)
export const updateExam = (token, examId, body) => fetch(`${BASE}/exams/${examId}`,  { method:'PUT',    headers:authHeader(token), body:JSON.stringify(body) }).then(handle)
export const deleteExam = (token, examId)       => fetch(`${BASE}/exams/${examId}`,  { method:'DELETE', headers:authHeader(token) }).then(handle)
export const setExamStatus = (token, examId, active) =>
  fetch(`${BASE}/exams/${examId}/status`, { method:'PATCH', headers:authHeader(token), body:JSON.stringify({ active }) }).then(handle)
export const submitExam = (token, examId, answers) =>
  fetch(`${BASE}/exams/${examId}/submit`, { method:'POST', headers:authHeader(token), body:JSON.stringify({ answers }) }).then(handle)

/* ── Questions ────────────────────────────────────── */
export const addQuestion    = (token, examId, body)      => fetch(`${BASE}/exams/${examId}/questions`,      { method:'POST',   headers:authHeader(token), body:JSON.stringify(body) }).then(handle)
export const updateQuestion = (token, questionId, body)  => fetch(`${BASE}/exams/questions/${questionId}`,  { method:'PUT',    headers:authHeader(token), body:JSON.stringify(body) }).then(handle)
export const deleteQuestion = (token, questionId)        => fetch(`${BASE}/exams/questions/${questionId}`,  { method:'DELETE', headers:authHeader(token) }).then(handle)
export const batchImportQuestions = (token, examId, questions) =>
  fetch(`${BASE}/exams/${examId}/questions/batch`, { method:'POST', headers:authHeader(token), body:JSON.stringify({ questions }) }).then(handle)

/* ── Students ─────────────────────────────────────── */
export const getStudents = (token, className) => {
  const qs = className ? `?className=${encodeURIComponent(className)}` : ''
  return fetch(`${BASE}/students${qs}`, { headers: authHeader(token) }).then(handle)
}
export const getStudentClasses = (token) => fetch(`${BASE}/students/classes`, { headers: authHeader(token) }).then(handle)
export const createStudent = (token, body) => fetch(`${BASE}/students`, { method:'POST', headers:authHeader(token), body:JSON.stringify(body) }).then(handle)
export const updateStudent = (token, id, body) => fetch(`${BASE}/students/${id}`, { method:'PUT', headers:authHeader(token), body:JSON.stringify(body) }).then(handle)
export const deleteStudent = (token, id) => fetch(`${BASE}/students/${id}`, { method:'DELETE', headers:authHeader(token) }).then(handle)

/* ── Teachers CRUD ────────────────────────────────── */
export const getTeachers    = (token)            => fetch(`${BASE}/teachers`,       { headers: authHeader(token) }).then(handle)
export const createTeacher  = (token, body)      => fetch(`${BASE}/teachers`,       { method:'POST',   headers:authHeader(token), body:JSON.stringify(body) }).then(handle)
export const updateTeacher  = (token, id, body)  => fetch(`${BASE}/teachers/${id}`, { method:'PUT',    headers:authHeader(token), body:JSON.stringify(body) }).then(handle)
export const deleteTeacher  = (token, id)        => fetch(`${BASE}/teachers/${id}`, { method:'DELETE', headers:authHeader(token) }).then(handle)

/* ── Results ──────────────────────────────────────── */
export const getMyResults   = (token)         => fetch(`${BASE}/results/my`,           { headers: authHeader(token) }).then(handle)
export const getExamResults = (token, examId) => fetch(`${BASE}/results/exam/${examId}`,{ headers: authHeader(token) }).then(handle)
