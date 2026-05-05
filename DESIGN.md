# FarmHUB DESIGN.md

FarmHUB is a Thai-first enterprise ERP for pig farm operations. The visual direction is **white dominant with green accents**: clean, calm, data-dense, and trustworthy. The interface must feel premium and practical, not decorative.

## Visual Direction

- Use white and near-white surfaces as the base.
- Use green as the primary brand accent for action, emphasis, and success states.
- Keep layouts readable for long work sessions.
- Prefer subtle borders, soft shadows, and restrained motion.
- Avoid loud gradients, oversized decoration, and dark-heavy interfaces.

## Color Roles

- `page background`: very light green-white.
- `surface`: white.
- `surface muted`: pale green-gray for section separation.
- `primary`: medium green for buttons, focus, active states, and key highlights.
- `primary dark`: deeper green for pressed or strong emphasis.
- `border`: soft gray-green, never harsh gray.
- `text primary`: deep green-black for maximum readability.
- `text secondary`: muted green-gray.
- `success`: green.
- `warning`: warm amber that does not fight the green brand.
- `danger`: muted red.

## Typography

- Use a Thai-friendly sans serif stack.
- Make headings strong and slightly condensed in feel.
- Keep body text highly legible and avoid decorative styling.
- Use weight and spacing to create hierarchy, not flashy effects.

## Component Rules

- Cards should be white, bordered, and lightly shadowed.
- Tables should be dense but readable, with subtle zebra/hover treatment.
- Forms should be clean, consistent, and easy to scan.
- Dialogs should be calm and clear, with strong header/body separation.
- Badges should be semantic and restrained.
- Sidebar navigation should feel enterprise-grade, compact, and scope-aware.

## Layout Rules

- Optimize for desktop and tablet first.
- Keep page headers compact.
- Keep content areas large enough for tables and approval flows.
- Use spacing consistently across pages and sections.

## Do

- Use green for actions, active states, focus, and success.
- Preserve readability for Thai text and long labels.
- Prefer reusable theme tokens and shared components.
- Keep shadows and motion subtle.

## Don't

- Do not use purple-heavy branding.
- Do not make the page feel like marketing UI.
- Do not overuse dark backgrounds.
- Do not introduce a second visual language for a single module.
- Do not use decoration that competes with data.

## Prompt Guide

When asking an AI agent to build UI for FarmHUB, instruct it to:

- follow the white-green enterprise theme,
- use the existing MUI-based shell and shared components,
- keep tables dense but readable,
- keep text Thai-first,
- preserve current routes and business logic,
- avoid replacing the ERP shell with a consumer-style layout.
