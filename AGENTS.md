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
- Búsqueda unificada: busca en datos de cliente Y datos de equipo
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
