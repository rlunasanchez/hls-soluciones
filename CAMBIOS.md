# Registro de Cambios - HLS Soluciones

## Fecha: 2026-09-04 (5)

### v2.48: avisar si un contacto/dirección creado a mano en la OT ya existe

**Problema:** en "Otros Contactos" y "Otras Direcciones / Sucursales" de la OT, al agregar una fila en blanco ("+ Agregar contacto"/"+ Agregar dirección") y tipear a mano un nombre o dirección que ya existía (como Contacto principal de la orden, en la ficha del cliente, o en otra fila ya agregada), no había ningún aviso — quedaba duplicado.

**Solución** (`OrdenFormCliente.jsx`): al salir del campo Nombre (contactos) o Dirección (direcciones), si el valor coincide con uno ya existente se muestra un `alert` pidiendo elegirlo desde el selector "Agregar contacto/dirección del cliente" y se limpia la fila — Nombre + Email en contactos, Dirección + Tipo en direcciones — en vez de dejar el duplicado a medio cargar.

**Verificación:** `npm run build` OK.

## Fecha: 2026-09-04 (4)

### v2.47: fix — "Otros Contactos"/"Otras Direcciones" de la OT no dejaban elegir el segundo ítem

**Problema:** en la OT, al agregar más de un contacto o dirección extra del cliente desde el `<select>` "Agregar contacto/dirección del cliente", el primero se agregaba bien pero el segundo clic no hacía nada — había que destildar y volver a tildar el checkbox "Otros Contactos"/"Otras Direcciones" para que volviera a funcionar.

**Causa:** el `<select>` no controlado (`defaultValue=""`) usaba el índice del array como `value` de cada `<option>`. Al agregar el primer contacto, la lista de disponibles se filtra y el segundo contacto pasa a ocupar el índice 0 — el mismo `value` que ya estaba "seleccionado" en el DOM. El navegador no dispara `onChange` porque, desde su perspectiva, el valor no cambió.

**Solución** (`OrdenFormCliente.jsx`): ambos `<select>` pasan a ser controlados (`value=""` fijo) y usan un valor estable por ítem (nombre normalizado para contactos, dirección normalizada para direcciones) en vez del índice — al agregarse, el ítem desaparece de las opciones y el select vuelve a quedar en blanco, listo para el siguiente.

**Verificación:** `npm run build` OK. Confirmado por el usuario en la app real: ahora se pueden agregar varios contactos/direcciones seguidos sin tener que destildar el checkbox.

## Fecha: 2026-09-04 (3)

### v2.46: módulo de Cotizaciones

Nuevo módulo completo de Cotizaciones (`/cotizaciones`), con el mismo lenguaje visual y patrones que Órdenes de Trabajo:

- **Listado** (`CotizacionLista.jsx`, `CotizacionAcciones.jsx`): folio correlativo (desde 2800), filtro por folio/cliente, paginación, menú de acciones (Ver/Editar/Eliminar/PDF).
- **Formulario** (`Cotizaciones.jsx`): dos columnas igual que la OT — Cliente/Contacto y Ejecutivo/Condiciones a la izquierda, Ítems a la derecha. Los ítems muestran SKU/Cant./Uni./Neto/Total con Detalle en un textarea debajo, y se colapsan mostrando solo los dos primeros ("Ver todos/Ver menos") igual que en otras pantallas.
- **Asociación opcional a una OT**: se puede crear una cotización desde el menú "..." de una OT (queda asociada, con badge "· asociada a OT N°...") o desde el menú de Clientes (prefill sin asociar). Al crear desde la OT, guardar/cancelar vuelve a la vista de la OT; si se crea desde el propio módulo de Cotizaciones, se queda ahí.
- **Cotización sin cliente identificado**: el formulario ya no pide ni muestra Buscar Cliente, Razón Social ni RUT en ningún caso (venga de una OT o sea nueva) — la cotización es solo un documento, la asociación a una OT (si existe) alcanza. El buscador de Contacto sigue funcionando: si hay un cliente detrás (por la OT o al editar una ya guardada) busca entre sus contactos; si es una cotización suelta, busca entre los contactos de todos los clientes, mostrando a qué cliente pertenece cada uno.
- **PDF** (`cotizacionDoc.js`): mismo estilo que el PDF de OT (encabezado centrado, logo real), con datos bancarios y condiciones de la empresa (`empresa.js`).
- **Backend** (`routes/cotizaciones.js`, tabla `cotizaciones` en `crear_tablas.sql`): CRUD completo, folio autocalculado, `ejecutivo` siempre tomado del usuario autenticado (no editable a mano), cliente y OT opcionales.

**Fix de guardado:** al guardar se descartaban ítems que no tuvieran el campo "Detalle" completado, aunque tuvieran SKU/Cantidad/Unidad/Neto cargados — se perdían los montos ya ingresados. Ahora se conserva cualquier ítem con datos en al menos uno de esos campos.

**Verificación:** `npm run build` OK. Smoke test contra el backend real (crear/editar/eliminar cotización sin cliente, folio y totales correctos).

## Fecha: 2026-09-04 (2)

### v2.45: orden de campos Ciudad/Comuna/Fono + "Registrar" para contactos y direcciones desde la OT

**Orden de campos** (`ClienteFormulario.jsx`, `OrdenFormCliente.jsx`): en "Sucursales/Direcciones" (mantenedor de Clientes) y en "Otras Direcciones / Sucursales" (OT) el orden pasa a ser Ciudad → Comuna → Fono (antes Ciudad → Fono → Comuna). En "Otros Contactos" de la OT, Email pasa a ir antes que el nombre del Contacto.

**Nuevo — "+ Registrar" en la OT** (`OrdenFormCliente.jsx`): mismo patrón que "+ Registrar en Equipos", ahora también para:
- **Otros Contactos**: si un contacto tipeado a mano en la OT todavía no existe en la ficha del cliente seleccionado, aparece un botón para darlo de alta en `clientes_contactos` sin salir de la OT.
- **Otras Direcciones / Sucursales**: mismo botón para dar de alta la dirección en `clientes_direcciones`.

