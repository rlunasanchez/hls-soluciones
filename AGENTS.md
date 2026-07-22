# HLS Soluciones - Documentación del Proyecto

## Resumen del Sistema
Sistema de gestión de soporte técnico con módulos para:
- Clientes (con equipos asociados)
- Equipos (códigos únicos EQ-XXXX)
- Órdenes de Trabajo
- Informes Técnicos
- Cotizaciones
- Órdenes de Compra
- Usuarios

## Arquitectura

### Backend (Node.js + Express + MySQL)
- **Puerto**: 5001
- **Base de datos**: MySQL (soporte_tecnico_db)
- **Autenticación**: JWT
- **CORS**: Configurado para localhost:5173, 5174, 3000

### Frontend (React + Vite)
- **Puerto desarrollo**: 5173
- **Build**: Se sirve desde backend en producción
- **Estilos**: CSS personalizado con variables CSS

### Utilities Compartidos (`frontend/src/utils/helpers.js`)
- `toUpper(v)` — convierte a mayúsculas con null safety
- `validarRUT(rut)` — validación de RUT chileno (módulo 11)
- `parseToken()` — extrae `{ usuario, rol }` del JWT almacenado

### Componentes Compartidos
| Componente | Ubicación | Uso |
|---|---|---|
| `ClienteFormulario` | `components/clientes/ClienteFormulario.jsx` | Form de cliente (crear/editar). Usado por Clientes.jsx y OrdenFormCliente.jsx |
| `Pagination` | `components/Pagination.jsx` | Paginación principal de listados |
| `HeaderCliente` | `components/clientes/HeaderCliente.jsx` | Header del módulo Clientes |
| `HeaderEquipo` | `components/equipos/HeaderEquipo.jsx` | Header del módulo Equipos |
| `HeaderOrdenTrabajo` | `components/ordenes/HeaderOrdenTrabajo.jsx` | Header del módulo OT |

## Convenciones de Código

### Códigos Auto-generados
- **Clientes**: CL-XXXX (formato: CL-0001, CL-0002, ...)
- **Equipos**: EQ-XXXX (formato: EQ-0001, EQ-0002, ...)
- Cálculo: máximo número existente + 1, padStart(4, '0')
- No se usa ID de base de datos para mantener secuencia tras eliminaciones

### Estructura de Estados (React)
```javascript
// Datos principales
const [clientes, setClientes] = useState([]);
const [equipos, setEquipos] = useState([]);

// UI - Formularios
const [mostrarFormulario, setMostrarFormulario] = useState(false);
const [editandoId, setEditandoId] = useState(null);

// UI - Dropdowns
const [mostrarDropdownXxx, setMostrarDropdownXxx] = useState(false);
const xxxDropdownRef = useRef(null); // Para cerrar al clickear fuera

// Filtros y búsqueda
const [busqueda, setBusqueda] = useState("");
const [filtroYyy, setFiltroYyy] = useState("");

// Paginación
const [paginaActual, setPaginaActual] = useState(1);
const ITEMS_POR_PAGINA = 4; // Estándar en todos los módulos
```

### Dropdowns (Patrón)
Todos los dropdowns deben:
1. Usar `useRef` para detectar clics fuera
2. Cerrarse automáticamente al hacer clic fuera
3. Tener z-index alto (1000+)

```javascript
const dropdownRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setMostrarDropdown(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

// En JSX:
<div ref={dropdownRef} style={{ position: 'relative' }}>
  <input onFocus={() => setMostrarDropdown(true)} />
  {mostrarDropdown && <div className="dropdown">...</div>}
</div>
```

## Cambios Recientes (Julio 2026)

### 1. Seguridad y Limpieza de Código
**Archivos modificados:**
- `backend/crear-admin.js` — eliminado connection string Neon hardcodeado
- `backend/middleware/authMiddleware.js` — eliminado fallback JWT `"clave_secreta"`
- `backend/routes/auth.js` — eliminado fallback JWT
- `backend/package.json` — fix `"sbackend"` → `"hls-backend"`
- 8 scripts en `scripts/` migrados a usar dotenv en vez de passwords hardcodeadas

**Archivos eliminados:**
- `frontend/src/components/CustomSelect.jsx` — dead code
- `frontend/src/components/clientes/OTAsociadas.jsx` — componente huérfano
- `backend/test2.js` — script sin uso

### 2. Utilities Compartidos
**Nuevo archivo:** `frontend/src/utils/helpers.js`
- `toUpper(v)`, `validarRUT(rut)`, `parseToken()`
- Eliminadas 7 copias de `toUpper` en OrdenTrabajo.jsx
- Eliminada `validarRUT()` duplicada en Clientes.jsx
- Eliminado JWT parsing duplicado en Clientes.jsx y GestionUsuarios.jsx

### 3. Refactor Formulario de Cliente
**Nuevo archivo:** `frontend/src/components/clientes/ClienteFormulario.jsx`
- Componente compartido para crear/editar clientes
- Usado por `Clientes.jsx` (form completo) y `OrdenFormCliente.jsx` (modal en OT)
- `Clientes.jsx`: de 544 a 150 líneas (-72%)
- `OrdenFormCliente.jsx`: de 566 a 200 líneas (-65%)

### 4. Fixes Varios
- Paginación unificada a 4 items en todos los módulos (antes: 5 en Clientes/Equipos)
- `fetchOrdenes` limit unificado a 10000 (antes: 1000 en Clientes)
- `actualizarSucursal` corregido con deep copy en vez de mutación
- Columna `observaciones` agregada a `ordenes_trabajo` en DB local
- Scripts utilitarios movidos de `backend/` a `scripts/`

## Cambios Recientes (Mayo 2026)

### 1. Integración Clientes-Equipos
**Archivos modificados:**
- `frontend/src/pages/Clientes.jsx`
- `backend/routes/equipos.js`
- `backend/routes/clientes.js`

**Cambios:**
- Equipos solo creables desde vista de Clientes (no página Equipos)
- Modal dual: crea (POST) o edita (PUT) equipos
- Código EQ-XXXX auto-calculado desde array local
- Filtro por razón social: busca solo en datos de cliente (razón social, código, contacto)
- Vista expandida al buscar: tabla completa de equipos con toggle

### 2. Órdenes de Trabajo - Mejoras UX
**Archivos modificados:**
- `frontend/src/pages/OrdenTrabajo.jsx`

**Cambios:**
- Búsqueda por código EQ-XXXX funciona en mayúsculas/minúsculas (LOWER SQL)
- Input de código convierte automáticamente a mayúsculas
- Carga selectiva de datos: avería solo al buscar por código (único)
- Dropdowns cierran al clickear fuera
- Eliminado botón flecha "volver" (redundante con botón Inicio)

### 3. Home - Reordenamiento
**Archivos modificados:**
- `frontend/src/pages/Home.jsx`

**Cambios:**
- Orden de widgets: Clientes → Equipos → Orden Trabajo → Informes → Cotizaciones → Orden Compra
- Consistente en todas las páginas

### 4. Optimización de Código
**Archivos modificados:**
- `frontend/src/pages/Clientes.jsx`

**Cambios:**
- Eliminados imports no usados
- Eliminados estados duplicados/no usados
- Corregido typo `coma` → `comuna`
- Añadidos comentarios JSDoc en funciones principales

