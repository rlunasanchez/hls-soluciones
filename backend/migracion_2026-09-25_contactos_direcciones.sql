-- Migración manual para replicar en cualquier otra base MySQL (ej. la de tu casa)
-- los cambios de esquema hechos en esta sesión (v2.147 en adelante, ver CAMBIOS.md).
-- Correr TODO este archivo una sola vez contra esa base. Es seguro repetirlo:
-- los CREATE usan IF NOT EXISTS y los DROP se pueden comentar si ya se corrieron.

-- 1) Tablas nuevas: mantenedores globales de Contactos y Direcciones
--    (mismo criterio que "equipos": sin FK a clientes).
CREATE TABLE IF NOT EXISTS contactos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  fono VARCHAR(20),
  cargo VARCHAR(100),
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS direcciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE,
  direccion VARCHAR(255) NOT NULL,
  ciudad VARCHAR(100),
  comuna VARCHAR(100),
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) Columnas nuevas en ordenes_trabajo para enlazar por ID a los catálogos
--    (en vez de solo por texto).
ALTER TABLE ordenes_trabajo
  ADD COLUMN contacto_id INT,
  ADD COLUMN contacto_direccion VARCHAR(255),
  ADD COLUMN contacto_ciudad VARCHAR(100),
  ADD COLUMN contacto_comuna VARCHAR(100),
  ADD COLUMN direccion_id INT,
  ADD COLUMN cliente_direccion_id INT;

-- 3) Columnas nuevas en cotizaciones (mismo motivo).
ALTER TABLE cotizaciones
  ADD COLUMN cliente_direccion_id INT,
  ADD COLUMN contacto_id INT,
  ADD COLUMN contacto_direccion VARCHAR(255),
  ADD COLUMN contacto_ciudad VARCHAR(100),
  ADD COLUMN contacto_comuna VARCHAR(100),
  ADD COLUMN direccion_id INT;

-- 4) Limpieza: el contacto/dirección embebidos en Cliente quedaron obsoletos
--    (ahora viven en los catálogos globales de arriba). Antes de correr esto,
--    confirmar que esas tablas/columnas no tengan datos que todavía se necesiten
--    (en esta sesión se verificó 0 filas antes de borrar en la base local).
DROP TABLE IF EXISTS clientes_contactos;
DROP TABLE IF EXISTS clientes_direcciones;

ALTER TABLE clientes
  DROP COLUMN contacto_nombre,
  DROP COLUMN contacto_email,
  DROP COLUMN contacto_fono,
  DROP COLUMN contacto_cargo,
  DROP COLUMN contacto_direccion,
  DROP COLUMN contacto_ciudad,
  DROP COLUMN contacto_comuna;

-- No se tocan clientes.direccion/ciudad/comuna (son la dirección propia del
-- cliente, siguen vivas) ni ninguna otra tabla.
