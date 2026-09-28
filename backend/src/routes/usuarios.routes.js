// Administración de usuarios. Todas estas rutas exigen rol 'admin' (ver app.js).
// Reglas: solo se crean usuarios con rol 'usuario' y los administradores
// no se editan ni se eliminan desde aquí (además, la BD lo impide con triggers).
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { validar, validarId } from '../middleware/validar.js';
import { borrarFoto } from '../middleware/subida.js';
import { esquemaUsuarioEdicion, esquemaUsuarioNuevo } from '../validators/esquemas.js';

const router = Router();
const COLUMNAS = 'id, nombre, username, email, rol, foto, activo, creado_en';

async function buscar(id) {
  const [filas] = await pool.execute(`SELECT ${COLUMNAS} FROM usuarios WHERE id = ?`, [id]);
  return filas[0];
}

router.get('/', async (req, res) => {
  const [filas] = await pool.query(`SELECT ${COLUMNAS} FROM usuarios ORDER BY rol, nombre`);
  res.json(filas);
});

router.post('/', validar(esquemaUsuarioNuevo), async (req, res) => {
  const { nombre, username, email, password } = req.datos;
  const hash = await bcrypt.hash(password, 12);
  const [r] = await pool.execute(
    "INSERT INTO usuarios (nombre, username, email, password_hash, rol) VALUES (?, ?, ?, ?, 'usuario')",
    [nombre, username, email ?? null, hash],
  );
  res.status(201).json(await buscar(r.insertId));
});

router.put('/:id', validarId, validar(esquemaUsuarioEdicion), async (req, res) => {
  const usuario = await buscar(req.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (usuario.rol === 'admin') {
    return res.status(403).json({ error: 'Los administradores no se modifican desde aquí' });
  }

  const { nombre, email, activo, password } = req.datos;
  await pool.execute('UPDATE usuarios SET nombre = ?, email = ?, activo = ? WHERE id = ?',
    [nombre, email ?? null, activo ? 1 : 0, req.id]);
  if (password) {
    await pool.execute('UPDATE usuarios SET password_hash = ? WHERE id = ?', [await bcrypt.hash(password, 12), req.id]);
  }
  res.json(await buscar(req.id));
});

router.delete('/:id', validarId, async (req, res) => {
  const usuario = await buscar(req.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (usuario.rol === 'admin') {
    return res.status(403).json({ error: 'Los administradores no se pueden eliminar' });
  }
  await pool.execute('DELETE FROM usuarios WHERE id = ?', [req.id]);
  await borrarFoto(usuario.foto);
  res.status(204).end();
});

export default router;
