// Autenticación con JWT guardado en una cookie httpOnly:
//  - httpOnly: JavaScript del navegador NO puede leerla (mitiga robo por XSS).
//  - sameSite=strict: el navegador no la envía desde otros sitios (mitiga CSRF).
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export const NOMBRE_COOKIE = 'lab_token';
export const DURACION_SESION_MS = 2 * 60 * 60 * 1000; // 2 horas

export function opcionesCookie() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production', // en producción solo por HTTPS
    path: '/',
  };
}

export function firmarToken(usuario) {
  return jwt.sign({ rol: usuario.rol }, process.env.JWT_SECRET, {
    subject: String(usuario.id),
    expiresIn: DURACION_SESION_MS / 1000,
    algorithm: 'HS256',
  });
}

export async function verificarToken(req, res, next) {
  const token = req.cookies?.[NOMBRE_COOKIE];
  if (!token) return res.status(401).json({ error: 'Inicia sesión para continuar' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ error: 'Tu sesión expiró, vuelve a iniciar sesión' });
  }

  // Consultamos la BD en cada petición: si un usuario se desactiva,
  // pierde el acceso de inmediato aunque su token siga vigente.
  const [filas] = await pool.execute(
    'SELECT id, nombre, username, email, rol, foto, activo FROM usuarios WHERE id = ?',
    [payload.sub],
  );
  const usuario = filas[0];
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Tu cuenta ya no está disponible' });
  }
  req.usuario = usuario;
  next();
}

export function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo los administradores pueden hacer esto' });
  }
  next();
}

export const usuarioPublico = ({ id, nombre, username, email, rol, foto }) =>
  ({ id, nombre, username, email, rol, foto });
