# Registro de Cambios - HLS Soluciones

## Fecha: 2026-08-11

### Ocultar campo Garantía en el listado de Orden de Trabajo

**Problema:** El usuario no quería ver el campo "Garantía" en el mantenedor de OT (listado). Se mantiene el check en el formulario de nueva/editar orden para poder guardar el dato.

**Archivos modificados (solo frontend):**
- `frontend/src/components/ordenes/OrdenLista.jsx` — eliminados el filtro "Garantía", la columna de la tabla y el badge de las tarjetas
- `frontend/src/pages/OrdenTrabajo.jsx` — eliminados el estado `filtroGarantia`, su lógica de filtrado y el paso de props

**Se mantiene visible:**
- `frontend/src/components/ordenes/OrdenFormDatos.jsx` — el checkbox "Garantía" sigue en el formulario (al final de la fila de fechas, después de Compra) y `esGarantia` se guarda normalmente.

**Nota:** El valor `es_garantia` se sigue guardando en la DB (no se pierde data al editar), solo se ocultó del listado.

### Ocultar campo Serie en la vista del mantenedor de Equipos

**Problema:** El usuario no quería ver el campo "Serie" en la vista del mantenedor de Equipos (tabla, tarjetas y filtro). Se mantiene en el formulario de ingreso/edición de equipos para poder guardar el dato.

**Archivos modificados (solo frontend):**
- `frontend/src/components/equipos/EquipoTabla.jsx` — eliminada la columna "Serie"
- `frontend/src/components/equipos/EquipoCard.jsx` — eliminada la fila "Serie" en tarjetas
- `frontend/src/components/equipos/FiltrosEquipo.jsx` — eliminado el filtro de Serie
- `frontend/src/pages/Equipos.jsx` — eliminados el estado `filtroSerie` y su lógica

**Se mantiene visible:**
- `frontend/src/components/equipos/EquipoFormulario.jsx` — el campo "Serie" sigue en el formulario de ingreso/edición (junto a Modelo) y se guarda normalmente.

**Nota:** La serie se sigue guardando en la DB. Se conserva también en `OrdenFormEquipo.jsx` (búsqueda por serie en OT).

### Acciones en menú desplegable "..."

**Problema:** Los botones de acción (Ver, Editar, Eliminar, Informe, Cotización, OT) ocupaban mucho espacio en filas y tarjetas.

**Archivos nuevos:**
- `frontend/src/components/equipos/EquipoAcciones.jsx` — menú "..." con Ver/Editar/Eliminar
- `frontend/src/components/clientes/ClienteAcciones.jsx` — menú "..." con OT/Cotización/Ver/Editar/Eliminar
- `frontend/src/components/ordenes/OrdenAcciones.jsx` — menú "..." con Informe/Cotización/Ver/Editar/Eliminar

**Archivos modificados:**
- `frontend/src/components/equipos/EquipoTabla.jsx` y `EquipoCard.jsx` — usan `EquipoAcciones`
- `frontend/src/components/clientes/ClienteLista.jsx` — usa `ClienteAcciones` (tabla y tarjetas)
- `frontend/src/components/ordenes/OrdenLista.jsx` — usa `OrdenAcciones` (tabla y tarjetas)
- `frontend/src/styles/index.css` — estilos `.acciones-menu`, `.acciones-menu-btn`, `.acciones-dropdown`, `.acciones-item` (variantes ver/edit/delete/ot/cotizacion/informe)

**Detalles técnicos:**
- Dropdown usa `position: fixed` con posición calculada via `getBoundingClientRect()` + `z-index: 9999` para que no se recorte dentro del `.table-wrapper` (que tiene `overflow-x: auto`)
- Cierra al hacer clic fuera (patrón `useRef` + `mousedown`)

### Distribución de ancho de la tabla OT alineada con otros mantenedores

**Problema:** La tabla de OT usaba `table-layout: fixed` y anchos fijos en píxeles (`100px`, `190px`, etc.), quedando mal distribuida frente a Clientes/Equipos que usan distribución automática.

**Archivos modificados:**
- `frontend/src/components/ordenes/OrdenLista.jsx` — eliminados los anchos inline de las columnas
- `frontend/src/styles/OrdenTrabajo.css` — quitado `table-layout: fixed` del listado `.ot-list-wrap table` (el del formulario `.of-wrap table` se mantiene)

### Compactación del formulario "Datos de la Orden"

**Problema:** La sección "Datos de la Orden" ocupaba demasiado espacio en alto; N° Orden y Fecha se veían muy grandes y los labels apilaban el alto.

**Archivos modificados:**
- `frontend/src/components/ordenes/OrdenFormDatos.jsx`:
  - Título "Datos de la Orden" ahora a la izquierda en la misma fila que los campos (`.of-head-row`)
  - Campos N° Orden y Fecha en layout inline (label al lado del input, clase `.of-f-inline`)
  - N° Orden con clase `.of-f-num` (más angosto)
  - Checkbox Garantía movido al final de la fila de fechas, después de Compra
- `frontend/src/styles/OrdenTrabajo.css`:
  - `.of-head-row` — fila flex con el título a la izquierda (`min-width: 110px`, nowrap) y los campos al lado
  - `.of-f-inline` — label e input en la misma fila; inputs con `max-width: 150px`; `.of-f-num` con `max-width: 110px`
  - `.of-dates` — 5 columnas (Ingreso, Término, Entrega, Compra, Garantía)
  - Inputs del form OT compactos en alto: `padding: 2px 8px`, `line-height: 1.3` (mantiene `font-size: .82rem`)
  - Ancho máximo del formulario reducido de `900px` a `720px` (en `OrdenTrabajo.jsx`)

**Layout final de "Datos de la Orden":**
- Fila 1: `Datos de la Orden` (título) | `N° Orden` | `Fecha`
- Fila 2: `Ingreso` | `Término` | `Entrega` | `Compra` | `Garantía`

