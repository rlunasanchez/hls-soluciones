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
| Cotizaciones (PDF con folio) | Completo, adaptado como la OT en v2.209: cliente Empresa/Persona, contacto y dirección con los mismos componentes y vínculos, todo en tablas (`cotizacion_items`, montos en columnas), PDF al estilo de la OT. Pendiente: listado en el servidor (hoy carga hasta 10.000 y filtra en el navegador) |
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
- `components/clientes/ClienteFormulario.jsx` (ficha de Empresa: el recuadro de la empresa arriba a todo el ancho y Contactos | Direcciones debajo, v2.215; ficha de Persona: Persona | Direcciones, del mismo ancho; cómo volver al diseño anterior en `CAMBIOS.md` v2.215) y `VinculosCliente.jsx` (tabla de vínculos con check "En la OT").
- `components/ordenes/OrdenFormCliente.jsx` (cliente, contacto, dirección, aviso "ya no vinculado", Adjunto, Información Interna), `OrdenFormEquipo.jsx`, `OrdenFormInsumos.jsx`, `OrdenFormAveria.jsx`, `OrdenFormDatos.jsx`.
- **Adjuntos de la OT (v2.186):** `components/ordenes/OrdenAdjuntos.jsx` (apartado plegado con miniaturas), `AdjuntoVisor.jsx` (visor con flechas), `hooks/useAdjuntosOrden.js` y `utils/adjuntos.js`; en el backend `routes/adjuntos.js`, `utils/limitesAdjuntos.js` y la tabla `orden_adjuntos` (un registro por archivo; hasta 10 imágenes y 10 PDF). Los archivos ya no viajan con la OT. Y `components/ordenes/useClienteOT.jsx` (hook: ver / editar / registrar el cliente desde la OT con sus modales). `OrdenFormCliente.jsx` los usa; **no volver a meter esa lógica dentro de un archivo grande**.
- `hooks/useOrdenesListado.js` (listado de OT: carga, filtros y paginación).
- `utils/ordenFormato.js` (orden guardada → estado del formulario, `ordenVacia`, equipo e insumos) y `utils/validarOrden.js` (validaciones previas a guardar y payload). `OrdenTrabajo.jsx` abre una orden con una sola función `cargarOrden(orden, "editar" | "ver")`.
- `components/comunes/CampoCatalogo.jsx` (buscador de contacto/dirección con Editar/Registrar/ "(ya es de CL-X)"), `ModalEditarCatalogo.jsx`, `BotonQuitar.jsx`, `AccionesFicha.jsx`.
- `hooks/usePaginacion.js` (`usePaginaPersistente`, `useClampPagina`), `useBusquedaApi.js` (busca en el servidor mientras se escribe), `useValorRetrasado.js` (espera 300 ms antes de consultar), `useGuardar.js` (evita doble envío).
- `utils/clientesApi.js` (consultas puntuales de clientes: `verificarCliente`, `clientePorId`, `clienteDeOrden`; **la OT ya no carga la lista completa de clientes**).
- **Backend `backend/utils/`** (mismo archivo en `main` y `deploy/cloud`, usan `?` y `numerarMarcadores` los vuelve `$1…` solo en PostgreSQL): `filtrosOrdenes.js` (filtros y paginación del listado de OT), `busquedaClientes.js` (buscador de cliente), `validaciones.js` (RUT y email), `camposOrden.js` (lista `CAMPOS` de la OT de la que salen el INSERT y el UPDATE: para agregar una columna a la OT se edita esa lista, sin contar marcadores), `numeroRepetido.js` (reconoce el error de número de OT repetido en MySQL y PostgreSQL; `POST /api/ordenes` numera de a una con una cola y reintenta si se repite, v2.199).
- `utils/helpers.js` (`toUpper`, `upperInput`, `validarRUT`, `formatearRutInput`, `parseToken`, `cerrarSesion`), `cotizacionDoc.js` y `ordenServicioDoc.js` (PDF por HTML + `imprimir.js`), `empresa.js` (datos de la empresa).

## 4. Modelo de datos y reglas de diseño