Ambos requieren que el cliente ya esté seleccionado del buscador (con `id` real) y arman el `PUT /api/clientes/:id` completo preservando el resto de los datos del cliente (no pisan otras sucursales/contactos ya cargados).

**Verificación:** `npm run build` OK. Probado extremo a extremo contra el backend real (crear cliente con sucursal+contacto existentes, registrar uno nuevo de cada tipo desde la simulación de la OT, confirmar que lo existente no se pierde).

## Fecha: 2026-09-04

### v2.44: contacto principal del cliente ya no pide dirección propia

**Problema:** en "Nuevo Cliente"/editar cliente, el contacto principal tenía su propio campo "Dirección Contacto" para completar a mano, casi siempre igual a la dirección del cliente.

**Solución** (`ClienteFormulario.jsx`): se eliminó el campo del formulario. El contacto principal usa automáticamente la dirección del cliente (`nuevoCliente.direccion`) al guardar — ya no hay nada que ingresar para ese dato. Los contactos adicionales (agregados aparte) mantienen su propio campo de dirección, sin cambios. Se limpió también el estado ahora muerto (`contacto_direccion` en `ESTADO_INICIAL_CLIENTE` y en la carga de un cliente existente).

**Verificación:** `npm run build` OK.

## Fecha: 2026-09-03 (7)

### v2.43: unificar tamaño de botones "Nuevo X" y Cancelar/Guardar en Clientes, Equipos y Usuarios

Los botones "Nuevo Cliente", "Nuevo Equipo", "Nuevo Usuario" y "Cambiar Password" usaban la clase `btn-nuevo-cliente`, con padding y tipografía distintos al botón "Nueva Orden" del listado de OT. Ahora usan `main-btn`, igual que "Nueva Orden" (`Clientes.jsx`, `Equipos.jsx`, `GestionUsuarios.jsx`).

Los botones "Cancelar" / "Guardar" dentro de los formularios de Cliente (`cf-btn-*` en `Clientes.css`), Equipo (`ef-btn-*` en `Equipos.css`) y Usuario (`uf-btn-*` en `UsuarioFormulario.jsx` / `CambioPasswordForm.jsx`) eran visiblemente más altos que los del formulario de OT (`of-btn-*`). Se igualó su padding, tamaño de fuente y border-radius a los de `of-btn-*` (`padding: 4px 12px; font-size: .78rem; border-radius: 6px`).

**Verificación:** `npm run build` OK. Comparación visual lado a lado de los botones (OT vs Cliente vs Equipo vs Usuario) renderizando las clases CSS reales vía Chrome headless.

### v2.42: logo HLS realmente centrado en el PDF (fix de `object-fit` + `viewBox`)

**CSS:** el selector `.logo img` en `ordenServicioDoc.js` nunca aplicaba — el `<img>` ya tiene la clase `.logo` (no es un contenedor con un `<img>` hijo), así que `object-fit: contain` nunca se activaba y el navegador estiraba el SVG para llenar el cuadro de 24×24mm, deformándolo. Corregido el selector a `img.logo`.

**SVG:** el `viewBox` de `LOGO_HLS` (`empresa.js`) no estaba centrado respecto a la cruz naranja del ícono — dos cuadrados decorativos existen solo del lado izquierdo, así que el centro geométrico del `viewBox` (donde estaba anclado el texto "HLS") no coincidía con el centro visual de la cruz. Se amplió el `viewBox` de forma simétrica alrededor de la cruz y se recentró ahí el texto "HLS" / "Soluciones Informáticas".

**Verificación:** renderizado real del SVG y del encabezado completo vía Chrome headless (`--headless --screenshot`) antes y después del cambio, no solo inspección de código.

## Fecha: 2026-09-03 (6)

### v2.41: logo HLS más grande y bloque Brother alineado abajo en el PDF de OT

**Logo HLS** (`empresa.js`): el texto "Soluciones Informáticas" dentro del logo SVG se agranda automáticamente hasta ocupar el mismo ancho que el ícono (antes se veía chico respecto a "HLS").

**Encabezado** (`ordenServicioDoc.js`): el bloque del logo Brother + "Servicio Técnico Autorizado" pasa de centrado verticalmente a alineado al fondo de la fila (`align-self: flex-end`), quedando a tope con la línea azul del encabezado — a la misma altura que "Soluciones Informáticas" del logo HLS, en vez de centrado y descolgado del resto.

**Verificación:** `npm run build` OK. Iterado con capturas reales vía Chrome headless hasta encontrar la alineación pedida.

## Fecha: 2026-09-03 (5)

### v2.40: logo real y ajustes de layout en el PDF de Orden de Servicio

**Logo:** `LOGO_HLS` (antes vacío, mostraba un placeholder punteado) ahora es el logo real de HLS, reconstruido como SVG a partir de la imagen provista por el usuario — no es una copia rasterizada: cada rectángulo del ícono se extrajo por coordenadas exactas y el texto ("HLS Soluciones Informáticas", corregido desde "Servicios Informáticos") es texto SVG real, nítido a cualquier tamaño. Agregado en `frontend/src/utils/empresa.js`.

**Ajustes de layout** (`frontend/src/utils/ordenServicioDoc.js`):
- Encabezado: datos de la empresa centrados, nombre "HLS Soluciones informaticas" agrandado (11pt → 13pt); recuadro del logo agrandado de 24×11mm a 24×24mm cuadrado para que el texto del logo no quede achicado.
- Título: el N° de OT pasa a estar junto a "Orden de Servicio" (antes en el recuadro de la derecha); ese recuadro ahora muestra la Fecha.
- Sección "Datos de Cliente — Contacto": reordenada — Dirección, luego Ciudad-Comuna (unificados en un solo campo separados por guion), Email Cliente arriba de Teléfono, Contacto/Email Contacto/Fono Contacto al final.
- Firma: "Nombre · RUT · Fecha" y el nombre del técnico centrados respecto al título de la línea de firma.
- Contactos adicionales: ahora también muestra la dirección del contacto (antes solo cargo/fono/email).
- Contacto principal: dejó de ser opt-in (checkbox en el modal de opciones) — ahora se incluye siempre en el PDF si la orden tiene datos de contacto (`ModalOpcionesPDF.jsx` muestra el nombre como texto fijo, sin checkbox).

