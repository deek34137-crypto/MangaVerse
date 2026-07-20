# Implementation Rules & AI Guidelines

This document serves as the guide for any developer (human or AI) writing code in this repository. 

---

## The Signature Element: The Seal Mark

A small circular mark, mimicking a hanko stamp, is our unique visual accent. It must be used **exactly** in these three scenarios — never for general decoration:

1. **Completion:** Stamped on a manga series card once the reader has completed all available chapters.
2. **New Chapter:** A small filled vermilion dot beside a series or chapter title, indicating it is unread.
3. **Premium Unlock:** The seal rendered in `gold-500` instead of `vermilion-500` for subscriber-exclusive locked chapters.

> [!WARNING]
> Do not use the seal mark as an bullet point bullet, list marker, decorative badge, or hover ornament. Keeping its use exclusive preserves its premium value.

---

## Styling Constraints

- **No Hardcoded Values:** Never write raw color hex codes, absolute pixel spacing values (unless converting to tailwind spacing multiples), font size styles, or arbitrary rounding values directly in CSS classes. Always reference the corresponding theme token or CSS property.
- **Single Accent:** A screen must only have one prominent accent highlight (Vermilion). Multiple competing colored actions (like a green active tab, blue links, and a vermilion button) are not allowed.
- **Theme Variables Setup:** In Tailwind CSS v4, theme properties are configured inside the CSS file under `@theme`. Ensure standard utilities (`bg-background`, `text-foreground`, `bg-primary`, etc.) point to their mapped CSS variable values to automate design compliance.
- **Responsive Specifications:** Every component must explicitly define its layout behavior under mobile breakpoints (< 640px). Do not assume desktop layouts will "just fit."
- **Performance First:** Only animate `transform` and `opacity` to avoid triggering document layout recalculation cycles.

---

## Pull Request Checklist

Before submitting layout or UI changes, check that:
- [ ] No hardcoded hex colors are introduced.
- [ ] Elements comply with the 4px spacing scale.
- [ ] Contrast meets minimum WCAG AA requirements.
- [ ] Touch targets are at least 44 × 44px.
- [ ] Active and hover states are consistent with Inkline specifications.
- [ ] `prefers-reduced-motion` settings are fully supported.
