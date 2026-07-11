# Contract: Migrated Navigation UI

## Purpose

Define the required user-visible navigation contract for the standalone frontend migration.

## Route inventory

| Legacy page | Migrated route | Purpose |
|-------------|----------------|---------|
| `index.html` | `/` | Public landing page |
| `login.html` | `/login` | Login interface |
| `applications.html` | `/applications` | Applications listing |
| `services.html` | `/services` | Services listing |
| `creditmodeler-service.html` | `/creditmodeler-service` | CreditModeler workbench |

## Route rules

- The root route renders the landing page directly and does not redirect automatically.
- All internal destinations are declared explicitly by the migrated application.
- Production navigation must not depend on `.html` filenames or string replacement.
- Direct route loading, refresh, bookmarking, opening in a new tab, and browser Back and Forward navigation must remain supported.

## Breadcrumb contract

### `/login`
- `Home` -> `/`
- `Sign In` -> current page

### `/applications`
- `Home` -> `/applications`
- `Applications` -> current page

### `/services`
- `Home` -> `/applications`
- `Applications` -> `/applications`
- `Services` -> current page

### `/creditmodeler-service`
- `Home` -> `/applications`
- `Applications` -> `/applications`
- `Services` -> `/services`
- `CreditModeler` -> current page

Shared breadcrumb rules:
- The current page segment is never rendered as a link.
- Navigable breadcrumb segments point only to supported destinations.

## Card navigation contract

### Applications collection

| Card | Destination | Navigable |
|------|-------------|------------|
| Reporting | `/services` | Yes |
| AI Copilot | None | No |
| Documentation | None | No |

### Services collection

| Card | Destination | Navigable |
|------|-------------|------------|
| CreditModeler | `/creditmodeler-service` | Yes |
| Mortgage | None | No |
| PayrollDeduction | None | No |

Shared card rules:
- Only cards with an explicit supported destination render as links.
- Non-navigable cards remain visible and may preserve local selection behavior.
- Menu buttons, metadata buttons, delete actions, and similar local controls must never trigger navigation.

## Sidebar and page-action contract

- The landing-page `Sign In` action opens `/login`.
- The Applications sidebar action opens `/applications`.
- The Applications section remains visually active while the user is inside `/applications`, `/services`, and `/creditmodeler-service`.

## Unsupported destinations

- Unknown or unmapped legacy destinations do not become routes automatically.
- Elements pointing at unsupported destinations do not render broken links.
- Adding a new supported destination requires an explicit update to route metadata and tests.