**Tablas (MySQL; en Neon equivalentes):** `clientes`, `contactos`, `direcciones`, `cliente_contactos` y `cliente_direcciones` (vínculos: `cliente_id`, `contacto_id`/`direccion_id`, `orden`, `a_ot`; `ON DELETE CASCADE`), `equipos`, `ordenes_trabajo`, `orden_adjuntos`, `cotizaciones`, `cotizacion_items`, `usuarios`. El esquema vigente está en `backend/crear_tablas.sql`.

- **Cliente:** `tipo` (`EMPRESA` | `PERSONA`), razón social o nombre, RUT (válido y único; "19" = comodín sin RUT), fono, email, dirección/ciudad/comuna **propias** en la ficha (en una empresa no viajan a la OT). **Persona:** no tiene contacto (ella misma es el cliente) y su dirección es la que tiene vinculada en Direcciones (la marcada "En la OT" o la primera); la OT copia `cliente_tipo`.
- **Contactos y Direcciones son catálogos globales** (`CO-0001`, `DI-0001`). Un cliente tiene muchos de cada uno y el mismo registro puede estar en varios clientes: el buscador avisa "(ya es de CL-XXXX)" y deja agregarlo tras confirmar. Crear uno que ya existe **no da error**: se reutiliza (`reutilizar: true`). Borrar uno vinculado: el servidor responde **409** con los clientes afectados y se confirma con `?forzar=1`.
- **Check "En la OT":** marca qué contacto y qué dirección viajan a la OT. Es de **un solo uso** (`POST /clientes/:id/limpiar-a-ot` lo desmarca tras enviar). **Sin marca no viaja nada**: la OT se abre con Contacto y Dirección vacíos y se eligen con "Buscar Contacto" / "Buscar Dirección".
- **La OT guarda una copia (snapshot)** del cliente, contacto, dirección y equipo **y su vínculo** (`cliente_id`, `contacto_id`, `direccion_id`, `equipo_id`): al editar el registro del mantenedor se actualizan los textos de todas las OT vinculadas (v2.191); si se elimina, la OT conserva la copia sin vínculo. Si algo se quita del cliente, la OT lo conserva y muestra un aviso ámbar; tras **Registrar** en el catálogo aparece **Vincular al cliente**. (En el sistema antiguo la OT guardaba solo el id y el 24% de las órdenes perdió su contacto.)
- **Las OT no crean ni vinculan clientes ni equipos** del mantenedor automáticamente; solo con los botones "Registrar en …".
- **N° de OT:** `OT-AAAA-NNNNN` desde 02800, autogenerado y **inmutable**. **Equipos:** `EQ-XXXX`; Equipo mínimo 2 caracteres, Marca/Modelo opcionales; la serie vive solo en la OT.
- **Cotizaciones** (v2.209): mismas columnas de cliente, contacto y dirección que la OT (`cliente`, `rut`, `fono_principal`, `contacto`, `direccion`, `cliente_tipo`, `cliente_id`, `contacto_id`, `direccion_id`…), vínculos y sincronización con los mantenedores iguales a los de la OT (`routes/ordenesVinculos.js`). El detalle va en `cotizacion_items` y los montos (`neto`, `iva`, `total`) en columnas que **calcula el servidor** (`utils/cotizacionTotales.js`); **nada va como JSON** (regla del dueño). La cotización no lleva equipo. La dirección sale del catálogo de Direcciones; la dirección propia de la ficha del cliente no se usa.

## 5. Convenciones de código

