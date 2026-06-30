# DESIGN.md — MERU

**MERU** — *Multi-project Ecosystem for Reporting & Unification.*
The design reference for the front end. **Light mode first; dark mode is a black + blue overlay (§3, §13).**

In Javanese cosmology Mount Meru is the center of the universe, and every candi is engineered as a physical replica of it — a structure you ascend in ordered tiers, laid out on a mandala plan, read as a whole from above. MERU is the consultant's summit: the central core with a 360° view of the entire project universe.

> **The governing rule: this is a utility dashboard, not a monument.** Heritage is the *soul*, never the *skin*. It shows up in palette, proportion, and one motif — things felt before they're noticed. The surface stays minimal, precise, and quiet so the data is always the loudest thing on screen. If a heritage touch makes the data harder to read, it is wrong and gets removed.

---

## 1. Principles

**Summit View — overview first.** You begin at the peak with the portfolio scan and *descend* into detail (Portfolio → Project → BoQ → Item). Altitude is the product's core spatial logic; the chrome always makes "where am I on the mountain" legible.

**Terraced hierarchy.** Like a candi's ascending terraces, each altitude has its own density. The summit is calm and signal-only (status, deviation, what needs you). Lower terraces — item-level BoQ, progress entry — are dense and carved. Density increases as you descend, never the reverse.

**Carved clarity.** The reliefs are the model for data: ordered, precise, legible up close. Numbers are sacred here — quantities, deviation, money — so tabular figures and exact alignment are non-negotiable.

**Stone & light.** A grounded cool-andesite foundation; light used sparingly for emphasis. Calm, matte, trustworthy.

**Axial order.** Mandala discipline — a strong grid, balanced layouts, a clear central spine. Order *is* the brand.

### What MERU is not (restraint guardrails)

- No stone/marble textures, no background imagery, no gradients-as-decoration.
- No temple or candi photographs or literal silhouettes in the working UI.
- No batik or carved-border ornament around content.
- No gold in functional UI — gold belongs to the brand mark only.
- Heritage is expressed **only** through: the andesite palette, the lapis/gold brand, axial proportion, and the single terrace motif (§2, §10).
- Density and legibility win every tie.

---

## 2. Brand

**Wordmark.** `MERU` set in the display weight of the UI face, tight tracking, sentence of the product never abbreviated in body copy. Pairs with the mark; never stretched, recolored per-screen, or placed on busy fields.

**The mark — *the Terrace* (the one signature).** An abstract stepped pyramid / mandala glyph: three to five ascending terraces reducing to a peak, readable at 16px. This is the single place identity is "spent." It appears in: the top-bar logo, the loading state (terraces settling upward), empty states, and the **altitude indicator** in the breadcrumb (§7.2) where the active level is the lit terrace. Nowhere else.

**Gold rule.** The summit gold (`--gold-500`) is reserved for the mark and the wordmark only. It is never a button, link, status, or hover color. This keeps it special and keeps the UI quiet.

**Voice.** Calm, precise, expert. Sentence case, active voice, plain verbs. Indonesian domain terms of art are kept even in English UI (*bobot, deviasi, kurva-S, opname, RAB*) — they are the vocabulary consultants actually use. See §12.

---

## 3. Color — light

**Direction.** Foundation in *andesite*: cool, near-neutral greys with a faint blue undertone — the stone the candi are carved from. Deliberately **not** warm cream. Against it, two heritage notes used with discipline: **lapis** (the sacred blue of the cosmos around Meru) as the single brand/interactive color, sitting cleanly outside the red-amber-green status space; and **summit gold** for the mark alone. Status uses its own muted, earthen ramp so warnings and brand are never confused.

### Neutrals — andesite

