# Garmin Dashboard

Private, mobile-first Garmin fitness dashboard.

## Current Setup

- Frontend: Vite + React
- Backend: Supabase project `garmin-dashboard`
- Supabase project ID: `oiklntwrimmanxpsjdcc`
- Supabase URL: `https://oiklntwrimmanxpsjdcc.supabase.co`
- Hosting target: a separate Vercel project named `garmin-dashboard`

## Local Development

Create `.env.local` with:

```bash
VITE_SUPABASE_URL=https://oiklntwrimmanxpsjdcc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

Then run:

```bash
pnpm install
pnpm run dev
```

## Deploy Notes

This app should be linked to its own GitHub repository and its own Vercel project.
Do not link it to an existing Vercel project.

Use these Vercel environment variables:

```bash
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```
