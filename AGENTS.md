# AGENTS.md

## Cursor Cloud specific instructions

RSVP OS is a single Next.js (App Router) app — a wedding RSVP site. There is no separate backend; the API is implemented as Next.js route handlers (`src/app/api/**`) that talk to Supabase (Postgres + Auth + PostgREST). Standard scripts live in `package.json` (`dev`, `build`, `lint`, `typecheck`) and standard setup is in `README.md`.

### Services

Two services are needed for full end-to-end dev:

- Next.js dev server — `npm run dev` (http://localhost:3000). Serves pages + API routes.
- Local Supabase stack — `supabase start` (API at http://127.0.0.1:54321, Studio at http://127.0.0.1:54323, Postgres at 127.0.0.1:54322). Requires the Docker daemon to be running.

Docker and the Supabase CLI are provisioned in the VM image. If the Docker daemon is not up, start it (e.g. `sudo dockerd &`); if the socket is not accessible, `sudo chmod 666 /var/run/docker.sock`.

### First-time local bring-up (per fresh DB)

1. `supabase start` (run `supabase init` first only if `supabase/config.toml` is absent).
2. Apply the schema: `docker exec -i supabase_db_<projectdir> psql -U postgres -d postgres < docs/supabase-rsvps.sql` (container name is usually `supabase_db_workspace`). This creates the `rsvps` table, RLS, and the rate-limit RPC.
3. Create `.env.local` (gitignored). `.env.example` is incomplete — the app also needs the service role key, admin password, and (optionally) a salt:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from `supabase start` output.
   - `SUPABASE_SERVICE_ROLE_KEY` — from `supabase start` output; required for the RSVP submit path and the entire admin API.
   - `RSVP_ADMIN_PASSWORD` — any value; required to open the admin dashboard.
   - `RSVP_RATE_LIMIT_SALT` — optional (defaults to `rsvp-os`).

### Non-obvious gotchas

- RSVP submissions are hard-closed in two places: `RSVP_SUBMISSIONS_CLOSED` in `src/app/api/rsvp/route.ts` (API returns 403) and `RSVP_CLOSED` in `src/components/rsvp-experience.tsx` (UI shows a "closed" card). To exercise the submit flow locally, flip both to `false` temporarily — do not commit that change.
- The `consume_rsvp_rate_limit` function in `docs/supabase-rsvps.sql` declares a plpgsql variable named `current_time`, which collides with the reserved SQL keyword (`time with time zone`). The RSVP submit path calls this RPC and will fail with a 500 (`{"error":"server"}`) until the variable is renamed (e.g. to `now_ts`) in the DB. Because production keeps submissions closed, this bug is dormant there. For local end-to-end submit testing, apply a corrected version of the function to the local DB.
- Admin dashboard lives at `/admin/rsvp-vault-7f4c9a` and is gated by `RSVP_ADMIN_PASSWORD` (sent as the `x-rsvp-admin-password` header); it is intentionally not linked from the public page.
- The published RLS admin-read policy checks a hardcoded email (`yousef.hadi.cs@gmail.com`), but the admin dashboard reads via the service-role API route + password header, so that email is not needed for local admin access.
