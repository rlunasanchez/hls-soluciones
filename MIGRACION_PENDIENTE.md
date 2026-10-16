# Migración pendiente a la web (v2.168 a v2.175)

**Estado al 16-oct-2026:** todo lo de esta guía está **solo en local** (`main`, commits locales sin `push`). La web sigue en **v2.167** (`72f9183`). El dueño decidió **no publicar hasta el jueves 22-oct-2026**. Este documento permite hacer la migración aunque se pierda la sesión de trabajo.

Reglas del dueño: no hacer `git push` ni cambiar de rama sin orden expresa; el dueño ejecuta él mismo el SQL en Neon (Claude no tiene acceso ni credenciales); no tocar Cotizaciones/Informes/Orden de Compra.

## 0. Qué se va a publicar (resumen)

Commits locales sobre `72f9183` (ver detalle en `CAMBIOS.md`, entradas v2.168 a v2.175):

| Versión | Qué |
|---|---|
| v2.168 | Cliente **Empresa / Persona**, campos bloqueados cuando vienen de un buscador, limpieza (se elimina `setup-admin`, se quitan 7 columnas de `ordenes_trabajo`), OT en archivos más chicos |
| v2.169 | Hook del listado de OT y formulario vacío fuera de la página |
| v2.170 | Foco tenue con Tab en botones (CSS global) |
| v2.171 | Persona con **una sola** dirección; `OrdenFormCliente` dividido en componentes |
| v2.172 | Buscador de cliente de la OT en su componente; fix "Cliente desactivado" |
| v2.173 | `OrdenTrabajo.jsx` más chico; fix "Cliente desactivado" al volver de una cotización |
| v2.174 | Nueva OT desde Clientes y selección de cliente unificadas |
| v2.175 | Equipos: sin duplicados al editar, eliminar solo admin, formulario que se limpia al ser rechazado |

**Cambios de base de datos y de backend** (lo único que exige migrar Neon y portar a PostgreSQL):

1. `clientes.tipo` (nueva columna).
2. `ordenes_trabajo.cliente_tipo` (nueva columna).
3. `ordenes_trabajo`: se **eliminan** 7 columnas que la OT nunca escribía: `contacto_id`, `contacto_direccion`, `contacto_ciudad`, `contacto_comuna`, `direccion_id`, `cliente_direccion_id`, `equipo_id`.
4. Backend `clientes.js`, `ordenes.js`, `equipos.js` y `auth.js` cambiaron (detalle en la sección 2).
5. El resto (frontend) es idéntico en ambas ramas: llega con el `merge`.

La **versión MySQL ya está aplicada en la base local** del dueño; los pasos de abajo son para Neon (PostgreSQL).

## 1. Migración de Neon (la corre el dueño en el SQL Editor de Neon)

Precauciones ya vividas: al pegar en el editor de Neon **se puede perder la primera letra**; empezar con una línea en blanco y revisar la primera palabra. No usar `BEGIN`/tablas temporales (el editor puede no mantener la sesión). Ejecutar de a una sentencia si hay dudas.

**Antes de borrar columnas, comprobar que no hay datos** (si devuelve filas con valor, avisar al dueño, no borrar):

```sql
SELECT COUNT(*) AS total,
  COUNT(contacto_id) AS contacto_id, COUNT(contacto_direccion) AS contacto_direccion,
  COUNT(contacto_ciudad) AS contacto_ciudad, COUNT(contacto_comuna) AS contacto_comuna,
  COUNT(direccion_id) AS direccion_id, COUNT(cliente_direccion_id) AS cliente_direccion_id,
  COUNT(equipo_id) AS equipo_id
FROM ordenes_trabajo;
```

Si todas las columnas dan 0 (o el dueño acepta perder esos valores), ejecutar:

```sql
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo VARCHAR(10) NOT NULL DEFAULT 'EMPRESA';
ALTER TABLE ordenes_trabajo ADD COLUMN IF NOT EXISTS cliente_tipo VARCHAR(10) DEFAULT 'EMPRESA';
ALTER TABLE ordenes_trabajo DROP COLUMN IF EXISTS contacto_id;
ALTER TABLE ordenes_trabajo DROP COLUMN IF EXISTS contacto_direccion;
ALTER TABLE ordenes_trabajo DROP COLUMN IF EXISTS contacto_ciudad;
ALTER TABLE ordenes_trabajo DROP COLUMN IF EXISTS contacto_comuna;
ALTER TABLE ordenes_trabajo DROP COLUMN IF EXISTS direccion_id;
ALTER TABLE ordenes_trabajo DROP COLUMN IF EXISTS cliente_direccion_id;
ALTER TABLE ordenes_trabajo DROP COLUMN IF EXISTS equipo_id;
```

