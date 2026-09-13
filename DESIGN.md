# DESIGN.md — leaguesapp

Design authority. **Floodlight** — a matchday-night identity, not a generic
dark SaaS shell. Palestinian Arabic RTL. Mode: **Operate** — players and
admins completing tasks (register, manage a team, enter a result). This
replaces the DESIGN v1 flat-emerald system; the old tokens are gone, not
kept for compatibility.

## Why Floodlight

The old system was safe-dark: one flat green on one flat navy, no texture,
no scale, no device that says "football at night" instead of "generic
admin panel." Floodlight borrows from what a real matchday actually looks
like after dark: a near-black pitch, a hot sodium-vapor floodlight glow
pooling from above, scoreboard-bold numerals for anything that's a score or
a count, and a small clipped-corner scoreboard-dot marking every section
heading instead of a card border or an eyebrow label. (A left-border accent
bar was the first attempt and got caught by the design detector as the
generic AI side-tab tell — replaced, not softened.) Money gets its own
color (gold) because a payment is a different kind of fact than a score.

## Tokens

Defined in `src/app/globals.css` as CSS variables, mirrored into Tailwind
v4 `@theme` (`bg-surface`, `text-text-dim`, `rounded-app`, etc). Every value
below is new — nothing carries over from DESIGN v1's flat `#10b981`/`#0f172a`
pair.

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#05070a` | page background — near-black, cooler than v1 |
| `--surface` | `#111822` | cards, inputs, raised panels |
| `--surface-2` | `#182130` | hover fills, nested surfaces, table zebra |
| `--border` | `#232c3a` | default hairline |
| `--border-strong` | `#3a465c` | input borders, dividers that must read |
| `--text` | `#f4f7fb` | primary text |
| `--text-dim` | `#93a1b8` | labels, secondary text, placeholders (≥4.5:1 on canvas and surface) |
| `--pitch` | `#22e08a` | primary action, links, focus ring, the "on" state — brighter/more saturated than v1's accent |
| `--pitch-ink` | `#03170d` | text on a `--pitch` fill |
| `--gold` | `#ffb020` | money: amounts, payment confirmations, the player-card accent |
| `--gold-ink` | `#241300` | text on a `--gold` fill |
| `--amber` | `#f5a524` | warnings, unscheduled/incomplete states (distinct from `--gold` — a warning is not a payment) |
| `--rose` | `#ff5a72` | errors, destructive |
| `--radius` → `rounded-app` | `0.85rem` | standard controls, cards |
| `--radius-sharp` | `0` with a `12px` corner cut (clip-path) | scoreboard chips, section-header tags — the jersey-stripe device, never on form controls |
| `--tap` | `2.75rem` (44px) | minimum interactive height |

Match/table semantics: `--win`/`--draw`/`--loss` = `--pitch`/`--text-dim`/`--rose`.
`--paid` = `--pitch`, `--owed` = `--gold` (was `--unpaid`/amber in v1 — money
owed is a gold fact, not a warning).

## Floodlight texture

`body` carries a fixed radial-gradient glow (`--pitch` at 6% opacity,
centered top) plus a 2%-opacity SVG noise layer (`.floodlight-grain` utility,
data-URI, no asset file) — this is what stops the canvas from reading as flat
black. Both are decorative layers behind content, `pointer-events: none`.

## Type

- Body: IBM Plex Sans Arabic (unchanged family — it's a real Arabic text
  face, not the problem). Weight 400/500 for body, 600 for labels.
- **Display/scoreboard**: IBM Plex Sans Arabic 700 at display sizes with
  tight tracking (`-0.02em`) and `.tabular` — used for the app wordmark,
  page H1s, and anywhere a number is the point (scores, points column,
  goal tallies, player-card stats). This is a *scale and weight* device, not
  a new font import — a second Arabic face big enough to read as "display"
  risks a broken build for a gain the existing 700 weight already delivers
  at the right size.
- Fluid display: `clamp(2rem, 5vw, 3.25rem)` for page H1s (was
  `clamp(1.8rem, 4vw, 2.5rem)` in v1 — bigger, more scoreboard).

## Browser surfaces

Themed in `globals.css`: `::selection` (pitch tint), `::placeholder` (dim),
`:focus-visible` (2px pitch outline, 2px offset), caret (pitch), scrollbar
(border-strong thumb on canvas). `.tabular` on every numeral in a tabular
context — scores, standings, money, phone numbers. Western digits always.

## Components

`src/components/ui/` — hand-rolled, no shadcn until a dialog/select/combobox
is actually needed.

| Component | File | Notes |
|---|---|---|
| `Button` / `buttonClasses(variant, className)` | `button.tsx` | variants `accent` (pitch fill) \| `gold` (money actions — confirm payment) \| `outline` \| `ghost`; min 44px; `active:scale-[0.97]`; accent variant carries a soft pitch glow shadow. |
| `Field` | `field.tsx` | label + input as one unit; `dir` defaults to document RTL, pass `dir="ltr"` for phone/number/money values; optional `hint`. |
| `ScoreboardTag` | `scoreboard-tag.tsx` | the jersey-stripe device: a clipped-corner chip for a status/round/points value that should read as scoreboard, not as a badge-library pill. |
| `StatBlock` | `stat-block.tsx` | one big tabular number + a label under it, no icon, no card border — the player-card and admin dashboard building block. |

## Layout conventions

- Auth and other single-column task screens: `max-w-sm`, centered, `p-6`,
  `gap-8` between blocks. A floodlight glow sits behind the wordmark, not a
  plain heading.
- RTL: logical properties only (`ms-`/`me-`/`ps-`/`pe-`/`start`/`end`). LTR
  islands (`dir="ltr"`) for phone numbers and scores.
- Mobile-first. Authenticated shell (once a user is logged in): fixed top
  bar with backdrop blur, right drawer for nav, fixed bottom nav on mobile
  with safe-area insets.
- High-density tables over card grids for standings, fixtures, rosters —
  unchanged from v1, still correct for this content.
- Section headings use the scoreboard-dot device (`.stripe-heading` — a
  small clipped-corner `--pitch` marker inline before the heading text)
  instead of a card border or an eyebrow label above the heading.

## Not this

No card walls (same-size icon+heading+text tiles as page structure). No
eyebrows/kickers. No gradient text. No glass-as-decoration. No emoji
standing in for icons — when an icon system is needed, a real library in
one consistent stroke. No flat single-tone backgrounds — every full-bleed
surface carries the floodlight glow or grain. No soft pastel warning color
standing in for a money fact — gold is money, amber is a warning, they are
never interchangeable again.
