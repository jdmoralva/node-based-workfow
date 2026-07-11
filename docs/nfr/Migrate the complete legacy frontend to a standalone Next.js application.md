````markdown
# Migrate the legacy static frontend to a standalone Next.js application

Convert the existing static frontend under `frontend/` into a modern, production-oriented web application based on Next.js, React, and TypeScript.

The new application must be implemented under:

```text
apps/web
````

Use Next.js App Router as the routing and page-composition architecture.

This migration must cover the complete legacy frontend, including its pages, visual design, reusable interface elements, assets, interactions, and navigation behavior.

The resulting application must be fully independent from the legacy HTML generator, legacy stylesheets, and generated `.html` files.

## Primary objective

The completed `apps/web` application must:

* reproduce every page currently generated under `frontend/`;
* preserve the visual identity and interaction patterns of the legacy frontend;
* replace generated HTML pages with Next.js routes;
* replace legacy DOM-generation scripts with reusable React components;
* replace the legacy CSS implementation with a modern CSS framework;
* preserve navigation behavior based on the legacy `href` definitions;
* avoid `.html` references in the production application;
* remain fully frontend-only during this stage; and
* run without requiring `frontend/` at build time or runtime.

## Technology requirements

The frontend must use:

```text
Next.js
App Router
React
TypeScript
Tailwind CSS
```

Tailwind CSS must become the primary styling framework for the migrated application.

The implementation must not depend on:

* `frontend/style.css`;
* legacy HTML partials;
* the Python HTML generator;
* generated `.html` files;
* legacy JavaScript controllers;
* CSS files outside `apps/web`;
* configuration imports from `frontend/`; or
* assets loaded directly from the legacy directory.

## Migration source of truth

The following legacy resources must be reviewed during migration:

```text
frontend/index.html
frontend/login.html
frontend/applications.html
frontend/services.html
frontend/creditmodeler-service.html

