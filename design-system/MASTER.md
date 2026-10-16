# Pydinfinity HR — Design System (MASTER)

Built for Pydinfinity Solutions. Inspired by the Colors Dress boutique storefront: Poppins display type, rose-pink brand,
brand-colored top strip, sticky white header with search, mobile bottom tab bar,
horizontally-scrolling circle shortcuts, rotating hero banner with dots.

## Pattern
Executive-summary dashboard + data-dense lists. Desktop (>=1024px): left sidebar.
Mobile/tablet: sticky header + search, bottom tab bar (5 items: Home, People, KYC, Leave, More),
"More" opens a bottom sheet with every module as circle shortcuts.

## Style
Soft UI / dimensional layering. Cards: 1px border + soft shadow. Radius token `--radius`
(sharp 6 / default 14 / round 20). Glass only for sticky header & sheets (blur = dismissible layer).

## Color (all runtime tokens — never raw hex in components)
- `--primary` / `--accent2`: theme presets (Boutique Rose #E91E63/#8E24AA default, Indigo, Ocean,
  Emerald, Violet, Rose Gold, Amber, Teal, Graphite) or custom picker. `--primary-fg` auto-picked for contrast.
- Light surfaces: bg #f1f3f6, surface #fff, text #1f2430, text-2 #4b5563, muted #6b7280.
- Dark surfaces (selectable): Midnight, Charcoal, OLED Black, Accent-tinted.
- Status: success / warning / danger / info — always paired with an icon or label.
- Charts: categorical slots 1–3 (blue/orange/aqua), stepped per mode; single-series charts use `--primary`.

## Typography
Poppins 600/700 for headings & numbers (display); Inter Variable for body.
Scale 12 / 14 / 16 / 18 / 24 / 30. Inputs are 16px on mobile (no iOS zoom), 14px >= sm.
Tabular numerals for IDs, money, counts.

## Effects
Transitions 150–250ms ease-out; fade-up on page enter; scale-in for modals; slide-in for drawers.
`prefers-reduced-motion` disables them. Scrim 50% black.

## Touch & layout
Min 44px targets on mobile; 8px spacing rhythm; content padded for bottom bar + safe area;
no horizontal page scroll (tables scroll inside their card). Breakpoints 375 / 768 / 1024 / 1440.

## Anti-patterns
No emoji icons (Lucide only); no dual-axis charts; no color-only status; no placeholder-only labels;
Aadhaar never shown unmasked.
