# Laboratorio: Sistema Escolar con Node.js, React y MariaDB

API REST en Node.js (Express) + frontend en React con Vite + base de datos MariaDB. Incluye login, roles (Administrador y Usuario), exactamente dos administradores, dashboard con menú lateral (foto, datos y rol) y CRUD de alumnos, maestros, materias y grupos.

## Objetivos de aprendizaje

Al terminar, el alumno podrá diseñar una base de datos relacional con llaves foráneas y reglas de negocio en triggers, construir una API REST con autenticación JWT en cookies httpOnly y autorización por roles, consumirla desde React con rutas protegidas, y verificar la seguridad del sistema con pruebas automáticas y manuales.

## Arquitectura

```
Navegador ──► http://localhost:5173  (Vite + React)
                    │  proxy /api y /uploads
                    ▼
              http://localhost:3000  (Express, API REST)
                    │  mysql2 (consultas parametrizadas)
                    ▼
              MariaDB :3306  ─ base lab_escolar (usuario lab_app)
```

El proxy de Vite hace que el navegador vea todo en el mismo origen. Por eso la cookie de sesión puede ser `SameSite=Strict` y no hace falta habilitar CORS.

## Estructura del proyecto

```
lab-escolar/
├── backend/
│   ├── database/schema.sql        ← tablas, triggers y usuario de BD
│   ├── src/
│   │   ├── config/db.js           ← conexión a MariaDB (lee .env)
│   │   ├── middleware/            ← auth, validación, errores, subida de fotos
│   │   ├── routes/                ← auth, usuarios, catálogos y fábrica CRUD
│   │   ├── validators/esquemas.js ← reglas de validación (Zod)
│   │   ├── scripts/seed.js        ← crea Admin, Root y datos de ejemplo
│   │   ├── app.js                 ← configuración de Express
│   │   └── server.js              ← arranque del servidor
│   ├── test/api.test.js           ← pruebas automáticas
│   ├── api.http                   ← pruebas manuales (REST Client)
│   ├── uploads/                   ← fotos de perfil
│   └── .env.example               ← plantilla de configuración
└── frontend/
    ├── vite.config.js             ← proxy hacia la API
    └── src/
        ├── api.js                 ← cliente fetch
        ├── context/AuthContext.jsx
        ├── components/            ← CrudPage, RutaProtegida, Avatar
        ├── config/entidades.js    ← campos y columnas de cada catálogo
        ├── layouts/DashboardLayout.jsx
        └── pages/                 ← Login, Inicio, Perfil
```

---

## Paso 0. Requisitos en la MacBook

```bash
brew install node          # Node 22 o superior
node -v && npm -v
brew services list         # verifica que mariadb aparezca como "started"
brew services start mariadb   # si no está iniciado
```

En VS Code instala estas extensiones: **REST Client** (Huachao Mao), **SQLTools** con su driver **MySQL/MariaDB**, **ESLint** y **Prettier**. Al abrir la carpeta `lab-escolar`, VS Code te las sugerirá automáticamente (archivo `.vscode/extensions.json`).

