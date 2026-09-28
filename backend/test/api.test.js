// Pruebas automáticas de la API con el runner nativo de Node (node:test).
// Requisitos: MariaDB encendido, schema.sql aplicado y "npm run seed" ejecutado.
// Ejecutar:  npm test
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { pool } from '../src/config/db.js';

let servidor, base;
const sufijo = Date.now().toString().slice(-6);
const nuevoUsuario = { nombre: 'Usuario de Prueba', username: `prueba_${sufijo}`, password: 'Prueba#2026' };

// Pequeño cliente HTTP que conserva la cookie de sesión
async function peticion(metodo, ruta, { cuerpo, cookie } = {}) {
  const res = await fetch(base + ruta, {
    method: metodo,
    headers: { ...(cuerpo && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await res.text();
  return {
    status: res.status,
    json: texto ? JSON.parse(texto) : null,
    cookie: res.headers.get('set-cookie')?.split(';')[0],
    setCookie: res.headers.get('set-cookie'),
  };
}
const login = (username, password) => peticion('POST', '/api/auth/login', { cuerpo: { username, password } });

let cookieAdmin, cookieUsuario, idUsuario;

before(async () => {
  servidor = app.listen(0);
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  if (idUsuario) await pool.execute('DELETE FROM usuarios WHERE id = ?', [idUsuario]);
  await pool.end();
  servidor.close();
});

describe('Autenticación', () => {
  test('sin sesión no hay acceso (401)', async () => {
    const r = await peticion('GET', '/api/alumnos');
    assert.equal(r.status, 401);
  });

  test('contraseña incorrecta → 401 con mensaje genérico', async () => {
    const r = await login('Admin', 'incorrecta');
    assert.equal(r.status, 401);
    assert.equal(r.json.error, 'Usuario o contraseña incorrectos');
  });

  test('inyección SQL en el usuario no funciona', async () => {
    const r = await login("' OR '1'='1", "' OR '1'='1");
    assert.equal(r.status, 401);
  });

  test('Admin inicia sesión con cookie httpOnly', async () => {
    const r = await login('Admin', '$3cr3t');
    assert.equal(r.status, 200);
    assert.equal(r.json.usuario.rol, 'admin');
    assert.equal(r.json.usuario.password_hash, undefined, 'nunca se debe exponer el hash');
    assert.match(r.setCookie, /HttpOnly/i);
    assert.match(r.setCookie, /SameSite=Strict/i);
    cookieAdmin = r.cookie;
  });

  test('Root inicia sesión', async () => {
    const r = await login('Root', 'W@t@SHi09');
    assert.equal(r.status, 200);
    assert.equal(r.json.usuario.rol, 'admin');
  });
});

describe('Usuarios y roles', () => {
  test('contraseña débil rechazada', async () => {
    const r = await peticion('POST', '/api/usuarios', { cookie: cookieAdmin, cuerpo: { ...nuevoUsuario, password: '123' } });
    assert.equal(r.status, 400);
    assert.ok(r.json.detalles.password);
  });

  test('el admin crea un usuario y el rol SIEMPRE es "usuario"', async () => {
    const r = await peticion('POST', '/api/usuarios', { cookie: cookieAdmin, cuerpo: { ...nuevoUsuario, rol: 'admin' } });
    assert.equal(r.status, 201);
    assert.equal(r.json.rol, 'usuario');
    idUsuario = r.json.id;
  });

  test('el usuario inicia sesión pero no puede administrar usuarios (403)', async () => {
    const r = await login(nuevoUsuario.username, nuevoUsuario.password);
    assert.equal(r.status, 200);
    cookieUsuario = r.cookie;
    const r2 = await peticion('GET', '/api/usuarios', { cookie: cookieUsuario });
    assert.equal(r2.status, 403);
  });

  test('no se puede eliminar a un administrador', async () => {
    const [[admin]] = await pool.query("SELECT id FROM usuarios WHERE username = 'Root'");
    const r = await peticion('DELETE', `/api/usuarios/${admin.id}`, { cookie: cookieAdmin });
    assert.equal(r.status, 403);
  });

  test('la BD rechaza un tercer administrador aunque se salte la API', async () => {
    await assert.rejects(
      pool.execute("INSERT INTO usuarios (nombre, username, password_hash, rol) VALUES ('X', 'tercero', 'x', 'admin')"),
      /Solo pueden existir 2 administradores/,
    );
  });
});

describe('CRUD de catálogos (como usuario normal)', () => {
  let idMaestro, idMateria;

  test('crear, leer, actualizar y eliminar un maestro y su materia', async () => {
    let r = await peticion('POST', '/api/maestros', { cookie: cookieUsuario, cuerpo: { nombre: 'Maestro Prueba', email: '', telefono: '', especialidad: 'Pruebas' } });
    assert.equal(r.status, 201);
    idMaestro = r.json.id;

    r = await peticion('POST', '/api/materias', { cookie: cookieUsuario, cuerpo: { clave: `t-${sufijo}`, nombre: 'Materia Prueba', creditos: '5', maestro_id: String(idMaestro) } });
    assert.equal(r.status, 201);
    assert.equal(r.json.clave, `T-${sufijo}`, 'la clave se normaliza a mayúsculas');
    idMateria = r.json.id;

    r = await peticion('POST', '/api/materias', { cookie: cookieUsuario, cuerpo: { clave: `T-${sufijo}`, nombre: 'Duplicada', creditos: 5 } });
    assert.equal(r.status, 409, 'clave de materia repetida');

    r = await peticion('DELETE', `/api/maestros/${idMaestro}`, { cookie: cookieUsuario });
    assert.equal(r.status, 409, 'no se borra un maestro con materias asignadas');

    r = await peticion('PUT', `/api/maestros/${idMaestro}`, { cookie: cookieUsuario, cuerpo: { nombre: 'Maestro Editado', especialidad: 'QA' } });
    assert.equal(r.status, 200);

    r = await peticion('GET', '/api/materias', { cookie: cookieUsuario });
    assert.equal(r.json.find((m) => m.id === idMateria).maestro_nombre, 'Maestro Editado');

    assert.equal((await peticion('DELETE', `/api/materias/${idMateria}`, { cookie: cookieUsuario })).status, 204);
    assert.equal((await peticion('DELETE', `/api/maestros/${idMaestro}`, { cookie: cookieUsuario })).status, 204);
  });

  test('validación de alumno con datos incorrectos', async () => {
    const r = await peticion('POST', '/api/alumnos', { cookie: cookieUsuario, cuerpo: { matricula: '!', nombre: '', semestre: 99 } });
    assert.equal(r.status, 400);
    assert.ok(r.json.detalles.matricula && r.json.detalles.nombre && r.json.detalles.semestre);
  });
});

describe('Bloqueo por intentos fallidos', () => {
  test('5 intentos fallidos bloquean la cuenta (423)', async () => {
    for (let i = 0; i < 5; i++) await login(nuevoUsuario.username, 'mala');
    const r = await login(nuevoUsuario.username, nuevoUsuario.password);
    assert.equal(r.status, 423);
  });
});
