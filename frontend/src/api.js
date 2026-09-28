// Cliente para la API REST. La cookie de sesión la envía el navegador
// automáticamente (misma origen gracias al proxy de Vite).
export async function api(ruta, { method = 'GET', body, formData } = {}) {
  const opciones = { method, credentials: 'same-origin', headers: {} }
  if (body) {
    opciones.headers['Content-Type'] = 'application/json'
    opciones.body = JSON.stringify(body)
  }
  if (formData) opciones.body = formData

  let res
  try {
    res = await fetch(`/api${ruta}`, opciones)
  } catch {
    throw new Error('No hay conexión con el servidor. ¿Está encendido el backend?')
  }

  const datos = res.status === 204 ? null : await res.json().catch(() => null)

  if (!res.ok) {
    // Si la sesión expiró, avisamos a toda la app para regresar al login
    if (res.status === 401 && !ruta.startsWith('/auth/')) {
      window.dispatchEvent(new Event('sesion-expirada'))
    }
    const error = new Error(datos?.error || `Error ${res.status}`)
    error.status = res.status
    error.detalles = datos?.detalles
    throw error
  }
  return datos
}
