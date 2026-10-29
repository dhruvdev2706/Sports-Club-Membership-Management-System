# Complete file reference

This inventory covers each pre-audit tracked project file. “Depends/dependents” is concise for simple config/assets; detailed behavior is cross-linked elsewhere. Runtime context is browser unless stated otherwise.

## Root and automation

| Path | Type / purpose / impact / dependencies / risk |
| --- | --- |
| `.env.example` | Config template: names browser Supabase variables; copied by developers. Omits server variables; never contains values. |
| `.gitattributes` | Git config normalizing text LF; affects checkout/diffs only. |
| `.gitignore` | Git config excluding dependencies, builds, logs, editor files, and `.env`; protects secrets/build noise. |
| `.oxlintrc.json` | Linter config enabling React/TS/OXC and hook rule; consumed by `npm run lint`. |
| `.setup-pages.mjs` | Developer generator script that writes placeholder page files; not referenced by package scripts. Running it overwrites feature source. |
| `README.md` | Project setup/feature document; user onboarding impact. Contains claims that differ from source (see risks). |
| `index.html` | Vite HTML entry: root element, title, favicon, Inter font and `src/main.tsx`; browser boot risk if altered. |
| `package.json` | ESM manifest, scripts and all runtime/dev dependencies; controls install/build/start. |
| `package-lock.json` | npm lockfile; reproducible dependency graph for `npm ci`; generated/managed by npm. |
| `postcss.config.js` | Enables Tailwind PostCSS and Autoprefixer for build CSS. |
| `tailwind.config.ts` | Tailwind scanning and design token extension; affects all utility styling. |
| `tsconfig.json` | Root project references to app/node configs. |
| `tsconfig.app.json` | Strict browser TypeScript configuration for `src`, alias `@/*`; no emit. |
| `tsconfig.node.json` | Strict Vite config TypeScript project; no emit. |
| `vercel.json` | Rewrites every Vercel request to SPA `index.html`; does not define API functions. |
| `vite.config.ts` | Vite/React configuration: `@` alias, configurable base path, and development-only `/api` proxy to local Express port 5000. |
| `.github/workflows/deploy.yml` | CI/CD: Node 20, npm ci, Vite build, GitHub Pages artifact/deploy; static-host context. |

## Static files

| Path | Type / purpose / impact / dependencies / risk |
| --- | --- |
| `public/.nojekyll` | Pages marker preventing Jekyll processing. |
| `public/_redirects` | Static host SPA fallback declaration. |
| `public/favicon.svg` | SVG favicon referenced by `index.html`. |
| `public/hero-court.jpg` | Public JPEG, copied by Vite; no source reference traced. |
| `src/assets/hero-court.jpg` | JPEG imported by Login/Register hero panels; visible authentication branding. |
| `src/assets/hero.png` | PNG asset; no traced import. |
| `src/assets/react.svg` | SVG asset; no traced import. |
| `src/assets/vite.svg` | SVG asset; no traced import. |
| `src/index.css` | Global Tailwind/import/custom styling loaded by main entry; affects whole SPA. |
| `src/App.css` | Stylesheet tracked but no traced import; likely obsolete. |
| `src/vite-env.d.ts` | Vite client type declarations; compile-only. |

## Browser application core

| Path | Type / purpose / impact / dependencies / risk |
| --- | --- |
| `src/main.tsx` | React bootstrap; imports global CSS and mounts `App` in strict mode. |
| `src/App.tsx` | Provider composition and toaster; imports router/auth. All UI depends on it. |
| `src/app/router.tsx` | Route map and guards; imports every page/layout. Route/security behavior changes here. |
| `src/lib/supabase.ts` | Browser SDK singleton/config fallback; imported by all data/auth feature modules. |
| `src/components/layout/MainLayout.tsx` | Responsive shell/sidebar/outlet; consumes auth/router and governs all authenticated presentation. |

## Shared UI components

| Path | Type / purpose / impact / dependencies / risk |
| --- | --- |
| `src/components/ui/Badge.tsx` | Styled status label with variants; used throughout lists/forms. |
| `src/components/ui/Button.tsx` | Native button wrapper with variants/loading disable; used in mutations/auth. |
| `src/components/ui/Card.tsx` | Card plus composition subcomponents; shared visual surface. |
| `src/components/ui/EmptyState.tsx` | Reusable no-data presentation; feature lists use it. |
| `src/components/ui/Input.tsx` | Forward-ref input/select wrappers, labels/errors/icons; supports forms. |
| `src/components/ui/Modal.tsx` | Dialog with body lock/Escape/backdrop behavior; booking/tournament uses it. |
| `src/components/ui/PageHeader.tsx` | Standard page title/actions/breadcrumb block. |
| `src/components/ui/StatCard.tsx` | Metric card used dashboards/reports. |

## Auth and feature pages

