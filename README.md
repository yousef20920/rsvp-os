# RSVP OS

Ultra-premium wedding RSVP single-page app built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, Lucide React, and Supabase.

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your Supabase URL and public anon key to `.env.local`. The app writes
directly to Supabase from the browser, with RLS allowing anonymous inserts and
blocking public reads.

Place the real invitation image at:

```text
public/invitation.jpg
```

## Supabase Setup

Run the SQL in `docs/supabase-rsvps.sql` inside the Supabase SQL Editor. It creates the `rsvps` table, enables RLS, allows anonymous public inserts, and blocks anonymous reads.

The private admin view is at:

```text
/admin/rsvp-vault-7f4c9a
```

This URL is intentionally not linked from the public RSVP page, but the real protection
is Supabase Auth plus the RLS policy in `docs/supabase-rsvps.sql`. The current allowed
admin email in that policy is `yousef.hadi.cs@gmail.com`; change it before running the SQL
if you want a different admin email.

## Security Model

This is a frontend-only app, so the Supabase anon key is intentionally public.
Security is enforced by Supabase Row Level Security and Postgres constraints:

- Anonymous clients can only insert RSVP rows.
- Anonymous clients cannot read, update, delete, truncate, or alter RSVP data.
- Authenticated clients can only read RSVPs when their Supabase Auth email matches the admin email in the RLS policy.
- Anonymous inserts are limited to the expected RSVP columns only.
- The database enforces name lengths, maximum party size, gender-labelled guest names, and matching guest counts.
- Duplicate primary RSVP submissions are blocked by normalized first + last name.
- Duplicate guest rows inside one RSVP are blocked.

For abuse prevention beyond this, add Supabase-side protections such as CAPTCHA,
rate limiting, or an Edge Function. A purely static frontend cannot hide a public
insert endpoint from the internet.

## Timeline Edits

Event entries live in `src/components/rsvp-experience.tsx` inside the `timelineEvents` array. Placeholder entries are commented directly below the Reception event for easy expansion.
