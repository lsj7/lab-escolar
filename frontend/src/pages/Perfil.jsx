import { useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from '../components/Avatar.jsx'

export default function Perfil() {
  const { usuario, setUsuario } = useAuth()

  return (
    <section>
      <header className="mb-4">
        <h1>Mi perfil</h1>
        <p className="text-secundario mb-0">Actualiza tu foto y tu contraseña.</p>
      </header>
      <div className="row g-4">
        <div className="col-lg-5"><Foto usuario={usuario} alCambiar={setUsuario} /></div>
        <div className="col-lg-7"><CambioPassword /></div>
      </div>
    </section>
  )
}

function Foto({ usuario, alCambiar }) {
  const [archivo, setArchivo] = useState(null)
  const [vista, setVista] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  function elegir(e) {
    const f = e.target.files[0]
    setMensaje(null)
    if (!f) return
    if (f.size > 2 * 1024 * 1024) return setMensaje({ tipo: 'danger', texto: 'La foto no debe pesar más de 2 MB' })
    setArchivo(f)
    setVista(URL.createObjectURL(f))
  }

  async function subir() {
    const datos = new FormData()
    datos.append('foto', archivo)
    try {
      const r = await api('/auth/me/foto', { method: 'PUT', formData: datos })
      alCambiar(r.usuario)
      setArchivo(null)
      setVista(null)
      setMensaje({ tipo: 'success', texto: 'Foto actualizada' })
    } catch (e) {
      setMensaje({ tipo: 'danger', texto: e.message })
    }
  }

  return (
    <div className="panel p-4 h-100">
      <h2 className="h5 mb-3">Foto de perfil</h2>
      <div className="d-flex align-items-center gap-3 mb-3">
        {vista
          ? <img src={vista} alt="Vista previa" className="avatar avatar-grande" style={{ width: 96, height: 96 }} />
          : <Avatar usuario={usuario} tamano={96} className="avatar-grande" />}
        <div className="small text-secundario">JPG, PNG o WEBP. Máximo 2 MB.</div>
      </div>
      {mensaje && <div className={`alert alert-${mensaje.tipo} py-2`}>{mensaje.texto}</div>}
      <input type="file" accept="image/jpeg,image/png,image/webp" className="form-control mb-3" onChange={elegir} aria-label="Elegir foto" />
      <button className="btn btn-primary" disabled={!archivo} onClick={subir}>Guardar foto</button>
    </div>
  )
}

function CambioPassword() {
  const vacio = { actual: '', nueva: '', confirmacion: '' }
  const [valores, setValores] = useState(vacio)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState(null)

  const cambiar = (e) => setValores({ ...valores, [e.target.name]: e.target.value })

  async function guardar(e) {
    e.preventDefault()
    setErrores({})
    setMensaje(null)
    if (valores.nueva !== valores.confirmacion) {
      return setErrores({ confirmacion: 'No coincide con la nueva contraseña' })
    }
    try {
      await api('/auth/me/password', { method: 'PUT', body: { actual: valores.actual, nueva: valores.nueva } })
      setValores(vacio)
      setMensaje({ tipo: 'success', texto: 'Contraseña actualizada' })
    } catch (err) {
      setErrores(err.detalles ?? {})
      setMensaje({ tipo: 'danger', texto: err.message })
    }
  }

  const campo = (nombre, etiqueta, ayuda) => (
    <div className="mb-3">
      <label htmlFor={nombre} className="form-label">{etiqueta}</label>
      <input id={nombre} name={nombre} type="password" autoComplete={nombre === 'actual' ? 'current-password' : 'new-password'}
        className={`form-control ${errores[nombre] ? 'is-invalid' : ''}`} value={valores[nombre]} onChange={cambiar} />
      {errores[nombre] ? <div className="invalid-feedback">{errores[nombre]}</div> : ayuda && <div className="form-text">{ayuda}</div>}
    </div>
  )

  return (
    <form className="panel p-4" onSubmit={guardar} noValidate>
      <h2 className="h5 mb-3">Cambiar contraseña</h2>
      {mensaje && <div className={`alert alert-${mensaje.tipo} py-2`}>{mensaje.texto}</div>}
      {campo('actual', 'Contraseña actual')}
      {campo('nueva', 'Nueva contraseña', 'Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.')}
      {campo('confirmacion', 'Confirma la nueva contraseña')}
      <button className="btn btn-primary" disabled={!valores.actual || !valores.nueva}>Cambiar contraseña</button>
    </form>
  )
}