| Token | Hex | Use |
|---|---|---|
| `--stone-0`   | `#FFFFFF` | Elevated surfaces (cards, menus) |
| `--stone-50`  | `#F7F8F9` | App background |
| `--stone-100` | `#EEF0F2` | Subtle fill / row hover |
| `--stone-200` | `#E2E5E9` | Hairlines, table rules |
| `--stone-300` | `#CBD0D6` | Borders, dividers |
| `--stone-400` | `#9AA1AA` | Muted text, icons, disabled |
| `--stone-500` | `#6E757E` | Secondary text |
| `--stone-600` | `#4E545C` | Body text |
| `--stone-700` | `#373C43` | Headings |
| `--stone-800` | `#262A30` | Strong headings |
| `--stone-900` | `#171A1E` | Primary text (andesite near-black) |

### Brand — lapis (interactive) + summit gold (mark only)

| Token | Hex | Use |
|---|---|---|
| `--lapis-50`  | `#EDF0F7` | Selected-row tint, focus halo bg |
| `--lapis-100` | `#D6DCEC` | Subtle brand fill |
| `--lapis-300` | `#8290C4` | Disabled brand |
| `--lapis-500` | `#3B4C86` | Links, brand accents |
| `--lapis-600` | `#2E3C6B` | Primary button, active nav |
| `--lapis-700` | `#243154` | Pressed / active |
| `--gold-500`  | `#B0873B` | **Mark & wordmark only** |

### Status — muted earthen ramp (schedule signaling)

Each status is a hue **plus** a required shape and label (§3, colorblind safety). `-fg` is text/icon on light surfaces; `-bg`/`-bd` make the pill.

| Status | Shape | `-fg` | `-bg` | `-bd` |
|---|---|---|---|---|
| Ahead     | ▲ | `#1F6473` (teal)  | `#E0EEF0` | `#B3D5DB` |
| On track  | ● | `#3F6F46` (sage)  | `#E6F0E7` | `#BFD8C2` |
| At risk   | ◆ | `#9C6B12` (ochre) | `#F7EEDA` | `#E8D3A6` |
| Behind    | ▼ | `#A23A2A` (clay)  | `#F7E7E3` | `#E6C3BB` |
| No data   | – | `#6E757E` (stone) | `#EEF0F2` | `#E2E5E9` |

### Chart colors

| Role | Token | Treatment |
|---|---|---|
| Planned line | `--stone-400` | 1.5px, solid, calm grey |
| Actual line | `--lapis-600` | 2px, solid; stops at `data_date` |
| Deviation fill | status `-fg` @ 10% | tinted by sign (sage ahead / clay behind) |
| Data-date marker | `--stone-300` | 1px vertical hairline + dot |
| Gridlines | `--stone-200` | hairline, horizontal only |

**Rules.** Body text uses `--stone-600/700/900` on `--stone-0/50` (all ≥ WCAG AA). Status color is **never** the only signal — always shape + label too. Lapis is the only interactive color; gold never enters functional UI.

### Color — dark (black + blue)

**Direction.** A near-black ground with a faint **blue** undertone — andesite at night, not neutral charcoal. The app background is the darkest layer; cards and panels lift one step toward blue-black so the same elevation logic reads as in light. **Lapis brightens** to become the legible blue accent (links, primary, active nav, metric values); **gold brightens** for the mark. Crucially, the **status ramp stays in place** — teal/sage/ochre/clay are lightened ~15% for the dark ground but keep their hue and meaning, so *ahead / on track / at risk / behind* read normally and never collapse into the blue. Same token names as light; only the values change under `.dark` (§13).

| Role | Light | Dark |
|---|---|---|
| App background | `--stone-50` near-white | `#080A11` blue-black |
| Card / elevated | `#FFFFFF` | `#11151F` |
| Primary text | `#171A1E` | `#EFF1F8` |
| Lapis accent (`--lapis-600`) | `#2E3C6B` | `#4E63BE` |
| Lapis text/link (`--lapis-500/700`) | `#3B4C86` | `#8295E2` / `#6377CC` |
| Mark gold (`--gold-500`) | `#B0873B` | `#CBA15A` |
| Status — still vivid | teal/sage/ochre/clay | lightened ~15%, same hues |

