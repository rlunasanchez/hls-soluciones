# Para continuar el viernes 27-nov-2026

Este archivo resume dónde quedó el trabajo al terminar el jueves 26-nov-2026 (el nombre del archivo es histórico). Se puede borrar cuando ya no haga falta.

**Frase para retomar:** "Lee AGENTS.md, CAMBIOS.md y CONTINUAR_LUNES.md; seguimos con …"

## 0. Resumen del jueves 26-nov-2026 y qué sigue (leer primero)

**Estado:** `main` y `deploy/cloud` sincronizados con GitHub tras la subida de cierre (v2.227 a v2.230). Neon ya tiene los 23 índices de v2.224 y la columna `cotizacion_items.descripcion` de v2.228 (las corrió el dueño). Detalle de cada versión, con **cómo era antes y cómo revertir**, en `CAMBIOS.md`.

**Agregado después del cierre (publicado): v2.231** arregla que al vaciar el fono o el email de un cliente desde la OT (o la cotización) el formulario conservaba los datos viejos; el servidor ya los vaciaba. Detalle y cómo revertir en `CAMBIOS.md` v2.231. Pendiente: que el dueño lo vea en su navegador (Ctrl+F5): editar un cliente desde la OT dejando el fono y el email en blanco debe dejarlos en blanco en la OT.

**Pendiente al retomar (27-nov-2026): confirmar y subir v2.232 y v2.233.** Están en commits locales, sin subir: v2.232 quita el encabezado y pie que el navegador dibujaba al imprimir el PDF de la OT y de la cotización (error mío de v2.229) y v2.233 es la auditoría de los cambios que no se reflejaban. Detalle y cómo revertir en `CAMBIOS.md`.

**OT que siguen mostrando un fono o email que el cliente ya no tiene (SQL para Neon; el dueño lo corre; primero la consulta, no cambia nada):**
- Las OT guardan una copia del dato. Las que ya guardaron el valor viejo antes del arreglo de v2.231 lo conservan. **Detectarlas** (OT vinculadas a un cliente que ya no tiene fono o email pero ellas sí):
```sql

SELECT o.id, o.numero_orden, o.cliente, c.codigo, o.fono_principal, o.email
FROM ordenes_trabajo o JOIN clientes c ON c.id = o.cliente_id
WHERE (COALESCE(c.telefono,'') = '' AND COALESCE(o.fono_principal,'') <> '')
   OR (COALESCE(c.email,'') = '' AND COALESCE(o.email,'') <> '')
ORDER BY o.id DESC LIMIT 100;
```
- Para ver las OT de un cliente concreto, vinculadas o no (la columna `cliente_id` vacía = no se sincroniza con el cliente): `SELECT o.numero_orden, o.cliente_id, o.fono_principal, o.email FROM ordenes_trabajo o WHERE o.cliente ILIKE '%PARTE DEL NOMBRE%' ORDER BY o.id DESC;`
- **Limpiarlas** (solo las de ese cliente; cambiar `CL-0001` por su código y revisar antes con la consulta anterior): `UPDATE ordenes_trabajo SET fono_principal = NULL, email = NULL WHERE cliente_id = (SELECT id FROM clientes WHERE codigo = 'CL-0001');`. No hacerlo para todos los clientes a la vez: a un cliente sin fono se le puede haber escrito uno a mano en la OT a propósito.
- Una OT sin `cliente_id` no se actualiza sola nunca; se corrige abriéndola y borrando el dato.

**Lo hecho hoy (todo publicado):**
- **v2.227:** «Buscar y Seleccionar Cliente» (OT y cotización) y «Buscar por Modelo» (OT) dentro del input; sin los títulos «Datos del Cliente» y «Datos del Equipo» sobre esos buscadores; «Glosa» alineada.
- **v2.228:** cotización: el Detalle del ítem queda pequeño (misma altura que Cant., no se agranda) y un check «Desc.» antes del Detalle muestra debajo un cuadro «Descripción» que sale en el PDF si se escribió. **Columna nueva `cotizacion_items.descripcion`** (ya en la MySQL local y en Neon).
- **v2.229:** el PDF tiene margen real en todas las hojas (la 2 ya no queda pegada al borde; también mejora las Órdenes de Servicio largas) y la descripción del ítem crece con su texto.
- **v2.230:** ficha de cliente **Empresa** en dos mitades armónicas (izquierda: empresa, RUT, razón social, fono y email; derecha: dirección, ciudad y comuna, alineada con el cuadro «Direcciones» de abajo), sin línea divisoria, campos de su tamaño, Tipo y RUT de 227 px también en Persona. Respaldo con nombre: etiqueta `respaldo-ficha-cliente-antes-v2.230`.
- Antes, el 25-nov: escalabilidad hasta Cotizaciones (v2.223 a v2.225), PDF de la cotización sin la razón social ni el RUT de HLS en el encabezado (v2.226).

