# Quick Setup Guide

Get the ESG Champions Platform running in 5 minutes.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- A [Supabase](https://supabase.com) account (free tier works)

## Step 1: Clone & Install

```bash
git clone https://github.com/yourusername/esg-champions.git
cd esg-champions
npm install
```

## Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (~2 minutes)
3. Go to **Settings → API** and copy:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon public key

## Step 3: Configure the App

Edit `supabase-config.js`:

```javascript
const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';
```

## Step 4: Set Up Database

1. In Supabase, go to **SQL Editor**
2. Run these SQL files in order (copy/paste the contents):
   - `complete-database-schema.sql`
   - `seed-panels-indicators.sql`

## Step 5: Configure Auth URLs

In Supabase Dashboard:
1. Go to **Authentication → URL Configuration**
2. Set **Site URL**: `http://localhost:8000`
3. Add to **Redirect URLs**: `http://localhost:8000/**`

## Step 6: Run the App

```bash
npm run dev
```

Open http://localhost:8000 in your browser.

## Step 7: Create Admin Account

1. Register a new account on the platform
2. In Supabase SQL Editor, run:

```sql
UPDATE champions SET is_admin = true WHERE email = 'your-email@example.com';
```

3. Log out and back in to see the Admin link

## You're Done! 🎉

The platform is now running with:
- 14 ESG Panels
- 50+ Indicators
- Full authentication
- Admin panel access

## Next Steps

- See `SETUP_GUIDE.md` for detailed configuration
- Set up LinkedIn OAuth for social login
- Configure email templates in Supabase
- Deploy to Vercel or Netlify

## Quick Deployment to Vercel

```bash
npm i -g vercel
vercel
```

Set these environment variables in Vercel dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Then run:
```bash
vercel --prod
```

Your app is now live!

