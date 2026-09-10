# DESIGN.md — leaguesapp Design System & Authority

## Responsive Mobile 10/10 UX
- **Mobile Navigation:**
  - Fixed mobile top bar with backdrop blur (`rgba(11, 17, 32, 0.92)`).
  - Sliding right drawer with backdrop overlay for full navigation access.
  - Fixed mobile bottom navigation bar (`position: fixed; bottom: 0;`) for instant 1-tap jump to core sections.
  - Safe area inset handling (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
- **Touch Ergonomics:** Minimum tap targets `44px x 44px`.
- **Fluid Typography:** `clamp(1.8rem, 4vw, 2.5rem)` headers with zero horizontal scroll overflow.

## Craft Authority & Directives
- **Zero AI Slop:** No card walls. High-density data tables, dense code blocks, and interactive simulators.
- **Theme Palette:** Dark-first canvas (`#070b12`), surface (`#0f172a`), border (`#1e293b`).
- **Primary Accent:** Emerald (`#10b981`).
- **Secondary Accents:** Warm Amber (`#f59e0b`), Rose (`#f43f5e`).
- **Language & Numbers:** Palestinian dialect (`ar.json`), RTL (`dir="rtl"`), Western digits (1, 2, 3) with `tabular-nums`.
