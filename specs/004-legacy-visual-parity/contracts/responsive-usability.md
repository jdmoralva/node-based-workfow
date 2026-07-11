# Contract: Responsive Usability

## Purpose

Define the required pass conditions for tablet and mobile layouts where legacy responsive behavior is not authoritative.

## Supported responsive viewports

| Viewport label | Size |
|----------------|------|
| Tablet | `768 x 1024` |
| Mobile | `390 x 844` |

## Responsive policy

- Desktop legacy presentation remains the visual reference for branding, component identity, and content hierarchy.
- Tablet and mobile layouts may stack, collapse, reorder, resize, or replace layout regions when needed for usability.
- Legacy breakpoint strategy and mobile adaptation patterns are not acceptance requirements.

## Required pass conditions for every in-scope route

- Primary navigation remains reachable and understandable.
- Primary actions remain visible or clearly discoverable.
- The main content flows in a readable order.
- Forms, cards, toolbar controls, and tree interactions remain usable.
- No unintended horizontal overflow is introduced.
- No primary task region is clipped, overlapped, or rendered unreachable.

## Route-specific checks

### `/`
- Hero region remains readable without obscuring the application cards.
- Public actions remain reachable.

### `/login`
- Sign-in form remains fully visible and operable.
- Labels, fields, and submit action remain readable without clipping.

### `/applications`
- Card grid wraps cleanly.
- Sidebar or alternative navigation access remains usable.

### `/services`
- Service toolbar and page actions remain reachable.
- Service cards remain readable and operable after wrapping.

### `/creditmodeler-service`
- Tree navigation remains reachable.
- Stage progression controls remain visible.
- The workbench canvas remains visible enough for orientation and task flow.

## Validation mode

- Responsive verification uses browser assertions, layout measurements, and interaction checks instead of legacy screenshot matching.
- Geometry assertions may still be used when they help prove responsiveness or diagnose failures.

## Reference validation coverage

- `tests/e2e/responsive-layout.spec.ts` covers all five routes at tablet and mobile for navigation reachability, primary-region visibility, and no unintended horizontal overflow.
- `tests/e2e/responsive-usability.spec.ts` covers route-specific responsive behavior for landing and applications card flow, services toolbar/action access, login form usability, and CreditModeler stage/tree/canvas stacking.