- Todo el texto de formularios va en **MAYÚSCULAS** (`upperInput(e)` conserva la posición del cursor; el email y los números no). Fono: solo `[0-9+]`.
- Dropdowns: `useRef` + `mousedown` para cerrar al hacer clic fuera, z-index alto, buscan con 2+ caracteres.
- Listados paginados con `usePaginaPersistente` y `useClampPagina`: en Clientes, Contactos, Direcciones, Equipos y OT los ítems por página **dependen del alto de la pantalla** (`hooks/useFilasPorPantalla.js`, v2.205; 4 a 20 filas, 4 en móvil) también en Cotizaciones y Usuarios (v2.210 y siguiente): todas las listas usan lo mismo, con la paginación en la fila de filtros. Los botones de página van en la fila de filtros, al lado de **Limpiar** (`Pagination enLinea`, v2.201).
- Botones de formularios, iguales en todas las pantallas: **Guardar** (guarda y se queda), **Guardar y salir** (guarda y vuelve al listado) y **Cancelar** (sale sin guardar; en modo Ver, **Cerrar**). Al crear uno nuevo en Contactos, Direcciones y Equipos solo hay **Guardar y salir**. Protección anti doble envío con `useGuardar`.
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
- **Un `git merge main` en `deploy/cloud` puede mezclar sin avisar código MySQL dentro de un archivo PostgreSQL** (pasó el 22-oct-2026 con `cotizaciones.js`: entró `const [rows] = await db.query(... ?)` y una variable `connection` que en PostgreSQL se llama `client`; habría dado error 500 en la web). Tras cada merge, **abrir y revisar a mano los `routes/*.js` que cambiaron** y probar con `embedded-postgres` incluyendo las claves foráneas del esquema real (la tabla `cotizaciones` tiene FK a `clientes`).
- **Un modal con `<form>` dibujado con `createPortal` dentro de otro formulario dispara el `submit` del formulario padre** (React propaga los eventos por el árbol de React, no por el DOM; v2.219: registrar un cliente guardaba y cerraba la cotización). Poner `onSubmit={(e) => e.stopPropagation()}` en el contenedor del modal.
- Windows: en el shell de Claude Code los heredocs largos con comillas fallan; usar la herramienta de escritura de archivos. Los archivos del repo están en LF y Git avisa de CRLF; es normal.
- El backend local no se recarga solo; reiniciarlo tras cambiar código. En el navegador, **Ctrl+F5** tras un cambio de frontend si ves comportamiento viejo.

## 7. Estado y pendientes (23-oct-2026)

**Publicado en la web hasta v2.221** (v2.221, vistas móviles: ficha de cliente sin campos cortados y con sus contactos y direcciones vinculados, Usuarios sin tabla duplicada; v2.220, «Ejecutivo y Condiciones» con la sangría de las otras cajas; v2.219, registrar cliente/contacto/dirección/equipo desde un modal ya no guarda el formulario de debajo; v2.218, Glosa de la cotización en su propia caja y «Ejecutivo y Condiciones» con su fondo celeste; v2.217, «Ejecutivo y Condiciones» con el título y el alto de Cliente/Contacto/Dirección — los colores anteriores y cómo volver están en `CAMBIOS.md` v2.217 y v2.218; v2.216, formulario de cotización sin el título «Datos del Cliente», y v2.215, ficha de cliente con Contactos y Direcciones más anchos, subidas el 24-nov-2026; v2.210 a v2.213 subidas el 23-nov-2026 y v2.214 el 24-nov-2026, solo frontend: lista de Cotizaciones estándar, pantalla de Usuarios estándar, «Ejecutivo y Condiciones» de la cotización en dos líneas de tres campos, «Válido hasta» visible en el PDF de la cotización y Detalle entre SKU y Cantidad en los ítems) (v2.209, Cotizaciones en tablas, subida el 20-nov-2026 con su SQL de Neon ya corrido; despliegue de Render y pantalla sin comprobar) (v2.200 a v2.204 subidas el 17-nov-2026, v2.205 a v2.207 el 18-nov-2026 y v2.208 el 19-nov-2026, v2.201 a v2.208 solo frontend y v2.200 con backend sin SQL de Neon; v2.197 a v2.199 subidas el 12-nov-2026; v2.197 y v2.198 sin probar en pantalla; v2.199 es backend, sin SQL de Neon) (26-oct-2026: Neon con las columnas `equipo_id`, `contacto_id` y `direccion_id` en `ordenes_trabajo`; v2.193 a v2.198 son solo frontend; v2.199 es solo backend). **Para retomar el trabajo, leer `CONTINUAR_LUNES.md`.** `MIGRACION_PENDIENTE.md` es solo histórico y se puede borrar. No hacer `git push` sin orden expresa; preguntar antes de publicar.

