# Inkline Motion System

Motion in MangaHub serves orientation, never spectacle. Animations should feel instantaneous, helpful, and lightweight.

---

## Animation Durations

| Token | Value | Ideal Use Case |
|---|---|---|
| **Fast** | 120ms | Hover states, tab switches, checkmark fills, small button scaling |
| **Normal**| 180ms | Page transitions, dropdowns, expansion panels, small card list load |
| **Slow**  | 280ms | Large modal entrances, side drawers, slide-out configuration sheets |

---

## Easing Curves

| Easing | CSS Curve | Use Case |
|---|---|---|
| **Standard** | `cubic-bezier(0.4, 0, 0.2, 1)` | Default transitions (e.g. background changes, transitions) |
| **Entrance** | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering the screen (modals, drawers sliding in) |
| **Exit** | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving the screen (menus closing, dialogs dismissing) |

> [!WARNING]
> No bounce easing is allowed anywhere in the application. Bounce curves feel playful and detract from the premium, print-like editorial design.

---

## Specific Interactions

### Hover Treatments
Hover animations must be constrained to:
1. **Lift:** Translating an element upwards by exactly 2px (`translate-y-[-2px]`).
2. **Subtle Scale:** Scaling an image up by 1.02 within a clipped frame.
*No radial glow, box-shadow pulses, or 3D card tilt effects are permitted.*

### Page Transitions
- Routes must transition using a simple opacity **Fade Only** over 180ms.
- Avoid slide transitions between standard navigation paths. Slide transitions mimic mobile apps; MangaHub is designed to feel like a high-end publication website.
- Restores scroll position immediately when going back to the library.

### Micro-interactions
1. **Bookmark/Favorite Toggle:** The seal-mark fill animates in from scale 0 to 1 with an ease-out curve over 200ms.
2. **Reader Progress Indicator:** The scroll progress bar at the top of the reader updates in real-time without easing delays to map exactly to the physical page content.
3. **Button Active Pressed:** Decreases overall scale by 2% while the button is pressed (`:active` -> `scale-[0.98]`).
4. **Reduced Motion:** If a reader has system settings set to `prefers-reduced-motion: reduce`, all scale shifts, translate hovers, and route fades must disable instantly.
