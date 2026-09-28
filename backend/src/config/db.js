// Conexión a MariaDB mediante un "pool" (conjunto reutilizable de conexiones).
// mysql2 es compatible con MariaDB y soporta consultas parametrizadas (?),
// que es lo que nos protege contra inyección SQL.
import mysql from 'mysql2/promise';

const requeridas = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const faltantes = requeridas.filter((v) => !process.env[v]);
if (faltantes.length) {
  console.error(`❌ Faltan variables en backend/.env: ${faltantes.join(', ')}`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET debe tener al menos 32 caracteres. Genera uno aleatorio (ver .env.example).');
  process.exit(1);
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});
