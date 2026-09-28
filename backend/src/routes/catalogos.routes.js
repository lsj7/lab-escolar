// CRUD de alumnos, maestros, materias y grupos (cualquier usuario autenticado).
import { Router } from 'express';
import { pool } from '../config/db.js';
import { crearCrud } from './crud.js';
import { esquemaAlumno, esquemaGrupo, esquemaMaestro, esquemaMateria } from '../validators/esquemas.js';

const router = Router();

router.use('/maestros', crearCrud({
  tabla: 'maestros',
  esquema: esquemaMaestro,
  consultaListado: 'SELECT * FROM maestros ORDER BY nombre',
}));

router.use('/materias', crearCrud({
  tabla: 'materias',
  esquema: esquemaMateria,
  consultaListado: `
    SELECT m.*, ma.nombre AS maestro_nombre
    FROM materias m LEFT JOIN maestros ma ON ma.id = m.maestro_id
    ORDER BY m.clave`,
}));

router.use('/grupos', crearCrud({
  tabla: 'grupos',
  esquema: esquemaGrupo,
  consultaListado: 'SELECT * FROM grupos ORDER BY clave',
}));

router.use('/alumnos', crearCrud({
  tabla: 'alumnos',
  esquema: esquemaAlumno,
  consultaListado: `
    SELECT a.*, m.clave AS materia_clave, m.nombre AS materia_nombre, g.clave AS grupo_clave
    FROM alumnos a
    LEFT JOIN materias m ON m.id = a.materia_id
    LEFT JOIN grupos   g ON g.id = a.grupo_id
    ORDER BY a.nombre`,
}));

// Totales para la pantalla de inicio
router.get('/resumen', async (req, res) => {
  const [[fila]] = await pool.query(`
    SELECT (SELECT COUNT(*) FROM alumnos)  AS alumnos,
           (SELECT COUNT(*) FROM maestros) AS maestros,
           (SELECT COUNT(*) FROM materias) AS materias,
           (SELECT COUNT(*) FROM grupos)   AS grupos`);
  res.json(fila);
});

export default router;
