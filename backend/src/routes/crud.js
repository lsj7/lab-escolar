// Fábrica de rutas CRUD reutilizable.
// Recibe la tabla, el esquema de validación y la consulta de listado,
// y devuelve un Router con GET, GET/:id, POST, PUT/:id y DELETE/:id.
import { Router } from 'express';
import { pool } from '../config/db.js';
import { validar, validarId } from '../middleware/validar.js';

export function crearCrud({ tabla, esquema, consultaListado }) {
  const router = Router();

  // Listar
  router.get('/', async (req, res) => {
    const [filas] = await pool.query(consultaListado);
    res.json(filas);
  });

  // Obtener uno
  router.get('/:id', validarId, async (req, res) => {
    const [filas] = await pool.query('SELECT * FROM ?? WHERE id = ?', [tabla, req.id]);
    if (!filas.length) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(filas[0]);
  });

  // Crear  —  "INSERT INTO ?? SET ?": mysql2 escapa el nombre de la tabla (??)
  // y convierte el objeto validado en columna = valor de forma segura (?).
  router.post('/', validar(esquema), async (req, res) => {
    const [r] = await pool.query('INSERT INTO ?? SET ?', [tabla, req.datos]);
    res.status(201).json({ id: r.insertId, ...req.datos });
  });

  // Actualizar
  router.put('/:id', validarId, validar(esquema), async (req, res) => {
    const [r] = await pool.query('UPDATE ?? SET ? WHERE id = ?', [tabla, req.datos, req.id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json({ id: req.id, ...req.datos });
  });

  // Eliminar
  router.delete('/:id', validarId, async (req, res) => {
    const [r] = await pool.query('DELETE FROM ?? WHERE id = ?', [tabla, req.id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Registro no encontrado' });
    res.status(204).end();
  });

  return router;
}
