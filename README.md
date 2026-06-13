# Clínica Aura — Sistema de Gestión Clínica

Sistema completo de gestión para clínicas médicas que incluye un **panel administrativo interno** (Vue 3), una **API REST** (Express + TypeScript) y un **sitio público** (Astro) con chatbot para agendar citas.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| **Backend (API)** | Node.js, Express 5, TypeScript, Supabase (PostgreSQL), bcrypt, multer |
| **Frontend (Panel)** | Vue 3, Vite, Pinia, Vue Router, Chart.js, FullCalendar, jsPDF |
| **Sitio Público** | Astro 4, Tailwind CSS 3, TypeScript |
| **Base de Datos** | Supabase (PostgreSQL) |
| **Gestor Paquetes** | pnpm |

---

## Requisitos

- **Node.js** >= 18
- **pnpm** >= 8 (instalar con `npm install -g pnpm`)
- Una cuenta en [Supabase](https://supabase.com) (o acceso a la existente)

---

## Estructura del Proyecto

```
Clinica/
├── appointment system/ # Sistema de citas (Backend, Frontend y Base de datos)
│   ├── Backend/        # API REST (Express + TypeScript)
│   ├── Frontend/       # Panel administrativo (Vue 3 + Vite)
│   └── database/       # Migraciones SQL (full_migration.sql)
├── qr/                 # Aplicación móvil Android para escaneo de códigos QR
└── web-clinic/         # Sitio público (Astro + Tailwind)
```

---

## Configuración Inicial

### 1. Clonar e instalar dependencias

```bash
# Instalar dependencias de todos los subproyectos
cd "appointment system/Backend" && pnpm install
cd ../Frontend && pnpm install
cd ../../web-clinic && pnpm install
```

### 2. Configurar variables de entorno

**Backend** — `appointment system/Backend/.env`:

```env
SUPABASE_URL=https://cambiar-supabase-url.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESET_SECRET=tu_secreto_aqui
PORT=4000
```

**Frontend** — `appointment system/Frontend/.env`:

```env
VITE_API_URL=http://localhost:4000
```

### 3. Base de datos (Supabase)

Ejecutar el script de migración contra tu proyecto de Supabase:

```bash
cd "appointment system/Backend"
pnpm migrate
```

Esto crea todas las tablas e inserta los datos iniciales. Alternativamente, puedes copiar el contenido de `appointment system/database/full_migration.sql` y ejecutarlo directamente en el SQL Editor de Supabase.

---

## Ejecutar el Sistema

### Backend (API)

```bash
cd "appointment system/Backend"
pnpm dev
```

El servidor se inicia en `http://localhost:4000`.

### Frontend (Panel Administrativo)

```bash
cd "appointment system/Frontend"
pnpm dev
```

El panel se abre en `http://localhost:5173`.

### Sitio Público (Pacientes)

```bash
cd web-clinic
pnpm dev
```

El sitio se abre en `http://localhost:4321`.

### App Móvil (Escáner QR)

La carpeta `qr` contiene una aplicación móvil Android desarrollada en Kotlin que permite escanear códigos QR.
Para compilar y ejecutar:
1. Abre la carpeta `qr` en **Android Studio**.
2. Sincroniza Gradle.
3. Ejecuta en un dispositivo o emulador.

---

## Cuenta de Administrador por Defecto

Al ejecutar la migración de base de datos, se crea automáticamente un usuario administrador:

| Campo | Valor |
|-------|-------|
| **Correo electrónico** | `admin@clinica.local` |
| **Contraseña** | `Admin123!` |

Con esta cuenta puedes acceder al panel administrativo (`http://localhost:5173/login`) y gestionar médicos, pacientes, citas y configuración del sistema.

---

## Scripts Disponibles

### Backend
| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia el servidor en modo desarrollo con recarga automática |
| `pnpm build` | Compila TypeScript a JavaScript |
| `pnpm start` | Ejecuta la versión compilada |
| `pnpm migrate` | Ejecuta las migraciones de base de datos |

### Frontend
| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia el servidor de desarrollo de Vite |
| `pnpm build` | Compila para producción |
| `pnpm preview` | Previsualiza la compilación de producción |
| `pnpm test` | Ejecuta pruebas con Vitest |

### web-clinic
| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia el servidor de desarrollo de Astro |
| `pnpm build` | Compila el sitio estático |
| `pnpm preview` | Previsualiza el sitio compilado |

---

## Rutas del API (Backend)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/db/status` | Estado de conexión a base de datos |
| `GET` | `/api/clinic/tables` | Obtener datos completos de la clínica |
| `PATCH` | `/api/clinic/tables` | Actualizar datos de la clínica |
| `POST` | `/api/auth/login` | Iniciar sesión |
| `POST` | `/api/auth/change-password` | Cambiar contraseña |
| `GET` | `/api/clinic/availability` | Consultar disponibilidad de citas |
| `POST` | `/api/clinic/chatbot-booking` | Agendar cita desde el chatbot público |

---

## Licencia

Uso interno.
