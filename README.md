# Pydinfinity HR Portal

A premium, mobile-first HR web app for **Pydinfinity Solutions** — one unified people system for
**Employees, Interns and Freelancers**, built from the *HR Management Software — Complete Product & Build Plan*.

- **Custom colour themes** — 9 presets (Boutique Rose default, Indigo, Ocean, Emerald, Violet, Rose Gold, Amber, Teal, Graphite) **plus a custom brand-colour picker**
- **Dark mode** — Light / Dark / System, with 4 dark styles: Midnight, Charcoal, OLED Black, Accent-tinted
- Corner style (sharp / default / round); text on buttons auto-switches for contrast
- **Responsive** — desktop sidebar ≥1024px; on mobile a sticky header with search, a 5-tab bottom bar and an "All modules" sheet (safe-area aware)
- Installable as a **PWA**; ⌘K / Ctrl+K command palette

The visual language (Poppins headings, rose-pink brand, brand top strip, rotating hero banner,
circle shortcuts, chip filters) follows the Colors Dress boutique UI. See [`design-system/MASTER.md`](design-system/MASTER.md).

## Modules

| # | Module | Route |
|---|--------|-------|
| 1 | People Directory — profiles, smart filters, history timeline | `/people`, `/people/[id]` |
| 2 | Employee ID Generator — `PYD-EMP-26-0001`, atomic per-type/year counter, locked IDs, QR ID cards, bulk print | `/ids` |
| 3 | Document & KYC Vault — Pending → Uploaded → Verified/Rejected, KYC %, expiry alerts, masked Aadhaar, DPDP consent, self-service link | `/documents`, `/kyc/[id]` |
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
| — | Audit log, Settings & theme studio | `/audit`, `/settings` |

### Roles
Switch roles from the **"Viewing as"** menu in the top strip to see each permission level:
**Super Admin** (everything), **HR** (people, KYC, IDs, letters), **Manager** (own team, leave approvals, intern feedback) and
**Self-service** (own profile, documents, leave, letters, payslips).

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Tech
Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · Zustand · lucide-react · qrcode · Inter + Poppins (self-hosted via Fontsource).

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
