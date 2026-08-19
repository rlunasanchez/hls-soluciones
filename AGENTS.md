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
- `upperInput(e, regex?)` — aplica mayúsculas (y regex opcional) directamente en el DOM del input, restaura la posición del caret y retorna el valor transformado. Evita que React mueva el cursor al final en inputs controlados

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
DB_PASSWORD=<password_mysql_local>
DB_NAME=soporte_tecnico_db
JWT_SECRET=<generado_con:_openssl_rand_-hex_32>
SETUP_ADMIN_KEY=<key_para_crear_admin_inicial>
ADMIN_PASSWORD=<password_admin_inicial>
ADMIN_EMAIL=<email_admin_inicial>
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
| `JWT_SECRET` | `<generado_con:_openssl_rand_-hex_32>` |
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
| 1.16 | Julio 2026 | Botón "Ver" en todos los módulos (solo lectura), fix alineación botones mobile, filtros OT responsive (N° Orden full width, Desde/Hasta lado a lado), limpieza CSS muerto |
| 1.17 | Julio 2026 | Fix búsqueda Modelo en OT no filtraba (busquedaModelo no se reseteaba), fix equipos GET soporte filtro cliente_id, fix backend deploy/cloud reconstruido (archivos faltantes/corruptos), fix filtros fechas desktop |
| 1.18 | Julio 2026 | Cascade actualización de cliente a OTs asociadas (PUT cliente → UPDATE ordenes_trabajo) |
| 1.19 | 24 Julio 2026 | Múltiples contactos por cliente (tabla clientes_contactos, modal, chips con popup detalle) |
| 1.20 | 24 Julio 2026 | Límite visual de contactos y sucursales: max 4 contactos + toggle, max 1 sucursal + toggle, max-height con scroll, bordes solid en todos los botones toggle |
| 1.21 | 27 Julio 2026 | Botones Ver/Editar cliente en OT: "Ver" en modo solo lectura abre modal read-only; "Editar" en modo edición navega a /clientes con returnToOT. Al guardar cliente vuelve a editar OT con datos frescos. Fix: lookup cliente por API si no está en lista local, sobreescribe campos stale del cliente en volver |
| 1.22 | 27 Julio 2026 | Fix editarOrden sobreescribía datos del cliente de la OT con datos frescos del API — campos cliente/direccion/comuna/contacto/fonoPrincipal ahora se mantienen desde el snapshot de la OT |
| 1.23 | 27 Julio 2026 | Botones Ver/Editar equipo en OT (modal inline + navegación returnToOT), fix sobreescribir datos equipo al editar OT, eliminado cascade UPDATE equipos desde PUT ordenes |
| 1.24 | 27 Julio 2026 | Fix deploy/cloud: auth adminOnly en GET/usuarios, crear-admin sin password hardcodeado, migración columnas actividad/observaciones en tabla equipos Neon |
| 1.25 | 27 Julio 2026 | Fix Cancelar en editar cliente desde OT vuelve a editar OT |
| 1.26 | 27 Julio 2026 | Tablas: nowrap, truncado de texto con ellipsis, botones acciones visibles |

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

**Endpoint:** `POST /api/auth/setup-admin` con key `SETUP_ADMIN_KEY` (variable de entorno, ver `backend/.env`)

**Credenciales:** usuario: `admin`, contraseña: `ADMIN_PASSWORD` (variable de entorno, ver `backend/.env`)

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
- **NUNCA hacer `git merge main` directo a `deploy/cloud` sin verificar los archivos backend**
- **Siempre resolver conflictos aceptando la versión de `deploy/cloud` para archivos backend**

### ⚠️ Problema conocido: Archivos backend corruptos (UTF-16)

**Fecha:** Julio 2026

**Problema:** Los archivos backend de ambas ramas quedaron guardados en git como UTF-16 (con BOM) en vez de UTF-8. Al hacer `git restore`, los archivos se restauraban corruptos. Además, en algún momento los archivos PostgreSQL de `deploy/cloud` se copiaron a `main`, dejando el backend local con sintaxis PostgreSQL en vez de MySQL.

**Síntomas:**
- `node server.js` falla con `ERR_INVALID_PACKAGE_CONFIG`
- `file backend/package.json` muestra `Unicode text, UTF-16`
- Archivos muestran caracteres extraños (`├│`, `├í`, `├▒`)
- Backend de `main` tiene `pg` en vez de `mysql2`, `$1` en vez de `?`

**Causa:** Commits anteriores guardaron los archivos en UTF-16 (posiblemente por editor o merge tool). Luego un merge incorrecto de `main` a `deploy/cloud` sobrescribió los archivos backend de `main` con sintaxis PostgreSQL.

**Solución aplicada:**
1. Reescribir todos los archivos backend como UTF-8 correcto
2. Restaurar sintaxis MySQL en `main` (`?`, `result[0]`, `IFNULL`, `GROUP_CONCAT`, `insertId`, `pool.getConnection()`)
3. Restaurar sintaxis PostgreSQL en `deploy/cloud` (`$1, $2...`, `result.rows`, `COALESCE`, `STRING_AGG`, `RETURNING id`, `pool.connect()`)

**Archivos que SIEMPRE difieren entre ramas (backend):**
- `backend/config/db.js` — mysql2 vs pg
- `backend/package.json` — dependencia mysql2 vs pg
- `backend/routes/auth.js` — sintaxis MySQL vs PostgreSQL
- `backend/routes/clientes.js` — sintaxis MySQL vs PostgreSQL
- `backend/routes/equipos.js` — sintaxis MySQL vs PostgreSQL
- `backend/routes/ordenes.js` — sintaxis MySQL vs PostgreSQL
- `backend/middleware/authMiddleware.js` — idéntico en ambas
- `backend/server.js` — idéntico en ambas

**Para verificar que los archivos están bien:**
```bash
# En main, debe mostrar ASCII/UTF-8 (NO UTF-16)
file backend/package.json backend/config/db.js backend/routes/*.js

# En main, debe usar mysql2
grep "mysql2" backend/package.json

# En deploy/cloud, debe usar pg
grep '"pg"' backend/package.json
```

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
| 1.16 | Julio 2026 | Botón "Ver" en todos los módulos (solo lectura), fix alineación botones mobile, filtros OT responsive |
| 1.17 | Julio 2026 | Fix búsqueda Modelo en OT no filtraba (busquedaModelo no se reseteaba), fix equipos GET soporte filtro cliente_id, fix backend deploy/cloud reconstruido (archivos faltantes/corruptos), fix filtros fechas desktop |
| 1.18 | Julio 2026 | Cascade actualización de cliente a OTs asociadas (PUT cliente → UPDATE ordenes_trabajo) |
| 1.19 | 24 Julio 2026 | Múltiples contactos por cliente (tabla clientes_contactos, modal, chips con popup detalle) |
| 1.20 | 24 Julio 2026 | Límite visual de contactos y sucursales: max 4 contactos + toggle, max 1 sucursal + toggle, max-height con scroll, bordes solid en todos los botones toggle |
| 1.21 | 27 Julio 2026 | Botones Ver/Editar cliente en OT: "Ver" en modo solo lectura abre modal read-only; "Editar" en modo edición navega a /clientes con returnToOT. Al guardar cliente vuelve a editar OT con datos frescos. Fix: lookup cliente por API si no está en lista local, sobreescribe campos stale del cliente en volver |
| 1.22 | 27 Julio 2026 | Fix editarOrden sobreescribía datos del cliente de la OT con datos frescos del API — campos cliente/direccion/comuna/contacto/fonoPrincipal ahora se mantienen desde el snapshot de la OT |
| 1.23 | 27 Julio 2026 | Botones Ver/Editar equipo en OT (modal inline + navegación returnToOT), fix sobreescribir datos equipo al editar OT, eliminado cascade UPDATE equipos desde PUT ordenes |
| 1.24 | 27 Julio 2026 | Fix deploy/cloud: auth adminOnly en GET/usuarios, crear-admin sin password hardcodeado, migración columnas actividad/observaciones en tabla equipos Neon |
| 1.25 | 27 Julio 2026 | Fix Cancelar en editar cliente desde OT vuelve a editar OT |
| 1.26 | 27 Julio 2026 | Tablas: nowrap, truncado de texto con ellipsis, botones acciones visibles |
| 1.27 | 28 Julio 2026 | Seguridad: eliminado fallback password hardcodeado "6498" en db.js, ahora solo vía .env. Fix: scrollbar-gutter stable en html para evitar layout shift. Fix: table-layout fixed scoped solo a tablas OT + flex-wrap en action-buttons + mostrar solo número en OT (02800). Refactor: CSS movido a frontend/src/styles/ |

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

### 42. Botón "Ver" en todos los módulos
**Fecha:** Julio 2026
**Archivos modificados:**
- `frontend/src/components/clientes/ClienteLista.jsx`
- `frontend/src/components/equipos/EquipoCard.jsx`
- `frontend/src/components/ordenes/OrdenLista.jsx`
- `frontend/src/pages/Clientes.jsx`
- `frontend/src/pages/Equipos.jsx`
- `frontend/src/pages/OrdenTrabajo.jsx`
- `frontend/src/components/ordenes/OrdenFormDatos.jsx`
- `frontend/src/components/ordenes/OrdenFormCliente.jsx`
- `frontend/src/components/ordenes/OrdenFormEquipo.jsx`
- `frontend/src/components/ordenes/OrdenFormAveria.jsx`
- `frontend/src/components/ordenes/OrdenFormInsumos.jsx`

**Cambios:**
- Nuevo botón "Ver" (icono Eye, color teal `#0D9488`) en lista de Clientes, Equipos y OT
- **Clientes/Equipos**: `readOnly` en `ClienteFormulario`/`EquipoFormulario` para modo solo lectura
- **OT**: Implementación completa con `readOnly` en los 5 form components (Datos, Cliente, Equipo, Avería, Insumos), estado `soloLectura`, función `verOrden()`
- En modo solo lectura: todos los inputs se deshabilitan, botones "+ Nuevo", agregar/eliminar se ocultan

