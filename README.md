# Pydinfinity HR Portal

A premium, mobile-first HR web app for **Pydinfinity Solutions** — one unified people system for
**Employees, Interns and Freelancers**, built from the *HR Management Software — Complete Product & Build Plan*.

- **AuraPOS design & motion** — floating rounded sidebar, glass top bar, drifting "aura" glow, gradient hero KPI with
  sheen sweep and live pulse, count-up numbers, bars that grow in, self-drawing trend line, sweeping gauge, hover lift
- **Custom colour themes** — 8 skins stepped for light *and* dark (Aura Emerald default, Boutique Rose, Midnight, Ocean,
  Sand, Berry, Violet, Graphite) **plus a custom brand-colour picker**
- **Dark mode** — Light / Dark / System, with 4 dark styles: Aura Forest, Charcoal, OLED Black, Skin-tinted
- Corner style (sharp / default / round); button text auto-switches for contrast
- **Responsive** — sidebar ≥1024px; on mobile a slide-in drawer plus a floating 5-tab bar (safe-area aware)
- Installable as a **PWA**; ⌘K / Ctrl+K command palette; notification centre with unread state

See [`design-system/MASTER.md`](design-system/MASTER.md).

## Modules

| # | Module | Route |
|---|--------|-------|
| 1 | People Directory — profiles, smart filters, history timeline | `/people`, `/people/view?id=…` |
| 2 | Employee ID Generator — `PYD-EMP-26-0001`, atomic per-type/year counter, locked IDs, QR ID cards, bulk print | `/ids` |
| 3 | Document & KYC Vault — Pending → Uploaded → Verified/Rejected, KYC %, expiry alerts, masked Aadhaar, DPDP consent, self-service link | `/documents`, `/kyc?id=…` |
| 4 | Interns — lifecycle, mentor feedback, certificates, one-click convert (new EMP ID, old INT ID kept) | `/interns` |
| 5 | Freelancers — contracts, renewal alerts, invoices Submitted → Approved → Paid, TDS/GST, spend | `/freelancers` |
| 6 | Bulk Import / Export — CSV with column mapping & validation; CSV exports | `/import-export` |
| 7 | Onboarding checklists (HR / IT / Manager) | `/onboarding` |
| 8 | Attendance & Leave — check-in (geo for field), CL/SL/EL/LOP balances, approvals, calendar, branch holidays | `/attendance` |
| 9 | Letter Generator — offer, appointment, certificate, experience, relieving, salary revision, warning, freelance agreement; e-sign; print to PDF | `/letters` |
| 10 | Asset Tracking — issue / return | `/assets` |
| 11 | Offboarding — notice tracker, exit interview, asset return, F&F checklist | `/offboarding` |
| 12 | Announcements, birthdays & work anniversaries | `/announcements` |
| 13 | Payroll basics — salary structure, payslips (PF, ESI, PT, TDS), Tally export | `/payroll` |
| 14 | Performance — quarterly goals, self & manager ratings | `/performance` |
| 15 | Recruitment (ATS) — jobs, pipeline, one-click hire | `/recruitment` |
| 16 | Org Chart — generated from manager links | `/org-chart` |
| 17 | Reports dashboard — headcount, joiners vs exits, KYC, conversion rate, spend | `/` |
| 18 | Multi-branch switcher (sidebar) | — |
| — | Audit log, Settings: theme studio, notification preferences, role/permission matrix | `/audit`, `/settings` |

### Roles
Switch roles from the **"Viewing as"** menu in the top strip to see each permission level:
**Super Admin** (everything), **HR** (people, KYC, IDs, letters), **Manager** (own team, leave approvals, intern feedback) and
**Self-service** (own profile, documents, leave, letters, payslips).

## Deploy the demo to Cloudflare Pages

The app is a **static export** — no server needed.

**Option A — upload the ready-made zip (no tools needed)**
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Name the project (e.g. `pydinfinity-hr-demo`) and upload [`deploy/pydinfinity-hr-demo-cloudflare.zip`](deploy/pydinfinity-hr-demo-cloudflare.zip).
3. Deploy — the site is live at `https://<project>.pages.dev`.

**Option B — connect this GitHub repo** (auto-deploys on every push)
Framework preset *Next.js (Static HTML Export)* · Build command `npm run build` · Output directory `out` · Node 20+.

**Option C — CLI**: `npm run deploy:cf` (runs `wrangler pages deploy out`). `npm run deploy:zip` rebuilds the zip.

`public/_headers` ships security headers and long-cache rules for hashed assets.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Tech
Next.js 15 (App Router, static export) · React 19 · Tailwind CSS v4 · Zustand · lucide-react · qrcode ·
Plus Jakarta Sans, JetBrains Mono & Lora (self-hosted via Fontsource).

### Data
This build is a **fully working front end with demo data persisted in the browser** (localStorage), so every flow
can be clicked through without a server. To reset, use *Settings → Reset demo*.
The store (`src/lib/store.ts`) is shaped after the plan's tables (`people`, `*_details`, `id_sequences`, `documents`,
`invoices`, `attendance`, `leaves`, `assets`, `letters`, `audit_logs`) so it can be swapped for **Supabase**
(Postgres + Auth with 2FA + private storage buckets + row-level security) as the next step.

## Project structure
```
src/
  app/            one folder per module (route)
  components/     shell (sidebar, header, bottom tabs, command palette), ui kit, charts, ID card, forms
  lib/            store, seed data, theme engine, alerts, nav, utils
design-system/    MASTER.md — tokens, typography, layout rules
```