**Primero mañana (en este orden):**
1. Comprobar los despliegues: Vercel (`gh api repos/rlunasanchez/hls-soluciones/deployments`, debe aparecer en Production el último commit de `main`) y Render (panel → Events → Live con el último commit de `deploy/cloud`; Logs sin errores). Reiniciar el backend local (`node server.js` en `backend/`) para usar el código nuevo.
2. Que el dueño vea en su navegador (Ctrl+F5) lo de hoy: los buscadores con el texto dentro del input, el check «Desc.» y su descripción en una cotización (formulario y PDF), y la ficha de cliente Empresa y Persona en escritorio y celular.
3. Hay una cotización de prueba en la MySQL local (folio 2800, «EMPRESA DE EJEMPLO SPA», creada por Claude): el dueño pidió borrar «la de prueba» y se borró la del folio 2801; **preguntar si borra también la 2800**.

**Pendientes de decisión (no urgentes):**
- Qué va en el encabezado del PDF de la cotización (hoy sin razón social ni RUT de HLS). Cómo era antes: `CAMBIOS.md` v2.226.
- Avisos en los Logs de Render: `url.parse()` de Node (DEP0169; no es de nuestro código, para saber qué paquete es se puede poner `NODE_OPTIONS=--trace-deprecation` en Render) y el cambio de `sslmode` de `pg` (solución: `?sslmode=verify-full` en la `DATABASE_URL`).
- Ficha de cliente Empresa: la tercera fila de la derecha queda libre; si se quiere, usarla o centrar cada bloque.
- Vínculos de la ficha en móvil (contactos y direcciones): hoy con scroll horizontal; podrían pasar a tarjetas.
- Después, sin fecha: historial de la OT, Informes y Orden de Compra (páginas vacías), pasar a tablas los JSON `contactos_extra`/`direcciones_extra` de la OT.

**Cómo se prueba sin tocar nada del dueño (método usado hoy, ver `CAMBIOS.md` v2.225 y v2.229):** backend contra una base MySQL temporal en el puerto 5099 (preload que cambia el 5001 por el 5099), frontend con `VITE_API_URL`, Chrome headless con `puppeteer-core`, capturas comparadas con `pixelmatch`, PDF real con `page.pdf` y `pdf-to-img`, PostgreSQL real con `embedded-postgres`. Los scripts están en la carpeta temporal de la sesión y no viajan; hay que rehacerlos.

## 1. Estado exacto

| | Versión | Commit |
|---|---|---|
| **Web publicada** (Render + Vercel + Neon) | **v2.220** (24-nov-2026; v2.209 el 20-nov con el SQL de Neon) | ver `git log` de `main` y `deploy/cloud` (el despliegue de Render no se pudo comprobar) |

- Árbol de trabajo limpio (solo `.claude/` sin versionar). No hay worktrees abiertos. **Neon:** v2.195 a v2.208 no tocaron la base de datos. v2.209 sí: el dueño corrió en Neon el 20-nov el `ALTER … cliente_tipo` (19-nov) y el bloque de migración de `CAMBIOS.md` v2.209 (tabla `cotizacion_items`, columnas con los nombres de la OT, montos en columnas, JSON eliminado); se verificó listando las columnas de `cotizaciones`. **Neon ya está al día, no hay SQL pendiente.**
- Las dos ramas se publican con una carpeta temporal (`git worktree add "$env:TEMP\hls-cloud" deploy/cloud`, `git merge main`, push de `deploy/cloud` y luego de `main`, y quitar la carpeta), para no cambiar la rama de la carpeta del dueño. Los `git push` se hacen desde **PowerShell**.
- El 17-nov-2026 Claude pudo hacer `git push` desde PowerShell sin bloqueo (v2.200 a v2.204, cada vez con orden expresa del dueño: «documenta y sube»). Si el clasificador lo bloquea, el dueño lo escribe con `! git push …`. **Solo se publica con la orden expresa del dueño.**
- Los datos de la base de **producción (Neon) y la local se borraron**: eran de prueba. Los usuarios (`admin`, `rluna`, `rzuniga`) se conservan. La numeración de OT parte de `OT-2026-02800` y los códigos de `CL-0001`.
- La contraseña de `admin` en Neon se restableció a `admin123` el 10-nov-2026 (el dueño debe cambiarla desde Gestión de Usuarios). La de la base local es la de `ADMIN_PASSWORD` del `.env`.

## 1b. Lo hecho el lunes 23-nov-2026 (v2.210 a v2.213, todo solo frontend, ya subido) y por dónde seguir

Detalle de cada versión en `CAMBIOS.md`. Todo en `main` `5fe670d` y `deploy/cloud` `f2e1e8c`; no hubo SQL de Neon ni cambios de backend. **Ninguno se ha visto en pantalla todavía** (el dueño probó con datos de prueba en local, ya borrados).

