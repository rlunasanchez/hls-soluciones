# Base de datos del sistema antiguo (`ods`)

Referencia para entender cómo funcionaba el programa original y qué conviene replicar o evitar en el sistema nuevo. Se obtuvo de un respaldo de **Microsoft SQL Server** (`08-09-26.bak`, 27 MB) restaurado en la instancia local `.\SQLEXPRESS` con el nombre de base `ods`. Los números de filas son los de ese respaldo (8 de septiembre de 2026). Este documento no incluye datos personales ni contraseñas.

Para consultarla: `sqlcmd -S .\SQLEXPRESS -E -C -d ods -Q "SELECT ..."`.

## 1. Idea general

- Una sola entidad "cliente" de dos tipos: **EMPRESA** (tabla `empresa`) y **PERSONA** (tabla `individuo`). Una orden, un contacto o una dirección pueden pertenecer a cualquiera de las dos, y se distingue con la pareja `tipo_entidad` + `id_entidad`.
- Contactos y direcciones son **tablas aparte** y cuelgan de la entidad. No están dentro de la ficha del cliente.
- Casi no hay claves foráneas declaradas (solo 3). Las relaciones se mantienen "a mano" desde la aplicación, por eso hay datos huérfanos (ver sección 5).
- Tipos de datos pobres: fechas como `char(10)`, números de documento como `char`, montos como `money`.

## 2. Tablas y cantidad de filas

| Grupo | Tabla | Filas | Qué guarda |
|---|---|---:|---|
| Clientes | `empresa` | 6.420 | Razón social, giro, RUT, dirección, fono, fax, comuna, estado, flags `cliente` / `proveedor` |
| | `individuo` | 7.118 | Personas: nombre, RUT, ocupación, fono, email, dirección, comuna, estado, flags `cliente` / `proveedor`. Sirve de cliente-persona **y** de persona detrás de un contacto o un técnico |
| | `empresa_sistema` | 0 | Sin uso |
| Contactos y direcciones | `contactos` | 5.698 | Vínculo persona ↔ entidad (ver sección 3) |
| | `direcciones` | 179 | Direcciones de una entidad, con tipo y comuna |
| | `tipo_direccion` | 5 | POR DEFECTO, CENTRAL, SUCURSAL, DOMICILIO PARTICULAR, PLANTA PRINCIPAL |
| Ubicación | `pais` / `ciudad` / `comuna` | 1 / 48 / 126 | Jerarquía país → ciudad → comuna |
| Servicio técnico | `orden_de_servicio` | 14.581 | La OT (ver sección 4) |
| | `ods_tecnico` | 0 | Técnicos por orden (sin uso) |
| | `ods_observaciones` | 0 | Observaciones por orden (sin uso) |
| | `tecnico` | 6 | Técnicos (apuntan a `individuo`), cargo, estado |
| Equipos | `equipo` | 775 | Catálogo de equipos: descripción, modelo, marca, tipo, categoría, observaciones |
| | `marca` | 32 | Marcas |
| | `tipo_equipo` | 18 | Tipos, ligados a una categoría |
| | `categoria_equipo` | 2 | Categorías |
| | `repuesto` | 0 | Sin uso |
| Ventas | `presupuesto` | 8.242 | Cotización |
| | `presupuesto_detalle` | 17.332 | Líneas de la cotización |
| | `factura` | 3.184 | Factura, con neto, IVA, total, abono y saldo |
| | `factura_detalle` | 5.188 | Líneas de factura |
| | `pago` | 591 | Pagos de facturas |
| Compras | `orden_de_compra` | 655 | Orden de compra a proveedor |
| | `orden_de_compra_detalle` | 1.118 | Líneas de la orden de compra |
| Auxiliares | `condiciones_de_pago`, `forma_de_pago`, `banco`, `impuestos`, `estado` | 14 / 5 / 11 / 1 / 7 | Catálogos |
| Sistema | `usuario` (3) / `tipo_usuario` (2) | | Usuarios del programa: ADMINISTRADOR y LIMITADO |
| | `tareas` | 1.123 | Notas o tareas por usuario |
| | `dtproperties` | 7 | Basura de SQL Server (diagramas) |

## 3. Contactos y direcciones

### `contactos`
`id`, `id_individuo`, `tipo_entidad_contacto`, `id_entidad_contacto`, `id_direccion`, `cargo`, `descripcion`, `fono`, `email`, `rango`, `fecha_creacion`.

- Cada fila dice "esta **persona** (`individuo`) es contacto de esta **entidad** (empresa o persona), en esta **dirección**".
- Por lo tanto sirve de tabla de vínculo (muchos a muchos): una misma persona podría ser contacto de varias entidades. En los datos reales pasa solo con **3 personas**, así que en la práctica es uno a muchos.
- Promedio de **1,1 contactos por entidad** (máximo 36).
- **Todos** los contactos tienen `id_direccion`: el contacto siempre está atado a una dirección.
- `fono`, `email` y `cargo` viven en el vínculo, no en la persona: el mismo individuo puede tener otro cargo o fono en otra entidad.
- Tipos de entidad: 5.634 de EMPRESA y 64 de PERSONA.

