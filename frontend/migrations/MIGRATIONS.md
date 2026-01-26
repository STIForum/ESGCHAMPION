# Database Migrations

This folder contains SQL scripts that were applied to the Supabase database.

## Migration Files

The following SQL files were applied to the database (in the root project folder):

| File | Description |
|------|-------------|
| `complete-database-schema.sql` | Full database schema including all tables |
| `add-indicator-extended-fields.sql` | Extended fields for indicator reviews |
| `add-notifications-table.sql` | Notifications table for user alerts |
| `add-panel-extended-fields.sql` | Extended fields for panel submissions |
| `add-user-progress-tracking.sql` | User progress tracking tables |
| `panel-review-schema.sql` | Panel review specific schema |
| `seed-panels-indicators.sql` | Seed data for panels and indicators |
| `fix-accepted-reviews-updated-at.sql` | Fix for updated_at on accepted reviews |
| `fix-indicator-reviews-rls.sql` | RLS policy fix for indicator reviews |

## RLS Policy Fixes

### is_admin() Function

A critical fix was applied to resolve infinite recursion in RLS policies:

```sql
-- Create a SECURITY DEFINER function to check admin status
-- This avoids RLS infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.champions
    WHERE id = auth.uid()
    AND is_admin = true
  )
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
```

This function is used in RLS policies instead of direct table queries:

```sql
-- Example RLS policy using is_admin()
CREATE POLICY "Admins can view all submissions"
ON public.panel_submissions
FOR SELECT
TO authenticated
USING (public.is_admin() OR champion_id = auth.uid());
```

## Supabase Project Details

- **Project Reference**: sqxezltdeebvhgxsgxfj
- **URL**: https://sqxezltdeebvhgxsgxfj.supabase.co
- **Region**: (check Supabase dashboard)

## Applying Migrations

Migrations can be applied via:

1. **Supabase Dashboard**: SQL Editor
2. **Supabase CLI**: `supabase db push`
3. **psql**: Direct PostgreSQL connection

## Schema Overview

### Core Tables

- `champions` - User profiles and admin status
- `panels` - ESG panel definitions
- `indicators` - Sustainability indicators per panel
- `panel_submissions` - User submissions for panel reviews
- `indicator_reviews` - Individual indicator assessments
- `champion_rankings` - Leaderboard scores

### Key Relationships

```
champions (1) ──< (many) panel_submissions
panels (1) ──< (many) indicators
panel_submissions (1) ──< (many) indicator_reviews
indicators (1) ──< (many) indicator_reviews
```

## Notes

- All tables use UUID primary keys
- RLS (Row Level Security) is enabled on all tables
- `created_at` and `updated_at` timestamps are automatic
- Auth uses Supabase Auth (not custom)
