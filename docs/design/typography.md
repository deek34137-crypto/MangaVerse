# Inkline Typography

This document specifies the font pairings, scale, and typographic rules for MangaHub.

## Typefaces

| Role | Font Family | Source | Pairing & Notes |
|---|---|---|---|
| **Display** | **Fraunces** | Google Fonts (Serif) | Headline font, series titles, major section headers. Used at optical size ≥ 32px with slight negative tracking. |
| **Body** | **Inter** | Google Fonts (Sans) | UI copy, descriptions, navigation, labels. **Intentional Deviation:** The spec suggests General Sans; however, Inter is mapped as the `--font-sans` to avoid external Fontshare API calls/dependencies and maintain high performance. |
| **Utility / Data** | **JetBrains Mono** | Google Fonts (Mono) | Chapter numbers, volume counts, timestamps, read progress statistics, and table figures. |

---

## Heading Scale

| Token | CSS / Tailwind | Size | Weight | Line-height | Tracking | Notes |
|---|---|---|---|---|---|---|
| `h1` | `text-4xl md:text-5xl font-display` | 48px (34px mobile) | 600 | 1.1 | −0.02em | Main page titles, hero headers |
| `h2` | `text-3xl md:text-4xl font-display` | 36px (28px mobile) | 600 | 1.15 | −0.01em | Section headers |
| `h3` | `text-2xl md:text-3xl font-display` | 28px (22px mobile) | 600 | 1.2 | −0.01em | Subsections, cards |
| `h4` | `text-xl font-display` | 22px | 600 | 1.3 | 0 | Dialog titles, small cards |
| `h5` | `text-lg font-sans font-semibold` | 18px | 600 | 1.4 | 0 | Sub-headers in sidebars |
| `h6` | `text-sm font-sans font-semibold uppercase`| 15px | 600 | 1.4 | 0.01em | Small caps grouping labels |

---

## Body Scale

| Token | Tailwind | Size | Weight | Line-height | Color (Default) |
|---|---|---|---|---|---|
| `body-large` | `text-lg` | 18px | 400 | 1.6 | `ink-200` |
| `body-default`| `text-base` | 15px | 400 | 1.6 | `ink-200` / `ink-50` |
| `body-small` | `text-sm` | 13px | 400 | 1.5 | `ink-200` |
| `caption` | `text-xs text-ink-400` | 12px | 500 | 1.4 | `ink-400` |

---

## Typographic Rules

1. **Use Fraunces sparingly:**
   - Limit serif display typography to true titles and display heads. Standard UI elements, buttons, inputs, and short descriptions must use `General Sans` (fallback: standard `sans-serif` or system sans).
2. **Ledger-style numbers:**
   - Any numbers, counts, progress fractions (e.g. `24/180`), and duration tags must be rendered using `JetBrains Mono` for a precise, "ledger-entry" look.
3. **Contrast and hierarchy:**
   - Primary text is `#F4F2EC` (`ink-50`), secondary is `#A8A8AE` (`ink-200`), and muted text is `#6E6E76` (`ink-400`). Ensure visual hierarchy matches document semantics.