Dark mode is class-toggled (`.dark` on `<html>`); the toggle lives in the top bar.

---

## 4. Typography

**Families.** A humanist sans for everything UI, paired with a legible mono for data — soft, modern letterforms over a mechanical face, so the dashboard reads as approachable rather than cold.

- `--font-sans: "Plus Jakarta Sans"` — all UI text and headings. Rounded, humanist, and Indonesian-designed, so it quietly fits MERU's heritage without any ornament.
- `--font-mono: "JetBrains Mono"` — all numeric data: BoQ quantities, weights, deviation, money, chart axes, table number columns. Friendly, even-width digits with strong tabular alignment.
- No third voice — the wordmark and summit titles come from the sans at display weight, not a serif.

The display register comes from **weight, size, and tracking of the sans**, not a decorative face. That is the minimal, precise choice this brief asks for.

### Scale (dense-utility tuned)

| Token | Size / line-height | Use |
|---|---|---|
| `--text-2xs` | 11 / 16 | Micro-labels, eyebrows (uppercase, +0.04em) |
| `--text-xs`  | 12 / 16 | Dense table cells, captions |
| `--text-sm`  | 13 / 20 | Default table/body in dense views |
| `--text-base`| 14 / 22 | Body |
| `--text-md`  | 16 / 24 | Section labels |
| `--text-lg`  | 18 / 26 | Card titles |
| `--text-xl`  | 22 / 30 | Page titles |
| `--text-2xl` | 28 / 36 | Summit titles |
| `--text-3xl` | 36 / 44 | Hero metric (rare; e.g. headline deviation) |

**Weights:** 400 regular, 500 medium (UI emphasis, headings), 600 semibold (page/summit titles). Avoid 700+ outside the wordmark.
**Tracking:** −0.01 to −0.02em on `xl`+; normal on body; +0.04em on uppercase micro-labels.
**Numerals:** `font-variant-numeric: tabular-nums` everywhere numbers align; mono for all data columns and key metrics so digits never dance.

---

## 5. Spacing, grid & layout

**Base unit 4px.** `--space-1..16`: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Compose layouts from these only.

**Grid.** 12 columns, 24px gutters, dashboard container max ~1440px; dense tables run full content width. The **spine** (left nav) is fixed; content is the terraced plane to its right.

**Terraced density.** Summit views breathe (generous `--space-6/8`, few elements, large signal). As you descend, spacing tightens (`--space-2/3`) and information density rises. The visual rhythm itself tells you your altitude.

### Layout — summit (portfolio)

```
┌──────────────────────────────────────────────────────────────┐
│ ▚ MERU            Portfolio                      ⌕  ◷  ⚙  ◑   │  top bar
├────────┬─────────────────────────────────────────────────────┤
│        │  Portfolio · 24 projects        [client ▾] [status ▾]│
│ ◆ Port │ ─────────────────────────────────────────────────── │
│ ◷ Recent  ▌Behind (3)                                         │
│ ◳ Clients   Gedung E   PT X   −6.8%  SPI 0.86  ▼ behind  ╱╲╱ │
│        │    Track TDE  PT Y   −5.2%  SPI 0.88  ▼ behind  ╱╲  │
│ spine  │  ▌On track (18) …                                    │
│        │  ▌Ahead (3) …                                        │
└────────┴─────────────────────────────────────────────────────┘
```

### Layout — project detail (descended one terrace)

