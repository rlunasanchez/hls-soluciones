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
const ITEMS_POR_PAGINA = 5; // o 10 según contexto
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
