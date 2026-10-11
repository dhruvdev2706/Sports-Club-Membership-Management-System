# Audit coverage and verification

## Scope

At audit start, `git ls-files` returned **86 tracked files**. Every one is recorded in [FILE_REFERENCE.md](FILE_REFERENCE.md). The `.env` file was intentionally not read. Ignored `node_modules/` and `dist/` were observed but excluded from source-by-source analysis: the former is installed third-party content, and the latter is generated Vite output. There were no relevant untracked source files discovered.

## Inspection checklist

- [x] Root manifests, lockfile, Vite/Tailwind/PostCSS/TypeScript/lint/deployment configuration
- [x] GitHub Actions and static-host configuration
- [x] All `src/` application, asset, style, feature, layout, and UI files
- [x] All `server/` routes, middleware, utilities, test, and server compiler config
- [x] All six migrations and existing `docs/` files
- [x] Public/static assets and redirects
- [x] Path/route/API/schema cross-check against source text
- [x] Secrets excluded from generated documentation
- [x] Application source left unchanged

## Limits

This is a static audit. It did not execute package scripts, connect to Supabase, apply migrations, inspect actual RLS deployment state, make network calls, or verify external redirect settings. Asset contents were classified by format and traced where imports/references establish use; binary imagery was not semantically interpreted. Existing documentation was audited as project content, not treated as authoritative when it conflicted with source.

## Generated outputs

The documentation files in this folder are new audit artifacts and are intentionally not included in the pre-audit tracked-file count. Their content is verified for relative links by the final audit command.