- **v2.210:** lista de Cotizaciones estándar: barra de filtros en una fila (`FiltrosCotizacion.jsx`, nombres dentro de los campos, 200 × 30 px), paginación arriba y filas según el alto de la pantalla.
- **v2.211:** pantalla de **Usuarios** estándar (`FiltrosUsuario.jsx`: Nuevo Usuario, Cambiar Password, filtro, Limpiar y paginación en una fila; filas según la pantalla). Con esto **ya no quedan desvíos del estándar** entre las listas (Clientes, Contactos, Direcciones, Equipos, OT, Cotizaciones y Usuarios).
- **v2.212:** «Ejecutivo y Condiciones» del formulario de cotización en dos líneas de tres campos (`of-r3`).
- **v2.213:** «Válido hasta» del PDF de la cotización pasó a la barra del título, junto a «Emisión» (antes iba abajo y no se notaba). La fecha siempre se guardó bien; si el dueño dice que sigue sin verse, pedir el folio y mirar `cotizaciones.fecha_valido_hasta`.
- **v2.214 (24-nov-2026):** en los ítems del formulario de cotización, Detalle quedó entre SKU y Cantidad y el «Ítem N» pasó a ser solo el número al lado del SKU (la papelera para quitar el ítem va al final de la fila). Sin ver en pantalla.
- **v2.230 (26-nov-2026, en local, sin subir):** ficha de cliente **Empresa**: el recuadro de la empresa mitad y mitad con las filas alineadas, sin línea divisoria y con los campos de su tamaño de siempre (izquierda: empresa, RUT, razón social, fono y email; derecha: dirección, ciudad y comuna). Persona sin cambios. Cómo era antes y cómo volver en `CAMBIOS.md` v2.230. Respaldo con nombre: etiqueta `respaldo-ficha-cliente-antes-v2.230`.
- **v2.229 (26-nov-2026, publicado):** PDF con margen real en todas las hojas (la 2 ya no queda pegada al borde; también mejora las Órdenes de Servicio largas) y la descripción de cada ítem crece con su texto. Hay una cotización completa de prueba en la MySQL local (folio 2801; borrarla desde la lista cuando ya no sirva). Detalle en `CAMBIOS.md` v2.229, **con cómo era antes y los comandos para revertir** (también para v2.228: el Detalle de 40 px sin check).
- **v2.228 (26-nov-2026, publicado):** cotización: el Detalle del ítem queda pequeño (misma altura que Cant., no se agranda) y un check «Desc.» antes del Detalle muestra debajo un cuadro «Descripción» que sale en el PDF si se escribió. **Columna nueva `cotizacion_items.descripcion`:** aplicada en la MySQL local; en Neon hay que correr `ALTER TABLE cotizacion_items ADD COLUMN IF NOT EXISTS descripcion TEXT;` (confirmar que el dueño lo corrió). Hay una cotización de prueba en la MySQL local (borrarla desde la lista). Detalle en `CAMBIOS.md` v2.228.
- **v2.227 (25-nov-2026, publicado):** «Buscar y Seleccionar Cliente» (OT y cotización) y «Buscar por Modelo» (OT) dentro del input; sin los títulos «Datos del Cliente» ni «Datos del Equipo» sobre esos buscadores; «Glosa» alineada con las demás cajas. Detalle en `CAMBIOS.md` v2.227. Sin ver en el navegador del dueño.
- **v2.226 (25-nov-2026):** el PDF de la cotización ya no muestra la razón social ni el RUT de HLS en el encabezado (pedido del dueño: «de momento, luego veremos qué hacer ahí»). Pendiente de decidir qué va en ese lugar (¿el recuadro «COTIZACIÓN N° / RUT», nada, otra cosa?); cómo era antes y cómo recuperarlo están en `CAMBIOS.md` v2.226.
- **v2.223, v2.224 y v2.225 (escalabilidad, 25-nov-2026): publicados junto con v2.226.** Detalle y método de prueba en `CAMBIOS.md`. Resumen: Contactos, Direcciones y Cotizaciones paginados y filtrados en el servidor, residuos de Clientes y Equipos, índices, hooks de listado unificados (`useListadoPaginado`), `HeaderModulo` y `BarraFiltros` únicos, `index.css` partido en 6 archivos y CSS de formularios compartido (`mantenedor.css`). Probado con 20.000 registros por tabla en MySQL y PostgreSQL reales y con 44 capturas comparadas píxel a píxel. **Todo publicado y cerrado el 25-nov-2026:** `main` `50100ef` (Vercel, desplegado) y `deploy/cloud` `b66fb01` (Render, confirmado por el dueño); el SQL de índices de `CAMBIOS.md` v2.224 ya está corrido en Neon (23 índices verificados) y el índice `idx_ot_cliente_id` ya está en la MySQL local (hay que reiniciar el backend local para usar el código nuevo). **Qué mirar al probar en pantalla:** las listas de Contactos, Direcciones, Cotizaciones, Clientes y Equipos (filtros y paginación), la barra de filtros de Clientes y los formularios de Contactos y Direcciones en móvil (cambiaron por estandarización, ver v2.225).
- **v2.222 (25-nov-2026):** separación en las tarjetas móviles de los listados (etiqueta/valor y pie de Usuarios) y revisión con datos reales; detalle en `CAMBIOS.md` (agrupado con v2.221 abajo).
- **v2.221 (25-nov-2026):** revisión de todas las vistas en móvil (320 a 768 px, con Chrome headless): ficha de cliente sin campos cortados, vínculos de contactos y direcciones visibles (con scroll horizontal) y Usuarios sin la tabla de escritorio duplicada. Detalle y método en `CAMBIOS.md`. Sin ver en el celular real. También: separación en las tarjetas de los listados y el pie de las de Usuarios. Pendiente posible: vínculos en tarjetas y filtros móviles de Cotizaciones/Usuarios/OT iguales a los de Clientes. Los datos de prueba «PRUEBA MOVIL» ya se borraron de la base local (verificado). Si el dueño sigue viendo campos cortados en el celular, pedirle una captura: en el barrido (320 a 1024 px) no quedó ninguno.
- **v2.220 (24-nov-2026):** «Ejecutivo y Condiciones» con la sangría de las cajas de Contacto y Dirección (caja transparente `of-caja`). El dueño lo seguía viendo igual antes de reiniciar su local; **sin confirmar en pantalla**. Pendiente: Glosa con el mismo margen. Detalle en `CAMBIOS.md`.
- **v2.219 (24-nov-2026):** registrar un cliente (o contacto, dirección, equipo) desde el modal ya no guarda ni cierra la cotización/OT que está debajo (el `submit` del portal subía al formulario padre). Detalle en `CAMBIOS.md`. Sin ver en pantalla: probar registrar cliente desde una cotización nueva y agregar ítems.
- **v2.218 (24-nov-2026):** la **Glosa** de la cotización va en su propia caja y «Ejecutivo y Condiciones» recuperó su fondo celeste (`#e0f7fc`) manteniendo el título de v2.217; alto de los campos igual que Cliente/Dirección (23,06 px; medido). Pendiente posible: el buscador (`.bc-input`) mide 24 px, 1 px más que el resto; no se tocó porque es compartido con la OT y la ficha de cliente (el dueño no ha pedido cambiarlo). Sin ver en pantalla.
- **v2.217 (24-nov-2026):** «Ejecutivo y Condiciones» del formulario de cotización pasó a la misma caja y título que Cliente/Contacto/Dirección y fechas/lista a 23,06 px de alto. **Colores anteriores** (celeste `#e0f7fc` = `--success-light`, título `of-st` 10 px) y cómo volver (`git checkout 3d4f9cf -- frontend/src/components/cotizaciones/CotizacionFormEjecutivo.jsx`) en `CAMBIOS.md` v2.217. **Aprendido:** para igualar alturas se puede medir en Chrome headless (`chrome.exe --headless=new --window-size=1500,900 --dump-dom` con un HTML de prueba que escriba las medidas en el DOM; con `Start-Process -RedirectStandardOutput`); la ventana por defecto activa el estilo móvil.
- **v2.216 (24-nov-2026):** en el formulario de cotización se quitó el título «Datos del Cliente» (opción `sinTitulo` de `OrdenFormCliente`; la OT lo conserva). Sin ver en pantalla.
- **v2.215 (24-nov-2026):** ficha de cliente: en **Empresa** el recuadro de la empresa va arriba a todo el ancho (campos del mismo tamaño, con una marca en la mitad) y Contactos | Direcciones debajo, cada uno con la mitad del ancho; la ficha de **Persona** ahora mide lo mismo que la de Empresa (antes 1000 px). Costó varias idas y vueltas: el dueño quiere Contactos y Direcciones siempre **abajo y lado a lado**, el recuadro de la empresa **sin estirar sus campos**. **Cómo volver al diseño anterior:** `git checkout e9a94fd -- frontend/src/components/clientes/ClienteFormulario.jsx frontend/src/styles/Clientes.css` (detalle en `CAMBIOS.md` v2.215). Sin ver en pantalla.
- **Regla permanente del dueño: «todo el proyecto debe ser estándar»** (`AGENTS.md` sección 8): antes de entregar una pantalla, compararla con sus hermanas; si algo se desvía, avisar y ofrecer estandarizarlo. También está en la memoria de Claude.