### Paginación en mantenedor de Usuarios

**Problema:** El mantenedor de usuarios no tenía paginación; se listaban todos los usuarios de una vez (a diferencia de Clientes, Equipos y OT que usan 4 por página).

**Archivo modificado (solo frontend):**
- `frontend/src/pages/GestionUsuarios.jsx`:
  - Estado `paginaActual` + constante `usuariosPorPagina = 4` (mismo estándar que los demás módulos)
  - Slice en frontend: `indiceInicio` + `usuariosFiltrados.slice(...)`
  - Componente `<Pagination currentPage={paginaActual} totalPages={totalPaginas} onPageChange={setPaginaActual} />` al final del bloque admin (se oculta solo si hay ≤1 página)

**Reglas replicadas desde Equipos/Clientes/OT:** 4 items por página, paginación frontend con `slice()` (no SQL), mismo componente `Pagination`.

### Buscador de Usuarios por nombre o correo

**Problema:** No había forma de filtrar la lista de usuarios.

**Archivo modificado (solo frontend):**
- `frontend/src/pages/GestionUsuarios.jsx`:
  - Estado `filtroBusqueda` con input "Buscar Usuario" (placeholder "Nombre o correo...") en la zona admin, sobre la tabla
  - Filtro case-insensitive sobre `usuario` y `email` (contiene el término, no solo inicio)
  - `useEffect` resetea a página 1 al cambiar el filtro (patrón de Equipos)
  - Botón "Limpiar" (icono `RotateCcw`) con la clase `btn-limpiar-equipos` (mismo estilo que los otros mantenedores)
  - La paginación opera sobre `usuariosFiltrados`, no sobre el dataset completo

### Fix error 500 al guardar Orden de Trabajo — placeholder de más en INSERT

**Problema:** Al guardar una OT daba error 500 con `ER_PARSE_ERROR` (`...syntax to use near '?)'`).

**Causa:** El INSERT de `backend/routes/ordenes.js` (POST) tenía **46 placeholders `?`** pero la query solo tiene **45 columnas**. El `?` sobrante quedaba literal al final del SQL (`..., 27, 23, ?)`) y MySQL lo rechazaba.

**Archivo modificado:** `backend/routes/ordenes.js` — quitado un `?` de la lista `VALUES` del INSERT (quedó 45/45). Verificado también en `deploy/cloud` (ya estaba correcto, no se tocó).

### Buscadores de Serie y Modelo en OT: solo llaman datos, sin vincular equipo

**Problema:** Antes, al buscar por serie o modelo en la OT, se vinculaba el equipo (`equipo_id`) y aparecía el badge "✓ Seleccionado". El usuario quiere que una OT pueda tener el mismo modelo con otra serie: los buscadores solo deben **llamar los datos** (equipo, marca, modelo, serie) al formulario, sin ligar el equipo.

**Archivos modificados:**

- `frontend/src/pages/OrdenTrabajo.jsx`:
  - `seleccionarEquipo` (búsqueda por serie): ya NO setea `equipoSeleccionado`; solo rellena equipo/marca/modelo/serie
  - `seleccionarEquipoPorModelo` (nuevo): rellena equipo/marca/modelo, deja serie vacía y NO vincula equipo
  - `guardarOrden`: `equipoId: null` siempre (las OT no se vinculan a equipos)
  - `editarOrden`: eliminado `cargarEquipoFresco` (no se setea `equipoSeleccionado` → sin badge al editar; los datos vienen del snapshot de la OT)
  - `equiposModeloFiltrados`: modelos únicos (deduplicados por `modelo` con `Map`) para no repetir por cada serie
  - `verOrden`: se mantiene el badge de vinculación solo en modo Ver (solo lectura)
- `frontend/src/components/ordenes/OrdenFormEquipo.jsx`: dropdown de modelo usa `seleccionarEquipoPorModelo`; quitado el texto "Solo modelo (sin serie)" y quitado el `Código` del dropdown de búsqueda por serie (solo muestra "Serie: XXX")
- `backend/routes/ordenes.js` (solo `main`/MySQL):
  - Eliminada la auto-vinculación en POST y PUT (`finalEquipoId = null`). Antes, si `equipoId` era null pero había `serie`, el backend buscaba o creaba el equipo por serie y lo ligaba. Ahora las OT solo guardan los datos copiados en sus columnas desnormalizadas (`equipo`, `modelo`, `marca`, `serie`).
  - Las OT **no crean ni registran equipos**: el inventario de Equipos se gestiona exclusivamente desde el mantenedor de Equipos. Si en la OT se ingresa un equipo que no existe, la OT se guarda igual con los datos escritos a mano (no se crea nada en `equipos`).

**Limpiado de código muerto (`backend/routes/ordenes.js`):**
- Eliminada la función sin uso `generarCodigoEquipo()`
- Eliminado `equipoId` de los destructuring de `req.body` en POST y PUT (ya no se usa)

**Nota:** No se requiere migración de base de datos. La columna `equipo_id` se mantiene (las OT antiguas conservan su valor; las nuevas quedan `NULL`). No se tocó `deploy/cloud` (pendiente de replicar el cambio de backend si se desea).

### Botones "Limpiar" en form OT solo visibles si hay datos

**Problema:** Al crear una OT nueva, los botones "Limpiar" de Avería/Actividad/Observaciones y de Insumos se mostraban siempre, aunque los campos estuvieran vacíos.

**Solución:** Ambos botones ahora solo se renderizan si hay contenido:

- `frontend/src/components/ordenes/OrdenFormAveria.jsx` — visible solo si `averia`, `actividad` u `observaciones` tienen texto
- `frontend/src/components/ordenes/OrdenFormInsumos.jsx` — visible solo si al menos un insumo tiene nombre (`insumos.some(i => i.nombre)`)

