// Manejo centralizado de errores: el cliente recibe mensajes claros,
// pero nunca detalles internos (consultas SQL, rutas, stack traces).
import multer from 'multer';

export class ErrorApi extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

export function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: `No existe la ruta ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function manejadorErrores(err, req, res, next) {
  if (err instanceof ErrorApi) {
    return res.status(err.status).json({ error: err.message, detalles: err.detalles });
  }
  if (err instanceof multer.MulterError) {
    const mensaje = err.code === 'LIMIT_FILE_SIZE' ? 'La foto no debe pesar más de 2 MB' : 'No se pudo subir el archivo';
    return res.status(400).json({ error: mensaje });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido' });
  }
  // Errores de MariaDB más comunes
  switch (err.errno) {
    case 1062: return res.status(409).json({ error: 'Ya existe un registro con ese valor (clave, matrícula, usuario o correo repetido)' });
    case 1451: return res.status(409).json({ error: 'No se puede eliminar: otros registros dependen de éste' });
    case 1452: return res.status(400).json({ error: 'El registro relacionado que elegiste no existe' });
    case 1644: return res.status(409).json({ error: err.sqlMessage }); // SIGNAL de los triggers
  }
  console.error('💥 Error no controlado:', err);
  res.status(500).json({ error: 'Ocurrió un error interno. Intenta de nuevo.' });
}