Abre la carpeta del laboratorio con `code lab-escolar` y usa la terminal integrada (`` Ctrl + ` ``). Te conviene dividirla en dos paneles: uno para el backend y otro para el frontend.

---

## Paso 1. Base de datos en MariaDB

### 1.1 Entrar a MariaDB como administrador

En la instalación de Homebrew, el usuario `root` de MariaDB entra con tu sesión de macOS:

```bash
sudo mariadb
```

Si configuraste contraseña para root, usa `mariadb -u root -p`. Escribe `exit` para salir.

### 1.2 Crear tablas, triggers y usuario de la aplicación

Desde la carpeta `lab-escolar`:

```bash
sudo mariadb < backend/database/schema.sql
```

El script hace lo siguiente: crea la base `lab_escolar`, las tablas `usuarios`, `maestros`, `materias`, `grupos` y `alumnos` con sus llaves foráneas, tres triggers que impiden tener más de dos administradores o borrar alguno, y el usuario de MariaDB `lab_app` con permisos únicamente de SELECT, INSERT, UPDATE y DELETE sobre esa base (principio de mínimo privilegio).

Antes de ejecutarlo, abre `schema.sql` y cambia la contraseña `CambiaEsta_Clave2026` de la última sección por una tuya.

### 1.3 Verificar

```bash
mariadb -u lab_app -p lab_escolar -e "SHOW TABLES; SHOW TRIGGERS\G"
```

### 1.4 ¿Dónde se configura la conexión?

En **`backend/.env`**. Es el único lugar donde viven host, puerto, usuario, contraseña y nombre de la base. `src/config/db.js` lee esas variables y valida que existan al arrancar.

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=lab_app
DB_PASSWORD=la_misma_que_pusiste_en_schema.sql
DB_NAME=lab_escolar
```

El `.env` está en `.gitignore`: nunca se sube a un repositorio.

---

## Paso 2. Backend (API REST)

### 2.1 Crear el proyecto desde cero

```bash
mkdir -p lab-escolar/backend && cd lab-escolar/backend
npm init -y
npm pkg set type=module
npm install express mysql2 bcryptjs jsonwebtoken helmet cookie-parser express-rate-limit multer zod
mkdir -p src/config src/middleware src/routes src/validators src/scripts database test uploads
```

Para qué sirve cada dependencia: **express** es el servidor HTTP; **mysql2** conecta con MariaDB; **bcryptjs** cifra contraseñas con hash y sal; **jsonwebtoken** firma los tokens de sesión; **helmet** agrega cabeceras HTTP de seguridad; **cookie-parser** lee la cookie de sesión; **express-rate-limit** frena ataques de fuerza bruta; **multer** recibe la foto de perfil; y **zod** valida los datos que llegan.

Copia los archivos de `src/`, `database/`, `test/` y `api.http` del laboratorio y agrega estos scripts a `package.json`:

```json
"scripts": {
  "dev": "node --watch --env-file=.env src/server.js",
  "start": "node --env-file=.env src/server.js",
  "seed": "node --env-file=.env src/scripts/seed.js",
  "test": "node --env-file=.env --test --test-concurrency=1 test/*.test.js"
}
```

`--env-file` es nativo de Node (no se necesita la librería dotenv) y `--watch` reinicia el servidor al guardar cambios.

### 2.2 Configurar el entorno

```bash
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Pega el resultado del segundo comando en `JWT_SECRET` y ajusta `DB_PASSWORD`.

### 2.3 Crear los administradores y datos de ejemplo

```bash
npm run seed
```

Esto crea **Admin** (contraseña `$3cr3t`) y **Root** (contraseña `W@t@SHi09`), guardando solo el hash bcrypt, nunca la contraseña en texto plano. También carga maestros, materias, grupos y alumnos de ejemplo. Si lo vuelves a ejecutar, restablece las contraseñas de los administradores sin duplicar datos.

### 2.4 Ejecutar

```bash
npm run dev
```

Debes ver `✅ Conectado a MariaDB` y `🚀 API escuchando en http://localhost:3000`.

### 2.5 Endpoints

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | Público | Inicia sesión y entrega la cookie |
| POST | `/api/auth/logout` | Público | Cierra sesión |
| GET | `/api/auth/me` | Sesión | Datos del usuario actual |
| PUT | `/api/auth/me/foto` | Sesión | Sube foto de perfil (multipart, campo `foto`) |
| PUT | `/api/auth/me/password` | Sesión | Cambia la contraseña propia |
| GET, POST | `/api/usuarios` | Admin | Lista y crea usuarios (rol siempre "usuario") |
| PUT, DELETE | `/api/usuarios/:id` | Admin | Edita o elimina usuarios que no sean admin |
| GET, POST | `/api/alumnos`, `/api/maestros`, `/api/materias`, `/api/grupos` | Sesión | Listar y crear |
| GET, PUT, DELETE | `/api/{catálogo}/:id` | Sesión | Leer, actualizar y eliminar |
| GET | `/api/resumen` | Sesión | Totales para la pantalla de inicio |

### 2.6 Probar

**Automáticas** (con MariaDB encendido y después de `npm run seed`):

```bash
npm test
```

Son 13 pruebas que verifican login, cookies seguras, inyección SQL, roles, el límite de dos administradores en la propia base de datos, el CRUD completo, las llaves foráneas y el bloqueo de cuentas.

**Manuales:** abre `backend/api.http` en VS Code y da clic en *Send Request* sobre cada petición. Si prefieres la terminal, usa comillas simples para que zsh no interprete el `$` de la contraseña:

```bash
curl -i -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"username":"Admin","password":"$3cr3t"}' http://localhost:3000/api/auth/login
curl -b cookies.txt http://localhost:3000/api/alumnos
```

---

## Paso 3. Frontend (React + Vite)

### 3.1 Crear el proyecto desde cero

En otra terminal, desde `lab-escolar`:

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install react-router-dom bootstrap
```

Borra `src/App.css` y la carpeta `src/assets`, y copia los archivos del laboratorio: `vite.config.js`, `index.html` y todo `src/`.

### 3.2 Ejecutar

```bash
npm run dev
```

Abre **http://localhost:5173**. El backend debe estar corriendo al mismo tiempo en la otra terminal.

### 3.3 Cómo está organizado

`AuthContext` pregunta al iniciar si ya hay sesión (`/auth/me`) y comparte el usuario con toda la app. `RutaProtegida` redirige al login si no hay sesión y al inicio si un usuario normal intenta entrar a una página de administrador. `DashboardLayout` dibuja el menú lateral con foto, nombre, usuario, correo y rol. `CrudPage` es un solo componente que resuelve los cinco CRUD; cada catálogo solo se describe en `config/entidades.js` (campos del formulario y columnas de la tabla).

---

## Paso 4. Recorrido de prueba

1. Inicia sesión como **Root** y revisa que el menú muestre tu rol de Administrador y la opción Usuarios.
2. En **Usuarios**, crea una cuenta (por ejemplo `mlopez` con `Maria#2026`). Observa que Admin y Root aparecen como *Protegido*.
3. Prueba crear un usuario con contraseña `123`: la política de contraseñas lo impide.
4. En **Mi perfil**, sube una foto y cambia la contraseña.
5. Registra un maestro, luego una materia asignada a ese maestro, un grupo y un alumno con esa materia y grupo.
6. Intenta eliminar el maestro: el sistema lo impide porque tiene una materia asignada (integridad referencial).
7. Cierra sesión y entra como `mlopez`. La opción Usuarios ya no aparece y si escribes `/usuarios` en la barra de direcciones te regresa al inicio.

## Paso 5. Pruebas de seguridad

| Prueba | Cómo hacerla | Resultado esperado |
|---|---|---|
| Inyección SQL | Usuario `' OR '1'='1` en el login | 401, credenciales inválidas |
| Fuerza bruta | 5 contraseñas incorrectas seguidas | Cuenta bloqueada 15 min (423) |
| Límite por IP | 10 intentos fallidos desde el mismo equipo | 429 durante 15 min |
| Escalar privilegios | Enviar `"rol":"admin"` al crear usuario | Se crea como "usuario" |
| Acceso por rol | Como `mlopez`, `GET /api/usuarios` en api.http | 403 |
| Tercer administrador | En `sudo mariadb`: `INSERT INTO lab_escolar.usuarios (nombre,username,password_hash,rol) VALUES ('X','x','x','admin');` | Error del trigger |
| Archivo disfrazado | Renombrar un .txt a .png y subirlo como foto | "El archivo no es una imagen válida" |
| Robo de cookie por XSS | En la consola del navegador: `document.cookie` | No aparece `lab_token` (httpOnly) |

## Mapa de controles de seguridad

| Amenaza | Control | Dónde |
|---|---|---|
| Contraseñas filtradas | Hash bcrypt con costo 12 | `auth.routes.js`, `seed.js` |
| Inyección SQL | Consultas parametrizadas (`?` y `??`) | Todas las rutas |
| Datos maliciosos | Validación con Zod y lista blanca de campos | `esquemas.js`, `validar.js` |
| Robo de sesión (XSS) | JWT en cookie httpOnly | `middleware/auth.js` |
| CSRF | Cookie SameSite=Strict, mismo origen | `middleware/auth.js`, `vite.config.js` |
| Fuerza bruta | Rate limit por IP y bloqueo por cuenta | `auth.routes.js` |
| Enumeración de usuarios | Mensaje genérico y hash falso para igualar tiempos | `auth.routes.js` |
| Escalamiento de privilegios | Rol forzado en la API y triggers en la BD | `usuarios.routes.js`, `schema.sql` |
| Cuentas desactivadas con token vigente | Verificación en BD en cada petición | `middleware/auth.js` |
| Subida de archivos peligrosos | Tipo, tamaño, nombre aleatorio y magic bytes | `middleware/subida.js` |
| Fuga de información | Errores genéricos, sin stack traces | `middleware/errores.js` |
| Cabeceras inseguras | Helmet (CSP, nosniff, frame-options, etc.) | `app.js` |
| Privilegios excesivos en BD | Usuario `lab_app` solo con CRUD | `schema.sql` |

**Nota para discusión en clase:** `$3cr3t` no cumple la política de contraseñas que el propio sistema exige a usuarios nuevos (tiene 6 caracteres y no incluye mayúsculas). Se usa porque así lo pide el laboratorio, y el seed la asigna directamente sin pasar por la validación. En un sistema real, lo primero sería cambiarla desde Mi perfil.

---

## Solución de problemas

**`ER_ACCESS_DENIED_ERROR`**: la contraseña de `DB_PASSWORD` en `.env` no coincide con la de `schema.sql`. Corrígela en MariaDB con `sudo mariadb -e "ALTER USER 'lab_app'@'localhost' IDENTIFIED BY 'nueva';"`.

**`ECONNREFUSED 127.0.0.1:3306`**: MariaDB no está encendido. Ejecuta `brew services start mariadb`.

**`EADDRINUSE :3000`**: otro proceso usa el puerto. Búscalo con `lsof -i :3000` y ciérralo, o cambia `PORT` en `.env` y el proxy en `vite.config.js`.

**El frontend dice "No hay conexión con el servidor"**: el backend no está corriendo en la otra terminal.

**Cuenta bloqueada durante tus pruebas**: `sudo mariadb lab_escolar -e "UPDATE usuarios SET intentos_fallidos=0, bloqueado_hasta=NULL;"`. Si el bloqueo es por IP (429), reinicia el backend.

**Olvidaste la contraseña de Admin o Root**: `npm run seed` las restablece.

---

## Retos para los alumnos

1. Agregar paginación en el servidor (`?pagina=2&limite=20`) al listado de alumnos.
2. Convertir la relación alumno–materia en muchos a muchos con una tabla `inscripciones` que incluya calificación.
3. Registrar en una tabla `bitacora` quién creó, modificó o eliminó cada registro y cuándo.
4. Exportar el listado de alumnos a CSV.
5. Agregar un tercer rol "Consulta" que solo pueda ver, sin crear ni editar.
6. Preparar el despliegue: `npm run build` en el frontend y servir la carpeta `dist` desde Express con `NODE_ENV=production` y HTTPS.
