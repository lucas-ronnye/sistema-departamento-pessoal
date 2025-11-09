import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

type User = ({ id?: number; nome?: string; email?: string; permissoes?: string[] } & Record<string, any>) | null

type AuthContextType = {
  token: string | null
  user: User
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Carrega token do localStorage e busca o usuário
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      setIsAuthenticated(true)
      axios
        .get('/api/auth/me', {
          headers: { Authorization: `Bearer ${savedToken}` },
        })
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
          setIsAuthenticated(false)
        })
    }
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const { data } = await axios.post('/api/login', { username, password })
      const receivedToken: string | undefined = data?.token
      if (!receivedToken) {
        throw new Error('Token ausente na resposta de login')
      }

      // Salva token
      localStorage.setItem('token', receivedToken)
      setToken(receivedToken)
      setIsAuthenticated(true)

      // Busca dados do usuário
      const me = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${receivedToken}` },
      })
      setUser(me.data)
    } catch (err) {
      // Reset em caso de erro
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

export default AuthContext