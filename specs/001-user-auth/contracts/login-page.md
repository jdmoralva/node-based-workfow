# UI Contract: Internal User Login Page

## Purpose

Define the user-facing contract for the frontend login page so the implementation stays compatible with future backend-managed username/password authentication without simulating backend security today.

## Entry Contract

- The page is exposed as `login.html` in the generated frontend output.
- `index.html` presents a visible navigation path to `login.html`.
- The login page uses the existing frontend shell and shared visual language.

## Form Contract

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Username | Text input | Yes | Intended to map to future backend username credential |
| Password | Password input | Yes | Intended to map to future backend password credential |

### Primary Action

- Label: Sign In
- Behavior: submits the frontend form through the page's placeholder authentication handler

## Validation Contract

- If `Username` is empty on submit, the page shows an inline required-field message.
- If `Password` is empty on submit, the page shows an inline required-field message.
- If both are empty, both required-field messages are shown in the same attempt.
- Validation feedback clears or updates as the user corrects the affected field.

## Placeholder Submit Contract

- A submit attempt with both fields completed triggers a frontend-only placeholder handler.
- The placeholder handler returns a visible informational result on the page.
- The informational result must state or imply that backend authentication is not yet connected.
- The placeholder handler must not:
  - create a real session
  - store a token or credential in browser storage
  - claim the user is authenticated
  - bypass future backend-controlled access rules

## Future Compatibility Contract

- The form must keep a clear username/password submission path that can later be replaced by a backend request.
- The page structure must leave room for backend-driven error states such as invalid credentials or unavailable authentication service.
- The current placeholder result is temporary and must be replaceable without redesigning the page layout.
