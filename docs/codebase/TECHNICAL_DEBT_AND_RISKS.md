# Technical debt and risks

| Priority / confidence | Evidence and impact | Recommendation |
| --- | --- | --- |
| Critical — Confirmed | `npm run build` lacks `server/tsconfig.json`, while `npm start` expects `dist/server/index.js`; clean build cannot provide its runtime server. | Add a server compilation/build step or use one consistent runtime deployment. |
| Critical — Confirmed | GitHub Pages and Vercel configs deploy static SPA behavior, but bookings, approvals, payments, and inventory call Express `/api`; those calls have no deployed Express handler. | Deploy API separately with rewrites/CORS, or move carefully authorized logic to Supabase functions. |
| High — Confirmed | README says existing-user provisioning via `x-admin-setup-secret`, but code creates a *new* user and reads `x-setup-secret`. | Correct docs and harden/retire bootstrap endpoint after use. |
| High — Confirmed | `src/lib/supabase.ts` and Pages workflow contain fallback cloud endpoint/key. The anon key is normally publishable, but an unintended fallback binds builds to one project and makes environment mistakes silent. | Require build configuration or document intentional public defaults. |
| High — Confirmed | `POST /api/auth/setup-admin` returns `authData.user` and remains callable whenever secret is known; no one-time setup state/rate limiting is implemented. | Make provisioning one-time/admin-controlled and minimize response data. |
| High — Confirmed | Server routes accept unvalidated status, amounts, UUIDs, dates, quantities, and booking duration; `server/utils/validation.ts` is tested but unused by booking route. | Add schemas and enforce start < end, 30–240 minutes, capacity/hours/blocked periods, numeric bounds, and allowed statuses. |
| Medium — Confirmed | Route guards do not constrain payments, attendance, equipment, tournaments, performance, or notifications by role; some UI controls are hidden but pages can be entered. RLS limits several writes. | Align route/UI guards with RLS and show explicit access states. |
| Medium — Confirmed | `PaymentsPage` receipt action is toast-only; endpoint is unauthenticated placeholder JSON. | Implement authenticated receipt retrieval or remove the affordance. |
| Medium — Confirmed | `FacilitiesList` exposes coach mutation UI although migration RLS permits only admin facility management. | Restrict UI to admin or revise intended policy. |
| Medium — Likely | Auth profile fallback is cached in localStorage and may temporarily show stale role/name until `profiles` resolves. | Clear/version cache on role changes; avoid optimistic authorization-sensitive UI. |
| Medium — Confirmed | No tests cover routes, RLS behavior, components, migrations, authentication, or the privileged flows. | Add integration tests with test Supabase/project and UI tests for authorization failures. |
| Low — Confirmed | `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`, `public/hero-court.jpg`, and `App.css` have no traced imports/references in source; `src/assets/hero-court.jpg` is used by auth pages. | Verify distribution/marketing use, then remove unused assets/styles if safe. |
| Low — Confirmed | `announcements` and `audit_logs` migrations have no observed UI/API consumer; README claims audit capability without writer implementation. | Either implement producer/consumer paths or mark as future schema. |

“Confirmed” refers to static source/config evidence. “Likely” needs runtime/environment confirmation. No live deployment, Supabase project state, or secrets were inspected.
