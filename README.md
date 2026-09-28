# Sistema Escolar — Laboratorio Node.js + React + MariaDB

Arranque rápido (la guía completa está en **LABORATORIO.md**):

```bash
sudo mariadb < backend/database/schema.sql      # 1. base de datos
cd backend && npm install && cp .env.example .env # 2. edita .env (DB_PASSWORD y JWT_SECRET)
npm run seed && npm run dev                       # 3. API en http://localhost:3000
cd ../frontend && npm install && npm run dev      # 4. (otra terminal) http://localhost:5173
```

Administradores: **Admin** / `$3cr3t` y **Root** / `W@t@SHi09`.
