# Data Model: Internal User Login

## Entity: Login Page View

**Purpose**: Represents the frontend screen for internal user sign-in within the static shell.

**Fields**:
- `entrySource`: where the user arrived from, expected to be the frontend entry point
- `title`: page heading for the internal sign-in experience
- `supportText`: short guidance explaining the login purpose and backend placeholder status
- `submitLabel`: label for the primary sign-in action

**Relationships**:
- Contains one credential form
- Can display one validation summary and one placeholder result message at a time

## Entity: Credential Form

**Purpose**: Captures the two user-entered fields required by the future backend authentication flow.

**Fields**:
- `username`: required text value
- `password`: required secret text value

**Validation Rules**:
- `username` must be present before submission
- `password` must be present before submission
- Submission is blocked while either required field is missing

**Relationships**:
- Belongs to one login page view
- Produces one credential submission attempt each time the user invokes sign-in

## Entity: Credential Submission Attempt

**Purpose**: Represents one frontend sign-in attempt and its immediate outcome.

**Fields**:
- `usernameProvided`: whether the username field was completed
- `passwordProvided`: whether the password field was completed
- `attemptStatus`: `idle | invalid | placeholder_complete`
- `feedbackMessage`: user-visible validation or placeholder status text

**State Transitions**:
- `idle -> invalid` when the user submits with one or both required fields missing
- `idle -> placeholder_complete` when the user submits with both required fields present
- `invalid -> idle` when the user corrects the form and clears validation state
- `placeholder_complete -> idle` only on page refresh or explicit new attempt reset

## Entity: Placeholder Authentication Result

**Purpose**: Makes the future backend integration point visible without representing real authentication.

**Fields**:
- `resultType`: informational placeholder only
- `message`: clarifies that backend authentication and session creation are not connected in this frontend phase
- `persistence`: none

**Validation Rules**:
- Must not claim that the user is authenticated
- Must not create or expose any token, cookie, or stored session artifact

## View-Level Rules

- The login page must remain visually consistent with the existing shell styling and UI patterns.
- The page must be reachable from `index.html`.
- The feature must stay entirely in the frontend layer.
