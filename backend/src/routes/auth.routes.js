// Login, logout, sesión actual, foto de perfil y cambio de contraseña.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { pool } from '../config/db.js';
import { validar } from '../middleware/validar.js';
import {
  DURACION_SESION_MS, NOMBRE_COOKIE, firmarToken, opcionesCookie, usuarioPublico, verificarToken,
} from '../middleware/auth.js';
import { borrarFoto, esImagenReal, subirFoto } from '../middleware/subida.js';
import { esquemaCambioPassword, esquemaLogin } from '../validators/esquemas.js';

const router = Router();

const MAX_INTENTOS = 5;      // intentos fallidos antes de bloquear la cuenta
const MINUTOS_BLOQUEO = 15;

// Freno contra fuerza bruta por IP: 10 intentos FALLIDOS cada 15 min.
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos fallidos. Espera 15 minutos.' },
});

// Si el usuario no existe comparamos contra un hash falso para tardar lo mismo
// y no revelar qué usuarios existen (ataque de enumeración por tiempo).
const HASH_FALSO = bcrypt.hashSync('usuario-inexistente', 12);
const CREDENCIALES_INVALIDAS = { error: 'Usuario o contraseña incorrectos' };

router.post('/login', limitadorLogin, validar(esquemaLogin), async (req, res) => {
  const { username, password } = req.datos;
  const [filas] = await pool.execute(
    `SELECT *, (bloqueado_hasta IS NOT NULL AND bloqueado_hasta > NOW()) AS bloqueado
     FROM usuarios WHERE username = ?`,
    [username],
  );
  const usuario = filas[0];

  if (usuario?.bloqueado) {
    return res.status(423).json({ error: `Cuenta bloqueada por intentos fallidos. Intenta en ${MINUTOS_BLOQUEO} minutos.` });
  }

  const correcta = await bcrypt.compare(password, usuario?.password_hash ?? HASH_FALSO);

  if (!usuario || !correcta) {
    if (usuario) {
      const intentos = usuario.intentos_fallidos + 1;
      if (intentos >= MAX_INTENTOS) {
        await pool.execute(
          'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NOW() + INTERVAL ? MINUTE WHERE id = ?',
          [MINUTOS_BLOQUEO, usuario.id],
        );
      } else {
        await pool.execute('UPDATE usuarios SET intentos_fallidos = ? WHERE id = ?', [intentos, usuario.id]);
      }
    }
    return res.status(401).json(CREDENCIALES_INVALIDAS);
  }

  if (!usuario.activo) {
    return res.status(403).json({ error: 'Tu cuenta está desactivada. Contacta a un administrador.' });
  }

  await pool.execute('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?', [usuario.id]);

  res.cookie(NOMBRE_COOKIE, firmarToken(usuario), { ...opcionesCookie(), maxAge: DURACION_SESION_MS });
  res.json({ usuario: usuarioPublico(usuario) });
});

router.post('/logout', (req, res) => {
  res.clearCookie(NOMBRE_COOKIE, opcionesCookie());
  res.status(204).end();
});

router.get('/me', verificarToken, (req, res) => {
  res.json({ usuario: usuarioPublico(req.usuario) });
});

router.put('/me/foto', verificarToken, subirFoto, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Selecciona una imagen' });

  if (!(await esImagenReal(req.file.path))) {
    await borrarFoto(req.file.filename);
    return res.status(400).json({ error: 'El archivo no es una imagen válida' });
  }

  await pool.execute('UPDATE usuarios SET foto = ? WHERE id = ?', [req.file.filename, req.usuario.id]);
  await borrarFoto(req.usuario.foto); // eliminamos la foto anterior
  res.json({ usuario: usuarioPublico({ ...req.usuario, foto: req.file.filename }) });
});

router.put('/me/password', verificarToken, validar(esquemaCambioPassword), async (req, res) => {
  const { actual, nueva } = req.datos;
  const [[fila]] = await pool.execute('SELECT password_hash FROM usuarios WHERE id = ?', [req.usuario.id]);

  if (!(await bcrypt.compare(actual, fila.password_hash))) {
    return res.status(400).json({ error: 'Revisa los datos marcados', detalles: { actual: 'La contraseña actual no es correcta' } });
  }
  if (actual === nueva) {
    return res.status(400).json({ error: 'Revisa los datos marcados', detalles: { nueva: 'Debe ser distinta a la actual' } });
  }

  const hash = await bcrypt.hash(nueva, 12);
  await pool.execute('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, req.usuario.id]);
  res.status(204).end();
});

export default router;
