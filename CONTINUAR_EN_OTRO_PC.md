# Continuar el proyecto en otro PC (sin tocar la web)

Guía para seguir trabajando en la rama de pruebas desde otro equipo, por ejemplo la casa, sin que nada llegue a la web. El detalle de lo que cambió está en `CAMBIOS.md` (entrada v2.156).

## 1. Reglas para no afectar la web

- Se trabaja **solo** en la rama de pruebas (`vinculos-sobre-origin-main` u otra rama extra con nombre propio).
- **Nunca** hacer push a `main` ni a `deploy/cloud`. La web (Vercel y Render) sale de esas ramas.
- Verificar en los paneles de **Vercel** y **Render** cuál es la rama de producción y que no sea la rama de pruebas. Vercel además crea una vista previa (con otra URL) por cada rama que se sube; se puede desactivar en el proyecto, en *Settings → Git → Ignored Build Step*, con un comando que solo construya la rama de producción.
- Nunca subir `backend/.env` (ya está en `.gitignore`), ni `node_modules/`, ni `.claude/`.

## 2. Requisitos del otro PC

- Node.js (el mismo mayor que aquí; se usó v24) y npm.
- MySQL 8 con un usuario que pueda crear bases de datos.
- Git.

## 3. Traer el proyecto

```bash
git clone https://github.com/rlunasanchez/hls-soluciones.git
cd hls-soluciones
git switch vinculos-sobre-origin-main      # la rama de pruebas (debe existir en origin)
cd backend && npm install
cd ../frontend && npm install
```

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

Si ya tienes una base creada con el **esquema antiguo** (con `clientes_contactos` y `clientes_direcciones`), no uses `crear_tablas.sql`: corre en este orden
`backend/migracion_2026-09-25_contactos_direcciones.sql` y luego `backend/migracion_2026-10-01_cliente_vinculos.sql`.

No hay migración de datos: las tablas nacen vacías y los contactos y direcciones se vinculan a cada cliente desde su ficha.

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
git push origin vinculos-sobre-origin-main      # solo la rama de pruebas
```

En el otro PC: `git pull` dentro de la misma rama. Antes de cada `push`, revisar con `git branch --show-current` que no sea `main` ni `deploy/cloud`.

## 8. Qué probar primero

1. Clientes → crear un cliente; en su ficha vincular contactos y direcciones, marcar el check "En la OT" y probar "Editar" y la X.
2. En la lista de clientes, botón **OT**: la OT debe abrirse con lo marcado, y los checks deben quedar desmarcados.
3. En la OT: "Buscar Contacto", "Buscar Dirección", `Editar completo` y `Editar`.
