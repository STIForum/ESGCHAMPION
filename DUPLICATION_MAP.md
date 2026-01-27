# ESG Champions Platform - Duplication Map

## Overview

This document identifies repeated code patterns across the codebase and proposes a single source of truth for each.

---

## 1. REPEATED UI CHUNKS (HTML)

### 1.1 Header / Navbar
**What repeats:** Full `<header class="header">` block with logo, nav-menu, nav-actions, mobile-menu-toggle

**Where it lives now:**
- `index.html` (lines 23-49)
- `champion-dashboard.html` (lines 19-42)
- `champion-panels.html` (lines 18-41)
- `champion-indicators.html` (lines 18-41)
- `champion-profile.html` (lines 18-41)
- `champion-login.html` (lines 17-36)
- `champion-register.html`
- `ranking.html` (lines 18-41)
- `admin-review.html` (lines 18-41)
- `about.html`, `faq.html`, `terms.html`, `privacy.html`, `cookie-policy.html`

**Proposed single source:** `src/ui/layout.js` → `renderHeader()` function that injects into `<div id="header-root"></div>`

---

### 1.2 Mobile Menu
**What repeats:** `<div class="mobile-menu">` block with close button and nav items

**Where it lives now:**
- All HTML pages (same locations as header)

**Proposed single source:** `src/ui/layout.js` → `renderMobileMenu()` function

---

### 1.3 Sidebar (Dashboard pages only)
**What repeats:** `<aside class="sidebar">` with nav links (Dashboard, Panels, Rankings, Profile, Invite Peers)

**Where it lives now:**
- `champion-dashboard.html` (lines 51-115)
- `champion-panels.html` (has inline dashboard layout)
- `champion-profile.html`

**Proposed single source:** `src/ui/layout.js` → `renderSidebar()` function

---

### 1.4 Footer (Full)
**What repeats:** `<footer class="footer">` with logo, description, social links, Platform/Support links, Schedule button

**Where it lives now:**
- `index.html` (lines 277-351)
- `about.html`
- `faq.html`
- Public pages (`terms.html`, `privacy.html`, `cookie-policy.html`)

**Proposed single source:** `src/ui/layout.js` → `renderFooter()` function

---

### 1.5 Footer (Compact - Dashboard variant)
**What repeats:** `<footer class="footer-compact">` with Terms/Privacy/Cookie links + copyright

**Where it lives now:**
- `champion-dashboard.html` (lines 354-377)
- `champion-panels.html`
- `champion-profile.html`
- `champion-indicators.html`
- `ranking.html`
- `admin-review.html`

**Proposed single source:** `src/ui/layout.js` → `renderFooterCompact()` function

---

### 1.6 Loading State
**What repeats:** `<div id="loading-state" class="flex-center"><div class="loading-spinner"></div></div>`

**Where it lives now:**
- `champion-dashboard.html`
- `champion-panels.html`
- `champion-indicators.html`
- `champion-profile.html`
- `ranking.html`
- `admin-review.html`
- `linkedin-callback.html`

**Proposed single source:** `src/ui/loading.js` → `showLoading()` / `hideLoading()` functions

---

### 1.7 Empty State
**What repeats:** Generic "No data" messages with icon + text

**Where it lives now:**
- Various page JS files render these inline

**Proposed single source:** `src/ui/loading.js` → `renderEmptyState(containerId, message, icon)` function

---

### 1.8 Script Tags (Footer)
**What repeats:** Same set of script imports at end of body

**Where it lives now:**
- All HTML pages have: `supabase-service.js`, `champion-auth-supabase.js`, `champion-db-supabase.js`, `dynamic-navigation.js`, `mobile-menu.js`, `logout.js`
- Some add page-specific scripts

**Proposed single source:** Keep in HTML but use a consistent ordering documented in `REFRACTOR_NOTES.md`

---

## 2. REPEATED JS LOGIC

### 2.1 Auth Guard (Redirect if not logged in)
**What repeats:**
```js
if (!window.championAuth.isAuthenticated()) {
    window.location.href = '/champion-login.html?redirect=...';
    return;
}
```

