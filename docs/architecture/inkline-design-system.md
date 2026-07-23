# Inkline 2.2.1 Specification — Final Architecture Standard

```text
Specification Version: 2.2.1 (Final & Immutable)
Status: Active System Architecture Standard
Last Updated: 2026-07-23
Applies To: All Frontend Views (Home, Manga Detail, Reader, Search, Library, Auth, Settings, Admin)
```

---

## 1. 7-Layer Architectural Framework

Inkline 2.2.1 is structured into seven immutable architectural layers:

```text
Layer 1: Product Design Principles
   │  ("The manga artwork is always the visual hero. Content before chrome.")
   ▼
Layer 2: Design Tokens & Foundations
   │  (Color scale, typography rules, spacing rhythm, elevation surfaces 0-4, radius scale)
   ▼
Layer 3: Layout Primitives & Composition
   │  (Container, Section, Shelf, Spotlight, Grid, Stack, Cluster, Sidebar, Panel, Toolbar)
   ▼
Layer 4: Component Anatomy & Library
   │  (Cover -> Badge -> Title -> Metadata -> Chapter -> Action anatomy, 4-tier badges, 3-tier dividers)
   ▼
Layer 5: Motion & Transition Intent
   │  (Discovery attracts, Reader disappears, Loading reassures, Navigation orients)
   ▼
Layer 6: Page Templates & Responsive Architecture
   │  (Home discovery, Cinematic Manga Detail, Invisible Reader, Library, Search)
   ▼
Layer 7: Comprehensive Accessibility & Performance
      (44px touch targets, focus rings, reduced motion, keyboard parity, screen reader ARIA)
```

---

## 2. Layer 1 — Product Design Principles

1. **Content Before Chrome**: The UI serves the manga. Interface elements must never compete with cover art or story panels.
2. **The Manga Artwork is Always the Visual Hero**: Overlays, gradients, glows, and badges must remain subordinate to cover art.
3. **Motion Earns Attention**: Discovery motion attracts; reader motion disappears; loading motion reassures; navigation motion orients.
4. **Color Communicates Meaning**: Crimson red (`#C6303E`) directs action; Gold (`#B8934F`) signals earned recognition (`⭐ Staff Pick`, `🏆 Award`, `👑 Featured`); Ink neutral signals structure.
5. **Typography Creates Hierarchy**: `Fraunces` in Title Case commands headlines; `Inter` in tracking-wide uppercase labels section tags; `JetBrains Mono` formats immutable `CH.129` metadata.

---

## 3. Layer 2 — Design Tokens & Foundations

### Elevation Surface System
- **Surface 0 (Background)**: `#0B0B0C` (Solid deep charcoal).
- **Surface 1 (Cards & Containers)**: `#151517`, border: `1px solid var(--color-ink-700)`.
- **Surface 2 (Floating Panels & Drawers)**: `rgba(21, 21, 23, 0.78)`, `backdrop-filter: blur(12px)`.
- **Surface 3 (Dialogs & Modals)**: `rgba(21, 21, 23, 0.88)`, `backdrop-filter: blur(16px)`.
- **Surface 4 (Search Overlay & Overlays)**: `rgba(11, 11, 12, 0.95)`, `backdrop-filter: blur(20px)`.

### Standardized Radius Scale
- **Cards**: `14px` (`rounded-[14px]`)
- **Buttons & Inputs**: `10px` (`rounded-[10px]`)
- **Dialogs & Modals**: `18px` (`rounded-[18px]`)
- **Badge Pills**: `999px` (`rounded-full`)

### Typography Hierarchy & Casing
- **Section Label / Overtitle**: `Inter` in `UPPERCASE text-[11px] tracking-[0.24em] font-semibold text-muted-foreground`.
- **Headlines & Section Titles**: `Fraunces` in **Title Case** (`Editor's Picks`, `Trending Now`, `Solo Leveling`). *Never forced uppercase*.
- **Manga Titles**: Natural Title Case (`Solo Leveling`, `One Piece`).
- **Chapter Indicators**: Immutable `CH.129` format via `formatChapterLabel()` in `JetBrains Mono` (`font-mono text-[11px] tracking-wider uppercase`).

