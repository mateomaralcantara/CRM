# ⚡ Life OS — Supabase (sin Prisma)

Arquitectura 100% Supabase con `@supabase/supabase-js`. Incluye Dashboard, Tareas, Proyectos, Metas (barra), Finanzas, Agenda y Contactos.

## Instalación
```bash
# 1) Variables de entorno
cp .env.example .env
# Pega tu URL y anon key: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2) Crea tablas en Supabase
# Abre Supabase → SQL → pega schema.sql → Run

# 3) Arranca el proyecto
npm install
npm run dev
# http://localhost:3000
```

## Seguridad
El `schema.sql` incluye políticas **abiertas para anon** (comodidad en demo).
Para producción: usa Auth y políticas por `auth.uid()`.
