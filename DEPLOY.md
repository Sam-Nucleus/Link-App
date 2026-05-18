# Link Calculator — Secure Deployment Guide

This guide walks you through deploying the Link Calculator to Vercel with Supabase authentication. Once deployed, users access it at a shareable URL and must log in before seeing anything. All proprietary roast data stays server-side and is never exposed to the browser.

---

## What you need before starting

- A **GitHub account** (free) — [github.com](https://github.com)
- Your **Vercel account** (already set up)
- Your **Supabase account** (already set up)
- The `secure-app` folder from this project

---

## Step 1 — Get your Supabase credentials

You need three values from Supabase. Go to [supabase.com](https://supabase.com) → your project → **Settings → API**.

Copy and save these somewhere temporarily:

| Value | Where to find it | Used for |
|-------|-----------------|----------|
| **Project URL** | "Project URL" field | `SUPABASE_URL` |
| **anon / public key** | Under "Project API keys" | Goes in `public/index.html` |
| **service_role key** | Under "Project API keys" (click to reveal) | `SUPABASE_SERVICE_ROLE_KEY` — keep secret |

---

## Step 2 — Update the frontend with your Supabase URL and anon key

Open `public/index.html` in any text editor. Near the top of the `<script>` section (around line 781) you'll find:

```js
const SUPABASE_URL  = '__SUPABASE_URL__';
const SUPABASE_ANON = '__SUPABASE_ANON_KEY__';
```

Replace both placeholders with your real values:

```js
const SUPABASE_URL  = 'https://xxxxxxxxxxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

Save the file. The anon key is safe to have in the frontend — it's public by design and only grants limited access (just enough to authenticate). The service_role key is never in the frontend.

---

## Step 3 — Push the secure-app folder to GitHub

1. Go to [github.com/new](https://github.com/new) and create a new **private** repository (e.g. `link-calculator`). Keep it private.

2. Open Terminal and run these commands (replace the URL with your repo URL):

```bash
cd "/Users/samcorra/Documents/Claude/Projects/link app/secure-app"
git init
git add .
git commit -m "Initial secure deployment"
git remote add origin https://github.com/YOUR_USERNAME/link-calculator.git
git push -u origin main
```

That's it — your code is now on GitHub.

---

## Step 4 — Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"** and select the `link-calculator` repo you just created
3. On the configuration screen:
   - **Framework Preset**: leave as "Other"
   - **Root Directory**: leave as `/` (the root of the repo)
   - Don't change anything else
4. Click **Deploy** — the first deploy will fail because the environment variables aren't set yet. That's expected.

---

## Step 5 — Set the environment variables in Vercel

1. In your Vercel project, go to **Settings → Environment Variables**
2. Add these three variables (set all three to apply to Production, Preview, and Development):

| Name | Value |
|------|-------|
| `SUPABASE_URL` | Your Supabase Project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service_role key (the long secret one) |
| `ALLOWED_ORIGIN` | Your Vercel deployment URL (e.g. `https://link-calculator.vercel.app`) |

3. After adding all three, go to **Deployments → your latest deployment → Redeploy**. This time it will succeed.

---

## Step 6 — Note your live URL

After the redeploy completes, Vercel will show you a URL like:

```
https://link-calculator.vercel.app
```

This is the shareable URL. You can also set up a custom domain (e.g. `link.nucleus.coffee`) under **Settings → Domains** in Vercel.

Update your `ALLOWED_ORIGIN` environment variable to match whatever final URL you use, then redeploy once more.

---

## Step 7 — Add users in Supabase

Users must be created manually in Supabase — the app has no self-signup.

1. Go to your Supabase project → **Authentication → Users**
2. Click **"Invite user"** and enter their email address
3. Supabase sends them a magic link to set their password
4. Once they click the link and set a password, they can log in at your Vercel URL

To remove access, go to Authentication → Users, find the user, and delete them.

---

## Step 8 — Test it

1. Open your Vercel URL in a browser
2. You should see the login screen
3. Log in with one of the users you created
4. Verify the calculator works — roast plan selection, results, plan notes

If you see errors, open the browser Console (F12 → Console) and check for messages. Common issues:

- **401 Unauthorized** — token issue, try logging out and back in
- **CORS error** — `ALLOWED_ORIGIN` doesn't match the URL you're accessing from
- **500 error** — check Vercel → Functions logs for the specific API error

---

## Security summary

| What's protected | How |
|-----------------|-----|
| Power curve data | Only ever exists in `api/lib/data.js` — never sent to browser |
| Plan notes | Fetched per-request via authenticated API only |
| Calculation logic | Runs entirely server-side; browser only receives the result |
| API access | Every endpoint requires a valid Supabase JWT |
| User sessions | Token stored in sessionStorage (cleared when tab closes) |

Even if someone opens DevTools and inspects every network request, they will only see computed results — never the underlying formulas or data.

---

## Updating the calculator in future

When you want to push changes (e.g. updated roast data or UI tweaks):

1. Make your changes to the files in `secure-app/`
2. Run `git add . && git commit -m "describe your change" && git push`
3. Vercel automatically redeploys within ~30 seconds

---

## File structure reference

```
secure-app/
├── api/
│   ├── lib/
│   │   ├── auth.js          ← JWT verification (uses Supabase)
│   │   ├── calculate.js     ← All calculation logic (server only)
│   │   └── data.js          ← All proprietary data (server only)
│   ├── calculate.js         ← POST /api/calculate
│   ├── calculate-manual.js  ← POST /api/calculate-manual
│   ├── init-data.js         ← GET /api/init-data
│   └── plan-info.js         ← GET /api/plan-info
├── public/
│   └── index.html           ← The entire frontend (no proprietary data)
├── .env.example             ← Environment variable reference
├── package.json
└── vercel.json              ← Vercel build configuration
```