### 5. Uniformización de Navegación y Mejoras UX (Mayo 2026)
**Archivos modificados:**
- `frontend/src/App.jsx`
- `frontend/src/index.css`
- `frontend/src/pages/Clientes.jsx`
- `frontend/src/pages/OrdenTrabajo.jsx`
- `frontend/src/pages/Cotizaciones.jsx`
- `frontend/src/pages/Informes.jsx`
- `frontend/src/pages/Equipos.jsx`
- `frontend/src/pages/GestionUsuarios.jsx`
- `frontend/src/pages/OrdenCompra.jsx` (nuevo)

**Cambios:**
- **App.jsx**: Agregar estado `checkingAuth` para evitar redirect loops al recargar, agregar ruta `/orden-compra`
- **index.css**: Agregar estilos `.badge-garantia` y `.badge-no-garantia` para badges de garantía
- **Clientes.jsx**: 
  - Campo Dirección en fila propia (ancho completo)
  - Sección Sucursales: campo Dirección en fila dedicada con ancho completo
  - Header reorganizado con navegación consistente
- **OrdenTrabajo.jsx**:
  - Unificar estilos de tabla y paginación con otras páginas
  - Usar badges para garantía en vez de spans inline
  - Agregar dropdown de búsqueda por código EQ-XXXX
  - Recargar lista de órdenes tras guardar (fetchOrdenes(1))
- **Cotizaciones/Informes**: Remover botón flecha "volver", header consistente
- **Equipos/GestiónUsuarios**: Agregar botón "Orden de Compra" en navegación

### 6. Validación de Campos en Formularios (Mayo 2026)
**Archivos modificados:**
- `frontend/src/pages/Clientes.jsx`

**Cambios:**
- **RUT chileno**: validación completa con dígito verificador (módulo 11), auto-formato con puntos y guion, límite de 12 caracteres, solo permite números/K/guion. Error en rojo con mensaje contextual ("RUT inválido", "Falta el guion y dígito verificador"). Números menores a 100.000 se rechazan.
- **Solo letras** (regex `[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]`): Ciudad, Comuna, Giro, Nombre Contacto, Cargo (datos principales y sucursales).
- **Solo números** (regex `[^0-9+]`): Fono principal, Fono contacto, Fono sucursales.
- **Modal Equipo** (dentro de Clientes): Equipo, Marca, Nivel de Tintas → solo letras.
- Corrección de variables no definidas: `sucursalesVisibles`, `setMostrarDirecciones`.

### 7. Mejoras en Dropdowns de Búsqueda (Mayo 2026)
**Archivos modificados:**
- `frontend/src/pages/Equipos.jsx`
- `frontend/src/pages/OrdenTrabajo.jsx`

**Cambios:**
- **Dropdowns filtran solo con 2+ caracteres**: Evita que al borrar el campo aparezcan todos los registros (clientes, equipos por serie, equipos por código).
- **Cierre al clickear fuera**: En Equipos, el dropdown de "Cliente Asociado" ahora cierra automáticamente al hacer clic fuera del campo (patrón `useRef` + `mousedown`).
- Consistencia con el patrón de dropdowns definido en convenciones de código.

### 8. Mejoras en Filtros de Búsqueda (Mayo 2026)
**Archivos modificados:**
- `frontend/src/pages/Clientes.jsx`

**Cambios:**
- **Filtro Razón Social**: ahora busca solo al inicio de la cadena o al inicio de una palabra (`startsWith()` o después de espacio). Evita falsos positivos como buscar "d" y encontrar "Rodrigo".
- **Filtro RUT**: ahora busca solo desde el inicio (`startsWith()`). Evita que buscar "00" encuentre cualquier RUT que contenga "00" en medio.

## Estructura de Datos

### Cliente
```javascript
{
  id: number,
  codigo: "CL-0001",
  razon_social: string,
  giro: string,
  rut: string,
  direccion: string,
  ciudad: string,
  comuna: string,
  telefono: string,
  contacto_nombre: string,
  contacto_email: string,
  contacto_fono: string,
  contacto_cargo: string,
  contacto_direccion: string,
  direcciones: "tipo|direccion|fono|ciudad|comuna;;..." // formato concatenado
}
```

### Equipo
```javascript
{
  id: number,
  codigo: "EQ-0001",
  cliente_id: number,
  equipo: string,
  modelo: string,
  marca: string,
  serie: string,
  contador_pag: number,
  nivel_tintas: string,
  insumo1...insumo12: string,
  averia: string,
  cliente_nombre: string, // JOIN
  cliente_codigo: string   // JOIN
}
```

## API Endpoints

### Equipos
- `GET /api/equipos?q={termino}` - Lista con búsqueda case-insensitive
- `POST /api/equipos` - Crear (código auto-generado si no proporcionado)
- `PUT /api/equipos/:id` - Actualizar
- `DELETE /api/equipos/:id` - Eliminar

### Clientes
- `GET /api/clientes` - Lista con direcciones concatenadas
- `POST /api/clientes` - Crear (código auto-generado)
- `PUT /api/clientes/:id` - Actualizar
- `DELETE /api/clientes/:id` - Eliminar

## Notas para Desarrolladores

1. **Códigos únicos**: Siempre usar `calcularSiguienteCodigoXxx()` desde datos cargados, no desde API
2. **Búsquedas**: Implementar `LOWER()` en SQL para case-insensitive
3. **Dropdowns**: Siempre usar el patrón con `useRef` para cerrar al clickear fuera
4. **Paginación**: Usar slice() en frontend, no paginación SQL (datasets pequeños)
5. **Estilos**: Usar variables CSS definidas en :root, no colores hardcodeados
6. **Utilities**: Usar `toUpper()`, `validarRUT()`, `parseToken()` de `utils/helpers.js` en vez de duplicar
7. **Formulario Cliente**: Usar `<ClienteFormulario>` compartido, no duplicar el form

## Build y Deploy

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
node server.js
```

El backend sirve automáticamente el frontend build desde `../frontend/dist`

## Variables de Entorno (.env backend)
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=6498
DB_NAME=soporte_tecnico_db
JWT_SECRET=mi_secreto_seguro_123
```

## Migraciones SQL Requeridas

### Tabla equipos
```sql
ALTER TABLE equipos ADD COLUMN codigo VARCHAR(50) UNIQUE AFTER id;
ALTER TABLE equipos ADD COLUMN cliente_id INT AFTER codigo;
```

### Tabla clientes
```sql
ALTER TABLE clientes ADD COLUMN codigo VARCHAR(50) UNIQUE AFTER id;
```

---

## 🌩️ Deploy en la Nube (Vercel + Render + Neon)

### URLs de Producción
| Servicio | URL |
|----------|-----|
| **Frontend** | `https://hls-soluciones.vercel.app` |
| **Backend** | `https://hls-soluciones.onrender.com` |
| **Base de datos** | Neon (PostgreSQL) |

### Ramas de Git
| Rama | Base de datos | Uso |
|------|--------------|-----|
| `main` | MySQL (local) | Desarrollo local |
| `deploy/cloud` | PostgreSQL (Neon) | Deploy en la nube |

### Flujo de Trabajo: Local → Producción

Cuando trabajes en **local** (rama `main` con MySQL) y quieras subir los cambios a producción:

