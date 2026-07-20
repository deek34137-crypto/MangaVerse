# Responsive Breakpoint Guidelines

MangaHub is designed primarily for mobile-first reading (handheld tablets and smartphones), with desktop and wide screens serving as layout enhancements.

---

## Responsive Breakpoints

| Device Category | Breakpoint Range | Width Value | Grid Columns |
|---|---|---|---|
| **Mobile** | < 640px | `sm` | 4 |
| **Tablet** | 640px – 1024px | `md` | 8 |
| **Laptop** | 1024px – 1440px | `lg` | 12 |
| **Desktop** | 1440px – 1920px | `xl` | 12 |
| **Wide** | > 1920px | `2xl` | 12 |

---

## Responsive Layout Behaviors

### Navigation
- **Screen width < 640px (Mobile):** The top navbar collapses and hides primary navigation links. The primary navigation is repositioned to a 56px high bottom tab bar (Home, Search, Library, Settings) for thumb reach.
- **Screen width ≥ 640px (Tablet/Desktop):** The bottom tab bar disappears, and navigation resides entirely in the 64px persistent top header bar.

### Grid Layouts
- **Library Directory:**
  - Mobile: 2 columns of cover art cards.
  - Tablet: 4 columns.
  - Laptop/Desktop: 6 columns.
- **Aspect Ratio Maintenance:** Cover art cards must maintain their strict 2:3 ratio and scale fluidly based on the grid gaps. Never distort cover image dimensions.

---

## Touch & Interaction Adjustments

1. **Tablets and Mobile:** Hover states (like card translation and image scale) are disabled or ignored on touch screens to prevent double-tap requirements for navigation.
2. **Horizontal Reading:** Touch gestures (swipe left/right) should map directly to next/previous page triggers in horizontal reading modes.