**Primero mañana (en este orden):**
0. Ver en pantalla lo del 24-nov: que registrar un cliente desde una cotización nueva ya no la guarda ni la cierra (v2.219), y si «Ejecutivo y Condiciones» quedó alineado con Contacto y Dirección (v2.220; si no, medir en Chrome headless). Luego alinear «Glosa» igual si el dueño lo pide.
1. Comprobar los despliegues: Vercel (`gh api repos/rlunasanchez/hls-soluciones/deployments`, debe aparecer `01f93dc` (v2.220) en Production) y Render (panel → Logs; `gh` no lo muestra).
2. Que el dueño abra la web con Ctrl+F5 y mire, sin datos de prueba (la web y la base local están vacías salvo los usuarios): lista y formulario de Cotizaciones, PDF de la cotización (empresa y persona, «Válido hasta»), y la pantalla de Usuarios. Si hace falta volver a cargar datos de prueba, usar una marca reconocible («PRUEBA PAG», códigos 99xx), no crear registros reales mientras estén y borrarlos al terminar.
3. Seguir con lo que pida el dueño sobre Cotizaciones (venía ajustando el formulario y el PDF paso a paso). Pendientes ya conocidos: listado de Cotizaciones en el servidor (hoy carga hasta 10.000 y filtra en el navegador; en el backend el listado ya devuelve `limit`/`page`) y la duda abierta del contacto «que a veces se va» al crear una cotización desde una OT (por código llega completo; las OT de una persona no tienen contacto por diseño).
4. Después, sin fecha: historial de la OT (decisiones en la sección 3), Informes y Orden de Compra (páginas vacías), y pasar a tablas los JSON `contactos_extra`/`direcciones_extra` de la OT (el dueño quiere «todo con tablas»; aún no lo pidió para la OT).

