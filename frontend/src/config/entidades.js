// Descripción de cada catálogo: qué campos tiene el formulario y qué columnas
// muestra la tabla. Para agregar un campo nuevo basta con editar este archivo
// (y, claro, la tabla en la BD y el esquema de validación en el backend).
import { createElement as h } from 'react'
import Avatar from '../components/Avatar.jsx'

const CARRERAS = [
  'Ingeniería en Sistemas Computacionales',
  'Ingeniería Industrial',
  'Ingeniería Mecatrónica',
  'Ingeniería en Electrónica',
]
const SEMESTRES = Array.from({ length: 12 }, (_, i) => String(i + 1))

export const alumnos = {
  recurso: 'alumnos',
  titulo: 'Alumnos',
  singular: 'alumno',
  descripcion: 'Registro de alumnos con su carrera, semestre, grupo y materia.',
  campos: [
    { nombre: 'matricula', etiqueta: 'Matrícula', requerido: true },
    { nombre: 'nombre', etiqueta: 'Nombre completo', requerido: true },
    { nombre: 'direccion', etiqueta: 'Dirección', ancho: 'completo' },
    { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel' },
    { nombre: 'carrera', etiqueta: 'Carrera', requerido: true, sugerencias: CARRERAS },
    { nombre: 'semestre', etiqueta: 'Semestre', tipo: 'select', opciones: SEMESTRES, requerido: true },
    { nombre: 'grupo_id', etiqueta: 'Grupo', tipo: 'select', recurso: 'grupos', textoVacio: 'Sin grupo', etiquetaOpcion: (g) => `${g.clave} (${g.turno})` },
    { nombre: 'materia_id', etiqueta: 'Materia', tipo: 'select', recurso: 'materias', textoVacio: 'Sin materia', etiquetaOpcion: (m) => `${m.clave} - ${m.nombre}`, ancho: 'completo' },
  ],
  columnas: [
    { campo: 'matricula', etiqueta: 'Matrícula' },
    { campo: 'nombre', etiqueta: 'Nombre' },
    { campo: 'telefono', etiqueta: 'Teléfono' },
    { campo: 'carrera', etiqueta: 'Carrera' },
    { campo: 'semestre', etiqueta: 'Sem.' },
    { campo: 'grupo_clave', etiqueta: 'Grupo' },
    { campo: 'materia_nombre', etiqueta: 'Materia' },
  ],
}

export const maestros = {
  recurso: 'maestros',
  titulo: 'Maestros',
  singular: 'maestro',
  descripcion: 'Docentes que pueden tener materias asignadas.',
  campos: [
    { nombre: 'nombre', etiqueta: 'Nombre completo', requerido: true, ancho: 'completo' },
    { nombre: 'email', etiqueta: 'Correo', tipo: 'email' },
    { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel' },
    { nombre: 'especialidad', etiqueta: 'Especialidad', ancho: 'completo' },
  ],
  columnas: [
    { campo: 'nombre', etiqueta: 'Nombre' },
    { campo: 'email', etiqueta: 'Correo' },
    { campo: 'telefono', etiqueta: 'Teléfono' },
    { campo: 'especialidad', etiqueta: 'Especialidad' },
  ],
}

export const materias = {
  recurso: 'materias',
  titulo: 'Materias',
  singular: 'materia',
  descripcion: 'Cada materia tiene una clave única y un maestro responsable.',
  campos: [
    { nombre: 'clave', etiqueta: 'Clave', requerido: true, ayuda: 'Única. Ejemplo: BD-301' },
    { nombre: 'creditos', etiqueta: 'Créditos', tipo: 'number', min: 1, max: 20, porDefecto: 5, requerido: true },
    { nombre: 'nombre', etiqueta: 'Nombre de la materia', requerido: true, ancho: 'completo' },
    { nombre: 'maestro_id', etiqueta: 'Maestro', tipo: 'select', recurso: 'maestros', textoVacio: 'Sin asignar', etiquetaOpcion: (m) => m.nombre, ancho: 'completo' },
  ],
  columnas: [
    { campo: 'clave', etiqueta: 'Clave' },
    { campo: 'nombre', etiqueta: 'Materia' },
    { campo: 'creditos', etiqueta: 'Créditos' },
    { campo: 'maestro_nombre', etiqueta: 'Maestro' },
  ],
}

export const grupos = {
  recurso: 'grupos',
  titulo: 'Grupos',
  singular: 'grupo',
  descripcion: 'Grupos por carrera, semestre y turno.',
  campos: [
    { nombre: 'clave', etiqueta: 'Clave', requerido: true, ayuda: 'Única. Ejemplo: ISC-3A' },
    { nombre: 'turno', etiqueta: 'Turno', tipo: 'select', opciones: ['Matutino', 'Vespertino'], porDefecto: 'Matutino', requerido: true },
    { nombre: 'carrera', etiqueta: 'Carrera', requerido: true, sugerencias: CARRERAS, ancho: 'completo' },
    { nombre: 'semestre', etiqueta: 'Semestre', tipo: 'select', opciones: SEMESTRES, requerido: true },
  ],
  columnas: [
    { campo: 'clave', etiqueta: 'Clave' },
    { campo: 'carrera', etiqueta: 'Carrera' },
    { campo: 'semestre', etiqueta: 'Semestre' },
    { campo: 'turno', etiqueta: 'Turno' },
  ],
}

export const usuarios = {
  recurso: 'usuarios',
  titulo: 'Usuarios',
  singular: 'usuario',
  descripcion: 'Los usuarios nuevos siempre tienen el rol Usuario. El sistema solo admite dos administradores y no se pueden modificar desde aquí.',
  puedeEditar: (u) => u.rol !== 'admin',
  campos: [
    { nombre: 'nombre', etiqueta: 'Nombre completo', requerido: true, ancho: 'completo' },
    { nombre: 'username', etiqueta: 'Usuario', requerido: true, soloAlCrear: true, ayuda: 'Con este nombre inicia sesión.' },
    { nombre: 'email', etiqueta: 'Correo', tipo: 'email' },
    {
      nombre: 'password', etiqueta: 'Contraseña', tipo: 'password', requeridoAlCrear: true,
      ayudaAlCrear: 'Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.',
      ayudaAlEditar: 'Déjala vacía para conservar la actual.',
    },
    { nombre: 'activo', etiqueta: 'Cuenta activa', tipo: 'checkbox', soloAlEditar: true },
  ],
  columnas: [
    {
      campo: 'nombre', etiqueta: 'Nombre', texto: (u) => u.nombre,
      render: (u) => h('span', { className: 'd-flex align-items-center gap-2' }, h(Avatar, { usuario: u, tamano: 32 }), u.nombre),
    },
    { campo: 'username', etiqueta: 'Usuario' },
    { campo: 'email', etiqueta: 'Correo' },
    {
      campo: 'rol', etiqueta: 'Rol',
      texto: (u) => (u.rol === 'admin' ? 'Administrador' : 'Usuario'),
      render: (u) => h('span', { className: `insignia-rol ${u.rol}` }, u.rol === 'admin' ? 'Administrador' : 'Usuario'),
    },
    {
      campo: 'activo', etiqueta: 'Estado',
      texto: (u) => (u.activo ? 'Activo' : 'Inactivo'),
      render: (u) => (u.activo ? 'Activo' : h('span', { className: 'text-danger' }, 'Inactivo')),
    },
  ],
}