---

## 4. Layer 3 — Layout Primitives & Composition

### Layout Primitives
All pages are composed exclusively using eleven standardized primitives:
- `Page`: Root view wrapper.
- `Container`: Max-width padded wrapper (`container-padded`).
- `Section`: Major page section with 64px vertical rhythm spacing.
- `Shelf`: Horizontal scrollable item row with fade masks (`MangaCarousel`).
- `Spotlight`: High-impact asymmetric hero spotlight.
- `Grid`: Responsive card grid (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6`).
- `Stack`: Vertical component stack.
- `Cluster`: Horizontal inline wrap group.
- `Sidebar`: Supplementary navigation or detail panel.
- `Panel`: Surface 2 floating glass panel.
- `Toolbar`: Action bar or controls drawer.

### Layout Intent & Ratios
- **Reader View**: *Controls occupy the minimum space necessary to maximize manga panel visibility.*
- **Manga Cards**: *Cover artwork visually dominates metadata while maintaining a 2:3 aspect ratio.*
- **Hero Banner**: *Typography remains legible without obscuring featured artwork.*

---

## 5. Layer 4 — Component Anatomy & Standards

### Standard Card Anatomy
```text
[ Cover Image (2:3 Aspect Ratio, rounded-14px) ]
       │
[ Type / Editorial Badge (Top-Left overlay) ]
       │
[ Status / Bookmark Chip (Top-Right overlay) ]
       │
[ Title (Inter, 2-line clamp, Natural Title Case) ]
       │
[ Metadata: Rating ★ + Chapter Chip (CH.129 in JetBrains Mono) ]
       │
[ Quick Action Hover Bar (Read Now / Library Status) ]
```

### Image Treatment Rules
- **Covers**: Strict `2:3` aspect ratio, `object-position: center`, `object-fit: cover`. Never crop key art faces.
- **Banners**: `16:9` or full-bleed header poster. Gradient scrim applied strictly for text legibility.
- **Reader Panels**: Native image aspect ratio preserved. Zero CSS filters, zero cropping, zero color shifts.

---

## 6. Layer 5 — Motion System & Intent

| Transition Context | Timing | Easing | Intent |
| :--- | :--- | :--- | :--- |
| **Micro-Interaction** | `120ms` | `cubic-bezier(0,0,0.2,1)` | Discovery motion attracts attention. |
| **Dialog / Modal** | `250ms` | `cubic-bezier(0,0,0.2,1)` | Navigation motion orients. |
| **Page Route** | `300ms` | `cubic-bezier(0.4,0,0.2,1)` | View transition fading. |
| **Carousel Snap** | `400ms` | `cubic-bezier(0.4,0,0.2,1)` | Shelf scrolling alignment. |
| **Reader View Controls** | `120ms` | `Instant / Fast` | Reader motion disappears. |

---

## 7. Layer 6 — Responsive Architecture & Breakpoints

| Breakpoint Name | Range | Layout Behavior |
| :--- | :--- | :--- |
| **Compact** | `< 480px` | Single-column stack, bottom mobile navigation bar, compact cards. |
| **Mobile** | `480px – 767px` | 2-column grid, drawer menus for filters. |
| **Tablet** | `768px – 1023px` | 3–4 column grid, top header navigation, side drawers. |
| **Desktop** | `1024px – 1439px` | 5–6 column grid, full header menu, expanded detail hero. |
| **Wide** | `>= 1440px` | Container capped at 1400px, max 6 grid columns with asymmetric spotlight. |

---

## 8. Layer 7 — Comprehensive Accessibility & Performance

- **Minimum Touch Targets**: All interactive controls maintain a minimum `44×44 px` touch target (`.touch-target`).
- **Focus Rings**: Mandatory visible keyboard focus indicators (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`).
- **Reduced Motion**: Mandatory `prefers-reduced-motion` override handling.
- **Screen Reader Parity**: Explicit `aria-label` tags on all icon-only buttons (`Bookmark`, `Search`, `Share`).
- **Non-Color Reliance**: Statuses use icons + labels + color (never color alone).
