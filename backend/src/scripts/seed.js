// Carga inicial: crea los 2 administradores y algunos datos de ejemplo.
// Se puede ejecutar varias veces sin duplicar nada:  npm run seed
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

const ADMINISTRADORES = [
  { nombre: 'Administrador', username: 'Admin', password: '$3cr3t' },
  { nombre: 'Superusuario',  username: 'Root',  password: 'W@t@SHi09' },
];

async function crearAdministradores() {
  for (const a of ADMINISTRADORES) {
    const hash = await bcrypt.hash(a.password, 12);
    const [existe] = await pool.execute('SELECT id FROM usuarios WHERE username = ?', [a.username]);
    if (existe.length) {
      await pool.execute('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, existe[0].id]);
      console.log(`↻ ${a.username}: contraseña restablecida`);
    } else {
      await pool.execute(
        "INSERT INTO usuarios (nombre, username, password_hash, rol) VALUES (?, ?, ?, 'admin')",
        [a.nombre, a.username, hash],
      );
      console.log(`✔ ${a.username}: administrador creado`);
    }
  }
}

async function datosDeEjemplo() {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM maestros');
  if (total > 0) return console.log('• Ya hay datos de ejemplo, se omiten');

  await pool.query(`INSERT INTO maestros (nombre, email, telefono, especialidad) VALUES
    ('Laura Méndez Garza',  'laura.mendez@escuela.edu', '826 263 0900', 'Bases de datos'),
    ('Jorge Treviño Salas', 'jorge.trevino@escuela.edu', '826 263 0901', 'Programación'),
    ('Ana Lucía Robles',    'ana.robles@escuela.edu',    '826 263 0902', 'Investigación de operaciones')`);

  await pool.query(`INSERT INTO materias (clave, nombre, creditos, maestro_id) VALUES
    ('BD-301',  'Bases de datos',               5, 1),
    ('PW-402',  'Programación web',             6, 2),
    ('ED-201',  'Estructura de datos',          5, 2),
    ('IO-305',  'Investigación de operaciones', 5, 3)`);

  await pool.query(`INSERT INTO grupos (clave, carrera, semestre, turno) VALUES
    ('ISC-3A', 'Ingeniería en Sistemas Computacionales', 3, 'Matutino'),
    ('IND-5A', 'Ingeniería Industrial',                  5, 'Vespertino')`);

  await pool.query(`INSERT INTO alumnos (matricula, nombre, direccion, telefono, carrera, semestre, materia_id, grupo_id) VALUES
    ('A2026001', 'Daniela Cantú Pérez',   'Av. Libertad 120, Montemorelos', '826 111 2233', 'Ingeniería en Sistemas Computacionales', 3, 1, 1),
    ('A2026002', 'Samuel Ortiz Leal',     'Calle Juárez 45, Montemorelos',  '826 111 4455', 'Ingeniería en Sistemas Computacionales', 3, 3, 1),
    ('A2026003', 'Rebeca Villarreal Tijerina', 'Col. Centro 8, Allende',    '826 111 6677', 'Ingeniería Industrial', 5, 4, 2)`);

  console.log('✔ Datos de ejemplo cargados');
}

try {
  await crearAdministradores();
  await datosDeEjemplo();
} catch (err) {
  console.error('❌ Error en la carga inicial:', err.sqlMessage || err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
