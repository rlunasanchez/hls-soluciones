# Registro de Cambios - HLS Soluciones

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