**Verificación** (debe listar `tipo` en clientes y `cliente_tipo` en ordenes_trabajo, y no listar las 7 eliminadas):

```sql
SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('clientes','ordenes_trabajo')
  AND column_name IN ('tipo','cliente_tipo','contacto_id','contacto_direccion','contacto_ciudad',
                      'contacto_comuna','direccion_id','cliente_direccion_id','equipo_id')
ORDER BY 1, 2;
```

**Ojo con el orden:** mientras Render siga con el backend viejo (`v2.167`), este backend **escribe** las 7 columnas que se van a borrar. Por eso se migra Neon y se despliega el backend nuevo **seguidos**, sin dejar pasar horas entre ambos (si alguien guarda una OT entre medio, falla). Alternativa más segura: ejecutar primero solo los dos `ADD COLUMN`, desplegar el backend, y recién después los `DROP COLUMN`.

Nota: con los `ADD COLUMN` primero, cualquier cliente existente queda como `EMPRESA` (valor por defecto) y las OT existentes también.

## 2. Portar el backend a PostgreSQL (`deploy/cloud`)

`deploy/cloud` = `main` + backend en sintaxis PostgreSQL. **Un `merge` limpio NO garantiza que `backend/routes/*.js` quede bien**: abrir cada archivo y contar. Reglas de traducción en `AGENTS.md` sección 2 (`?` → `$N`, `result.rows`, `RETURNING id`, `IFNULL` → `COALESCE`, etc.).

### 2.1 `backend/routes/auth.js`
Eliminar por completo `router.post("/setup-admin", ...)`. Nada más (el primer admin se crea con `node backend/crear-admin.js`). Quitar `SETUP_ADMIN_KEY` de la configuración de Render si estaba.

### 2.2 `backend/routes/equipos.js`
- Importar `adminOnly`: `import { authMiddleware, adminOnly } from "../middleware/authMiddleware.js";`
- `router.delete("/:id", authMiddleware, adminOnly, ...)`.
- En `PUT /:id`, **antes** de leer el código existente y después de validar el nombre, agregar la comprobación de duplicado (excluye el propio id):

```js
const dup = await pool.query(
  `SELECT codigo FROM equipos
   WHERE id <> $1 AND LOWER(TRIM(equipo)) = LOWER($2)
     AND LOWER(TRIM(COALESCE(marca,''))) = LOWER($3) AND LOWER(TRIM(COALESCE(modelo,''))) = LOWER($4)
   LIMIT 1`,
  [id, equipo.trim(), (marca || '').trim(), (modelo || '').trim()]
);
if (dup.rows.length > 0) {
  return res.status(400).json({ msg: `Ya existe otro equipo ${equipo.trim()} ${(marca || '').trim()} ${(modelo || '').trim()} en el mantenedor con el código ${dup.rows[0].codigo}.` });
}
```

### 2.3 `backend/routes/clientes.js`
- **POST** `/`: antes del `INSERT`, `const tipo = req.body.tipo === "PERSONA" ? "PERSONA" : "EMPRESA";`. Agregar la columna `tipo` **después de `codigo`** en la lista de columnas del `INSERT INTO clientes` y un placeholder más (`$2`), **renumerando** todos los siguientes (`razon_social` pasa a `$3`, etc.); el arreglo de parámetros lleva `tipo` en la 2.ª posición.
- **PUT** `/:id`: `const tipoNuevo = req.body.tipo === "PERSONA" ? "PERSONA" : req.body.tipo === "EMPRESA" ? "EMPRESA" : null;` (si no se envía, se conserva el tipo). En el `UPDATE clientes` agregar `tipo = COALESCE($2, tipo)` y **renumerar** los demás parámetros y el `WHERE id`.
- **Cascade a las OT** (dentro del PUT): el `UPDATE ordenes_trabajo` pasa a incluir el tipo:

