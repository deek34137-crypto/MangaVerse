# Spacing, Radii, Shadows, and Layout

This document defines layout structure, spatial rhythm, roundness, elevation layers, and the blur system.

---

## Spacing Scale

Rhythm is based strictly on a **4px base unit**. Never invent or use a margin, padding, or gap outside this scale:

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`

In Tailwind v4, these correspond to standard spacing multipliers:
- `4px` = `1` / `0.25rem`
- `8px` = `2` / `0.5rem`
- `12px` = `3` / `0.75rem`
- `16px` = `4` / `1rem`
- `20px` = `5` / `1.25rem`
- `24px` = `6` / `1.5rem`
- `32px` = `8` / `2rem`
- `40px` = `10` / `2.5rem`
- `48px` = `12` / `3rem`
- `64px` = `16` / `4rem`
- `80px` = `20` / `5rem`
- `96px` = `24` / `6rem`

---

## Border Radius

Borders use a sharp-to-soft scale. Smaller components remain sharp, while outer containers round gently.

| Token | Value | Use Case |
|---|---|---|
| `radius-xs` | 4px | Inputs, small buttons, status tags |
| `radius-sm` | 8px | Action buttons, chips, cover art |
| `radius-md` | 12px | Standard cards, panels, list items |
| `radius-lg` | 16px | Modals, floating sheets, side drawers |
| `radius-xl` | 24px | Hero banners, feature promotional blocks |
| `radius-pill` | 999px | Navigation pills, capsule tags |
| `radius-circle`| 50% | User avatars, the Seal Mark |

---

## Shadows

Borders do the heavy lifting of UI surface separation. Use shadows sparingly. When a shadow is used, it should be soft and translucent.

| Token | Value | Applied To |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.24)` | Default cards, library items |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.28)` | Sticky header navigation, buttons |
| `shadow-lg` | `0 12px 32px rgba(0,0,0,0.36)` | Drawers, slide-out panels, toasts |
| `shadow-modal` | `0 24px 64px rgba(0,0,0,0.48)`| Central overlays, modals |
| `shadow-dropdown`| `0 8px 24px rgba(0,0,0,0.32)`| Context menus, dropdown selections |

---

## Blur System

Blur effects must be limited strictly to these two scenarios. Never use blur for card backgrounds or sticky headers.

1. **Reader Controls Overlay:**
   - Applied to navigation/control overlays on top of cover art or pages.
   - Values: `backdrop-filter: blur(20px)`, background: `ink-950` at 72% opacity.
2. **Modal Backdrop:**
   - Behind central modals.
   - Values: `backdrop-filter: blur(8px)`, background: `ink-950` at 60% opacity.

---

## Elevation Layers

| Layer | Value | Z-Index | Content |
|---|---|---|---|
| Level 0 | — | 0 | App Background / Canvas |
| Level 1 | `shadow-sm` | 10 | Content Cards, Library Grids |
| Level 2 | `shadow-md` | 30 | Sticky headers, nav bar |
| Level 3 | `shadow-dropdown`| 40 | Dropdown menus, tooltips |
| Level 4 | `shadow-lg` | 40 | Side drawers, filters |
| Level 5 | `shadow-modal` | 50 | Central Modals |
| Level 6 | `shadow-lg` | 60 | System Toasts / Notifications |
| Level 7 | `shadow-sm` | 70 | Custom Tooltips |

---

## Layout System

### Container Widths

- **XS (480px):** Small cards, single column inputs
- **SM (640px):** Auth forms, narrow dialogs
- **MD (768px):** Settings view, table displays
- **LG (1024px):** Standard list layouts, reader configuration
- **XL (1280px):** Hub dashboard layouts
- **2XL (1440px):** Grid directory pages
- **Max Content (1600px):** Reading view horizontal bounds only

### Responsive Grid System

| Breakpoint | Columns | Gap | Margin / Padding |
|---|---|---|---|
| **Desktop** (≥ 1024px) | 12 | 24px | 32px |
| **Tablet** (640px – 1024px)| 8 | 20px | 24px |
| **Mobile** (< 640px) | 4 | 16px | 16px |

---

## Page Structure

All standard pages use this structured layout:
1. **Navbar:** Desktop 64px, Mobile 56px (which converts to a bottom bar for easy reach).
2. **Hero/Header:** Promotional banner (homepage) or details banner (manga details page).
3. **Main Content:** Primary reader lists, collection grids.
4. **Secondary Sections:** Recommended rows, comment sheets.
5. **Footer:** Standard disclaimer and link grid.

*Note: The Reader View is the sole exception — standard navigation hides completely to let the artwork fill the viewport.*
