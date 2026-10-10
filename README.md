# Sports Club Membership Management System

## 1. Project Overview
A complete, functional, responsive Sports Club Membership Management System designed to handle daily operations for a sports club. It provides a full-stack platform for administrators, coaches, and members.

## 2. Feature List
- **Authentication & RBAC:** Supabase Auth with strict 'admin', 'coach', and 'member' roles.
- **Membership Lifecycle:** Applications, approvals with unique sequence IDs, suspensions, cancellations, and historical tracking.
- **Facility Bookings:** Robust facility management and member booking engine with PostgreSQL overlap exclusion constraints.
- **Payments & Receipts:** Manual/demo payment recording, receipt generation workflows, and financial tracking.
- **Equipment Inventory:** Complete transactional inventory logic protecting against race conditions during checkouts/returns.
- **Coaching & Attendance:** Coach batch assignments, real-time attendance rosters, and performance evaluation scoring.
- **Tournaments:** Admin tournament configuration and member registrations.
- **Notifications & Announcements:** Personalized in-app alerts and global club announcements.
- **Administrative Analytics:** Live data dashboard using Recharts and secure CSV exports.

## 3. Technology Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend:** Node.js, Express, TypeScript.
- **Database:** Supabase PostgreSQL, Supabase Auth.
- **Libraries:** React Router, TanStack Query, React Hook Form, Zod, Recharts, Lucide React.

## 4. Repository Structure
- `/src`: React frontend (Pages, Components, Features).
- `/server`: Node.js Express API.
- `/supabase`: PostgreSQL schema migrations.

## 5. Prerequisites
- Node.js (v18+)
- npm (v9+)
- A Supabase Project (URL and Keys)

## 6. Local Installation
```bash
git clone <repository>
cd sports-club-membership-management-system
npm install
```

## 7. Environment Variable Configuration
Create a `.env` file at the root:
```env
# Server Config
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:5173

# Supabase Client
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase Server (Private)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
ADMIN_SETUP_SECRET=super_secret_string
```

## 8. Supabase Project Setup
1. Create a Supabase project.
2. Enable email authentication.
3. Configure authentication redirect URLs to include `http://localhost:5173` and your production URL.

## 9. Database Migrations and Seed Data
Apply migrations located in `/supabase/migrations/` sequentially using the Supabase CLI or SQL Editor:
1. `20261010000000_init_roles_auth.sql`
2. `20261010000001_memberships.sql`
3. `20261010000002_facilities_and_bookings.sql`
4. `20261010000003_payments_and_equipment.sql`
5. `20261010000004_batches_and_attendance.sql`
6. `20261010000005_tournaments_and_extras.sql`

## 10. First-Admin Provisioning
To securely create the first admin without exposing privileges:
1. Register a standard user via the UI.
2. Send a POST request to `/api/auth/setup-admin`:
   ```bash
   curl -X POST http://localhost:3000/api/auth/setup-admin \
   -H "Content-Type: application/json" \
   -H "x-admin-setup-secret: super_secret_string" \
   -d '{"email":"your-admin-email@example.com"}'
   ```

## 11. Development Commands
```bash
# Start frontend and backend concurrently
npm run dev
```

## 12. Test Commands
```bash
# Verify TypeScript compilation natively
npm run typecheck
```

## 13. Production Build and Startup
```bash
npm run build
npm start
```

## 14. Single-Service Deployment Instructions
The application is designed to be hosted as a single Node.js process. 
1. The Express server (`server/index.ts`) listens on `process.env.PORT`.
2. It statically serves the `dist/` directory built by Vite.
3. It handles all `/api/*` traffic itself.
4. Client-side routes seamlessly fall back to `index.html`.
Deploy to any Node.js compatible platform (Render, Heroku, Railway). Ensure environment variables are set correctly in the hosting provider.

## 15. Role and Permission Model
- **Member:** Can view own data, apply for memberships, book facilities, and register for tournaments.
- **Coach:** Can view assigned batches, take attendance, record performance metrics, and request equipment.
- **Admin:** Full CRUD access over facilities, payments, inventory, audits, and member lifecycles.

## 16. Known Limitations
- Payment processing is currently mocked; a real gateway like Razorpay or Stripe must be integrated before live transactions.
- Automated email triggers (e.g. SMTP expiry reminders) are not active. Notifications are strictly in-app.

## 17. Troubleshooting
- **Database connection errors:** Verify `.env` values and RLS policies.
- **Tailwind issues in build:** Ensure `npm run build` succeeds; Tailwind v4 utilizes `@tailwindcss/postcss`.
