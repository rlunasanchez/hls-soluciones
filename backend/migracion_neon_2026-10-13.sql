-- ============================================================================
-- MIGRACIÓN NEON (PostgreSQL) — Contactos y Direcciones como catálogos vinculados
-- Equivale a lo que en MySQL hacen migracion_2026-09-25_contactos_direcciones.sql
-- y migracion_2026-10-01_cliente_vinculos.sql, MÁS la copia de los datos que hoy
-- tiene Neon (los contactos y direcciones del esquema antiguo).
--
-- CÓMO USARLA
--  1. En Neon crea una RAMA de la base (Branches → Create branch) y corre el script
--     primero ahí para revisar el resultado. Después córrelo en la rama de producción.
--  2. Pega todo el archivo en el SQL Editor de Neon y ejecútalo de una vez.
--  3. Es ADITIVA: solo crea tablas y columnas nuevas y copia datos. No borra ni modifica
--     nada existente, así que el sistema actual de la nube sigue funcionando igual.
--  4. Es seguro repetirla: no duplica tablas, columnas ni registros. No usa transacción ni
--     tablas temporales a propósito: cada instrucción funciona por sí sola, y si algo falla
--     a medias basta con volver a ejecutarla.
--
-- QUÉ NO HACE
--  - No borra clientes_contactos, clientes_direcciones ni las columnas clientes.contacto_*
--    (quedan como respaldo; se pueden eliminar más adelante cuando todo esté verificado).
--  - No marca ningún check "En la OT": todos los vínculos nacen con a_ot = 0.
--  - Las OT y cotizaciones ya guardadas no cambian (las columnas nuevas quedan en NULL).
--  - Se pierden dos datos menores del esquema antiguo, que el catálogo nuevo no tiene:
--    el "tipo" de la dirección (Matriz / Sucursal) y el fono de cada dirección.
-- ============================================================================

-- 1) Catálogos globales -----------------------------------------------------
CREATE TABLE IF NOT EXISTS contactos (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  fono VARCHAR(20),
  cargo VARCHAR(100),
  activo SMALLINT DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS direcciones (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE,
  direccion VARCHAR(255) NOT NULL,
  ciudad VARCHAR(100),
  comuna VARCHAR(100),
  activo SMALLINT DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) Vínculos cliente <-> contactos / direcciones (muchos a muchos) ----------
--    orden: posición en la lista del cliente. a_ot: 1 = marcado "En la OT" (un solo uso).
CREATE TABLE IF NOT EXISTS cliente_contactos (
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  contacto_id INTEGER NOT NULL REFERENCES contactos(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL DEFAULT 0,
  a_ot SMALLINT NOT NULL DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cliente_id, contacto_id)
);
CREATE INDEX IF NOT EXISTS idx_cc_contacto ON cliente_contactos (contacto_id);

CREATE TABLE IF NOT EXISTS cliente_direcciones (
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  direccion_id INTEGER NOT NULL REFERENCES direcciones(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL DEFAULT 0,
  a_ot SMALLINT NOT NULL DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cliente_id, direccion_id)
);
CREATE INDEX IF NOT EXISTS idx_cd_direccion ON cliente_direcciones (direccion_id);

-- 3) Columnas nuevas en órdenes de trabajo y cotizaciones --------------------
ALTER TABLE ordenes_trabajo
  ADD COLUMN IF NOT EXISTS contacto_id INTEGER,
  ADD COLUMN IF NOT EXISTS contacto_direccion VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contacto_ciudad VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contacto_comuna VARCHAR(100),
  ADD COLUMN IF NOT EXISTS direccion_id INTEGER,
  ADD COLUMN IF NOT EXISTS cliente_direccion_id INTEGER;

ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS cliente_direccion_id INTEGER,
  ADD COLUMN IF NOT EXISTS contacto_id INTEGER,
  ADD COLUMN IF NOT EXISTS contacto_direccion VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contacto_ciudad VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contacto_comuna VARCHAR(100),
  ADD COLUMN IF NOT EXISTS direccion_id INTEGER;

-- 4) Copia de los CONTACTOS existentes --------------------------------------
--    Origen: clientes_contactos (todos los contactos) y clientes.contacto_* (el principal).
--    Los textos se recortan al largo de las columnas nuevas (LEFT) para que un dato demasiado
--    largo no haga fallar y deshacer toda la migración.
--    Un mismo nombre (sin importar mayúsculas) se convierte en UN solo contacto del catálogo,
--    igual que hace la aplicación al reutilizar por nombre. Mínimo 3 letras, como en la app.
WITH origen AS (SELECT cliente_id, LEFT(TRIM(nombre), 100) AS nombre, LEFT(email, 100) AS email, LEFT(fono, 20) AS fono, LEFT(cargo, 100) AS cargo, id AS ord
   FROM clientes_contactos
   WHERE LENGTH(TRIM(COALESCE(nombre, ''))) >= 3
   UNION ALL
   SELECT id, LEFT(TRIM(contacto_nombre), 100), LEFT(contacto_email, 100), LEFT(contacto_fono, 20), LEFT(contacto_cargo, 100), 0
   FROM clientes
   WHERE LENGTH(TRIM(COALESCE(contacto_nombre, ''))) >= 3),