frontend/style.css
frontend/assets/
frontend/src/dashboard_shell/
frontend/scripts/build_dashboard_shell.py
frontend/scripts/dashboard_shell_build/
```

These resources are migration references only.

They may be inspected to identify:

* page inventory;
* visual hierarchy;
* component structure;
* spacing;
* typography;
* responsive behavior;
* icons and assets;
* interaction patterns;
* navigation targets;
* page metadata; and
* accessibility labels.

The completed application must not import or execute these legacy resources.

## Application routes

Replace the legacy HTML pages with the following Next.js routes:

| Legacy page                  | Next.js route            | Purpose                 |
| ---------------------------- | ------------------------ | ----------------------- |
| `index.html`                 | `/`                      | Public landing page     |
| `login.html`                 | `/login`                 | Login interface         |
| `applications.html`          | `/applications`          | Applications listing    |
| `services.html`              | `/services`              | Services listing        |
| `creditmodeler-service.html` | `/creditmodeler-service` | CreditModeler workbench |

Each route must be implemented using the App Router directory structure.

A suggested structure is:

```text
apps/web/
├── app/
│   ├── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── applications/
│   │   └── page.tsx
│   ├── services/
│   │   └── page.tsx
│   ├── creditmodeler-service/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
├── features/
├── config/
├── public/
├── tests/
├── package.json
└── tsconfig.json
```

The exact internal structure may differ, provided that shared UI, route-specific functionality, configuration, and assets remain clearly separated.

## Removal of `.html` references

The production application must not use legacy `.html` references in:

* React components;
* navigation configuration;
* `Link` components;
* router calls;
* breadcrumbs;
* card definitions;
* tests;
* accessibility labels;
* redirect logic; or
* runtime route resolution.

The following pattern must not remain in production code:

```ts
href.replace('.html', '')
```

Legacy HTML destinations must be migrated once into explicit typed Next.js routes.

For example:

```ts
export const routes = {
  home: '/',
  login: '/login',
  applications: '/applications',
  services: '/services',
  creditModelerService: '/creditmodeler-service',
} as const;
```

All components must consume these route definitions instead of transforming strings at runtime.

## Legacy `href` migration rules

The `href` values currently defined in `frontend/` must be treated as the source of truth for determining:

* whether an interface element is navigable;
* the destination of the navigation action;
* the accessible description of the link; and
* the expected navigation hierarchy.

The migration process must convert the current legacy values into the following route mappings:

| Legacy `href`                | Next.js destination      |
| ---------------------------- | ------------------------ |
| `index.html`                 | `/`                      |
| `login.html`                 | `/login`                 |
| `applications.html`          | `/applications`          |
| `services.html`              | `/services`              |
| `creditmodeler-service.html` | `/creditmodeler-service` |

After migration, the `.html` values must no longer be used by `apps/web`.

## Navigation behavior

### Landing page

The `/` route must reproduce the legacy `index.html` page.

The `Sign In` action must navigate to:

```text
/login
```

The root route must render the landing page and must not redirect automatically to `/applications`.

### Sidebar

The Applications sidebar action must navigate to:

```text
/applications
```

The sidebar must use a semantic Next.js `Link`.

The active navigation state must be preserved while the user is within the Applications section.

### Application cards

The legacy Applications page contains:

* Reporting;
* AI Copilot;
* Documentation.

Only elements that define an `href` in the legacy configuration may become navigation links.

#### Reporting

The Reporting application currently points to `services.html`.

Its migrated destination must be:

```text
/services
```

The complete navigable card area must use a semantic Next.js link or stretched-link implementation.

#### AI Copilot

AI Copilot currently has no `href`.

It must therefore:

* remain non-navigable;
* not render a placeholder link;
* not navigate to an invented route;
* preserve its card-selection behavior; and
* remain available as a visual interface element.

#### Documentation

Documentation currently has no `href`.

It must therefore:

* remain non-navigable;
* not render a placeholder link;
* not navigate to an invented route;
* preserve its card-selection behavior; and
* remain available as a visual interface element.

### Service cards

The legacy Services page contains:

* CreditModeler;
* Mortgage;
* PayrollDeduction.

#### CreditModeler

CreditModeler currently points to `creditmodeler-service.html`.

Its migrated destination must be:

```text
/creditmodeler-service
```

#### Mortgage

Mortgage currently has no `href`.

It must remain non-navigable and must not introduce an invented route.

#### PayrollDeduction

PayrollDeduction currently has no `href`.

It must remain non-navigable and must not introduce an invented route.

## Breadcrumb navigation

Breadcrumbs must use explicit Next.js routes.

### Login page

```text
Home → /
Sign In → current page
```

### Applications page

```text
Home → /applications
Applications → current page
```

### Services page

```text
Home → /applications
Applications → /applications
Services → current page
```

### CreditModeler page

```text
Home → /applications
Applications → /applications
Services → /services
CreditModeler → current page
```

The current breadcrumb segment must not be rendered as a link.

## Unknown navigation destinations

The migration must not automatically create routes from unknown legacy filenames.

When an unmapped `href` is found:

* the route must not be generated through string manipulation;
* the element must not render a broken link;
* the migration must report the unmapped destination;
* the route must be added explicitly to the route configuration; and
* automated tests must be updated before the destination is considered supported.

## Page inventory

The migration must include every page currently generated by the legacy frontend.

### `/`

Reproduce the legacy public Applications landing page, including:

* shared top bar;
* Risk Viewer branding;
* breadcrumb row;
* sidebar;
* Applications hero ribbon;
* Sign In action;
* application cards; and
* legacy navigation behavior.

### `/login`

Reproduce the legacy login interface, including:

* shared shell;
* centered login panel;
* centered hero ribbon;
* username field;
* password field;
* submit button;
* required-field validation;
* responsive behavior; and
* visual feedback states.

Because backend integration is outside the scope of this stage, the login form must not:

* call an authentication API;
* create a session;
* read or write authentication cookies;
* store authentication tokens;
* validate credentials against a backend; or
* implement protected-route behavior.

The login form may implement frontend-only validation and a clearly identified local placeholder result.

It must not simulate real authentication security.

### `/applications`

Reproduce the legacy Applications page, including:

* shared shell;
* Applications hero ribbon;
* Create Application action;
* application card grid;
* selected-card state;
* card badges;
* card menu actions;
* metadata actions;
* card dividers; and
* Reporting navigation to `/services`.

### `/services`

Reproduce the legacy Services page, including:

* services-specific layout;
* services toolbar;
* hero ribbon;
* service creation action;
* service-card grid;
* service icons;
* card actions;
* CreditModeler navigation; and
* non-navigable Mortgage and PayrollDeduction cards.

### `/creditmodeler-service`

Reproduce the legacy CreditModeler workbench, including:

* complete breadcrumb hierarchy;
* stage navigation;
* object-tree panel;
* search input;
* sidebar controls;
* expandable tree nodes;
* selected tree states;
* design canvas;
* empty-canvas message; and
* responsive workbench layout.

## React component architecture

Replace the Python-based page-generation approach with reusable React components.

At minimum, create components for:

```text
ApplicationShell
Topbar
Brand
Breadcrumbs
Sidebar
HeroRibbon
PageHeader
ApplicationCard
ApplicationGrid
ServiceToolbar
ServiceCard
ServiceGrid
LoginForm
StageBar
Workbench
ObjectTree
ObjectTreeItem
CanvasPanel
Icon
```

Do not recreate the Python generator using JavaScript string replacement.

Pages must be composed declaratively through React and JSX.

Do not use:

* `dangerouslySetInnerHTML`;
* HTML templates stored as strings;
* iframes containing legacy pages;
* copied generated HTML files under `public`; or
* runtime execution of the Python generator.

## Styling migration

Rebuild the complete visual system using Tailwind CSS.

The new implementation must reproduce the legacy interface without importing or copying the legacy stylesheet as a production dependency.

The Tailwind implementation must cover:

* design tokens;
* colors;
* gradients;
* typography;
* spacing;
* dimensions;
* borders;
* border radii;
* shadows;
* grid layouts;
* responsive breakpoints;
* hover states;
* focus states;
* active states;
* selected states;
* disabled states; and
* page-specific layouts.

## Tailwind design tokens

Move reusable legacy values into the Tailwind theme or CSS custom properties managed within `apps/web`.

This should include values equivalent to:

* page background;
* surface colors;
* border colors;
* primary brand colors;
* muted text colors;
* card shadows;
* panel shadows;
* component radii;
* layout widths; and
* responsive breakpoints.

Avoid repeating arbitrary values throughout multiple components when a shared design token is appropriate.

## Visual fidelity

The new CSS framework must not produce a redesign.

The migrated application must preserve:

* the Risk Viewer visual identity;
* the top-bar structure;
* the sidebar geometry;
* the hero-ribbon appearance;
* card proportions;
* card spacing;
* service toolbar arrangement;
* login-panel positioning;
* CreditModeler workbench proportions;
* icon sizes;
* responsive behavior; and
* overall page hierarchy.

Tailwind utility classes may be extracted into reusable React components or component-level class constants to avoid unreadable duplication.

## Asset migration

Move all required static assets into `apps/web/public`.

This includes:

```text
fonts
icons
SVG sprite definitions
images
favicon
```

The migrated application must not load assets from `frontend/`.

Font loading should use the Next.js font system where practical.

Icons may be migrated into reusable React SVG components while preserving their existing visual appearance and accessible behavior.

## Frontend-only behavior

This migration stage must remain isolated to the frontend.

Do not implement or modify:

* API clients;
* backend authentication;
* session validation;
* secure cookies;
* login endpoints;
* logout endpoints;
* protected API calls;
* backend persistence;
* database integration;
* reverse-proxy configuration;
* server-side authorization; or
* communication with `apps/api`.

All pages must remain directly accessible during this stage.

No route should depend on an active backend service.

## Local interface state

Frontend interactions may use local React state where required.

Examples include:

* selected application card;
* expanded tree nodes;
* selected tree item;
* login-form validation;
* disabled button states;
* placeholder action feedback; and
* temporary interface state.

Local state must not be presented as a real authenticated session.

Do not store simulated credentials or tokens in browser storage.

## Internal navigation requirements

All internal route navigation must use:

```text
next/link
next/navigation
```

Use semantic links for user-initiated route navigation.

Programmatic navigation should only be used when a user action cannot be represented appropriately by a normal link.

The application must support:

* browser Back;
* browser Forward;
* opening links in new tabs;
* copying link addresses;
* direct route access;
* page refresh;
* bookmarking; and
* client-side navigation without full page reloads.

## Interactive card behavior

Navigable cards may contain internal action buttons.

The implementation must ensure that:

* activating the stretched card link navigates;
* activating the card menu does not navigate;
* activating metadata buttons does not navigate;
* activating Delete does not navigate;
* activating More Options does not navigate; and
* keyboard interaction remains predictable.

Navigation and card selection must be implemented as separate behaviors.

## Responsive behavior

Preserve the responsive behavior of the legacy frontend.

Validate at minimum:

```text
1440 × 900
1366 × 768
1280 × 800
768 × 1024
390 × 844
```

The application must prevent unintended horizontal scrolling.

The following elements must adapt correctly:

* application card grid;
* service card grid;
* sidebar;
* content padding;
* hero ribbon;
* primary page actions;
* login panel;
* services toolbar;
* stage bar;
* object-tree panel; and
* workbench canvas.

## Accessibility requirements

The migration must preserve or improve accessibility.

The application must include:

* semantic landmarks;
* accessible page headings;
* labelled navigation regions;
* labelled form fields;
* keyboard-operable links and controls;
* visible focus indicators;
* correct `aria-current` values;
* correct `aria-expanded` values;
* meaningful icon-button labels;
* accessible card-link labels;
* associated validation messages; and
* decorative icons hidden from assistive technologies.

Elements without a navigation destination must not be exposed as links.

## Testing requirements

Add automated tests for:

* rendering of every migrated route;
* complete route configuration;
* public page navigation;
* sidebar navigation;
* breadcrumb navigation;
* Reporting navigation;
* CreditModeler navigation;
* non-navigable cards;
* card-selection behavior;
* internal card controls;
* login-form validation;
* tree expansion and collapse;
* responsive layout behavior;
* keyboard accessibility;
* direct route loading; and
* absence of `.html` references in production source code.

## Visual regression testing

Add Playwright screenshot tests for:

```text
/
/login
/applications
/services
/creditmodeler-service
```

Use the generated legacy pages as the initial migration reference.

Capture screenshots at:

```text
1366 × 768
1440 × 900
390 × 844
```

Visual regression tests must validate:

* shell dimensions;
* top-bar height;
* sidebar placement;
* hero-ribbon dimensions;
* card sizes;
* grid spacing;
* typography;
* icon dimensions;
* toolbar layout;
* login alignment;
* tree-panel dimensions; and
* responsive behavior.

## Prohibited implementation approaches

Do not:

* import `frontend/style.css`;
* copy generated HTML files into `public`;
* use `.html` links in the Next.js application;
* transform `.html` strings at runtime;
* import JSON directly from `frontend/`;
* execute the Python generator from `apps/web`;
* embed legacy pages through iframes;
* use `dangerouslySetInnerHTML` to render legacy templates;
* introduce backend integration during this stage;
* simulate real authentication;
* invent routes for elements without legacy `href` values; or
* redesign the interface.

## Out of scope

The following items are explicitly outside this migration stage:

* integration with `apps/api`;
* user authentication;
* session persistence;
* route protection;
* authorization;
* backend data retrieval;
* dataset functionality;
* pipeline persistence;
* workflow execution;
* database integration;
* corporate SSO;
* role-based access control;
* production reverse-proxy configuration; and
* deletion of the legacy frontend.

## Definition of Done

The migration is complete when:

* `apps/web` is a working Next.js App Router application;
* all source code is written in TypeScript and React;
* Tailwind CSS is configured and used as the primary styling framework;
* all five legacy pages have equivalent Next.js routes;
* the visual design closely reproduces the legacy frontend;
* all required legacy assets have been migrated into `apps/web`;
* the route configuration contains no `.html` references;
* every legacy `href` has been converted into an explicit Next.js route;
* elements without legacy `href` values remain non-navigable;
* Reporting navigates to `/services`;
* CreditModeler navigates to `/creditmodeler-service`;
* breadcrumbs use explicit Next.js destinations;
* navigation works without full page reloads;
* all pages run without a backend service;
* the login form remains frontend-only;
* `apps/web` contains no imports from `frontend/`;
* the Python HTML generator is not required to build or run the application;
* functional, responsive, accessibility, and navigation tests pass;
* visual regression tests pass within the agreed tolerance; and
* the legacy `frontend/` directory remains available only as a temporary migration reference.


