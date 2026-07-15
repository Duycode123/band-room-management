---
name: design-md
description: Applies the BandHub design system from DESIGN.md (google-labs-code/design.md format). Use when creating pages, components, layouts, styling, Tailwind classes, colors, typography, or when the user mentions DESIGN.md or design system.
---

# DESIGN.md Workflow

Follows the open spec: https://github.com/google-labs-code/design.md

Reference examples in that repo: `examples/paws-and-paths/DESIGN.md`, `examples/totality-festival/DESIGN.md`

## Before building any UI

1. Read `DESIGN.md` at repository root (YAML tokens + markdown sections)
2. Read `frontend/app/globals.css` for Tailwind `@theme` mapping
3. Use `frontend/app/(auth)/login/page.tsx` as the canonical implemented example

## Spec section order (when editing DESIGN.md)

1. Brand & Style / Overview
2. Colors
3. Typography
4. Layout & Spacing
5. Elevation & Depth
6. Shapes
7. Components
8. Do's and Don'ts

## Token → Tailwind

| DESIGN.md token | Tailwind |
|-----------------|----------|
| colors.primary | `bg-brand-orange`, `text-brand-orange`, `bg-primary` |
| colors.primary-hover | `hover:bg-brand-orangeHover` |
| colors.secondary | `bg-brand-greenDark`, `bg-secondary` |
| colors.secondary-container | `bg-brand-greenLight`, `bg-secondary-container` |
| colors.tertiary | `bg-tertiary`, `text-tertiary` |
| colors.tertiary-container | `bg-tertiary-container` |
| colors.background | `bg-brand-bgGray`, `bg-surface` |
| colors.surface-container-lowest | `bg-white`, `bg-surface-container-lowest` |
| colors.on-surface | `text-on-surface` |
| colors.on-surface-variant | `text-on-surface-variant` |
| colors.inverse-surface | `bg-inverse-surface` |
| typography display/headline | `font-display` |
| typography body | `font-sans` |
| shadow card | `shadow-[var(--shadow-card)]` |

## Component patterns (from DESIGN.md)

- **button-primary:** `bg-brand-orange hover:bg-brand-orangeHover text-white font-display font-medium py-3 rounded-lg transition-all active:scale-[0.98] h-12`
- **card:** `bg-white rounded-xl border border-outline-variant shadow-[var(--shadow-card)] p-6`
- **card-room:** card + hover `hover:shadow-[var(--shadow-elevated)]` transition-shadow
- **input-field:** `rounded-lg border border-outline focus:border-brand-orange focus:ring-1 focus:ring-brand-orange font-sans`
- **sidebar-banner:** `bg-gradient-to-br from-brand-greenDark to-brand-greenLight text-white font-display`
- **nav-sidebar:** `bg-inverse-surface text-inverse-on-surface`
- **headline:** `font-display font-bold tracking-tight text-on-surface`

## Validate (optional)

```bash
npx -p @google/design.md designmd lint DESIGN.md
```

## Sync rule

When design tokens change, update both `DESIGN.md` and `frontend/app/globals.css` `@theme` block.
