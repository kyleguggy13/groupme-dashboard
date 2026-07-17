# GroupMe DataBoard

An invite-only, mobile-first recap of a GroupMe history. The application is a Next.js PWA backed by Supabase Auth and Postgres. Official GroupMe exports are parsed in a browser worker; raw files, message text, attachments, and liker identities are never uploaded.

## Local preview

```powershell
npm install
npm run dev
```

The local `.env.local` enables fictional demo data so every screen can be reviewed without a database or private export. Open `http://localhost:3000`. New clones can copy `.env.example` and set `NEXT_PUBLIC_DEMO_MODE=true` for the same preview.

## Production setup

1. Create a Supabase project and apply `supabase/migrations/202607170001_initial_schema.sql` with the Supabase CLI or SQL editor.
2. Configure Google OAuth in Google Cloud and Supabase. Add the production origin and `/auth/callback` URL to the appropriate allowlists.
3. Copy `.env.example` into the deployment environment, set `NEXT_PUBLIC_DEMO_MODE=false`, and provide the Supabase URL, publishable key, service-role key, site URL, and `INITIAL_ADMIN_EMAIL`.
4. Deploy the Next.js project to Vercel, visit `/setup` while signed into the configured Google account, and create the first group.
5. Upload an official GroupMe ZIP export or `message.json`, review member exclusions, and publish the first sanitized snapshot.

The service-role key is used only by the one-time server-side setup endpoint. It must never use the `NEXT_PUBLIC_` prefix.

## Commands

- `npm run dev` — local development
- `npm run lint` — ESLint and Next.js checks
- `npm test` — parser, sanitization, and period unit tests
- `npm run build` — production build
- `npm run test:e2e` — Playwright mobile and desktop smoke tests (install Playwright browsers first)

## Data and privacy

The browser sends only message IDs, member IDs, timestamps, aggregate favorite counts, aggregate reaction counts, and allowlisted group events. The production build excludes local CSV/JSON exports through `.gitignore` and `.vercelignore`. Authenticated dashboard data is network-only and is not cached by the service worker.