Solo frontend, idéntico en `deploy/cloud`.

### Fix: contacto principal duplicado en buscador "Buscar Contacto" de la OT

**Problema:** En el buscador de contacto por nombre o correo del form de OT, el contacto principal del cliente aparecía a veces dos veces en el dropdown.

**Causa:** `contactosDisponibles` en `frontend/src/components/ordenes/OrdenFormCliente.jsx` agregaba el contacto principal (`clienteSeleccionado.contacto_nombre`/`email`/`fono`/`cargo`) y además el campo concatenado `clienteSeleccionado.contactos` ya contiene el contacto principal (heredado de la migración a `clientes_contactos`), por lo que se mostraba duplicado.

**Solución:** Al construir `contactosDisponibles`, se filtran de los `extras` los contactos cuyo nombre **o** email coincida exactamente (case-insensitive) con el contacto principal. El principal se agrega una sola vez con flag `principal: true`.

Solo frontend, idéntico en `deploy/cloud`.

### Form OT con ancho de 900px (igual que nuevo cliente) + focus tenue en inputs y botones

**Cambios (solo frontend):**

1. **Ancho del form de OT** (`frontend/src/pages/OrdenTrabajo.jsx`): el contenedor del form de Nueva/Editar/Ver Orden cambió de `max-width: 720px` a `900px`, igual que el formulario de Nuevo Cliente (`.cf-wrap`).

2. **Focus tenue en inputs del form OT** (`frontend/src/styles/OrdenTrabajo.css`):
   - `.of-f input/select/textarea:focus`: antes `border-color: var(--primary)` (azul oscuro) + sombra 2px; ahora borde `#9AB8D9` + sombra sutil de 1px (`rgba(154,184,217,.35)`), sin outline
   - `.of-ins-item input:focus` y `.of-date input[type="date"]:focus`: agregado el mismo focus tenue (antes usaban el outline grueso azul del navegador al hacer clic en "Insumo 1" o en las fechas)

3. **Focus tenue en botones del form OT**: `.of-btn-a`, `.of-btn-p`, `.of-btn-c`, `.of-head-close` y `.of-ins-del` con `:focus-visible` ahora tienen `outline: none` y una sombra de 1px `rgba(154,184,217,.4)` (antes outline grueso del navegador al resaltar con Tab/clic).

### Color fijo en botones del header y "Nuevo Cliente" (sin cambio de color en hover)

**Problema:** Al pasar el mouse, los botones de navegación del header (`.logout-btn`) se pintaban de rojo completo, y el botón "Nuevo Cliente" (`.btn-nuevo-cliente`) cambiaba su fondo azul a un azul más claro (`#1d4ed8`). El usuario quiere los colores fijos, como el botón "Guardar Cliente" (solo se oscurece levemente).

**Cambios (`frontend/src/styles/index.css`):**
- `.logout-btn:hover`: reemplazado `background: var(--danger); color: white` por `filter: brightness(0.92)` — el botón mantiene su color y solo se oscurece apenas
- `.btn-nuevo-cliente:hover`: reemplazado `background: #1d4ed8; color: white !important` por `filter: brightness(0.92)`

**Además:** el color del botón "Orden de Compra" ahora es azul marino `#1E40AF` (antes púrpura `#8B5CF6` que se confundía con "Orden de Trabajo" `#6366F1`). Aplicado en todos los headers (Clientes, Equipos, Usuarios, Informes, Cotizaciones, Orden Compra, OT) y en las tarjetas de Home (que usaban `#6366F1`).

### Botones azules uniformes: "Nueva Orden", "Limpiar" (Equipos) y hover sin elevación

**Cambios (`frontend/src/styles/index.css` y `Equipos.css`):**
- `.main-btn` (botón "Nueva Orden" y otros azules): `background` de `var(--gradient)` (degradado) a `var(--primary)` (azul sólido), igual que "Nuevo Cliente"
- `.main-btn:hover`: eliminado `transform: translateY(-1px)` y el cambio de `box-shadow` (efecto de elevación), ahora solo `filter: brightness(0.92)`
- `.btn-limpiar-equipos:hover`: reemplazado `background: #1d4ed8` (cambio de color) por `filter: brightness(0.92)`

---

## Fecha: 2026-08-04

### Auditoría y limpieza de dead code

**Problema:** Había archivos, scripts, SQL y endpoints backend sin ningún uso en el sistema.

**Archivos eliminados:**
- `backend/crear_db.sql` — esquema viejo UTF-16 corrupto
- `backend/migrar_clientes.sql`, `backend/migrar_equipos.sql` — migraciones antiguas sin uso
- `scripts/crear_clientes.js`, `scripts/crear_equipos.js`, `scripts/insert_equipos.js` — seeds duplicados del seed-test-data
- `scripts/crear-admin-local.js`, `scripts/agregar_insumos.js`, `scripts/test_insert.js` — scripts de prueba
- `scripts/update_pass.js`, `scripts/verificar_insumos.js` — sin uso
- `scripts/migrar_contactos.sql`, `scripts/migrar_actividad_observaciones.sql` — migraciones ya aplicadas en BD
- `scripts/seed_neon.sql`, `scripts/seed_neon_no_transaction.sql` — seeds PostgreSQL obsoletos (viven en deploy/cloud)
- `frontend/src/components/clientes/ModalReasignarEquipos.jsx` — componente reemplazado por el flujo de reasignación en Clientes.jsx

**Endpoints muertos eliminados (`backend/routes/`):**
- `GET /api/equipos/next-codigo` y helper `generarCodigo()` (el de clientes se mantiene porque `POST /` lo usa)
- `GET /api/clientes/next-codigo`
- `PUT /api/clientes/:id/desactivar`
- `GET /api/ordenes/verificar/:numeroOrden`

