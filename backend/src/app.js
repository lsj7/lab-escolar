// Configuración de la aplicación Express (separada de server.js para poder
// probarla con node:test sin abrir un puerto fijo).
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { soloAdmin, verificarToken } from './middleware/auth.js';
import { manejadorErrores, rutaNoEncontrada } from './middleware/errores.js';
import { DIR_UPLOADS } from './middleware/subida.js';
import authRoutes from './routes/auth.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import catalogosRoutes from './routes/catalogos.routes.js';

const app = express();

app.use(helmet());                          // cabeceras HTTP de seguridad
app.use(express.json({ limit: '100kb' }));  // limita el tamaño del cuerpo
app.use(cookieParser());

// Fotos de perfil (nosniff evita que el navegador "adivine" otro tipo de archivo)
app.use('/uploads', express.static(DIR_UPLOADS, { maxAge: '1d', index: false, dotfiles: 'deny' }));

app.get('/api/salud', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', verificarToken, soloAdmin, usuariosRoutes);
app.use('/api', verificarToken, catalogosRoutes);

app.use(rutaNoEncontrada);
app.use(manejadorErrores);

export default app;
