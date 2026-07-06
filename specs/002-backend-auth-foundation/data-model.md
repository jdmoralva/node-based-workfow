# Data Model: Backend Authentication Foundation

## Internal User

### Purpose
Represents an internal pilot user who can authenticate to the backend with a username and password.

### Fields
- `id`: unique internal user identifier
- `username`: unique login name used for authentication
- `password_hash`: stored non-plain-text password representation
- `is_active`: indicates whether the user can sign in
- `created_at`: when the user record was created
- `updated_at`: when the user record was last changed

### Validation rules
- `username` must be unique within the application database
- `username` must be present for every user
- `password_hash` must always be stored instead of a raw password
- inactive users must not be treated as successfully authenticated

### Relationships
- One internal user can own many authenticated sessions

## Authenticated Session

### Purpose
Represents backend-managed authenticated state for one signed-in browser session.

### Fields
- `id`: unique session identifier
- `user_id`: reference to the internal user
- `session_token_hash`: stored representation of the opaque session token sent via cookie
- `created_at`: when the session was created
- `last_seen_at`: last validated use of the session
- `expires_at`: when the session is no longer valid
- `revoked_at`: when the session was explicitly invalidated

### Validation rules
- every authenticated session must belong to exactly one internal user
- `session_token_hash` must not store the raw browser cookie value
- a session with `revoked_at` set must be treated as invalid
- a session past `expires_at` must be treated as invalid

### Relationships
- Many authenticated sessions can belong to one internal user

### State transitions
- `created` -> `active` when a valid login creates the session
- `active` -> `revoked` when logout clears the session
- `active` -> `expired` when the session lifetime ends

## Health Status Response

### Purpose
Represents the backend availability response used by operators or integration checks.

### Fields
- `status`: current availability indicator
- `service`: backend application identifier

### Validation rules
- `status` must always be present in the health response
- health responses must not require authentication

## Current User Response

### Purpose
Represents the authenticated user identity returned to the frontend after session validation.

### Fields
- `id`: internal user identifier
- `username`: authenticated username

### Validation rules
- response must never include password material or raw session token data
- response is only available when the session is valid
