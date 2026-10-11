# Project overview

## What it is

Playgrid is a role-oriented sports-club management portal for administrators, coaches, and members. It implements authentication, member lifecycle management, facilities/bookings, inventory issuance, payment recording, training attendance, evaluations, tournaments, notifications, and reporting views. The primary UI is a dark responsive React SPA.

## Stack

| Layer | Observed implementation |
| --- | --- |
| Browser | React 19, TypeScript, React Router 7, TanStack Query, React Hook Form/Zod, Sonner, Recharts, Lucide |
| Styling | Tailwind CSS 4/PostCSS plus `src/index.css`; small local UI primitives |
| API | Express 5 + CORS + JSON parser, TypeScript executed with `tsx` in development |
| Identity/data | Supabase Auth and PostgreSQL accessed through `@supabase/supabase-js` |
| Database rules | SQL migrations, PostgreSQL RLS, exclusion constraint, PL/pgSQL inventory/membership functions |
| Tooling | Vite 8, TypeScript 6, Vitest, oxlint, nodemon, concurrently |

## Main areas

- Authentication: email/password sign-in, registration, recovery, and password update are direct Supabase Auth calls.
- Operations: administrators manage members, plans, coaches, facilities, payments, reports, and tournaments; some screens merely expose database-backed UI, not a matching server API.
- Training: batches, sessions, attendance, and performance evaluations are direct Supabase reads/writes.
- Member self-service: bookings, payments, tournaments, notifications, and role-specific dashboard data.

## Important implementation decisions (observed)

1. A single client-side router has a basename from Vite’s `BASE_URL`; `MainLayout` holds navigation and page outlet.
2. Supabase RLS is the actual data authorization layer for direct browser reads/writes. `ProtectedRoute` is a navigation guard, not an independent data-security boundary.
3. Express owns privileged operations needing the service role: membership approval, equipment RPC calls, manual payment insertion, and centrally calculated booking fees.
4. Auth profile loading intentionally uses an optimistic localStorage fallback (`playgrid_active_profile`) before/while querying `profiles`.
5. The repo contains two deployment stories: an Express production-serving branch in `server/app.ts`, and GitHub Pages/Vercel static hosting configuration. They are not equivalent; see [risks](TECHNICAL_DEBT_AND_RISKS.md).

## External integrations

Only Supabase and Google Fonts are evidenced. Payment processing and PDF receipts are explicitly simulated; no gateway, email service, object storage, background worker, or webhook client is implemented.
