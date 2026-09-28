import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // Al abrir la app preguntamos al backend si ya hay una sesión válida
    api('/auth/me')
      .then((d) => setUsuario(d.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false))

    const alExpirar = () => setUsuario(null)
    window.addEventListener('sesion-expirada', alExpirar)
    return () => window.removeEventListener('sesion-expirada', alExpirar)
  }, [])

  async function iniciarSesion(username, password) {
    const d = await api('/auth/login', { method: 'POST', body: { username, password } })
    setUsuario(d.usuario)
  }

  async function cerrarSesion() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
