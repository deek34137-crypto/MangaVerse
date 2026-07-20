# Page Structure & Reader Layouts

This document defines page-level assemblies and the immersive Reader Experience.

---

## Standard Page Assemblies

All standard views (Home, Library, Search, Profile) follow a unified stacked structure:

```
Navbar (Desktop Header / Mobile Bottom Bar)
  ↓
Hero Area (Banners or detail panels)
  ↓
Main content (Grid lists, chapter entries)
  ↓
Secondary panels (Reviews, comments, similar items)
  ↓
Footer (Copyrights, standard links)
```

---

## Reader View (The Layout Exception)

The Manga Reader is the central feature of the product and operates outside standard page templates.

### Immersive View Mode
- **Chrome Collapse:** When a user enters the reader, the standard global navbar and footer collapse completely.
- **Toggled Overlay:** Standard navigation controls are consolidated into a thin, translucent header/footer overlay (`backdrop-filter: blur(20px)`) that fades in only when the user taps/clicks the screen, auto-hiding after 3 seconds of inactivity.

---

## Reading Modes

1. **Vertical Scroll (Standard Web Comic):**
   - Content flows vertically.
   - Gap between pages is 0px.
   - Max-width: Capped at `900px` for optimal readability.
2. **Webtoon Mode:**
   - Continuous scroll, full bleed.
   - Width: `100vw` (no margins, full edge-to-edge).
3. **Horizontal (Paged):**
   - Click or swipe to transition between pages.
   - Page centering: Left/Right keys page back and forth.
   - Width: Matches screen height while maintaining the image's aspect ratio.

---

## Reader Customization UI

The reader settings panel (usually a popover sheet or bottom drawer) provides:

### Background Tone Selections
- **Ink Dark (Default):** `#0B0B0C` background (`ink-950`).
- **Paper Light:** `#F4F2EC` background (`ink-50`).
- **True Black:** `#000000` background (optimal for OLED mobile devices).

### In-App Brightness Control
- Adjusted via an overlay slider.
- Functions independently of the user's OS system brightness.
- Value must be persisted in local storage or user preferences.

### Zoom & Sizing
- Support for touch pinch-to-zoom.
- Double-click/double-tap to reset scale.
