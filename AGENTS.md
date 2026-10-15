# HLS Soluciones — guía del proyecto

Sistema de gestión de soporte técnico (empresa chilena de servicio técnico de impresoras). Esta guía es lo primero que debe leer quien retome el proyecto (persona o Claude). **La memoria de Claude vive en cada PC y no viaja con el repositorio: lo que no esté escrito aquí o en `CAMBIOS.md` se pierde al cambiar de equipo.**

Idioma de trabajo: **español**. Respuestas directas y breves; hacer solo lo que se pide (ver "Cómo trabajar con el dueño").

## 1. Módulos y estado

| Módulo | Estado |
|---|---|
| Clientes (con Contactos y Direcciones vinculados) | Completo |
| Contactos y Direcciones (catálogos propios) | Completo |
| Equipos (solo identidad: equipo, marca, modelo, serie) | Completo |
| Órdenes de Trabajo (OT) | Completo (PDF de Orden de Servicio, adjuntos imagen/PDF) |
| Cotizaciones (PDF con folio) | Funciona; **falta adaptarla** a los checks "En la OT" y a los botones Editar/Registrar de contactos/direcciones |
| Usuarios (admin / técnico) | Completo |
| Informes y Orden de Compra | **Páginas vacías** (ver `BASE_DATOS_ANTIGUA.md` para el modelo del sistema original) |

## 2. Ramas y despliegue (leer antes de hacer `git push`)

Solo existen **dos ramas**:

| Rama | Base de datos | Dónde se publica |
|---|---|---|
| `main` | MySQL local (`mysql2`) | **Vercel: es la rama de producción** → un push a `main` publica el frontend en https://hls-soluciones.vercel.app |
| `deploy/cloud` | PostgreSQL en Neon (`pg`) | **Render** despliega esta rama (backend) en https://hls-soluciones.onrender.com |

`deploy/cloud` = `main` + backend en sintaxis PostgreSQL. El frontend es idéntico en ambas.

**Orden para publicar un cambio con backend nuevo:** 1) migración SQL en Neon (la corre el dueño en el SQL Editor de Neon), 2) push de `deploy/cloud` (Render), 3) push de `main` (Vercel). Si el frontend nuevo llega antes que el backend, la web da **404** en las rutas nuevas (pasó el 13-oct-2026).

**Llevar cambios de `main` a `deploy/cloud`:** `git merge main` en `deploy/cloud`. Los archivos de `backend/` que difieren entre ramas (siempre hay que portarlos a mano, un merge limpio NO garantiza que queden bien): `config/db.js`, `package.json`, `routes/*.js`. Reglas de traducción MySQL → PostgreSQL: `?` → `$1, $2…` (recontar al agregar columnas), `const [rows] = await pool.query` → `result.rows`, `insertId` → `RETURNING id`, `pool.getConnection()` → `pool.connect()` con `BEGIN/COMMIT` manual, `GROUP_CONCAT` → `STRING_AGG`, `IFNULL` → `COALESCE`, `INSERT IGNORE` → `ON CONFLICT DO NOTHING`, `IN (?)` → `= ANY($1::int[])`, `UNSIGNED` → `INTEGER`.

**Probar un cambio de backend PostgreSQL antes de subirlo:** levantar un PostgreSQL real con el paquete npm `embedded-postgres` (iniciarlo con `initdbFlags: ['--encoding=UTF8','--locale=C']`), crear el esquema desde `backend/crear_tablas.sql` convertido a PostgreSQL (ojo: `a_ot` debe ser `SMALLINT`, no `BOOLEAN`), arrancar `server.js` con `DATABASE_URL` y `JWT_SECRET` de prueba, y llamar a las rutas con un token firmado con ese secreto. El backend local usa el puerto 5001 (el del dueño): para la prueba, redirigir el puerto sin tocar el código. El 13-oct-2026 se hicieron 23 pruebas así (clientes, vínculos, contactos, direcciones, OT, cotizaciones).

## 3. Arquitectura