## 2c. Cotizaciones adaptada como la OT (v2.209, 20-nov-2026)

Detalle completo en `CAMBIOS.md` (v2.209, con el SQL de Neon) y `AGENTS.md`. Resumen: formulario con los componentes de la OT (`Cotizaciones.jsx` 73 líneas), todo en tablas (`cotizacion_items` y montos `neto`/`iva`/`total` en columnas, calculados por el servidor), columnas con los nombres de la OT, vínculos y sincronización con los mantenedores como la OT, PDF al estilo de la OT (estilos en `utils/pdfEstilos.js`). Probado con MySQL y PostgreSQL reales; **el formulario y el PDF no se han visto en pantalla**.

**Estado de la publicación (20-nov-2026):** SQL corrido en Neon → `deploy/cloud` `71fb4dd` subida → `main` `7b142c9` subida. **Sin comprobar:** que Render terminó de desplegar (`gh` solo muestra Vercel; revisar el panel de Render → Logs) y que Cotizaciones funciona en la web. **Primera tarea al retomar:** abrir la web (Ctrl+F5), entrar a Cotizaciones, crear una cotización de prueba con un cliente (y borrarla), y si falla copiar el error de los Logs de Render.

**23-nov-2026 (v2.210):** la lista de Cotizaciones quedó estándar (barra de filtros en una fila con los nombres dentro de los campos, paginación arriba, filas según la pantalla). El dueño fijó la regla «todo el proyecto estándar» (`AGENTS.md` sección 8). **v2.211:** la pantalla de **Usuarios** también quedó estándar (barra de filtros en una fila, paginación arriba, filas según la pantalla): ya no quedan desvíos conocidos. Datos de prueba: la base local está vacía (usuarios intactos). **v2.212:** «Ejecutivo y Condiciones» del formulario de cotización en dos líneas de tres campos (`of-r3`). **Sin ver en pantalla:** las listas de Cotizaciones y Usuarios y el formulario de cotización. **v2.213:** «Válido hasta» pasó a la barra del título del PDF de la cotización, junto a «Emisión» (antes iba abajo y no se notaba). El dueño sigue ajustando el formulario y el PDF de Cotizaciones; preguntar qué falta.

**Lo que sigue en Cotizaciones:** que el dueño pruebe en pantalla (empresa y persona, crear desde una OT, editar un contacto y ver que se actualiza, PDF); listado de Cotizaciones en el servidor como la OT (hoy carga hasta 10.000 y filtra en el navegador); la OT mantiene `contactos_extra`/`direcciones_extra` como JSON (cambio aparte, no pedido aún). Duda abierta: el dueño dijo que «a veces se va el contacto» al crear desde una OT (por código llega completo; las OT de una persona no tienen contacto por diseño).

**Datos de prueba:** el 20-nov se borraron **todos** los datos de la base local (clientes, contactos, direcciones, equipos, OT y cotizaciones; los usuarios se conservan) y la carpeta `Escritorio\prueba_adjuntos`. La numeración vuelve a empezar: `OT-2026-02800`, `CL-0001`, folio 2800.

## 2b. Publicado el 18-nov-2026 (v2.205 a v2.207)

Detalle en `CAMBIOS.md`. Solo frontend. El dueño vio v2.207 funcionando en su local; **v2.205 y v2.206 sin probar en la web**.