### 43. Fix alineación botones mobile
**Fecha:** Julio 2026
**Archivos modificados:**
- `frontend/src/components/clientes/ClienteLista.jsx`
- `frontend/src/components/ordenes/OrdenLista.jsx`
- `frontend/src/index.css`

**Cambios:**
- Eliminados `flex: 1` inline de botones en ClienteLista y OrdenLista mobile
- CSS `.table-btn`: `display: flex; width: 100%; justify-content: flex-start; align-items: center; white-space: nowrap`
- Botones alineados a la izquierda (icono + texto) en mobile
- Botón Ver usa clase `.ver-btn` con color teal `#0D9488`

### 44. Filtros OT responsive mobile
**Fecha:** Julio 2026
**Archivos modificados:**
- `frontend/src/components/ordenes/OrdenLista.jsx`
- `frontend/src/components/ordenes/ordenes-componentes.css`

**Cambios:**
- Filtros de OT en mobile ahora usan CSS Grid 2 columnas
- N° de Orden ocupa las 2 columnas (`filtro-full-width`) en mobile
- Desde/Hasta envueltos en `filtro-fechas-group` (flex row) para estar lado a lado en mobile
- Eliminado CSS `.filtro-mobile-only` no utilizado

### 45. Fix búsqueda Modelo en OT + filtro cliente_id en equipos + backend deploy/cloud reconstruido
**Fecha:** Julio 2026
**Commits:** `a0b4db1` (main), `7883030`/`94e37db` (deploy/cloud), `66fc84d`/`cac2e48` (filtro cliente_id)

**Bug 1: Búsqueda de Modelo en OT no filtraba**
- **Archivo:** `frontend/src/pages/OrdenTrabajo.jsx`
- **Causa:** `busquedaModelo` no se reseteaba en `resetFormulario()`, `abrirNuevaOrden()`, `seleccionarEquipo()`, `seleccionarEquipoPorCodigo()`, ni se sincronizaba en `editarOrden()`/`verOrden()`
- **Fix:** Agregado `setBusquedaModelo('')` en las funciones de reset y apertura; `setBusquedaModelo(equipo.modelo || '')` en selección de equipo; `setBusquedaModelo(ot.equipo_modelo || '')` al editar/ver

**Bug 2: Endpoint equipos GET no soportaba filtro por cliente_id**
- **Archivo:** `frontend/src/components/clientes/ClienteExpandido.jsx`
- `ClienteExpandido` pasaba `?cliente_id=${cliente.id}` pero el backend lo ignoraba
- **Backend main (MySQL):** Agregado `if (clienteId) { sql += ' AND e.cliente_id = ?'; params.push(clienteId); }`
- **Backend deploy/cloud (PostgreSQL):** Agregado `if (clienteId) {条件 += ' AND e.cliente_id = $1'; params.push(clienteId); }`

**Bug 3: Backend deploy/cloud — archivos faltantes o corruptos (UTF-16)**
- **Archivos reconstruidos como UTF-8 PostgreSQL:**
  - `equipos.js`: modelo search en GET `/`, `authMiddleware` en GET, `GET /:id`, `PUT /:id/reasignar`, campos actividad/observaciones
  - `ordenes.js`: Sintaxis completa PostgreSQL (`$1,$2`, `result.rows`, `pool.connect()`, `RETURNING`)
  - `clientes.js`: `authMiddleware` en GET, endpoint `desactivar`, `STRING_AGG`/`COALESCE`
  - `auth.js`: `adminOnly` middleware, `cambiar-password` usa `req.user.usuario`
  - `middleware/authMiddleware.js`: Exporta `authMiddleware` + `adminOnly`, distingue `TokenExpiredError`
  - `package.json`: `pg` dependency, nombre `hls-backend`
  - `crear-admin.js`: Usa `dotenv` en vez de connection string hardcoded

**Mejora: Alineación fechas desktop**
- **Archivo:** `frontend/src/components/ordenes/ordenes-componentes.css`
- `.filtro-fechas-group` con `display: flex; gap: 8px` para que Desde/Hasta estén lado a lado

### 46. Cascade actualización de cliente a OTs asociadas
**Fecha:** Julio 2026
**Archivos modificados:**
- `backend/routes/clientes.js` (ambas ramas)

**Problema:** Al editar un cliente (razón social, dirección, comuna, contacto, teléfono), los cambios no se reflejaban en las Órdenes de Trabajo asociadas. La OT guardaba copias estáticas de los datos del cliente al momento de crearse/editarse, y nunca se actualizaban.

**Causa:** La tabla `ordenes_trabajo` tiene columnas desnormalizadas (`cliente`, `direccion`, `comuna`, `contacto`, `fono_principal`) que son snapshots del cliente en el momento de guardar la OT. No había cascade al editar el cliente.

**Solución:** Agregado cascade en `PUT /api/clientes/:id` — después de actualizar el cliente, se ejecuta un `UPDATE ordenes_trabajo` que sobreescribe los datos desnormalizados en todas las OTs con ese `cliente_id`.

**Query cascade (MySQL - main):**
```sql
UPDATE ordenes_trabajo SET cliente = ?, direccion = ?, comuna = ?, contacto = ?, fono_principal = ? WHERE cliente_id = ?
```

**Query cascade (PostgreSQL - deploy/cloud):**
```sql
UPDATE ordenes_trabajo SET cliente = $1, direccion = $2, comuna = $3, contacto = $4, fono_principal = $5 WHERE cliente_id = $6
```

**Nota:** El cascade está dentro de la transacción — si falla, se hace rollback del UPDATE del cliente también.

### 47. Múltiples Contactos por Cliente
**Fecha:** 24 Julio 2026
**Commits:** `ddbe102`, `02004ca`, `cb7b1b4`, `e9b60d8`

**Problema:** Cada cliente solo podía tener un contacto asociado (campos `contacto_nombre`, `contacto_email`, etc. en la tabla `clientes`). No había forma de guardar múltiples contactos por cliente.

**Solución:** Nueva tabla `clientes_contactos` con relación 1:N a `clientes`.

**Archivos modificados:**
- `backend/routes/clientes.js` (ambas ramas) — GET usa `STRING_AGG`/`GROUP_CONCAT` para concatenar contactos; POST inserta contactos individualmente; PUT borra y re-inserta (delete-and-reinsert)
- `frontend/src/components/clientes/ClienteFormulario.jsx` — array `contactos`, chips de preview, popup de detalle, integración con formulario existente
- `frontend/src/components/clientes/ModalContactos.jsx` (nuevo) — modal para editar contactos adicionales (122 líneas)
- `frontend/src/pages/Clientes.css` — estilos para chips, popup de detalle, modal de contactos

**Migración SQL (PostgreSQL/Neon):**
```sql
CREATE TABLE IF NOT EXISTS clientes_contactos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nombre VARCHAR(100),
  email VARCHAR(100),
  fono VARCHAR(20),
  cargo VARCHAR(100),
  direccion VARCHAR(255)
);

INSERT INTO clientes_contactos (cliente_id, nombre, email, fono, cargo, direccion)
SELECT id, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion
FROM clientes
WHERE contacto_nombre IS NOT NULL AND contacto_nombre != '';
```

**Migración SQL (MySQL/main):**
```sql
CREATE TABLE IF NOT EXISTS clientes_contactos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  nombre VARCHAR(100),
  email VARCHAR(100),
  fono VARCHAR(20),
  cargo VARCHAR(100),
  direccion VARCHAR(255),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

INSERT INTO clientes_contactos (cliente_id, nombre, email, fono, cargo, direccion)
SELECT id, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion
FROM clientes
WHERE contacto_nombre IS NOT NULL AND contacto_nombre != '';
```

**Flujo en Frontend:**
1. El primer contacto de la lista se muestra en los campos principales del formulario (Nombre, Email, Fono, Cargo)
2. Los contactos adicionales se muestran como chips verdes debajo de "Datos del Contacto"
3. Click en chip → popup con detalle del contacto + botones Editar/Eliminar
4. Botón "+ Agregar otro contacto" abre `ModalContactos` para gestionar contactos adicionales
5. Al guardar, se combinan el contacto principal + adicionales y se envían como array `contactos`

**NOTA:** La migración SQL **debe ejecutarse manualmente en Neon** antes de que el frontend funcione correctamente con contactos múltiples.

### 48. Límite visual de contactos y sucursales en formulario de cliente
**Fecha:** 24 Julio 2026
**Archivos modificados:**
- `frontend/src/components/clientes/ClienteFormulario.jsx`
- `frontend/src/pages/Clientes.css`

**Problema:** Al editar un cliente con muchos contactos o sucursales, la pantalla se llenaba de datos y se hacía difícil de navegar.

**Cambios:**
- **Contactos**: máximo 4 chips visibles por defecto, botón `+N más` / `Mostrar menos` para expandir/colapsar
- **Sucursales**: máximo 1 visible por defecto, botón `Ver todas (X)` / `Ver menos` para expandir/colapsar
- **Scroll**: contenedor de chips con `max-height: 120px` y scrollbar custom para evitar deformación de pantalla
- **"+ Agregar" sucursal**: expande automáticamente al agregar una nueva
- **Bordes solid**: todos los botones toggle cambiaron de `dashed` a `solid` para consistencia visual

### 49. Fix editarOrden sobreescribía datos del cliente de la OT
**Fecha:** 27 Julio 2026
**Archivo modificado:** `frontend/src/pages/OrdenTrabajo.jsx`

**Problema:** Al editar una OT, cambiar datos del cliente (nombre, dirección, etc.) y guardar, los cambios se reflejaban en la tabla de OT. Pero al volver a editar la misma OT, los campos del cliente se sobreescribían con los datos frescos del API (razón social original, dirección original, etc.), deshaciendo los cambios del usuario.

**Causa:** `editarOrden()` buscaba el cliente asociado y ejecutaba `setNuevaOrden()` para sobreescribir los campos `cliente`, `direccion`, `comuna`, `contacto`, `fonoPrincipal` con los datos actuales del registro `clientes`. Esto anulaba los valores que el usuario había editado y guardado en la OT.

