# ESG Champions Platform - Changelog

## [2026-02-21] - Session Updates

### CSV Import Improvements
- **Enhanced error handling for CSV imports**: Import errors now display detailed error messages including Supabase error details (message, code, hint)
- **Added field value normalization**: CSV parsing now automatically normalizes constrained field values to match database requirements:
  - `primary_framework`: GRI, ESRS, SASB, SME Hub, Other
  - `impact_level`: High, Medium, Foundational
  - `difficulty_level`: Easy, Moderate, Complex
  - `esg_class`: Environment, Social, Governance
  - `response_type`: Multiple Choice, Yes-No, Short Text, Long Text
- **Improved debug logging**: Console now shows exact data being sent and detailed error information for troubleshooting

### Database Schema Fixes
- **Fixed indicators RLS policies** ([fix-indicators-admin-rls.sql](sql-migrations/fix-indicators-admin-rls.sql))
  - Split combined "Admins can manage indicators" policy into separate policies
  - Added proper `WITH CHECK` clause for INSERT operations (required by PostgreSQL)
  - Created individual policies: SELECT, INSERT, UPDATE, DELETE for admins
  - Maintained public SELECT policy for active indicators

- **Fixed primary_framework constraint** ([fix-primary-framework-constraint.sql](sql-migrations/fix-primary-framework-constraint.sql))
  - Updated existing data with lowercase framework values (gri → GRI, esrs → ESRS)
  - Removed invalid `ifrs` values (set to NULL)
  - Re-established constraint with proper uppercase values

### Index Page Redesign
- Redesigned hero section with professional gradient styling
- Removed hero badge and CTA buttons for cleaner appearance
- Reduced hero height/padding for more compact layout
- Added about section with platform description
- Removed dashboard preview mockups from platform cards
- Changed footer "Schedule an appointment" to "Contact Us"

### Champion Panels Page
- Converted framework filter buttons to dropdown select
- Kept "All Frameworks" as a standalone button
- Improved mobile responsiveness

### Rejected Indicators Resubmit Flow
- Made rejected indicator reviews clickable for resubmission
- Added URL parameter handling (`?panel=X&indicator=Y&resubmit=true`)
- Fixed missing `indicator_id` and `panel_id` in mapped reviews
- Updated `getUserPanelReviewSubmissions` to check both `champion_id` and `reviewer_user_id`

### Codebase Cleanup
- Deleted unused `membership-modal.js` file
- Moved `add-new-assessment-fields.sql` to sql-migrations folder

### Files Modified
- `admin-review.js` - CSV import error handling and logging
- `supabase-service.js` - createIndicator with detailed error logging
- `champion-panels.html` - Framework dropdown UI
- `champion-panels.js` - Framework filter dropdown logic
- `champion-indicators.js` - Resubmit mode handling
- `index.html` - Hero and about section redesign

### SQL Migrations Added
- `sql-migrations/fix-indicators-admin-rls.sql` - RLS policy fixes
- `sql-migrations/fix-primary-framework-constraint.sql` - Constraint fixes

---

## How to Apply Database Migrations

Run these SQL files in your Supabase SQL Editor in order:

1. `fix-indicators-admin-rls.sql` - Fixes admin INSERT permissions
2. `fix-primary-framework-constraint.sql` - Fixes framework value constraints

After running migrations, also execute:
```sql
-- Update existing lowercase framework values
UPDATE indicators SET primary_framework = 'GRI' WHERE primary_framework = 'gri';
UPDATE indicators SET primary_framework = 'ESRS' WHERE primary_framework = 'esrs';
UPDATE indicators SET primary_framework = NULL WHERE primary_framework = 'ifrs';
```