**Verificación:** `npm run build` OK. Renderizado real con datos de prueba vía Chrome headless para cada cambio (no solo build).

## Fecha: 2026-09-03 (4)

### v2.39: menú "Más" (PDF / Cotización) en el formulario de OT, reemplaza el botón PDF suelto

El botón "PDF" agregado en v2.38 al formulario de la OT se reemplazó por un menú desplegable "Más" (mismo patrón visual `···` que ya usan Clientes/Equipos/Ordenes en el listado), con dos opciones: **Cotización** y **PDF**. Ambas traen los datos frescos de la orden (`GET /api/ordenes/:id`) antes de abrir el modal de PDF o navegar a `/cotizaciones`.

- Nuevo componente `frontend/src/components/ordenes/OrdenFormAcciones.jsx`: botón "..." + dropdown con `position: fixed` via `getBoundingClientRect` (igual que `OrdenAcciones.jsx`), pero reducido a los 2 ítems que tienen sentido dentro del formulario (no incluye Ver/Editar/Eliminar/Informe, que ya están cubiertos por el propio formulario o no aplican).
- `OrdenTrabajo.jsx`: botón "Más" movido al final de la fila de acciones (Cancelar → Guardar Cambios → Guardar/Cerrar → Más), visible solo cuando la orden ya tiene `id` (se guardó al menos una vez).

**Verificación:** `npm run build` OK.

## Fecha: 2026-09-03 (3)

### v2.38: "Guardar" en OT nueva ya no obliga a salir + botón PDF en el formulario

**Problema:** al crear una orden nueva, el único botón disponible ("Guardar Orden") guardaba y siempre volvía al mantenedor de órdenes. Para generar el PDF había que salir, volver a entrar al listado y usar el menú "..." → PDF. En edición ya existía "Guardar Cambios" (se queda en la orden), pero no en creación.

**Solución:**
- `backend/routes/ordenes.js` (POST `/`): ahora devuelve `id` y `numeroOrden` de la orden recién creada (antes solo `{ msg }`), necesario para poder seguir editándola sin recargar el listado.
- `OrdenTrabajo.jsx`:
  - El botón "Guardar" (guarda sin salir) ahora aparece también al crear una orden nueva, no solo al editar. Si la orden es nueva, guarda, toma el `id` devuelto por el backend y deja el formulario en modo edición (mismo comportamiento que ya tenía "Guardar Cambios").
  - Botón "PDF" nuevo en el formulario (junto a Cancelar), visible apenas la orden tiene `id` (se guardó al menos una vez). Trae los datos frescos de la orden y abre el mismo modal de opciones de PDF que ya se usaba desde el listado.
  - El botón grande inferior sigue guardando y saliendo de un solo clic ("Guardar Orden" / "Cerrar" en edición), para quien prefiera ese flujo.

**Verificación:** `npm run build` OK en frontend, `node --check` OK en el backend modificado.

## Fecha: 2026-09-03 (2)

### v2.37: flecha de despliegue en "Otros Contactos" y "Otras Direcciones / Sucursales"

Agregado ícono `ChevronDown`/`ChevronUp` (rota según el estado desplegado/colapsado) en el encabezado de ambas secciones del formulario de OT (`OrdenFormCliente.jsx`), mismo patrón visual que ya usaban "Adjunto" e "Información Interna". Orden dentro del label: flecha → checkbox → ícono de sección → texto. El checkbox sigue siendo el que controla mostrar/ocultar la sección.

**Verificación:** `npm run build` OK.

## Fecha: 2026-09-03

### v2.36: Modales sin cierre accidental, técnico asignado obligatorio, ajustes en el PDF

**Problema:** al hacer clic afuera de una ventana emergente por error, se cerraba y se perdían los datos que se estaban completando. Además, la Orden de Trabajo se podía guardar sin técnico asignado pese a que el campo mostraba `*` como obligatorio — el `<form noValidate>` y el botón "Guardar Cambios" (`type="button"`, no dispara validación nativa) desactivaban el `required` HTML.

**Solución:**
- Modales: eliminado el cierre por clic en el fondo oscuro en los 8 popups que lo tenían — `ModalContactos.jsx`, `ModalOpcionesPDF.jsx`, `ClienteFormulario.jsx` (detalle de contacto), `OrdenFormCliente.jsx` (detalle/editar/registrar cliente, ver adjunto) y `OrdenFormEquipo.jsx` (detalle/editar equipo). Ahora solo cierran con su botón X/Cancelar.
- `OrdenTrabajo.jsx`: validación explícita de Técnico Asignado antes de guardar (mismo patrón ya usado para Cliente/RUT).
- PDF de Orden de Servicio (`ordenServicioDoc.js`): eliminada la línea "Emitida el [fecha]" bajo el título; campo "Email" en "Datos de Cliente" renombrado a "Email Cliente" para no confundirse con "Email Contacto".

**Verificación:** `npm run build` OK en frontend tras cada cambio. Cambios solo en frontend, sin tocar backend ni base de datos.

## Fecha: 2026-09-01 (2)

### v2.35: PDF de Orden de Servicio — quitar degradés y truco de fondo, más compatible con celular

**Problema:** al probar el PDF de v2.34 desde el celular, el fondo se veía parchado (más claro en unas zonas, más oscuro en otras, distinto a la vista en computador) y el número de folio salió de otro color. Causa: los degradés (`linear-gradient` en el folio y en la barra de acento del encabezado) y el truco `background-clip: content-box` para recortar el fondo gris no se respetan igual en todos los motores de impresión/lectura de PDF — funcionan bien en Chrome desktop pero no están garantizados en todos los visores móviles.

