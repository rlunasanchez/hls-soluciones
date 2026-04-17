# HLS Soluciones Informáticas

## Información General

- **Cliente:** HLS Soluciones
- **Desarrollador:** Rodrigo Luna
- **Stack:** React + Vite (Frontend), Node.js + Express (Backend), MySQL (DB)
- **Versión:** 1.0.0

---

## Estado del Proyecto

### Completado
- [x] Estructura base frontend (React + Vite)
- [x] Estructura base backend (Express)
- [x] Sistema de login con JWT
- [x] Gestión de usuarios (CRUD)
- [x] Módulo Equipos (crear, editar, eliminar)
- [x] Módulo Clientes (crear, editar, eliminar)
- [x] Styling moderno con CSS variables
- [x] Diseño unificado con gradiente corporativo
- [x] Formularios modernizados (Equipos, Clientes, Usuarios, Login)
- [x] Navegación protegida con refresh forzado

### Pendiente
- [ ] Módulo Informes Técnicos
- [ ] Módulo Retiro Bodega
- [ ] Exportación PDF
- [ ] Exportación Excel

---

## Estructura del Proyecto

```
HLS Soluciones informaticas/
├── backend/
│   ├── config/db.js          # Conexión MySQL
│   ├── routes/
│   │   ├── auth.js            # Autenticación
│   │   ├── equipos.js        # Equipos
│   │   └── clientes.js       # Clientes
│   ├── server.js             # Servidor principal
│   ├── crear_equipos.js       # Script creación tabla
│   ├── crear_clientes.js    # Script creación tabla
│   ├── crear_db.sql         # Schema BD
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Login modernizado
│   │   │   ├── Home.jsx           # Menú principal modernizado
│   │   │   ├── GestionUsuarios.jsx # Gestión Usuarios
│   │   │   ├── Equipos.jsx        # Mantenedor Equipos
│   │   │   └── Clientes.jsx       # Mantenedor Clientes
│   │   ├── components/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
│
└── NOTAS_PROYECTO.md
```

---

## Base de Datos

### Tabla: usuarios

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT AUTO_INCREMENT | ID único |
| usuario | VARCHAR(50) | Nombre de usuario |
| password | VARCHAR(255) | Password encriptado |
| rol | ENUM('admin','tecnico') | Rol del usuario |
| email | VARCHAR(100) | Correo electrónico |
| activo | BOOLEAN | Estado del usuario |
| fecha_creacion | TIMESTAMP | Fecha de creación |

### Tabla: equipos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT AUTO_INCREMENT | ID único |
| serie | VARCHAR(100) | Número de serie |
| equipo | VARCHAR(100) | Nombre del equipo |
| marca | VARCHAR(100) | Marca |
| modelo | VARCHAR(100) | Modelo |
| contador_pag | INT | Contador de páginas |
| nivel_tintas | VARCHAR(50) | Nivel de tintas |
| insumo1-12 | VARCHAR(100) | Insumos |
| averia | VARCHAR(255) | Avería/Falla/Incidencia |
| activo | BOOLEAN | Estado activo |
| fecha_creacion | TIMESTAMP | Fecha de creación |

### Tabla: clientes

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT AUTO_INCREMENT | ID único |
| razon_social | VARCHAR(255) | Razón social |
| giro | VARCHAR(100) | Giro |
| rut | VARCHAR(20) | RUT |
| direccion | VARCHAR(255) | Dirección |
| ciudad | VARCHAR(100) | Ciudad |
| comuna | VARCHAR(100) | Comuna |
| telefono | VARCHAR(20) | Teléfono |
| contacto_nombre | VARCHAR(100) | Nombre contacto |
| contacto_email | VARCHAR(100) | Email contacto |
| contacto_fono | VARCHAR(20) | Teléfono contacto |
| contacto_cargo | VARCHAR(100) | Cargo contacto |
| contacto_direccion | VARCHAR(255) | Dirección contacto |
| direcciones | TEXT | Sucursales (formato: tipo|dir|fono|ciudad|comuna;;) |
| activo | BOOLEAN | Estado activo |
| fecha_creacion | TIMESTAMP | Fecha de creación |

---

## API Endpoints

### Auth
- `POST /api/auth/registrar` - Crear usuario
- `POST /api/auth/login` - Iniciar sesión
- `PUT /api/auth/actualizar-usuario/:id` - Actualizar usuario
- `DELETE /api/auth/eliminar-usuario/:id` - Eliminar usuario
- `PUT /api/auth/activar-usuario/:id` - Activar/desactivar usuario
- `PUT /api/auth/resetear-password/:id` - Resetear password
- `PUT /api/auth/cambiar-password` - Cambiar mi password
- `GET /api/auth/usuarios` - Listar usuarios

### Equipos
- `GET /api/equipos` - Listar equipos
- `POST /api/equipos` - Crear equipo
- `PUT /api/equipos/:id` - Actualizar equipo
- `DELETE /api/equipos/:id` - Eliminar equipo

### Clientes
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Crear cliente
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente

---

## Colores Corporativos (CSS Variables)