**Defaults hardcodeados MySQL eliminados (todo sale de `.env`):**
- `backend/config/db.js`, `backend/crear-admin.js`, `scripts/seed-test-data.js` — sin host/port/user/password/database hardcodeados

**Refactor identidad de equipos desacoplada:**
- `EquipoFormulario.jsx` ahora solo maneja identidad (codigo, equipo, marca, modelo, serie); los datos de servicio (insumos, contador, avería, actividad, observaciones, cliente_id) viven en `ordenes_trabajo`
- Simplificados `OrdenFormEquipo.jsx`, `OrdenFormCliente.jsx`, `ClienteExpandido.jsx`, `EquipoTabla.jsx`, `EquipoCard.jsx`, `FiltrosEquipo.jsx`, `Clientes.jsx`, `Equipos.jsx`

### `numero_orden` inmutable y autogenerado

**Problema:** El número de orden se podía modificar manualmente al editar una OT.

**Cambios backend (`backend/routes/ordenes.js`):**
- Nuevo helper `calcularSiguienteNumero()` — base 2800, `Math.max(parseInt(partes[2], 10) + 1, 2800)`
- `GET /siguiente-numero` lo usa
- `POST /` genera el número server-side dentro de la transacción (ignora `numeroOrden` del body, re-check único con rollback)
- `PUT /:id` ya no toca `numero_orden`

**Cambios frontend:**
- Eliminados `errorNumeroOrden`, `verificarNumeroOrden` y el endpoint `/verificar`
- `OrdenFormDatos.jsx`: campo N° de Orden siempre `<input disabled>` ("El número de orden se asigna automáticamente")

### Editar OT: volver a poder re-seleccionar cliente y equipo

**Problema:** Al editar una OT, el cliente y el equipo estaban fijos (chips), sin buscadores para cambiarlos.

**Archivo modificado:** `frontend/src/pages/OrdenTrabajo.jsx`

**Cambio en `editarOrden()`:** `clienteFijo = false` y `equipoFijo = false` → se muestran los buscadores de cliente (nombre/RUT) y equipo (serie/modelo) para re-seleccionar. `verOrden()` mantiene los chips en solo lectura.

### `backend/crear_tablas.sql` sincronizado con el esquema real

**Problema:** El script de creación de tablas no reflejaba las constraints del esquema MySQL actual.

**Cambios:**
- `clientes.razon_social NOT NULL`
- `ordenes_trabajo.cliente`, `tecnico_asignado`, `equipo`, `modelo`, `marca` ahora `NOT NULL`
- `usuarios.usuario NOT NULL UNIQUE`, `usuarios.password NOT NULL`
- Todas las tablas: `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`

**Verificación:** aplicado en BD scratch y las 6 tablas coinciden 100% con el esquema vivo (ignorando whitespace/collation).

---

## Fecha: 2026-07-16 (Sesión 3)

### Mostrar actividad/observaciones en módulo Equipos

**Problema:** Los campos actividad y observaciones no se mostraban en el mantenedor de Equipos.

**Archivos modificados:**
- `frontend/src/components/equipos/EquipoTabla.jsx` — Fila expandida muestra actividad/observaciones al hacer clic en chevron
- `frontend/src/components/equipos/EquipoCard.jsx` — Tarjetas móvil muestran actividad y observaciones

### Mostrar actividad/observaciones en tabla OT de Clientes

**Problema:** La tabla de OT dentro del módulo Clientes no mostraba actividad/observaciones.

**Archivo modificado:** `frontend/src/components/clientes/ClienteExpandido.jsx` — Agregadas columnas "Actividad" y "Observaciones" a la tabla de OT

### Fix INSERT equipos desde OT — actividad/observaciones

**Problema:** Al crear una OT nueva con un equipo nuevo, el INSERT en `equipos` no incluía actividad ni observaciones. El PUT cascade sí los guardaba, pero el POST (creación) no.

**Causa:** El `INSERT INTO equipos` en el POST de `ordenes.js` solo incluía 21 columnas (hasta `averia`), faltando `actividad` y `observaciones`.

**Solución:** Agregados `actividad` y `observaciones` al INSERT de equipos en POST y PUT de `backend/routes/ordenes.js` (ambas ramas: MySQL y PostgreSQL).

**Archivos:**
- `backend/routes/ordenes.js` (main) — MySQL: `INSERT INTO equipos (... averia, actividad, observaciones) VALUES (?, ?, ..., ?, ?)`
- `backend/routes/ordenes.js` (deploy/cloud) — PostgreSQL: `$22, $23` params

### Agregar Contador Páginas OUT al formulario de OT

**Problema:** El campo "Contador Páginas OUT" no aparecía al crear/editar una OT en "Datos del Equipo".

**Solución:** Agregado campo `input type="number"` junto a "Nivel de Tinta" en la grilla del formulario.

**Archivo:** `frontend/src/components/ordenes/OrdenFormEquipo.jsx`

### Fix pool MySQL — keepalive y connectTimeout

**Problema:** Se perdía conexión con la base de datos MySQL cuando la conexión quedaba idle.

**Causa:** El pool MySQL no tenía configurado keepalive, así que MySQL cerraba conexiones inactivas tras su timeout (8h por defecto).

**Solución:** Agregados `enableKeepAlive: true`, `keepAliveInitialDelay: 0`, `connectTimeout: 10000` al pool.

**Archivo:** `backend/config/db.js` (solo rama `main` — MySQL)

---

## Fecha: 2026-07-16 (Sesión 2)

### Fix cascade UPDATE equipos desde OT — actividad/observaciones

**Problema:** Al editar una OT que tiene actividad y observaciones, esos campos no se actualizaban en el registro maestro del equipo (tabla `equipos`).

**Causa:** El `PUT /api/ordenes/:id` ejecuta un `UPDATE equipos SET ...` para cascada de cambios, pero las columnas `actividad` y `observaciones` no estaban incluidas en ese query.

