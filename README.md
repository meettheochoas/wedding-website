# Jessica & Erick — Wedding Website

Real, deployable version of the site: same design, video hero, RSVP, and admin
dashboard as before — but now backed by an actual database (Supabase) and
real email notifications (Resend) instead of a chat-artifact sandbox.

## What's inside
- `public/index.html` — the whole site (design, RSVP form, admin dashboard UI)
- `public/images/`, `public/videos/` — your real photos and hero video
- `app/api/rsvp/route.ts` — saves RSVPs to Supabase + emails you on every submission
- `app/api/admin/route.ts` — password-protected endpoint the Admin dashboard reads from
- `supabase/schema.sql` — the one database table this needs
- `netlify.toml` — tells Netlify how to build/run this as a Next.js app

---

## 1. Create a Supabase project (the database)

1. Go to https://supabase.com → sign up (free tier is plenty for this) → **New Project**.
2. Once it's created, go to **SQL Editor → New Query**, paste in the contents of
   `supabase/schema.sql`, and click **Run**. This creates the `rsvps` table.
3. Go to **Project Settings → API**. You'll need two values from this page in step 4:
   - **Project URL**
   - **service_role key** (NOT the "anon" key — the service_role one, under "Project API keys")

## 2. Create a Resend account (the email sender)

1. Go to https://resend.com → sign up free.
2. Go to **API Keys → Create API Key**. Copy it — you'll need it in step 4.
3. The code is set up to send from `onboarding@resend.dev`, Resend's shared testing
   address, which works immediately with no setup. When you're ready for a more
   polished "from" address (e.g. `rsvp@meettheochoas.com`), verify a domain under
   **Resend → Domains** and update the `from` field in `app/api/rsvp/route.ts`.

## 3. Deploy to Netlify (the hosting)

1. Go to https://app.netlify.com/signup → sign up free (GitHub sign-in is easiest).
2. Easiest path: push this folder to a new GitHub repository, then in Netlify click
   **Add new site → Import an existing project**, connect GitHub, and pick that repo.
   - Netlify will auto-detect the `netlify.toml` in this project and configure the
     build correctly (it installs the official `@netlify/plugin-nextjs` plugin
     automatically — no manual setup needed).
   - Alternative without GitHub: install the Netlify CLI (`npm i -g netlify-cli`),
     run `netlify deploy` inside this folder, and follow the prompts.
3. Before (or right after) the first deploy, go to **Site configuration →
   Environment variables** and add all five values:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase step 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Supabase step 1 |
   | `RESEND_API_KEY` | from Resend step 2 |
   | `NOTIFY_EMAIL` | `meettheochoas@gmail.com` |
   | `ADMIN_PASSWORD` | pick your own password for the Admin dashboard |

4. Trigger a redeploy after saving env vars (**Deploys → Trigger deploy → Deploy site**).

Your site is now live at the `*.netlify.app` URL Netlify gives you.

## 4. Connect your real domain

Since you already own a domain:

1. In Netlify, go to **Site configuration → Domain management → Add a domain**.
2. Enter your domain (e.g. `meettheochoas.com`) and follow the prompts.
3. Netlify will show you DNS records to add. You have two options:
   - **Easiest:** point your domain's nameservers to Netlify DNS (Netlify walks
     you through this and manages everything automatically after).
   - **Or:** keep your current DNS provider and just add the specific A/CNAME
     records Netlify shows you.
4. DNS changes can take anywhere from a few minutes to a few hours to fully
   propagate. Netlify auto-provisions a free HTTPS certificate once it detects
   the domain is pointed correctly — no extra steps needed for that.

## 5. Test it

1. Open your live URL (domain or `*.netlify.app`), click through the envelope,
   and submit a test RSVP using any name from the guest list.
2. Check meettheochoas@gmail.com for the notification email (check spam the
   first time, since `resend.dev` is a shared sending address).
3. Click **Admin** at the bottom of the page, enter the `ADMIN_PASSWORD` you
   set, and confirm the test RSVP shows up.

## 6. Send it to guests

Once it's live, sharing is just sharing a link — text it, WhatsApp it, email
it, or post it. No file to send, no app to install: guests tap the link,
it opens in their phone's browser, and they see the envelope exactly like
you've been testing it.

## Local development (optional)

```
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```
Then open http://localhost:3000

## Updating the guest list later

The guest list lives directly inside `public/index.html` as a JS array called
`GUESTS` near the bottom of the file. Send me an updated list anytime and I'll
regenerate this file, or edit the array directly (each guest needs `id`,
`first`, `last`, `display`).