- **v2.205:** las filas por página dependen del alto de la pantalla en Clientes, Contactos, Direcciones, Equipos y OT (`hooks/useFilasPorPantalla.js`: `(alto de ventana − 280) / 58`, 4 a 20 filas, 4 en móvil). **Los números 280 y 58 son estimaciones sin medir**: si sobra o falta espacio, ajustarlos en el hook. La columna del punto rojo de la lista de OT tiene el título «Cotizado» (el punto queda igual).
- **v2.206:** en Cotizaciones la columna del punto naranja tiene el título «Con OT». PDF de la OT con el fondo de página blanco.
- **v2.207:** línea de división del PDF de la OT fina: `box-shadow: 0 0 0 .4pt #64748B` en `.header-card` y `.sec` (sin `border`, porque Chrome/Edge no dibujan bordes menores a 1 px; sin la sombra suave de antes). Para cambiar el grosor se toca ese `.4pt`.
- **Aprendido (PDF):** al imprimir con la vista previa del navegador sale en blanco y negro si la impresora es monocromática o sin color por defecto (menú «Color» del diálogo); con «Guardar como PDF» sale en color. No es del código: el SVG azul del logo de Brother y los azules de los textos siguen en el HTML y `print-color-adjust: exact` está puesto.
- **Aprendido (trabajo con el dueño):** hacer **solo** el cambio pedido (en el PDF toqué bordes y sombras sin que me lo pidieran y hubo que revertir); si un mensaje es ambiguo o llega sin imagen, preguntar antes de tocar. «Más sutil/tenue» puede significar **más delgado**, no más claro.
- **Datos de prueba:** se insertaron y borraron varias veces registros «PRUEBA PAG» (códigos 99xx, también 3 cotizaciones con folio 99xxx) en la base local; verificado que no queda ninguno.

## 2a. Publicado el 17-nov-2026 (v2.200 a v2.204): todo sin probar en pantalla

Detalle en `CAMBIOS.md`. Build OK en todas; **el dueño debe probarlas en la web con Ctrl+F5**. Se vieron en local con datos de ejemplo («PRUEBA PAG», ya borrados).

- **v2.200 (backend + frontend):** editar un cliente ya no borra fono/RUT/email de sus OT (solo se pisa el dato que cambió; `routes/clientes.js` portado a PostgreSQL, probado solo por revisión del SQL, **no** con `embedded-postgres`). Sin textos grises de referencia (placeholders) en la OT, Clientes, Contactos, Direcciones y Equipos. Botón «Nuevo …» dentro de la fila de filtros. Filtros de la lista de OT en recuadro blanco, una línea desde 1200 px, alto 30 px.
- **v2.201:** la paginación (solo los botones) sube a la fila de filtros, al lado de **Limpiar**, en OT y los cuatro mantenedores (`Pagination enLinea`).
- **v2.202 y v2.203:** vuelven los textos de ayuda de los buscadores de la ficha del cliente; las altas rápidas de contacto y dirección de la ficha usan etiqueta arriba (sin texto adentro); etiquetas de la ficha del cliente en mayúsculas; **6 registros por página** en Clientes, Contactos, Direcciones y Equipos (OT, Cotizaciones y Usuarios siguen en 4).
- **v2.204:** títulos de columna de la lista de Clientes en mayúsculas.
- **Qué mirar:** que **Limpiar** no quede pegado a «Hasta» en la OT, que los filtros no se amontonen entre 769 y 1199 px, que la paginación en línea se vea bien en móvil, y cuántas filas caben realmente (si 6 es poco o mucho: una constante por módulo, ver v2.203). Cotizaciones comparte las clases de filtros de la OT y también cambió (recuadro, una línea): revisarla.
- **Aprendido:** la base local lleva códigos «máximo + 1»; los datos de ejemplo con código 99xx se borran con una consulta acotada (código **y** nombre «PRUEBA PAG»); no crear registros reales mientras estén cargados.

## 2. Publicado el 10, 11 y 12-nov-2026 (v2.195 a v2.199) y qué falta probar

Detalle de cada uno en `CAMBIOS.md`. Todo subido a la web; **lo marcado "sin probar" lo tiene que probar el dueño en pantalla (en la web, con Ctrl+F5)**.