```
┌──────────────────────────────────────────────────────────────┐
│ ▚ MERU   Portfolio ▸ ▦▦ Gedung H            ⌕  ◷  ⚙  ◑        │  altitude breadcrumb
├────────┬─────────────────────────────────────────────────────┤
│ spine  │ Gedung H · PT X       ▲ ahead  +10.78%   as of 5 Dec │
│        │ ┌──────────────────────────┐ ┌───────────────────┐  │
│        │ │  KURVA-S (hero)          │ │ planned    8.77%  │  │
│        │ │  planned · actual · dev  │ │ actual    19.55%  │  │
│        │ └──────────────────────────┘ │ deviasi  +10.78%  │  │
│        │ BoQ progress     Top laggards└───────────────────┘  │
│        │ [tree table · tabular nums · hairline rules]         │
└────────┴─────────────────────────────────────────────────────┘
```

---

## 6. Elevation & material

Light mode is **flat and paper-like**: structure comes from hairline borders, not shadow. Shadows are reserved for things that genuinely float.

| Token | Value | Use |
|---|---|---|
| `--elev-0` | none + `1px var(--stone-200)` border | Cards, panels, tables |
| `--elev-1` | `0 1px 2px rgba(23,26,30,.06)` | Subtle lift (hover, sticky header) |
| `--elev-2` | `0 2px 8px rgba(23,26,30,.08)` | Menus, popovers |
| `--elev-3` | `0 8px 24px rgba(23,26,30,.12)` | Modals, command palette |

**Radius:** `--radius-sm 4`, `--radius-md 6`, `--radius-lg 8`, `--radius-full 999` (status pills, avatars only). Modest, slightly squared — architectural, not soft.

---

## 7. Components

### 7.1 Spine (left nav)
The axis mundi. Quiet, fixed, icon + label. Active item marked by a lapis left-edge bar and `--lapis-600` label — no fills. Collapsible to icons.

### 7.2 Altitude breadcrumb (signature, functional)
Replaces a generic breadcrumb. Shows depth on the mountain with the terrace glyph filling as you descend: `Portfolio ▸ ▦ Client ▸ ▦▦ Project ▸ ▦▦▦ BoQ`. The lit terraces = current altitude. Every segment is a link back up.

### 7.3 Terrace card / panel
Flat, `--stone-0`, hairline border, `--radius-md`, `--space-5` padding. Optional `--text-2xs` uppercase eyebrow. No drop shadow at rest.

### 7.4 Data table (the workhorse)
`--text-sm`, mono tabular numbers right-aligned, text left-aligned. Hairline row rules (`--stone-200`), no heavy zebra. Sticky header (`--elev-1`). Tree rows (BoQ) indent with a thin guide line; weight and progress columns mono. Numeric columns get a subtle leading space, never wrap.

### 7.5 Status pill
`-bg` + `-bd` + `-fg`, shape glyph + label, `--radius-full`, `--text-xs`. Always shape + word, never color alone.

### 7.6 Buttons
- **Primary:** `--lapis-600` bg, white text; hover `--lapis-700`.
- **Secondary:** `--stone-0` bg, `--stone-300` border, `--stone-700` text.
- **Ghost:** transparent, `--stone-600` text, `--stone-100` hover.
- **Destructive:** clay `-fg` text/border, used sparingly.
Sentence-case verbs that name the result ("Approve period", not "Submit").

### 7.7 Inputs
`--stone-0` bg, `--stone-300` border, `--radius-sm`. Focus: 2px `--lapis-600` ring on `--lapis-50` halo. Errors: clay border + a directive message below (§12).

### 7.8 Metric block
Label `--text-2xs` uppercase stone-500; value `--text-2xl/3xl` mono stone-900; delta as a small status-colored shape+number. The summit's primary signal.

---

## 8. Data visualization

The **kurva-S is the hero artifact** and gets the most craft; everything else is supporting.

**S-curve.** Two lines — planned (`--stone-400`, solid) and actual (`--lapis-600`, solid) — over a light horizontal grid. Deviation shown as a low-opacity fill between them, tinted sage when ahead and clay when behind. The actual line **stops at `data_date`** (a `--stone-300` vertical hairline marks it); it never drops to zero past the last reported period. X-axis = period end dates, Y = cumulative %, both mono. No legend clutter — label the two line ends directly.

