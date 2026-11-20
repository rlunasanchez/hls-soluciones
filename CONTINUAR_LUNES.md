# Para continuar el lunes 23-nov-2026

Este archivo resume dónde quedó el trabajo al terminar el viernes 20-nov-2026 (el nombre del archivo es histórico). Se puede borrar cuando ya no haga falta.

**Frase para retomar:** "Lee AGENTS.md, CAMBIOS.md y CONTINUAR_LUNES.md; seguimos con …"

## 1. Estado exacto

| | Versión | Commit |
|---|---|---|
| **Web publicada** (Render + Vercel + Neon) | **v2.208** (19-nov-2026) | `main` `b8eb3f0`, `deploy/cloud` `bb32f4c` |
| **Listo para subir** | v2.209 Cotizaciones en tablas (necesita el SQL de Neon) | ver 2c |

- Árbol de trabajo limpio (solo `.claude/` sin versionar). No hay worktrees abiertos. **Neon:** v2.195 a v2.208 no tocan la base de datos; el único cambio es la columna `cotizaciones.cliente_tipo` (ver 2c), que el dueño **ya corrió en Neon** el 19-nov.
- Las dos ramas se publican con una carpeta temporal (`git worktree add "$env:TEMP\hls-cloud" deploy/cloud`, `git merge main`, push de `deploy/cloud` y luego de `main`, y quitar la carpeta), para no cambiar la rama de la carpeta del dueño. Los `git push` se hacen desde **PowerShell**.
- El 17-nov-2026 Claude pudo hacer `git push` desde PowerShell sin bloqueo (v2.200 a v2.204, cada vez con orden expresa del dueño: «documenta y sube»). Si el clasificador lo bloquea, el dueño lo escribe con `! git push …`. **Solo se publica con la orden expresa del dueño.**
- Los datos de la base de **producción (Neon) y la local se borraron**: eran de prueba. Los usuarios (`admin`, `rluna`, `rzuniga`) se conservan. La numeración de OT parte de `OT-2026-02800` y los códigos de `CL-0001`.
- La contraseña de `admin` en Neon se restableció a `admin123` el 10-nov-2026 (el dueño debe cambiarla desde Gestión de Usuarios). La de la base local es la de `ADMIN_PASSWORD` del `.env`.

## 2c. Cotizaciones adaptada como la OT (v2.209, 20-nov-2026)

Detalle completo en `CAMBIOS.md` (v2.209, con el SQL de Neon) y `AGENTS.md`. Resumen: formulario con los componentes de la OT (`Cotizaciones.jsx` 73 líneas), todo en tablas (`cotizacion_items` y montos `neto`/`iva`/`total` en columnas, calculados por el servidor), columnas con los nombres de la OT, vínculos y sincronización con los mantenedores como la OT, PDF al estilo de la OT (estilos en `utils/pdfEstilos.js`). Probado con MySQL y PostgreSQL reales; **el formulario y el PDF no se han visto en pantalla**.

**Estado de la publicación:** si al retomar `git log origin/main` no incluye v2.209, falta subirla. Orden: **el dueño corre el SQL de Neon (`CAMBIOS.md` v2.209) → push `deploy/cloud` → push `main`** (verificar con `gh api repos/rlunasanchez/hls-soluciones/deployments`). Entre el SQL y el despliegue de Render, Cotizaciones de la web falla unos minutos.

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

0. **Primero Cotizaciones (sección 2c):** probar en local lo que hay y seguir con los pasos de esa sección.
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