**Solución:** Agregados `actividad = ?` y `observaciones = ?` al `UPDATE` cascade en `backend/routes/ordenes.js`.

**Archivo:** `backend/routes/ordenes.js` (línea ~163)

### Fix doble confirm al eliminar OT

**Problema:** Al eliminar una orden de trabajo, se mostraban dos diálogos de confirmación (confirm + alert).

**Solución:** Eliminado el `alert("Orden eliminada exitosamente")` redundante. La lista se refresca automáticamente.

**Archivo:** `frontend/src/pages/OrdenTrabajo.jsx`

---

## Fecha: 2026-07-16

### Limpieza de seguridad y optimización de código

**Cambios de seguridad (HIGH):**
- Eliminada cadena de conexión Neon hardcodeada en `backend/crear-admin.js` (ahora usa `process.env.DATABASE_URL`)
- 8 scripts utilitarios migrados de passwords hardcodeadas (`"6498"`) a `process.env.DB_PASSWORD` via dotenv
- Eliminado fallback JWT débil `"clave_secreta"` en `backend/routes/auth.js` y `backend/middleware/authMiddleware.js`
- Corregido typo `"sbackend"` → `"hls-backend"` en `backend/package.json`

**Archivos backend modificados:**
- `backend/crear-admin.js` — eliminado connection string Neon
- `backend/middleware/authMiddleware.js` — eliminado fallback JWT
- `backend/routes/auth.js` — eliminado fallback JWT
- `backend/package.json` — fix nombre

**Scripts migrados a usar dotenv:**
- `scripts/crear_clientes.js`, `scripts/insert_equipos.js`, `scripts/crear_equipos.js`
- `scripts/crear-admin-local.js`, `scripts/agregar_insumos.js`, `scripts/test_insert.js`
- `scripts/verificar_insumos.js`, `scripts/update_pass.js`

---

### Eliminación de dead code (MEDIUM)

**Archivos eliminados:**
- `frontend/src/components/CustomSelect.jsx` — nunca importado por ningún archivo
- `frontend/src/components/clientes/OTAsociadas.jsx` — componente huérfano (ClienteExpandido renderiza su propia tabla)
- `backend/test2.js` — script de test sin uso

**Funciones muertas eliminadas:**
- `volverHome()` en `Informes.jsx` y `Cotizaciones.jsx` — definida pero nunca llamada

---

### Utilities compartidos (MEDIUM)

**Nuevo archivo:** `frontend/src/utils/helpers.js`
- `toUpper(v)` — convierte a mayúsculas con null safety
- `validarRUT(rut)` — validación de RUT chileno (módulo 11)
- `parseToken()` — extrae usuario y rol del JWT almacenado

**Eliminados:**
- 7 copias idénticas de `toUpper` en `OrdenTrabajo.jsx` → 1 import compartido
- `validarRUT()` duplicada en `Clientes.jsx` → import desde helpers
- JWT parsing duplicado en `Clientes.jsx` y `GestionUsuarios.jsx` → `parseToken()`

---

### Fix actualizarSucursal — deep copy

**Problema:** `actualizarSucursal` mutaba objetos anidados del state (shallow copy del array pero no de los objetos internos).

**Solución:** Usar `.map()` para crear objetos nuevos:
```javascript
const nuevas = sucursales.map((s, i) => i === idx ? { ...s, [campo]: valor } : s);
```

**Archivos:** `Clientes.jsx` (ya aplicado anteriormente)

---

### Paginación unificada a 4 items

**Problema:** Clientes y Equipos usaban 5 items por página, mientras que OT y ClienteExpandido usaban 4.

**Solución:** Unificado a 4 items en todos los módulos.

**Archivos modificados:**
- `frontend/src/pages/Clientes.jsx` — `clientesPorPagina = 4` (antes 5)
- `frontend/src/pages/Equipos.jsx` — `equiposPorPagina = 4` (antes 5)

---

### Fix limit inconsistente en fetchOrdenes

**Problema:** `Clientes.jsx` usaba `limit=1000` mientras que `OrdenTrabajo.jsx` usaba `limit=10000`.

**Solución:** Unificado a `limit=10000` en ambos.

**Archivo:** `frontend/src/pages/Clientes.jsx`

---

### Scripts utilitarios reorganizados

**8 scripts movidos** de `backend/` a `scripts/`:
- `crear_clientes.js`, `insert_equipos.js`, `crear_equipos.js`
- `crear-admin-local.js`, `agregar_insumos.js`, `test_insert.js`
- `verificar_insumos.js`, `update_pass.js`

Cada script actualizado con `dotenv.config({ path: new URL('../backend/.env', import.meta.url).pathname })` para encontrar `.env` desde la nueva ubicación.

---

### Refactor: Formulario de cliente compartido

**Problema:** El formulario de cliente (empresa, contacto, sucursales, validación RUT) estaba duplicado casi idéntico en:
1. `frontend/src/pages/Clientes.jsx` — form completo del módulo
2. `frontend/src/components/ordenes/OrdenFormCliente.jsx` — modal dentro de la OT

Ambos tenían: `validarRUT()`, `actualizarSucursal()`, lógica de RUT con formato, sucursales, mismos campos.

**Solución:** Extraído a componente compartido `ClienteFormulario.jsx`.

**Nuevo archivo:** `frontend/src/components/clientes/ClienteFormulario.jsx`

**Props:**
- `clienteEditando` — null para crear, objeto para editar
- `clientes` — lista de clientes existentes (para generar código)
- `onSave(clienteData, resetFormulario)` — callback al guardar
- `onCancel()` — callback al cancelar
- `titulo` — opcional, título del form

**Estado interno manejado por el componente:**
- `nuevoCliente` — campos del form
- `sucursales` — array de direcciones
- `sucursalesVisibles` — cuántas mostrar
- `rutError` — error de validación RUT

