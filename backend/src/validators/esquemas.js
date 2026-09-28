// Reglas de validación (Zod). Una sola fuente de verdad para lo que la API acepta.
import { z } from 'zod';

z.config(z.locales.es()); // mensajes de error en español

// Un campo de texto vacío del formulario se guarda como NULL
const vacioANull = (v) => (typeof v === 'string' && v.trim() === '' ? null : v);

const texto = (max) => z.string().trim().min(1, 'Este campo es obligatorio').max(max);
const textoOpcional = (max) => z.preprocess(vacioANull, z.string().trim().max(max).nullable().optional());
const entero = (min, max) => {
  const msg = `Elige un número entre ${min} y ${max}`;
  return z.coerce.number({ error: msg }).int(msg).min(min, msg).max(max, msg);
};
const idOpcional = z.preprocess(vacioANull, z.coerce.number().int().positive().nullable().optional());
const emailOpcional = z.preprocess(vacioANull, z.email('Correo no válido').max(120).nullable().optional());
const telefonoOpcional = z.preprocess(
  vacioANull,
  z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/, 'Teléfono no válido (7 a 20 dígitos)').nullable().optional(),
);
const clave = z.string().trim().toUpperCase()
  .regex(/^[A-Z0-9-]{2,20}$/, 'Usa de 2 a 20 letras, números o guiones');

// Política de contraseñas para usuarios nuevos
export const passwordSegura = z.string()
  .min(8, 'Mínimo 8 caracteres')
  .max(72, 'Máximo 72 caracteres')
  .regex(/[a-z]/, 'Debe incluir una minúscula')
  .regex(/[A-Z]/, 'Debe incluir una mayúscula')
  .regex(/[0-9]/, 'Debe incluir un número')
  .regex(/[^A-Za-z0-9]/, 'Debe incluir un símbolo');

// ---------- Autenticación ----------
export const esquemaLogin = z.object({
  username: z.string().trim().min(1, 'Escribe tu usuario').max(40),
  password: z.string().min(1, 'Escribe tu contraseña').max(72),
});

export const esquemaCambioPassword = z.object({
  actual: z.string().min(1, 'Escribe tu contraseña actual').max(72),
  nueva: passwordSegura,
});

// ---------- Usuarios (solo administradores) ----------
export const esquemaUsuarioNuevo = z.object({
  nombre: texto(100),
  username: z.string().trim().regex(/^[a-zA-Z0-9_.]{3,40}$/, 'De 3 a 40 letras, números, punto o guion bajo'),
  email: emailOpcional,
  password: passwordSegura,
  // Nota: NO existe el campo "rol". Todo usuario creado por la API es 'usuario'.
});

export const esquemaUsuarioEdicion = z.object({
  nombre: texto(100),
  email: emailOpcional,
  activo: z.boolean(),
  password: z.preprocess((v) => (v === '' || v == null ? undefined : v), passwordSegura.optional()),
});

// ---------- Catálogos ----------
export const esquemaMaestro = z.object({
  nombre: texto(120),
  email: emailOpcional,
  telefono: telefonoOpcional,
  especialidad: textoOpcional(100),
});

export const esquemaMateria = z.object({
  clave,
  nombre: texto(120),
  creditos: entero(1, 20),
  maestro_id: idOpcional,
});

export const esquemaGrupo = z.object({
  clave,
  carrera: texto(100),
  semestre: entero(1, 12),
  turno: z.enum(['Matutino', 'Vespertino']),
});

export const esquemaAlumno = z.object({
  matricula: z.string().trim().regex(/^[A-Za-z0-9-]{3,20}$/, 'De 3 a 20 letras, números o guiones'),
  nombre: texto(120),
  direccion: textoOpcional(200),
  telefono: telefonoOpcional,
  carrera: texto(100),
  semestre: entero(1, 12),
  materia_id: idOpcional,
  grupo_id: idOpcional,
});