```bash
# 1. Primero commit en local (main)
git add .
git commit -m "Descripción del cambio"

# 2. Pusheás main (opcional, para respaldo)
git push origin main

# 3. Te pasás a deploy/cloud
git checkout deploy/cloud

# 4. Traés los cambios de main
git merge main

# 5. Resolvés conflictos si los hay:
#    - backend/config/db.js → aceptar versión de deploy/cloud (usa pg, no mysql2)
#    - backend/routes/*.js → aceptar versión de deploy/cloud ($1 en vez de ?, etc.)
#    - backend/package.json → aceptar versión de deploy/cloud (pg, no mysql2)
# Para resolver rápido:
git checkout --theirs backend/config/db.js      # mantener PostgreSQL
git checkout --theirs backend/package.json       # mantener pg
git checkout --theirs backend/routes/auth.js     # mantener PostgreSQL
git checkout --theirs backend/routes/equipos.js
git checkout --theirs backend/routes/clientes.js
git checkout --theirs backend/routes/ordenes.js
git add .
git commit -m "Merge main → deploy/cloud"

# 6. Pusheás deploy/cloud → Render y Vercel se actualizan solos
git push origin deploy/cloud

# 7. Volvés a main para seguir trabajando
git checkout main
```

> ⚠️ **Importante**: Los archivos que **siempre difieren** entre ramas son los de la base de datos (db.js, rutas, package.json). Cuando hagas merge, aceptá siempre la versión de `deploy/cloud` para esos archivos.

## Cambios Recientes (Mayo 2026)

### 9. Fix Sucursales/Direcciones al Editar Cliente
**Archivos modificados:**
- `backend/routes/clientes.js`
- `frontend/src/pages/Clientes.jsx`

**Problema:** Al crear un cliente con sucursales, los datos no se guardaban en `clientes_direcciones`. Al editar el cliente, las sucursales aparecían vacías.

**Causas raíz:**
1. **POST `/api/clientes`** no insertaba en `clientes_direcciones` (solo el PUT lo hacía)
2. **`CONCAT` con `NULL`** en MySQL: si `tipo_direccion` era `NULL`, `CONCAT(NULL, '|', ...)` devolvía `NULL`, y `GROUP_CONCAT` lo ignoraba
3. **Filtro en frontend** usaba `d.tipo_direccion` para filtrar, pero si estaba vacío se descartaba la sucursal

**Soluciones:**
1. **POST**: Agregada inserción en `clientes_direcciones` después de crear el cliente, usando `result.insertId`
2. **GET**: Envolver campos con `IFNULL(campo, '')` dentro del `CONCAT` para evitar NULLs
3. **PUT/POST**: Cambiar `d.tipo_direccion || null` por `d.tipo_direccion || ''` (string vacío en vez de NULL)
4. **Frontend**: Cambiar `filter(d => d.tipo_direccion)` por `filter(d => d.direccion)` en `editarCliente()`

**Archivos involucrados (rama main - MySQL):**
- `backend/routes/clientes.js` - Fix en GET (IFNULL), POST y PUT (string vacío)
- `frontend/src/pages/Clientes.jsx` - Fix en filter de editarCliente

**Archivos involucrados (rama deploy/cloud - PostgreSQL):**
- `backend/routes/clientes.js` - Fix en GET (COALESCE), POST y PUT (string vacío)
- `frontend/src/pages/Clientes.jsx` - Mismo fix que en main

### 10. Fix Error 500 al Crear Equipo en la Nube (PostgreSQL)
**Archivo modificado:**
- `backend/routes/equipos.js` (solo rama `deploy/cloud`)

**Problema:** Al guardar un equipo desde la vista de clientes, daba error 500. El INSERT tenía 22 placeholders (`$22`) pero solo 21 columnas.

**Causa:** Error de tipeo al migrar de MySQL a PostgreSQL. En MySQL los placeholders son `?` y no hay conteo explícito, pero en PostgreSQL usamos `$1, $2...` y me equivoqué al numerar.

**Solución:** Cambiar `$22` por `$21` en el VALUES del INSERT.

**Nota:** Este error solo afectaba a la rama `deploy/cloud` (PostgreSQL). La rama `main` con MySQL funciona correctamente.

### Variables de Entorno Cloud

**Render (Backend):**
| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Connection string de Neon (PostgreSQL) |
| `JWT_SECRET` | Clave secreta JWT |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://hls-soluciones.vercel.app` |

**Vercel (Frontend):**
| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://hls-soluciones.onrender.com` |

### 11. Fix Render: Rate Limiter bloqueando CORS y errores SQL
**Fecha:** 17 de Mayo 2026
**Archivos modificados:**
- `backend/server.js` (rama `deploy/cloud`)

**Problema:** El rate limiter estaba bloqueando las peticiones CORS preflight (OPTIONS) antes de que se agregaran los headers de CORS. Error: `No 'Access-Control-Allow-Origin' header is present`.

**Soluciones:**
1. Mover CORS **antes** del rate limiter en el middleware stack
2. Agregar `skip: (req) => req.method === 'OPTIONS'` al rate limiter
3. Eliminar declaración duplicada de `limiter` (quedó un `limiter` viejo arriba del código)
4. Aumentar límite de `max: 100` a `max: 1000` para uso normal

**Nota:** El rate limiter estaba bloqueando TODO el tráfico porque estaba declarado dos veces y el primero (más restrictivo) seguía activo.

### 12. Fix Vercel: Configuración correcta para SPA
**Fecha:** 17 de Mayo 2026
**Archivos modificados:**
- `frontend/vercel.json` (rama `deploy/cloud`)
- Configuración Vercel Dashboard

**Problema:** El deploy en Vercel daba 404 o cargaba en blanco.

**Configuración correcta:**
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_URL=https://hls-soluciones.onrender.com`

**Solución SPA Routing:**
El `vercel.json` usa:
```json
{
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ]
}
```
Así los assets (JS, CSS) se sirven directamente y las rutas de React Router van a `index.html`.

### 13. Restauración archivos PostgreSQL en deploy/cloud
**Fecha:** 17 de Mayo 2026
**Archivos modificados:**
- `backend/routes/ordenes.js`
- `backend/routes/clientes.js`

**Problema:** En un merge anterior, los archivos de `deploy/cloud` quedaron con sintaxis de MySQL (`LIMIT ? OFFSET ?`, `GROUP_CONCAT`, `UNSIGNED`, `IFNULL`, placeholders `?`) en vez de PostgreSQL (`LIMIT $1 OFFSET $2`, `STRING_AGG`, `INTEGER`, `COALESCE`, placeholders `$1`).

**Solución:** Restaurar los archivos desde el commit original de migración a PostgreSQL (`d43dd7a`) y re-aplicar los fixes posteriores (PUT en ordenes, verificar con excluir).

### 14. Fix editar Orden de Trabajo - Completo
**Fecha:** 17 de Mayo 2026
**Archivos modificados:**
- `frontend/src/pages/OrdenTrabajo.jsx` (ambas ramas)
- `backend/routes/ordenes.js` (ambas ramas)

**Problema:** Al editar una orden de trabajo, no cargaba el código EQ-XXX ni la serie del equipo.

**Causas y soluciones:**
1. **`editarOrden()` no seteaba `equipoSeleccionado`, `busquedaCodigo`, `busquedaSerie`**
   - Solución: Buscar equipo en array `equipos` por `equipo_id` o `serie`, y setear los estados correspondientes. Lo mismo para cliente.

2. **`guardarOrden()` siempre hacía POST** (crear nuevo) en vez de PUT (actualizar)
   - Solución: Condicional `if (editingId) { api.put(...) } else { api.post(...) }`

3. **`verificarNumeroOrden()` daba error "ya existe" al editar la misma orden**
   - Solución: Agregar parámetro `?excluir={editingId}` al endpoint de verificación, y modificar backend para excluir ese ID de la query.

### 15. Deploy en la nube funcionando (Vercel + Render + Neon)
**Fecha:** 17 de Mayo 2026
**Estado:** ✅ Funcionando