**Archivos modificados:**
- `frontend/src/pages/Clientes.jsx` — de 544 a 150 líneas (-72%), usa `<ClienteFormulario>`
- `frontend/src/components/ordenes/OrdenFormCliente.jsx` — de 566 a 200 líneas (-65%), usa `<ClienteFormulario>` en modal

**Migración SQL aplicada:**
- Columna `observaciones` agregada a tabla `ordenes_trabajo` (faltaba en DB local)

---

## Fecha: 2026-06-09

### Botón Nueva Orden en lista OT
- Agregado botón "Nueva Orden" (clase `main-btn`) en el header de la lista de órdenes de trabajo
- Usa la función `onNueva` que ya estaba definida pero no se usaba

**Archivo modificado:** `frontend/src/components/ordenes/OrdenLista.jsx`

### Creación de cliente desde formulario OT
- Agregado botón "Nuevo" al lado del buscador de clientes en el formulario de OT
- Abre un modal con el formulario completo de creación de cliente (mismo diseño que Clientes.jsx)
- Secciones: Datos Empresa (fondo azul), Datos Contacto (fondo verde), Sucursales (fondo gris)
- Validación de RUT chileno (módulo 11)
- Auto-selecciona el cliente creado al guardar

**Archivo modificado:** `frontend/src/components/ordenes/OrdenFormCliente.jsx`
**Prop agregada:** `clientes` (para calcular código correlativo)

### Correlativo OT desde 2800
- El número de orden ahora arranca desde `OT-{año}-02800` (5 dígitos)
- Si ya existen órdenes > 02800, continúa desde la siguiente

**Archivo modificado:** `backend/routes/ordenes.js`
- línea 42: `let siguiente = 1` → `let siguiente = 2800`
- línea 45: `parseInt(partes[2], 10) + 1` → `Math.max(parseInt(partes[2], 10) + 1, 2800)`
- línea 47: `padStart(4, "0")` → `padStart(5, "0")`

### Botón Nuevo cliente solo en nueva orden (no en editar)
- El botón "Nuevo" para crear cliente ahora solo se muestra cuando se está creando una nueva OT
- Se oculta al editar una orden existente

**Archivos modificados:**
- `frontend/src/pages/OrdenTrabajo.jsx` — se pasa prop `esEdicion={!!editingId}`
- `frontend/src/components/ordenes/OrdenFormCliente.jsx` — se oculta el botón con `{!esEdicion && ( ... )}`

### Campo Nivel de Tinta en Datos del Equipo
- Agregado campo "Nivel de Tinta" en el formulario de OT, sección Datos del Equipo
- Funciona tanto en crear como en editar (carga desde `orden.nivel_tinta`)

**Archivo modificado:** `frontend/src/components/ordenes/OrdenFormEquipo.jsx`

### Cómo revertir
Para volver al comportamiento anterior:
1. **backend/routes/ordenes.js**:
   - Cambiar `let siguiente = 2800` → `let siguiente = 1`
   - Cambiar `Math.max(parseInt(partes[2], 10) + 1, 2800)` → `parseInt(partes[2], 10) + 1`
   - Cambiar `padStart(5, "0")` → `padStart(4, "0")`
2. **frontend/src/components/ordenes/OrdenFormCliente.jsx**: Eliminar el botón "Nuevo" y el modal (desde `{/* Modal Nuevo Cliente */}` hasta su cierre)
3. **frontend/src/components/ordenes/OrdenLista.jsx**: Eliminar el botón "Nueva Orden" del `table-header-actions`
4. **frontend/src/pages/OrdenTrabajo.jsx**: Quitar la prop `clientes={clientes}` de `<OrdenFormCliente>`

---

## Fecha: 2026-05-25

### Limpieza Login
- Se quitó el ícono (logo) del header del login
- Se quitó el año del footer, dejando solo "© HLS Soluciones Informáticas"

**Archivo modificado:** `frontend/src/pages/Login.jsx`

---

## Fecha: 2026-05-04

### 🎨 Diseño Responsive (NUEVO)
Se implementó diseño responsive completo para todas las vistas del sistema, adaptándose a:
- **Pantallas grandes (1600px+)**: Layout expandido con grid de 3 columnas en Home
- **Notebook/Desktop (1280px)**: Labels de navegación ocultos, solo iconos visibles
- **Tablet landscape (1024px)**: Grid de 2 columnas en Home, formularios adaptados
- **Tablet portrait / Celular grande (768px)**: 
  - Header con navegación apilada verticalmente
  - Tarjetas de Home en columna única con layout horizontal
  - Tablas reemplazadas por vista de tarjetas (cards)
  - Formularios en 1 columna
  - Botones de acción a ancho completo
- **Celular (480px)**: Padding reducido, fuentes más pequeñas, grids simples

#### CSS (`index.css`)
- **8 media queries** para 5 breakpoints (1600px+, 1280px, 1024px, 768px, 480px)
- Clases responsive nuevas:
  - `nav-buttons` + `btn-label`: Navegación que oculta texto en pantallas pequeñas
  - `cards-table`: Vista de tarjetas que reemplaza tablas en móvil
  - `data-card`, `data-card-header`, `data-card-row`, `data-card-label`, `data-card-value`
  - `form-row-2`, `form-row-3`, `form-row-4`, `form-row-6`: Grids responsivos
  - `page-content`: Contenido de página con padding adaptativo
  - `home-grid`: Grid del Home responsive

#### Home.jsx
- Grid de tarjetas con `home-grid`: 3 cols → 2 cols → 1 col
- En móvil: tarjetas con layout horizontal (icono a la izquierda)

#### Headers (todas las páginas)
- Botones de navegación con `nav-buttons` + `span.btn-label`
- En pantallas ≤1280px: solo se muestran iconos
- En pantallas ≤768px: navegación centrada y apilada