**Próximo cambio acordado (semana del 26-oct-2026): historial de la OT** (quién creó, modificó y entregó). Propuesta aprobada en lo general, aún sin construir:
- Tabla `orden_historial`: `orden_id`, usuario (nombre y login del token), fecha y hora, acción (creó, modificó, registró entrega/ingreso/término, cambió de cliente, agregó o quitó un adjunto, eliminó) y los cambios campo por campo con valor anterior y nuevo (JSON). El servidor lo calcula comparando la fila anterior con la nueva usando la lista `CAMPOS` de `utils/camposOrden.js`.
- Apartado **Historial** plegado y de solo lectura en la OT, junto a Adjuntos.
- A decidir con el dueño: historial completo o solo "creada por" y "última modificación por" (se recomienda el completo); registrar adjuntos y eliminaciones; aviso cuando otro usuario modificó la OT mientras se editaba (comparar `fecha_actualizacion`); si eliminar una OT debe dejar rastro (quién y cuándo) o pasar a "eliminada" sin borrarse; extender luego a Clientes, Contactos y Equipos.
- Hoy el sistema solo guarda `fecha_creacion` y `fecha_actualizacion`, sin el usuario.

**Vínculos de la OT con equipo, contacto y dirección (v2.191 y v2.192, publicadas el 26-oct-2026).** El dueño decidió que la OT solo toma datos de sus mantenedores y que un mismo registro puede estar en muchas OT, así que editarlo actualiza todas las OT que lo usan, igual que el cliente (`cliente_id`). Ahora `ordenes_trabajo` tiene `equipo_id`, `contacto_id` y `direccion_id`; el servidor los enlaza al guardar la OT (`routes/ordenesVinculos.js`: equipo = Equipo + Marca + Modelo, contacto = nombre, dirección = texto) y, al editar el registro del mantenedor, sincroniza los textos de las OT vinculadas (la serie es de cada OT). Al eliminarlo la OT conserva su copia sin vínculo. **v2.192:** al **crear** un equipo, contacto o dirección, el servidor enlaza las OT sin vínculo con el mismo texto (`reenlazarOrdenesDe*`), así que eliminar y volver a registrar recupera todas las OT sin abrirlas. Caso no cubierto: contactos y direcciones con `reutilizar` (ya existe) solo enlazan la OT que se guarda; tenerlo en cuenta **al importar el histórico** (hacer una pasada masiva de enlace como el SQL de Neon). Pendiente a decidir: corrección masiva con confirmación y registro en el historial, y si dirección y contacto de OT antiguas deberían quedar congelados (son datos históricos: dónde y quién pidió el servicio ese día).

- **Neon:** migración de contactos/direcciones **corrida**, backend PostgreSQL **desplegado** y esquema antiguo **ya borrado** (`clientes_contactos`, `clientes_direcciones` y las columnas `clientes.contacto_*`). Neon tiene 9 tablas: `clientes`, `contactos`, `direcciones`, `cliente_contactos`, `cliente_direcciones`, `equipos`, `ordenes_trabajo`, `cotizaciones`, `usuarios`. Desde v2.209 también `cotizacion_items` (la migración de Cotizaciones ya está corrida en Neon).
- **Cotizaciones adaptada como la OT: HECHO en v2.209** (ver `CAMBIOS.md`): Empresa/Persona, buscador de cliente en el servidor, Editar/Registrar, «ya no vinculado» (la cotización conserva su copia del cliente, contacto y dirección), contacto y dirección del catálogo con vínculos y sincronización, todo en tablas. Falta el listado de Cotizaciones en el servidor (filas según la pantalla, paginación en la fila de filtros) y que el dueño pruebe el formulario y el PDF en pantalla.
- Construir **Informes** y **Orden de Compra** (referencia: `BASE_DATOS_ANTIGUA.md`).
- `POST /api/auth/setup-admin` ya se eliminó (v2.168); el primer admin se crea con `crear-admin.js`.
- Opcional: importar datos históricos del sistema antiguo (14.581 OT, 5.698 contactos).
- No hay pruebas automáticas del frontend: los cambios de pantalla se prueban a mano.

## 7a. PRIORIDAD: soportar el volumen del sistema antiguo (paginación y búsqueda en el servidor)

Este sistema reemplaza uno que tenía **14.581 órdenes de servicio, 6.420 empresas, 7.118 personas y 5.698 contactos** (ver `BASE_DATOS_ANTIGUA.md`). Hoy el nuevo carga todo y filtra/pagina en el navegador, lo cual **no escala a ese volumen** y hay que resolverlo **antes de importar datos históricos** (dicho por el dueño el 16-oct-2026: "este sistema está hecho para gran volumen, recuerda la base del sistema viejo").

