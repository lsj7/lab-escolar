// Foto de perfil o, si no hay, las iniciales del nombre.
export default function Avatar({ usuario, tamano = 40, className = '' }) {
  const estilo = { width: tamano, height: tamano, fontSize: tamano * 0.38 }
  if (usuario?.foto) {
    return <img src={`/uploads/${usuario.foto}`} alt={`Foto de ${usuario.nombre}`} className={`avatar ${className}`} style={estilo} />
  }
  const iniciales = (usuario?.nombre ?? '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  return <span className={`avatar avatar-iniciales ${className}`} style={estilo} aria-hidden="true">{iniciales}</span>
}
