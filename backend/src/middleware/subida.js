// Subida de fotos de perfil con multer.
// Seguridad: tamaño máximo, tipos permitidos, nombre aleatorio (nunca el del
// usuario) y verificación de la "firma" real del archivo (magic bytes).
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import { ErrorApi } from './errores.js';

export const DIR_UPLOADS = path.join(import.meta.dirname, '..', '..', 'uploads');
const EXTENSIONES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const almacenamiento = multer.diskStorage({
  destination: DIR_UPLOADS,
  filename: (req, file, cb) => cb(null, crypto.randomUUID() + EXTENSIONES[file.mimetype]),
});

export const subirFoto = multer({
  storage: almacenamiento,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    EXTENSIONES[file.mimetype] ? cb(null, true) : cb(new ErrorApi(400, 'La foto debe ser JPG, PNG o WEBP')),
}).single('foto');

// El "mimetype" lo declara el navegador y se puede falsificar;
// por eso revisamos los primeros bytes del archivo ya guardado.
export async function esImagenReal(ruta) {
  const archivo = await fs.open(ruta, 'r');
  const { buffer } = await archivo.read(Buffer.alloc(12), 0, 12, 0);
  await archivo.close();
  const jpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png = buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const webp = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return jpg || png || webp;
}

export async function borrarFoto(nombre) {
  if (!nombre) return;
  // path.basename evita rutas como "../../algo" (path traversal)
  await fs.unlink(path.join(DIR_UPLOADS, path.basename(nombre))).catch(() => {});
}