**Solución:** Eliminar los `setNuevaOrden()` del bloque de búsqueda de cliente en `editarOrden()`. La búsqueda de cliente ahora solo setea `clienteSeleccionado` (para badges/estado) y `busquedaCliente` (para el campo de texto). Los campos del cliente en `nuevaOrden` se mantienen desde el snapshot de la OT (ya cargado al inicio de `editarOrden`).

**Nota:** `verOrden()` ya no tenía este problema (no sobreescribía `nuevaOrden`).

### 50. Botones Ver/Editar equipo en OT + fix sobreescribir datos equipo
**Fecha:** 27 Julio 2026
**Archivos modificados:**
- `frontend/src/components/ordenes/OrdenFormEquipo.jsx`
- `frontend/src/pages/Equipos.jsx`
- `frontend/src/pages/Clientes.jsx`
- `frontend/src/pages/OrdenTrabajo.jsx`
- `backend/routes/ordenes.js` (ambas ramas)

**Cambios:**

1. **Botón "Ver" equipo en OT** — Abre modal inline con `EquipoFormulario` en modo solo lectura (no navega fuera de OT, igual que el botón Ver de clientes)

2. **Botón "Editar" equipo en OT** — Navega a `/equipos` con router state `{ equipo, editar: true, returnToOT: true, orden }`. Al guardar en Equipos, retorna a OT con `{ orden, equipoEditado }`.

3. **Equipos.jsx** — Nuevo useEffect detecta nav state desde OT (returnToOT), `guardarEquipo()` retorna con `equipoEditado`, `onCancel` retorna a OT.

4. **Clientes.jsx** — `guardarCliente()` ahora retorna con `clienteEditado` en nav state (antes solo pasaba `orden`).

5. **OrdenTrabajo.jsx init useEffect** — Maneja `clienteEditado` y `equipoEditado` del nav state para actualizar campos en la OT al volver.

6. **Fix: cargarEquipoFresco ya NO sobreescribe datos de la OT** — En `editarOrden()` y `verOrden()`, la función `cargarEquipoFresco()` ya no ejecuta `setNuevaOrden()` para sobreescribir equipo/marca/modelo/serie/nivelTinta/averia con datos de la tabla `equipos`. Solo setea badge/estado (`equipoSeleccionado`, `equipoOtroCliente`, `equipoNoExiste`) y búsquedas. Los campos del equipo en la OT se mantienen desde el snapshot de la OT.

7. **Backend** — Eliminado cascade `UPDATE equipos` desde `PUT /api/ordenes/:id` (ambas ramas). Solo se actualiza la OT, no el registro maestro del equipo.

**Nota:** Mismo patrón que el fix v1.22 para clientes. Los campos desnormalizados en `ordenes_trabajo` (equipo, marca, modelo, serie, etc.) son snapshots del momento de guardar la OT y no deben sobreescribirse con datos frescos de la tabla `equipos`.

### 51. Fix deploy/cloud: sync completo con main
**Fecha:** 27 Julio 2026
**Archivos modificados (solo deploy/cloud):**
- `backend/routes/auth.js` — agregado `adminOnly` a `GET /usuarios` (faltaba, cualquier usuario autenticado veía todas las cuentas)
- `backend/crear-admin.js` — eliminado connection string de Neon hardcodeado, usa dotenv

**Problema:** El deploy/cloud tenía un endpoint `GET /api/auth/usuarios` sin middleware `adminOnly`, lo que permitía que cualquier usuario autenticado (técnico) pudiera listar todas las cuentas de usuario.

**Migración ejecutada en Neon:**
```sql
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS actividad TEXT;
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS observaciones TEXT;
```
Estas columnas faltaban y causaban error 500 al editar/guardar equipos desde OT.

### 52. Fix Cancelar en editar cliente desde OT no volvía a OT
**Fecha:** 27 Julio 2026
**Archivo modificado:** `frontend/src/pages/Clientes.jsx`

**Problema:** Al editar una OT, hacer click en "Editar" en datos del cliente, y luego "Cancelar" en el formulario de cliente, el usuario quedaba en el mantenedor de Clientes en vez de volver a editar la OT.

**Causa:** El `onCancel` del `ClienteFormulario` solo cerraba el formulario (`setMostrarFormulario(false)`) sin verificar si la navegación venía de OT.

**Solución:** Agregada verificación `returnToOT && ordenParaVolver` en `onCancel` — si es true, navega a `/orden-trabajo` con el estado de la orden para continuar editándola.

### 53. Tablas: nowrap, truncado de texto y botones visibles
**Fecha:** 27 Julio 2026
**Archivos modificados:**
- `frontend/src/index.css` — estilos globales `table td`
- `frontend/src/components/clientes/clientes-componentes.css` — estilo `.table-wrapper td`
- `frontend/src/pages/Equipos.css` — estilo `.table-wrapper td`
- `frontend/src/pages/OrdenTrabajo.css` — estilo `.table-wrapper td`

**Problema:**
1. Los datos en las tablas (N° Orden, Cliente, Equipo, etc.) se salían de línea cuando eran largos (ej: "OT-2026-02800" se partía en dos, "AGENCIA DE ADUANAS HERNAN TELLERIA" ocupaba varias líneas)
2. El `overflow: hidden` + `max-width` en `table td` cortaba los botones de acciones (solo se veía "Ver", no "Editar", "Eliminar", etc.)

**Solución:**
- `table td`: `white-space: nowrap` + `overflow: hidden` + `text-overflow: ellipsis` + `max-width: 200px`
- `table td:last-child`: `white-space: normal` + `overflow: visible` + `text-overflow: unset` + `max-width: none`
- Los campos largos se truncan con `...` (no generan scroll horizontal)
- La columna de acciones (última celda) muestra todos los botones completos
- `table-wrapper` mantiene `overflow-x: auto` como fallback

**Archivos con estilo `.table-wrapper td` propio (sobreescribe el global):**
- `clientes-componentes.css:79` — Clientes
- `Equipos.css:71` — Equipos
- `OrdenTrabajo.css:42` — Orden de Trabajo
- Todos tuvieron que actualizarse individualmente porque sobreescriben el estilo global de `index.css`

---