#### Formularios
- **Clientes.jsx**: Grid de sucursales con `auto-fit` (ya no 6 columnas fijas), formulario en 1 columna en móvil
- **Equipos.jsx**: Insumos con `auto-fit`, padding adaptativo
- **OrdenTrabajo.jsx**: Todos los grids con `repeat(auto-fit, minmax(...))`, padding con `clamp()`
- **GestionUsuarios.jsx**: Formulario en 1 columna en pantallas pequeñas

#### Tablas → Tarjetas en Móvil
Vista de tarjetas (`cards-table`) implementada en:
- **Clientes.jsx**: Muestra razón social, RUT, teléfono, ciudad, contacto
- **Equipos.jsx**: Muestra equipo, marca/modelo, serie, contador, tintas, avería
- **GestionUsuarios.jsx**: Muestra usuario, rol, correo, estado, fecha
- **OrdenTrabajo.jsx**: Muestra N° orden, fecha, cliente, equipo, técnico, garantía

---

### 1. Corrección de errores JSX
- **OrdenTrabajo.jsx**: Se corrigió error de JSX por etiqueta `</div>` extra en la línea 1376.
- **Equipos.jsx**: Se corrigió error de JSX por estructura incorrecta de comentarios y etiquetas mal cerradas.

### 2. Simplificación del Buscador de Equipos
- **OrdenTrabajo.jsx**:
  - Se simplificó el buscador de "Datos del Equipo" para que busque únicamente por **serie**.
  - Se eliminaron los campos de búsqueda por equipo, marca y modelo.
  - Se eliminaron las variables de estado: `busquedaEquipo`, `busquedaMarca`, `busquedaModelo`.
  - Se actualizó la función `equiposFiltrados` para filtrar solo por serie.
  - Se actualizó `seleccionarEquipo` para que solo establezca `busquedaSerie`.

- **Equipos.jsx**:
  - Se simplificó el buscador en el listado para que busque únicamente por **serie**.
  - Se eliminó el campo de búsqueda por marca (`busquedaMarca`).
  - Se actualizó `equiposFiltrados` para filtrar solo por serie.
  - Se hizo el buscador siempre visible (se eliminó la sección colapsable).
  - Se cambió la etiqueta a "Buscar por Serie" con placeholder "Ingrese número de serie...".

### 3. Formulario de Nuevo Equipo (Equipos.jsx)
- **Revertido**: Se restauró el formulario completo con todos los campos:
  - Equipo, Marca, Modelo, Serie
  - Contador Páginas, Nivel Tintas
  - Insumos (1-12)
  - Avería/Falla/Incidencia

### 4. Formulario de Orden de Trabajo (OrdenTrabajo.jsx)
- Se comentaron los campos adicionales (Contador Páginas OUT, Nivel Tinta) con la nota "CAMPOS ADICIONALES COMENTADOS - Descomentar para restaurar".
- Se mantienen visibles: Equipo, Marca, Modelo, Serie, y la sección de Insumos.

### Estructura del Buscador en OrdenTrabajo.jsx
- El buscador por serie está posicionado en la sección "Datos del Equipo".
- Al hacer clic en un equipo del dropdown, se llenan automáticamente los campos: equipo, marca, modelo, serie, contador, nivel tinta e insumos.

---

## Archivos Modificados (Responsive)
1. `frontend/src/index.css` (+604 líneas)
2. `frontend/src/pages/Home.jsx`
3. `frontend/src/pages/Clientes.jsx`
4. `frontend/src/pages/Equipos.jsx`
5. `frontend/src/pages/GestionUsuarios.jsx`
6. `frontend/src/pages/OrdenTrabajo.jsx`
7. `frontend/src/pages/Informes.jsx`
8. `frontend/src/pages/Cotizaciones.jsx`

## Archivos Modificados (Anteriores)
1. `frontend/src/pages/OrdenTrabajo.jsx`
2. `frontend/src/pages/Equipos.jsx`

## Notas
- Los campos comentados en `OrdenTrabajo.jsx` pueden restaurarse descomentando el bloque indicado.
- El buscador por serie es ahora el estándar en ambos componentes.
- Las vistas responsive se probaron para: 1600px+, 1280px, 1024px, 768px, 480px.

---

## Fecha: 2026-07-16 (Sesión 4)

### Badges "Cliente inactivo" y "Equipo asignado a otro cliente" en formulario OT

**Problema:** Al editar una OT cuyo cliente fue eliminado (soft delete) o cuyo equipo fue reasignado a otro cliente, no había indicador visual. El formulario mostraba los campos vacíos sin explicación.

**Solución:** Badges naranjas de advertencia en el formulario de OT.

**Archivos modificados:**
1. `frontend/src/pages/OrdenTrabajo.jsx`
2. `frontend/src/components/ordenes/OrdenFormCliente.jsx`
3. `frontend/src/components/ordenes/OrdenFormEquipo.jsx`

**Cambios:**

#### OrdenTrabajo.jsx
- **Nuevos estados**: `clienteInactivo` (boolean) y `equipoOtroCliente` (boolean)
- **Detección en `editarOrden()`**: Si `orden.cliente_id` existe pero el cliente no se encuentra en la lista de clientes activos → `clienteInactivo = true`
- **Detección en carga de equipo**: Si `eq.cliente_id !== orden.cliente_id` → `equipoOtroCliente = true` (tanto en carga fresca API como fallback local)
- **Al seleccionar equipo**: Se recalcula `equipoOtroCliente` comparando `equipo.cliente_id` con `clienteSeleccionado.id`
- **Reset**: Se resetean ambos flags al crear nueva OT, seleccionar nuevo cliente, o resetear formulario
- **Props**: Se pasan `clienteInactivo` y `equipoOtroCliente` a `OrdenFormCliente` y `OrdenFormEquipo`

