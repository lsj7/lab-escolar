import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Envuelve páginas que requieren sesión (y opcionalmente rol admin).
// OJO: esto solo mejora la experiencia; la seguridad REAL está en el backend.
export default function RutaProtegida({ soloAdmin = false, children }) {
  const { usuario, cargando } = useAuth()
  const ubicacion = useLocation()

  if (cargando) return <div className="pantalla-carga">Cargando…</div>
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  if (soloAdmin && usuario.rol !== 'admin') return <Navigate to="/" replace />
  return children
}