## Historial de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 17 Mayo 2026 | Sistema base con Clientes, Equipos, Órdenes |
| 1.1 | 17-18 Mayo 2026 | Responsive móvil, fix Vercel, optimización |
| 1.2 | 18 Mayo 2026 | Documentación completa |
| 1.3 | 18 Mayo 2026 | Separación ramas main (MySQL) vs deploy/cloud (PostgreSQL), fix fechas editar orden |
| 1.4 | 20 Mayo 2026 | Fix FK cliente_id en seed script, toggle hide/show, paginación 10→4 items, paginación OT |
| 1.5 | Julio 2026 | Campos actividad y observaciones en OT, columna y filtro de estado |
| 1.6 | Julio 2026 | Mayúsculas automáticas en formularios, limpieza de código muerto |
| 1.7 | Julio 2026 | Vista expandida de cliente compacta, teléfono visible en dropdown OT |
| 1.8 | Julio 2026 | Fix cascade actividades/observaciones en OT, fix doble confirm eliminar OT |
| 1.9 | Julio 2026 | Mostrar actividad/observaciones en Equipos y Clientes, fix INSERT equipos, Contador Páginas OUT, keepalive MySQL |
| 1.10 | Julio 2026 | Badges "Cliente inactivo" y "Equipo asignado a otro cliente" en formulario OT |
| 1.11 | Julio 2026 | Fix limpieza de datos al cambiar cliente en OT, botón "+ Nuevo" visible solo cuando no tiene cliente/equipo |
| 1.12 | Julio 2026 | Filtros separados en Equipos, fix alineación filtros OT |
| 1.13 | Julio 2026 | Badge "Equipo desactivado", badge "Cliente desactivado", fix campo Matriz/Sucursal, columna email |
| 1.14 | Julio 2026 | Seguridad: authMiddleware en GET, adminOnly. Bugs: SUCURSAL_VACIA, resetFormulario, cerrarSesion compartida, AbortController |
| 1.15 | Julio 2026 | Opción "Solo Desactivar" en eliminación de clientes con equipos |
| 1.16 | Julio 2026 | Botón "Ver" en todos los módulos, fix alineación botones mobile, filtros OT responsive |
| 1.17 | Julio 2026 | Fix búsqueda Modelo en OT, fix equipos GET filtro cliente_id, backend deploy/cloud reconstruido |
| 1.18 | Julio 2026 | Cascade actualización de cliente a OTs asociadas |
| 1.19 | 24 Julio 2026 | Múltiples contactos por cliente (tabla clientes_contactos, modal, chips con popup detalle) |
| 1.20 | 24 Julio 2026 | Límite visual de contactos y sucursales: max 4 contactos + toggle, max 1 sucursal + toggle, max-height con scroll, bordes solid en todos los botones toggle |
| 1.21 | 27 Julio 2026 | Botones Ver/Editar cliente en OT: "Ver" en modo solo lectura abre modal read-only; "Editar" en modo edición navega a /clientes con returnToOT |
| 1.22 | 27 Julio 2026 | Fix editarOrden sobreescribía datos del cliente de la OT con datos frescos del API |
| 1.23 | 27 Julio 2026 | Botones Ver/Editar equipo en OT (modal inline + navegación returnToOT), fix sobreescribir datos equipo al editar OT, eliminado cascade UPDATE equipos desde PUT ordenes |
| 1.24 | 27 Julio 2026 | Fix deploy/cloud: auth adminOnly en GET/usuarios, crear-admin sin password hardcodeado, migración columnas equipos Neon |
| 1.25 | 27 Julio 2026 | Fix Cancelar en editar cliente desde OT vuelve a editar OT |
| 1.26 | 27 Julio 2026 | Tablas: nowrap, truncado de texto con ellipsis, botones acciones visibles |
| 1.27 | 28 Julio 2026 | Seguridad: eliminado fallback password hardcodeado "6498" en db.js, ahora solo vía .env. Fix: scrollbar-gutter stable en html para evitar layout shift. Fix: table-layout fixed scoped solo a tablas OT + flex-wrap en action-buttons + mostrar solo número en OT (02800). Refactor: CSS movido a frontend/src/styles/ |
| 1.28 | 04 Agosto 2026 | Auditoría dead code: archivos/scripts/SQL/endpoints muertos eliminados (ver CAMBIOS.md 2026-08-04), defaults MySQL hardcodeados eliminados (db.js, crear-admin.js, seed-test-data.js), identidad de equipos desacoplada (EquipoFormulario solo identidad). `numero_orden` inmutable y autogenerado server-side (base 2800; POST genera, PUT no lo toca). Editar OT: re-seleccionar cliente y equipo (`clienteFijo`/`equipoFijo` = false en editarOrden). `crear_tablas.sql` sincronizado con esquema real (NOT NULLs, `usuarios.usuario` UNIQUE, ENGINE/CHARSET) |
| 1.29 | 09 Agosto 2026 | Contactos y direcciones dinámicas en OT (ilimitadas, JSON) reemplazan "Segundo Contacto"/"Segunda Dirección" fijos. Columnas `contactos_extra`/`direcciones_extra` en `ordenes_trabajo`; eliminadas columnas `_2` (0 registros con datos). UI colapsada con confirmación al quitar |
| 1.30 | 10 Agosto 2026 | UI compacta para notebook 14" (1366×768) y bordes tenues en form OT. Checks custom en "Otras Direcciones / Sucursales" y "Otros Contactos". Bordes de buscadores (cliente, serie, modelo) de 2px → 1px con colores suaves. Sin outline grueso en focus (`.ot-search`). Tarjetas y barras del form compactadas. Clientes: botones de acción en una línea + compactos (769–1366px), botones de header coloreados, estilos botones tabla OT |
| 1.31 | 10 Agosto 2026 | Buscador "Buscar Contacto (por nombre o correo)" en form OT: autocompleta Contacto/Email Contacto/Fono Contacto desde el contacto principal y contactos adicionales del cliente. Ancho limitado a 268px (igual que campo Email) |
| 1.32 | 11 Agosto 2026 | Campo Garantía oculto en el listado de OT (filtro, columna, tarjetas), pero el check sigue en el formulario (al final de la fila de fechas). Campo Serie oculto en la vista del mantenedor de Equipos (tabla, tarjetas, filtro), pero sigue en el formulario de ingreso/edición. Acciones en menú desplegable "..." (EquipoAcciones, ClienteAcciones, OrdenAcciones) con `position: fixed` via getBoundingClientRect para evitar recorte por overflow del table-wrapper. Tabla OT con distribución automática de ancho como Clientes/Equipos. Formulario "Datos de la Orden" compactado: título y campos en la misma fila (`.of-head-row`), campos inline (`.of-f-inline`, N° Orden max-width 110px, Fecha 150px), inputs bajos (padding 2px 8px, line-height 1.3), fila de fechas de 5 columnas (Ingreso/Término/Entrega/Compra/Garantía), ancho del form de 900px a 720px |
| 1.33 | 11 Agosto 2026 | Mantenedor de Usuarios: paginación 4 items/página (mismo patrón slice() + `<Pagination>` que Clientes/Equipos/OT) y buscador por nombre de usuario o correo (case-insensitive, resetea a página 1 al filtrar, botón Limpiar). Todo solo frontend en `GestionUsuarios.jsx` |
| 1.34 | 11 Agosto 2026 | Fix error 500 al guardar OT (INSERT con 46 placeholders para 45 columnas en `backend/routes/ordenes.js`). Las OT ya NO se vinculan a equipos: buscadores de serie/modelo solo llaman datos (equipo/marca/modelo/serie), `equipoId` siempre null, eliminada auto-vinculación por serie en backend POST/PUT (`finalEquipoId = null`), sin badge al editar (solo en Ver). Las OT no crean ni registran equipos: el inventario se gestiona solo desde el mantenedor de Equipos (si el equipo no existe en la OT, se guardan los datos escritos a mano sin crear nada). Limpieza: eliminados `generarCodigoEquipo()` y `equipoId` del destructuring en `ordenes.js`. Sin migración de BD (`equipo_id` se mantiene; OTs nuevas quedan NULL) |
| 1.35 | 11 Agosto 2026 | Botones "Limpiar" del form OT (Avería/Actividad/Observaciones e Insumos) solo visibles cuando hay datos: `OrdenFormAveria.jsx` si `averia`/`actividad`/`observaciones` tienen texto; `OrdenFormInsumos.jsx` si `insumos.some(i => i.nombre)`. Solo frontend |
| 1.36 | 11 Agosto 2026 | Fix contacto principal duplicado en buscador "Buscar Contacto" del form OT: `OrdenFormCliente.jsx` filtra de `contactosDisponibles` los extras que coinciden por nombre o email (case-insensitive) con el contacto principal, que se agrega una sola vez con `principal: true` |
| 1.37 | 11 Agosto 2026 | Form OT (Nueva/Editar/Ver) con ancho `900px` (igual que nuevo cliente, antes 720px). Focus tenue unificado en inputs y botones del form OT: `OrdenTrabajo.css` usa borde `#9AB8D9` + sombra 1px `rgba(154,184,217,.35)` en `.of-f` y en `.of-ins-item input`/`.of-date input` (que usaban el outline grueso del navegador); botones `.of-btn-a/-p/-c`, `.of-head-close`, `.of-ins-del` con `:focus-visible` tenue 1px. Solo frontend |
| 1.38 | 11 Agosto 2026 | Color fijo en botones del header y "Nuevo Cliente": `.logout-btn:hover` y `.btn-nuevo-cliente:hover` en `index.css` ya no cambian de color (antes rojo / `#1d4ed8`), solo `filter: brightness(0.92)`. Botón "Orden de Compra" recolorado a azul marino `#1E40AF` en todos los headers y Home (antes púrpura `#8B5CF6` muy similar a "Orden de Trabajo" `#6366F1`; Home usaba `#6366F1`). Header de OT ahora usa `item.color` de cada navItem en vez del array `colors` desfasado (el botón Usuarios mostraba color equivocado). Solo frontend |
| 1.39 | 11 Agosto 2026 | Botones azules uniformes: `.main-btn` ("Nueva Orden") de `var(--gradient)` a `var(--primary)` sólido (igual que "Nuevo Cliente"); `.main-btn:hover` sin elevación (`translateY`/`box-shadow`), solo `filter: brightness(0.92)`; `.btn-limpiar-equipos:hover` en `Equipos.css` ya no cambia a `#1d4ed8`, solo `brightness(0.92)`. Solo frontend |
| 1.40 | 11 Agosto 2026 | Colores de botones del header alineados con las tarjetas de Home: Inicio `var(--gradient)`, Clientes `var(--primary)`, Equipos `var(--success)`, OT `var(--warning)`, Informes `#EA580C`, Cotizaciones `#DB2777`, OC `#1E40AF`, Usuarios `#0D9488`. Antes Clientes era ámbar y OT índigo `#6366F1`. Aplicado en Headers de Clientes/Equipos/Usuarios, navItems de OT y páginas Informes/Cotizaciones/OrdenCompra. Solo frontend |
| 1.41 | 11 Agosto 2026 | OT a mano no crea ni vincula clientes en el mantenedor. `backend/routes/ordenes.js`: eliminado lookup por razón social y `INSERT INTO clientes`/`clientes_direcciones` cuando la OT se crea sin `clienteId`. Ahora `finalClienteId = clienteId || null`: solo vincula cuando se selecciona del buscador. Datos a mano quedan solo en `ordenes_trabajo` (igual que equipos). `node --check` OK |
| 1.42 | 11 Agosto 2026 | Campos extra en OT igualados al mantenedor de clientes. `OrdenFormCliente.jsx`: direcciones extra ahora tienen Tipo (Matriz/Sucursal) + Ciudad (antes solo Dirección/Comuna/Fono); contactos extra ahora tienen Dirección Contacto (antes faltaba). Fix select tipo_direccion sin toUpperCase para que coincida. Compactación de estilos y botones. Solo frontend |
| 1.43 | 17 Agosto 2026 | Campo **Giro oculto** en el formulario de cliente (`ClienteFormulario.jsx`): se mantiene en el código con `display: none` por si se necesita en el futuro (no se borra el input ni el estado). **Razón Social ahora ocupa todo el ancho** de la fila (antes compartía fila con Giro en grilla `1.2fr 1fr`). El campo sigue guardándose/leyéndose en el estado `nuevoCliente.giro` y se envía en el POST/PUT sin cambios. Solo frontend, sin migración de BD |
| 1.44 | 17 Agosto 2026 | Toggle "Ver todos/Ver menos" en listas dinámicas del form OT (`OrdenFormCliente.jsx`): **Otras Direcciones / Sucursales** y **Otros Contactos** ahora muestran máximo **1** item por defecto (constante `LIMITE_EXTRAS = 1`), con botón "Ver todas (N)"/"Ver menos" (azul para direcciones, verde para contactos) cuando hay más. Mismo patrón que "Sucursales/Direcciones" del nuevo cliente. Solo frontend |
| 1.45 | 17 Agosto 2026 | Tablas de Clientes y Orden de Trabajo centradas: `.table-wrapper th` y `.table-wrapper td` con `text-align: center` en `clientes-componentes.css` y `OrdenTrabajo.css` (antes `left`). Los encabezados y datos (Código, Razón Social, RUT, Teléfono, Ciudad, Contacto, Acciones; y columnas de OT) quedan centrados. Solo frontend |
| 1.46 | 17 Agosto 2026 | Vista expandida de cliente compacta (`ClienteExpandido.jsx` + `clientes-componentes.css`): bloque "sin órdenes de trabajo" ahora en una sola línea (icono 13px + texto + botón "Crear primera OT" compacto, `display:flex` centrado, padding 3px). Fila de datos (Dirección/Teléfono/Contacto) más baja (padding 4px, gap 2px, fuentes 0.6/0.75rem, line-height 1.15) y **centrada**. Solo frontend |
| 1.47 | 17 Agosto 2026 | Vista expandida de cliente más compacta (`ClienteExpandido.jsx` + `clientes-componentes.css`): eliminado el bloque "Este cliente no tiene órdenes de trabajo" y el botón "Crear primera OT" (la acción ya está en el botón "Nueva OT" del header y en ClienteExpandidoAcciones). Cuando el cliente no tiene OTs solo se ve el header "Órdenes de Trabajo (0)" con su toggle. Fila de datos (Dirección/Teléfono/Contacto) reducida aún más (padding 2px, labels 0.55rem, valores 0.7rem, line-height 1.1). Eliminado CSS muerto `.ots-vacio` y `.btn-crear-primera`. Solo frontend |
| 1.48 | 17 Agosto 2026 | Tabla de OTs de la vista expandida de cliente centrada (`.ots-tabla-wrapper th` y `td` con `text-align: center`). Encabezados N° OT, Fecha, Equipo, Técnico, Actividad, Observaciones, Acción y sus datos quedan centrados. Solo frontend |
| 1.49 | 17 Agosto 2026 | Fix duplicación de clientes en la web: el botón "Guardar Cliente" no se deshabilitaba durante el POST, así que múltiples clics creaban clientes duplicados. `ClienteFormulario.jsx`: nuevo estado `guardando`, `handleSubmit` ignora clics si `guardando` es true y `onSave` se ejecuta con `Promise.resolve(...).finally(() => setGuardando(false))`. Botón muestra "Guardando..." y queda `disabled`. `Clientes.css`: `.cf-btn-p:disabled` con `opacity:.6; cursor:not-allowed`. Solo frontend |
| 1.50 | 17 Agosto 2026 | Vista expandida de cliente (`ClienteExpandido.jsx` + `clientes-componentes.css`): la tabla de OTs ya NO usa paginación interna; ahora muestra **1 OT por defecto** (`LIMITE_OTS = 1`) y botón "Ver todas (N)"/"Ver menos" en el header cuando hay más de 1 OT. Eliminado el componente `Paginacion` local y su CSS `.paginacion-cliente`/`.paginacion-puntos`. La paginación de clientes (4/página) del mantenedor se mantiene intacta. Solo frontend |
| 1.51 | 18 Agosto 2026 | Formulario OT reestructurado: Insumos a la izquierda (bajo Cliente), Avería/Actividad/Observaciones a la derecha (bajo Equipo). Grid simplificado de 4 celdas a 2 columnas flex. Insumos por defecto 4 visibles con toggle "Ver más/Ver menos" cuando hay >4 insumos ingresados. Fix cursor salta al final: nuevo helper `upperInput(e, regex?)` en `helpers.js` que aplica mayúsculas directamente en el DOM y restaura `selectionRange`; reemplazadas 45 ocurrencias de `e.target.value.toUpperCase()` en 8 archivos. Inputs compactos unificados: padding 2px 8px, font-size .82rem, line-height 1.3 en Clientes (`Clientes.css`, `clientes-componentes.css`), Equipos (`Equipos.css`) y filtros OT (`ordenes-componentes.css`). Tabla Usuarios centrada (`index.css`: `.table-container th, td`). Respaldo creado en `backup/ot-form-changes.patch` y `backup/actual/`. Solo frontend |
| 1.52 | 18 Agosto 2026 | Unificar estilos de buscadores en todos los mantenedores y formularios: mismo tamaño, borde redondeado (`var(--radius-sm)`), color de borde (`var(--border)`) y padding. Filtros de OT (`ordenes-componentes.css`) y buscadores del form OT (cliente, contacto, serie, modelo) ahora coinciden con los de Clientes y Equipos. Solo frontend |
| 1.53 | 18 Agosto 2026 | Compactar tarjetas "Cliente Asignado" y "Equipo Asignado" en formulario OT: padding 2px 8px, borde 1.5px, border-radius `var(--radius-sm)`. Botón "Ver" reducido a height 24px y padding 2px 8px. Solo frontend |
| 1.54 | 18 Agosto 2026 | Fix race condition duplicación de clientes/equipos al guardar: `useRef(guardandoRef)` como bandera síncrona que bloquea múltiples submits antes de que React re-renderice. `EquipoFormulario.jsx` ahora también tiene estado `guardando`, `disabled` en botón y texto "Guardando...". `Equipos.css`: `.ef-btn-p:disabled` con `opacity:.6; cursor:not-allowed`. Solo frontend |
| 1.55 | 18 Agosto 2026 | Proteger OT contra duplicación al guardar: `useRef(guardandoRef)` como bandera síncrona en `guardarOrden()`. Botón "Guardar Orden" ahora tiene `disabled={guardando}` y texto "Guardando...". `OrdenTrabajo.css`: `.of-btn-p:disabled` con `opacity:.6; cursor:not-allowed`. Todos los ingresos (Clientes, Equipos, OT) ahora protegidos contra doble-submit. Solo frontend |
| 1.56 | 17 Agosto 2026 | Fix RUT cortado en tarjetas móviles del mantenedor de Clientes: `.badge-rut` ahora con `white-space: nowrap` y `flex-shrink: 0` (antes el badge se comprimía y el RUT se partía en varias líneas cuando la razón social era larga). `.data-card-header strong` con `min-width: 0` para que la razón social sea la que se ajuste, no el RUT. Solo frontend |
| 1.57 | 17 Agosto 2026 | Fix menú `...` cortado en mobile: los dropdowns de acciones (ClienteAcciones, EquipoAcciones, OrdenAcciones) usaban `position: fixed` y siempre abrían hacia abajo, así que en el último registro el menú se recortaba fuera del viewport. Ahora con `useLayoutEffect` miden la altura del menú y si no cabe bajo el botón lo abren hacia arriba; además el `left` se clampa para no salirse por el borde derecho. Solo frontend |
| 1.58 | 17 Agosto 2026 | Form OT mobile: campos N° Orden y Fecha ordenados en 2 columnas lado a lado (grid `1fr 1fr`), cada uno con label encima e input a ancho completo, bajo el título "Datos de la Orden" en su propia línea. El resto de campos no se tocan. `OrdenTrabajo.css` (media query ≤768px). Solo frontend |
| 1.59 | 17 Agosto 2026 | Buscadores de filtros uniformes en mobile (≤768px): Clientes (Razón Social, RUT) y OT (N° Orden, Garantía, Estado, Desde, Hasta) ahora con `padding: 10px 12px` y `min-height: 44px` igual que Equipos. Antes los de Clientes quedaban pequeños (`padding 2px`). `clientes-componentes.css` y `ordenes-componentes.css`. Solo frontend |
| 1.60 | 17 Agosto 2026 | Buscadores del form OT alineados: la lupa "Buscar y Seleccionar Cliente" ya no queda 10px más arriba que "Buscar Equipo por Serie"/"Buscar por Modelo". Causa: `<div>` vacío con `marginBottom: 10px` (badges de equipo seleccionado) se renderizaba siempre. Solución: contenedor condicional `{equipoSeleccionado && ...}`. `OrdenFormEquipo.jsx`. Solo frontend |
| 1.61 | 17 Agosto 2026 | Campos Cliente/Comuna alineados con Equipo/Marca en form OT: "Cliente *" dejó de ocupar toda la fila (`gridColumn: span 2` quitado) y ahora comparte fila con "Comuna" (como `Equipo *` | `Marca *`); margen del buscador de cliente igualado a 8px. `OrdenFormCliente.jsx`. Solo frontend |
| 1.62 | 17 Agosto 2026 | Campo Cliente más largo en form OT: grilla Cliente/Comuna con `gridTemplateColumns: '2fr 1fr'` → "Cliente *" pasa de 294px a 392px (2/3) y "Comuna" a 196px (1/3), igual que "Equipo *" (399px)/"Marca *" (190px). Mobile sigue en 1 columna (`!important`). `OrdenFormCliente.jsx`. Solo frontend |
| 1.63 | 17 Agosto 2026 | "Otras Direcciones / Sucursales" alineado con "Contador Páginas OUT" en form OT. El **checkbox** queda verticalmente centrado sobre el **input** (no sobre el label). Causa: colapso de márgenes CSS (el `margin-bottom` de la grilla `.of-form-grid` se colapsaba con el `margin-top` del card). Solución: `margin-top: 34px` en el card (con grilla en `margin-bottom: 15px`, el gap efectivo colapsado pasa a 34px). `OrdenFormCliente.jsx`. Solo frontend |
| 1.64 | 18 Agosto 2026 | Fix insumos en form OT (`OrdenFormInsumos.jsx`): (1) botón "Limpiar" ocultaba insumo 3 y 4 porque reseteaba `insumosVisibles(2)` en vez del default 4 — ahora resetea a 4. (2) Bug de referencia compartida: `Array(12).fill({ nombre: "" })` rellenaba el array con el **mismo objeto**, así que al escribir en un insumo la letra aparecía en los 12 — ahora usa `Array.from({ length: 12 }, () => ({ nombre: "" }))` para crear objetos independientes. Solo frontend |
| 1.65 | 18 Agosto 2026 | Form OT compactado: (1) "Datos del Equipo" (`OrdenFormEquipo.jsx`) pasa de `auto-fit minmax(160px)` (que cambiaba según el ancho y dejaba Equipo a doble ancho) a grilla fija `.of-r3` (3 columnas iguales): **Equipo | Marca | Modelo** y **Serie | Nivel de Tinta | Contador Páginas OUT**, manteniendo `gap:20px`/`marginBottom:20px` originales (sin mover textareas de abajo); en mobile ≤768px `.of-r3` apila en 1 columna. (2) Insumos (`OrdenFormInsumos.jsx`): eliminados los labels "Insumo N" — el nombre queda solo como placeholder dentro del input — y `marginTop: 26px` para que el insumo 3 y 4 queden alineados con el final del textarea de Observaciones. Solo frontend |
| 1.66 | 18 Agosto 2026 | Mantenedor de OT: filtros **Cliente** (razón social) y **Serie** agregados junto a N° de Orden, Estado y fechas. Buscan case-insensitive sobre el dataset completo y resetean a página 1. `OrdenLista.jsx` + `OrdenTrabajo.jsx`. Solo frontend |
| 1.67 | 18 Agosto 2026 | Mantenedor de Clientes: **eliminada la vista expandida al buscar** (`ClienteExpandido`). Antes, al escribir en los filtros se mostraba la vista expandida (equipos + OTs por cliente); ahora, como en Equipos y OT, buscar solo filtra la misma lista (`ClienteLista`). Eliminado código muerto en `Clientes.jsx` (fetch de órdenes, `ordenesPorCliente`, `eliminarOrdenCliente`). **Respaldo**: la vista expandida quedó guardada en `backup/actual/Clientes.jsx.vista-expandida-2026-08-18` (versión original del archivo) y los componentes `ClienteExpandido.jsx` / `ClienteExpandidoAcciones.jsx` siguen intactos en el repo (sin uso). Para restaurarla: recuperar ese `Clientes.jsx` y volver a renderizar `ClienteExpandido` cuando haya búsqueda. Solo frontend |
| 1.68 | 18 Agosto 2026 | Botón **Limpiar** del mantenedor de Clientes (`FiltrosCliente.jsx`) ahora **siempre visible** (antes solo cuando había filtro activo) y con el mismo estilo/tamaño que el de Equipos (clase `btn-limpiar-equipos`). Solo frontend |
| 1.69 | 18 Agosto 2026 | Botón **Limpiar** agregado al mantenedor de OT (`OrdenLista.jsx` + `OrdenTrabajo.jsx`): siempre visible, mismo estilo que Equipos, resetea N° de Orden, Cliente, Serie, Estado y fechas. Solo frontend |
| 1.70 | 18 Agosto 2026 | Form OT "Datos de la Orden": campo **Fecha** acercado a **N° de Orden** (la grilla de la cabecera pasó de 3 columnas de ancho igual a columnas de ancho automático, `.of-head-row .of-grid` con `repeat(2,auto)`). Input Fecha compactado: `width:fit-content`, `max-width:110px`, padding-right 2px y sin espacio antes del icono del calendario (`::-webkit-datetime-edit` padding 0, `::-webkit-calendar-picker-indicator` margin/padding 0). Solo frontend |
| 1.71 | 18 Agosto 2026 | Fechas **Ingreso/Término/Entrega/Compra** del form OT compactadas igual que Fecha (`.of-date-f input[type="date"]` con `width:fit-content`, `max-width:110px`, mismo fix de icono). Solo frontend |
| 1.72 | 18 Agosto 2026 | Form OT "Datos de la Orden": **Ingreso/Término/Entrega/Compra/Garantía** subidas al lado del campo **Fecha** (mismo head-row). `.of-dates` pasó de grilla de 5 columnas a `display:flex; flex-wrap:wrap` dentro de `.of-head-row`; en mobile se adapta con `width:100%`. Solo frontend |
| 1.73 | 18 Agosto 2026 | Form OT **Insumos**: (1) ahora parten con **2 visibles** (antes 4) — reset en `useState`, `resetFormulario()`, `abrirNuevaOrden()`, `guardarOrden()` y botón Limpiar; el toggle "Ver más/Ver menos" usa el límite 2. (2) Sección **Insumos movida** de la columna izquierda (bajo Cliente) a la **columna derecha entre Datos del Equipo y Avería/Falla/Incidencia**. (3) Botón de **borrar insumo** solo aparece desde el **tercer insumo** (`idx >= 2`), los primeros 2 no tienen papelera. Se eliminó el `marginTop: 26px` que alineaba insumos con Observaciones en la posición anterior. Solo frontend |
| 1.74 | 18 Agosto 2026 | Form OT **Insumos**: (1) botón basurero ahora en **todos** los insumos (se quitó la condición `idx >= 2` y el spacer). (2) Botón alineado al centro con el input y mismo alto (`.of-ins-item` con `align-items:center`, `.of-ins-del` `height:21px`). (3) Fix al **editar/ver OT**: `setInsumosVisibles(Math.max(2, ...))` en vez de `Math.max(4, ...)` — antes al recargar una OT con solo 2 insumos guardados aparecían 4 campos vacíos. Solo frontend |
| 1.75 | 18 Agosto 2026 | Campo **Nivel de Tinta** en form OT (`OrdenFormEquipo.jsx`): de input de texto a `<select>` con opciones **Lleno / Medio / Bajo** (valores `LLENO`/`MEDIO`/`BAJO` guardados en `nivel_tinta`). Sin cambio de BD (columna ya es texto). Solo frontend |
| 1.76 | 18 Agosto 2026 | Campo **RUT** en form OT "Datos del Cliente" (`OrdenFormCliente.jsx`): nueva columna `rut VARCHAR(20)` en `ordenes_trabajo` (migración: `ALTER TABLE ordenes_trabajo ADD COLUMN rut VARCHAR(20) AFTER comuna;`), backend POST/PUT reciben y guardan `rut`, cascade de clientes (`PUT /api/clientes/:id`) también propaga RUT a OTs asociadas, y estado/edición/ver/reset en `OrdenTrabajo.jsx`. **Layout de "Datos del Cliente" reordenado**: Fila 1 **Cliente | RUT**, Fila 2 **Dirección | Comuna** (Dirección ya no ocupa toda la fila, queda achicada al lado de Comuna; Comuna conserva el mismo ancho 1fr) |
| 1.77 | 18 Agosto 2026 | **Validación de RUT en form OT** (`OrdenFormCliente.jsx`): el campo RUT ahora funciona igual que en Clientes — auto-formato con puntos y guion, solo `[0-9K-]`, máximo 12 chars, y validación de dígito verificador (módulo 11) al escribir y al salir (`handleRutChange`/`handleRutBlur` + `validarRUT` de helpers). **Error más tenue y sin desplazar**: en `ClienteFormulario.jsx` y `OrdenFormCliente.jsx` el borde rojo de error pasó de `2px solid #dc2626` a `1px solid #f87171` (más suave y fino), y el mensaje de error ahora es `position: absolute` sobre el label (con `white-space: nowrap` y `text-transform: none` en OT) para que el campo **no se mueva** al aparecer el error y no salga en mayúsculas. Sin migración de BD (columna `rut` ya creada en v1.76) |
| 1.78 | 18 Agosto 2026 | **Focus azul unificado en todo el proyecto**: los inputs/selects/textarea/botones del form OT (`OrdenTrabajo.css`) y los buscadores `.ot-search` (cliente, serie, modelo, contacto) ahora usan el mismo focus que Clientes: `border-color: #0C4A8C` + `box-shadow: 0 0 0 2px rgba(12,74,140,.15)` (antes OT usaba `rgba(37,99,235,.1)` o el tenue `rgba(154,184,217,.35)`). **Solución por clase en vez de `!important`**: los inputs del form OT que tenían `border` inline (que sobreescribía el `border-color` del focus) se limpiaron — el borde ahora lo da el CSS (`.of-f input` ya lo definía; `.ot-search` ahora incluye `border`, `border-radius`, `padding`, `font-size` base). **GestionUsuarios**: inputs de `UsuarioFormulario.jsx` y `CambioPasswordForm.jsx` igualados al resto (`padding: 2px 8px`, `font-size: .82rem` — antes `5px 8px`/`.78rem` que los hacía más altos y con texto más chico) y focus azul unificado. Solo frontend |
| 1.79 | 18 Agosto 2026 | **Filtro de Garantía restaurado en el mantenedor de OT** (`OrdenLista.jsx` + `OrdenTrabajo.jsx`): nuevo dropdown "Garantía" (Todas/Sí/No) entre Estado y las fechas, filtra por `es_garantia` sobre el dataset completo, resetea a página 1 al cambiar y el botón Limpiar lo resetea a "Todas" (había sido ocultado en v1.32; el check sigue en el formulario). **Form OT estandarizado**: "Datos del Cliente" y "Datos del Equipo" ahora usan `.of-sec primary` (azul claro `--primary-light`) — antes Cliente era verde (`success`) y Equipo gris (`muted`), ahora ambas tarjetas tienen el mismo azul del formulario Nuevo Cliente. Solo frontend |
| 1.80 | 18 Agosto 2026 | **Campo "Información Interna" en form OT** (`OrdenFormCliente.jsx` + `OrdenTrabajo.jsx`): nueva sección colapsable debajo de "Otros Contactos" con flecha (ChevronDown/ChevronUp, fondo ámbar `#FEF9E7`) que está **oculta por defecto**; al expandir muestra un textarea de 4 filas (mayúsculas automáticas, `upperInput`). Guarda en la columna `info_interna TEXT` de `ordenes_trabajo`. **Backend** (`backend/routes/ordenes.js` ambas ramas + `backend/crear_tablas.sql`): POST/PUT reciben y guardan `infoInterna` → `info_interna` (MySQL `?` y PostgreSQL `$47`/`$42`). **Migraciones**: MySQL local `ALTER TABLE ordenes_trabajo ADD COLUMN info_interna TEXT AFTER observaciones;`; Neon `ALTER TABLE ordenes_trabajo ADD COLUMN IF NOT EXISTS info_interna TEXT;`. Estado/reset/editar/ver incluyen `infoInterna` |
| 1.81 | 18 Agosto 2026 | Fix v1.80: la sección **"Información Interna"** quedó dentro de la tarjeta azul "Datos del Cliente" (`of-sec primary`) — ahora es un bloque **hermano, fuera de la tarjeta**, debajo de ella (con su propio fondo ámbar y flecha). `OrdenFormCliente.jsx`: el `return` ahora usa un fragment `<>` que envuelve la tarjeta "Datos del Cliente" y luego la sección "Información Interna" como elemento independiente. Solo frontend |
| 1.82 | 18 Agosto 2026 | **Fix mobile form OT** (`OrdenTrabajo.css`): (1) botones **Guardar/Cancelar** con `min-height: 44px` en mobile (antes `padding:4px` que los dejaba delgados, ahora igual alto que los inputs). (2) **Campo Fecha** al editar OT en mobile ya muestra la fecha completa: `.of-head-row .of-grid input[type="date"]` con `width:100%; max-width:none` dentro de la media query ≤768px (antes heredaba `max-width:110px; width:fit-content` del desktop y cortaba la fecha). Desktop intacto. Solo frontend |

