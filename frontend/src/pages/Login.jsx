import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { usuario, iniciarSesion } = useAuth()
  const ubicacion = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Con sesión iniciada regresamos a la página que se quería visitar (o al inicio)
  if (usuario) return <Navigate to={ubicacion.state?.desde ?? '/'} replace />

  async function entrar(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await iniciarSesion(username, password)
    } catch (err) {
      setError(err.message)
      setPassword('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login">
      <div className="login-pizarra">
        <h1>Sistema Escolar</h1>
        <p>Control de alumnos, maestros, materias y grupos.</p>
      </div>

      <div className="login-formulario">
        <form onSubmit={entrar} noValidate>
          <h2 className="h4 mb-1">Iniciar sesión</h2>
          <p className="text-secundario mb-4">Usa la cuenta que te asignó un administrador.</p>

          {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

          <div className="mb-3">
            <label htmlFor="usuario" className="form-label">Usuario</label>
            <input id="usuario" className="form-control" autoComplete="username" autoFocus required
              value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div className="mb-4">
            <label htmlFor="clave" className="form-label">Contraseña</label>
            <div className="input-group">
              <input id="clave" className="form-control" type={mostrar ? 'text' : 'password'} autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="btn btn-outline-secondary" onClick={() => setMostrar(!mostrar)} aria-pressed={mostrar}>
                {mostrar ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <button className="btn btn-primary w-100" disabled={enviando || !username || !password}>
            {enviando ? 'Verificando…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