**Solución** (`frontend/src/utils/ordenServicioDoc.js`):
- Folio y barra de acento del encabezado: de degradé a color sólido (`#0C4A8C`). Los colores sólidos se preservan de forma consistente entre motores; los degradés no.
- Fondo de página: en vez de `background-clip: content-box` sobre `body`, ahora es una caja propia (`.page`, con su padding y fondo) — más simple y sin depender de que el visor interprete igual ese modo de recorte.
- Sombras de las tarjetas: de dos capas suaves a una sola más nítida, para evitar que se rasterice distinto (parchado) según el motor.

**Verificación:** `npm run build` OK. Probado en Chrome desktop (igual que antes). Pendiente de confirmar en celular tras el deploy — es el caso que reportó el problema.

### v2.34: PDF de Orden de Servicio — segunda pasada visual (fondo, tarjetas, logo Brother)

**Problema:** después de v2.33 el documento seguía viéndose "muy plano" (feedback directo probando el PDF) — la sombra de las tarjetas era casi imperceptible (4% de opacidad) y todo el documento usaba el mismo celeste pálido sobre página blanca, sin contraste de valor real en ningún lado.

**Solución** (`frontend/src/utils/ordenServicioDoc.js`, `frontend/src/utils/empresa.js`):
- Fondo de página gris-azulado (`#EEF2F7`) y tarjetas de sección pasadas a blanco puro, con sombra real de dos capas (antes 4%, ahora 10%+6%) — las tarjetas "flotan" en vez de mezclarse con la página.
- El encabezado (logo + datos de empresa + Brother) pasa a tener su propia tarjeta blanca (`.header-card`), igual que el resto de las secciones — antes quedaba flotando directo sobre el fondo, sin borde propio.
- Rail de acento de los títulos de sección más grueso (3pt → 5pt).
- Márgenes de página movidos de `@page margin` a `padding` del body con `background-clip: content-box`, para que el fondo gris quede como un marco parejo en los 4 lados (arriba, abajo y costados) en vez de depender de que el motor de impresión respete `@page` de forma pareja en todos los ejes.
- Logo de Brother real (`LOGO_BROTHER` en `empresa.js`), SVG oficial descargado de Wikimedia Commons, en vez del marcador punteado. El logo de HLS sigue pendiente (no se agregó ningún archivo propio).

**Verificación:** `npm run build` OK. Probado generando el PDF real con Chrome headless y datos de cliente ficticios — una sola hoja, sombra y marco visibles, logo Brother nítido en su caja de 20mm×8mm.

### v2.33: PDF de Orden de Servicio — pulido visual manteniendo el mismo estilo

**Cambios** (`frontend/src/utils/ordenServicioDoc.js`), sin tocar estructura ni datos:
- Chip de "Garantía" y chips de insumos unificados a píldora (antes radios distintos, 10pt y 9pt).
- Título "Orden de Servicio" con más peso (13pt → 15pt) para no competir en tamaño con el nombre de la empresa.
- RUT, teléfonos, serie y contador de páginas con cifras tabulares (`font-variant-numeric: tabular-nums`) para que las columnas de números alineen.
- Hairline antes de las firmas, igual al que ya tenía el encabezado.
- Chips con borde propio para no fundirse con el fondo de la tarjeta.

**Verificación:** `npm run build` OK.

### v2.32: PDF de Orden de Servicio — agregar RUT del cliente

Campo "RUT" agregado en la sección "Datos de Cliente — Contacto" del PDF, debajo de "Cliente" (`frontend/src/utils/ordenServicioDoc.js`). El dato ya llegaba en `orden.rut` desde el backend, solo faltaba mostrarlo.

### v2.31: el primer contacto de un cliente siempre es el principal

**Problema:** "contacto principal" no tenía respaldo en la base de datos — ninguna columna `orden`/`principal` en `clientes_contactos`. Era una convención que se sostenía solo porque el `GROUP_CONCAT` no tenía `ORDER BY` y MySQL devolvía las filas por `id` de casualidad. En `deploy/cloud` (Postgres) esa casualidad no se daba: `STRING_AGG(DISTINCT ...)` ordena alfabéticamente, así que en producción el "primer contacto" ya no era el principal.

**Solución:**
- `backend/routes/clientes.js` — `ORDER BY co.id` / `d.id` dentro de los `GROUP_CONCAT`/`STRING_AGG` de contactos y direcciones (GET `/` y GET `/:id`), en ambas ramas. En `deploy/cloud` se reescribió con subqueries correlacionadas en vez de `LEFT JOIN` + `GROUP BY` + `DISTINCT`, que además colapsaba contactos con datos idénticos.
- `ClienteFormulario.jsx` — si hay contactos adicionales, exige nombre en el contacto principal antes de guardar (evita que se vacíe y el siguiente contacto pase a ser principal sin darse cuenta).
- `OrdenFormCliente.jsx` — en "Otros Contactos" de la OT, ya no se puede volver a agregar el contacto elegido arriba en la orden (antes solo se filtraban los ya agregados como extra).

**Verificación:** `npm run build` OK en ambas ramas. Probado contra MySQL local: cliente con principal alfabéticamente posterior a un extra mantiene el orden correcto tras guardar y recargar.

## Fecha: 2026-08-31 (4)

### v2.30: PDF de Orden de Servicio — layout más compacto para entrar en una sola hoja

**Problema:** el documento generado en v2.29 solía ocupar 2 hojas incluso con contenido moderado: cada sección era una tarjeta con bastante padding/margen, los cuadros de texto (Falla/Informe Técnico/Observaciones) reservaban 14mm de alto mínimo aunque tuvieran poco texto, y el bloque de firma dejaba 14mm de aire arriba de la línea.

**Solución:** `frontend/src/utils/ordenServicioDoc.js` — márgenes de página, tipografía, padding de secciones y separación entre bloques más chicos; se saca el alto mínimo fijo de los cuadros de texto (ahora ocupan solo lo que su contenido necesita); espacio de firma reducido de 14mm a 7mm. Mismo contenido y orden de datos, solo se aprieta la maquetación.

**Verificación:** `npm run build` OK en frontend. Nota: si una orden tiene mucho texto cargado en Falla/Informe/Observaciones, puede seguir necesitando una segunda hoja — eso es volumen real de contenido, no diseño.