**Portfolio scan.** A calm, sortable table grouped by status band (Behind first — surface problems at the summit). Each row: project, client, deviation, SPI, status pill, and a tiny sparkline of the S-curve. Default sort puts the most-behind on top.

**Restraint rules.** No 3-D, no pie charts, no chartjunk, no decorative gradients. Maximum two series + one fill per chart. Status colors in charts match §3 exactly. Every chart has a one-line, plain-language caption stating what the reader should take away.

---

## 9. Motion

Stone has mass: motion is calm and weighted, never bouncy.

| Token | Value |
|---|---|
| `--dur-fast` | 120ms |
| `--dur-base` | 180ms |
| `--dur-slow` | 240ms |
| `--ease-standard` | `cubic-bezier(.2, 0, 0, 1)` |

**Altitude transitions.** Descending into a project: the new terrace settles in with a small upward translate (8–12px) + fade at `--dur-slow`. Ascending reverses it. Hovers and state changes use `--dur-fast`. Nothing animates longer than 240ms. **`prefers-reduced-motion` removes all translate/fade and keeps instant state changes.**

---

## 10. Iconography & shape language

Line icons, consistent 1.5px stroke, geometric, squared joins — engineered, not rounded-friendly. One icon set throughout.

**The terrace motif** is the only ornamental shape, and only in its sanctioned places (§2): logo, loading, empty states, the altitude indicator. It never becomes a background, watermark, divider pattern, or section decoration.

---

## 11. Accessibility & bilingual

- **Contrast:** all text meets WCAG AA; interactive and status text verified on their actual backgrounds.
- **Colorblind-safe status:** color is always paired with a distinct shape (▲ ● ◆ ▼ –) and a text label. The dashboard is fully readable in greyscale.
- **Focus:** visible `--lapis-600` focus ring on every interactive element; full keyboard navigation; 40px minimum touch targets.
- **Bilingual (ID / EN):** never hardcode element widths to English — Indonesian strings run longer. Numbers and dates format by locale (`1.234,56` / `5 Des 2025` in ID). Domain terms of art stay Indonesian in both languages (*bobot, deviasi, kurva-S, opname*).

---

## 12. Voice & copy

- Sentence case, active voice, plain verbs. Name things by what the user controls, not how the system works.
- An action keeps its name through the whole flow: a button "Approve period" produces a toast "Period approved."
- **Errors** state what happened and how to fix it, in the interface's voice — never apologetic, never vague: *"This period is locked. Reopen it to edit progress."*
- **Empty states** invite the next action: *"No projects yet. Create your first project to start tracking progress."*

---

## 13. Tokens reference

Light is the base. Dark is a `.dark` overlay that overrides **only the raw scale** (`--stone-*`, `--lapis-*`, `--gold-500`, `--status-*`, `--stone-tint`); every semantic token (`--background`, `--card`, `--primary`, …) references the raw scale via `var()`, so all surfaces, text and borders cascade with no component changes.