**Alcance acordado (22-oct-2026): primero cerrar hasta la OT** (listado, buscador de cliente, orden de `ordenes.js`, archivos bajo ~400 líneas, PDF); Clientes, Equipos y el resto vienen después. Cotizaciones, Informes y Orden de Compra quedan fuera por ahora.

Avance:
1. **HECHO y publicado (v2.176):** listado de OT paginado y filtrado en el servidor (`utils/filtrosOrdenes.js`, `useOrdenesListado.js`).
2. **HECHO en local, sin publicar (v2.178):** buscador de cliente de la OT en el servidor (`GET /api/clientes?q=`, `GET /api/clientes/verificar`, `utils/busquedaClientes.js`, `utils/clientesApi.js`). El merge a `deploy/cloud` ya está hecho y probado en PostgreSQL (40/40); falta la orden de push (Render primero, Vercel después).
3. **HECHO en local, sin publicar (v2.179):** `ordenes.js` arma el `INSERT`/`UPDATE` desde la lista `CAMPOS` (`utils/camposOrden.js`); probado igual al código anterior y en MySQL y PostgreSQL; merge a `deploy/cloud` hecho y sin push.
4. **HECHO en local (v2.181 a v2.184):** `OrdenTrabajo.jsx` quedó en 377 líneas y el PDF (292) ya estaba bajo la meta. **Con esto queda cerrado el alcance acordado hasta la OT.** Todo lo de v2.179 a v2.184 y el arreglo de Cotizaciones (v2.180) están solo en local.

Qué no escala todavía (después de la OT):
1. Listados de Clientes (`Clientes.jsx`) y de Equipos (`Equipos.jsx`): cargan todo y filtran en el navegador.
2. `GET /api/clientes` sin `q` arma contactos y direcciones de **todos** los clientes (`enriquecerClientes`), y `buscarDuplicadoRut` lee todos los clientes en cada alta/edición.
3. `GET /api/equipos` sin límite.
4. Cotizaciones carga la lista completa de clientes (módulo fuera de alcance por ahora).

Cómo resolverlo (no con un tope de cantidad, que ocultaría registros): **paginación y filtros en el servidor** (`pagina`, `limite` y filtros en la consulta con `WHERE` y `LIMIT/OFFSET`, la respuesta trae la página y el `total`); el buscador de cliente consulta al servidor desde 2 letras y devuelve ~10 resultados; `enriquecerClientes` solo para los clientes de la página. Los buscadores de Contactos y Direcciones ya consultan al servidor (`useBusquedaApi`): usar ese patrón. Orden sugerido: 1) OT, 2) buscador de cliente, 3) Clientes, 4) Equipos. Hacerlo en pasos chicos, probando cada uno; crear datos de prueba temporales (como se hizo con la paginación) y borrarlos al terminar. Considerar índices en `ordenes_trabajo` (número, cliente, fecha) y `clientes` (razón social, RUT).

## 7b. Reducción de tamaño de la OT (HECHA el 22-oct-2026, v2.169 a v2.184)

Meta del dueño: ningún archivo de pantalla con miles de líneas. **Cumplida para Clientes, Contactos, Direcciones y OT.** Tamaños al cierre: `OrdenTrabajo.jsx` 377, `OrdenFormEquipo.jsx` 326, `ordenServicioDoc.js` (PDF) 292, `OrdenFormCliente.jsx` 275, `OrdenAdjuntos.jsx` 113, `useClienteOT.jsx` 249.

Cómo quedó repartida `OrdenTrabajo.jsx`: `utils/ordenFormato.js` (formulario vacío, orden guardada → formulario, `datosAlElegirCliente`), `hooks/useOrdenesListado.js` (listado), `useEquiposOT.js` (equipos y buscador por modelo), `useOrdenDesdeNavegacion.js` (abrir lo que viene de Clientes o Cotizaciones), `useGuardarOrden.js` (guardar, PDF, cotización), `useCotizacionesDeOrden.js`, `useClicFuera.js`, más los componentes `OrdenForm*`, `OrdenBuscadorCliente`, `OrdenCotizaciones`, `OrdenFormObservaciones` y `HeaderOrdenTrabajo` (con su propio menú).

