# Contract: Connections API

All routes are authenticated and scoped to the current signed-in user. Responses must not expose absolute filesystem paths. Error responses should use the existing API error style and include user-actionable messages where validation fails.

## Data Shapes

### DatabaseOption

```json
{
  "value": "risk/loan_book.sqlite",
  "label": "risk/loan_book"
}
```

### SavedConnection

```json
{
  "id": "connection-id",
  "label": "Loan Book",
  "driver": "sqlite",
  "database_path": "risk/loan_book.sqlite",
  "created_at": "2026-07-16T10:00:00Z",
  "updated_at": "2026-07-16T10:00:00Z",
  "last_tested_at": null
}
```

### ConnectionTestResult

```json
{
  "ok": true,
  "message": "Connection test succeeded."
}
```

The test result must not include table names, column names, schema details, dataset contents, variables, or absolute paths.

## Endpoints

### List Discovered Databases

`GET /api/connections/databases`

Returns selectable database options discovered recursively under `data/datasets/`.

Success response:

```json
{
  "databases": [
    {
      "value": "portfolio.db",
      "label": "portfolio"
    },
    {
      "value": "risk/loan_book.sqlite",
      "label": "risk/loan_book"
    }
  ]
}
```

Contract requirements:

- Include only `.db`, `.sqlite`, and `.sqlite3` files.
- Return relative `value` strings only.
- Return extensionless labels.
- Return an empty list when no supported files exist.

### List Saved Connections

`GET /api/connections`

Returns saved connections for the current user only.

Success response:

```json
{
  "connections": [
    {
      "id": "connection-id",
      "label": "Loan Book",
      "driver": "sqlite",
      "database_path": "risk/loan_book.sqlite",
      "created_at": "2026-07-16T10:00:00Z",
      "updated_at": "2026-07-16T10:00:00Z",
      "last_tested_at": null
    }
  ]
}
```

### Create Saved Connection

`POST /api/connections`

Request:

```json
{
  "label": "Loan Book",
  "driver": "sqlite",
  "database_path": "risk/loan_book.sqlite"
}
```

Success response: `201 Created` with `SavedConnection`.

Validation failures:

- Missing or blank label.
- Duplicate label for current user after trimming and case folding.
- Driver other than `sqlite`.
- Unknown, empty, absolute, or traversal-style `database_path`.

### Read Saved Connection

`GET /api/connections/{id}`

Returns the saved connection when it belongs to the current user. Returns not found for missing or non-owned connections.

### Update Saved Connection

`PUT /api/connections/{id}`

Request:

```json
{
  "driver": "sqlite",
  "database_path": "portfolio.db"
}
```

Success response: updated `SavedConnection`.

Contract requirements:

- Label is immutable and must not be changed by this operation.
- Current user must own the connection.
- `database_path` must match a currently discovered database option.

### Delete Saved Connection

`DELETE /api/connections/{id}`

Success response: no content or a success envelope consistent with existing API style.

Contract requirements:

- Current user must own the connection.
- Delete saved metadata only.
- Do not delete the source database file.

### Test Unsaved Selection

`POST /api/connections/test`

Request:

```json
{
  "driver": "sqlite",
  "database_path": "risk/loan_book.sqlite"
}
```

Success response: `ConnectionTestResult`.

Contract requirements:

- Validate `database_path` against discovered options before opening.
- Confirm the file can be opened and minimally queried.
- Do not create files.
- Do not update saved connection metadata.
- Do not return table, column, schema, dataset, or variable metadata.

### Test Saved Connection

`POST /api/connections/{id}/test`

Success response: `ConnectionTestResult` plus the updated saved connection if consistent with existing API style.

Contract requirements:

- Current user must own the connection.
- Validate the saved `database_path` against discovered options before opening.
- Confirm the file can be opened and minimally queried.
- Update `last_tested_at` only after success.
- Do not return table, column, schema, dataset, or variable metadata.

## Error Cases To Cover

- Unauthenticated request.
- Missing connection.
- Non-owned connection.
- Duplicate label after trimming and case folding.
- Blank label.
- Unsupported driver.
- Unsupported file extension.
- Unknown database option.
- Absolute path.
- Path traversal.
- Database file cannot be opened.
- Database file cannot be minimally queried.
