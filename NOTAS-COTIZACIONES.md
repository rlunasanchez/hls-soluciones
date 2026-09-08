# Notas — Módulo de Cotizaciones (pendientes y relevamiento)

> Documento de trabajo. Relevamiento hecho el 2026-09-07 para retomar el módulo de
> Cotizaciones. NO es un registro de cambios de versión (eso va en `CAMBIOS.md`).

---

## 0. BLOQUEANTE INMEDIATO — la tabla no existe en la BD local

`SHOW TABLES LIKE 'cotizaciones'` sobre `soporte_tecnico_db` devuelve **vacío**.

- Causa: `backend/crear_tablas.sql` usa `CREATE TABLE IF NOT EXISTS` y `backend/server.js`
  no lo ejecuta al arrancar. El script nunca se corrió desde que se agregó la tabla en v2.46.
- El DDL de la tabla está en `backend/crear_tablas.sql:145-179`.
- Mientras la tabla no exista, el módulo de Cotizaciones no puede guardar nada
  (ni suelta ni ligada a una OT) y no hay nada que consultar.
- Es el mismo tipo de problema que apareció hoy con `usuarios.nombre`: columnas/tablas
  nuevas en `crear_tablas.sql` no se aplican a una BD ya creada.

**Antes de crear la tabla, ver la sección 4** (conviene sumar columnas ahora y evitar un `ALTER TABLE` después).

---

## 1. Relación OT ↔ Cotización — cómo funciona hoy

La relación **ya existe en el modelo de datos**, es de una sola dirección en la interfaz.

### Datos

`cotizaciones` (`backend/crear_tablas.sql:145-179`):

- `orden_id INT` — FK real a `ordenes_trabajo.id`, nullable, `ON DELETE SET NULL`
  (si se borra la OT, sus cotizaciones quedan como independientes, no se borran).
- `orden_numero VARCHAR(50)` — snapshot del string `OT-YYYY-NNNNN`.
- Índice `idx_orden_id` ya creado → el filtro por OT no necesita cambios de esquema.
- `cliente_id` es una FK **independiente**, no es el vínculo con la OT.

### Cómo se llena

Solo al **crear** una cotización entrando desde el menú "..." de una OT:

- `frontend/src/pages/OrdenTrabajo.jsx:718-722` (`irACotizacionOrdenActual`) y `:970`
  (menú de fila) → `navigate('/cotizaciones', { state: { orden } })`.
- `frontend/src/pages/Cotizaciones.jsx:128-129` → setea `ordenId: orden.id`,
  `ordenNumero: orden.numero_orden`.
- El backend persiste y devuelve ambas columnas:
  `backend/routes/cotizaciones.js:24` (SELECT), `:70,87-99` (INSERT), `:132` (UPDATE).

### Cotización suelta (sin OT)

**Ya funciona, es parte del diseño.** `orden_id` nullable, el backend inserta
`ordenId || null` (`cotizaciones.js:98`), y si entrás a Cotizaciones por el menú
normal el formulario arranca con `ordenId: null` (`Cotizaciones.jsx:38-39`).
El comentario del esquema lo dice literal:
`-- orden_id nulo = cotización independiente` (`crear_tablas.sql:142-144`).

---

## 2. Lo que falta

### a) Ver desde la OT cuáles son sus cotizaciones — NO EXISTE

- `backend/routes/ordenes.js` no menciona la tabla `cotizaciones` en ningún lado.
- No hay filtro `?orden_id=` en `GET /api/cotizaciones` ni endpoint
  `GET /api/ordenes/:id/cotizaciones`.
- El listado de Cotizaciones (`CotizacionLista.jsx`) no muestra la OT: columnas
  Folio / Cliente / Fecha / Ejecutivo / Total. Filtros: solo folio + cliente.
- Único rastro visible hoy: al abrir una cotización, el badge del título
  "· asociada a OT N° X" (`Cotizaciones.jsx:503`). Hay que ir de a una.

