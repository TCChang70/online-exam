import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const s = localStorage.getItem('exam_auth')
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  })

  function login(data) {
    const payload = { token: data.token, username: data.username, role: data.role, displayName: data.displayName, className: data.className }
    localStorage.setItem('exam_auth', JSON.stringify(payload))
    setAuth(payload)
  }

  function logout() {
    localStorage.removeItem('exam_auth')
    setAuth(null)
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