unicos AS (
  SELECT DISTINCT ON (LOWER(nombre)) nombre, email, fono, cargo
  FROM origen
  ORDER BY LOWER(nombre), ord
),
nuevos AS (
  SELECT u.*, ROW_NUMBER() OVER (ORDER BY LOWER(u.nombre)) AS n
  FROM unicos u
  WHERE NOT EXISTS (SELECT 1 FROM contactos c WHERE LOWER(TRIM(c.nombre)) = LOWER(u.nombre))
),
base AS (
  SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 4) AS INTEGER)), 0) AS m
  FROM contactos WHERE codigo ~ '^CO-[0-9]+$'
)
INSERT INTO contactos (codigo, nombre, email, fono, cargo)
SELECT 'CO-' || LPAD((base.m + nuevos.n)::TEXT, 4, '0'),
       nuevos.nombre,
       NULLIF(TRIM(nuevos.email), ''), NULLIF(TRIM(nuevos.fono), ''), NULLIF(TRIM(nuevos.cargo), '')
FROM nuevos CROSS JOIN base;

INSERT INTO cliente_contactos (cliente_id, contacto_id, orden)
WITH origen AS (SELECT cliente_id, LEFT(TRIM(nombre), 100) AS nombre, LEFT(email, 100) AS email, LEFT(fono, 20) AS fono, LEFT(cargo, 100) AS cargo, id AS ord
   FROM clientes_contactos
   WHERE LENGTH(TRIM(COALESCE(nombre, ''))) >= 3
   UNION ALL
   SELECT id, LEFT(TRIM(contacto_nombre), 100), LEFT(contacto_email, 100), LEFT(contacto_fono, 20), LEFT(contacto_cargo, 100), 0
   FROM clientes
   WHERE LENGTH(TRIM(COALESCE(contacto_nombre, ''))) >= 3)
SELECT x.cliente_id, c.id,
       ROW_NUMBER() OVER (PARTITION BY x.cliente_id ORDER BY x.ord, c.id) - 1
FROM (
  SELECT DISTINCT ON (cliente_id, LOWER(nombre)) cliente_id, nombre, ord
  FROM origen
  ORDER BY cliente_id, LOWER(nombre), ord
) x
JOIN contactos c ON LOWER(TRIM(c.nombre)) = LOWER(x.nombre)
ON CONFLICT (cliente_id, contacto_id) DO NOTHING;

-- 5) Copia de las DIRECCIONES existentes ------------------------------------
--    Origen: clientes_direcciones. (clientes.direccion/ciudad/comuna son los datos propios
--    del cliente y NO se copian: siguen en la ficha.) Mínimo 5 caracteres, como en la app.
WITH origen AS (SELECT cliente_id, LEFT(TRIM(direccion), 255) AS direccion, LEFT(ciudad, 100) AS ciudad, LEFT(comuna, 100) AS comuna, id AS ord
   FROM clientes_direcciones
   WHERE LENGTH(TRIM(COALESCE(direccion, ''))) >= 5),
unicos AS (
  SELECT DISTINCT ON (LOWER(direccion)) direccion, ciudad, comuna
  FROM origen
  ORDER BY LOWER(direccion), ord
),
nuevos AS (
  SELECT u.*, ROW_NUMBER() OVER (ORDER BY LOWER(u.direccion)) AS n
  FROM unicos u
  WHERE NOT EXISTS (SELECT 1 FROM direcciones d WHERE LOWER(TRIM(d.direccion)) = LOWER(u.direccion))
),
base AS (
  SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 4) AS INTEGER)), 0) AS m
  FROM direcciones WHERE codigo ~ '^DI-[0-9]+$'
)
INSERT INTO direcciones (codigo, direccion, ciudad, comuna)
SELECT 'DI-' || LPAD((base.m + nuevos.n)::TEXT, 4, '0'),
       nuevos.direccion,
       NULLIF(TRIM(nuevos.ciudad), ''), NULLIF(TRIM(nuevos.comuna), '')
FROM nuevos CROSS JOIN base;

INSERT INTO cliente_direcciones (cliente_id, direccion_id, orden)
WITH origen AS (SELECT cliente_id, LEFT(TRIM(direccion), 255) AS direccion, LEFT(ciudad, 100) AS ciudad, LEFT(comuna, 100) AS comuna, id AS ord
   FROM clientes_direcciones
   WHERE LENGTH(TRIM(COALESCE(direccion, ''))) >= 5)
SELECT x.cliente_id, d.id,
       ROW_NUMBER() OVER (PARTITION BY x.cliente_id ORDER BY x.ord, d.id) - 1
FROM (
  SELECT DISTINCT ON (cliente_id, LOWER(direccion)) cliente_id, direccion, ord
  FROM origen
  ORDER BY cliente_id, LOWER(direccion), ord
) x
JOIN direcciones d ON LOWER(TRIM(d.direccion)) = LOWER(x.direccion)
ON CONFLICT (cliente_id, direccion_id) DO NOTHING;


-- 6) Verificación (ejecútala después; los números deben coincidir) -----------
-- SELECT (SELECT COUNT(*) FROM contactos)            AS contactos_catalogo,
--        (SELECT COUNT(*) FROM cliente_contactos)    AS vinculos_contactos,
--        (SELECT COUNT(*) FROM direcciones)          AS direcciones_catalogo,
--        (SELECT COUNT(*) FROM cliente_direcciones)  AS vinculos_direcciones,
--        (SELECT COUNT(*) FROM clientes_contactos)   AS contactos_antiguos,
--        (SELECT COUNT(*) FROM clientes_direcciones) AS direcciones_antiguas;
