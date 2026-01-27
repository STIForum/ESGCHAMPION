# ESG Champions Platform - Complete Setup Guide

This guide covers the full setup and configuration of the ESG Champions Platform.

## Table of Contents

1. [Requirements](#requirements)
2. [Initial Setup](#initial-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Database Setup](#database-setup)
5. [Authentication Setup](#authentication-setup)
6. [LinkedIn OAuth Setup](#linkedin-oauth-setup)
7. [Local Development](#local-development)
8. [Production Deployment](#production-deployment)
9. [Admin Configuration](#admin-configuration)
10. [Troubleshooting](#troubleshooting)

---

## Requirements

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher
- **Supabase Account**: Free tier is sufficient for development
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

Optional:
- **GitHub Account**: For version control and deployment
- **LinkedIn Developer Account**: For OAuth integration
- **Vercel/Netlify Account**: For production hosting

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/esg-champions.git
cd esg-champions
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Project Structure

```
esg-champions/
├── HTML Pages          # User-facing pages
├── JavaScript Files    # Application logic
├── CSS                 # Styling
├── SQL Scripts         # Database setup
└── Documentation       # Setup guides
```

---

## Supabase Configuration

### 1. Create a Supabase Project

1. Visit [supabase.com](https://supabase.com)
2. Click **Start your project**
3. Sign in with GitHub
4. Click **New Project**
5. Choose organization, name your project, set a strong database password
6. Select a region close to your users
7. Click **Create new project**
8. Wait for project initialization (~2 minutes)

### 2. Get API Credentials

1. Go to **Settings → API**
2. Copy:
   - **Project URL** (e.g., `https://abcd1234.supabase.co`)
   - **anon public** key (safe for client-side)

### 3. Update Configuration

Edit `supabase-config.js`:

```javascript
const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';
```

⚠️ **Never commit your actual keys to public repositories!**

---

## Database Setup

### 1. Access SQL Editor

In Supabase Dashboard, click **SQL Editor** in the left sidebar.

### 2. Run Schema Scripts

Execute these scripts in order:

#### Script 1: Core Schema
- File: `complete-database-schema.sql`
- Creates: champions, panels, indicators, reviews, votes, comments, admin_actions, invitations tables
- Sets up: Row Level Security, triggers, functions

#### Script 2: Notifications
- File: `add-notifications-table.sql`
- Creates: notifications table and related functions
- Sets up: Auto-notification triggers

#### Script 3: Seed Data
- File: `seed-panels-indicators.sql`
- Creates: 14 ESG panels and 50+ indicators

#### Script 4: Progress Tracking (Optional)
- File: `add-user-progress-tracking.sql`
- Adds: Activity tracking and resume functionality

#### Script 5: Bug Fixes (If Needed)
- File: `fix-accepted-reviews-updated-at.sql`
- Fixes: Missing updated_at column issue

### 3. Verify Setup

Run this query to verify:

```sql
SELECT 
    (SELECT COUNT(*) FROM panels) as panels,
    (SELECT COUNT(*) FROM indicators) as indicators;
```

Expected: 14 panels, ~50 indicators

---

## Authentication Setup

### 1. Configure Site URLs

In Supabase Dashboard:
1. Go to **Authentication → URL Configuration**
2. Set:
   - **Site URL**: `http://localhost:8000` (development)
   - **Redirect URLs**: Add `http://localhost:8000/**`

### 2. Email Templates (Optional)

Customize email templates in **Authentication → Email Templates**:
- Confirmation email
- Password reset email
- Magic link email

### 3. SMTP Settings (Production)

For production, configure custom SMTP:
1. Go to **Settings → Auth**
2. Enable **Custom SMTP**
3. Enter your SMTP credentials

---

## LinkedIn OAuth Setup

### 1. Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click **Create App**
3. Fill in:
   - App name: "ESG Champions"
   - LinkedIn Page: (create one if needed)
   - Privacy policy URL
   - App logo
4. Click **Create app**

### 2. Configure OAuth

1. In your LinkedIn app, go to **Auth** tab
2. Under **OAuth 2.0 settings**, add redirect URL:
   ```
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
   ```
3. Copy **Client ID** and **Client Secret**

### 3. Enable in Supabase

1. In Supabase, go to **Authentication → Providers**
2. Find **LinkedIn (OIDC)** and enable it
3. Enter:
   - Client ID (from LinkedIn)
   - Client Secret (from LinkedIn)
4. Save

---

## Local Development

### Option 1: npm (Recommended)

```bash
npm run dev
```

Opens at http://localhost:8000

### Option 2: Python

```bash
python -m http.server 8000
```

### Option 3: VS Code Live Server

Install the Live Server extension and click "Go Live"

### Hot Reloading

The static server doesn't include hot reload. Refresh browser manually after changes.

---

## Production Deployment

### Vercel (Recommended)

#### 1. Install Vercel CLI

```bash
npm i -g vercel
```

#### 2. Deploy

```bash
vercel
```

Follow the prompts to link your project.

#### 3. Set Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:
- `SUPABASE_URL`: Your Supabase URL
- `SUPABASE_ANON_KEY`: Your anon key

#### 4. Production Deploy

```bash
vercel --prod
```

#### 5. Update Supabase URLs

Add your production URL to Supabase:
1. **Authentication → URL Configuration**
2. Update Site URL to production domain
3. Add `https://your-domain.com/**` to Redirect URLs

### Netlify

#### 1. Build Settings

- Build command: `node build.js`
- Publish directory: `public`

#### 2. Environment Variables

Add in Netlify Dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### GitHub Pages

Works for static hosting but requires careful configuration of Supabase URLs.

---

## Admin Configuration

### 1. Grant Admin Privileges

After registering an account, run in Supabase SQL Editor:

```sql
UPDATE champions
SET is_admin = true
WHERE email = 'your-email@example.com';
```

### 2. Admin Features

Admins can:
- Access the Admin Panel (`/admin-review.html`)
- Approve/reject reviews
- Manage panels and indicators
- View all champions
- Grant/revoke admin privileges
- Export data

### 3. Multiple Admins

Grant admin to multiple users:

```sql
UPDATE champions
SET is_admin = true
WHERE email IN ('admin1@example.com', 'admin2@example.com');
```

---

## Troubleshooting

### "Failed to fetch" Errors

1. Check `supabase-config.js` has correct URL and key
2. Verify Supabase project is active
3. Check browser console for details
4. Ensure CORS is properly configured

### "RLS policy violation"

1. Ensure all SQL scripts were run
2. Check user is authenticated
3. Verify RLS policies in Supabase

### "Column does not exist"

1. Run SQL scripts in correct order
2. Apply fix scripts if needed

### Admin Button Not Showing

1. Confirm `is_admin = true` in database
2. Log out and back in
3. Clear browser cache

### Empty Panels/Indicators

1. Run `seed-panels-indicators.sql`
2. Verify with: `SELECT COUNT(*) FROM panels;`

### OAuth Not Working

1. Check redirect URL matches exactly
2. Verify provider is enabled in Supabase
3. Check `linkedin-callback.html` is accessible
4. Confirm LinkedIn app is approved

### Emails Not Sending

1. Check Supabase email settings
2. Verify SMTP configuration (production)
3. Check spam folder

---

## Security Checklist

Before going to production:

- [ ] Use environment variables for Supabase keys
- [ ] Never expose service_role key
- [ ] Enable RLS on all tables
- [ ] Configure proper redirect URLs
- [ ] Set up HTTPS
- [ ] Review CORS settings
- [ ] Enable email confirmation
- [ ] Set strong database password
- [ ] Regular backups enabled

---

## Support

- **Documentation**: This guide
- **Quick Start**: See `QUICK_SETUP.md`
- **Issues**: GitHub Issues
- **Email**: support@stif.org

---

© 2024 STIF - Sustainability Technology and Innovation Forum

