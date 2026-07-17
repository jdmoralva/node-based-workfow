# Quickstart: CreditModeler Connections Builder Validation

## Prerequisites

- Backend dependencies installed in `apps/api`.
- Frontend dependencies installed in `apps/web`.
- At least one signed-in internal user is available.
- Test SQLite files are placed under `data/datasets/`, for example:

```text
data/datasets/portfolio.db
data/datasets/risk/loan_book.sqlite
```

Do not place secrets in dataset files used for validation.

## Backend Validation

Run from `apps/api`:

```powershell
pytest
```

Expected coverage:

- Discovery recursively finds `.db`, `.sqlite`, and `.sqlite3` files only.
- Discovery returns relative values and extensionless labels.
- Authenticated endpoints reject unauthenticated requests.
- A signed-in user can create, list, read, update, test, and delete their own saved connections.
- A signed-in user cannot access another user's saved connections.
- Duplicate labels are rejected after trimming whitespace and ignoring capitalization.
- Unknown, absolute, empty, and traversal-style database references are rejected.
- Unsaved test succeeds for a valid selectable SQLite file.
- Saved test updates `last_tested_at` only after success.
- Drop removes metadata only and leaves the source database file in place.
- Test responses do not expose table names, columns, schema, rows, datasets, variables, or absolute paths.

## Frontend Unit Validation

Run from `apps/web`:

```powershell
npm run test
npm run lint
```

Expected coverage:

- Selecting top-level `Connections` opens a blank builder.
- Database options load into a selector.
- Empty discovery shows a useful empty state.
- Save creates a visible child label under `Connections`.
- Selecting a saved label opens a populated builder.
- Existing labels are read-only.
- Updating changes selected database only.
- Test success and failure show visible feedback.
- Drop requires confirmation and refreshes the submenu after confirmation.
- Existing tree expand/collapse behavior remains valid.

## Visual And Interaction Validation

Run from `apps/web` when workbench layout or CSS changes are made:

```powershell
npm run test:visual:desktop
```

Protected-route visual checks use the same backend-auth gate as the protected e2e interaction tests. Without `E2E_AUTH_WITH_BACKEND` and a reachable backend auth service, those protected-route checks are skipped while public/login visual checks still run.

Expected outcome:

- Workbench frame, tree column, and canvas geometry remain aligned with the existing baseline.
- The Connection Builder appears inside the existing canvas panel rather than replacing the workbench layout.

## Manual Smoke Scenario

1. Start the backend and frontend using the existing app run commands.
2. Sign in as a test user.
3. Open `/creditmodeler-service`.
4. Select `Connections`.
5. Confirm the blank Connection Builder appears.
6. Enter label `Loan Book`.
7. Select `risk/loan_book` from the database selector.
8. Click `Test` and confirm success feedback.
9. Click `Save Connection` and confirm `Loan Book` appears under `Connections`.
10. Select `Loan Book` and confirm the builder is populated and the label is read-only.
11. Change the selected database, save, reopen, and confirm the updated selection persists.
12. Test the saved connection and confirm the successful test time updates.
13. Click `Drop`, cancel, and confirm the connection remains.
14. Click `Drop`, confirm, and verify the connection label disappears while the source database remains selectable.

## Contract Reference

Use [contracts/connections-api.md](./contracts/connections-api.md) for request/response expectations and [data-model.md](./data-model.md) for ownership, validation, and lifecycle rules.
