# Para continuar el lunes 16-nov-2026

Este archivo resume dónde quedó el trabajo al terminar el viernes 13-nov-2026. Se puede borrar cuando ya no haga falta.

**Frase para retomar:** "Lee AGENTS.md, CAMBIOS.md y CONTINUAR_LUNES.md; seguimos con …"

## 1. Estado exacto

| | Versión | Commit |
|---|---|---|
| **Web publicada** (Render + Vercel + Neon) | **v2.199** (12-nov-2026) | ver `git log` de `main` y `deploy/cloud` |

- Árbol de trabajo limpio (solo `.claude/` sin versionar). No hay worktrees abiertos. **Neon no necesita SQL nuevo**: v2.195 a v2.199 no tocan la base de datos.
- Las dos ramas se publican con una carpeta temporal (`git worktree add "$env:TEMP\hls-cloud" deploy/cloud`, `git merge main`, push de `deploy/cloud` y luego de `main`, y quitar la carpeta), para no cambiar la rama de la carpeta del dueño. Los `git push` se hacen desde **PowerShell**.
- Para que Claude pueda hacer `git push`, el dueño creó `.claude/settings.local.json` con reglas para `git push origin deploy/cloud` y `git push origin main`; si el clasificador lo bloquea, el dueño lo escribe con `! git push …`. Aun así, **solo se publica con la orden expresa del dueño**.
- Los datos de la base de **producción (Neon) y la local se borraron**: eran de prueba. Los usuarios (`admin`, `rluna`, `rzuniga`) se conservan. La numeración de OT parte de `OT-2026-02800` y los códigos de `CL-0001`.
- La contraseña de `admin` en Neon se restableció a `admin123` el 10-nov-2026 (el dueño debe cambiarla desde Gestión de Usuarios). La de la base local es la de `ADMIN_PASSWORD` del `.env`.

## 2. Publicado el 10, 11 y 12-nov-2026 (v2.195 a v2.199) y qué falta probar

Detalle de cada uno en `CAMBIOS.md`. Todo subido a la web; **lo marcado "sin probar" lo tiene que probar el dueño en pantalla (en la web, con Ctrl+F5)**.

- **v2.195:** aviso del contacto/dirección no registrado ya no dice "ya no está vinculado" (dice "no está vinculado… primero Regístralo").
- **v2.196:** Registrar cliente desde la OT abre con el tipo elegido (Persona/Empresa) y una persona conserva la dirección de la OT (se vincula desde Direcciones). **Persona: probada y funciona. Sin probar:** Empresa, y cambiar el tipo dentro de la ficha (la dirección aparece al pasar a Persona; si se quita no vuelve).
- **v2.197 (sin probar):** contacto, dirección y equipo escritos a mano ya no se bloquean mientras se escribe; solo se bloquean si vienen del buscador o de una OT guardada. Si el dato elegido está en el catálogo se completan los campos vacíos (ciudad, comuna, email, fono, cargo). Pruebas: escribir a mano una dirección, un contacto y un equipo que ya existen y completar los demás campos; elegirlos del buscador (deben bloquearse con **Editar**); guardar y reabrir la OT (deben verse bloqueados). Riesgo conocido: lo escrito a mano que difiere del registro queda enlazado y se pisa si luego se edita el registro en el mantenedor (v2.191).
- **v2.198 (sin probar):** los correos se ven como se escribieron (no en mayúscula) en Clientes, Contactos, Usuarios y en la tabla de contactos de la ficha del cliente. Los ya guardados en mayúscula se siguen viendo así.
- **v2.199 (backend):** el número de OT ya no falla con guardados simultáneos (cola + reintento, probado en MySQL y PostgreSQL) y el backend en la nube responde 404 en vez de `ENOENT` por `index.html`. **El backend local del dueño no se recarga solo: hay que reiniciarlo** (`node server.js` en `backend/`).
- **Aprendido:** los fallos raros en la web pueden ser Render/Neon gratis despertando o reiniciándose tras un push (esperar y repetir). El log se ve en el panel de Render → servicio → **Logs**.

## 3. Lo que sigue (orden acordado con el dueño)

1. **Probar en la web** lo marcado "sin probar" de la sección 2 y avisar si algo falla. **v2.199 ya está publicado y verificado el 13-nov** (Render responde 404 `No encontrado` en rutas inexistentes; Vercel con `8eb5037`; `main` y `deploy/cloud` iguales a lo local, sin carpetas temporales).
   - **Pendiente de arreglar: permiso de `git push`.** El 12 y 13-nov el clasificador de permisos de Claude Code bloqueó los `git push` de Claude ("Credential Leakage") aunque el dueño lo ordenó, y los hizo el dueño a mano en PowerShell. Para que Claude vuelva a poder subir hay que revisar o volver a crear las reglas `git push origin deploy/cloud` y `git push origin main` en `.claude/settings.local.json`. Mientras tanto Claude prepara todo (commit y merge en `%TEMP%\hls-cloud`) y el dueño ejecuta los dos push en PowerShell: primero `deploy/cloud`, luego `main`.
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
