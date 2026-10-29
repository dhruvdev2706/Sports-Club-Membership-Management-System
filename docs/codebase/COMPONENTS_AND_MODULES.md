# Components and module reference

## Shared application modules

| Path / exports | Responsibilities and consumers |
| --- | --- |
| `src/main.tsx` | Browser bootstrap; imports global CSS and renders `App`. |
| `src/App.tsx` | Installs `QueryClientProvider`, `AuthProvider`, router and `Toaster`. |
| `src/app/router.tsx` | Full route registration and nested role guards. |
| `src/lib/supabase.ts` | Browser Supabase singleton; imported by auth and data features. |
| `src/features/auth/AuthContext.tsx` | `AuthProvider` / `useAuth`; session listener, profile query/cache, sign-out. |
| `src/features/auth/ProtectedRoute.tsx` | Redirects anonymous users to login and unauthorized role accesses to `/unauthorized`. |
| `src/components/layout/MainLayout.tsx` | Responsive role-filtered sidebar, top title derived from path, sign-out, and outlet. |

## UI primitives

`Badge`, `Button`, `Card` (plus header/title/description/content), `EmptyState`, `Input`/`Select`, `Modal`, `PageHeader`, and `StatCard` are presentational TypeScript components. They compose native props, fixed Tailwind design values, and a small prop API. `Modal` additionally locks body scrolling and closes on Escape/backdrop; changing it affects booking/tournament usage. `Input`/`Select` use `forwardRef`, supporting React Hook Form. These modules do not fetch data.

## Feature modules

| Area | Significant logic |
| --- | --- |
| Auth pages | `Login`, `Register`, `ResetPassword`, `UpdatePassword` call Supabase Auth and toast outcomes; auth pages share a hero asset and local form/loading state. `Unauthorized` is presentational. |
| Dashboards | `DashboardRouter` dispatches by role. `AdminDashboard` runs parallel Supabase aggregate/list queries and Recharts line chart; `MemberDashboard` queries own member/bookings; `CoachDashboard` is static cards/links. |
| Members | `MembersList` filters fetched rows client-side and writes status filter to query string. `MemberProfile` loads member/history/plans and mutates via API; it is the member-lifecycle UI. |
| Operational CRUD | `MembershipPlans` and `FacilitiesList` use React Hook Form/Zod plus direct Supabase mutations; `CoachesList` is read-only. |
| Bookings | Builds daily slots, determines availability from booking query, calls API for creation/admin cancellation or direct update for member cancellation. |
| Training | `AttendancePage` selects batches/sessions and inserts/updates unique attendance; `PerformancePage` queries/creates evaluations. |
| Finance/inventory | `PaymentsPage` lists/aggregates records and posts manual payment; `EquipmentInventory` queries inventory/transactions and calls issue/return API. |
| Community | `TournamentsPage` creates tournaments (admin UI) and own registrations; `NotificationsPage` marks own rows read; `ReportsPage` aggregates fetched datasets client-side and creates CSV downloads. |

## Server modules

`server/app.ts` is Express composition; `server/index.ts` is the listener. `server/utils/supabase.ts` owns service-role client. `middleware/auth.ts` supplies `AuthRequest`, `requireAuth`, and `requireRole`. Routers map exactly to the endpoint table in [API documentation](API_AND_INTEGRATIONS.md). `utils/validation.ts` exposes `isBookingInPast`/`isValidDuration`; only its Vitest test imports it, not a route.