| Variable | Hex | Uso |
|----------|-----|-----|
| --primary | #0C4A8C | Azul corporativo |
| --primary-hover | #0a3d75 | Hover primario |
| --primary-light | #e6f0fa | Fondo azul claro |
| --success | #00B5E2 | Cyan success |
| --success-light | #e0f7fc | Fondo cyan |
| --warning | #FF9800 | Naranja warning |
| --warning-light | #fff3e0 | Fondo naranja |
| --danger | #E53935 | Rojo danger |
| --danger-light | #ffebee | Fondo rojo |
| --text | #1a1a2e | Texto principal |
| --text-muted | #64748B | Texto secundario |
| --bg | #f0f2f5 | Fondo página |
| --panel | #ffffff | Fondo tarjetas |
| --border | #e2e8f0 | Bordes |
| --gradient | linear-gradient(135deg, #0C4A8C 0%, #009EE3 100%) | Gradiente |

---

## UI Mejorada (14/04/2026)

### Navigation Buttons
- **Inicio:** var(--primary) azul
- **Equipos:** var(--success) cyan
- **Clientes:** var(--warning) naranja
- **Usuarios:** #0D9488 verde azulado
- **Cerrar Sesión:** rgba(255,255,255,0.2) translúcido

### Formularios Modernizados
Todos los formularios ahora tienen:
- Header con gradiente corporativo
- Secciones con fondos de colores (primary-light, success-light, warning-light)
- Grid layout responsive
- Estilo uniforme de inputs
- Botón X para cerrar
- Diseño limpio y moderno

### Login
- Fondo con gradiente
- Tarjeta blanca con sombras
- Inputs con iconos
- Diseño responsivo

### Equipos/Insumos
- Sistema de hasta 12 insumos visibles
- Botón "+ Agregar" para mostrar más
- Se cargan los existentes al editar

### Clientes/Sucursales
- Sistema de hasta 5 sucursales
- Botón "+ Agregar" para mostrar más
- Select para tipo (Matriz, Sucursal, Bodega, Oficina, Otro)
- Se cargan las existentes al editar

---

## Technical Notes (14/04/2026)

### Login/Logout Implementation
Para evitar problemas con la navegación del navegador (flechas atrás/adelante):
- Login usa `window.location.replace('/home')` después de guardar token
- Logout usa `window.location.replace('/login')` después de borrar token
- Esto previene que el usuario pueda voltar con la flecha del navegador

### Pagination
- Equipos: 5 por página
- Clientes: configurable

### Referencias
- Proyecto参考: `C:\wamp64\www\sistema-soporte-ultra`

---

## Comandos Útiles

### Backend
```bash
cd backend
npm start        # Iniciar servidor
npm run dev      # Iniciar con watch
```

### Frontend
```bash
cd frontend
npm run dev     # Iniciar servidor dev
npm run build   # Build producción
```

---

## Pendiente para Mañana

1. **Módulo Informes Técnicos** - Crear nuevo módulo
2. **Módulo Retiro Bodega** - Crear nuevo módulo
3. **Exportación PDF** - Implementar con librería html2pdf o similar
4. **Exportación Excel** - Implementar con librería xlsx

---

## Notas de Sesión

### Fecha: 16/04/2026

- Fix editar clientes sin sucursales:
  - Al editar clientes sin direcciones guardadas, los campos aparecían vacíos
  - Solución: inicializar estado sucursales antes de cargar datos existentes
  - Agregada lógica para manejar clientes sin direcciones

- Botón eliminar paraSucursales/Endereços:
  - Agregado botón Trash2 con clase delete-btn en Sucursales (Clientes)
  - Agregado botón Trash2 en Insumos (Equipos)
  - Mantener mismos estilos que el proyecto

---

## Recordatorio de Estilos (IMPORTANTE)

Al agregar nuevos botones o elementos, USAR siempreexactamente estos estilos:

### Botón delete-btn (para eliminar rows)
```css
.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--danger-light);
  color: var(--danger);
  border: none;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: var(--danger);
  color: white;
  transform: translateY(-1px);
}
```

### Botón secondary-btn (para acciones secundarias)
```css
.secondary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--primary);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.secondary-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}
```

### Botón main-btn (para acciones principales)
```css
.main-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--gradient);
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(12, 74, 140, 0.3);
}

.main-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(12, 74, 140, 0.4);
}
```

### Reglas generales
- SIEMPRE usar `display: flex`, `align-items: center`, `justify-content: center`
- SIEMPRE usar `gap: 8px` para iconos
- SIEMPRE usar `border-radius: var(--radius-sm)`
- SIEMPRE usar `transition: all 0.2s ease`
- NUNCA agregar estilos inline básicos (display, padding, etc.) - usar clases CSS

### Colores por tipo de elemento
- primary (azul): botones principales, navegación
- success (cyan): secciones de insumos
- warning (naranja): secciones de clientes
- danger (rojo): botones de eliminar
- colors:
  - var(--primary): #0C4A8C
  - var(--primary-light): #e6f0fa
  - var(--success): #00B5E2
  - var(--success-light): #e0f7fc
  - var(--danger): #E53935
  - var(--danger-light): #ffebee

### Input fields
- Todos los inputs deben usar clase `.form-group`
- Labels dentro del grupo
- Bordes con `--border`
- Focus con `--primary`

---

## Notas de Sesión (Anterior)

### Fecha: 14/04/2026

- Modernización completa del UI:
  - Todos losheaders con gradiente corporativo
  - Formularios modernizados con secciones de colores
  - Botones de navegación con colores distintivos
  - Diseño unificado en todas las vistas

- Problema de navegación resuelto:
  - Pantalla blanca al login/logout
  - Solución: usar `window.location.replace()` en lugar de navigate()
  - Esto fuerza una recarga y previene problemas de timing

- Módulo Equipos mejorado:
  - Hasta 12 insumos
  - Botón "+ Agregar" para mostrar más
  - Al editar se cargan los existentes

- Módulo Clientes mejorado:
  - Hasta 5 sucursales
  - Tipo con select (Matriz, Sucursal, Bodega, Oficina, Otro)
  - Al editar se cargan las existentes