**Where it lives now:**
- `champion-dashboard.js` (line 19-22)
- `champion-profile.js` (line 15-18)
- `champion-panels.js` (implicit via service calls)
- `champion-indicators.js`
- `admin-review.js`

**Proposed single source:** `src/utils/dom.js` → `requireAuth(redirectUrl)` function

---

### 2.2 Wait for Services Ready
**What repeats:**
```js
await new Promise(resolve => setTimeout(resolve, 300-500));
```

**Where it lives now:**
- `champion-dashboard.js` (line 13)
- `champion-panels.js` (line 17)
- `champion-profile.js` (line 13)
- `champion-indicators.js`
- `ranking-supabase.js` (line 14)
- `admin-review.js`

**Proposed single source:** `src/core/config.js` → `waitForServices()` promise-based utility

---

### 2.3 Toast Notifications
**What repeats:**
```js
window.showToast('message', 'success|error|info');
```
Plus toast creation logic.

**Where it lives now:**
- `logout.js` (lines 58-166) - defines `showToast`
- Multiple files call `window.showToast()`

**Proposed single source:** `src/ui/toast.js` → standardized `showToast(message, type, duration)` function

---

### 2.4 Show/Hide Loading State
**What repeats:**
```js
document.getElementById('loading-state').classList.add('hidden');
document.getElementById('...content').classList.remove('hidden');
```

**Where it lives now:**
- `champion-dashboard.js`
- `champion-panels.js`
- `champion-profile.js`
- `champion-indicators.js`
- `ranking-supabase.js`
- `admin-review.js`

**Proposed single source:** `src/ui/loading.js` → `setLoading(isLoading, contentId)` function

---

### 2.5 Error Display Pattern
**What repeats:**
```js
showError(message) {
    const container = document.getElementById('...');
    container.innerHTML = `<div class="error">...</div>`;
}
```

**Where it lives now:**
- `champion-dashboard.js` (as method)
- `champion-panels.js` (as method)
- `champion-profile.js` (as method)
- `ranking-supabase.js` (lines 166-180)
- `champion-indicators.js`

**Proposed single source:** `src/ui/loading.js` → `showError(containerId, message)` function

---

### 2.6 Date/Number Formatting
**What repeats:**
```js
formatDate(dateString) { ... }
getInitials(name) { ... }
formatNumber(num) { ... }
```

**Where it lives now:**
- `champion-profile.js` (formatDate, getInitials)
- `champion-dashboard.js`
- `ranking-supabase.js` (getInitials)
- `champion-indicators.js`
- `dynamic-navigation.js`

**Proposed single source:** `src/utils/format.js` → `formatDate()`, `getInitials()`, `formatNumber()`

---

### 2.7 Query Parameter Parsing
**What repeats:**
```js
const params = new URLSearchParams(window.location.search);
const panelId = params.get('panel');
```

**Where it lives now:**
- `champion-panels.js`
- `champion-indicators.js`
- `champion-login.html` (inline)
- `linkedin-callback.html`

**Proposed single source:** `src/core/router-helpers.js` → `getQueryParam(name)`, `setQueryParam(name, value)`, `navigateTo(url)`

---

### 2.8 Form Value Gathering
**What repeats:**
```js
const field = document.getElementById('field-id').value.trim();
```
Done repeatedly for each form field.

**Where it lives now:**
- `champion-register.html` (inline)
- `champion-login.html` (inline)
- `champion-profile.js`
- `champion-indicators.js` (assessment form)

**Proposed single source:** `src/ui/form.js` → `getFormValues(formId)` returns object, `setFormValues(formId, data)`

---

### 2.9 Form Validation
**What repeats:**
```js
if (!email || !password) { showToast('Please fill all fields', 'error'); return; }
```

**Where it lives now:**
- `champion-login.html`
- `champion-register.html`
- `champion-profile.js`
- `champion-indicators.js`

**Proposed single source:** `src/utils/validate.js` → `validateRequired(fields)`, `validateEmail(email)`, `validatePassword(password)`

---

## 3. SUPABASE CLIENT / CONFIG FILES

