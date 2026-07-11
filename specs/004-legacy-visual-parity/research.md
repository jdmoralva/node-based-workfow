# Research: Legacy Visual Parity

## Technical stack continuity

### Decision
Keep this feature on the existing `apps/web` stack: Next.js 15 App Router, React 18, TypeScript 5.6, Tailwind CSS 3, Playwright 1.49, Vitest 2.1, and React Testing Library.

### Rationale
This feature is a refinement of the broader standalone migration already defined in `specs/003-legacy-nextjs-migration`. Reusing the existing stack avoids unnecessary churn and keeps route rendering, styling, and browser validation aligned with the migrated application that already exists in the repository.

### Alternatives considered
- Introduce a separate visual-testing toolchain: rejected because Playwright and Vitest already cover the required browser and unit validation.
- Re-scope the feature as documentation-only: rejected because the feature changes how parity is validated and therefore affects implementation and test structure.

## Desktop-only legacy baseline policy

### Decision
Use legacy screenshots only for the two desktop viewports, `1366 x 768` and `1440 x 900`, producing exactly 10 approved baseline images.

### Rationale
The feature spec now treats legacy desktop presentation, branding, component identity, and content hierarchy as authoritative, while explicitly rejecting legacy responsive behavior as a requirement. Limiting screenshot baselines to desktop preserves strong visual parity where intended without forcing mobile or tablet designs to mirror legacy adaptation patterns.

### Alternatives considered
- Keep mobile legacy screenshot baselines: rejected because it would directly contradict the clarified feature scope.
- Remove legacy screenshot baselines entirely: rejected because desktop parity is still a core outcome of the feature.

## Responsive validation strategy

### Decision
Validate tablet and mobile behavior through explicit responsive-usability checks and geometry assertions instead of legacy screenshot matching.

### Rationale
Once smaller-screen layouts are allowed to reorganize intentionally, pixel comparison against the legacy pages becomes the wrong acceptance mechanism. Responsive validation should instead confirm user-centered outcomes: reachable navigation, visible primary actions, readable content flow, usable forms and tree panels, no clipped controls, and no unintended horizontal overflow.

### Alternatives considered
- Use loose screenshot tolerance for mobile: rejected because it would still anchor acceptance to the legacy responsive layout and make failures hard to interpret.
- Validate only overflow on smaller screens: rejected because overflow alone is too weak to prove usable adaptation.

## Deterministic browser environment

### Decision
Use the same pinned Playwright browser engine, viewport definitions, local font assets, and stable page-state rules for both legacy capture and migrated comparison.

### Rationale
The biggest risk in visual testing is environmental drift. Consistent browser/version selection, `document.fonts.ready`, asset-load waiting, disabled animations, and deterministic page states make desktop comparison runs repeatable and keep diff noise small enough to be meaningful.

### Alternatives considered
- Allow developers to generate baselines from arbitrary local environments: rejected because the spec requires explicit baseline governance and repeatable results.
- Use different browser setups for capture and comparison: rejected because it would increase false diffs and reduce trust in the baseline set.

## Repeatability governance

### Decision
Provide an explicit comparison-only repeatability command that runs the desktop comparison suite twice against the same approved baseline set.

### Rationale
The feature success criteria require two consecutive comparison runs to produce the same pass-or-fail outcome for the same code and approved baselines. Making that workflow explicit gives reviewers a simple way to confirm the deterministic environment still holds without refreshing baselines.

### Alternatives considered
- Treat single-run success as sufficient: rejected because it does not prove the environment is stable across repeated executions.
- Re-run the legacy capture flow as part of repeatability checks: rejected because repeatability must remain comparison-only and must not mutate the approved baseline set.

## Test split and artifact layout

### Decision
Split validation into three layers: unit tests for route/state rules, Playwright end-to-end tests for navigation and responsive usability, and Playwright visual tests for desktop screenshot comparison and geometry checks. Store approved baselines separately from temporary artifacts.

### Rationale
This feature needs both high-signal desktop parity checks and flexible responsive verification. Separating these concerns keeps failures easier to diagnose and prevents approved baselines from becoming mixed with transient run output.

### Alternatives considered
- Put all validation in one visual suite: rejected because responsive usability needs interaction and structural assertions, not only screenshots.
- Continue using a single mixed screenshot directory: rejected because it makes baseline review and governance ambiguous.

## Risk focus

### Decision
Treat the CreditModeler route, baseline governance, and environment drift as the primary planning risks.

### Rationale
CreditModeler has the most complex responsive layout because the stage bar, tree panel, and canvas can be reorganized across breakpoints. Separately, if baseline refresh is treated as a fix for app regressions, desktop parity loses meaning. Finally, browser and font drift can create false failures unless the environment is pinned.

### Alternatives considered
- Assume all routes carry equal visual risk: rejected because route complexity and responsive sensitivity differ materially.
