# Buildkinship

A family tree builder. Originally built on Base44; this version runs entirely
on your own **Supabase** project (database + auth + file storage) and
deploys as a static site to **GitHub Pages**.

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In **Settings -> API**, copy the **Project URL** and **anon public key**.
3. Open **SQL Editor -> New query**, paste in the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates
   the `persons` and `relationships` tables, locks them down with Row Level
   Security so each user only sees their own tree, and sets up a `photos`
   storage bucket.

### Enable Google sign-in (optional but recommended)

1. **Authentication -> Providers -> Google** -> enable it, and fill in a
   Google OAuth Client ID/Secret (create one in the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials) -
   set the authorized redirect URI to the callback URL Supabase shows you on
   that page).
2. **Authentication -> URL Configuration** -> set **Site URL** to your future
   GitHub Pages URL (e.g. `https://yourname.github.io/buildkinship/`), and
   add it to **Redirect URLs** too.

### Switch email verification to a 6-digit code (optional)

The sign-up screen expects a 6-digit code rather than a magic link. To match:

1. **Authentication -> Email Templates -> Confirm signup**.
2. Make sure the body includes `{{ .Token }}` (Supabase's default template
   already does — just don't remove it if you customize the template).

If you'd rather use Supabase's default magic-link flow instead, you can
simplify `src/pages/Register.jsx` to skip the OTP step.

## 2. Configure the app locally

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from step 1.

```bash
npm install
npm run dev
```

## 3. Deploy to GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`)
that builds and deploys automatically on every push to `main`.

1. Push this repo to GitHub.
2. In **Settings -> Pages**, set **Source** to "GitHub Actions".
3. In **Settings -> Secrets and variables -> Actions**, add repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BASE_PATH` — only if this is a *project* site
     (`https://<user>.github.io/<repo>/`); set it to `/<repo-name>/`
     (with leading and trailing slashes). Leave it unset for a user/org site
     (`https://<user>.github.io`).
4. Push to `main` — the Actions tab will show the build/deploy run. Once it
   finishes, your app is live at the Pages URL shown in Settings -> Pages.
5. Go back to Supabase's **Authentication -> URL Configuration** and make
   sure the Site URL / Redirect URLs match your real Pages URL exactly.

Client-side routing (login/register/reset-password pages) works on GitHub
Pages via a `404.html` fallback that the workflow generates automatically —
no extra setup needed.

## Architecture notes

- **Data**: `src/api/entities.js` exposes `Person` / `Relationship` with the
  same `list/create/update/delete` shape the UI already expects, backed by
  Supabase's Postgres tables + Row Level Security (see `supabase/schema.sql`).
- **Auth**: `src/lib/AuthContext.jsx` wraps Supabase Auth (email/password +
  Google OAuth, email verification, password reset).
- **File uploads**: `src/api/storage.js` uploads photos to a Supabase Storage
  bucket named `photos`, scoped per-user by folder.
- Everything else (canvas view, hierarchy view, tree logic) is unchanged.

## Local development without Supabase

There's no offline/local-only mode built in — every read/write goes through
Supabase. If you want a fully local (no backend, no login) variant instead,
swap `src/api/entities.js` for an IndexedDB-backed implementation (e.g. using
[Dexie.js](https://dexie.org/)) and remove the auth screens.
