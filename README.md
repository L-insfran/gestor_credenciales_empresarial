# Gestor de credenciales empresarial (MVP)

Sistema tipo password manager interno: **AdonisJS 7** (API REST + JWT), **PostgreSQL**, **React + Vite + Tailwind CSS**. Las contraseñas de login se hashean con **scrypt** (configuración por defecto de Adonis, vía mixin `withAuthFinder`); el campo secreto de cada credencial se guarda con **AES-256-GCM** usando `ENCRYPTION_KEY`. Importante: no llames a `hash.make()` antes de `User.create`/`user.save`, porque el modelo vuelve a hashear en `beforeSave` (doble hash = login imposible).

## Arquitectura (breve)

- **API stateless**: el cliente envía `Authorization: Bearer <JWT>`. El token incluye `sub` (id de usuario) y `role`; el middleware vuelve a cargar el usuario en base de datos y comprueba coherencia del rol.
- **Autorización**: rutas `/users*` exigen `SUPERADMIN`. En credenciales, las consultas filtran por `user_id` salvo que el actor sea superadmin (con filtro opcional `?userId=`).
- **Cifrado de secretos**: servicio `encrypt` / `decrypt` en `app/services/encryption_service.ts` (clave de aplicación, no por usuario). Para evolucionar a SaaS o cifrado por usuario habría que derivar claves (p. ej. por `company_id` + KMS).
- **Escalabilidad**: columnas `company_id` (usuarios y credenciales) y `two_factor_secret` (usuarios) preparan multi-empresa y 2FA sin activarlos aún.

## Requisitos

- Node.js **24+** (recomendado; es el motor que pide `@adonisjs/auth` en este proyecto).
- Docker (opcional) solo para PostgreSQL.

## Puesta en marcha

### 1. Base de datos

En la raíz del repositorio:

```bash
docker compose up -d
```

Esto levanta PostgreSQL en el puerto `5432` con usuario `creds`, contraseña `creds_secret` y base `creds_db`.

### 2. Backend

```bash
cd backend
cp ../.env.example .env
```

Completa en `.env` al menos: `APP_KEY` (p. ej. `node ace generate:key`), `JWT_SECRET` y `ENCRYPTION_KEY` (64 caracteres hex; ver comentarios en `.env.example`).

```bash
npm install
node ace migration:run
node ace db:seed
npm run dev
```

La API queda en `http://localhost:3333`.

**Usuario inicial (seed):**

- Email: `admin@empresa.local`
- Contraseña: `Admin123!`  
  (cámbiala en producción.)

Si tras un cambio de base de datos o de código no puedes entrar, vuelve a ejecutar `node ace db:seed`: el seeder de desarrollo restablece la contraseña de ese admin al valor anterior.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. El proxy de Vite reenvía las rutas de la API al backend en `3333` (incluye `/login`, `/login/totp`, `/logout`, `/refresh-token`, `/2fa`, `/me`, `/users`, `/credentials`, `/logs`, `/health`; ver `frontend/vite.config.js`).

Si prefieres otra URL de API, define `VITE_API_URL` y desactiva o ajusta el proxy en `frontend/vite.config.js`.

## Endpoints principales

| Método | Ruta | Quién |
|--------|------|--------|
| POST | `/login` | Público |
| GET | `/me` | Autenticado |
| GET/POST | `/users` | SUPERADMIN |
| PUT/DELETE | `/users/:id` | SUPERADMIN |
| GET | `/users/:userId/credentials` | SUPERADMIN |
| GET | `/credentials` | Autenticado (USER: solo propias; SUPERADMIN: todas, filtro `?userId=`) |
| POST | `/credentials` | Autenticado (SUPERADMIN puede enviar `userId`) |
| PUT/DELETE | `/credentials/:id` | Propietario o SUPERADMIN |

## Seguridad (MVP)

- Usa **HTTPS** en producción.
- Rota `APP_KEY`, `JWT_SECRET` y `ENCRYPTION_KEY`; si pierdes `ENCRYPTION_KEY`, los secretos almacenados no se pueden recuperar.
- El cifrado actual es a nivel de aplicación; para amenazas de insider en DB avanzado conviene diseño con claves por tenant o por usuario.

## Estructura de carpetas

```
backend/
  app/Controllers, Models, Middleware, Services, Validators
  database/migrations, seeders
frontend/
  src/components, pages, context, services
```

## Licencia

MIT (coincide con el kit base de Adonis).
