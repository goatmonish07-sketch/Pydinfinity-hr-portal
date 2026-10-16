# Pydinfinity HR — Design System (MASTER)

Built for Pydinfinity Solutions. Visual language and motion follow the **AuraPOS** demo.

## Layout
- App grid: 272px floating sidebar card + main column, 16px gaps and page padding.
- Sidebar: brand mark, company + branch switcher, grouped nav (11px uppercase group labels), active item = soft
  primary fill + 4px primary bar, count badges in `--primary-strong`, gradient promo card at the bottom.
- Top bar: glass card (82% surface + 14px blur), pill search (⌘K palette), "Viewing as" role pill, theme, bell, avatar.
- Demo banner (soft primary) under the top bar.
- < 1024px: sidebar becomes a slide-in drawer (inert when closed) + floating glass 5-tab bar (Home, People, KYC, Leave, Menu).

## Tokens
- Skins set `--primary` and `--accent` separately for light and dark; `--primary-strong`/`--primary-soft` derive via color-mix.
- Light: bg #eef0eb, surface #fcfcf9, surface-2 #f3f5f0, border #e0e3db, text #161b18, muted #5f6862.
- Dark (Aura Forest): bg #0c110e, surface #141b17, surface-2 #1a231e, border #26322b, text #e8eee9, muted #98a59c.
  Alternatives: Charcoal, OLED Black, Skin-tinted.
- Radius: cards 26px, controls 16px, buttons/chips/search fully round. Shadows: `--shadow`, `--shadow-lift`.
- Status pills: 8px radius, 1px border at 45% of the tone, 7% fill — always text + dot, never colour alone.
- Charts: single series = primary (accent for trend line); categorical slots 1–3 (validated blue/orange/aqua).

## Type
Plus Jakarta Sans (UI; 800 for H1 at clamp(28px, 4vw, 40px), 700 for card titles 19px), JetBrains Mono (IDs, clock),
Lora (letters on paper). Tabular numerals for all numbers. Inputs 16px on mobile.

## Motion (all disabled under prefers-reduced-motion)
`drift` aura glow (18s/22s), `rise` staggered card entrance, `lift` hover (-3px + deeper shadow), hero `sheen`
sweep + `live-dot` pulse, count-up numbers (900ms ease-out cubic), `grow` bars, `growx` progress, `draw` trend line,
gauge arc 1.2s, toast pill rises from the bottom, modals scale-in (sheet slide-up on mobile).

## Anti-patterns
No emoji icons (Lucide only); no dual-axis charts; no colour-only status; no placeholder-only labels; Aura glow never
behind body text at full strength; paper documents (letters, ID cards, payslips) stay white in dark mode.
