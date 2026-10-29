# Codebase documentation

This is an evidence-based audit of the Playgrid sports-club portal. The audit covers the 86 Git-tracked files present at review time, plus the ignored `dist/`, `node_modules/`, and local `.env` only as excluded runtime/build material. No application source was changed.

## Start here

- [Project overview](PROJECT_OVERVIEW.md) — purpose, stack, and feature status.
- [Architecture](ARCHITECTURE.md) — bootstrapping, boundaries, request paths, and diagrams.
- [Website and routes](WEBSITE_AND_ROUTES.md) — every registered URL and user journey.
- [Components and modules](COMPONENTS_AND_MODULES.md) — reusable UI and feature modules.
- [Data and database](DATA_AND_DATABASE.md) — migrations, RLS, functions, ERD.
- [API and integrations](API_AND_INTEGRATIONS.md) — actual Express API surface and Supabase usage.
- [Setup and configuration](SETUP_AND_CONFIGURATION.md) — scripts, variables, builds, deployment evidence.
- [File reference](FILE_REFERENCE.md) — complete path-by-path inventory.
- [Technical debt and risks](TECHNICAL_DEBT_AND_RISKS.md) — prioritized, evidence-labelled findings.
- [Repository coverage](REPOSITORY_COVERAGE.md) — audit ledger, exclusions, and limitations.

## Architecture in one paragraph

`src/main.tsx` mounts a React 19 SPA. `App.tsx` supplies React Query, the Supabase-backed auth context, React Router, and notifications. Most views use the browser Supabase client directly; four privileged workflows call the Express application in `server/`, which uses a Supabase service-role client. Database schema, RLS, and PostgreSQL functions are in ordered SQL migrations. This split is important when modifying behavior: a screen may be governed by both client-side route checks and database RLS, while some actions require a separately deployed Express service.

## Onboarding / change workflow

Read the architecture, route, and data documents before changing a feature. Follow the feature’s direct Supabase queries and any corresponding Express route, then check the referenced migration and RLS policy. Review the risk register before deploying: the checked-in GitHub Pages/Vercel configuration does not provide the Express API required by several UI actions.
