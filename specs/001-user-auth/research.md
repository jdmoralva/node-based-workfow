# Research: Internal User Login

## Decision 1: Add a dedicated `login.html` page and keep `index.html` as the current entry page

**Decision**: Introduce a generated `login.html` page and make it reachable from `index.html` through a visible sign-in entry action.

**Rationale**: This matches the feature requirement that the login page be reachable from the current entry point while keeping the change minimal inside the existing generator. It avoids repurposing `index.html` away from the current applications landing page and limits the scope to an additive frontend flow.

**Alternatives considered**:
- Make `index.html` itself the login page: rejected because the current feature spec assumes the login screen is reached from the existing entry point rather than replacing it.
- Add the login page only to sidebar navigation: rejected because the requirement explicitly calls out `index.html` as the integration point and a sign-in action should be obvious from the entry page.

## Decision 2: Keep the login page inside the shared dashboard shell

**Decision**: Render the login experience within the existing shell structure and shared stylesheet rather than creating a fully separate pre-auth template.

**Rationale**: The current generator always wraps pages with the shared topbar/sidebar layout. Reusing that structure preserves visual consistency, avoids branching the template for a one-page exception, and keeps the plan aligned with the repo's current page-construction model.

**Alternatives considered**:
- Build a dedicated standalone HTML template for login: rejected because it creates a second page shell pattern and increases maintenance in a repo that currently has one shared shell.
- Hide or remove shell chrome only on login with template conditionals: rejected for this phase because it adds generator complexity without being required by the feature.

## Decision 3: Add a login-specific page bootstrap for validation and placeholder submission

**Decision**: Use a dedicated login page bootstrap bundle for required-field validation, inline feedback, and a placeholder submit outcome.

**Rationale**: Existing interactive pages already use explicit `bootstrapKey` routing in `shell.py`, and the `file://` runtime requires any page behavior to be included in the inline module bundle. A dedicated bootstrap keeps login-specific behavior isolated and future backend wiring straightforward.

**Alternatives considered**:
- Rely entirely on native HTML required validation: rejected because the feature explicitly calls for submit behavior prepared for future integration and the plan needs a clear placeholder handler path.
- Put login logic directly into generated HTML: rejected because generated outputs are not the source of truth and would break the repo's generator workflow.

## Decision 4: Use a neutral placeholder result instead of simulated authenticated navigation

**Decision**: After successful client-side validation, the placeholder handler should show a neutral frontend-only status message that backend authentication is not connected yet and should not claim that a session exists.

**Rationale**: The request explicitly forbids simulating backend security mechanisms or exposing session-like behavior. A neutral placeholder response demonstrates the wiring without implying a protected session or authenticated route access.

**Alternatives considered**:
- Redirect to `applications.html` after submit: rejected because it can be misread as successful authentication.
- Store a mock token or login flag in browser storage: rejected because it conflicts with the feature's security boundaries.

## Decision 5: Verify the feature through the existing generator test plus generated-page inspection

**Decision**: Extend the focused shell test coverage and verify rebuilt HTML outputs directly.

**Rationale**: The repo has no general frontend test runner, but it does have a narrow regression test for the dashboard shell builder. Adding login coverage there plus rebuilding pages is the most reliable verification path already supported by the repo.

**Alternatives considered**:
- Add a new browser automation stack for this feature: rejected because it is out of proportion to the current static shell setup.
- Rely on manual inspection only: rejected because the generator path should remain covered by an automated regression test.
