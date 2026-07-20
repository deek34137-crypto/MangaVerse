# Inkline Components Guide

This document defines the interface design and interactive states of MangaHub's core components.

---

## Buttons

| State | Primary Variant | Secondary Variant | Ghost / Outline Variant |
|---|---|---|---|
| **Base** | Fill: `vermilion-500`<br>Text: `ink-50` | Fill: `ink-800`<br>Border: 1px `ink-700`<br>Text: `ink-50` | Fill: transparent<br>Border: None / Hairline `ink-700`<br>Text: `ink-200` |
| **Hover** | +8% lightness on Vermilion | Fill: `ink-700`<br>Text: `ink-50` | Border/bg becomes `ink-700`<br>Text: `ink-50` |
| **Pressed** | Fill: `vermilion-600` | Fill: `ink-600` | Fill: `ink-600` |
| **Focus** | 2px `vermilion-500` outline, 2px offset | 2px `vermilion-500` outline, 2px offset | 2px `vermilion-500` outline, 2px offset |
| **Disabled** | 40% opacity, ignore interaction | 40% opacity, ignore interaction | 40% opacity, ignore interaction |

### Dimensions:
- **Height (Default):** 40px, padding 16px horizontal
- **Height (Small):** 32px, padding 12px horizontal
- **Height (Large):** 48px, padding 24px horizontal
- **Corner Radius:** `radius-sm` (8px)
- **Active Click Effect:** 2% scale-down on click (`active:scale-[0.98]`).

---

## Cards (Media, Collection, Stat)

- **Base Surface:** `ink-900`, border 1px `ink-700`, border-radius `radius-md` (12px), shadow `shadow-sm`.
- **Media Cover Art:** Always fixed at 2:3 aspect ratio, `object-fit: cover`, overflow hidden.
- **Hover Micro-interaction:**
  - Card lifts 2px up (`translate-y-[-2px]`).
  - Shadow transitions to `shadow-md`.
  - Cover art scales up slightly to 1.02 within its clipped frame.
  - Transition: 160ms ease-out (`transition-transform duration-160 ease-out`).

---

## Inputs (Text, Search, Textarea, Select)

- **Base:** Height 40px, fill `ink-800`, border 1px `ink-700`, radius `radius-xs` (4px). Text is `ink-50`, placeholder is `ink-400`.
- **Focus State:** Border transitions to `vermilion-500` smoothly. No outer glow or drop shadows allowed.
- **Error State:** Border becomes `#E5636E` (semantic danger). Error explanation text appears directly below in the same color.
- **Disabled State:** Fill becomes `ink-900`, text and border fall to `ink-600`. Cursor set to not-allowed.

---

## Modals

- **Dimensions:** Width 480px (default), 640px (large), full width (90vw) on mobile. Padding 32px.
- **Surface:** `ink-900`, border 1px `ink-700`, radius `radius-lg` (16px), shadow `shadow-modal`.
- **Entrance Animation:** Fades in and scales up from 0.98 to 1.0 (`duration-180 ease-out`).
- **Backdrop:** Background is `ink-950` at 60% opacity with `backdrop-filter: blur(8px)`.
- **Dismissal Rules:** Escape key, clicking outside (backdrop click), and clicking an explicit close icon in the top right must all close the modal.

---

## Navigation Elements

- **Header / Top Nav (Desktop):** Height 64px, static background `ink-900`, hairline border bottom `ink-700`.
- **Mobile Bottom Nav:** Height 56px, background `ink-900` with top border `ink-700`. Home, Search, Library, and Profile icons mapped horizontally.
- **Active Navigation States:** Marked by a single Vermilion text/icon highlight or a subtle vermilion underlines. Never use vermilion fills for backgrounds of buttons in nav bars.

---

## States

### Loading States
- **Skeletons:** Match the exact dimensions of final content. No generic, infinite flashing bars. Use a pulsing light gray/dark gray transition instead of a glowing shimmer.
- **Spinners:** Use icon-only gray loader circles. The loading spinner itself should never be Vermilion (vermilion is reserved for interactive CTAs).

### Empty States
- Consists of a simple, single-stroke line illustration in `ink-400`/`ink-600`.
- 1 concise title + 1 description sentence + at most 1 primary CTA.

### Error States
- Contextual messaging (404, 500, Offline, API Error).
- Provides exactly one "Retry" button. Never show raw stack traces or database errors directly in user view.

---

## Media & Icons

### Icons
- **Library:** Lucide React.
- **Stroke Weight:** Constant at 1.5px.
- **Standard Sizing:** 20px (standard size), 16px (small context), 24px/32px (displays/hero entries).
- **Behavior:** Always inherit `currentColor` dynamically. Never hardcode inline hex colors on icon paths.

### Cover Images
- Uses `radius-sm` (8px).
- Fixed 2:3 aspect ratio container to prevent layout shifting on slow loads.
- A dominant-color solid color placeholder should be displayed while loading.
- Broken image fallback: A solid ink-toned background with the initials of the series title centered, rather than a broken-file icon.
