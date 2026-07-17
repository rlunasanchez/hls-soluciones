# Registro de Cambios - HLS Soluciones

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