```sql
UPDATE ordenes_trabajo
SET cliente = $1, cliente_tipo = (SELECT tipo FROM clientes WHERE id = $2), rut = $3, fono_principal = $4, email = $5
WHERE cliente_id = $6
-- parámetros: [razon_social, id, rut || null, telefono || null, email || null, id]
```
- **`enriquecerClientes`** (la función que arma `ot_direccion`, `ot_ciudad`, `ot_comuna` y `contacto_*` para cada cliente). Es lógica JavaScript, **igual que en MySQL**; copiar tal cual:
  - `const esPersona = r.tipo === "PERSONA";`
  - `const dirOT = esPersona ? (dirPrincipal || listaD[0]) : dirPrincipal;` (una persona usa su dirección marcada "En la OT" o, si no hay marca, la primera; una empresa solo la marcada).
  - `ot_direccion/ot_ciudad/ot_comuna` salen de `dirOT`.
  - `contacto_nombre`, `contacto_email`, `contacto_fono`, `contacto_cargo` van **vacíos si es persona**; si no, del contacto marcado.

### 2.4 `backend/routes/ordenes.js` (el más delicado: hay que renumerar `$N`)
Cambios respecto de `v2.167`:
- Desestructuración del `body` (POST y PUT): **quitar** `contactoId, contactoDireccion, contactoCiudad, contactoComuna, direccionId, clienteDireccionId` y **agregar** `clienteTipo` al final (después de `clienteId`).
- Debajo de `const finalClienteId = clienteId || null;` agregar `const tipoCliente = clienteTipo === "PERSONA" ? "PERSONA" : "EMPRESA";` y **borrar** `const finalEquipoId = null;` (con su comentario) en POST y en PUT.
- **GET `/`** (listado): en el `SELECT`, quitar `contacto_id, contacto_direccion, contacto_ciudad, contacto_comuna, direccion_id, cliente_direccion_id` y `equipo_id`; agregar `cliente_tipo` (queda `cliente_id, cliente_tipo, fecha_creacion, ...`).
- **POST `INSERT`:** de 56 a **50** columnas/parámetros (`$1` a `$50`, `RETURNING id`):
  - quitar de la lista de columnas `contacto_id, contacto_direccion, contacto_ciudad, contacto_comuna, direccion_id, cliente_direccion_id` (quedan juntas `cargo_contacto, fono_principal`) y `equipo_id` (al final);
  - agregar `cliente_tipo` al final, después de `cliente_id`;
  - de los parámetros quitar `contactoId || null, contactoDireccion || null, contactoCiudad || null, contactoComuna || null, direccionId || null, clienteDireccionId || null` y `finalEquipoId`; el arreglo termina en `..., finalClienteId, tipoCliente]`.
  - **Contar:** columnas = placeholders = parámetros = 50.
- **PUT `UPDATE`:** de 55 asignaciones a **49** y `WHERE id = $50`:
  - quitar `contacto_id = $n, contacto_direccion = $n, contacto_ciudad = $n, contacto_comuna = $n, direccion_id = $n, cliente_direccion_id = $n` y `equipo_id = $n`;
  - agregar `cliente_tipo = $n` después de `cliente_id`;
  - parámetros: `..., finalClienteId, tipoCliente, id]`.
  - **Renumerar** todos los `$N` posteriores a cada columna quitada.

Versión MySQL de referencia: `git show 72f9183:backend/routes/ordenes.js` (antes) contra `git show main:backend/routes/ordenes.js` (después). Verificación de conteo ya usada en MySQL: columnas del INSERT = placeholders = 50, asignaciones del UPDATE = 49 (más el `WHERE id`).

### 2.5 Archivos que NO cambian
`backend/config/db.js`, `backend/package.json`, `backend/server.js`, `middleware/authMiddleware.js`, `contactos.js`, `direcciones.js`, `cotizaciones.js`. **Cotizaciones no se tocó**: sigue leyendo `orden.contacto_id`, etc. y recibe vacío (ya venían vacíos).

## 3. Procedimiento de publicación (jueves)

Usar un **`git worktree` temporal** para no tocar la carpeta del dueño (cambiar de rama allí le rompe el entorno local):

