import app from './app.js';
import { pool } from './config/db.js';

const PORT = Number(process.env.PORT || 3000);

try {
  await pool.query('SELECT 1');
  console.log('✅ Conectado a MariaDB');
} catch (err) {
  console.error('❌ No se pudo conectar a MariaDB:', err.message);
  console.error('   Revisa que el servicio esté encendido y los datos de backend/.env');
  process.exit(1);
}

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 API escuchando en http://localhost:${PORT}`);
});