## Fecha: 2026-08-31 (3)

### v2.29: PDF de Orden de Servicio (implementación real, reemplaza el placeholder de v2.27) + limpieza en el visor de adjuntos

**Cambios:**
- Botón "PDF" del menú de acciones de la OT: en vez de `alert("Próximamente")`, abre `ModalOpcionesPDF` (nuevo) — deja elegir qué insumos, contactos adicionales, direcciones adicionales y secciones (falla/incidencia, informe técnico, observaciones, firma) entran en el documento, con "Todos/Ninguno" por grupo. Por defecto reproduce el informe en papel: contacto principal + insumos cargados; los extras son opt-in.
- `frontend/src/utils/ordenServicioDoc.js` (nuevo) — genera el HTML imprimible de la Orden de Servicio (membrete de empresa, datos de cliente/contacto, datos de equipo/técnico, insumos como chips, secciones de texto, pie con firma y condiciones legales). Diseño con tarjetas de fondo tenue por sección, barra de acento en vez de línea completa en los títulos, folio como badge con degradé y chips rellenos — mismo orden de datos que el informe en papel, solo cambia la piel visual.
- `frontend/src/utils/empresa.js` (nuevo) — datos de la empresa y texto legal del pie, centralizados para reusar en otros documentos a futuro.
- `frontend/src/utils/imprimir.js` (nuevo) — `imprimirHtml()`, genérico: imprime cualquier HTML armado en un iframe oculto (mismo patrón que ya usaba `imprimirAdjunto()` en `OrdenFormCliente.jsx`, ahora reutilizable).
- El PDF se genera con el diálogo de impresión del navegador ("Guardar como PDF"); el modal indica que en "Más ajustes" se puede desmarcar "Encabezados y pies de página" para sacar el título/URL que Chrome agrega arriba y abajo de cada hoja — es una preferencia del navegador, no controlable desde la página.
- `OrdenFormCliente.jsx` — en el visor de adjuntos, el botón "Descargar" de abajo ya no se muestra para adjuntos PDF: el visor nativo del navegador (el `<iframe>` que renderiza el PDF) ya trae su propia barra con impresión/descarga, así que el botón de la app era redundante. Para imágenes se mantienen "Imprimir" y "Descargar" igual que antes.

**Verificación:** `npm run build` OK en frontend.

## Fecha: 2026-08-31 (2)

### v2.28: Órdenes de Trabajo — la edición y el cambio de cliente ya no arrastran contacto/direcciones obsoletos

**Problema:**
- Al editar un cliente desde dentro del formulario de OT, si se le cambiaba el nombre al contacto principal (o a una dirección/contacto extra ya cargados en la OT), la resincronización los perdía: buscaba la coincidencia por nombre/dirección exacto y, al no encontrarlo, dejaba los datos viejos en la OT.
- Al reseleccionar en la OT el mismo cliente que ya estaba cargado (modo edición), el código cortaba con un `return` temprano y no reflejaba cambios que se le hubieran hecho al cliente por fuera de la OT (razón social, dirección, rut, email, fono).
- Al elegir un cliente nuevo o distinto en la OT, se autocompletaba `contacto`/`fonoContacto`/`emailContacto` con el contacto principal registrado del cliente, asumiendo que siempre es el correcto.

**Solución:**
- `frontend/src/components/ordenes/OrdenFormCliente.jsx` — al guardar la edición de un cliente, además de buscar el contacto/dirección/contacto-extra por nombre, si no hay coincidencia se lo sigue por la posición que ocupaba en la lista del cliente antes del guardado (se arma `todosContactos`/`direcciones`/`contactosExtra` "antes" y "después" con los mismos parsers). Así un renombrado no rompe el vínculo con la OT.
- `frontend/src/pages/OrdenTrabajo.jsx` — al seleccionar el mismo cliente en modo edición, ahora sí se refrescan sus datos propios (razón social, dirección, comuna, rut, email, fono) sin tocar equipo, contacto ni direcciones/contactos extra. Al elegir un cliente nuevo o distinto, `contacto`/`fonoContacto`/`emailContacto` quedan vacíos en vez de autocompletarse con el contacto principal del cliente.

**Verificación:** `npm run build` OK en frontend.

## Fecha: 2026-08-31

### v2.27: Ajustes UI en Órdenes de Trabajo — buscador de contacto y botón PDF

**Cambios:**
- `frontend/src/components/ordenes/OrdenFormCliente.jsx` — el campo "Buscar Contacto" (antes "Buscar Contacto (por nombre o correo)", ahora solo "Buscar Contacto") ya no usa un `maxWidth` fijo de 268px: se envuelve en un grid con la misma fórmula (`repeat(auto-fill, minmax(200px, 1fr))`, gap 20px) que usa `.of-form-grid` en la fila de Email/Fono/Contacto de abajo, así queda con el mismo ancho que el campo Email en cualquier tamaño de pantalla.
- `frontend/src/components/ordenes/OrdenAcciones.jsx` — nuevo botón "PDF" (ícono `FileDown`) en el menú de acciones de cada orden, junto a Informe/Cotización. Todavía no genera nada: el `onClick` solo muestra `alert("Próximamente")` como placeholder hasta que se implemente la generación del PDF de la OT.

**Verificación:** `npm run build` OK en frontend.

## Fecha: 2026-08-25 (5)

### v2.26: Rendimiento — cache en el frontend y gzip en el backend para el cambio entre mantenedores

**Problema:** en producción (Vercel/Render, backend en plan free), cambiar de mantenedor (Clientes → Equipos → Órdenes de Trabajo) tardaba en mostrar los datos en cada cambio, no solo en la primera carga del día.

**Causa:** dos cosas independientes se sumaban:
- El backend no comprimía las respuestas (sin `compression`), así que todo el JSON viajaba entero — el listado de OT trae ~50 columnas y el de clientes concatena direcciones y contactos por fila.
- El frontend no tenía cache entre páginas: cada `useEffect` de montaje (`Clientes.jsx`, `Equipos.jsx`, `OrdenTrabajo.jsx`) volvía a pedir el dataset completo, incluso volviendo a un mantenedor visitado segundos antes. OT además siempre pedía clientes y equipos completos al montar, aunque solo se usan al abrir el formulario.