```bash
git worktree add ../hls-deploy deploy/cloud
cd ../hls-deploy
git merge main        # los conflictos de backend/: conservar la versión de deploy/cloud y luego aplicar la sección 2 a mano
# aplicar la sección 2 en backend/routes/{auth,equipos,clientes,ordenes}.js
node --check backend/routes/*.js
```

1. **Probar el backend PostgreSQL antes de subirlo** con `embedded-postgres` (ver `AGENTS.md` sección 2: `initdbFlags: ['--encoding=UTF8','--locale=C']`, esquema desde `crear_tablas.sql` convertido, `a_ot` como `SMALLINT`, puerto distinto del 5001). Pruebas mínimas: crear cliente EMPRESA y PERSONA (comprobar `tipo`), editar el tipo y ver el cascade en `ordenes_trabajo.cliente_tipo`, crear/editar/listar/borrar una OT (50 columnas), `GET /api/clientes` con una persona (debe traer `ot_direccion` de su dirección vinculada y contacto vacío), editar un equipo a un duplicado (debe responder 400), borrar un equipo con usuario no admin (debe responder 403).
2. **Neon** (sección 1): primero los dos `ADD COLUMN`.
3. `git push origin deploy/cloud` → Render despliega solo. Esperar a que termine (revisar el panel de Render o `gh api repos/rlunasanchez/hls-soluciones/deployments`).
4. Ejecutar en Neon los `DROP COLUMN` (sección 1).
5. Con el backend nuevo ya en línea, **`git push origin main`** → Vercel publica el frontend. **Verificar en Vercel que el deployment sea "Production"** (`gh api repos/rlunasanchez/hls-soluciones/deployments`); si queda como "Preview", ver `docs/HISTORIAL.md` (sección 16 y la nota "Always Promote to Production").
6. Quitar el worktree: `git worktree remove ../hls-deploy`.

**Si el frontend llega antes que el backend** la web da 404/errores en las rutas nuevas (pasó el 13-oct-2026). Por eso el orden es siempre Neon → `deploy/cloud` → `main`.

## 4. Verificación en la web (https://hls-soluciones.vercel.app)

1. Iniciar sesión. Clientes: crear una **persona** (selector Tipo), vincular **una** dirección (no debe dejar agregar una segunda) y guardar.
2. OT nueva: elegir esa persona → debe traer su dirección, contacto vacío y bloqueado; generar el PDF (dirección en "Datos de Cliente", sin sección Contacto).
3. OT nueva con una **empresa**: contacto y dirección salen vacíos hasta elegirlos con los buscadores; al elegirlos se bloquean los campos.
4. Equipos: editar uno dejándolo igual a otro → debe avisar con el código y restaurar el formulario. El botón "Eliminar" solo para admin.
5. Editar y ver una OT existente (antes de la migración): deben abrir sin errores (las OT viejas quedan como Empresa).
6. Tab por los botones: foco tenue.

## 5. Si algo sale mal (reversión)

- **Frontend:** en Vercel, promover el deployment anterior (`72f9183`) a Production. En Vercel Hobby no hay rollback con un clic; usar "Promote to Production" sobre el deployment viejo (ver `docs/HISTORIAL.md`).
- **Backend:** en Render, redeploy del commit anterior de `deploy/cloud` (`cb21990`).
- **Neon:** las columnas nuevas (`tipo`, `cliente_tipo`) son inofensivas si se queda el backend viejo. Las 7 columnas eliminadas se pueden volver a crear vacías: `ALTER TABLE ordenes_trabajo ADD COLUMN contacto_id INTEGER, ADD COLUMN contacto_direccion VARCHAR(255), ADD COLUMN contacto_ciudad VARCHAR(100), ADD COLUMN contacto_comuna VARCHAR(100), ADD COLUMN direccion_id INTEGER, ADD COLUMN cliente_direccion_id INTEGER, ADD COLUMN equipo_id INTEGER;` (no recuperan datos, pero estaban vacías).

## 6. Dónde está todo

- `CAMBIOS.md`: entradas v2.168 a v2.175 con el detalle de cada cambio.
- `AGENTS.md`: guía del proyecto; sección 2 (ramas y despliegue), sección 7b (plan de reducción de tamaño de archivos).
- Este archivo se puede **borrar después de publicar** (o mover a `docs/`).
