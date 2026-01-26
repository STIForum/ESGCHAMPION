# ESG Champion Platform - React SPA Refactor Notes

## Overview

This document describes the refactoring from a multi-page HTML/JavaScript application to a React + Vite + TypeScript Single Page Application (SPA).

## Technology Stack

| Category | Technology |
|----------|------------|
| Build Tool | Vite 5.x |
| Framework | React 18.x |
| Language | TypeScript 5.x |
| Routing | React Router 6.x |
| Backend | Supabase JS v2 |
| Hosting | Vercel |

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx                 # Application entry point
│   ├── app/
│   │   ├── App.tsx              # Root component with providers
│   │   ├── router.tsx           # Route definitions
│   │   └── layouts/
│   │       ├── MainLayout.tsx   # Public/authenticated layout
│   │       ├── AuthLayout.tsx   # Auth pages layout
│   │       └── index.ts
│   ├── components/              # Shared UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Footer.tsx
│   │   ├── InfoTooltip.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── MobileMenu.tsx
│   │   ├── Modal.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatsCard.tsx
│   │   ├── Toast.tsx
│   │   └── index.ts
│   ├── features/                # Feature modules
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── repo.interface.ts
│   │   │   ├── repo.supabase.ts
│   │   │   ├── service.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── panels/
│   │   ├── indicators/
│   │   ├── reviews/
│   │   └── rankings/
│   ├── lib/
│   │   └── supabase/            # Supabase abstraction
│   │       ├── client.ts        # Single client instance
│   │       ├── schema.ts        # Table/column constants
│   │       ├── types.ts         # Database types
│   │       └── errors.ts        # Error handling
│   ├── pages/                   # Page components
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PanelsPage.tsx
│   │   ├── IndicatorsPage.tsx
│   │   ├── RankingsPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── AdminReviewPage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   └── index.ts
│   └── styles/
│       └── globals.css          # Global styles (migrated)
├── public/
│   └── assets/                  # Static assets
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env.example
```

## Architecture Patterns

### Repository Pattern

Each feature uses a repository pattern for data access:

```typescript
// repo.interface.ts - Contract
export interface IPanelRepository {
  getAll(): Promise<Panel[]>
  getById(id: string): Promise<Panel | null>
}

// repo.supabase.ts - Implementation
export class SupabasePanelRepository implements IPanelRepository {
  constructor(private client: SupabaseClient) {}
  
  async getAll(): Promise<Panel[]> {
    const { data, error } = await this.client
      .from(Tables.PANELS)
      .select('*')
    // ...
  }
}

// service.ts - Business logic
export class PanelService {
  constructor(private repo: IPanelRepository) {}
  
  async getPanelsGroupedByCategory() {
    // Business logic here
  }
}
```

### Single Supabase Client

**Critical**: All Supabase operations use a single client instance from `@/lib/supabase/client`:

```typescript
import { supabase } from '@/lib/supabase/client'
```

### Feature-Based Organization

Each feature is self-contained:
- `types.ts` - TypeScript interfaces
- `repo.interface.ts` - Repository contract
- `repo.supabase.ts` - Supabase implementation
- `service.ts` - Business logic
- `index.ts` - Public exports

## Route Mapping

| Legacy URL | React Route | Component |
|------------|-------------|-----------|
| `index.html` | `/` | HomePage |
| `about.html` | `/about` | AboutPage |
| `ranking.html` | `/ranking` | RankingsPage |
| `champion-login.html` | `/champion-login` | LoginPage |
| `champion-register.html` | `/champion-register` | RegisterPage |
| `champion-dashboard.html` | `/champion-dashboard` | DashboardPage |
| `champion-panels.html` | `/champion-panels` | PanelsPage |
| `champion-indicators.html` | `/champion-indicators` | IndicatorsPage |
| `champion-profile.html` | `/champion-profile` | ProfilePage |
| `admin-review.html` | `/admin-review` | AdminReviewPage |

## Environment Variables

```bash
# .env
VITE_SUPABASE_URL=https://sqxezltdeebvhgxsgxfj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Key Differences from Legacy

### Authentication

Legacy:
```javascript
// champion-auth-supabase.js
const supabase = createClient(url, key)
await supabase.auth.signInWithPassword({ email, password })
```

React:
```typescript
// Uses AuthContext
const { signIn, user, isAuthenticated } = useAuth()
await signIn(email, password)
```

### Data Fetching

Legacy:
```javascript
// Direct Supabase calls in HTML script tags
const { data } = await supabase.from('panels').select('*')
```

React:
```typescript
// Service layer with hooks
const panelService = new PanelService(new SupabasePanelRepository(supabase))
const [panels, setPanels] = useState<Panel[]>([])

useEffect(() => {
  panelService.getPanels().then(setPanels)
}, [])
```

### Styling

All styles migrated to `src/styles/globals.css` with:
- Same CSS variables
- Same class names
- React-specific additions (`.app-layout`, `.auth-layout`)

## Running the Application

```bash
cd frontend

# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

## Deployment

Configured for Vercel with `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Migration Checklist

- [x] Vite + React + TypeScript scaffolding
- [x] Supabase client abstraction
- [x] Auth feature (context, protected routes, service)
- [x] Panels feature (types, repo, service)
- [x] Indicators feature (types, repo, service)
- [x] Reviews feature (types, repo, service)
- [x] Rankings feature (types, repo, service)
- [x] Shared components (Navbar, Footer, Sidebar, etc.)
- [x] All page components
- [x] Router configuration
- [x] Layouts (MainLayout, AuthLayout)
- [x] CSS migration to globals.css
- [ ] Move legacy files to /legacy folder
- [ ] End-to-end testing
- [ ] Production deployment verification

## Notes

1. **TypeScript Strict Mode**: Enabled for better type safety
2. **Path Aliases**: `@/` maps to `src/` for clean imports
3. **CSS**: No CSS-in-JS - using legacy CSS classes for consistency
4. **Forms**: Using controlled components with React state
5. **API**: All Supabase calls go through service layer
