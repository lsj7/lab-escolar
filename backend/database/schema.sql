-- =============================================================
--  Laboratorio: Sistema Escolar (Node.js + React + MariaDB)
--  Ejecutar como administrador de MariaDB:
--     sudo mariadb < database/schema.sql
--  ¡OJO! Borra y vuelve a crear la base de datos lab_escolar.
-- =============================================================
DROP DATABASE IF EXISTS lab_escolar;
CREATE DATABASE lab_escolar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lab_escolar;

-- ---------- Usuarios del sistema ----------
CREATE TABLE usuarios (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(100) NOT NULL,
  username          VARCHAR(40)  NOT NULL UNIQUE,
  email             VARCHAR(120) NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  rol               ENUM('admin','usuario') NOT NULL DEFAULT 'usuario',
  foto              VARCHAR(255) NULL,
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  intentos_fallidos INT NOT NULL DEFAULT 0,
  bloqueado_hasta   DATETIME NULL,
  creado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------- Maestros ----------
CREATE TABLE maestros (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(120) NOT NULL,
  email        VARCHAR(120) NULL UNIQUE,
  telefono     VARCHAR(20)  NULL,
  especialidad VARCHAR(100) NULL,
  creado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Materias (clave única + maestro) ----------
CREATE TABLE materias (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clave      VARCHAR(20)  NOT NULL UNIQUE,
  nombre     VARCHAR(120) NOT NULL,
  creditos   TINYINT UNSIGNED NOT NULL DEFAULT 5,
  maestro_id INT UNSIGNED NULL,
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_materia_maestro FOREIGN KEY (maestro_id)
    REFERENCES maestros(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ---------- Grupos ----------
CREATE TABLE grupos (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clave     VARCHAR(20)  NOT NULL UNIQUE,
  carrera   VARCHAR(100) NOT NULL,
  semestre  TINYINT UNSIGNED NOT NULL,
  turno     ENUM('Matutino','Vespertino') NOT NULL DEFAULT 'Matutino',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Alumnos ----------
CREATE TABLE alumnos (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  matricula  VARCHAR(20)  NOT NULL UNIQUE,
  nombre     VARCHAR(120) NOT NULL,
  direccion  VARCHAR(200) NULL,
  telefono   VARCHAR(20)  NULL,
  carrera    VARCHAR(100) NOT NULL,
  semestre   TINYINT UNSIGNED NOT NULL,
  materia_id INT UNSIGNED NULL,
  grupo_id   INT UNSIGNED NULL,
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alumno_materia FOREIGN KEY (materia_id)
    REFERENCES materias(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_alumno_grupo FOREIGN KEY (grupo_id)
    REFERENCES grupos(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =============================================================
--  Regla de negocio en la propia BD: máximo 2 administradores
--  y ningún administrador puede borrarse. (Defensa en profundidad:
--  aunque alguien salte la API, la base de datos lo impide.)
-- =============================================================
DELIMITER //
CREATE TRIGGER trg_admin_max_insert BEFORE INSERT ON usuarios FOR EACH ROW
BEGIN
  IF NEW.rol = 'admin' AND (SELECT COUNT(*) FROM usuarios WHERE rol = 'admin') >= 2 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo pueden existir 2 administradores';
  END IF;
END//

CREATE TRIGGER trg_admin_max_update BEFORE UPDATE ON usuarios FOR EACH ROW
BEGIN
  IF NEW.rol = 'admin' AND OLD.rol <> 'admin'
     AND (SELECT COUNT(*) FROM usuarios WHERE rol = 'admin') >= 2 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo pueden existir 2 administradores';
  END IF;
END//

CREATE TRIGGER trg_admin_no_delete BEFORE DELETE ON usuarios FOR EACH ROW
BEGIN
  IF OLD.rol = 'admin' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los administradores no se pueden eliminar';
  END IF;
END//
DELIMITER ;

-- =============================================================
--  Usuario de MariaDB exclusivo para la aplicación
--  (mínimo privilegio: solo CRUD sobre esta base de datos).
--  Cambia la contraseña y ponla igual en backend/.env
-- =============================================================
CREATE USER IF NOT EXISTS 'lab_app'@'%' IDENTIFIED BY 'password123';
ALTER USER 'lab_app'@'%' IDENTIFIED BY 'password123';
GRANT SELECT, INSERT, UPDATE, DELETE ON lab_escolar.* TO 'lab_app'@'%';
FLUSH PRIVILEGES;
