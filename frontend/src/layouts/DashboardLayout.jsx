import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from '../components/Avatar.jsx'

const MENU = [
  { a: '/', texto: 'Inicio', fin: true },
  { a: '/alumnos', texto: 'Alumnos' },
  { a: '/maestros', texto: 'Maestros' },
  { a: '/materias', texto: 'Materias' },
  { a: '/grupos', texto: 'Grupos' },
]

export default function DashboardLayout() {
  const { usuario, cerrarSesion } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const navegar = useNavigate()
  const esAdmin = usuario.rol === 'admin'

  async function salir() {
    await cerrarSesion()
    navegar('/login', { replace: true })
  }

  const enlace = ({ isActive }) => `enlace-menu ${isActive ? 'activo' : ''}`

  return (
    <div className="app">
      <header className="barra-movil">
        <button className="btn btn-sm btn-outline-light" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} aria-controls="menu-lateral">
          Menú
        </button>
        <span>Sistema Escolar</span>
      </header>

      <aside id="menu-lateral" className={`menu-lateral ${abierto ? 'abierto' : ''}`}>
        <div className="marca">Sistema Escolar</div>

        <div className="ficha-usuario">
          <Avatar usuario={usuario} tamano={76} className="avatar-grande" />
          <div className="ficha-nombre">{usuario.nombre}</div>
          <div className="ficha-dato">@{usuario.username}</div>
          {usuario.email && <div className="ficha-dato">{usuario.email}</div>}
          <span className={`insignia-rol ${usuario.rol}`}>{esAdmin ? 'Administrador' : 'Usuario'}</span>
        </div>

        <nav aria-label="Menú principal" onClick={() => setAbierto(false)}>
          <div className="grupo-menu">Escuela</div>
          {MENU.map((m) => <NavLink key={m.a} to={m.a} end={m.fin} className={enlace}>{m.texto}</NavLink>)}

          <div className="grupo-menu">Cuenta</div>
          {esAdmin && <NavLink to="/usuarios" className={enlace}>Usuarios</NavLink>}
          <NavLink to="/perfil" className={enlace}>Mi perfil</NavLink>
        </nav>

        <button className="btn-salir" onClick={salir}>Cerrar sesión</button>
      </aside>

      {abierto && <div className="velo" onClick={() => setAbierto(false)} />}

      <main className="contenido">
        <Outlet />
      </main>
    </div>
  )
}
