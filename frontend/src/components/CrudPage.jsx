// Página CRUD genérica: tabla con búsqueda + formulario en ventana modal.
// Cada catálogo (alumnos, maestros, etc.) solo describe sus campos y columnas
// en src/config/entidades.js y reutiliza este mismo componente.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'

const normalizar = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default function CrudPage({ config }) {
  const { titulo, descripcion, recurso, singular, campos, columnas, puedeEditar = () => true } = config
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState(null) // null = cerrado, {} = nuevo, fila = edición
  const [opciones, setOpciones] = useState({})

  const cargar = useCallback(async () => {
    try {
      setFilas(await api(`/${recurso}`))
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [recurso])

  useEffect(() => { cargar() }, [cargar])

  // Opciones de los <select> que dependen de otra tabla (ej. maestros de una materia)
  useEffect(() => {
    const recursos = [...new Set(campos.filter((c) => c.recurso).map((c) => c.recurso))]
    Promise.all(recursos.map((r) => api(`/${r}`).then((d) => [r, d])))
      .then((pares) => setOpciones(Object.fromEntries(pares)))
      .catch(() => {})
  }, [campos, editando])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 3500)
    return () => clearTimeout(t)
  }, [aviso])

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    if (!q) return filas
    return filas.filter((f) => columnas.some((c) => normalizar(c.texto ? c.texto(f) : f[c.campo]).includes(q)))
  }, [filas, busqueda, columnas])

  async function eliminar(fila) {
    const nombre = fila.nombre ?? fila.clave
    if (!window.confirm(`¿Eliminar ${singular} "${nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await api(`/${recurso}/${fila.id}`, { method: 'DELETE' })
      setAviso(`${capitalizar(singular)} eliminado`)
      cargar()
    } catch (e) {
      setError(e.message)
    }
  }

  function alGuardar(esNuevo) {
    setEditando(null)
    setAviso(`${capitalizar(singular)} ${esNuevo ? 'agregado' : 'actualizado'}`)
    cargar()
  }

  return (
    <section>
      <header className="encabezado-pagina">
        <div>
          <h1>{titulo}</h1>
          {descripcion && <p className="text-secundario mb-0">{descripcion}</p>}
        </div>
        <button className="btn btn-primary" onClick={() => setEditando({})}>Agregar {singular}</button>
      </header>

      {aviso && <div className="alert alert-success py-2" role="status">{aviso}</div>}
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center py-2" role="alert">
          <span>{error}</span>
          <button className="btn-close" aria-label="Cerrar" onClick={() => setError('')} />
        </div>
      )}

      <div className="panel">
        <div className="panel-barra">
          <input
            type="search"
            className="form-control buscador"
            placeholder={`Buscar en ${titulo.toLowerCase()}`}
            aria-label={`Buscar en ${titulo.toLowerCase()}`}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span className="text-secundario small">{visibles.length} de {filas.length}</span>
        </div>

        <div className="table-responsive">
          <table className="table tabla align-middle mb-0">
            <thead>
              <tr>
                {columnas.map((c) => <th key={c.campo} scope="col">{c.etiqueta}</th>)}
                <th scope="col" className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando && <tr><td colSpan={columnas.length + 1} className="vacio">Cargando…</td></tr>}
              {!cargando && visibles.length === 0 && (
                <tr>
                  <td colSpan={columnas.length + 1} className="vacio">
                    {filas.length === 0 ? `Todavía no hay registros. Usa "Agregar ${singular}" para crear el primero.` : 'Ningún registro coincide con la búsqueda.'}
                  </td>
                </tr>
              )}
              {visibles.map((f) => (
                <tr key={f.id}>
                  {columnas.map((c) => <td key={c.campo}>{c.render ? c.render(f) : (f[c.campo] ?? <span className="text-secundario">—</span>)}</td>)}
                  <td className="text-end text-nowrap">
                    {puedeEditar(f) ? (
                      <>
                        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setEditando(f)}>Editar</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(f)}>Eliminar</button>
                      </>
                    ) : <span className="text-secundario small">Protegido</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editando && (
        <Formulario
          config={config}
          inicial={editando}
          opciones={opciones}
          onCerrar={() => setEditando(null)}
          onGuardado={alGuardar}
        />
      )}
    </section>
  )
}

function capitalizar(t) { return t.charAt(0).toUpperCase() + t.slice(1) }

function valorInicial(campo, fila) {
  const v = fila[campo.nombre] ?? campo.porDefecto
  if (campo.tipo === 'checkbox') return v === undefined ? true : Boolean(Number(v))
  if (campo.tipo === 'password') return ''
  return v == null ? '' : String(v)
}

function Formulario({ config, inicial, opciones, onCerrar, onGuardado }) {
  const esNuevo = !inicial.id
  const campos = config.campos.filter((c) => !(c.soloAlCrear && !esNuevo) && !(c.soloAlEditar && esNuevo))
  const [valores, setValores] = useState(() => Object.fromEntries(campos.map((c) => [c.nombre, valorInicial(c, inicial)])))
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const alPresionar = (e) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alPresionar)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', alPresionar)
      document.body.classList.remove('modal-open')
    }
  }, [onCerrar])

  const cambiar = (nombre, valor) => setValores((v) => ({ ...v, [nombre]: valor }))

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setErrores({})
    setErrorGeneral('')
    try {
      await api(esNuevo ? `/${config.recurso}` : `/${config.recurso}/${inicial.id}`, {
        method: esNuevo ? 'POST' : 'PUT',
        body: valores,
      })
      onGuardado(esNuevo)
    } catch (err) {
      setErrores(err.detalles ?? {})
      setErrorGeneral(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="titulo-formulario">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <form className="modal-content" onSubmit={guardar} noValidate>
            <div className="modal-header">
              <h2 className="modal-title h5" id="titulo-formulario">
                {esNuevo ? `Agregar ${config.singular}` : `Editar ${config.singular}`}
              </h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} />
            </div>

            <div className="modal-body">
              {errorGeneral && <div className="alert alert-danger py-2">{errorGeneral}</div>}
              <div className="row g-3">
                {campos.map((c, i) => (
                  <Campo
                    key={c.nombre}
                    campo={c}
                    valor={valores[c.nombre]}
                    error={errores[c.nombre]}
                    opciones={opciones[c.recurso]}
                    enfocar={i === 0}
                    esNuevo={esNuevo}
                    onChange={(v) => cambiar(c.nombre, v)}
                  />
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={onCerrar}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  )
}

function Campo({ campo, valor, error, opciones, enfocar, esNuevo, onChange }) {
  const id = `campo-${campo.nombre}`
  const clase = `form-control ${error ? 'is-invalid' : ''}`
  const requerido = campo.requerido || (campo.requeridoAlCrear && esNuevo)
  const ayuda = esNuevo ? campo.ayudaAlCrear ?? campo.ayuda : campo.ayudaAlEditar ?? campo.ayuda

  if (campo.tipo === 'checkbox') {
    return (
      <div className="col-12">
        <div className="form-check form-switch">
          <input id={id} type="checkbox" className="form-check-input" role="switch" checked={valor} onChange={(e) => onChange(e.target.checked)} />
          <label htmlFor={id} className="form-check-label">{campo.etiqueta}</label>
        </div>
      </div>
    )
  }

  let control
  if (campo.tipo === 'select') {
    const lista = campo.opciones ?? opciones ?? []
    control = (
      <select id={id} className={`form-select ${error ? 'is-invalid' : ''}`} value={valor} autoFocus={enfocar} onChange={(e) => onChange(e.target.value)}>
        <option value="">{campo.textoVacio ?? 'Selecciona…'}</option>
        {lista.map((o) => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.id} value={o.id}>{campo.etiquetaOpcion(o)}</option>)}
      </select>
    )
  } else {
    control = (
      <>
        <input
          id={id}
          type={campo.tipo ?? 'text'}
          className={clase}
          value={valor}
          autoFocus={enfocar}
          autoComplete={campo.tipo === 'password' ? 'new-password' : 'off'}
          list={campo.sugerencias ? `${id}-lista` : undefined}
          min={campo.min}
          max={campo.max}
          onChange={(e) => onChange(e.target.value)}
        />
        {campo.sugerencias && (
          <datalist id={`${id}-lista`}>
            {campo.sugerencias.map((s) => <option key={s} value={s} />)}
          </datalist>
        )}
      </>
    )
  }

  return (
    <div className={campo.ancho === 'completo' ? 'col-12' : 'col-md-6'}>
      <label htmlFor={id} className="form-label">
        {campo.etiqueta}{requerido && <span className="text-danger" aria-hidden="true"> *</span>}
      </label>
      {control}
      {error ? <div className="invalid-feedback">{error}</div> : ayuda && <div className="form-text">{ayuda}</div>}
    </div>
  )
}