---

## CamBios Recientes (09 Agosto 2026)

### 54. Contactos y Direcciones Dinámicas en Orden de Trabajo
**Fecha:** 09 Agosto 2026
**Ramás afectadas:** `main` (MySQL) — se debe replicar el mismo cambio en `deploy/cloud` (PostgreSQL)

**Problema:** La OT solo permitía UN segundo contacto y UNA segunda dirección mediante columnas fijas (`contacto2`, `fono_contacto2`, `email_contacto2`, `direccion2`, `comuna2`). El cliente podía tener múltiples contactos/sucursales pero no se podían guardar más de 2 en la OT.

**Solución:** Reemplazo por **listas dinámicas sin límite** de contactos y direcciones extras, guardadas como JSON (`contactos_extra`, `direcciones_extra`) en la tabla `ordenes_trabajo`. La UI se mantiene limpia: secciones colapsadas con checkbox + contador.

**Migración SQL (MySQL - main):**
```sql
ALTER TABLE ordenes_trabajo ADD COLUMN contactos_extra TEXT;
ALTER TABLE ordenes_trabajo ADD COLUMN direcciones_extra TEXT;
ALTER TABLE ordenes_trabajo DROP COLUMN contacto2, DROP COLUMN fono_contacto2,
  DROP COLUMN email_contacto2, DROP COLUMN direccion2, DROP COLUMN comuna2;
```

