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
- [x] Página Equipos
- [x] Styling con CSS variables

### Pendiente
- [ ] Módulo Equipos (crear, editar, eliminar)
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
│   │   ├── auth.js          # Autenticación
│   │   └── equipos.js      # Equipos
│   ├── server.js            # Servidor principal
│   ├── crear_equipos.js     # Script creación tabla
│   ├── crear_db.sql         # Schema BD
│   ├── update_pass.js      # Script actualizar password
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── GestionUsuarios.jsx
│   │   │   └── Equipos.jsx
│   │   ├── components/
│   │   │   └── CustomSelect.jsx
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
| equipo | VARCHAR(200) | Nombre del equipo |
| marca | VARCHAR(100) | Marca |
| modelo | VARCHAR(100) | Modelo |
| estado | ENUM('disponible','asignado','retirado') | Estado |
| tecnico_asignado | VARCHAR(50) | Técnico asignado |
| fecha_asignacion | DATE | Fecha de asignación |
| cliente | VARCHAR(200) | Cliente |
| observacion | TEXT | Observaciones |

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

---

## Colores Corporativos

| Color | Hex | Uso |
|-------|-----|-----|
| Primary | #2563EB | Botones principales |
| Primary Hover | #1D4ED8 | Hover botones |
| Primary Light | #DBEAFE | Fondos claros |
| Secondary | #64748B | Botones secundarios |
| Success | #10B981 | Éxito |
| Success Light | #D1FAE5 | Fondos éxito |
| Danger | #EF4444 | Danger |
| Danger Light | #FEE2E2 | Fondos danger |
| Warning | #F59E0B | Warning |
| Warning Light | #FEF3C7 | Fondos warning |
| Text | #1E293B | Texto principal |
| Text Muted | #64748B | Texto secundario |
| Border | #E2E8F0 | Bordes |

---

## Referencia: Sistema Soporte Ultra

Proyecto de referencia en: `C:\wamp64\www\sistema-soporte-ultra`

### Características a implementar del proyecto referencia:

1. **Módulo Equipos** - similar a Ordenes.jsx
2. **Filtros por** cliente, técnico, estado, equipo, marca, modelo
3. **Exportar PDF** - generar PDF de equipos
4. **Exportar Excel** - generar Excel de equipos
5. **Selector de fecha** - para filtrar por rango de fechas

---

## Para Continuar Mañana

### 1. Implementar módulo Equipos
- Crear tabla equipos si no existe
- API endpoints para CRUD
- Frontend: lista de equipos con filtros
- Formulario para crear/editar equipo

### 2.Mejorar UI
- Agregar más spacing entre elementos
- Revisar diseño responsive

### 3.参考sistema-soporte-ultra
- Copiar patrones de Ordenes.jsx
- Implementar filtros avanzados

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
npm run dev      # Iniciar开发 servidor
npm run build    # Build producción
```

---

## Notas de Sesión

### Fecha: 13/04/2026

- Se creó estructura base del proyecto
- Botón "Nuevo Usuario" ajustado con margin-bottom
- Proyecto funcionando