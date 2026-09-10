# DESIGN.md — leaguesapp

Design authority. Dark-first, emerald, Palestinian Arabic RTL. Mode: **Operate** — players and admins completing tasks (register, manage a team, enter a result). Brand lives in precise details, not decoration.

## Tokens

Defined in `src/app/globals.css` as CSS variables and mirrored into Tailwind v4 `@theme` (use the utility, e.g. `bg-surface`, `text-text-dim`, `rounded-app`).

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#070b12` | page background |
| `--surface` | `#0f172a` | cards, inputs, raised panels |
| `--surface-2` | `#131c31` | hover fills, nested surfaces |
| `--border` | `#1e293b` | default hairline |
| `--border-strong` | `#2b3a52` | input borders, dividers that must read |
| `--text` | `#e8ecf3` | primary text |
| `--text-dim` | `#9fb0c5` | labels, secondary text, placeholders (≥4.5:1 on canvas and surface) |
| `--accent` | `#10b981` | primary actions, links, focus ring, selection |
| `--accent-ink` | `#04140d` | text on an accent fill |
| `--amber` | `#f59e0b` | warnings, pending money |
| `--rose` | `#fb7185` | errors, destructive (lightened from DESIGN v1 `#f43f5e` for contrast on `--canvas`) |
| `--radius` → `rounded-app` | `0.7rem` | all corners |
| `--tap` | `2.75rem` (44px) | minimum interactive height |

## Browser surfaces

Themed in `globals.css`, not left to defaults: `::selection` (accent tint), `::placeholder` (dim), `:focus-visible` (2px accent outline, 2px offset), caret (accent), scrollbar (border-strong thumb on canvas). Numerals in any tabular context get `.tabular` (`font-variant-numeric: tabular-nums`) — scores, standings, phone numbers, money. Western digits always.

## Components

`src/components/ui/` — hand-rolled, no shadcn until a dialog/select/combobox is actually needed.

| Component | File | Notes |
|---|---|---|
| `Button` / `buttonClasses(variant, className)` | `button.tsx` | variants `accent` \| `outline` \| `ghost`; min 44px; `active:scale-[0.98]`. Use `buttonClasses` to style a `<Link>` as a button. |
| `Field` | `field.tsx` | label + input as one unit; `dir` defaults to document RTL, pass `dir="ltr"` for phone/number values; optional `hint`. |

## Layout conventions

- Auth and other single-column task screens: `max-w-sm`, centered, `p-6`, `gap-8` between blocks.
- RTL: logical properties only (`ms-`/`me-`/`ps-`/`pe-`/`start`/`end`). LTR islands (`dir="ltr"`) for phone numbers and scores.
- Mobile-first. DESIGN v1 mobile chrome (fixed top bar with backdrop blur, right drawer, fixed bottom nav, safe-area insets) applies once the app has authenticated navigation — slice 1+.
- Fluid display headings: `clamp(1.8rem, 4vw, 2.5rem)`.

## Not this

No card walls (same-size icon+heading+text tiles as page structure). No eyebrows/kickers. No gradient text. No glass-as-decoration. No emoji standing in for icons — when an icon system is needed, a real library in one consistent stroke. High-density tables over card grids for standings, fixtures, rosters.
