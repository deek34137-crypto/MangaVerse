# Inkline Color System

This document defines the color tokens and usage rules for MangaHub.

## Color Philosophy

The system uses a quiet, ink-on-paper palette. Backgrounds are near-black with warm undertones (not blue-black). Text is a warm off-white (paper) instead of clinical pure white. A single vermilion accent color is used sparingly like a hanko seal stamp.

---

## Color Tokens

### Ink (Neutral / Surface)

These form the foundation of our UI. They represent the paper, borders, surfaces, and text.

| Token | Hex | Tailwind Class (Alias) | Usage |
|---|---|---|---|
| `ink-950` | `#0B0B0C` | `bg-ink-950` / `bg-background` | App background (dark) |
| `ink-900` | `#151517` | `bg-ink-900` / `bg-card` | Base surface (cards, panels) |
| `ink-800` | `#1E1E21` | `bg-ink-800` / `bg-popover` | Elevated surface (modals, dropdowns) |
| `ink-700` | `#2A2A2E` | `border-ink-700` / `border-border` | Borders, dividers |
| `ink-600` | `#3B3B40` | `bg-ink-600` | Disabled fills, subtle hover backgrounds |
| `ink-400` | `#6E6E76` | `text-ink-400` / `text-muted-foreground` | Muted text, placeholders |
| `ink-200` | `#A8A8AE` | `text-ink-200` | Secondary text |
| `ink-50` | `#F4F2EC` | `text-ink-50` / `text-foreground` | Primary text, light-mode background ("paper") |

> [!NOTE]
> `ink-50` (`#F4F2EC`) is a warm off-white, reflecting natural paper. Never substitute pure `#FFFFFF` for primary text or paper surfaces.

### Vermilion (Brand / Seal Accent)

Vermilion is used exclusively for primary emphasis. It should appear at most once per view.

| Token | Hex | Tailwind Class (Alias) | Usage |
|---|---|---|---|
| `vermilion-600` | `#8F2430` | `bg-vermilion-600` | Active / pressed state |
| `vermilion-500` | `#C6303E` | `bg-vermilion-500` / `bg-primary` | Primary brand color — CTAs, active nav, seal mark |
| `vermilion-400` | `#DB5A61` | `bg-vermilion-400` | Hover state on vermilion-500 elements |
| `vermilion-100` | `#F3D9D9` | `bg-vermilion-100` | Tinted backgrounds (badges, subtle highlight) |

> [!WARNING]
> Vermilion is spent on exactly one focal point per screen. If two elements compete for it, one must be secondary.

### Gold (Premium Tier Only)

Gold is reserved exclusively for premium and subscription features.

| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `gold-500` | `#B8934F` | `text-gold-500` | Premium/subscriber badges, premium chapter icons |
| `gold-100` | `#EFE3C8` | `bg-gold-100` | Premium-tinted subtle backgrounds |

> [!IMPORTANT]
> Gold and Vermilion must never appear side-by-side in the same component. They denote separate statuses.

### Semantic Colors

Desaturated relative to typical UI kits to sit cohesively within the warm dark system.

| Category | Background (Hex) | Foreground (Hex) | Border (Hex) | Usage |
|---|---|---|---|---|
| **Success** | `#16261E` | `#5BA97B` | `#264A38` | Positive actions, completed items |
| **Warning** | `#2B2312` | `#D9A441` | `#4A3B17` | Non-blocking alerts, warnings |
| **Danger** | `#2B1417` | `#E5636E` | `#4A1E24` | Errors, destructive actions |
| **Info** | `#141F2B` | `#6F9CDB` | `#1E3350` | Help texts, neutral system info |

---

## Application Rules

1. **Dark vs. Light (Paper) Mode:**
   - In Dark Mode (default): Background is `ink-950`, surfaces are `ink-900`/`ink-800`, text is `ink-50`.
   - In Light Mode ("Paper Mode"): Background is `ink-50` (`#F4F2EC`), surfaces are pure white or `ink-100` equivalents, text is `ink-950`.
2. **Accent Constraint:**
   - A view should have a singular accent highlight. Do not use vermilion for both a primary button and a secondary indicator unless they represent the same focal point.
3. **No Gradients:**
   - Do not use gradients on any brand elements. The only exception is cover art scrim overlays to ensure text legibility.
