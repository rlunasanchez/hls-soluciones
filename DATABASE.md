# Base de datos — soporte_tecnico_db (MySQL, rama `main`)

**El esquema vigente vive en `backend/crear_tablas.sql`.** Este archivo ya no lo duplica para evitar que se desactualice.

## Tablas

| Tabla | Para qué sirve |
|---|---|
| `clientes` | Mantenedor de clientes: `codigo`, `razon_social`, `rut`, `telefono`, `email`. Sin contactos ni direcciones (viven en sus mantenedores). |
| `contactos` | Catálogo global de contactos (`CO-0001`…). Sin FK a cliente. |
| `direcciones` | Catálogo global de direcciones (`DI-0001`…). Sin FK a cliente. |
| `equipos` | Mantenedor de equipos: `codigo`, `equipo`, `modelo`, `marca`, `serie`. |
| `ordenes_trabajo` | OT. Guarda copia (snapshot) de cliente, contacto, dirección y equipo, más `contacto_id`/`direccion_id`/`cliente_direccion_id` para enlazar con los catálogos. |
| `cotizaciones` | Cotizaciones, con o sin OT asociada. `items` es JSON. |
| `usuarios` | Usuarios del sistema (`rol`: `admin` / `tecnico`, `activo`). |

## Cómo se sincroniza una base existente

Los cambios de esquema se aplican con scripts en `backend/` (se corren una sola vez y no son re-ejecutables; hacer respaldo con `mysqldump` antes):

1. `migracion_2026-09-25_contactos_direcciones.sql` — tablas `contactos`/`direcciones`, columnas de enlace en OT y cotizaciones, y borra `clientes_contactos`, `clientes_direcciones` y `clientes.contacto_*`. Falla si `clientes` no tiene `contacto_ciudad`/`contacto_comuna`.
2. `migracion_2026-09-26_limpieza_columnas.sql` — borra columnas sin uso de `equipos` y `activo` de `equipos`/`clientes`/`contactos`/`direcciones`.
3. `migracion_2026-09-26_quitar_giro.sql` — borra `clientes.giro`.
4. `migracion_2026-09-26_quitar_direccion_cliente.sql` — borra `clientes.direccion/ciudad/comuna`.

Además, en una base que tuviera `equipos.contador_pag` y `equipos.nivel_tintas` (sobrantes antiguos): `ALTER TABLE equipos DROP COLUMN contador_pag, DROP COLUMN nivel_tintas;`.

## Usuario admin

Se crea con el endpoint `POST /api/auth/setup-admin` (clave `SETUP_ADMIN_KEY` y contraseña `ADMIN_PASSWORD` en `backend/.env`).

## Nota

`deploy/cloud` usa Postgres (Neon) y **no** se sincroniza con estos scripts: sus cambios de esquema se aplican aparte.
