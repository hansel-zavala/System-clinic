# Clínica Aura — Project Instructions

This document provides foundational mandates, architectural patterns, and workflows for the Clínica Aura project. Adherence to these guidelines is mandatory for all development tasks.

## Core Mandates

- **Package Management:** Always use `pnpm` for managing dependencies.
- **TypeScript:** The entire project (Backend, Frontend, and web-clinic) uses TypeScript. Maintain strict type safety and avoid `any`.
- **Environment Variables:**
  - Backend requires `.env` with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `RESET_SECRET`.
  - Frontend requires `.env` with `VITE_API_URL`.
- **Security:** Never commit `.env` files or hardcode secrets. Use `bcrypt` for password hashing as established in the Backend.

## Architectural Patterns

### Backend (API REST)
- **Framework:** Express 5 with TypeScript.
- **Database:** Supabase (PostgreSQL) using `@supabase/supabase-js`.
- **Modular Routes:** Routes should be registered via `registerClinicRoutes` or similar patterns in `src/clinic/routes.ts`.
- **Data Persistence:** Use the `usersPersist.ts` pattern for Supabase interactions.
- **Migration:** Database schema is defined in `database/full_migration.sql` and can be applied via `pnpm migrate`.

### Frontend (Internal Panel)
- **Framework:** Vue 3 with Vite.
- **State Management:** Pinia.
- **Routing:** Vue Router.
- **Initialization:** The app uses a `bootstrap` function in `src/main.ts` that fetches initial clinic data via `fetchClinicTablesFromApi` before mounting.
- **Styling:** Vanilla CSS following the theme defined in `src/assets/styles/theme.css`.

### Public Site (web-clinic)
- **Framework:** Astro 4.
- **Styling:** Tailwind CSS 3.
- **Components:** Modular Astro components in `src/components/sections/`.

## Development Workflows

### Setup
1. Install dependencies: `pnpm install` in each subdirectory.
2. Configure `.env` files based on `.env.example` (if present) or the README.
3. Run migrations: `cd Backend && pnpm migrate`.

### Running the Project
- **Backend:** `cd Backend && pnpm dev` (Port 4000)
- **Frontend:** `cd Frontend && pnpm dev` (Port 5173)
- **web-clinic:** `cd web-clinic && pnpm dev` (Port 4321)

### Testing
- Frontend tests are located in `Frontend` and run via `pnpm test` (Vitest).

## Coding Conventions
- **Naming:** Use PascalCase for Vue/Astro components and camelCase for functions and variables.
- **Error Handling:** Always handle potential API failures, especially during the Frontend bootstrap process.
- **Documentation:** Keep README.md and this file updated with significant architectural changes.