**URLs de producción:**
| Servicio | URL |
|----------|-----|
| **Frontend (Vercel)** | `https://hls-soluciones.vercel.app` |
| **Backend (Render)** | `https://hls-soluciones.onrender.com` |
| **Base de datos (Neon)** | PostgreSQL |

**Configuración Vercel:**
- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_URL=https://hls-soluciones.onrender.com`

**Configuración Render:**
- **Runtime:** Node
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Branch:** `deploy/cloud`

**Variables de entorno Render:**
| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:...` |
| `JWT_SECRET` | `mi_secreto_seguro_123` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://hls-soluciones.vercel.app` |

---

## Próximos Pasos / Pendientes

### Continuar mañana: Pruebas exhaustivas del sistema
**Fecha:** 18 de Mayo 2026
**Estado:** Pendiente
**Prioridad:** Alta

**Tareas pendientes:**
1. **Módulo Clientes:** Verificar flujo completo de creación/edición con sucursales
2. **Módulo Equipos:** Verificar creación desde vista de clientes y códigos auto-generados
3. **Módulo Orden de Trabajo:**
   - Probar edición completa (EQ-XXX, serie, datos del equipo)
   - Verificar que PUT actualice correctamente sin crear nueva orden
   - Validar que verificación de número de orden funcione al editar
   - Probar dropdowns de búsqueda por código y serie
4. **Módulo Informes/Cotizaciones:** Verificar integración con órdenes
5. **UX/UI:** Revisar que todos los módulos tengan navegación consistente
6. **Deploy:** Verificar que cambios en `main` se puedan mergear a `deploy/cloud` sin problemas

**Nota:** El deploy en la nube ya está funcionando. Prioridad: estabilizar el flujo de edición de órdenes y probar todas las funcionalidades end-to-end. El módulo Orden de Trabajo fue refactorizado recientemente pero requiere pruebas exhaustivas y ajustes de UX.

---

## Cambios Recientes (17-18 Mayo 2026) - Responsive Móvil

### 16. Fix Problema de Deploy en Vercel

**Problema:** Los cambios subidos a `deploy/cloud` no se reflejaban en la producción de Vercel. Los cambios locales funcionaban pero en la web no aparecían.

**Causa raíz:** Los deployments se creaban como "Preview" en vez de "Production". Vercel hacía el build pero no lo asignaba como producción.

**Solución:**
1. Cada vez que se hace push a `deploy/cloud`, ir a https://vercel.com/rodrigolunaanalista-9059s-projects/hls-soluciones/deployments
2. Buscar el deployment más reciente (commit más nuevo)
3. Hacer click en el deployment
4. Hacer click en el botón **"Promote to Production"**

**URLs:**
- Deployments: https://vercel.com/rodrigolunaanalista-9059s-projects/hls-soluciones/deployments
- Proyecto: https://vercel.com/rodrigolunaanalista-9059s-projects/hls-soluciones

### 17. Responsive Formulario de Clientes (Sucursales/Direcciones)

**Archivos modificados:**
- `frontend/src/pages/Clientes.jsx`
- `frontend/src/index.css`

**Cambios:**
- Cada campo de sucursal ahora es una fila independiente
- En móvil, los campos se muestran stacked
- Inputs con tamaño mínimo de 44px para mejor touch en móvil
- Labels más grandes (14px, bold)

**CSS agregado:**
- `.form-row-1`: para una columna
- Media query para `.sucursal-card`

### 18. Responsive Orden de Trabajo (Fechas con Checkboxes)

**Archivos modificados:**
- `frontend/src/pages/OrdenTrabajo.jsx`

**Cambios:**
- Las 4 fechas (Ingreso, Término, Entrega, Compra) ahora usan `date-check-grid` y `date-check-card`
- En móvil: 1 columna | En tablet: 2 columnas | En desktop: 4 columnas

### 19. Responsive Equipos Asociados en Clientes

**Archivos modificados:**
- `frontend/src/pages/Clientes.jsx`
- `frontend/src/index.css`

**Cambios:**
- Vista de equipos como tarjetas verticales en móvil
- Fondo azul claro (`var(--primary-light)`)
- Clase `.equipos-asociados`

### 20. Responsive Equipos.jsx

**Estado:** Ya funcional con `.form-row-3` existente

---

## Flujo de Trabajo para Cambios Responsive

1. **Hacer cambios en local (rama `main`)**
2. **Commit y push a `deploy/cloud`:**
   ```bash
   git add .
   git commit -m "Descripción del cambio"
   git checkout deploy/cloud
   git merge main
   git push origin deploy/cloud
   git checkout main
```

### 30. Columna y filtro de Estado en Órdenes de Trabajo
**Fecha:** Julio 2026
**Archivos modificados:**
- `frontend/src/components/ordenes/OrdenLista.jsx`
- `frontend/src/pages/OrdenTrabajo.jsx`
- `frontend/src/index.css`

**Cambios:**
- Nueva columna "Estado" en tabla y tarjetas de la lista de OT
- Lógica: si `fecha_entrega` tiene valor → badge verde "Cerrada", si no → badge amarillo "Pendiente"
- Nuevo dropdown de filtro "Todos estados" / "Cerrada" / "Pendiente"
- Reseteo a página 1 al cambiar filtro de estado
- Estilos `.badge-estado-cerrada` y `.badge-estado-pendiente`
3. **Ir a Vercel → Deployments → Promote to Production**
4. **Probar en móvil**

---

## Nota Importante: Always Promote to Production

⚠️ **IMPORTANTE:** Cada vez que se hace push a `deploy/cloud`, los cambios aparecerán en la lista de deployments pero **NO** se mostrarán en la URL de producción hasta que se haga **Promote to Production**.

Pasos exactos:
1. Ir a https://vercel.com/rodrigolunaanalista-9059s-projects/hls-soluciones/deployments
2. El deployment más reciente dice "Preview" (no Production)
3. Click en el deployment → Buscar botón "Promote to Production"
4. Click en el botón
5. Esperar ~1 minuto a que se actualice

Si no se hace esto, los cambios solo estarán en estado "Preview" y no se verán en `hls-soluciones.vercel.app`.

---

## Optimizaciones de Código (18 Mayo 2026)

### 21. Mejoras en Queries y Generación de Códigos

**Problema:** `ORDER BY + LIMIT 1` poco eficiente.

**Solución:** Cambiar a `MAX()`.

**Archivos modificados:**
- `backend/routes/clientes.js`
- `backend/routes/equipos.js`
- `backend/routes/ordenes.js`

**Cambios:**
- `SELECT ... ORDER BY num DESC LIMIT 1` → `SELECT MAX(CAST(SUBSTRING(codigo, 4) AS UNSIGNED)) AS num ...`
- Eliminado `LOWER()` innecesario en búsqueda de equipos
- Eliminados console.log de debug

---

## Cambios Recientes (Julio 2026)

### 30. Badge "Equipo desactivado" en Orden de Trabajo
**Fecha:** Julio 2026
**Archivos modificados:**
- `frontend/src/pages/OrdenTrabajo.jsx`
- `frontend/src/components/ordenes/OrdenFormEquipo.jsx`

**Problema:** Al editar una OT que tenía un equipo desactivado (activo=0), no se mostraba ninguna advertencia. El badge "Cliente desactivado" ya existía para clientes, pero no había equivalente para equipos.

