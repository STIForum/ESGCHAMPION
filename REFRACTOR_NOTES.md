# ESG Champions Platform - Refactor Notes

## Overview

This document describes the refactored project structure and provides guidance for developers.

---

## New Project Structure

```
/src
  /core                         # Core configuration and utilities
    env.js                      # Environment variables (single source of truth)
    config.js                   # App configuration constants
    router-helpers.js           # URL/query parameter utilities
    
  /lib                          # Library wrappers
    /supabase
      client.js                 # SINGLE place where createClient() is called
      tables.js                 # Table/column name constants
      errors.js                 # Error normalization utilities
      
  /services                     # Business logic services (TODO: migrate)
    auth.service.js             # Authentication operations
    panels.service.js           # Panel operations
    indicators.service.js       # Indicator operations
    reviews.service.js          # Review operations
    rankings.service.js         # Leaderboard operations
    admin.service.js            # Admin operations
    
  /ui                           # Reusable UI components
    layout.js                   # Header/sidebar/footer injection
    toast.js                    # Toast notifications
    loading.js                  # Loading states and error displays
    modal.js                    # Modal dialogs
    form.js                     # Form handling utilities
    
  /utils                        # Utility functions
    dom.js                      # DOM manipulation helpers
    format.js                   # Date/number/string formatting
    validate.js                 # Validation functions
    storage.js                  # localStorage/sessionStorage wrapper

/pages (root)                   # Page files (unchanged locations)
  *.html                        # HTML pages
  *.js                          # Page controllers
```

---

## Key Files and Their Purposes

### Configuration

| File | Purpose |
|------|---------|
| `supabase-config.js` | Supabase URL and anon key (loaded first) |
| `src/core/env.js` | Reads and validates environment variables |
| `src/core/config.js` | App-wide constants (routes, timing, etc.) |

### Supabase Client

The Supabase client is created in **ONE place only**:

```
src/lib/supabase/client.js
```

All other modules should use:
- `window.getSupabaseClient()` - Get the client instance
- `window.fromTable(tableName)` - Get a query builder with schema prefix

**Never call `supabase.createClient()` anywhere else!**

### Services

Current service files (will be migrated):
- `supabase-service.js` - Core SupabaseService class
- `champion-auth-supabase.js` - ChampionAuth class
- `champion-db-supabase.js` - ChampionDB class
- `ranking-supabase.js` - RankingPage class
- `admin-service.js` - AdminService class

### UI Components

| File | Exports | Usage |
|------|---------|-------|
| `src/ui/toast.js` | `showToast()`, `showSuccess()`, `showError()` | Notifications |
| `src/ui/loading.js` | `showLoading()`, `hideLoading()`, `showErrorState()` | Loading states |
| `src/ui/modal.js` | `createModal()`, `showConfirm()`, `showAlert()` | Modal dialogs |
| `src/ui/form.js` | `getFormValues()`, `buildSafePayload()` | Form handling |
| `src/ui/layout.js` | `injectHeader()`, `injectSidebar()`, `injectFooter()` | Layout injection |

### Utilities

| File | Key Functions |
|------|---------------|
| `src/utils/dom.js` | `$()`, `showElement()`, `hideElement()`, `requireAuth()` |
| `src/utils/format.js` | `formatDate()`, `getInitials()`, `formatNumber()` |
| `src/utils/validate.js` | `validateEmail()`, `validatePassword()`, `validateRequired()` |
| `src/utils/storage.js` | `local.get()`, `local.set()`, `session.get()` |

---

## How to Add a New Page

1. **Create the HTML file** in the root directory
2. **Add script tags** in this order:
   ```html
   <!-- Supabase SDK -->
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   
   <!-- Configuration (must be first) -->
   <script src="supabase-config.js"></script>
   
   <!-- Core utilities -->
   <script src="src/core/env.js"></script>
   <script src="src/core/config.js"></script>
   <script src="src/core/router-helpers.js"></script>
   
   <!-- Supabase client -->
   <script src="src/lib/supabase/client.js"></script>
   <script src="src/lib/supabase/errors.js"></script>
   
   <!-- UI utilities -->
   <script src="src/ui/toast.js"></script>
   <script src="src/ui/loading.js"></script>
   
   <!-- Services -->
   <script src="supabase-service.js"></script>
   <script src="champion-auth-supabase.js"></script>
   <script src="champion-db-supabase.js"></script>
   
   <!-- Navigation -->
   <script src="dynamic-navigation.js"></script>
   <script src="mobile-menu.js"></script>
   <script src="logout.js"></script>
   
   <!-- Page-specific script -->
   <script src="your-page.js"></script>
   ```