```css
:root {
  /* neutrals — andesite */
  --stone-0:#FFFFFF; --stone-50:#F7F8F9; --stone-100:#EEF0F2; --stone-200:#E2E5E9;
  --stone-300:#CBD0D6; --stone-400:#9AA1AA; --stone-500:#6E757E; --stone-600:#4E545C;
  --stone-700:#373C43; --stone-800:#262A30; --stone-900:#171A1E;

  /* brand */
  --lapis-50:#EDF0F7; --lapis-100:#D6DCEC; --lapis-300:#8290C4;
  --lapis-500:#3B4C86; --lapis-600:#2E3C6B; --lapis-700:#243154;
  --gold-500:#B0873B; /* mark only */

  /* surfaces & text */
  --bg:var(--stone-50); --surface:var(--stone-0);
  --text:var(--stone-900); --text-secondary:var(--stone-500); --text-muted:var(--stone-400);
  --border:var(--stone-200); --border-strong:var(--stone-300);
  --link:var(--lapis-600); --focus:var(--lapis-600);

  /* status (fg / bg / border) */
  --status-ahead-fg:#1F6473; --status-ahead-bg:#E0EEF0; --status-ahead-bd:#B3D5DB;
  --status-ok-fg:#3F6F46;    --status-ok-bg:#E6F0E7;    --status-ok-bd:#BFD8C2;
  --status-risk-fg:#9C6B12;  --status-risk-bg:#F7EEDA;  --status-risk-bd:#E8D3A6;
  --status-behind-fg:#A23A2A;--status-behind-bg:#F7E7E3;--status-behind-bd:#E6C3BB;
  --status-none-fg:#6E757E;  --status-none-bg:#EEF0F2;  --status-none-bd:#E2E5E9;

  /* chart */
  --chart-planned:var(--stone-400); --chart-actual:var(--lapis-600);
  --chart-grid:var(--stone-200); --chart-datedate:var(--stone-300);

  /* type */
  --font-sans:"Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
  --font-mono:"JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
  --text-2xs:11px; --text-xs:12px; --text-sm:13px; --text-base:14px; --text-md:16px;
  --text-lg:18px; --text-xl:22px; --text-2xl:28px; --text-3xl:36px;
  --fw-regular:400; --fw-medium:500; --fw-semibold:600;

  /* spacing */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:20px;
  --space-6:24px; --space-8:32px; --space-10:40px; --space-12:48px; --space-16:64px;

  /* radius & elevation */
  --radius-sm:4px; --radius-md:6px; --radius-lg:8px; --radius-full:999px;
  --elev-1:0 1px 2px rgba(23,26,30,.06);
  --elev-2:0 2px 8px rgba(23,26,30,.08);
  --elev-3:0 8px 24px rgba(23,26,30,.12);

  /* motion */
  --dur-fast:120ms; --dur-base:180ms; --dur-slow:240ms;
  --ease-standard:cubic-bezier(.2, 0, 0, 1);
}
```

**Dark overlay** — black + blue. Only the raw scale is restated; semantics cascade.

```css
.dark {
  /* andesite at night — blue-black neutrals */
  --stone-tint:#080A11; /* app background */
  --stone-50:#0B0E16; --stone-0:#11151F; --stone-100:#1A1F2D; --stone-200:#262C3D;
  --stone-300:#323A4F; --stone-400:#5E6680; --stone-500:#828BA3; --stone-600:#A7AFC4;
  --stone-700:#C7CDDB; --stone-800:#DFE3EC; --stone-900:#EFF1F8;

  /* lapis brightens to the blue accent; gold brightens for the mark */
  --lapis-50:#151C32; --lapis-100:#1E2A4C; --lapis-300:#41538C;
  --lapis-500:#8295E2; --lapis-600:#4E63BE; --lapis-700:#6377CC;
  --gold-500:#CBA15A;

  /* status stays vivid (lightened ~15%, same hues) */
  --status-ahead-fg:#5CB0BF; --status-ahead-bg:#0E2A30; --status-ahead-bd:#1F4A53;
  --status-ok-fg:#6FB97D;    --status-ok-bg:#122719;    --status-ok-bd:#274A30;
  --status-risk-fg:#D8A646;  --status-risk-bg:#2A2210;  --status-risk-bd:#4D4019;
  --status-behind-fg:#E58368;--status-behind-bg:#2C1714;--status-behind-bd:#522A22;
  --status-none-fg:#8B93A8;  --status-none-bg:#1A1F2D;  --status-none-bd:#2A3142;
}
```

---

## 14. Out of scope / next

- **Component library** — codify §7 as real components against these tokens.
- **The Terrace mark** — produce the actual SVG (logo, favicon, loading, empty-state lockups).
- **Charting implementation** — the kurva-S as a reusable component matching §8.