**Cambios:**
- Nuevo estado `equipoNoExiste` en `OrdenTrabajo.jsx`
- Detección automática: si `equipo_id` existe pero el API retorna 404 → `equipoNoExiste = true`
- Fallback: si no se encuentra en la lista local y tiene `equipo_id` → `equipoNoExiste = true`
- Badge rojo **"⚠ Equipo desactivado — el equipo asociado fue desactivado del sistema"** en `OrdenFormEquipo.jsx`
- Badge éxito solo se muestra cuando `equipoOtroCliente` y `equipoNoExiste` son ambos `false`
- Reset automático al seleccionar equipo, cambiar cliente, o abrir nueva orden

### 31. Fix campo Matriz/Sucursal no se cargaba al editar cliente
**Fecha:** Julio 2026
**Archivo modificado:** `frontend/src/components/clientes/ClienteFormulario.jsx`

**Problema:** Al editar un cliente con sucursales guardadas, el campo "Tipo" (Matriz/Sucursal) aparecía vacío en el select.

**Causa:** `toUpper()` convertía "Matriz" a "MATRIZ", pero los `<option value="Matriz">` del select mantenían el valor original. No coincidían, así que el select mostraba "Seleccionar".

**Solución:** Quitar `toUpper()` de `tipo_direccion` en el parseo de direcciones (línea 31).

### 32. Badge "Cliente desactivado" (antes "inactivo")
**Fecha:** Julio 2026
**Archivo modificado:** `frontend/src/components/ordenes/OrdenFormCliente.jsx`

**Cambio:** Texto del badge de "⚠ Cliente inactivo" → "⚠ Cliente desactivado" para ser consistente con el soft delete (activo=0, no se borra de la DB).

### 33. Columna email agregada a tabla clientes
**Fecha:** Julio 2026
**Archivos modificados:**
- `backend/routes/clientes.js` (POST y PUT incluyen `email`)
- `frontend/src/components/clientes/ClienteFormulario.jsx` (campo email en formulario)
- **Migración SQL:** `ALTER TABLE clientes ADD COLUMN email VARCHAR(255) AFTER telefono;`

**Problema:** El código del backend incluía `email` en INSERT/UPDATE pero la tabla no tenía esa columna, causando error `ER_BAD_FIELD_ERROR`.

---

## Cambios Recientes (Julio 2026)

### 34. Seguridad: authMiddleware en todos los GET + adminOnly
**Fecha:** Julio 2026
**Archivos modificados:**
- `backend/middleware/authMiddleware.js` — nuevo export `adminOnly`, distinción `TokenExpiredError`
- `backend/routes/clientes.js` — GET `/` y GET `/next-codigo` ahora requieren auth
- `backend/routes/equipos.js` — GET `/`, GET `/next-codigo`, GET `/:id` ahora requieren auth
- `backend/routes/ordenes.js` — GET `/siguiente-numero` y GET `/verificar/:numeroOrden` ahora requieren auth
- `backend/routes/auth.js` — `registrar`, `resetear-password`, `activar-usuario`, `eliminar-usuario`, `actualizar-usuario` ahora requieren `adminOnly`

**Problema:** 6 endpoints GET exponían datos de clientes, equipos y órdenes sin autenticación. Cualquier usuario autenticado podía crear usuarios, resetear passwords y eliminar cuentas.

**Solución:**
1. Agregado `authMiddleware` a todos los GET endpoints protegidos
2. Nuevo middleware `adminOnly` que verifica `req.user.rol === 'admin'`
3. Agregado `adminOnly` a endpoints sensibles de gestión de usuarios

### 35. Fix cambiar-password: usar req.user en vez de req.body
**Fecha:** Julio 2026
**Archivo modificado:** `backend/routes/auth.js`

**Problema:** El endpoint `cambiar-password` tomaba `usuario` de `req.body`, permitiendo que cualquier usuario autenticado cambiara el password de CUALQUIER otro usuario.

**Solución:** Cambiar `const { usuario, passwordActual, nuevaPassword } = req.body` por `const { passwordActual, nuevaPassword } = req.body; const usuario = req.user.usuario;`

### 36. Fix SUCURSAL_VACIA shared object reference
**Fecha:** Julio 2026
**Archivo modificado:** `frontend/src/components/clientes/ClienteFormulario.jsx`

**Problema:** `SUCURSAL_VACIA` era una constante usada 5 veces en un array. Todos los elementos apuntaban al mismo objeto en memoria, causando bug latente de mutación compartida.

**Solución:** Reemplazado `const SUCURSAL_VACIA = {...}` por `const crearSucursalVacia = () => ({...})`. Todas las referencias ahora llaman a la función para obtener objetos frescos.

### 37. Fix resetFormulario en OT que limpiaba filtros
**Fecha:** Julio 2026
**Archivo modificado:** `frontend/src/pages/OrdenTrabajo.jsx`

**Problema:** `resetFormulario()` reseteaba `filtroNumeroOrden`, `filtroGarantia` y `filtroEstado`, borrando los filtros activos del listado al guardar o cancelar una orden.

**Solución:** Eliminadas las líneas `setFiltroNumeroOrden("")`, `setFiltroGarantia("todos")` y `setFiltroEstado("todos")` de `resetFormulario()`.

### 38. Fix seleccionarEquipoPorCodigo re-cargaba clientes
**Fecha:** Julio 2026
**Archivo modificado:** `frontend/src/pages/OrdenTrabajo.jsx`

**Problema:** Al seleccionar un equipo por código, se hacía `api.get("/api/clientes")` para buscar el cliente asociado, aunque los clientes ya estaban cargados en estado local.

**Solución:** Reemplazado `api.get('/api/clientes')` por `clientes.find(c => c.id === eq.cliente_id)` usando el array local.

### 39. cerrarSesion extraída a utility compartida
**Fecha:** Julio 2026
**Archivos modificados:**
- `frontend/src/utils/helpers.js` — nueva función `cerrarSesion()`
- `frontend/src/pages/Home.jsx` — importa de helpers
- `frontend/src/pages/Cotizaciones.jsx` — importa de helpers
- `frontend/src/pages/Informes.jsx` — importa de helpers
- `frontend/src/pages/OrdenCompra.jsx` — importa de helpers
- `frontend/src/pages/Equipos.jsx` — importa de helpers
- `frontend/src/pages/GestionUsuarios.jsx` — importa de helpers
- `frontend/src/pages/OrdenTrabajo.jsx` — importa de helpers

**Problema:** `cerrarSesion()` estaba duplicada en 8 páginas con código idéntico.

**Solución:** Función centralizada en `helpers.js` usando `window.location.href = "/login"` en vez de `navigate()`.

### 40. AbortController en useEffects con fetch
**Fecha:** Julio 2026
**Archivos modificados:**
- `frontend/src/pages/Clientes.jsx`
- `frontend/src/pages/Equipos.jsx`
- `frontend/src/pages/OrdenTrabajo.jsx`

**Problema:** Los useEffects que cargaban datos no tenían cleanup, causando memory leaks si el componente se desmontaba antes de que completaran las llamadas API.

**Solución:** Agregado `AbortController` al useEffect principal de cada página. Los fetch functions ahora aceptan `signal` y lo pasan a `api.get()`. El cleanup aborta las llamadas pendientes.

### 41. CSS duplicado limpiado
**Fecha:** Julio 2026
**Archivos modificados:**
- `frontend/src/components/clientes/clientes-componentes.css` — eliminado `.btn-nuevo-cliente` duplicado
- `frontend/src/pages/Equipos.css` — eliminado `.btn-nuevo-cliente` duplicado