- **v2.195:** aviso del contacto/dirección no registrado ya no dice "ya no está vinculado" (dice "no está vinculado… primero Regístralo").
- **v2.196:** Registrar cliente desde la OT abre con el tipo elegido (Persona/Empresa) y una persona conserva la dirección de la OT (se vincula desde Direcciones). **Persona: probada y funciona. Sin probar:** Empresa, y cambiar el tipo dentro de la ficha (la dirección aparece al pasar a Persona; si se quita no vuelve).
- **v2.197 (sin probar):** contacto, dirección y equipo escritos a mano ya no se bloquean mientras se escribe; solo se bloquean si vienen del buscador o de una OT guardada. Si el dato elegido está en el catálogo se completan los campos vacíos (ciudad, comuna, email, fono, cargo). Pruebas: escribir a mano una dirección, un contacto y un equipo que ya existen y completar los demás campos; elegirlos del buscador (deben bloquearse con **Editar**); guardar y reabrir la OT (deben verse bloqueados). Riesgo conocido: lo escrito a mano que difiere del registro queda enlazado y se pisa si luego se edita el registro en el mantenedor (v2.191).
- **v2.198 (sin probar):** los correos se ven como se escribieron (no en mayúscula) en Clientes, Contactos, Usuarios y en la tabla de contactos de la ficha del cliente. Los ya guardados en mayúscula se siguen viendo así.
- **v2.199 (backend):** el número de OT ya no falla con guardados simultáneos (cola + reintento, probado en MySQL y PostgreSQL) y el backend en la nube responde 404 en vez de `ENOENT` por `index.html`. **El backend local del dueño no se recarga solo: hay que reiniciarlo** (`node server.js` en `backend/`).
- **Aprendido:** los fallos raros en la web pueden ser Render/Neon gratis despertando o reiniciándose tras un push (esperar y repetir). El log se ve en el panel de Render → servicio → **Logs**.

## 3. Lo que sigue (orden acordado con el dueño)

0. **Primero lo de la sección 1b** (comprobar despliegues, ver en pantalla lo del 23-nov y seguir con Cotizaciones según pida el dueño).
1. **Probar en la web** (Ctrl+F5) lo marcado "sin probar" de las secciones 2b, 2a y 2 y avisar si algo falla; en especial las filas por página (v2.205) y los títulos «Cotizado» / «Con OT». Verificar también que Render terminó de desplegar `e736952` (`gh` solo muestra Vercel; Render se ve en su panel → Logs) y que **editar un cliente ya no vacía el fono de las OT** (v2.200, el arreglo original del día).
   - **Pendiente de probar a fondo:** el cambio de `routes/clientes.js` en PostgreSQL con `embedded-postgres` (`embedded-postgres` no está instalado en el PC del dueño; instalarlo en una carpeta temporal según la sección 7).
   - **Pendiente de decidir:** las cuatro decisiones del historial de la OT (punto 2).
2. **Historial de la OT** (quién creó, modificó y entregó): propuesta en `AGENTS.md` sección 7, "Próximo cambio acordado". Decisiones por tomar con el dueño: historial completo (recomendado) o solo "creada por / última modificación por"; si registrar adjuntos y eliminaciones; aviso de edición simultánea (comparar `fecha_actualizacion`); si eliminar una OT deja rastro o pasa a "eliminada". Hoy el sistema solo guarda `fecha_creacion` y `fecha_actualizacion`, sin el usuario.
3. **Después, sin fecha** (ver `AGENTS.md`): corrección masiva opcional con confirmación (ligada al historial); si dirección y contacto de OT antiguas deberían quedar congelados; Cotizaciones adaptada como la OT (empresa/persona, cliente eliminado, contacto asociable; `NOTAS-COTIZACIONES.md`); Informes y Orden de Compra (páginas vacías); importar el histórico del sistema antiguo (`BASE_DATOS_ANTIGUA.md`).

## 4. Qué se hizo el 22 y 23-oct-2026 (resumen)

Todo está en `CAMBIOS.md` (más reciente arriba). En una línea cada uno:
- v2.176–v2.178: listado de OT y buscador de cliente de la OT paginados/buscados en el servidor.
- v2.179: `ordenes.js` arma INSERT/UPDATE desde una lista (`utils/camposOrden.js`). v2.180: Cotizaciones no falla si el cliente de la OT ya no existe.
- v2.181–v2.184: `OrdenTrabajo.jsx` de 1.243 a 377 líneas (hooks `useEquiposOT`, `useOrdenDesdeNavegacion`, `useGuardarOrden`…).
- v2.185: botones **Guardar** y **Guardar y salir** en todo el sistema; ficha de persona con la dirección al lado.
- v2.186: adjuntos de la OT en tabla aparte (`orden_adjuntos`), hasta 10 imágenes y 10 PDF, miniaturas y visor.
- v2.187: fechas de creación (cliente y OT), Inicio compacto, menú más chico, encabezado fijo.
- v2.188–v2.190: Clientes y Equipos paginados en el servidor; la OT ya no carga la lista de equipos; sugerencias por relevancia.
- v2.191: vínculos de la OT con equipo, contacto y dirección (pendiente de publicar).

## 5. Estado de la base local del dueño (MySQL `soporte_tecnico_db`)