### 3.1 Current State
| File | Purpose | Creates Client? |
|------|---------|-----------------|
| `supabase-config.js` | Holds `SUPABASE_URL` and `SUPABASE_ANON_KEY` | No |
| `supabase-service.js` | Calls `createClient()`, main SupabaseService class | **YES (line 21)** |
| `champion-auth-supabase.js` | ChampionAuth class, uses `window.supabaseService` | No |
| `champion-db-supabase.js` | ChampionDB class, uses `window.supabaseService` | No |
| `ranking-supabase.js` | RankingPage class, uses `window.championDB` | No |
| `admin-service.js` | AdminService class, uses `window.supabaseService` + `window.getSupabase()` | No |

### 3.2 Issues
1. **Hardcoded URL/Key** in `supabase-config.js` - should read from environment
2. **No schema prefix** - should use `supabase.schema('public')` for clarity
3. **Multiple global exports** - `window.supabaseClient`, `window.getSupabase`, `window.initSupabase`, `window.supabaseService`, `window.championAuth`, `window.championDB`
4. **No missing config check** - no clear error if config missing

### 3.3 Proposed Single Source Structure
```
src/
  core/
    env.js              # Reads SUPABASE_URL, SUPABASE_ANON_KEY from window/env
  lib/
    supabase/
      client.js         # ONLY place createClient() is called
      tables.js         # Table/column name constants
      errors.js         # PostgREST error normalization
  services/
    auth.service.js     # Refactored from champion-auth-supabase.js
    panels.service.js   # Panel/indicator queries
    indicators.service.js
    reviews.service.js  # Review submission
    rankings.service.js # Leaderboard queries
    admin.service.js    # Admin operations
```

---

## 4. PROPOSED NEW STRUCTURE

```
/src
  /core
    env.js                  # reads env vars consistently
    config.js               # app config constants, waitForServices()
    router-helpers.js       # query param helpers, nav helpers
  /lib
    /supabase
      client.js             # ONLY place createClient() is called
      tables.js             # table/column constants
      errors.js             # normalize Supabase/PostgREST errors
  /services
    auth.service.js         # refactored from champion-auth-supabase.js
    panels.service.js       # panels + indicators queries
    indicators.service.js   # indicator-specific operations
    reviews.service.js      # review submission
    rankings.service.js     # leaderboard
    admin.service.js        # admin functions
  /ui
    layout.js               # inject reusable header/nav/sidebar/footer
    modal.js                # one modal system
    toast.js                # one toast/notification system
    loading.js              # standardized loading state
    form.js                 # reusable form helpers
  /utils
    dom.js                  # safe query helpers, requireAuth()
    storage.js              # localStorage/sessionStorage wrapper
    format.js               # date/number formatting
    validate.js             # shared validators

/pages (or root)
  *.html                    # keep existing pages
  *.js                      # page controllers (thin)
```

---

## 5. MIGRATION PRIORITY

### Phase 1: Core Infrastructure
1. Create `src/core/env.js` - read config from one place
2. Create `src/lib/supabase/client.js` - single client creation
3. Create `src/lib/supabase/errors.js` - error normalization
4. Update `supabase-config.js` → `src/core/env.js`
5. Update `supabase-service.js` → import from `src/lib/supabase/client.js`

### Phase 2: Utilities
1. Create `src/utils/format.js` - extract formatDate, getInitials, etc.
2. Create `src/utils/validate.js` - extract validation logic
3. Create `src/utils/dom.js` - requireAuth, safe query helpers

### Phase 3: UI Components
1. Create `src/ui/toast.js` - extract from logout.js
2. Create `src/ui/loading.js` - loading/error state helpers
3. Create `src/ui/layout.js` - inject header/footer/sidebar
4. Update HTML pages to use placeholder divs

### Phase 4: Services
1. Refactor service files into `src/services/`
2. Keep backward-compatible exports in old locations

### Phase 5: Page Controllers
1. Simplify page JS files to thin controllers
2. Import from services and UI helpers

---

## 6. BACKWARD COMPATIBILITY NOTES

- Keep old file paths working via thin wrapper imports
- Keep `window.` global exports for existing page scripts
- Do not change CSS class names
- Do not change URLs/routes
- Test all flows after each phase

---

*Document created: Phase 1 of ESG Champions Refactor*
*Next step: Create src folder structure and begin Phase 1 implementation*