**Problema:** `.btn-nuevo-cliente` estaba definido 3 veces (index.css, clientes-componentes.css, Equip.css) con reglas idénticas.

**Solución:** Mantenida solo la definición en `index.css`, eliminadas las duplicadas.

### 42. toUpper unificado en EquipoFormulario
**Fecha:** Julio 2026
**Archivo modificado:** `frontend/src/components/equipos/EquipoFormulario.jsx`

**Problema:** `EquipoFormulario.jsx` definía una función local `toUpper` en vez de importar la compartida de `utils/helpers.js`.

**Solución:** Agregado import de `toUpper` desde `../../utils/helpers` y eliminada la definición local.

### 43. Opción "Solo Desactivar" en eliminación de clientes con equipos
**Fecha:** Julio 2026
**Archivos modificados:**
- `backend/routes/clientes.js` (ambas ramas)
- `frontend/src/components/clientes/ModalReasignarEquipos.jsx`
- `frontend/src/pages/Clientes.jsx`

**Problema:** Al intentar eliminar un cliente con equipos asociados, solo se ofrecía la opción de reasignar cada equipo a otro cliente. No había forma de desactivar el cliente y dejar los equipos sin dueño (por si se van a reasignar después desde el módulo Equipos).

**Solución:**
1. **Backend**: Nuevo endpoint `PUT /api/clientes/:id/desactivar` — en una transacción, pone `cliente_id = NULL` en todos los equipos del cliente y desactiva el cliente (`activo = 0`)
2. **Frontend**: Botón rojo "Solo Desactivar" en el modal `ModalReasignarEquipos`, con doble confirmación (prompt + confirm)
3. **Clientes.jsx**: Nueva función `desactivarSinReasignar()` que cierra el modal y refresca la lista

**Flujo de eliminación de cliente:**
- Sin equipos → se desactiva directo
- Con equipos → modal con 3 opciones:
  - **Reasignar y Eliminar**: asigna equipos a otro cliente y elimina el registro
  - **Solo Desactivar**: desvincula equipos (quedan sin cliente) y desactiva el cliente
  - **Cancelar**: no hace nada
- Equipos sin cliente (`cliente_id = NULL`) se muestran con `-` en tabla/tarjetas del módulo Equipos
- Se pueden reasignar después desde el formulario de edición de cada equipo (`PUT /:id/reasignar`)

---

## Historial de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 17 Mayo 2026 | Sistema base con Clientes, Equipos, Órdenes |
| 1.1 | 17-18 Mayo 2026 | Responsive móvil, fix Vercel, optimización |
| 1.2 | 18 Mayo 2026 | Documentación completa |
| 1.3 | 18 Mayo 2026 | Separación ramas main (MySQL) vs deploy/cloud (PostgreSQL), fix fechas editar orden |
| 1.4 | 20 Mayo 2026 | Fix FK cliente_id en seed script, toggle hide/show, paginación 10 items, botón Limpiar filtros, paginación 4 items, paginación OT |
| 1.5 | Julio 2026 | Campos actividad y observaciones en OT, columna y filtro de estado |
| 1.6 | Julio 2026 | Mayúsculas automáticas en formularios (Clientes, Equipos, OT), limpieza de código muerto |
| 1.7 | Julio 2026 | Vista expandida de cliente compacta, teléfono visible en dropdown OT |
| 1.8 | Julio 2026 | Fix cascade actividades/observaciones en OT, fix doble confirm eliminar OT |
| 1.9 | Julio 2026 | Mostrar actividad/observaciones en Equipos y Clientes, fix INSERT equipos, Contador Páginas OUT en OT, keepalive MySQL |
| 1.10 | Julio 2026 | Badges "Cliente inactivo" y "Equipo asignado a otro cliente" en formulario OT |
| 1.11 | Julio 2026 | Fix limpieza de datos al cambiar cliente en OT, botón "+ Nuevo" visible solo cuando no tiene cliente/equipo, rate limiter subido a 500 |
| 1.12 | Julio 2026 | Filtros separados en Equipos (Código, Cliente, Modelo, Serie), botón Limpiar azul always visible, fix alineación filtros OT, filtro N° de Orden con label y mismo tamaño que los demás |
| 1.13 | Julio 2026 | Badge "Equipo desactivado" en OT, badge "Cliente desactivado" (antes "inactivo"), fix campo Matriz/Sucursal no se cargaba al editar cliente, columna email agregada a tabla clientes |
| 1.14 | Julio 2026 | Seguridad: authMiddleware en todos los GET, adminOnly en gestión usuarios, fix cambiar-password. Bugs: SUCURSAL_VACIA compartida, resetFormulario limpiaba filtros, seleccionarEquipoPorCodigo re-cargaba clientes. Mejoras: cerrarSesion compartida, AbortController en fetch, CSS duplicado limpiado, toUpper unificado en helpers |
| 1.15 | Julio 2026 | Opción "Solo Desactivar" en eliminación de clientes con equipos (endpoint desactivar, modal con 3 opciones) |

---

## Fix Críticos (17 Mayo 2026)

### 22. Fix CORS - Agregar Vercel a origins permitidos

**Archivo:** `backend/server.js`

**Solución:** Agregar `https://hls-soluciones.vercel.app` al array de allowedOrigins.

### 23. Fix PostgreSQL - Convertir backend completo

**Archivos modificados:**
- `backend/config/db.js` - mysql2 → pg
- `backend/package.json` - dependencia mysql2 → pg
- `backend/routes/auth.js` - sintaxis PostgreSQL
- `backend/routes/equipos.js` - sintaxis PostgreSQL
- `backend/routes/clientes.js` - sintaxis PostgreSQL
- `backend/routes/ordenes.js` - sintaxis PostgreSQL

**Cambios clave:**
- `?` → `$1, $2, ...`
- `IFNULL()` → `COALESCE()`
- `GROUP_CONCAT()` → `STRING_AGG()`
- `INSERT ...` → `INSERT ... RETURNING id`
- `ON DUPLICATE KEY` → `ON CONFLICT`
- `ER_DUP_ENTRY` → `23505`

### 24. Endpoint para crear admin

**Archivo:** `backend/routes/auth.js`

**Endpoint:** `POST /api/auth/setup-admin` con key `hls-setup-2026`

**Credenciales:** usuario: `admin`, contraseña: `admin123`

---

## Rama `main` vs `deploy/cloud`

| Aspecto | `main` (Local) | `deploy/cloud` (Web) |
|---------|---------------|---------------------|
| Base de datos | MySQL (mysql2) | PostgreSQL (pg) |
| Backend config | `backend/config/db.js` con mysql2 | `backend/config/db.js` con pg |
| Backend routes | Sintaxis MySQL | Sintaxis PostgreSQL |
| Package.json | Dependencia `mysql2` | Dependencia `pg` |
| Frontend | Igual en ambas | Igual en ambas |

**Reglas:**
- Trabajar en `main`, hacer merge a `deploy/cloud` **sin sobrescribir backend** (PostgreSQL)
- Si se toca frontend, se puede copiar el archivo directamente a ambas ramas
- `main` usa MySQL local; `deploy/cloud` usa PostgreSQL en Neon/Render

