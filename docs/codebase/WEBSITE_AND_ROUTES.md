# Website, routes, and journeys

All paths below are registered in `src/app/router.tsx`; all non-auth views require a Supabase session through the root `ProtectedRoute`.

| Route | View / access | Behavior and data |
| --- | --- | --- |
| `/` | `DashboardRouter`; all roles | Chooses admin/coach/member dashboard from `profile.role`. Admin fetches member, booking, and payment aggregates/chart data; member fetches own member and booking records; coach is largely static navigation/status content. |
| `/members`, `/members/:id` | admin, coach | Directory searches/filters `members`; profile joins `profiles`, plans, history. Admin can approve, suspend, cancel, reactivate through API. |
| `/memberships` | admin | Lists and creates/edits `membership_plans` directly with Zod validation. |
| `/coaches` | admin | Lists `coaches` with profile data; no creation/edit action is observed. |
| `/facilities` | admin, coach | Lists facilities/sports. UI allows form mutation, but database RLS allows writes only to admin. |
| `/bookings` | all | Slot-oriented facility booking. Member booking is posted to Express; members cancel direct to Supabase; admin cancellation is API mediated. |
| `/payments` | all route-level | Lists payments according to local role filter/RLS; admin records manual payments through API. Invoice button only shows a toast. |
| `/attendance` | all route-level | Loads batches, sessions, roster, and upserts attendance status; database RLS permits writes to admin/coach. |
| `/equipment` | all route-level | Lists inventory/transactions; issue/return calls API but controls are hidden from non-admin/non-coach. |
| `/tournaments` | all route-level | Lists tournaments, member registration, and an admin creation form; RLS enforces writes. |
| `/performance` | all route-level | Lists performance evaluations and lets eligible roles create an evaluation. |
| `/notifications` | all | Lists current user notifications and marks one/all read directly. |
| `/reports` | admin | Aggregates browser-side members, payments, and bookings into chart/CSV exports. |
| `/auth/login`, `/auth/register` | public | Supabase password sign-in and sign-up; signup metadata requests `member`. |
| `/auth/reset`, `/auth/update-password` | public/recovery | Requests a reset email then calls `updateUser`; recovery redirect targets the latter path. |
| `/unauthorized` | public | Simple access-denied page linking to `/`. |

## Page states and responsive behavior

Feature pages commonly display local loading spinners and `EmptyState`; mutation failures toast errors. The shared layout turns the desktop sidebar into an overlay mobile menu. Forms/cards/tables use responsive Tailwind classes. There is no observed shared route error boundary, global offline state, or skeleton system.

## Key user journeys

### Member registration and approval

Register -> Supabase Auth sign-up with metadata -> `handle_new_user` trigger makes `profiles` and `members` (pending) -> admin opens `/members/:id`, selects plan -> `/api/members/:id/approve` authenticates/authorizes, allocates a membership number, updates `members`, inserts `memberships` -> invalidated queries re-render.

### Equipment transaction

Admin/coach opens inventory -> picks equipment/member/quantity -> API verifies role -> `issue_equipment` locks equipment row, decrements availability, inserts transaction -> cache refresh. Return calls `return_equipment`, which locks transaction, checks `issued`, restores quantity, and records return fields.

### Tournament registration

Member presses register -> direct insertion into `tournament_registrations` with own profile ID -> unique `(tournament_id, member_id)` prevents a duplicate -> registration cache refreshes. Capacity/deadline enforcement is not observed.
