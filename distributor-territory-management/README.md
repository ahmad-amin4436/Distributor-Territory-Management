# Distributor Territory Management

A premium, demo-ready Next.js dashboard for managing distributor sales territories on an interactive city map. Built as a senior-grade prototype for client demos — modern SaaS aesthetic, dark-first UI, glassmorphism cards, smooth charts, and a fully interactive Leaflet map with polygon drawing.

> Stack: **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui-style components · React Hook Form · Zod · Zustand · React Leaflet · Leaflet Draw · OpenStreetMap · Recharts · Lucide Icons**

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. You will be redirected to `/login`. Use any email + password, or click **"Use demo credentials"**.

```bash
# production
npm run build
npm start
```

---

## What you get

### Authentication
- Glassmorphism login card with gradient background, gradient grid mesh, and split-screen marketing panel.
- Demo credential prefill.
- Session persisted to `localStorage` via Zustand.

### Dashboard (`/dashboard`)
- KPI tiles: total territories, active distributors, monthly sales, top performer.
- Live mini-map with click-to-drill-down.
- Top-performing territories list.
- Monthly trend area chart, distributor performance radial chart, and revenue distribution bar chart.

### Territory Designer (`/territories`)
- Interactive Leaflet map centered on Karachi (configurable in `mock/distributors.ts`).
- "Draw new territory" enters **Leaflet Draw polygon mode** — click to drop vertices, click first point / double-click to finish.
- On completion, a modal opens to name the territory and assign a distributor (Zod-validated form).
- Each territory has its own color, hover opacity, tooltip, and click-to-popup with a premium card showing distributor contact, territory metrics, and target progress.
- Sidebar of territories with edit / delete + click-to-focus (`flyToBounds`).
- All territories persisted in `localStorage`.

### Distributors (`/distributors`)
- Searchable, paginated table with avatars, codes, contact info, assigned territory chips, and status badges.
- Add / edit dialogs (React Hook Form + Zod).
- Delete with confirmation. Deleting a distributor un-assigns their territory automatically.
- Assignments are kept consistent across stores in both directions.

### Sales Coverage (`/sales`)
- Map with a **simulated heatmap** layer (high = green, medium = yellow, low = red), generated deterministically around each territory's center.
- Toggle between heatmap and territory polygons.
- Activity legend overlay.
- Coverage health side panel and bottom charts (revenue distribution + 12-month trend).

### Reports (`/reports`)
- League table sorted by % target achievement, with inline progress bars.
- 12-month trend, distributor performance radial, revenue bars.
- **Export to CSV** button.

### Settings (`/settings`)
- Profile / workspace forms (purely visual demo).
- "Reset demo data" wipes local persistence and reseeds the original mock data.
- Sign-out.

---

## Folder structure

```
distributor-territory-management/
├── app/
│   ├── (auth)/login/page.tsx       # Glassmorphism login
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + Header + auth gate
│   │   ├── dashboard/page.tsx
│   │   ├── territories/page.tsx    # Territory designer + draw
│   │   ├── distributors/page.tsx   # CRUD table
│   │   ├── sales/page.tsx          # Heatmap & coverage
│   │   ├── reports/page.tsx        # Executive reports + CSV export
│   │   └── settings/page.tsx
│   ├── globals.css                 # Tailwind v4 + Leaflet + dark theme tokens
│   ├── layout.tsx                  # Root layout + StoreBootstrap
│   └── page.tsx                    # Redirect → /dashboard
├── components/
│   ├── ui/                         # shadcn-style primitives (button, card, dialog, table, select, …)
│   ├── layout/                     # Sidebar, Header, AuthGate
│   ├── map/                        # TerritoryMap, DynamicMap, DrawControl, HeatLayer, TerritoryPopupCard
│   ├── territories/                # TerritorySidebar, AssignTerritoryDialog
│   ├── distributors/               # DistributorDialog, ConfirmDeleteDialog
│   └── dashboard/                  # KpiCard + Recharts chart components
├── hooks/useHydrated.ts
├── lib/utils.ts                    # cn(), formatters, helpers
├── mock/                           # Distributors, territories, sales data generators
├── services/storeBootstrap.tsx     # Hydrates Zustand stores from mock data on first load
├── store/                          # authStore, distributorStore, territoryStore, uiStore (Zustand + persist)
├── types/                          # Domain types
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

---

## Key technical decisions

- **App Router + client islands.** All map/chart pages are client components. The map is loaded via `next/dynamic({ ssr: false })` to avoid Leaflet's `window` access during SSR.
- **Zustand + `persist`.** Territories and distributors persist to `localStorage` under `dtm.territories` / `dtm.distributors`. Auth lives at `dtm.auth`. Reset in **Settings → Reset demo data** or `localStorage.clear()`.
- **Tailwind v4.** Theme tokens defined in `globals.css` via `@theme inline`. Dark-first palette with custom radii. CSS-in-CSS rather than a `tailwind.config`.
- **Leaflet integration.** OpenStreetMap tiles are visually adjusted in CSS (brightness / hue / saturate) for the dark UI. `DrawControl` programmatically enables `L.Draw.Polygon` rather than rendering the Leaflet Draw toolbar — the in-app "Draw new territory" button is the trigger.
- **No backend.** All mutations write to Zustand stores; no API routes are needed for the demo. Mock data lives in `/mock`.

---

## Demo data

Seeded on first run:

- **8 distributors** with realistic Karachi addresses, codes, contacts, and avatar colors.
- **8 territories** spread across North, South Coastal, Central Business, East Gardens, West Industrial, DHA Premium, Northeast Hub, and Southwest Port — each with realistic sales, targets, outlet counts, and a performance band.
- **12 months** of trend data for the trend chart.
- A deterministic sales-point generator (`generateSalesPoints`) drives the heatmap layer.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js dev server at <http://localhost:3000>. |
| `npm run build` | Build the production bundle. |
| `npm start` | Serve the production build. |
| `npm run lint` | Run ESLint with the Next.js config. |

---

## Notes

- The login is intentionally permissive — any email + password works and a "Use demo credentials" button pre-fills the form.
- "Sign out" clears the auth store and redirects to `/login`. The dashboard layout is guarded by `AuthGate`.
- If the polygon draw doesn't kick in after pressing "Draw new territory", make sure your browser tab has focus on the map; click anywhere on the map to start dropping vertices.