**Migración SQL (PostgreSQL - deploy/cloud):**
```sql
ALTER TABLE ordenes_trabajo ADD COLUMN IF NOT EXISTS contactos_extra TEXT;
ALTER TABLE ordenes_trabajo ADD COLUMN IF NOT EXISTS direcciones_extra TEXT;
ALTER TABLE ordenes_trabajo DROP COLUMN IF EXISTS contacto2, DROP COLUMN IF EXISTS fono_contacto2,
  DROP COLUMN IF EXISTS email_contacto2, DROP COLUMN IF EXISTS direccion2, DROP COLUMN IF EXISTS comuna2;
```

**Archivos modificados:**
- `backend/routes/ordenes.js` — POST y PUT reciben `contactosExtra`/`direccionesExtra`, los serializan con `JSON.stringify()` (o `null` si vienen vacíos) en `contactos_extra`/`direcciones_extra`
- `backend/crear_tablas.sql` — columnas nuevas en lugar de `_2`
- `frontend/src/pages/OrdenTrabajo.jsx` — estado `nuevaOrden` ahora incluye `contactosExtra: []` y `direccionesExtra: []`; helper `parseExtra()` para parsear el JSON al editar/ver; eliminados estados `usarSegundoContacto`/`usarSegundaDireccion` y todos los campos `_2` (reset, init, seleccionarCliente)
- `frontend/src/components/ordenes/OrdenFormCliente.jsx` — dos secciones "Otras Direcciones / Sucursales" y "Otros Contactos": checkbox para expandir, select para agregar desde los datos del cliente (parsed de `contactos`/`direcciones` con separador `;;` y `|`), edición manual de cada item, botón "+ Agregar", y botón "Quitar" con confirmación (`confirm()`) antes de eliminar. En read-only (`Ver`) los inputs se deshabilitan pero muestran los datos existentes