### `direcciones`
`id`, `id_tipo_direccion`, `id_entidad`, `tipo_entidad`, `direccion`, `descripcion`, `fono`, `fax`, `id_comuna`.

- Cuelga de una entidad (uno a muchos), con tipo (SUCURSAL, CENTRAL, etc.) y comuna.
- Promedio de **1,5 direcciones por entidad** (máximo 13).
- Solo 179 direcciones para 6.420 empresas: la mayoría de los clientes usa la dirección que viene en la propia ficha (`empresa.direccion`).

## 4. La orden de servicio (`orden_de_servicio`)

Guarda la OT con **referencias**, no copias de texto:

| Campo | Significado |
|---|---|
| `id_entidad` + `tipo_entidad` | Cliente (EMPRESA 12.838 / PERSONA 1.743) |
| `id_contacto`, `id_direccion` | Contacto y dirección elegidos, **por id** |
| `id_tecnico` | Técnico |
| `id_equipo`, `serie` | Equipo del catálogo + serie escrita en la OT |
| `numero`, `folio`, `ticket` | Tres numeraciones distintas (todas `char`) |
| `contador_paginas`, `nivel_tintas`, `insumo1`, `insumo2` | Datos del equipo en esa visita |
| `falla`, `actividad_tecnico`, `observaciones` | Textos |
| `estado` | CERRADO 14.242, PENDIENTE 297, ANULADO 39, ELIMINADO 3 (borrado lógico) |
| `garantia` | `char(2)` |
| `fingreso`, `ftermino`, `fentrega`, `fcompra`, `fecha_termino` | Fechas (una de ellas como texto) |

Solo 2 insumos por orden, contra 12 en el sistema nuevo.

## 5. Lo que se aprendió de los datos

1. **24% de las OT perdieron su contacto.** 3.507 de las 14.581 órdenes apuntan a un `id_contacto` que ya no existe. Cuando alguien borró un contacto, la orden quedó sin saber a quién se atendió. Con direcciones no pasó (0 huérfanas), porque casi nunca se borraban.
   - Esto justifica que el sistema nuevo guarde una **copia (snapshot) del contacto y la dirección en la OT**, y avise cuando ya no están vinculados, en vez de leerlos en vivo.
2. **Sin integridad referencial.** Solo 3 claves foráneas declaradas (`direcciones` → `comuna` y `tipo_direccion`, `empresa_sistema` → `empresa`). El resto depende de que la aplicación no se equivoque.
3. **Borrado lógico en algunas tablas** (`estado` = ELIMINADO / INACTIVO), borrado físico en otras (contactos).
4. **Tablas sin uso:** `ods_tecnico`, `ods_observaciones`, `repuesto`, `empresa_sistema` están vacías; no vale la pena replicarlas.
5. **Cliente persona vs empresa:** el 12% de las OT son de personas naturales. El sistema nuevo tiene una sola tabla `clientes` (con RUT); conviene recordar que existió la distinción.

## 6. Equivalencias con el sistema nuevo (MySQL)

| Antiguo | Nuevo | Nota |
|---|---|---|
| `empresa` + `individuo` | `clientes` | Una sola tabla; no distingue empresa/persona |
| `contactos` (+ `individuo` para el nombre) | `contactos` + `cliente_contactos` | El nuevo separa el catálogo del vínculo; `a_ot` indica cuál viaja a la OT |
| `direcciones` | `direcciones` + `cliente_direcciones` | Igual idea; el antiguo ataba cada contacto a una dirección y el nuevo no |
| `orden_de_servicio` | `ordenes_trabajo` | El nuevo guarda copias de texto y listas `contactos_extra` / `direcciones_extra` en JSON |
| `equipo`, `marca`, `tipo_equipo` | `equipos` | El nuevo tiene un solo catálogo, sin categorías |
| `presupuesto` + detalle | `cotizaciones` | |
| `orden_de_compra` + detalle | (pendiente) | Página vacía en el nuevo |
| `factura` + detalle + `pago` | (no existe) | |
| `usuario` / `tipo_usuario` | `usuarios` (rol admin / técnico) | |

## 7. Qué podría ayudar al sistema nuevo

- **Contactos ligados a una dirección** (`contactos.id_direccion`): hoy en el nuevo, contacto y dirección se eligen por separado en la OT.
- **Tipos de dirección** (CENTRAL, SUCURSAL, PLANTA PRINCIPAL, DOMICILIO PARTICULAR): el nuevo ya muestra Matriz / Sucursal, pero no el resto.
- **Orden de compra y factura con sus líneas**: la estructura (cabecera + detalle, neto / IVA / total, condiciones de pago) sirve como base para las páginas aún vacías. Un detalle: en el antiguo la factura referencia al presupuesto y a la orden de compra por texto.
- **Migración de datos**: hay 14.581 OT y 5.698 contactos históricos que podrían importarse. Antes habría que decidir qué hacer con las 3.507 OT cuyo contacto ya no existe (importarlas con el contacto vacío).