#### OrdenFormCliente.jsx
- **Nuevo prop**: `clienteInactivo` (default: false)
- **Badge naranja** (fondo `#F97316`): "⚠ Cliente inactivo" — se muestra cuando `clienteInactivo` es true
- **Badge verde** (éxito): "✓ Seleccionado" — se muestra solo cuando `clienteSeleccionado` existe Y `clienteInactivo` es false

#### OrdenFormEquipo.jsx
- **Nuevo prop**: `equipoOtroCliente` (default: false)
- **Badge naranja** (fondo `#FFF3E0`, texto `#F97316`): "⚠ Equipo asignado a otro cliente: {equipo} - {marca} {modelo}"
- **Badge verde** (éxito): "✓ Seleccionado: ..." — se muestra solo cuando `equipoSeleccionado` existe Y `equipoOtroCliente` es false

**Lógica de detección:**
- **Cliente inactivo**: `orden.cliente_id` tiene valor pero `clientes.find(c => c.id === orden.cliente_id)` retorna undefined (porque `clientes` solo contiene registros con `activo = 1`)
- **Equipo de otro cliente**: `equipo.cliente_id !== orden.cliente_id` — el equipo fue reasignado (soft delete + crear nueva OT con el mismo equipo)

---

## Fecha: 2026-07-17 (Sesión 5)

### Fix limpieza de datos al cambiar cliente en OT

**Problema:** Al editar una OT con cliente/equipo inactivo y asignar un nuevo cliente, los campos de avería/actividad/observaciones quedaban con los datos viejos del equipo anterior.

**Archivo modificado:** `frontend/src/pages/OrdenTrabajo.jsx`

**Cambios en `seleccionarCliente()`:**
- Se limpia `equipoSeleccionado = null`, `busquedaCodigo = ""`, `busquedaSerie = ""`
- Se limpian campos del formulario: equipo, modelo, marca, serie, nivelTinta, contadorPagOut
- **NUEVO**: Se limpian también `averia = ""`, `actividad = ""`, `observaciones = ""`

### Botón "+ Nuevo" solo visible cuando no tiene cliente/equipo

**Problema:** Los botones "+ Nuevo" para crear cliente y equipo aparecían siempre al editar OT, incluso cuando ya había un cliente/equipo asignado.

**Archivos modificados:**
- `frontend/src/components/ordenes/OrdenFormCliente.jsx`
- `frontend/src/components/ordenes/OrdenFormEquipo.jsx`
- `frontend/src/pages/OrdenTrabajo.jsx`

**Cambios:**
- **Cliente**: `!fromClientes && !esEdicion` → `!fromClientes && (!esEdicion || !clienteSeleccionado)` — se oculta solo si ya tiene cliente seleccionado
- **Equipo**: `clienteSeleccionado && !fromClientes` → `clienteSeleccionado && !fromClientes && (!esEdicion || !equipoSeleccionado || equipoOtroCliente)` — se oculta solo si ya tiene equipo seleccionado
- Se pasó prop `esEdicion={!!editingId}` a `OrdenFormEquipo`

### Cargar avería/actividad/observaciones al crear equipo nuevo desde OT

**Problema:** Al crear un equipo nuevo desde el modal "+ Nuevo" en OT, los campos avería/actividad/observaciones del modal no se copiaban al formulario de la OT.

**Archivo modificado:** `frontend/src/components/ordenes/OrdenFormEquipo.jsx`

**Cambio en `guardarNuevoEquipo()`:**
- Después de `seleccionarEquipo(creado)`, se agrega `setNuevaOrden` que copia `averia`, `actividad` y `observaciones` del equipo creado al formulario

### Rate limiter subido a 500 requests/15min

**Archivo modificado:** `backend/server.js`

**Cambio:** `max: 100` → `max: 500` en el rate limiter general (el de login se mantiene en 100)

---

## Fecha: 2026-07-28

### Eliminado fallback password hardcodeado en db.js

**Problema:** El pool de MySQL tenía un fallback con la password hardcodeada `"6498"` en el código fuente.

**Solución:** Eliminado el fallback `|| "6498"`, ahora la password solo se obtiene del `.env` mediante `process.env.DB_PASSWORD`.

**Archivo modificado:** `backend/config/db.js`

**Impacto:** Si no hay `.env` con `DB_PASSWORD`, la conexión falla (no más password por defecto).

### Fix scroll horizontal en tabla OT

**Problema:** Al navegar a la página 2 de la lista de Órdenes de Trabajo, aparecía un scroll horizontal en la tabla porque algunos datos eran más largos y expandían la tabla.

**Causa:** Sin `table-layout: fixed`, los navegadores ignoran `max-width` en celdas `td`, permitiendo que el contenido largo agrande la tabla.

**Soluciones:**
1. `scrollbar-gutter: stable` en `<html>` — evita layout shift al aparecer/desaparecer el scroll vertical del navegador
2. `table-layout: fixed` + anchos explícitos en `<th>` — la tabla respeta los anchos definidos y el texto se trunca con `...`

**Archivos modificados:**
- `frontend/src/styles/index.css` — `scrollbar-gutter: stable`
- `frontend/src/styles/OrdenTrabajo.css` — `table{table-layout:fixed}`
- `frontend/src/components/ordenes/OrdenLista.jsx` — anchors fijos en `<th>`
- `frontend/src/pages/OrdenTrabajo.jsx` — wrapper `.ot-list-wrap` para scoped table-layout
- `frontend/src/styles/OrdenTrabajo.css` — `.ot-list-wrap table` scoped (evita afectar Clientes/Equipos)
- `frontend/src/styles/index.css` — `.action-buttons` con `flex-wrap: wrap` para evitar scroll horizontal
- Mostrar solo número (02800) en vez de OT-2026-02800 en todas las vistas
