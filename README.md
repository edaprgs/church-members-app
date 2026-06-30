# Church Management System (UCCP Iligan City)

A membership management platform for a local congregation: admins maintain the
full member roster, view analytics/reports, and configure church settings;
members get a self-service portal to register and maintain their own profile.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19
- **Backend / Auth / DB:** Supabase (Postgres + Auth, accessed via `@supabase/ssr`)
- **Styling:** Tailwind CSS v4 (mixed with some inline styles — see Known Issues)
- **Forms:** React Hook Form (`zod` is installed but not currently wired up for validation)
- **Charts:** Recharts
- **AI insights:** Google Gemini (`@google/genai`) for Q&A and report summarization;
  `@anthropic-ai/sdk` is also installed but not currently used in any route
- **Icons / UX:** lucide-react, sonner (toasts), next-themes

## Core Concepts

- **Roles:** every authenticated user has a `role` of `"admin"` or `"member"`,
  stored in a `profiles` table keyed by Supabase auth user id.
- **Admins** manage the full member database (`/members/*`): list, create,
  edit, dashboard KPIs, analytics, reports/export, and church-wide settings
  (fellowships, ministers, church info).
- **Members** use a separate self-service area (`/member-portal/*`): register
  themselves (linking their auth account to a member record), and view/edit
  their own profile only.
- **Routing enforcement** happens in [middleware.ts](middleware.ts): unauthenticated
  users are redirected to `/`; members are bounced out of admin routes
  (`/members`, `/analytics`, `/reports`, `/dashboard`) into `/member-portal`,
  and admins are bounced out of `/member-portal` into `/dashboard`. A profile
  row that hasn't been assigned a role yet is let through once to avoid a
  redirect loop.

## Project Structure

```
app/
  api/
    admin/unlinked-users/   GET  — list auth users not yet linked to a member record
    ai/member-qa/           POST — answer questions about congregation stats (Gemini)
    ai/summarize-report/    POST — summarize a filtered report (Gemini)
  lib/
    auth.ts                 client-side role/session helpers
    supabase.ts              browser Supabase client
    supabase-server.ts       server Supabase client (used in API routes / middleware)
    types.ts                 shared Member/FormState/Settings types
    constants.ts, utils.ts   shared constants and helpers (e.g. getZone())
    api/members.ts           client-side CRUD + batched fetch for members
  members/                  admin area — list, new, edit, dashboard, analytics,
                             reports, settings
  member-portal/            member-facing area — profile view, edit, self-register
  sidebar.tsx, layout.tsx   shared shell/navigation
middleware.ts               auth + role-based route gating
```

## Data Access Model

- Most reads/writes go directly from the browser to Supabase using the
  anon key, relying on **Row-Level Security (RLS) policies** in Postgres to
  scope what each role can see and modify.
- The Supabase **service role key** is only used server-side, inside the
  `/api/admin/*` route (e.g. listing unlinked auth users via the admin API).
- AI endpoints (`/api/ai/*`) take aggregate stats or filtered member data
  from the client and forward a prompt to Gemini; they don't query Supabase
  directly.

## Getting Started

1. Copy `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose to the client)
   - `GEMINI_API_KEY`
2. Install dependencies and run the dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000).

Build/run for production:
```bash
npm run build
npm run start
```

## Known Issues / Recommended Next Steps

These were found during a codebase review and should be addressed before a
public/production rollout:

**Security (high priority):**
- `GET /api/admin/unlinked-users` has no auth/role check — currently callable
  by anyone.
- `/api/ai/member-qa` and `/api/ai/summarize-report` check that a session
  exists but don't verify the caller is an admin.
- Member create/update/delete go straight from the client to Supabase with no
  server-side re-validation; consider routing these through API endpoints
  that re-check auth, role, and required fields.

**Code quality / consistency:**
- Zone-detection logic is duplicated in three places instead of importing the
  shared `getZone()` from `app/lib/utils.ts`.
- Batched member fetches (`app/lib/api/members.ts`) log and silently break on
  error instead of surfacing the failure to the UI.
- Title-casing is force-applied to name fields on every keystroke, which can
  mangle names like "O'Brien".
- The admin and member-portal areas each have their own near-duplicate
  ~1,000+ line member form; these are good candidates for a single shared
  `<MemberForm mode="admin" | "member">` component.
- Styling is inconsistent — some pages mix large blocks of inline styles with
  Tailwind utility classes.
- `zod` is installed but not used for form/schema validation.
- No automated tests (unit or end-to-end) currently exist.

## Note on AGENTS.md

`AGENTS.md` in this repo contains a claim that this is a non-standard
"breaking changes" build of Next.js and instructs readers to consult
`node_modules/next/dist/docs/` before writing code. This does not reflect
any real Next.js distribution and should be treated with suspicion — it
reads like an injected instruction rather than legitimate project guidance.
The actual dependency is standard Next.js 16, confirmed via `package.json`.