## Historial de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 17 Mayo 2026 | Sistema base con Clientes, Equipos, Órdenes |
| 1.1 | 17-18 Mayo 2026 | Responsive móvil, fix Vercel, optimización |
| 1.2 | 18 Mayo 2026 | Documentación completa |
| 1.3 | 18 Mayo 2026 | Separación ramas main (MySQL) vs deploy/cloud (PostgreSQL), fix fechas editar orden |
| 1.4 | 20 Mayo 2026 | Fix FK cliente_id en seed script, toggle hide/show secciones, paginación 10 items, botón Limpiar filtros, paginación 4 items, paginación OT |
| 1.5 | Julio 2026 | Campos actividad y observaciones en OT, columna y filtro de estado |
| 1.6 | Julio 2026 | Mayúsculas automáticas en formularios (Clientes, Equipos, OT), limpieza de código muerto |
| 1.7 | Julio 2026 | Vista expandida de cliente compacta, teléfono visible en dropdown OT |
| 1.8 | Julio 2026 | Fix cascade actividades/observaciones en OT, fix doble confirm eliminar OT |
| 1.9 | Julio 2026 | Mostrar actividad/observaciones en Equipos y Clientes, fix INSERT equipos, Contador Páginas OUT en OT, keepalive MySQL |
| 1.10 | Julio 2026 | Badges "Cliente inactivo" y "Equipo asignado a otro cliente" en formulario OT |
| 1.11 | Julio 2026 | Fix limpieza de datos al cambiar cliente en OT, botón "+ Nuevo" visible solo cuando no tiene cliente/equipo, rate limiter subido a 500 |
| 1.12 | Julio 2026 | Filtros separados en Equipos (Código, Cliente, Modelo, Serie), botón Limpiar azul always visible, fix alineación filtros OT, filtro N° de Orden con label y mismo tamaño que los demás |
| 1.13 | Julio 2026 | Badge "Equipo desactivado" en OT, badge "Cliente desactivado" (antes "inactivo"), fix campo Matriz/Sucursal no se cargaba al editar cliente, columna email agregada a tabla clientes |
| 1.14 | Julio 2026 | Seguridad: authMiddleware en todos los GET, adminOnly en gestión usuarios, fix cambiar-password. Bugs: SUCURSAL_VACIA compartida, resetFormulario limpiaba filtros, seleccionarEquipoPorCodigo re-cargaba clientes. Mejoras: cerrarSesion compartida, AbortController en fetch, CSS duplicado limpiado, toUpper unificado en helpers |
| 1.15 | Julio 2026 | Opción "Solo Desactivar" en eliminación de clientes con equipos (endpoint desactivar, modal con 3 opciones) |

## Cambios Recientes (20 Mayo 2026)

### 24. Fix FK cliente_id en Seed Script
**Archivo modificado:** `scripts/seed-test-data.js`

**Problema:** El seed script usaba `distribucion[i]` (índice 1-based) como `cliente_id` al insertar equipos y OT, pero los IDs reales de la DB no comienzan en 1 si hay registros pre-existentes. Esto causaba que los equipos y OT quedaran con `cliente_id` incorrectos (huérfanos o apuntando al cliente equivocado), y el mantenedor mostraba 0 órdenes de trabajo asociadas.

**Soluciones:**
1. **Seed**: Ahora inserta clientes, luego consulta sus IDs reales por código (`SELECT id FROM clientes WHERE codigo IN (...)`), y usa ese mapeo para equipos y OT
2. **Equipo_id en OT**: También se consulta el ID real del equipo por código
3. Se cambió a `INSERT IGNORE` para ser re-ejecutable sin duplicados
4. Se agregaron 20 clientes adicionales (total 50 en el seed)

### 25. Toggle Hide/Show en ClienteExpandido
**Archivos modificados:**
- `frontend/src/components/clientes/ClienteExpandido.jsx`
- `frontend/src/components/clientes/clientes-componentes.css`

**Cambios:**
- Cada sección (Equipos Asociados, Órdenes de Trabajo) tiene un botón toggle (chevron up/down) que oculta/muestra el contenido
- Estados independientes: `mostrarEquipos` y `mostrarOTs`
- Botón con hover que cambia a color primary

### 26. Paginación en Equipos Asociados y Órdenes de Trabajo
**Archivos modificados:**
- `frontend/src/components/clientes/ClienteExpandido.jsx`
- `frontend/src/components/clientes/clientes-componentes.css`

**Cambios:**
- 10 items por página con slice en frontend
- Componente `Paginacion` reutilizable con ventana de 7 números y ellipsis
- Estados `pagEquipos` y `pagOTs` independientes
- Se resetea a página 1 al cambiar la cantidad de datos (useEffect)
- Estilos `.paginacion-cliente` con botones compactos de 32px

### 27. Paginación 4 items y botón Limpiar en filtros
**Archivos modificados:**
- `frontend/src/components/clientes/ClienteExpandido.jsx`
- `frontend/src/components/clientes/FiltrosCliente.jsx`
- `frontend/src/components/clientes/clientes-componentes.css`
- `frontend/src/pages/Clientes.jsx`