**Consulta directa a la BD mientras tanto:**

```sql
-- Todas las OT con su conteo de cotizaciones
SELECT o.numero_orden,
       COUNT(c.id)                            AS cotizaciones,
       GROUP_CONCAT(c.folio ORDER BY c.folio) AS folios
FROM ordenes_trabajo o
LEFT JOIN cotizaciones c ON c.orden_id = o.id
GROUP BY o.id, o.numero_orden
ORDER BY o.id DESC;

-- Las cotizaciones de una OT puntual
SELECT folio, fecha_emision FROM cotizaciones WHERE orden_id = <id_de_la_ot>;
```

### b) Ligar / desligar una cotización a una OT después de creada — NO EXISTE en la UI

- El backend **ya lo soporta**: `PUT /api/cotizaciones/:id` actualiza
  `orden_id` y `orden_numero` (`cotizaciones.js:132`).
- Falta solo un control en el formulario de Cotización (selector "OT asociada"
  con opción "(ninguna)").
- Punto flojo: `GET /api/ordenes` solo pagina, no busca por cliente ni número.
  Para poblar el selector habría que filtrar en el navegador por el cliente de la
  cotización, o agregar `?cliente_id=` a `/api/ordenes`.

---

## 3. Recomendación para retomar

**Hacer primero (a): "ver desde la OT sus cotizaciones", con chips clickeables.
Postergar (b): "ligar/desligar después".**

Motivos:

1. La tabla está vacía — no hay cotizaciones históricas sueltas ni vínculos mal
   puestos que reparar. Eso vacía el valor principal de (b).
2. (a) es de solo lectura: no puede corromper datos. Lo peor que pasa es que
   muestre mal un total.
3. (b) es escritura sobre una relación: un selector mal filtrado cuelga la
   cotización del cliente A a una OT del cliente B. Necesita además el filtro por
   cliente en `/api/ordenes`.
4. Usar (a) un tiempo muestra en la práctica si (b) se justifica: si nunca quedan
   cotizaciones sueltas por error, (b) no hace falta.

Excepción: si se van a cargar a mano cotizaciones viejas de papel y vincularlas a
OT ya cargadas, entonces (b) pasa a ser lo primero.

### Esquema del cambio (a)

- **Backend:** parámetro opcional `?orden_id=` en el `GET /` de
  `backend/routes/cotizaciones.js:13-42`. Si viene, agrega `WHERE orden_id = ?` al
  SELECT y al COUNT de paginación. Si no viene, comportamiento idéntico al actual.
  Sin endpoint nuevo, sin tocar `ordenes.js`.
- **Frontend:** en `OrdenTrabajo.jsx`, con `editingId` presente, pedir
  `GET /api/cotizaciones?orden_id=${editingId}&limit=100`. Mostrar:
  - badge "Cotizaciones: N" en el `.of-head` (líneas 979-989), al lado del badge
    "Técnico:" de v2.59, mismo estilo de pill. Solo si `editingId` y `N > 0`.
  - bloque `of-sec muted` de solo lectura con un chip por cotización
    (`N° {folio} · {fecha} · {total}`), patrón de chips de `OrdenFormCliente.jsx` (v2.57).
  - total por cotización: sumar `items[].cantidad * neto` del JSON, misma cuenta
    que ya hace `CotizacionLista.jsx` — reutilizar esa función, no reescribirla.
- **Chip clickeable (recomendado):** `navigate('/cotizaciones', { state: { cotizacionId: c.id } })`
  y extender el `useEffect` de `location.state` en `Cotizaciones.jsx:86-135` para
  cargar esa cotización en modo `soloLectura`. Sin esto, el bloque obliga a ir a
  Cotizaciones y buscar el folio a mano.

---

## 4. Datos del cliente en la cotización — trabajo pendiente

### Qué guarda hoy