**Solución:**
- `backend/server.js` (ambas ramas) — `app.use(compression())` antes de las rutas. `backend/package.json` — agregada la dependencia `compression`.
- `frontend/src/services/cache.js` (nuevo) — cache en memoria de listados con TTL de 60s y deduplicación de requests en vuelo (`getCached`), más `invalidar(prefijo)`.
- `frontend/src/services/api.js` — el interceptor de respuesta invalida automáticamente el cache del recurso ante cualquier escritura (POST/PUT/DELETE), así ninguna pantalla necesita invalidar a mano.
- Migrados a `getCached` los listados de `Clientes.jsx`, `Equipos.jsx`, `OrdenTrabajo.jsx` (órdenes, clientes, equipos) y `GestionUsuarios.jsx`. Los `GET /:id` y el correlativo de OT siguen siendo requests directos, siempre frescos.
- `Clientes.jsx` y `Equipos.jsx` ganan estado de carga (`loading`), igual al que ya tenía OT, para no mostrar la tabla vacía mientras llega la primera respuesta.

**Verificación:** `npm run build` OK en frontend. Backend levanta sin errores con `compression` cargado. Revisado a mano que ningún `GET /:id` ni el correlativo de OT quedaron cacheados (evita repetir el bug de adjuntos de v2.25) y que las mutaciones de Usuarios (rutas bajo `/api/auth/...`) invalidan el listado `/api/auth/usuarios` por prefijo compartido. Pendiente: confirmar en el navegador contra producción que el segundo cambio de mantenedor ya no dispara request nueva.

## Fecha: 2026-08-25 (4)

### v2.25: Rendimiento — el listado de Órdenes de Trabajo ya no trae los adjuntos

**Problema:** cargar datos en producción (Vercel/Render) era lento, sobre todo Órdenes de Trabajo.

**Causa:** el listado pide hasta 10.000 órdenes en un solo request (`GET /api/ordenes?page=1&limit=10000`) y el backend hacía `SELECT *`, que incluye la columna `adjunto`: hasta 2 archivos de 5MB en base64 por orden (~13MB por fila). La tabla de listado nunca muestra el adjunto, solo se necesita al abrir una orden puntual.

**Solución:**
- `backend/routes/ordenes.js` (ambas ramas, `GET /`) — `SELECT *` reemplazado por la lista explícita de columnas sin `adjunto`. `GET /:id` no se toca, sigue trayendo la fila completa.
- `frontend/src/pages/OrdenTrabajo.jsx` — `editarOrden` y `verOrden` tomaban la fila directo del listado y leían `orden.adjunto` ahí mismo; sin el cambio de backend, guardar cualquier orden abierta así habría **borrado su adjunto** (el PUT manda `adjuntos: []`, que el backend interpreta como `null`). Ahora ambas funciones piden la orden completa por `id` (`GET /api/ordenes/:id`, endpoint que ya existía) antes de abrir el formulario.

**Verificación:** probado extremo a extremo contra MySQL local — creada una orden con adjunto real, confirmado que no aparece en el listado pero sí en el detalle, reenviado el mismo adjunto vía PUT (simulando `editarOrden` ya arreglado) y verificado que persiste. Reproducido también el bug que se evita: un PUT con `adjuntos: []` deja el adjunto en `null`. `npm run build` OK en ambas ramas.

---

## Fecha: 2026-08-25 (3)

### v2.24: Limpieza de código muerto (frontend)

**Motivo:** chequeo general del proyecto encontró componentes y CSS sin ningún importador ni uso real. No cambia comportamiento ni apariencia — nada de lo borrado se renderizaba.

**Archivos eliminados:**
- `frontend/src/components/clientes/ClienteExpandido.jsx` (149 líneas) — sin importadores; `Clientes.jsx` usa `ClienteLista` → `ClienteAcciones`, no este componente.
- `frontend/src/components/clientes/ClienteExpandidoAcciones.jsx` (59 líneas) — muerto por arrastre, su único importador era `ClienteExpandido.jsx`.

**Archivos modificados:**
- `frontend/src/styles/clientes-componentes.css` — eliminadas ~263 líneas de reglas exclusivas de `ClienteExpandido` (incluye restos de `OTAsociadas.jsx`, ya borrado en julio: `.btn-nueva-ot-header`, `.btn-editar-header`, `.btn-eliminar-header`, `.ots-asociadas`). Se conservaron las clases `acciones-*` (viven en `index.css` y las comparten `ClienteAcciones`, `EquipoAcciones`, `OrdenAcciones`, `UsuarioAcciones`, `OrdenFormCliente`).
- `frontend/src/App.jsx` — quitado el import duplicado de `./styles/index.css` (ya se importaba en `main.jsx`).

**Verificación:** `npm run build` OK (CSS del bundle: 45.41 kB → 41.87 kB). Sin referencias colgantes (`grep` de las clases y del componente sin resultados).

---

## Fecha: 2026-08-25 (2)

### v2.23: la paginación ya sobrevive a F5 en los 4 listados

**Problema:** estando en una página distinta de la 1 en Clientes, Órdenes, Equipos o Usuarios, al recargar con F5 la lista volvía a la página 1.

**Causa:** el `useEffect` que resetea la paginación al cambiar un filtro también corre en el montaje del componente (`useEffect` siempre se ejecuta después del primer render; el array de dependencias solo controla las corridas *siguientes*). Ese efecto pisaba con un `1` el valor recién restaurado desde `sessionStorage`. Por esto la persistencia de Clientes (v2.11) nunca funcionó de verdad, y el fix de Órdenes de más abajo (v2.22) tenía el mismo defecto de nacimiento. Equipos y Usuarios directamente no tenían persistencia.

