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

### Fecha: 14/04/2026

- Modernización completa del UI:
  - Todos losheaders con gradiente corporativo
  - Formularios现代化izadoscon secciones de colores
  - Botones de navegación con colores distintivos
  - Diseñounificado en todaslasvistas
  
- Problema de navegaciónresuelto:
  - Pantalla blanca al login/Logout
  - Solución: usar `window.location.replace()` en lugar de navigate()
  - Esto fuerzaunarecargaypreviene problemas de timing

- Módulo Equipos mejorado:
  - Hasta 12 insumos
  - Botón"+ Agregar" paramostrar más
  - Al editarses carganlosexistentes

- Módulo Clientes mejorado:
  - Hasta 5 sucursales
  - Tipocon select (Matriz,Sucursal,Bodega,Oficina,Otro)
  - Al editarses carganlosexistentes