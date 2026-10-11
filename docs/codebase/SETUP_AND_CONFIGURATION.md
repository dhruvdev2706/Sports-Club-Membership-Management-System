# Development and deployment guide

## Prerequisites and configuration

The checked-in GitHub workflow uses Node 20; README requests Node 18+ and npm 9+. Configure only placeholders, never commit actual values:

| Variable | Used by | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | browser/server | Supabase project URL (server currently reads the same name). |
| `VITE_SUPABASE_ANON_KEY` | browser | publishable Supabase anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | privileged service-role credential. |
| `ADMIN_SETUP_SECRET` | setup-admin endpoint | bootstrap secret. |
| `PORT` | Express | listener; defaults to 5000. |
| `NODE_ENV` | Express | production enables static SPA serving. |
| `VITE_BASE_PATH` | Vite/router | path prefix used for Pages deployment. |

`.env.example` only declares the first two variables. `.env` is ignored and was not read for this audit.

## Scripts

| Command | Configured behavior |
| --- | --- |
| `npm run dev` | Runs Vite and nodemon/tsx Express concurrently. |
| `npm run dev:client` / `dev:server` | Starts Vite / watches `server/*.ts` and runs `server/index.ts`. |
| `npm run build` | `tsc -b && vite build`; configured TypeScript project references do **not** include `server/tsconfig.json`. |
| `npm start` | Runs `node dist/server/index.js`; see build mismatch risk. |
| `npm run typecheck` | `tsc --noEmit` against root references. |
| `npm test` | Runs Vitest; only `server/tests/validation.test.ts` is discovered by naming evidence. |
| `npm run lint` | Runs oxlint. |
| `npm run preview` | Serves Vite output, not Express API. |

## Database

Provision Supabase Auth email login and apply every SQL file in `supabase/migrations/` in ascending order using the Supabase CLI or SQL editor. Configure redirects for local and deployed `/auth/update-password`. No Supabase project config, seed file, or migration runner command is committed.

## Deployment evidence

`server/app.ts` describes a Node host: build client, compile server separately, set `NODE_ENV=production`, and serve `dist` with Express. However, `npm run build` does not compile the server. `.github/workflows/deploy.yml` instead publishes a static Vite bundle to GitHub Pages and injects `VITE_BASE_PATH`; it cannot run Express. `vercel.json` rewrites all paths to `index.html`, likewise with no serverless API. Choose and configure a coherent deployment model before relying on `/api/*` actions.