**Solución:** nuevo hook compartido `frontend/src/hooks/usePaginacion.js`:
- `usePaginaPersistente(clave, filtros)` — restaura y guarda la página en `sessionStorage`, con una guarda `useRef` que omite el reset-por-filtro en el montaje (la corrección de fondo).
- `useClampPagina(pagina, setPagina, totalPaginas)` — evita quedar en una página vacía al eliminar el último registro de la última página.

Aplicado en `pages/Clientes.jsx`, `pages/OrdenTrabajo.jsx`, `pages/Equipos.jsx` y `pages/GestionUsuarios.jsx`, cada uno con su propia clave (`pagClientes`, `pagOrdenes`, `pagEquipos`, `pagUsuarios`). Equipos y Usuarios ganan persistencia y clamp que no tenían.

**Verificación:** confirmado en el navegador por el usuario — página 3 + F5 se mantiene en la página 3; escribir en un filtro sí vuelve a la página 1 (comportamiento intencional, evita quedar en una página que el resultado filtrado ya no tiene). `npm run build` OK.

---

## Fecha: 2026-08-25

### v2.22: la paginación de Órdenes de Trabajo ya no vuelve a la página 1 al editar/cancelar

**Problema:** estando en la página 2 o superior del listado de Órdenes de Trabajo, al abrir una orden con Editar y dar Cancelar (o la X del header) la lista volvía a la página 1. Lo mismo pasaba al Guardar Cambios de una orden existente y al Eliminar una orden.

**Causa:** `fetchOrdenes()` hacía `setPaginaActual(1)` de forma incondicional, y `cerrarFormulario()`, `guardarOrden()` y `eliminarOrden()` la llaman para refrescar la lista tras cada acción.

**Solución** (`frontend/src/pages/OrdenTrabajo.jsx`, mismo patrón que Clientes v2.11):
- Quitado el reset incondicional de `fetchOrdenes()`.
- `paginaActual` se inicializa desde `sessionStorage` y se persiste en cada cambio.
- Clamp para no quedar en una página vacía si se elimina el último registro de la última página.
- Al crear una orden **nueva** sí se salta a la página 1: el backend ordena por `id DESC`, así que la orden nueva queda primera y hay que verla.

**Verificación:** `npm run build` OK.

---

## Fecha: 2026-08-24 (2)

### Validación de formato de email en todos los ingresos de correo del sistema

**Problema:** Al editar un cliente se podía guardar un correo sin @ (y lo mismo podía pasar en cualquier otro formulario con email).

**Regla:** todo email **escrito a mano** se valida con formato básico `texto@texto.texto`. Los emails vacíos siguen siendo válidos (el campo es opcional). Mensaje corto: `Email inválido (...).`

**Cambios frontend:**
- `frontend/src/utils/helpers.js` — nueva función compartida `validarEmail(v)`.
- `frontend/src/components/clientes/ClienteFormulario.jsx` — valida Email empresa, Email contacto y contactos adicionales.
- `frontend/src/components/clientes/ModalContactos.jsx` — valida al guardar el modal de contactos adicionales.
- `frontend/src/pages/OrdenTrabajo.jsx` — `guardarOrden` valida Email, Email Contacto y contactos extra de la OT.
- `frontend/src/components/usuarios/UsuarioFormulario.jsx` — valida Correo del usuario.

**Cambios backend (ambas ramas):**
- `backend/routes/clientes.js` — POST/PUT rechazan 400 "Email inválido" si `email`, `contacto_email` o algún contacto adicional tiene formato inválido.
- `backend/routes/auth.js` — `/registrar` y `/actualizar-usuario/:id` rechazan 400 si el correo del usuario es inválido.

### Fix no se podía escribir en Email/Email Contacto de la OT + mensaje de cliente registrado

**Problema:** En Nueva/Editar Orden no se podía escribir en los campos Email y Email Contacto (ni en el email de contactos extra): cada tecla se revertía. En el formulario de Cliente sí funcionaba.

**Causa:** El helper compartido `upperInput()` llama a `el.setSelectionRange()`, que **lanza error en inputs `type="email"`** (la API de selección no existe para ese tipo). El onChange crasheaba antes de actualizar el estado y el input controlado volvía al valor anterior. Los emails del Cliente nunca usaron `upperInput`, por eso ahí funcionaba.

**Solución (v2.21):**
- `frontend/src/components/ordenes/OrdenFormCliente.jsx` — los 3 campos email de la OT usan `e.target.value` directo (igual que Clientes; respetan mayúsculas/minúsculas tal como se escriben).
- `frontend/src/utils/helpers.js` — `upperInput()` blindado con try/catch alrededor de la selección para que nunca más congele un input.

**Mejoras acompañantes (v2.20):**
- Mensaje tras "+ Registrar en Clientes" desde la OT en una sola línea: `Cliente registrado (CL-0019). Ya puede guardar la orden.`
- `noValidate` agregado a los `<form>` de OT, Cliente y Usuarios: el navegador ya no intercepta el guardado con su globo nativo de email — solo mandan nuestros avisos cortos ("Email inválido (...)", solo exige la @).

---

## Fecha: 2026-08-24

### RUT obligatorio + Razón Social obligatoria + RUT único robusto (fix web aceptaba duplicados/vacíos)

**Problema:** En la web se podían crear clientes con el mismo RUT o con RUT vacío.

**Causas:**
1. Frontend y backend solo validaban duplicado/formato **si el RUT venía con texto** (`if (rut && ...)`) — vacío pasaba siempre.
2. La comparación de duplicados solo quitaba puntos y espacios pero exigía guion+DV idénticos: un RUT guardado en BD con otro formato (sin guion, `k` minúscula) no matcheaba y el duplicado pasaba.
3. Bug en los chequeos de la OT: `dig()` usaba `[^0-9]` y **borraba la K** del dígito verificador.
4. El backend no validaba formato ni dígito verificador.

