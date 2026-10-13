# Continuar el proyecto en otro PC (sin tocar la web)

Guía para seguir trabajando desde otro equipo, por ejemplo la casa. El detalle de lo que cambió está en `CAMBIOS.md` (entradas del 2026-10-02 y 2026-10-13).

## 1. Reglas para no afectar la web

- Solo existen dos ramas: `main` y `deploy/cloud`. Ya no hay rama de pruebas: para trabajar sin publicar, haz **commits locales y no hagas `git push`**.
- **Un `git push` a `main` publica el frontend en Vercel** (su rama de producción es `main`), y un push a `deploy/cloud` actualiza el backend en Render. Si el frontend nuevo llega antes que el backend, la web da 404 en las rutas nuevas. Orden para publicar: migración en Neon → `deploy/cloud` → `main`.
- Vercel además crea una vista previa (con otra URL) por cada rama que se sube.
- Nunca subir `backend/.env` (ya está en `.gitignore`), ni `node_modules/`, ni `.claude/`.

## 2. Requisitos del otro PC

- Node.js (el mismo mayor que aquí; se usó v24) y npm.
- MySQL 8 con un usuario que pueda crear bases de datos.
- Git.

## 3. Traer el proyecto

```bash
git clone https://github.com/rlunasanchez/hls-soluciones.git
cd hls-soluciones
git switch main                            # MySQL local (deploy/cloud es la versión PostgreSQL de la nube)
cd backend && npm install
cd ../frontend && npm install
```

### Si ya tienes una copia antigua del proyecto en ese PC

No hace falta bajar todo de nuevo:

1. `git status` y `git branch -vv`. Si hay cambios sin guardar, copia la carpeta antes de seguir.
2. `git fetch origin`, luego `git switch main` y `git pull`. Si dice que las ramas **divergieron**, no fuerces nada: revisa primero con `git log origin/main..main` qué commits solo existen ahí.
3. `npm install` en `backend/` y en `frontend/`.
4. La base de datos de esa copia tiene el esquema antiguo (`clientes_contactos`, `clientes_direcciones`): crea una base nueva con `backend/crear_tablas.sql`, ejecuta `node crear-admin.js` y apunta `DB_NAME` del `.env` a la base nueva. La vieja queda intacta. Las migraciones antiguas se borraron del repo; siguen en el historial de git si se necesitan para conservar datos.

## 4. Variables de entorno

Crear `backend/.env` (no se sube a git). Variables necesarias:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<la contraseña de tu MySQL>
DB_NAME=soporte_tecnico_db
JWT_SECRET=<una frase larga cualquiera>
SETUP_ADMIN_KEY=<una clave cualquiera>
ADMIN_PASSWORD=<la contraseña del usuario admin>
ADMIN_EMAIL=<tu correo>
```

El frontend apunta por defecto a `http://localhost:5001`; no necesita `.env`.

## 5. Crear la base de datos

Base nueva, desde cero (un solo script):

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS soporte_tecnico_db CHARACTER SET utf8mb4;"
mysql -u root -p soporte_tecnico_db < backend/crear_tablas.sql
cd backend && node crear-admin.js        # crea el usuario admin con ADMIN_PASSWORD
```

`crear_tablas.sql` crea todas las tablas, incluidas las nuevas:

| Tabla | Para qué sirve |
|---|---|
| `clientes` | Empresa o persona (razón social, RUT, fono, email, dirección, ciudad, comuna) |
| `contactos` | Mantenedor de contactos (catálogo) |
| `direcciones` | Mantenedor de direcciones (catálogo) |
| `cliente_contactos` | Vínculo cliente ↔ contacto (`orden`, `a_ot`) — **nueva** |
| `cliente_direcciones` | Vínculo cliente ↔ dirección (`orden`, `a_ot`) — **nueva** |
| `equipos`, `ordenes_trabajo`, `cotizaciones`, `usuarios` | Igual que antes |

Las tablas nacen vacías y los contactos y direcciones se vinculan a cada cliente desde su ficha. Si una base vieja tiene el esquema antiguo, lo más simple es crear una base nueva con `crear_tablas.sql`.

## 6. Levantar el proyecto

```bash
cd backend  && node server.js      # puerto 5001  (o: npm run dev, que reinicia solo)
cd frontend && npm run dev         # puerto 5173
```

Abrir `http://localhost:5173`. El backend **no** se recarga solo con `node server.js`: si cambias código del backend, hay que reiniciarlo.

## 7. Trabajar y llevar los cambios a casa

```bash
git add <archivos>
git commit -m "..."
git push origin main      # ATENCIÓN: publica el frontend en Vercel. Solo cuando quieras publicar.
```

Para llevar el trabajo a casa sin publicar, copia la carpeta o usa un bundle (`git bundle`). En el otro PC: `git pull` dentro de `main`. Antes de cada `push`, revisa con `git branch --show-current` en qué rama estás.

## 8. Qué probar primero

1. Clientes → crear un cliente; en su ficha vincular contactos y direcciones, marcar el check "En la OT" y probar "Editar" y la X.
2. En la lista de clientes, botón **OT**: la OT debe abrirse con lo marcado, y los checks deben quedar desmarcados.
3. En la OT: "Buscar Contacto", "Buscar Dirección", `Editar completo` y `Editar`.
