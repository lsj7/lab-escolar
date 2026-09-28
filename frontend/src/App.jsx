import { Navigate, Route, Routes } from 'react-router-dom'
import RutaProtegida from './components/RutaProtegida.jsx'
import CrudPage from './components/CrudPage.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import Login from './pages/Login.jsx'
import Inicio from './pages/Inicio.jsx'
import Perfil from './pages/Perfil.jsx'
import { alumnos, grupos, maestros, materias, usuarios } from './config/entidades.js'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RutaProtegida><DashboardLayout /></RutaProtegida>}>
        <Route index element={<Inicio />} />
        {/* "key" obliga a React a crear una página nueva al cambiar de catálogo */}
        <Route path="alumnos" element={<CrudPage key="alumnos" config={alumnos} />} />
        <Route path="maestros" element={<CrudPage key="maestros" config={maestros} />} />
        <Route path="materias" element={<CrudPage key="materias" config={materias} />} />
        <Route path="grupos" element={<CrudPage key="grupos" config={grupos} />} />
        <Route path="usuarios" element={<RutaProtegida soloAdmin><CrudPage key="usuarios" config={usuarios} /></RutaProtegida>} />
        <Route path="perfil" element={<Perfil />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
