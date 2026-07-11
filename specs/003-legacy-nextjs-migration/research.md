# Research: Legacy Frontend Standalone Migration

## Frontend application boundary

### Decision
Create one standalone application under `apps/web` and treat `frontend/` strictly as a migration reference and baseline source.

### Rationale
The feature requires the new application to run without the legacy generator, stylesheets, or generated HTML at build time or runtime. A hard application boundary keeps production dependencies clean and makes it easy to prove that all routes, assets, and interactions are owned by the migrated app.

### Alternatives considered
- Continue reading configuration or assets directly from `frontend/`: rejected because it would keep the new app coupled to legacy sources.
- Copy generated HTML into the new app and progressively wrap it: rejected because it would preserve generator output instead of replacing it.

## Routing and navigation migration

### Decision
Represent all supported destinations as explicit application-owned route metadata and map legacy `href` values to those destinations once during migration.

### Rationale
The legacy JSON and generated pages already define the authoritative navigation inventory. A typed route map prevents leftover `.html` string manipulation, keeps breadcrumbs and cards consistent, and gives tests one source of truth for supported versus unsupported destinations.

### Alternatives considered
- Continue storing `.html` targets and strip extensions at runtime: rejected because the feature explicitly forbids that behavior.
- Hardcode route strings independently in each component: rejected because it makes navigation drift and test duplication more likely.

## UI composition strategy

### Decision
Rebuild the shell declaratively from shared components and route-specific feature modules instead of recreating the Python template system in JavaScript.

### Rationale
The current frontend is composed from reusable fragments such as shell chrome, card grids, the login panel, and the CreditModeler workbench. Preserving those seams in component form keeps the migration small enough to reason about, avoids string-template rendering, and lets route-specific interactions stay isolated.

### Alternatives considered
- One very large page per route with minimal shared components: rejected because repeated shell markup would drift quickly.
- A component layer that mirrors every legacy partial one-to-one regardless of need: rejected because it can overfit the generator instead of the user experience.

## Styling and asset strategy

### Decision
Recreate the visual system inside `apps/web` with app-owned tokens, utility classes, and reusable component class patterns while moving fonts, icons, images, and the favicon into `apps/web/public`.

### Rationale
The migration must preserve the current visual identity without depending on `frontend/style.css`. Local app-owned design tokens make repeated colors, spacing, shadows, and dimensions consistent while keeping the migrated code maintainable. Moving the Barlow fonts, sprite assets, and favicon into `apps/web/public` removes runtime coupling to the legacy directory.

### Alternatives considered
- Import the legacy stylesheet directly: rejected because the feature explicitly forbids it.
- Copy legacy CSS verbatim into the new app and keep editing it: rejected because it preserves the old styling model instead of completing the migration.

## Interaction-state strategy

### Decision
Keep all interactive behavior in local frontend state and rewrite the current card-selection, login-validation, and tree-toggle behaviors as component-owned interactions.

### Rationale
The existing interface behaviors are local shell interactions, not backend workflows. Local state is sufficient for selected-card styling, expandable tree nodes, validation messages, and similar temporary UI states while staying within the frontend-only scope.

### Alternatives considered
- Introduce backend calls or persistent browser storage for UI state: rejected because this phase must remain frontend-only and must not simulate real authentication.
- Keep legacy controller scripts and mount them inside the new app: rejected because the feature forbids dependency on legacy JavaScript controllers.

## Test strategy

### Decision
Use Vitest plus React Testing Library for configuration and component behavior, and Playwright for route-level interaction, responsive verification, and screenshot-based visual regression.

### Rationale
The migration needs fast checks for route metadata, breadcrumb rules, card navigability, and local interaction behavior, plus high-confidence browser validation for the five migrated pages across required viewports. Splitting tests this way keeps browser coverage focused where it matters most and preserves quick feedback for route/config regressions.

### Alternatives considered
- Playwright-only coverage for everything: rejected because simple metadata and component behavior checks would become slower and noisier than needed.
- Unit tests only: rejected because navigation, keyboard behavior, and responsive visual parity require real browser validation.

## Visual regression baseline strategy

### Decision
Use the current generated pages as the initial visual baseline source and capture screenshot coverage for `/`, `/login`, `/applications`, `/services`, and `/creditmodeler-service` at 1366 x 768, 1440 x 900, and 390 x 844.

### Rationale
The feature explicitly defines the route and viewport matrix and names the specific visual checkpoints to preserve. Using the generated pages as the baseline lets the migration prove parity against the current production-like shell rather than against a redesigned target.

### Alternatives considered
- Approve the migrated UI visually without baseline screenshots: rejected because it would make visual parity subjective and hard to repeat.
- Limit screenshots to one desktop size: rejected because the feature requires desktop and mobile coverage and places responsive behavior inside scope.
