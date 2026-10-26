# Para continuar el lunes 26-oct-2026

Este archivo resume dónde quedó el trabajo al terminar el viernes 23-oct-2026. Se puede borrar cuando ya no haga falta.

**Frase para retomar:** "Lee AGENTS.md, CAMBIOS.md y CONTINUAR_LUNES.md; seguimos con …"

## 1. Estado exacto

| | Versión | Commit |
|---|---|---|
| **Web publicada** (Render + Vercel + Neon) | **v2.193** (26-oct-2026; v2.193 es solo frontend) | ver `git log` de `main` y `deploy/cloud` |

- Árbol de trabajo limpio (solo `.claude/` sin versionar). No hay worktrees abiertos. Neon ya tiene las columnas de v2.191.
- **Ya no hay nada pendiente de publicar** salvo esta documentación. El siguiente trabajo es el historial de la OT (sección 3).
- Para que Claude pueda hacer `git push`, el dueño creó `.claude/settings.local.json` con reglas para `git push origin deploy/cloud` y `git push origin main`; si el clasificador lo bloquea, el dueño lo escribe con `! git push …`.

## 2. Publicado el 26-oct-2026: v2.191 y v2.192 (la OT vinculada a equipo, contacto y dirección)

v2.192: al crear un equipo, contacto o dirección se reenlazan las OT sin vínculo con el mismo texto (`CAMBIOS.md` v2.192). Nota para la importación del histórico: hacer una pasada masiva de enlace, porque contactos y direcciones ya existentes no reenlazan las demás OT.

Lo que sigue es el detalle de v2.191, ya publicado (se conserva como referencia).

Qué hace: la OT guarda `equipo_id`, `contacto_id` y `direccion_id`. Al editar un equipo, contacto o dirección en su mantenedor, **todas las OT que lo usan se actualizan** (igual que el cliente); la **serie** es de cada OT y no se toca. Al eliminarlo, la OT conserva su copia sin vínculo. El servidor enlaza al guardar la OT (`backend/routes/ordenesVinculos.js`); la pantalla no cambió. Detalle completo y pruebas: `CAMBIOS.md` v2.191.

Probado: MySQL 21/21 y PostgreSQL 104/104. El dueño lo probó en pantalla en local y funciona.

**Para publicarlo (en este orden; preguntar al dueño antes):**
1. El dueño corre en el SQL Editor de Neon el SQL que está en `CAMBIOS.md` en la entrada **v2.191** (3 columnas, 3 índices y la vinculación de las OT existentes). Empezar con una línea en blanco al pegar y revisar la primera palabra. Verificar con: `SELECT column_name FROM information_schema.columns WHERE table_name='ordenes_trabajo' AND column_name IN ('equipo_id','contacto_id','direccion_id');` (deben salir las 3).
2. `git push origin deploy/cloud` (Render). Esperar a que el dueño confirme **Live** con el commit `eb5a1e7`.
3. `git push origin main` (Vercel). Verificar el deployment con `gh api repos/rlunasanchez/hls-soluciones/deployments`.
4. Hacer los `git push` desde **PowerShell** (desde el shell Bash de Claude Code falla con "cannot spawn sh").

No hay otros cambios de base de datos pendientes.

## 3. Lo que sigue (orden acordado con el dueño)

1. ~~Publicar v2.191~~ (hecho, junto con v2.192).
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
- **Sin datos de prueba** de clientes ni equipos (se borraron). Quedan a propósito, a pedido del dueño: la carpeta `Escritorio\prueba_adjuntos` (4 archivos de prueba) y los adjuntos que subió a sus OT.

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