3. **Create thin page controller** (`your-page.js`):
   ```javascript
   class YourPage {
       async init() {
           // Wait for services
           await waitForServices();
           
           // Check auth if needed
           if (!requireAuth()) return;
           
           // Load data
           await this.loadData();
       }
       
       async loadData() {
           try {
               setLoading(true, { contentId: 'content' });
               // Use services...
               const data = await window.championDB.getData();
               this.render(data);
           } catch (error) {
               handleSupabaseError('YourPage.loadData', error);
           } finally {
               setLoading(false, { contentId: 'content' });
           }
       }
   }
   
   // Initialize
   document.addEventListener('DOMContentLoaded', () => {
       const page = new YourPage();
       page.init();
   });
   ```

---

## Safe Database Operations

### Building Payloads

**NEVER** spread form data directly into `.insert()` or `.update()`. Always use explicit whitelisting:

```javascript
// ❌ WRONG - Dangerous, can include unexpected fields
const { data, error } = await client
    .from('reviews')
    .insert(formData);

// ✅ CORRECT - Use buildSafePayload
const payload = buildSafePayload(formData, [
    'indicator_id',
    'champion_id',
    'rating',
    'review_text',
    'clarity_rating',
    // ... only allowed fields
]);

const { data, error } = await client
    .from('reviews')
    .insert(payload);
```

### Error Handling

```javascript
try {
    const { data, error } = await fromTable('reviews').select('*');
    if (error) throw error;
    return data;
} catch (error) {
    // This normalizes the error and optionally shows a toast
    handleSupabaseError('getReviews', error, true);
    throw error;
}
```

---

## Migration Status

### Completed ✅
- [x] Create `/src` folder structure
- [x] Create `src/core/env.js` - Environment configuration
- [x] Create `src/core/config.js` - App configuration
- [x] Create `src/core/router-helpers.js` - URL utilities
- [x] Create `src/lib/supabase/client.js` - Single Supabase client
- [x] Create `src/lib/supabase/tables.js` - Table constants
- [x] Create `src/lib/supabase/errors.js` - Error handling
- [x] Create `src/utils/format.js` - Formatting utilities
- [x] Create `src/utils/validate.js` - Validation utilities
- [x] Create `src/utils/dom.js` - DOM utilities
- [x] Create `src/utils/storage.js` - Storage wrapper
- [x] Create `src/ui/toast.js` - Toast notifications
- [x] Create `src/ui/loading.js` - Loading states
- [x] Create `src/ui/modal.js` - Modal system
- [x] Create `src/ui/form.js` - Form utilities
- [x] Create `src/ui/layout.js` - Layout injection

### In Progress 🔄
- [ ] Update HTML pages to use new script imports
- [ ] Refactor existing services to use new utilities
- [ ] Extract duplicated logic from page controllers

### Pending 📋
- [ ] Migrate services to `/src/services/`
- [ ] Update page controllers to be thin
- [ ] Add layout injection to pages
- [ ] Full integration testing

---

## Backward Compatibility

All new utilities are exported to `window` for compatibility with existing code:

```javascript
// New style (when using modules)
import { showToast } from './src/ui/toast.js';

// Backward compatible (script tags)
window.showToast('Hello', 'success');
```

Existing globals preserved:
- `window.supabaseService`
- `window.championAuth`
- `window.championDB`
- `window.getSupabase()`

---

## Verification Checklist

Before deploying, verify these flows work:

- [ ] Login/logout/session persistence
- [ ] Navigate across all pages
- [ ] Panel selection and indicator selection
- [ ] Indicator review submission
- [ ] Rankings page loads data
- [ ] Admin features (if applicable)
- [ ] Toast notifications appear correctly
- [ ] Loading states show/hide properly
- [ ] Form validation works
- [ ] No console errors

---

*Last updated: Phase 2-3 of ESG Champions Refactor*