BD (`cotizaciones`): `cliente_id`, `cliente_rut`, `cliente_razon_social`,
`contacto_nombre`, `contacto_fono`, `contacto_email`.

PDF (`frontend/src/utils/cotizacionDoc.js:153-162`): encabezado centrado con
**RUT + Razón Social**, y abajo Contacto / Fono Contacto / Email Contacto. Nada más.

POST que arma la cotización (`backend/routes/cotizaciones.js:64-100`): recibe y
guarda solo esos campos del cliente.

### Qué falta respecto de la ficha `clientes`

La tabla `clientes` tiene, y la cotización ignora:

| Campo en `clientes` | Nota |
|---|---|
| `giro` | dato tributario típico del encabezado |
| `direccion`, `ciudad`, `comuna` | ubicación — la OT sí las guarda |
| `telefono` | fono de la empresa (distinto del fono del contacto) |
| `email` | email de la empresa (distinto del del contacto) |
| `contacto_cargo` | a quién va dirigido y en qué rol |
| `contacto_direccion` | |

Comparación: la **OT sí guarda** dirección, comuna, fono principal, email, y hasta
contactos y direcciones extra (`ordenes_trabajo`, `crear_tablas.sql:73-84`). La
cotización quedó bastante más pobre.

### Ventana de oportunidad

Como la tabla `cotizaciones` **todavía no existe en la BD**, sumar estas columnas
al bloque `CREATE TABLE` de `crear_tablas.sql:145-179` **ahora** evita tener que
hacer `ALTER TABLE` después. Es exactamente el problema que apareció hoy con
`usuarios.nombre` (columna nueva en el script que no se aplicó a la BD ya creada,
hubo que hacer el ALTER a mano).

### Principio de diseño a mantener

Copiar los valores del cliente a la cotización **al momento de crearla** (snapshot),
igual que ya se hace con `cliente_razon_social` y como hace la OT. **No** hacer
`JOIN` contra `clientes` al renderizar el PDF.

Motivo: una cotización es un documento histórico. Si el cliente se muda y se edita
su dirección en la ficha, una cotización de hace seis meses tiene que seguir
mostrando la dirección que tenía cuando se emitió. Con `JOIN` se reescribiría el
pasado.

### Pasos cuando se retome

1. Definir la lista final de campos a agregar (ver tabla de arriba).
2. Agregar las columnas al `CREATE TABLE cotizaciones` en `crear_tablas.sql`.
3. Recién ahí crear la tabla en `soporte_tecnico_db`.
4. Backend: sumar los campos al destructuring y al INSERT del `POST /` y al `PUT /:id`
   (`backend/routes/cotizaciones.js`).
5. Frontend: sumar los campos a `cotizacionVacia()` (`Cotizaciones.jsx:22-40`) y
   al prefill desde cliente/OT (líneas 86-135).
6. PDF: decidir dónde van en `cotizacionDoc.js` (encabezado del cliente, líneas
   153-162, es el lugar natural).

---

## Archivos clave

| Archivo | Rol |
|---|---|
| `backend/crear_tablas.sql:145-179` | DDL de `cotizaciones` |
| `backend/routes/cotizaciones.js` | CRUD + `/siguiente-folio` |
| `backend/routes/ordenes.js` | CRUD de OT (no toca cotizaciones) |
| `backend/server.js:12,56` | monta `/api/cotizaciones` |
| `frontend/src/pages/Cotizaciones.jsx` | página del módulo |
| `frontend/src/components/cotizaciones/CotizacionLista.jsx` | listado + cálculo de total |
| `frontend/src/components/cotizaciones/CotizacionAcciones.jsx` | menú de acciones |
| `frontend/src/utils/cotizacionDoc.js` | generador del PDF/HTML |
| `frontend/src/pages/OrdenTrabajo.jsx:718-722,970,1086` | entradas OT → Cotización |