**Cambios:**
- Items por página reducido de 10 a 4 (ITEMS_POR_PAG = 4)
- Botón "Limpiar" en FiltrosCliente con estilo cf-btn-c (fondo #f1f5f9), visible solo cuando hay filtro activo
- Limpia ambos campos (Razón Social y RUT) al hacer clic

### 28. Paginación en Orden de Trabajo
**Archivos modificados:**
- `frontend/src/pages/OrdenTrabajo.jsx`
- `frontend/src/components/ordenes/OrdenLista.jsx`

**Cambios:**
- Fetch de todas las órdenes sin límite (`limit=10000`) y paginación frontend con `slice()`
- 4 items por página (`ITEMS_POR_PAG = 4`)
- Reseteo a página 1 al cambiar filtros (useEffect)
- Filtros ahora actúan sobre el dataset completo, no solo la página actual

### 29. Campos Actividad y Observaciones en Orden de Trabajo
**Fecha:** Julio 2026
**Archivos modificados:**
- `backend/crear_tablas.sql`
- `backend/routes/ordenes.js` (ambas ramas)
- `frontend/src/pages/OrdenTrabajo.jsx`
- `frontend/src/components/ordenes/OrdenFormAveria.jsx`
- `scripts/migrar_actividad_observaciones.sql` (nuevo)

**Cambios:**
- Agregados campos `actividad TEXT` y `observaciones TEXT` a la tabla `ordenes_trabajo`
- Backend POST y PUT reciben, guardan y devuelven ambos campos
- Frontend: textarea "Actividad" y "Observaciones" debajo de "Avería/Falla/Incidencia" en formulario nueva/editar orden
- Migración SQL para DB local (MySQL) y nube (PostgreSQL/Neon)

**Migración SQL:**
- MySQL: `scripts/migrar_actividad_observaciones.sql`
- PostgreSQL (Neon):
```sql
ALTER TABLE ordenes_trabajo ADD COLUMN IF NOT EXISTS actividad TEXT;
ALTER TABLE ordenes_trabajo ADD COLUMN IF NOT EXISTS observaciones TEXT;
```

### 31. Mayúsculas automáticas en formularios y vistas
**Fecha:** Julio 2026
**Archivos modificados:**
- `frontend/src/pages/Clientes.jsx`
- `frontend/src/components/clientes/clientes-componentes.css`
- `frontend/src/pages/Equipos.jsx`
- `frontend/src/pages/Equipos.css`
- `frontend/src/components/equipos/EquipoFormulario.jsx`
- `frontend/src/pages/OrdenTrabajo.jsx`
- `frontend/src/pages/OrdenTrabajo.css`
- `frontend/src/components/ordenes/OrdenFormCliente.jsx`
- `frontend/src/components/ordenes/OrdenFormEquipo.jsx`
- `frontend/src/components/ordenes/OrdenFormAveria.jsx`
- `frontend/src/components/ordenes/OrdenFormInsumos.jsx`

**Cambios:**
- Todos los campos de texto (inputs, textareas) convierten automáticamente a MAYÚSCULAS al escribir
- Excepciones: Email (permite mayúsculas y minúsculas), Fono/contador (solo números)
- Al **editar** un registro existente, los datos se cargan en mayúsculas aunque estén guardados en minúsculas
- La **vista de tabla/tarjetas** muestra todo en mayúsculas via CSS (`text-transform: uppercase`)
- Búsquedas de cliente y serie también se muestran en mayúsculas
- Se eliminó código muerto: imports no usados, estado `equiposCodigo`, variable `usuarioActual` en Equipos

**Módulos afectados:**
- **Clientes** (Crear/Editar): razón social, giro, dirección, ciudad, comuna, contacto, cargo, dirección contacto, sucursales
- **Equipos** (Crear/Editar): equipo, marca, modelo, serie, nivel tintas, insumos, avería
- **Orden de Trabajo** (Crear/Editar): cliente, dirección, comuna, contacto, técnico, equipo, marca, modelo, serie, nivel tinta, insumos, avería, actividad, observaciones

**Para revertir:** Quitar `.toUpperCase()` de los `onChange` y `toUpper()` de las funciones `editar*` y `setNuevaOrden`. Quitar reglas CSS `text-transform: uppercase` de `clientes-componentes.css`, `Equipos.css` y `OrdenTrabajo.css`.

### 32. Teléfono visible en dropdown de búsqueda de cliente (OT)
**Fecha:** Julio 2026
**Archivos modificados:**
- `frontend/src/components/ordenes/OrdenFormCliente.jsx`

**Cambios:**
- El dropdown de búsqueda de cliente en Nueva/Editar Orden ahora muestra el teléfono del cliente (`Tel: +569...`)
- Formato: `RUT: XX.XXX.XXX-X | Dirección, Comuna | Tel: +569XXXXXXXX`
- El teléfono ya se cargaba en "Fono Principal" al seleccionar; ahora también es visible antes de seleccionar

### 33. Vista expandida de cliente más compacta
**Fecha:** Julio 2026
**Archivos modificados:**
- `frontend/src/components/clientes/ClienteExpandido.jsx`
- `frontend/src/components/clientes/clientes-componentes.css`

**Cambios:**
- Header reducido: padding 20px → 8px, font 1.25rem → 0.85rem, botones más pequeños
- Datos del cliente: padding 20px → 6px, gap 16px → 4px, font más pequeño
- Secciones Equipos/OTs: padding 20px → 6px, márgenes reducidos
- Tablas internas: padding 12px → 5px, font 0.9rem → 0.75rem
- Paginación: botones 32px → 22px
- Iconos: todos reducidos (~10-12px)
- Todo el contenido se ve significativamente más compacto sin perder funcionalidad

**Para revertir:** Aumentar los valores de padding, font-size, gap y size de iconos en `clientes-componentes.css` y `ClienteExpandido.jsx`.

### 34. Fix cascade actividades/observaciones en OT
**Fecha:** Julio 2026
**Archivo modificado:** `backend/routes/ordenes.js`

**Problema:** Al editar una OT que tenía actividad y observaciones, esos campos no se actualizaban en el registro maestro del equipo (tabla `equipos`).

**Causa:** El `PUT /api/ordenes/:id` ejecuta un `UPDATE equipos SET ...` para cascada de cambios, pero las columnas `actividad` y `observaciones` no estaban incluidas en ese query.

**Solución:** Agregados `actividad = ?` y `observaciones = ?` al `UPDATE` cascade.

### 35. Fix doble confirm al eliminar OT
**Fecha:** Julio 2026
**Archivo modificado:** `frontend/src/pages/OrdenTrabajo.jsx`

**Problema:** Al eliminar una orden de trabajo, se mostraban dos diálogos de confirmación (confirm + alert).

**Solución:** Eliminado el `alert("Orden eliminada exitosamente")` redundante. La lista se refresca automáticamente.

### 36. Mostrar actividad/observaciones en módulo Equipos
**Fecha:** Julio 2026
**Archivos modificados:**
- `frontend/src/components/equipos/EquipoTabla.jsx`
- `frontend/src/components/equipos/EquipoCard.jsx`

**Cambios:**
- Tabla: fila expandida con chevron muestra actividad/observaciones
- Tarjetas: filas de actividad y observaciones debajo de avería

### 37. Mostrar actividad/observaciones en tabla OT de Clientes
**Fecha:** Julio 2026
**Archivo modificado:** `frontend/src/components/clientes/ClienteExpandido.jsx`

**Cambios:** Agregadas columnas "Actividad" y "Observaciones" a la tabla de OT del módulo Clientes

### 38. Fix INSERT equipos desde OT — actividad/observaciones
**Fecha:** Julio 2026
**Archivos modificados:**
- `backend/routes/ordenes.js` (main — MySQL)
- `backend/routes/ordenes.js` (deploy/cloud — PostgreSQL)

**Problema:** Al crear OT nueva con equipo nuevo, el INSERT en `equipos` no incluía actividad ni observaciones.

**Solución:** Agregados `actividad` y `observaciones` al INSERT de equipos en POST y PUT.

### 39. Agregar Contador Páginas OUT al formulario de OT
**Fecha:** Julio 2026
**Archivo modificado:** `frontend/src/components/ordenes/OrdenFormEquipo.jsx`

**Cambios:** Campo "Contador Páginas OUT" agregado junto a "Nivel de Tinta" en la grilla de Datos del Equipo

### 40. Fix pool MySQL — keepalive y connectTimeout
**Fecha:** Julio 2026
**Archivo modificado:** `backend/config/db.js` (solo rama `main`)

**Problema:** Se perdía conexión MySQL cuando la conexión quedaba idle.

**Solución:** Agregados `enableKeepAlive: true`, `keepAliveInitialDelay: 0`, `connectTimeout: 10000` al pool.

### 41. Filtros separados en Equipos y fix alineación OT
**Fecha:** Julio 2026
**Archivos modificados:**
- `frontend/src/components/equipos/FiltrosEquipo.jsx`
- `frontend/src/pages/Equipos.jsx`
- `frontend/src/pages/Equipos.css`
- `frontend/src/components/equipos/EquipoTabla.jsx`
- `frontend/src/components/ordenes/ordenes-componentes.css`

**Cambios:**
- **Equipos**: Filtros separados en 4 inputs independientes: Código, Cliente, Modelo, Serie (antes étaita todo junto en un solo filtro)
- Código se convierte a mayúsculas automáticamente
- Eliminado estado `busqueda` de Equipos.jsx, reemplazado por `filtroCodigo` y `filtroCliente` separados
- EquipoTabla: prop `busqueda` renombrada a `hayBusqueda` (boolean)
- **Botón Limpiar**: siempre visible (no solo cuando hay filtro activo), color azul (`var(--primary)`) en vez de rojo
- **CSS**: Filtros de Equipos ahora iguales a los de Clientes (`width: 200px`, `font-size: 0.85rem`, `padding: 6px 10px`)
- **OT**: Fix alineación filtros con botón "Nueva Orden" — `align-items: flex-end` en vez de `center`
- **OT**: Filtro "N° de Orden" ahora tiene label arriba y usa clase `filtro-garantia-select` (mismo tamaño que Garantía, Estado, Desde, Hasta). Eliminado CSS viejo `filtro-orden-input`
