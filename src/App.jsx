import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboard from './pages/student/StudentDashboard'
import TakeExamPage from './pages/student/TakeExamPage'
import MyResultsPage from './pages/student/MyResultsPage'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import ExamFormPage from './pages/teacher/ExamFormPage'
import ExamDetailPage from './pages/teacher/ExamDetailPage'
import ExamResultsPage from './pages/teacher/ExamResultsPage'
import StudentListPage from './pages/teacher/StudentListPage'
import TeacherManagePage from './pages/teacher/TeacherManagePage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Student routes ── */}
          <Route element={<ProtectedRoute requiredRole="ROLE_STUDENT" />}>
            <Route element={<Layout role="student" />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/exam/:id" element={<TakeExamPage />} />
              <Route path="/student/results" element={<MyResultsPage />} />
            </Route>
          </Route>

          {/* ── Teacher routes ── */}
          <Route element={<ProtectedRoute requiredRole="ROLE_TEACHER" />}>
            <Route element={<Layout role="teacher" />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/students" element={<StudentListPage />} />
              <Route path="/teacher/teachers" element={<TeacherManagePage />} />
              <Route path="/teacher/exam/new" element={<ExamFormPage />} />
              <Route path="/teacher/exam/:id/edit" element={<ExamFormPage />} />
              <Route path="/teacher/exam/:id" element={<ExamDetailPage />} />
              <Route path="/teacher/exam/:id/results" element={<ExamResultsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