**Revisión que conviene pasar tras cada refactor:** el build de Vite NO detecta nombres sin definir (pasó con `toUpper` y con `setMostrarCotizacionesAsociadas`). Revisar con ESLint (`no-undef` y `react/jsx-no-undef`) sobre `frontend/src`, o probar en pantalla cada flujo tocado.

Siguiente alcance (aún no): Clientes y Equipos en el servidor (ver 7a), Cotizaciones adaptada como la OT, Informes y Orden de Compra.

## 8. Cómo trabajar con el dueño

- **Regla permanente: código escalable, nunca archivos de miles de líneas.** Lo pidió el dueño el 15-oct-2026 ("no me sirven miles de líneas en el mismo código") y lo retomó el 16-oct-2026 ("continuemos con el código escalable"). Todo código nuevo o modificado debe quedar repartido: **un archivo de pantalla o componente no debería pasar de unas 400 líneas**. Antes de agregar algo a un archivo grande (hoy `OrdenTrabajo.jsx` 377, `OrdenFormEquipo.jsx` 326; Cotizaciones ya está repartida: `Cotizaciones.jsx` 73), extraer a un componente, un hook (`hooks/use*.js`) o una utilidad (`utils/`). La lógica sin interfaz (validar, convertir, armar datos) va en `utils/`. No repetir el mismo bloque (formulario vacío, ramas casi iguales): unificarlo en una función. Si un cambio obliga a pasar de ese tamaño, partir primero y luego agregar. Aplica a todo módulo nuevo (Cotizaciones, Informes, Orden de Compra) desde el inicio.
- **Todo el proyecto debe ser estándar** (regla del dueño, 23-nov-2026, "recuérdalo siempre"): una pantalla nueva o adaptada debe verse y comportarse como sus hermanas (barra de filtros en una fila con los nombres dentro de los campos, paginación en línea arriba, filas por página según la pantalla, etiquetas en mayúsculas, mismos botones). Antes de entregar, comparar con las otras; si otra pantalla se desvía, avisar y ofrecer estandarizarla.
- **Hacer solo lo que se pide**; si algo parece necesario pero no fue pedido, preguntar. No crear carpetas, scripts, ramas ni worktrees extra sin avisar.
- **No hacer `git push` ni cambiar de rama sin orden expresa**, porque publica en producción. Los commits locales sí. No usar `--force` sin permiso.
- **No borrar datos de producción ni bases** sin confirmar qué se borra; el dueño ejecuta él mismo lo que toque Neon (Claude no tiene acceso a Neon ni sus credenciales). En Windows, `git push` falla desde el shell Bash de Claude Code ("cannot spawn sh"): usar PowerShell.
- Para cambiar de rama en la carpeta del dueño mientras prueba, usar mejor un `git worktree` temporal y quitarlo después (cambiar la rama de su carpeta puede romperle el entorno local).
- Preguntar antes de borrar código; verificar con búsquedas que de verdad no se usa. Probar lo que se toca (build del frontend y pruebas del backend) antes de subir.
- La base **`ods`** (SQL Server local, restaurada de `08-09-26.bak`) es el sistema antiguo y se conserva como referencia. No se toca.

## 9. Dónde está cada cosa

| Archivo | Para qué |
|---|---|
| `CONTINUAR_LUNES.md` | Dónde quedó el trabajo el 23-oct-2026 y cómo retomarlo (borrar cuando ya no haga falta) |
| `CAMBIOS.md` | Registro detallado de cambios, más reciente arriba (de 2026-10-13 hacia atrás) |
| `docs/HISTORIAL.md` | Documentación histórica completa (antes era este archivo): decisiones de versiones 1.0 a 2.17, deploy en la nube, bugs resueltos |
| `BASE_DATOS_ANTIGUA.md` | Esquema del sistema original (SQL Server `ods`), hallazgos y equivalencias con el sistema nuevo |
| `CONTINUAR_EN_OTRO_PC.md` | Montar o actualizar el proyecto en otro equipo |
| `NOTAS-COTIZACIONES.md` | Relevamiento y pendientes del módulo de Cotizaciones |
| `backend/crear_tablas.sql` | Esquema MySQL vigente |
