import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

const SECCIONES = [
  { clave: 'alumnos', texto: 'Alumnos', ruta: '/alumnos' },
  { clave: 'maestros', texto: 'Maestros', ruta: '/maestros' },
  { clave: 'materias', texto: 'Materias', ruta: '/materias' },
  { clave: 'grupos', texto: 'Grupos', ruta: '/grupos' },
]

export default function Inicio() {
  const { usuario } = useAuth()
  const [resumen, setResumen] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/resumen').then(setResumen).catch((e) => setError(e.message))
  }, [])

  const primerNombre = usuario.nombre.split(' ')[0]

  return (
    <section>
      <header className="mb-4">
        <h1>Hola, {primerNombre}</h1>
        <p className="text-secundario mb-0">
          {usuario.rol === 'admin'
            ? 'Como administrador puedes gestionar los catálogos y las cuentas de usuario.'
            : 'Desde el menú puedes registrar y actualizar alumnos, maestros, materias y grupos.'}
        </p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="resumen">
        {SECCIONES.map((s) => (
          <Link key={s.clave} to={s.ruta} className="resumen-item">
            <span className="resumen-numero">{resumen ? resumen[s.clave] : '…'}</span>
            <span>{s.texto} registrados</span>
          </Link>
        ))}
      </div>

      <blockquote className="versiculo">
        “El temor de Jehová es el principio de la sabiduría.”
        <cite>Proverbios 9:10</cite>
      </blockquote>
    </section>
  )
}
