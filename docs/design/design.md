# Design System — Inkline
Version: 2.0
Status: Active
Last Updated: 2026-07-13

---

## Purpose

This document defines the complete visual language of MangaHub.

Every new page, component, modal, animation, and layout MUST follow this document.

This file is the source of truth for UI consistency, UX rules, component hierarchy, spacing, color, typography, motion, accessibility, and responsive behavior. No component should introduce a new design pattern unless this file is updated first. Treat any deviation as a regression, not a variant.

---

## Design Philosophy

**Name: Inkline.** The system takes its cue from the object at the center of the product — a printed page. Black ink, white paper, and one seal of color. Everything else is negative space doing its job.

### Core Principles

1. **The page is the hero.** Chrome recedes so artwork reads at full contrast. No panel, card, or overlay should compete with the manga itself.
2. **One mark of color.** A single vermilion accent — inspired by the hanko seal stamped on a finished work — carries all emphasis: primary actions, "new," "completed," progress. It appears once per view, not scattered across it.
3. **Weight through restraint, not decoration.** Premium reads as precise spacing and typographic confidence, not gradients, glow, or drop shadows stacked for effect.
4. **Fast as a matter of respect.** A reader mid-chapter should never wait on an animation. Motion serves orientation, never spectacle.
5. **Same interaction, same visual behavior**, everywhere in the product.
6. **Built for the reader's hand first.** Mobile and tablet are the primary reading surface; desktop is the enhancement, not the reference design.
7. **Accessible by default.** Keyboard and screen-reader support are requirements, not a pass at the end.

---

## Visual Identity

**Direction:** ink-on-paper, editorial, quiet. Closer to a well-bound art book than a SaaS dashboard.

- Near-black surfaces with warm, not blue-black, undertone
- A single warm off-white used deliberately, not as a second background
- One accent — vermilion — used the way a seal stamp is used: small, deliberate, final
- Hairline borders (1px, low-contrast) instead of shadows to separate surfaces
- Sharp-to-soft radius scale — small controls stay close to square, containers round gently
- No glassmorphism as a default texture; blur is reserved for exactly two contexts (see [spacing.md](spacing.md) for Blur System)
- No gradients on brand elements. Gradients, where they appear at all, live only in cover-art scrims for text legibility

This deliberately avoids the two AI-default looks it would be easy to reach for — warm cream-and-terracotta editorial, or near-black-and-acid-green tech — in favor of a palette that comes from the product's own subject matter.

---

## Naming Conventions

- Buttons: `button-primary`, `button-secondary`, `button-ghost`
- Cards: `card-media`, `card-collection`, `card-stat`
- Layout: `container`, `section`, `stack`, `grid`
- Animation: `fade-in`, `scale-up`, `slide-left` *(reserved for onboarding/marketing surfaces only — not in-app navigation, per Motion System)*

---

## Do & Don't

### Do
✅ Reuse existing components before building new ones  
✅ Follow the 4px spacing scale exactly  
✅ Keep the seal mark meaningful — three uses, no more  
✅ Maintain one accent per screen  
✅ Use semantic HTML and real landmarks  

### Don't
❌ Introduce a second accent color alongside vermilion  
❌ Use blur as a default surface texture  
❌ Add drop shadows where a hairline border would do  
❌ Use bounce easing  
❌ Stack multiple CTAs of equal visual weight  
❌ Let cover art content shift after load  

---

## Visual Checklist

Before merging:
- [ ] Uses design tokens exclusively (no hardcoded values)
- [ ] Responsive behavior specified for mobile, tablet, desktop
- [ ] Fully keyboard accessible with visible focus states
- [ ] Motion respects `prefers-reduced-motion`
- [ ] Dark mode (default) and light/paper mode both supported
- [ ] No unintended overflow or layout shift
- [ ] Spacing drawn from the 4px scale
- [ ] Typography drawn from the defined scale/roles
- [ ] Loading, empty, and error states all designed
- [ ] Seal mark, if used, matches one of its three defined meanings