**Reglas nuevas (datos mínimos para crear/editar cliente):**
- **Razón Social**: obligatoria.
- **RUT**: obligatorio, válido (módulo 11) y único. Nombre de contacto queda opcional.
- **Comodín "19"**: escribir `19` en el campo RUT cuando no se conoce el RUT del cliente. Se puede usar en **todos los clientes que se quiera** (no es único ni se valida formato) y **permite repetir la Razón Social** (ej: varios clientes "SIN NOMBRE" con rut 19). Exento también del chequeo "el RUT pertenece a otro cliente" al guardar OT y de los avisos de duplicado, incluido el botón "+ Registrar en Clientes" desde la OT (crea directo sin chequear nada).

**Cambios frontend:**
- `frontend/src/utils/helpers.js` — nueva función compartida `normalizarRut(v)`: solo dígitos + K en mayúscula (`12.345.678-k` → `12345678K`). Ignora cualquier formato guardado.
- `frontend/src/components/clientes/ClienteFormulario.jsx` — en `handleSubmit`: valida Razón Social obligatoria, RUT obligatorio, RUT válido y duplicado comparando con `normalizarRut()` (excluye al cliente en edición).
- `frontend/src/pages/OrdenTrabajo.jsx` — chequeos de `guardarOrden` (existencia del cliente, dueño del RUT) ahora comparan con `normalizarRut()` (la K ya no se pierde). El filtro de búsqueda por dígitos del buscador no se tocó.
- `frontend/src/components/ordenes/OrdenFormCliente.jsx` — chequeo local de duplicado en "Registrar en Clientes" desde OT usa `normalizarRut()`.

**Cambios backend (`backend/routes/clientes.js`, ambas ramas):**
- Nuevos helpers: `normalizarRut()`, `validarRutChileno()` (formato + módulo 11), `buscarDuplicadoRut(rut, excluirId)` — trae los clientes y compara normalizado en JS, así matchea cualquier formato viejo guardado en la BD (MySQL y PostgreSQL comparten la misma lógica).
- `POST /api/clientes` y `PUT /api/:id`: rechazan 400 si falta Razón Social ("Complete la Razón Social del cliente"), si falta RUT ("Complete el RUT del cliente") o si el RUT es inválido; rechazan duplicado con el código CL-XXXX existente.
- La comparación incluye también clientes desactivados (activo=0).

**Nota:** Los clientes viejos sin RUT o con RUT inválido quedarán bloqueados al EDITAR hasta completarles un RUT válido y único. Sin migración de BD.

---

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

### Colores de los botones del header alineados con las tarjetas de Home

**Cambios (`frontend/src/components/*/Header*.jsx`, `HeaderOrdenTrabajo.jsx` via `navItems`, `pages/Informes.jsx`, `pages/Cotizaciones.jsx`, `pages/OrdenCompra.jsx`):**

Cada botón de navegación del header ahora usa el mismo color que su tarjeta en Home:

| Botón | Color |
|---|---|
| Inicio | `var(--gradient)` (degradado del header, para diferenciarse de Clientes) |
| Clientes | `var(--primary)` (era `var(--warning)`) |
| Equipos | `var(--success)` |
| Orden de Trabajo | `var(--warning)` (era `#6366F1`) |
| Informes Técnicos | `#EA580C` |
| Cotizaciones | `#DB2777` |
| Orden de Compra | `#1E40AF` |
| Usuarios | `#0D9488` |

**Archivos modificados (solo frontend):**
- `frontend/src/pages/OrdenTrabajo.jsx` — `navItems`: Inicio a `var(--gradient)`, Clientes a `var(--primary)`, OT a `var(--warning)` (el header OT usa `item.color`, así que se propaga solo)
- `frontend/src/components/clientes/HeaderCliente.jsx` — `colors[0]` a `var(--gradient)`, `colors[2]` (OT) a `var(--warning)`
- `frontend/src/components/equipos/HeaderEquipo.jsx` — Inicio `var(--gradient)`, Clientes `var(--primary)`, OT `var(--warning)`
- `frontend/src/components/usuarios/HeaderUsuario.jsx` — Inicio `var(--gradient)`, Clientes `var(--primary)`, OT `var(--warning)`
- `frontend/src/pages/Informes.jsx`, `pages/Cotizaciones.jsx`, `pages/OrdenCompra.jsx` — Inicio `var(--gradient)`, Clientes `var(--primary)`, OT `var(--warning)`

### OT a mano no crea ni vincula clientes en el mantenedor

**Cambio (`backend/routes/ordenes.js`):**
- `POST` y `PUT`: se eliminó el bloque que buscaba o creaba un cliente en `clientes` cuando se escribía a mano en la OT.
- Antes: si `clienteId` era `null`, se hacía `SELECT id FROM clientes WHERE razon_social = ?`, y si no existía se creaba un registro en `clientes` + dirección "Matriz" en `clientes_direcciones`.
- Ahora: `const finalClienteId = clienteId || null`. La OT se vincula al cliente **solo** si fue seleccionado del buscador (se envía `clienteId`). Si se escribió a mano, `cliente_id` en la OT queda `null` y los datos quedan solo en la tabla `ordenes_trabajo` (snapshot).
- El comportamiento es idéntico al de los **equipos**: la OT solo usa datos existentes para autocompletar, pero no registra ni vincula en los mantenedores.

### Campos extra en OT igualados al mantenedor: direcciones (Tipo/Ciudad) y contactos (Dirección Contacto)

**Cambios (`frontend/src/components/ordenes/OrdenFormCliente.jsx`):**

**Otras Direcciones / Sucursales:**
- Agregados campos **Tipo** (select Matriz/Sucursal) y **Ciudad**, que faltaban. Ahora tiene: Tipo | Dirección (fila 1), Ciudad | Fono | Comuna | Quitar (fila 2).
- Fix: `tipo_direccion` ya no se pasa por `toUpperCase()` en el parseo del select, para que coincida con los `<option value="Matriz">`/`"Sucursal"`.
- Compactación: padding, gaps y botones reducidos (igual estilo que el resto del form OT).

**Otros Contactos:**
- Agregado campo **Dirección Contacto** (el mantenedor de clientes ya lo tenía; faltaba en la OT).
- Ahora tiene: Nombre | Email | Fono | Dirección Contacto | Cargo | Quitar.
- Compactación de estilos igual que direcciones.

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
