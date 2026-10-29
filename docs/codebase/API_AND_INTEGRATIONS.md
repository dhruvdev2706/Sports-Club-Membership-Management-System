# API and external integrations

## Express API

| Method/path | Auth | Handler behavior |
| --- | --- | --- |
| `GET /api/health` | none | Returns `status` and ISO timestamp. |
| `POST /api/auth/setup-admin` | `x-setup-secret` equals `ADMIN_SETUP_SECRET` | Requires body email/password; creates a confirmed Supabase user then updates its profile role to admin. Returns the user object. |
| `POST /api/members/:id/approve` | admin bearer | Requires `plan_id`; gets plan, reuses/generates member number, activates member/current plan/dates, inserts membership history. |
| `PATCH /api/members/:id/status` | admin bearer | Updates arbitrary submitted `status`; cancellation also updates active history rows. |
| `POST /api/bookings` | bearer | Requires body facility/time inputs, checks active member/active facility/past date, computes fee, creates confirmed booking; maps PG exclusion `23P01` to 409. |
| `PATCH /api/bookings/:id/status` | admin bearer | Writes submitted status and admin reason; no status allow-list. |
| `POST /api/payments/manual` | admin bearer | Inserts a successful `Manual/Cash` payment with generated `DEMO-` reference. |
| `GET /api/payments/:id/receipt` | none | Returns a JSON placeholder, not a PDF and does not read `:id`. |
| `POST /api/equipment/issue` | admin/coach bearer | Invokes database `issue_equipment`; returns transaction UUID. |
| `POST /api/equipment/return` | admin/coach bearer | Invokes `return_equipment`; returns success JSON. |

Middleware `requireAuth` extracts `Authorization`, calls `supabaseAdmin.auth.getUser`, fetches `profiles`, and places both on the request. `requireRole` checks `profile.role`. Expected JSON inputs are only manually checked in selected routes; no shared Zod/server validation is wired.

## Supabase integration

`src/lib/supabase.ts` constructs the browser client from `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, falling back to checked-in defaults. The UI uses it for Auth and PostgREST table operations; query details are in [components/modules](COMPONENTS_AND_MODULES.md) and RLS is in [data/database](DATA_AND_DATABASE.md). The server uses a separate service-role client, bypassing RLS; exposing its key would compromise the data plane.

## Other integrations

`index.html` requests the Inter family from Google Fonts. Recharts renders browser-only charts. No live payment gateway, receipt renderer, email provider, file storage, or webhook integration is present. Vite’s dev proxy is local-only.