- **Backend:** Node + Express, puerto **5001**. `server.js` registra `/api/auth|equipos|contactos|direcciones|clientes|ordenes|cotizaciones`. JWT (`JWT_SECRET` obligatorio, sin valor por defecto). `middleware/authMiddleware.js` exporta `authMiddleware` y `adminOnly`. Rate limiter general 500 por 15 min. CORS para localhost 5173/5174/3000 y Vercel.
- **Frontend:** React 18 + Vite, puerto **5173**. `services/api.js` (axios + invalidación de caché), `services/cache.js` (TTL 60 s para listados). Estilos en `src/styles/` con variables CSS (`--primary: #0C4A8C`, `--warning`, `--success`…); no usar colores fijos.
- **Variables de entorno (`backend/.env`, no se sube):** `DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME JWT_SECRET ADMIN_PASSWORD ADMIN_EMAIL`. En Render: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_URL`. En Vercel: `VITE_API_URL`.
- **Crear el primer admin:** `node backend/crear-admin.js` (usa el `.env`).
- **Arrancar en local:** `node server.js` en `backend/` (no se recarga solo; `npm run dev` usa `--watch`) y `npm run dev` en `frontend/`. Base nueva: `mysql … < backend/crear_tablas.sql`. Guía para otro PC: `CONTINUAR_EN_OTRO_PC.md`.

### Archivos clave del frontend
- `pages/` una por módulo (`Clientes`, `Contactos`, `Direcciones`, `Equipos`, `OrdenTrabajo`, `Cotizaciones`, `GestionUsuarios`, `Home`, `Login`, `Informes`, `OrdenCompra`).
- `components/clientes/ClienteFormulario.jsx` (ficha de 3 columnas: cliente | contactos | direcciones) y `VinculosCliente.jsx` (tabla de vínculos con check "En la OT").
- `components/ordenes/OrdenFormCliente.jsx` (cliente, contacto, dirección, aviso "ya no vinculado", Adjunto, Información Interna), `OrdenFormEquipo.jsx`, `OrdenFormInsumos.jsx`, `OrdenFormAveria.jsx`, `OrdenFormDatos.jsx`.
- `components/ordenes/OrdenAdjuntos.jsx` (apartado Adjunto de la OT: archivos, menú y visor) y `components/ordenes/useClienteOT.jsx` (hook: ver / editar / registrar el cliente desde la OT con sus modales). `OrdenFormCliente.jsx` los usa; **no volver a meter esa lógica dentro de un archivo grande**.
- `hooks/useOrdenesListado.js` (listado de OT: carga, filtros y paginación).
- `utils/ordenFormato.js` (orden guardada → estado del formulario, `ordenVacia`, equipo e insumos) y `utils/validarOrden.js` (validaciones previas a guardar y payload). `OrdenTrabajo.jsx` abre una orden con una sola función `cargarOrden(orden, "editar" | "ver")`.
- `components/comunes/CampoCatalogo.jsx` (buscador de contacto/dirección con Editar/Registrar/ "(ya es de CL-X)"), `ModalEditarCatalogo.jsx`, `BotonQuitar.jsx`, `AccionesFicha.jsx`.
- `hooks/usePaginacion.js` (`usePaginaPersistente`, `useClampPagina`), `useBusquedaApi.js`, `useGuardar.js` (evita doble envío).
- `utils/helpers.js` (`toUpper`, `upperInput`, `validarRUT`, `formatearRutInput`, `parseToken`, `cerrarSesion`), `cotizacionDoc.js` y `ordenServicioDoc.js` (PDF por HTML + `imprimir.js`), `empresa.js` (datos de la empresa).

## 4. Modelo de datos y reglas de diseño

**Tablas (MySQL; en Neon equivalentes):** `clientes`, `contactos`, `direcciones`, `cliente_contactos` y `cliente_direcciones` (vínculos: `cliente_id`, `contacto_id`/`direccion_id`, `orden`, `a_ot`; `ON DELETE CASCADE`), `equipos`, `ordenes_trabajo`, `cotizaciones`, `usuarios`. El esquema vigente está en `backend/crear_tablas.sql`.

- **Cliente:** `tipo` (`EMPRESA` | `PERSONA`), razón social o nombre, RUT (válido y único; "19" = comodín sin RUT), fono, email, dirección/ciudad/comuna **propias** en la ficha (en una empresa no viajan a la OT). **Persona:** no tiene contacto (ella misma es el cliente) y su dirección es la que tiene vinculada en Direcciones (la marcada "En la OT" o la primera); la OT copia `cliente_tipo`.
- **Contactos y Direcciones son catálogos globales** (`CO-0001`, `DI-0001`). Un cliente tiene muchos de cada uno y el mismo registro puede estar en varios clientes: el buscador avisa "(ya es de CL-XXXX)" y deja agregarlo tras confirmar. Crear uno que ya existe **no da error**: se reutiliza (`reutilizar: true`). Borrar uno vinculado: el servidor responde **409** con los clientes afectados y se confirma con `?forzar=1`.
- **Check "En la OT":** marca qué contacto y qué dirección viajan a la OT. Es de **un solo uso** (`POST /clientes/:id/limpiar-a-ot` lo desmarca tras enviar). **Sin marca no viaja nada**: la OT se abre con Contacto y Dirección vacíos y se eligen con "Buscar Contacto" / "Buscar Dirección".
- **La OT guarda una copia (snapshot)** del cliente, contacto, dirección y equipo, y las columnas `contacto_id`/`direccion_id` solo como referencia. Si algo se quita del cliente, la OT lo conserva y muestra un aviso ámbar; tras **Registrar** en el catálogo aparece **Vincular al cliente**. (En el sistema antiguo la OT guardaba solo el id y el 24% de las órdenes perdió su contacto.)
- **Las OT no crean ni vinculan clientes ni equipos** del mantenedor automáticamente; solo con los botones "Registrar en …".
- **N° de OT:** `OT-AAAA-NNNNN` desde 02800, autogenerado y **inmutable**. **Equipos:** `EQ-XXXX`; Equipo mínimo 2 caracteres, Marca/Modelo opcionales; la serie vive solo en la OT.
- **Cotizaciones** guardan sus contactos extra como JSON (`contactos_extra`) y las mismas columnas de contacto/dirección que la OT.

## 5. Convenciones de código

- Todo el texto de formularios va en **MAYÚSCULAS** (`upperInput(e)` conserva la posición del cursor; el email y los números no). Fono: solo `[0-9+]`.
- Dropdowns: `useRef` + `mousedown` para cerrar al hacer clic fuera, z-index alto, buscan con 2+ caracteres.
- Listados paginados de **4** ítems con `usePaginaPersistente` y `useClampPagina`; filtrado con `slice()` en el frontend.
- Botones de formularios con 3 opciones al editar: **Guardar Cambios** (se queda), **Cerrar** (guarda y sale), **Cancelar**. Protección anti doble envío con `useGuardar`.
- Botones pequeños de acción (Editar, Registrar, Vincular…): clase compartida `btn-mini` de `styles/botones.css` con icono de `lucide-react`. **Naranja (`--warning`) = editar; verde (`--success`) = crear / registrar / vincular.** No crear estilos en línea para botones nuevos.
- **Menú superior:** cada pantalla enlaza a las otras 9 (Inicio, Clientes, Contactos, Direcciones, Equipos, Orden de Trabajo, Informes, Cotizaciones, Orden de Compra, Usuarios), sin su propio botón, con el mismo orden, icono y color. Está repetido en 6 componentes `Header*` y en las páginas `Home`, `Informes`, `OrdenCompra` y `Cotizaciones`: **al agregar un módulo hay que sumar su botón en todos** (ver `CAMBIOS.md` v2.163).
- **Ancho de los campos de los formularios de mantenedor** (Equipos, Contactos, Direcciones): el estándar es un tercio de la fila (~220 px en el formulario de 740 px, como en Equipos). Con 2 campos por fila se usa `repeat(2, calc((100% - 16px) / 3))`, nunca `1fr 1fr`. Solo la dirección puede ocupar 2 columnas (clase existente `of-col-full`). Ver `CAMBIOS.md` v2.164.
- **Tamaño de archivos:** un archivo de pantalla no debería pasar de unas 400 líneas. Si crece, extraer a un componente, un hook (`use*.jsx`) o una utilidad (`utils/`); la lógica sin interfaz (validar, convertir) va en `utils/` para poder probarla sola.
- **Reutilizar, no crear clases CSS nuevas.** Antes de agregar una clase, buscar una equivalente con `git grep` en `frontend/src/styles/`. Las que ya existen y sirven: grillas `cf-r2` / `cf-r3` (Clientes), `ef-r2` / `ef-r3` (Equipos), `of-r2` / `of-r3` / `of-cols` (OT); ocupar toda la fila `of-col-full`; botones `btn-mini`; título de sección `of-st primary` (azul `--primary`, el mismo de "Buscar Contacto"). Si hay que ajustar algo, modificar la clase existente o usar `style` puntual, no duplicarla con otro nombre.
- **Títulos de sección de la OT:** todos con `of-st primary` (azul). No usar `success` (celeste) ni `muted` (negro).
- Móvil (≤768px): botones de 40 px, inputs de filtro de 44 px.
- Códigos autogenerados: máximo existente + 1, nunca por id de base de datos.

## 6. Trampas ya vividas (no repetir)

- `git push origin main` **publica el frontend** (Vercel). Verificar con `gh api repos/rlunasanchez/hls-soluciones/deployments`.
- Al agregar una columna a un `INSERT`/`UPDATE` PostgreSQL hay que **renumerar los `$N`** de todo lo que sigue.
- Escribir en Contactos/Direcciones invalida también el caché de `/api/clientes` (`services/api.js`); si no, la ficha queda vieja 60 s.
- No descartar contactos "repetidos" por email: dos contactos pueden compartir correo (causó un aviso falso).
- Los efectos que cargan los vínculos de la ficha dependen del **objeto** `clienteEditando`, no solo del id, para recargar tras "Guardar Cambios".
- En el SQL Editor de Neon se puede perder la primera letra al pegar: empezar con una línea en blanco y revisar la primera palabra. Pegar scripts largos sin `BEGIN`/tablas temporales (el editor puede no mantener la sesión).
- Windows: en el shell de Claude Code los heredocs largos con comillas fallan; usar la herramienta de escritura de archivos. Los archivos del repo están en LF y Git avisa de CRLF; es normal.
- El backend local no se recarga solo; reiniciarlo tras cambiar código. En el navegador, **Ctrl+F5** tras un cambio de frontend si ves comportamiento viejo.

## 7. Estado y pendientes (13-oct-2026)

- **Neon:** migración de contactos/direcciones **corrida**, backend PostgreSQL **desplegado** y esquema antiguo **ya borrado** (`clientes_contactos`, `clientes_direcciones` y las columnas `clientes.contacto_*`). Neon tiene 9 tablas: `clientes`, `contactos`, `direcciones`, `cliente_contactos`, `cliente_direcciones`, `equipos`, `ordenes_trabajo`, `cotizaciones`, `usuarios`.
- Adaptar **Cotizaciones** a los checks "En la OT" y a los botones Editar/Registrar (`NOTAS-COTIZACIONES.md` tiene el relevamiento).
- Construir **Informes** y **Orden de Compra** (referencia: `BASE_DATOS_ANTIGUA.md`).
- `POST /api/auth/setup-admin` ya se eliminó (v2.168); el primer admin se crea con `crear-admin.js`.
- Opcional: importar datos históricos del sistema antiguo (14.581 OT, 5.698 contactos).
- No hay pruebas automáticas del frontend: los cambios de pantalla se prueban a mano.

## 7b. Próxima sesión: seguir reduciendo la OT a ~400 líneas por archivo (plan acordado)

Meta del dueño: ningún archivo de pantalla con miles de líneas; que el código sea escalable. Alcance: **solo Clientes, Contactos, Direcciones y OT** (no Cotizaciones, Informes ni Orden de Compra todavía). **Todo local**: no hacer `git push` ni tocar `deploy/cloud`/Neon hasta que el dueño lo ordene. Hacer los pasos **de a uno**: extraer, `npx vite build`, y que el dueño pruebe en pantalla antes del siguiente. Es traslado de código: no cambiar comportamiento.

El foco tenue de Tab en botones (v2.170) ya fue confirmado por el dueño.

Estado de tamaños (líneas): `OrdenTrabajo.jsx` 802, `OrdenFormCliente.jsx` 739, `OrdenFormEquipo.jsx` 309, `ordenServicioDoc.js` 292, `OrdenAdjuntos.jsx` 257, `useClienteOT.jsx` 246, `ClienteFormulario.jsx` 252.

1. **`OrdenFormCliente.jsx` → ~250.** Sacar a componentes propios (en `components/ordenes/`): `OrdenBuscadorCliente.jsx` (buscador de cliente y sus tarjetas, ~210), `OrdenDatosCliente.jsx` (cliente, RUT, fono, email, ~100), `OrdenAvisosVinculo.jsx` (buscadores de contacto/dirección y avisos "ya no vinculado", ~65), `OrdenDatosContacto.jsx` (~80) y `OrdenDatosDireccion.jsx` (~90). Se queda la lógica (RUT, `contactosDisponibles`, `vincularAlCliente`, `refrescarClienteSeleccionado`).
2. **`OrdenTrabajo.jsx` → ~450.** Sacar: `OrdenCotizaciones.jsx` (chips y contador de cotizaciones asociadas, ~70), `OrdenFormCabecera.jsx` (título, técnico y cerrar, ~40), un hook `useOrdenDesdeNavegacion` (el `init` que recibe cliente/orden desde Clientes o Cotizaciones, ~75) y unificar las 3 ramas casi iguales de `seleccionarCliente` (~110) usando `datosDelTipo`.
3. Para bajar de 450 a 400 habría que mover el estado del formulario a un hook propio (lo más delicado: más de 40 `useState`).
4. Después, revisar `OrdenFormEquipo.jsx` (309) y `ordenServicioDoc.js` (292), que ya están cerca de la meta.

Antes de publicar algún día (no ahora): migración de Neon y portar `clientes.js`, `ordenes.js` y `auth.js` a PostgreSQL, ver `CAMBIOS.md` v2.168.

## 8. Cómo trabajar con el dueño

- **Hacer solo lo que se pide**; si algo parece necesario pero no fue pedido, preguntar. No crear carpetas, scripts, ramas ni worktrees extra sin avisar.
- **No hacer `git push` ni cambiar de rama sin orden expresa**, porque publica en producción. Los commits locales sí. No usar `--force` sin permiso.
- **No borrar datos de producción ni bases** sin confirmar qué se borra; el dueño ejecuta él mismo lo que toque Neon (Claude no tiene acceso a Neon ni sus credenciales).
- Para cambiar de rama en la carpeta del dueño mientras prueba, usar mejor un `git worktree` temporal y quitarlo después (cambiar la rama de su carpeta puede romperle el entorno local).
- Preguntar antes de borrar código; verificar con búsquedas que de verdad no se usa. Probar lo que se toca (build del frontend y pruebas del backend) antes de subir.
- La base **`ods`** (SQL Server local, restaurada de `08-09-26.bak`) es el sistema antiguo y se conserva como referencia. No se toca.

## 9. Dónde está cada cosa

| Archivo | Para qué |
|---|---|
| `CAMBIOS.md` | Registro detallado de cambios, más reciente arriba (de 2026-10-13 hacia atrás) |
| `docs/HISTORIAL.md` | Documentación histórica completa (antes era este archivo): decisiones de versiones 1.0 a 2.17, deploy en la nube, bugs resueltos |
| `BASE_DATOS_ANTIGUA.md` | Esquema del sistema original (SQL Server `ods`), hallazgos y equivalencias con el sistema nuevo |
| `CONTINUAR_EN_OTRO_PC.md` | Montar o actualizar el proyecto en otro equipo |
| `NOTAS-COTIZACIONES.md` | Relevamiento y pendientes del módulo de Cotizaciones |
| `backend/crear_tablas.sql` | Esquema MySQL vigente |