| Path | Type / purpose / impact / dependencies / risk |
| --- | --- |
| `src/features/auth/AuthContext.tsx` | Session/profile state and cache; consumer of browser Supabase; all guards/layout depend on it. |
| `src/features/auth/Login.tsx` | Email/password sign-in page; uses Supabase/hero/Button. |
| `src/features/auth/Register.tsx` | Member signup page; trigger subsequently creates data rows. |
| `src/features/auth/ResetPassword.tsx` | Recovery-email form with browser-origin redirect. |
| `src/features/auth/UpdatePassword.tsx` | Recovery listener and password update form. |
| `src/features/auth/ProtectedRoute.tsx` | Outlet guard by session/optional roles; routing dependency. |
| `src/features/auth/Unauthorized.tsx` | Access-denied view. |
| `src/features/dashboard/AdminDashboard.tsx` | Admin query/chart/stat dashboard; reads members/bookings/payments. |
| `src/features/dashboard/CoachDashboard.tsx` | Coach-facing static dashboard links/stat cards. |
| `src/features/dashboard/MemberDashboard.tsx` | Own-member/bookings dashboard. |
| `src/features/dashboard/DashboardRouter.tsx` | Selects one dashboard from profile role. |
| `src/features/members/MembersList.tsx` | Admin/coach member table/search/filter and profile links. |
| `src/features/members/MemberProfile.tsx` | Member/history detail and admin API mutations. |
| `src/features/memberships/MembershipPlans.tsx` | Admin plan list/create/edit form with Zod. |
| `src/features/coaches/CoachesList.tsx` | Admin coach directory query. |
| `src/features/facilities/FacilitiesList.tsx` | Facility/sport listing and direct form mutations. |
| `src/features/bookings/BookingsPage.tsx` | Availability grid and booking/cancel workflows using API/Supabase. |
| `src/features/payments/PaymentsPage.tsx` | Payment table/stats/manual entry; invoice is placeholder. |
| `src/features/equipment/EquipmentInventory.tsx` | Inventory/transaction queries and privileged issue/return API calls. |
| `src/features/attendance/AttendancePage.tsx` | Batch/session roster and attendance upsert. |
| `src/features/performance/PerformancePage.tsx` | Evaluation query/create workflow. |
| `src/features/tournaments/TournamentsPage.tsx` | Tournament listing, admin create, member registration. |
| `src/features/notifications/NotificationsPage.tsx` | Own notifications and mark-read updates. |
| `src/features/reports/ReportsPage.tsx` | Browser aggregation, charts, CSV export for admin. |

## Server

| Path | Type / purpose / impact / dependencies / risk |
| --- | --- |
| `server/index.ts` | Node listener entry, imports app; development/server runtime. |
| `server/app.ts` | Express composition, health/404/static production behavior; imports all routers. |
| `server/middleware/auth.ts` | Bearer token validation/profile role guard; protects privileged routers. |
| `server/routes/auth.ts` | Admin bootstrap user creation endpoint; secret-dependent. |
| `server/routes/members.ts` | Admin approval/status API and membership lifecycle persistence. |
| `server/routes/bookings.ts` | Booking creation/administrator status update; fee/availability policy. |
| `server/routes/payments.ts` | Manual payment insertion and simulated receipt handler. |
| `server/routes/equipment.ts` | Equipment RPC issue/return endpoints. |
| `server/utils/supabase.ts` | Service-role SDK singleton; server-secret boundary. |
| `server/utils/validation.ts` | Two pure booking date/duration helpers; currently test-only. |
| `server/tests/validation.test.ts` | Vitest coverage for validation helpers, test-time only. |
| `server/tsconfig.json` | Server compile target/outDir config, not root-referenced. |

## Database migrations and existing docs

| Path | Type / purpose / impact / dependencies / risk |
| --- | --- |
| `supabase/migrations/20261010000000_init_roles_auth.sql` | Schema/RLS: roles, profiles, plans, members/coaches and signup trigger. |
| `supabase/migrations/20261010000001_memberships.sql` | Membership history, number sequence/function, RLS. |
| `supabase/migrations/20261010000002_facilities_and_bookings.sql` | Sports/facilities/booking schema, exclusion constraint, RLS. |
| `supabase/migrations/20261010000003_payments_and_equipment.sql` | Payments/equipment schema, transaction functions, RLS. |
| `supabase/migrations/20261010000004_batches_and_attendance.sql` | Training, attendance, performance schema/RLS. |
| `supabase/migrations/20261010000005_tournaments_and_extras.sql` | Tournament, announcement, notification, audit schema/RLS. |
| `docs/API.md` | Pre-existing abbreviated API doc; conflicts with actual setup header/member routes. |
| `docs/Architecture.md` | Pre-existing high-level architecture diagram; less specific than this audit. |
| `docs/ERD.md` | Pre-existing ERD; schema reference, not executable configuration. |
