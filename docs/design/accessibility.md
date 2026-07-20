# Accessibility (A11y) Standards

MangaHub is committed to creating an accessible reading environment. Accessibility features are integrated directly into the components from the start.

---

## Contrast Ratios

All text and critical visual identifiers must meet WCAG 2.1 AA standards:
- **Body Text:** Minimum contrast of **4.5:1** against backgrounds (`ink-950` / `ink-900`).
- **Large Text / UI Components:** Minimum contrast of **3:1** against backgrounds.
- All contrast ratios must be verified against their actual adjacent surfaces, never assumed against pure black.

---

## Keyboard Navigation & Focus

- **Interactive Elements:** Every link, button, input, and interactive card must be focusable.
- **Tab Order:** Tabbing must proceed in a logical, reading-order flow (top-to-bottom, left-to-right).
- **Focus Indicator:** 
  - Every focused element must show a highly visible focus ring.
  - The standard focus ring is a **2px solid `vermilion-500` ring** with a **2px offset** from the element boundary.
  - Do not suppress the focus ring unless custom focus styles are provided.

```css
/* Focus Ring CSS */
.focus-ring {
  outline: 2px solid var(--color-vermilion-500);
  outline-offset: 2px;
}
```

---

## Motion Preferences

- Components must respect the `@media (prefers-reduced-motion: reduce)` media query.
- When enabled:
  - Disable all transitions (translate, scale, hover transforms).
  - Page routes switch immediately without fade overlays.
  - Skeletons pulse with simple opacity cuts rather than active animation curves.

---

## Screen Reader Support (ARIA)

1. **Semantic Landmark Elements:** Always wrap sections in `<header>`, `<nav>`, `<main>`, `<aside>`, and `<footer>` landmarks.
2. **Icon-only Buttons:** Any button containing only an icon (e.g. search, close modal, add bookmark) must include a descriptive `aria-label`.
3. **Manga Reader:** The image reader must include an alt text indicating the page number (e.g. `alt="Manga page 24"`).

---

## Touch Target Sizes

- **Minimum Size:** Interactive touch elements must occupy a minimum clickable/tappable footprint of **44 × 44px**.
- **Visual vs. Hit Target:** If an icon button is visually designed at 24 × 24px, the actual touch target area must be padded to meet the 44px minimum limit without distorting the visual layout.
- **Separation:** Ensure interactive elements have sufficient gap space so mobile users do not accidentally trigger adjacent links.
