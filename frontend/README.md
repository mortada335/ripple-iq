# RippleIQ Frontend

> **AI-Powered Policy Decision Support System** — a Next.js application that helps institutions simulate, analyse, and review complex policy decisions before enacting them.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Components](#components)
- [Data Layer](#data-layer)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Backend Integration](#backend-integration)
- [Design System](#design-system)
- [Contributing](#contributing)

---

## Overview

RippleIQ is a decision-support interface for institutional policy makers. It allows users to:

- **Draft decisions** with structured context (stakeholders, budgets, constraints)
- **Run AI simulations** to predict cascading consequences and risks
- **Review results** through stakeholder impact matrices, risk assessments, and scenario comparisons
- **Generate audit-ready reports** in Markdown with full decision trails
- **Enforce human-review** at every stage — AI is advisory, not autonomous

> ⚠️ All AI outputs are advisory only and require mandatory human review before any policy action.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | 16.4.0 | App framework (App Router) |
| [React](https://react.dev) | 19.3.0 | UI library |
| [TypeScript](https://typescriptlang.org) | ^5 | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | ^4 | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com) | ^4 | Accessible component primitives |
| [Base UI](https://base-ui.com) | ^1.9 | Headless UI components |
| [Lucide React](https://lucide.dev) | ^1.56 | Icon system |
| [pnpm](https://pnpm.io) | 10.33.0 | Package manager |

---

## Project Structure

```
frontend/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (AppShell wrapper)
│   ├── page.tsx                # Root redirect → /login
│   ├── login/                  # Authentication page
│   │   └── page.tsx
│   ├── dashboard/              # Main dashboard
│   │   └── page.tsx
│   ├── decisions/              # Decisions module
│   │   ├── page.tsx            # All decisions list
│   │   ├── new/                # Create new decision wizard
│   │   │   └── page.tsx
│   │   └── [id]/               # Decision detail (tabbed)
│   │       ├── context/        # Context & metadata tab
│   │       ├── progress/       # Simulation progress tab
│   │       ├── consequences/   # Consequence analysis tab
│   │       ├── risks/          # Risk matrix tab
│   │       ├── scenarios/      # Scenario comparison tab
│   │       ├── recommendation/ # AI recommendation tab
│   │       └── report/         # Full report & export tab
│   └── settings/               # Institution settings
│       └── page.tsx
│
├── components/                 # Shared UI components
│   ├── AppShell.tsx            # Layout wrapper (Header + Sidebar + main)
│   ├── Header.tsx              # Top nav: logo, university switcher, API status, profile
│   ├── Sidebar.tsx             # Left nav: route links with active state
│   ├── HumanReviewBanner.tsx   # Mandatory AI-advisory disclaimer banner
│   ├── DecisionNavTabs.tsx     # Tab navigation for decision detail pages
│   ├── MarkdownViewer.tsx      # Renders AI-generated markdown reports
│   └── CharterModal.tsx        # First-run charter/terms modal
│
├── lib/                        # Utilities and data services
│   ├── api.ts                  # API client (live backend + mock fallback)
│   ├── mock-data.ts            # Local mock data & localStorage persistence
│   └── utils.ts                # Shared utility functions (cn, etc.)
│
├── types/
│   └── decision.ts             # Full TypeScript types for all domain models
│
├── public/                     # Static assets
├── next.config.ts              # Next.js configuration
└── package.json
```

---

## Pages & Routes

### `/login`
Institutional login page. Accepts email/password credentials. On success, redirects to `/dashboard`.

### `/dashboard`
Main overview page showing:
- Summary stats (total decisions, simulations run, pending reviews)
- Recent decisions list with status badges
- Quick-action buttons to create a new decision or view all decisions

### `/decisions`
Paginated list of all decisions. Each card shows title, status, confidence score, and creation date. Includes search/filter controls.

### `/decisions/new`
Multi-step wizard to create a new decision:
1. **Step 1** — Decision title & description
2. **Step 2** — Operational context (budget, timeline, constraints, affected population)
3. **Step 3** — Review & submit to trigger AI simulation

### `/decisions/[id]/*` — Decision Detail (7 tabs)

| Tab | Route | Description |
|---|---|---|
| Context | `/decisions/[id]/context` | Full decision metadata and submitted context |
| Progress | `/decisions/[id]/progress` | Live simulation progress with step tracker |
| Consequences | `/decisions/[id]/consequences` | Stakeholder impact matrix (positive/negative/neutral) |
| Risks | `/decisions/[id]/risks` | Risk register: severity × likelihood heat map |
| Scenarios | `/decisions/[id]/scenarios` | Alternative scenario comparisons |
| Recommendation | `/decisions/[id]/recommendation` | AI recommendation with confidence score |
| Report | `/decisions/[id]/report` | Full markdown audit report + copy/export |

### `/settings`
Institution configuration:
- Profile details (name, type, country)
- Language & locale preferences
- API connection health check
- Notification preferences
- Data retention policies

---

## Components

### `AppShell`
Top-level layout wrapper. Renders `<Header>`, `<Sidebar>`, and the main content area. Used by `app/layout.tsx` to wrap all authenticated routes.

### `Header`
Top navigation bar featuring:
- **RippleIQ logo** with compass icon
- **University switcher** dropdown (institution name)
- **API status indicator** — live ping to `/health`, shows green/red badge
- **Profile avatar** menu

### `Sidebar`
Left navigation with icon + label links to: Dashboard, New Decision, All Decisions, Settings, Report, Documentation. Highlights the active route.

### `HumanReviewBanner`
A persistent amber banner reminding users that all AI outputs require human review before action. Supports a `compact` prop for inline usage.

### `DecisionNavTabs`
Horizontal tab bar rendered at the top of all `/decisions/[id]/*` pages. Reads the current `[id]` from the URL and builds links for all 7 tabs.

### `MarkdownViewer`
Renders AI-generated markdown report text with proper heading hierarchy, code blocks, and print-safe styles. Includes a copy-to-clipboard button.

### `CharterModal`
One-time modal displayed on first visit, explaining the AI-advisory charter and ethical use policy. Stored in `localStorage` so it only appears once.

---

## Data Layer

### `lib/api.ts` — API Client
All backend calls go through this module. It automatically detects whether the backend is available:
- **Backend available** → calls real API at `NEXT_PUBLIC_API_URL`
- **Backend unavailable** → transparently falls back to `lib/mock-data.ts`

Key functions:

```ts
api.getDecisions()           // GET /decisions
api.createDecision(data)     // POST /decisions
api.getDecision(id)          // GET /decisions/:id
api.submitContext(id, ctx)   // POST /decisions/:id/context
api.runSimulation(id)        // POST /decisions/:id/simulate
api.getSimulationResult(id)  // GET /decisions/:id/result
api.generateReport(id)       // POST /decisions/:id/report
api.getHealth()              // GET /health
```

### `lib/mock-data.ts` — Mock Engine
Pre-built demo data based on the university attendance decision example. All mock decisions are persisted in `localStorage` so state survives page refresh during development.

### `types/decision.ts` — Domain Types
Complete TypeScript interfaces for all domain models:
- `Decision`, `DecisionCreate`
- `ContextData`, `ContextDataCreate`
- `SimulationResult`, `StakeholderImpact`, `RiskItem`, `Scenario`
- `ReportResponse`, `HealthResponse`
- Enums: `Priority`, `DecisionStatus`, `ConfidenceLevel`, `ImpactCategory`

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 20
- **pnpm** ≥ 10 (`npm install -g pnpm`)

### Install dependencies

```bash
cd frontend
pnpm install
```

### Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> The app runs fully in **mock mode** with no backend required. All decisions are stored in your browser's `localStorage`.

### Build for production

```bash
pnpm build
pnpm start
```

### Lint

```bash
pnpm lint
```

---

## Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
# URL of the RippleIQ backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Public website origin used by metadata, robots.txt, and sitemap.xml
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Set to true to use mock data for the demo workspace
NEXT_PUBLIC_USE_MOCK=false
```

The login and registration pages require the API. Use **Explore demo workspace** to enter the browser-local demo. Authenticated API errors are shown instead of being replaced with demo data.

---

## Backend Integration

The frontend is designed to integrate with the RippleIQ FastAPI backend. The full API contract is documented in [`../docs/api-contract.md`](../docs/api-contract.md).

### Integration status

- [x] Registration and login use the documented API endpoints
- [x] Bearer token and organization selection are attached to private API requests
- [x] Decision lists use the API's `offset` and `limit` paging parameters
- [x] Organization profile extras are included per decision via the documented `raw_metadata` field
- [ ] Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` for the target deployment
- [ ] Verify auth, CORS, organization roles, and report behavior against the deployed backend

The documented simulation endpoint is synchronous and has no progress-stream contract; the progress screen is a frontend status sequence, not streamed backend progress.

### Key API endpoints

| Method | Path | Used by |
|---|---|---|
| `GET` | `/health` | Header API status badge |
| `GET` | `/decisions` | Decisions list page |
| `POST` | `/decisions` | New decision wizard |
| `GET` | `/decisions/{id}` | All decision detail tabs |
| `POST` | `/decisions/{id}/context` | Context tab |
| `POST` | `/decisions/{id}/simulate` | Progress tab |
| `GET` | `/decisions/{id}/result` | Consequences, Risks, Scenarios, Recommendation tabs |
| `POST` | `/decisions/{id}/report` | Report tab |

---

## Design System

The app uses a semantic token system defined in `app/globals.css` using [OKLCH](https://oklch.com/) colour values and shadcn/ui CSS custom properties:

- **Colour tokens**: Defined as CSS custom properties (`--primary`, `--background`, `--destructive`, etc.) in both `:root` (light) and `.dark` scopes — no raw hex values used in components
- **Primary hue**: Teal/green range (`oklch ~0.508 0.118 165`), with a lighter dark-mode variant
- **Sidebar tokens**: Separate `--sidebar-*` token set for the navigation surface
- **Chart palette**: Five-step `--chart-1` through `--chart-5` scale for data visualisations
- **Border radius**: Derived from a single `--radius` base variable (0.625rem) with `sm` → `4xl` scale
- **Typography**: `--font-sans` (body) and `--font-geist-mono` (code) via `@theme inline`
- **Animations**: Powered by `tw-animate-css` imported in `globals.css`
- **Dark mode**: Class-based (`.dark`) — toggled programmatically, not via `prefers-color-scheme`

Tailwind CSS v4 is used for utility classes. Component variants are managed via `class-variance-authority`.

---

## Contributing

1. **Branch** off `main` with a descriptive name (e.g. `feat/scenario-comparison`)
2. **Follow** the existing component structure in `components/`
3. **Add types** in `types/decision.ts` for any new data shapes
4. **Test mock mode** — all features must work without a running backend
5. **Open a PR** with a clear description of the change

For backend API changes that affect the frontend, coordinate with the backend team and update `types/decision.ts` and `lib/api.ts` accordingly.

---

> Built with ❤️ by the RippleIQ team. AI is a tool — humans make the decisions.