**Detalles del formato JSON:**
```json
// contactos_extra
[{"nombre":"...","email":"...","fono":"...","cargo":"..."}]

// direcciones_extra
[{"direccion":"...","comuna":"...","fono":"...","tipo":"..."}]
```

**Nota:** `deploy/cloud` requiere además aplicar la migración PostgreSQL en Neon y el mismo cambio en `backend/routes/ordenes.js` (sintaxis `$1`, `result.rows`).

---

## Cambios Recientes (10 Agosto 2026)

### 55. UI compacta para notebook 14" + bordes tenues en formulario OT
**Fecha:** 10 Agosto 2026
**Ramás afectadas:** `main` (MySQL) — solo frontend, idéntico en `deploy/cloud` (PostgreSQL)
**Archivos modificados (solo frontend):**
- `frontend/src/components/ordenes/OrdenFormCliente.jsx`
- `frontend/src/components/ordenes/OrdenFormEquipo.jsx`
- `frontend/src/styles/OrdenTrabajo.css`
- `frontend/src/styles/clientes-componentes.css`
- `frontend/src/styles/ordenes-componentes.css`

**Motivo:** El usuario trabaja en un notebook de 14" (viewport 1366×768). Las vistas post-login se veían mal: botones que hacían wrap, tarjetas altísimas, y marcos de campos demasiado gruesos.

**Cambios en el formulario OT:**

1. **Checks custom** en secciones "Otras Direcciones / Sucursales" y "Otros Contactos"
   - Clase `input[type="checkbox"].of-check` (15×15px, border-radius 5px, checkmark blanco con `::after`)
   - Variantes `--direcciones` (azul `#0284C7`) y `--contactos` (`var(--success)`)
   - Hover con anillo suave `color-mix`, checked con sombra coloreada
   - CSS en `ordenes-componentes.css`

2. **Tarjetas compactas** en estado colapsado: `padding: 4px 10px`, `line-height: 1.2`, `font-size: 0.8rem`, iconos de 14px, borde 1px tenue
   - Direcciones: `background: #E0F2FE`, `border: 1px solid #7CD0F0`
   - Contactos: `background: #F0FDF4`, `border: 1px solid #7AD6EC`
   - Label con `width: fit-content` para que check+número no estiren la fila (Direcciones 243px, Contactos 152px)

3. **Bordes tenues en buscadores** (de 2px → 1px con tonos suaves):
   - Buscar cliente: `border: 1px solid #9AB8D9` (antes `2px solid var(--primary)`)
   - Buscar por serie / modelo: `border: 1px solid #C4B5FD` (antes `2px solid var(--info)`)
   - Sin outline grueso del navegador al hacer focus: clase `.ot-search` con `outline: none` y `box-shadow: 0 0 0 1px rgba(154,184,217,0.35)` en focus (CSS en `ordenes-componentes.css`)

4. **Separación de Email/Fono Principal/Contacto**: `.of-form-grid` con `marginTop: '14px'` para que no queden pegados a la tarjeta de checks

5. **Barras del form compactadas** en `OrdenTrabajo.css`:
   - `.of-head`: padding `12px→8px 16px`, h2 `15px→14px`, close `6px→5px`
   - `.of-form`: padding `10px→8px`, gap `8px→6px`
   - `.of-sec`: padding `8px→6px 8px`
   - `.of-st`: font `11px→10px`, margin-bottom `6px→4px`

**Cambios en Clientes:**

6. **Botones de acción en una sola línea** (`clientes-componentes.css`):
   - `@media (min-width: 769px)`: `.table-wrapper .action-buttons, .cards-table .action-buttons` con `flex-wrap: nowrap` + `white-space: nowrap` (antes el botón Eliminar pasaba a otra línea)
   - `@media (min-width: 769px) and (max-width: 1366px)`: botones compactos `padding: 4px 6px`, `font-size: 0.68rem`

7. **Botones de header de ClienteExpandido coloreados**:
   - `.btn-nueva-ot-header`: `#6366f1` (indigo), hover `#4f46e5`
   - `.btn-editar-header`: `var(--warning)`, hover `#ea8000`
   - `.btn-eliminar-header`: `var(--danger)`, hover `#c62828`
   - (antes todos `rgba(255,255,255,0.2)` iguales)

8. **Botones de la tabla de OT asociadas** en ClienteExpandido (`.ots-tabla-wrapper .acciones`):
   - Primer botón (Editar): `var(--warning-light)` con texto `#b45309`, hover amarillo
   - `.btn-eliminar`: fondo `var(--danger-light)` con texto `var(--danger)`, hover rojo

**Verificación (Playwright, Chrome, viewport 1366×768):** los 3 buscadores mantienen borde 1px tenue y sin outline en focus; chequeos 15px correctos; botones de acción en una línea sin overflow horizontal.
### 56. Buscador de Contacto (por nombre o correo) en formulario OT
**Fecha:** 10 Agosto 2026
**Ramás afectadas:** `main` (MySQL) — solo frontend, idéntico en `deploy/cloud` (PostgreSQL)
**Archivo modificado:** `frontend/src/components/ordenes/OrdenFormCliente.jsx`

**Motivo:** En la OT, al seleccionar un cliente, los campos de contacto (Contacto, Email Contacto, Fono Contacto) había que escribirlos a mano. El usuario pidió poder buscar los datos del contacto por nombre o correo y autocompletarlos.

**Cambios:**
1. **Nuevo campo "Buscar Contacto (por nombre o correo)"** bajo los datos del cliente, visible solo cuando hay `clienteSeleccionado`
2. **Fuente de datos** = contacto principal (`clienteSeleccionado.contacto_nombre` / `contacto_email` / `contacto_fono` / `contacto_cargo`) + contactos adicionales (parseados del campo `contactos` concatenado con `;;` y `|`)
3. **Filtro** con mínimo 2 caracteres, match sobre nombre o email (case-insensitive, uppercase)
4. **Dropdown** con patrón estándar `useRef` + `mousedown` para cerrar al hacer clic fuera; marca `(adicional)` en contactos extra; muestra `✉ email | Tel: fono | cargo`
5. **Al seleccionar**, autocompleta en `nuevaOrden`: `contacto`, `emailContacto`, `fonoContacto` y deja `busquedaContacto = nombre`
6. **Reset** del buscador al cambiar de cliente (`useEffect` sobre `clienteSeleccionado.id`/`razon_social`)
7. **Ancho limitado** a `maxWidth: 268px` (igual que el campo Email), con clase `ot-search` (borde tenue 1px `#9AB8D9`, sin outline en focus)
8. Se deshabilita si `readOnly` o si el cliente no tiene contactos

**Flujo:** buscar cliente → Escribir 2+ caracteres en contacto → click en resultado → campos Contacto/Email Contacto/Fono Contacto se llenan automáticamente.

---

## Cambios Recientes (17 Agosto 2026)

### 57. Fix RUT cortado en tarjetas móviles del mantenedor de Clientes
**Fecha:** 17 Agosto 2026
**Ramás afectadas:** `main` (MySQL) — solo frontend, idéntico en `deploy/cloud` (PostgreSQL)
**Archivo modificado:** `frontend/src/styles/clientes-componentes.css`

