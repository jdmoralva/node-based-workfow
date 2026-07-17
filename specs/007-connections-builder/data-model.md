# Data Model: CreditModeler Connections Builder

## Entity: Saved Connection

Represents reusable connection metadata owned by one signed-in user.

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | identifier | Yes | Stable connection identity used for read, update, delete, and saved test operations. |
| `user_id` | identifier | Yes | Owner. References the signed-in internal user. |
| `label` | string | Yes | Display label. Set on creation and immutable afterward. |
| `normalized_label` | string | Yes | Trimmed and case-folded value used for per-user uniqueness checks. May be persisted or derived consistently. |
| `driver` | string | Yes | Fixed to `sqlite` for this feature stage. |
| `database_path` | string | Yes | Relative discovered dataset value such as `portfolio.db` or `risk/loan_book.sqlite`. Never an absolute path. |
| `created_at` | timestamp | Yes | Creation time. |
| `updated_at` | timestamp | Yes | Last metadata update time. |
| `last_tested_at` | timestamp | No | Updated only after successful saved-connection tests. |

### Relationships

- A signed-in user owns zero or more saved connections.
- A saved connection belongs to exactly one signed-in user.
- A saved connection references one discovered database option by relative `database_path`.

### Validation Rules

- `label` must be non-empty after trimming surrounding whitespace.
- `(user_id, normalized_label)` must be unique.
- Different users may use the same label independently.
- `label` cannot be changed after creation.
- `driver` must be `sqlite`.
- `database_path` must match a currently discovered database option when creating, updating, or testing.
- `database_path` must be relative and must not be empty, absolute, or traversal-style.
- Dropping a saved connection deletes only this metadata record.

### State Transitions

```text
New form -> Saved Connection -> Updated Saved Connection -> Dropped
                  │
                  └── Successful saved test updates last_tested_at
```

Failed tests do not change `last_tested_at`. If a referenced database file disappears, the saved connection remains but open/test operations must show a clear failure state.

## Entity: Database Option

Represents a selectable SQLite database file discovered under the approved datasets area.

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `value` | string | Yes | Relative file reference used internally, including extension. |
| `label` | string | Yes | User-facing display label with `.db`, `.sqlite`, or `.sqlite3` removed. Includes relative folder context for nested files. |
| `extension` | string | Yes | One of `.db`, `.sqlite`, `.sqlite3`. May be derived from `value`. |

### Validation Rules

- Discovery includes only `.db`, `.sqlite`, and `.sqlite3` files.
- Discovery is recursive under the approved datasets area.
- Values must be relative to the datasets root.
- Values must not expose absolute paths.
- Labels omit supported file extensions.

## Entity: Signed-In User

Represents the authenticated workbench user.

### Fields Used By This Feature

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | identifier | Yes | Used for ownership and per-user uniqueness. |

### Rules

- Unauthenticated users cannot discover, create, read, update, test, or drop connections.
- A user can only manage their own saved connections.