- Datos reales: 3 clientes, 2 equipos (`EQ-0001` NOTEBOOK HP 445 G8 y `EQ-0003` NOTE HP 445 G9), 8 OT (02800 a 02807).
- Ya tiene las columnas `equipo_id`, `contacto_id`, `direccion_id` (con índices) y las OT vinculadas por coincidencia de texto.
- La tabla `orden_adjuntos` existe y tiene archivos de prueba subidos a algunas OT por el dueño.
- **Datos de prueba «PRUEBA PAG» cargados el 19-nov** para probar OT y Cotizaciones (script en una carpeta temporal que no viaja): 5 clientes (4 empresas y 1 persona, `CL-9901` a `9905`) con 6 contactos y 5 direcciones vinculados (`CO-9901`…, `DI-9901`…) y 12 OT (`OT-2026-9901` a `9912`; las de la persona no tienen contacto). **Hay que borrarlos al terminar** (código 99xx **y** nombre «PRUEBA PAG»; también las cotizaciones de esos clientes) y no crear registros reales mientras estén. Antes los «PRUEBA PAG» del 17-nov se borraron y se verificó. Existen además 3 cotizaciones del dueño en la base local (no tocar). Quedan a propósito, a pedido del dueño: la carpeta `Escritorio\prueba_adjuntos` (4 archivos de prueba) y los adjuntos que subió a sus OT.

## 6. Reglas de trabajo que hay que respetar

- **Nada de `git push` ni cambio de rama sin orden expresa del dueño**, y **preguntar antes de publicar**. Un push a `main` publica el frontend (Vercel).
- Orden para publicar con backend o base de datos nuevos: **Neon (lo corre el dueño) → `deploy/cloud` (Render) → `main` (Vercel)**.
- **Local es MySQL, la web es PostgreSQL.** Todo cambio de `backend/routes/*.js` hay que portarlo a mano a `deploy/cloud` y probarlo con `embedded-postgres` (receta en `AGENTS.md` sección 2). **`git merge main` en `deploy/cloud` mezcla sin avisar código MySQL en archivos PostgreSQL**: tras cada merge, abrir y revisar los `routes/*.js` que cambiaron. En esta sesión hubo conflicto en `clientes.js`, `equipos.js`, `contactos.js`, `direcciones.js` y `ordenes.js`; se resolvió tomando la versión de `deploy/cloud` (`git checkout --ours`) y reaplicando los cambios.
- Los archivos de `backend/utils/` son **idénticos** en las dos ramas (usan `?` y `numerarMarcadores` los vuelve `$1…` en PostgreSQL). Los `routes/*.js` difieren.
- **Código escalable siempre:** ningún archivo de pantalla o ruta debería pasar de ~400 líneas; extraer a componentes, hooks (`hooks/use*.js`) o utilidades. Tamaños hoy: `OrdenTrabajo.jsx` 377, `routes/clientes.js` 309, `routes/equipos.js` 109.
- Hacer solo lo que se pide; no crear carpetas, scripts ni ramas sin avisar; no borrar datos sin confirmar. Textos de formularios en MAYÚSCULAS. Reutilizar clases CSS existentes.
- Responder en español, breve y directo.

## 7. Herramientas de prueba (no están en el repositorio)

Las pruebas con bases temporales (MySQL: `hls_test_*`; PostgreSQL: `embedded-postgres`) y los scripts de datos de prueba se hicieron en una carpeta temporal de la sesión que no viaja. Si hace falta rehacerlas:
- **PostgreSQL de prueba:** paquete npm `embedded-postgres` con `initdbFlags: ['--encoding=UTF8','--locale=C']`; esquema desde `backend/crear_tablas.sql` convertido (ojo: `a_ot` `SMALLINT`; incluir las FK reales, por ejemplo `cotizaciones.cliente_id`).
- **Revisión de nombres sin definir en el frontend** (el build de Vite NO la hace y ya causó dos errores): ESLint con `eslint-plugin-react` y `globals`, reglas `no-undef` y `react/jsx-no-undef`, sobre `frontend/src`. Pasarla después de cada refactor.
- **Datos de prueba locales:** insertar con una marca reconocible (por ejemplo códigos `CL-Pnnn` / `EQ-Pnnn` o `info_interna = 'DATOS_PRUEBA_…'`) y borrarlos al terminar.
- En Windows, los heredocs largos y las barras invertidas fallan en el shell de Claude Code: escribir archivos con la herramienta de escritura y usar PowerShell para `node`, `npm` y `git push`.

## 8. Dónde está cada cosa

| Archivo | Para qué |
|---|---|
| `AGENTS.md` | Guía principal del proyecto, reglas y estado (sección 7) |
| `CAMBIOS.md` | Registro detallado por versión, más reciente arriba; incluye el SQL de Neon de cada cambio |
| `CONTINUAR_LUNES.md` | Este archivo |
| `NOTAS-COTIZACIONES.md` | Pendientes y requisito futuro de Cotizaciones |
| `BASE_DATOS_ANTIGUA.md` | Esquema del sistema original (SQL Server `ods`) |
| `CONTINUAR_EN_OTRO_PC.md` | Montar o actualizar el proyecto en otro equipo |
| `MIGRACION_PENDIENTE.md` | Solo histórico (la migración de v2.168–v2.175 ya se hizo); se puede borrar |