**Problema:** En la vista móvil del mantenedor de Clientes, el RUT de cada cliente quedaba cortado o partido en varias líneas dentro de la tarjeta.

**Causa:** El header de la tarjeta (`.data-card-header`) usa `display: flex; justify-content: space-between` con el `strong` (código + razón social) y el badge del RUT (`.badge-rut`). Cuando la razón social era larga, el badge se comprimía y el RUT se partía en varias líneas porque `.badge-rut` no tenía `white-space: nowrap` ni protección contra encogerse.

**Solución:**
- `.badge-rut`: agregado `white-space: nowrap` + `flex-shrink: 0` → el RUT siempre queda en una sola línea y no se comprime
- `.data-card-header strong`: agregado `min-width: 0` → la razón social es la que se ajusta (envuelve/recorta), no el RUT

### 58. Fix menú `...` cortado en mobile (Clientes, Equipos, OT)
**Fecha:** 17 Agosto 2026
**Ramás afectadas:** `main` (MySQL) — solo frontend, idéntico en `deploy/cloud` (PostgreSQL)
**Archivos modificados:**
- `frontend/src/components/clientes/ClienteAcciones.jsx`
- `frontend/src/components/equipos/EquipoAcciones.jsx`
- `frontend/src/components/ordenes/OrdenAcciones.jsx`

**Problema:** En la vista móvil, al abrir el menú de acciones (`...`) en el último registro del listado, el menú se recortaba fuera del viewport y no se veía completo.

**Causa:** Los dropdowns usaban `position: fixed` y siempre se posicionaban bajo el botón (`top: rect.bottom + 4`). En el último registro no hay espacio bajo el botón, así que el menú salía del viewport.

**Solución:**
- Nuevo `useLayoutEffect` que mide la altura real del menú (`offsetHeight`) al abrirlo
- Si `top + menuHeight > window.innerHeight` → el menú se abre **hacia arriba** (`top = rect.top - menuHeight - 4`)
- El `left` se clampa con `Math.min(Math.max(rect.right - 140, 4), window.innerWidth - 140)` para que no se salga por el borde derecho
- `toggle` simplificado a `setAbierto(v => !v)`

### 59. Form OT mobile: N° Orden y Fecha ordenados
**Fecha:** 17 Agosto 2026
**Ramás afectadas:** `main` (MySQL) — solo frontend, idéntico en `deploy/cloud` (PostgreSQL)
**Archivo modificado:** `frontend/src/styles/OrdenTrabajo.css`

**Problema:** En la versión mobile del formulario de OT (crear/ver/editar), los campos N° Orden y Fecha de "Datos de la Orden" se veían desordenados.

**Solución:** En la media query ≤768px, dentro de `.of-head-row`:
- Título "Datos de la Orden" queda arriba en su propia línea (`.of-head-row` en `flex-direction: column`)
- N° Orden y Fecha en **2 columnas lado a lado** (`.of-head-row .of-grid` con `grid-template-columns: 1fr 1fr`)
- Cada campo con label encima e input a ancho completo (`.of-head-row .of-f-inline` en columna, input `width: 100%`)
- El resto de campos del formulario no se tocan

### 60. Buscadores de filtros uniformes en mobile
**Fecha:** 17 Agosto 2026
**Ramás afectadas:** `main` (MySQL) — solo frontend, idéntico en `deploy/cloud` (PostgreSQL)
**Archivos modificados:**
- `frontend/src/styles/clientes-componentes.css`
- `frontend/src/styles/ordenes-componentes.css`

**Problema:** En la versión mobile, los buscadores de filtros no tenían todos la misma altura. Los de Clientes (Razón Social, RUT) quedaban pequeños (`padding: 2px 8px` sin `min-height`), mientras que los de Equipos y OT ya tenían `padding: 10px 12px` + `min-height: 44px`.

**Solución:**
- **Clientes** (`clientes-componentes.css`): `.filtro-grupo input` en media query ≤768px ahora con `padding: 10px 12px; font-size: 0.9rem; min-height: 44px; box-sizing: border-box`
- **OT** (`ordenes-componentes.css`): `.filtro-garantia-select` y `.filtro-fecha-input` en media query ≤768px ahora con `font-size: 0.9rem` y `min-height: 44px`
- Resultado: todos los buscadores de filtros (Clientes, Equipos, OT) con el mismo alto en mobile

**Verificación (Playwright, Chrome):** dropdown muestra contacto principal y adicional de "DIEGO LUNA"; clickear el adicional autocompleta `contacto=DIEGO LUNA`, `emailC=diego@gmail.com`, `fonoC=6494960`; ancho del buscador 268px igual al campo Email.

### 61. Buscadores del form OT alineados (cliente con serie/modelo)
**Fecha:** 17 Agosto 2026
**Ramás afectadas:** `main` (MySQL) — solo frontend, idéntico en `deploy/cloud` (PostgreSQL)
**Archivo modificado:** `frontend/src/components/ordenes/OrdenFormEquipo.jsx`

**Problema:** En Nueva/Editar Orden, la lupa "Buscar y Seleccionar Cliente" quedaba 10px más arriba que las lupas "Buscar Equipo por Serie" y "Buscar por Modelo", por lo que el formulario se veía desordenado.

**Causa:** El contenedor de los badges de "Equipo seleccionado" en `OrdenFormEquipo.jsx` se renderizaba siempre (`<div style={{ marginBottom: '10px' }}>` vacío) aunque no hubiera equipo seleccionado. Ese `<div>` fantasma añadía 10px de espacio y empujaba los buscadores de serie/modelo hacia abajo.

**Solución:** El contenedor ahora es condicional (`{equipoSeleccionado && (...)}`). Los badges internos ya requerían `equipoSeleccionado`, así que solo se elimina el espacio fantasma, sin cambiar el spacing cuando el badge sí se muestra.

**Verificación (Chrome headless, CDP):** antes `top` del label cliente=256 vs serie/modelo=266; después las 3 lupas en `top=256` y los 3 inputs en `top=287` (alineados).

### 62. Campos Cliente/Comuna alineados con Equipo/Marca en form OT
**Fecha:** 17 Agosto 2026
**Ramás afectadas:** `main` (MySQL) — solo frontend, idéntico en `deploy/cloud` (PostgreSQL)
**Archivo modificado:** `frontend/src/components/ordenes/OrdenFormCliente.jsx`

**Problema:** En el form OT (nueva/editar/ver), "Cliente *" y "Comuna" de "Datos del Cliente" quedaban en filas distintas y desalineados respecto a "Equipo *" y "Marca *" de "Datos del Equipo". "Cliente *" ocupaba toda la fila (`gridColumn: span 2`) y "Comuna" quedaba en la fila siguiente; además el buscador de cliente tenía `margin-bottom: 12px` vs `8px` del buscador de equipo, desplazando todo 4px.

**Solución:**
- `Cliente *` ya no usa `gridColumn: span 2` → queda lado a lado con `Comuna` en la misma fila (igual que `Equipo *` | `Marca *`)
- `margin-bottom` del buscador de cliente cambiado de `12px` a `8px` (igual que el buscador de equipo)
- `Dirección` se mantiene ancho completo (`gridColumn: 1 / -1`)

**Verificación (Chrome headless, CDP):** antes `Cliente *=320`/`Comuna=378` vs `Equipo */Marca *=316`; después los 4 labels (`Cliente *`, `Comuna`, `Equipo *`, `Marca *`) en `top=316` (misma fila por columna).

### 63. Campo Cliente más largo en form OT
**Fecha:** 17 Agosto 2026
**Ramás afectadas:** `main` (MySQL) — solo frontend, idéntico en `deploy/cloud` (PostgreSQL)
**Archivo modificado:** `frontend/src/components/ordenes/OrdenFormCliente.jsx`

**Problema:** Después de alinear Cliente/Comuna con Equipo/Marca, el campo "Cliente *" quedaba a la mitad del ancho (~294px), muy corto para escribir una razón social completa.

**Solución:** La grilla de la fila Cliente/Comuna ahora usa `gridTemplateColumns: '2fr 1fr'` → "Cliente *" ocupa ~2/3 (392px) y "Comuna" ~1/3 (196px), coincidiendo con los anchos de "Equipo *" (399px) y "Marca *" (190px) de la columna derecha. En mobile (≤768px) la media query de `.of-form-grid` fuerza 1 columna (`!important`), así que se stackea sin problema.

**Verificación (Chrome headless, CDP):** `Cliente *` width=392 (antes 294), `Comuna` width=196; `top=316` igual que `Equipo *`/`Marca *` (399/190).

### 64. "Otras Direcciones / Sucursales" alineado con "Contador Páginas OUT" en form OT
**Fecha:** 17 Agosto 2026
**Ramás afectadas:** `main` (MySQL) — solo frontend, idéntico en `deploy/cloud` (PostgreSQL)
**Archivo modificado:** `frontend/src/components/ordenes/OrdenFormCliente.jsx`

**Problema:** El toggle "Otras Direcciones / Sucursales" quedaba 5px más abajo que el campo "Contador Páginas OUT" de "Datos del Equipo".

**Causa:** Colapso de márgenes CSS: el `margin-bottom` de la grilla `.of-form-grid` (Cliente/Comuna/Dirección) se colapsaba con el `margin-top` del card de direcciones. Cambiar solo el `margin-top` del card no tenía efecto.

**Solución final:** El **checkbox** de "Otras Direcciones / Sucursales" queda **verticalmente centrado sobre el input** de "Contador Páginas OUT" (no sobre el label). Se ajustó `margin-top: 34px` en el card (con la grilla en `margin-bottom: 15px` el gap efectivo colapsado pasa a 34px).

**Verificación (Chrome headless, CDP):**
- Nueva/Editar: centro del checkbox = centro del input (check 450-465 / 457-472, input 446-469 / 453-476) — perfecto
- Ver: checkbox 461-476 vs input 453-476 — 4px de desfase aceptado (el badge "Cliente Asignado" desplaza la columna izquierda 4px respecto a la derecha)
