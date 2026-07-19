# Quickstart: CreditModeler Data Models Builder

This guide validates the feature end-to-end after implementation. It assumes the API and web apps are runnable locally and that the Connections feature is already implemented.

## Prerequisites

- At least one internal user account can sign in.
- At least two saved SQLite Connections exist for the signed-in user.
- The source SQLite files contain tables or views with columns suitable for a fact-to-dimension join.
- Dependencies are installed for `apps/api` and `apps/web`.

## Start The Apps

From `apps/api`:

```powershell
pytest
```

From `apps/web`:

```powershell
npm run test
npm run lint
```

For manual browser validation, run the API and web development servers using the existing project commands for each app.

## Manual Acceptance Flow

1. Sign in as an internal user.
2. Open `/creditmodeler-service`.
3. Confirm `Data Models` no longer shows static `Origination` or `Portfolio` children.
4. Click top-level `Data Models`.
5. Confirm a blank Data Model Builder appears inside the existing canvas panel.
6. Enter a unique data model name and save without selecting sources.
7. Confirm the saved draft appears under `Data Models` and the submenu auto-expands.
8. Open the saved draft and confirm the data model name is read-only.
9. Click `Test` while the draft is incomplete.
10. Confirm structured completeness diagnostics appear and no generated SQL, paths, stack traces, or raw driver errors are shown.
11. Add source Connections, choose a fact table, add a dimension, configure a relationship, and add one allowed row-level business rule.
12. Run `Test`.
13. Confirm zero-row compilation succeeds, status becomes `tested`, and compile-only warnings are visible.
14. Change an alias and confirm relationships and business rule references update where safely rewritable.
15. Save the edited model.
16. Confirm previous diagnostics remain visible but are marked stale, and status becomes `stale` or `draft` depending on completeness.
17. Configure an inner join and confirm the static warning is visible.
18. Delete or make unavailable one referenced Connection.
19. Reopen the Data Model and confirm it remains visible with missing-connection diagnostics.
20. Replace the missing Connection and confirm table names, aliases, relationships, and business rules are preserved where possible.
21. Retest successfully.
22. Drop the data model and confirm it disappears from the submenu after confirmation.

## Backend Contract Checks

Use the API contract in [contracts/data-models-api.md](./contracts/data-models-api.md) to validate:

- All endpoints require authentication.
- Users can create drafts with only a valid name.
- Per-user normalized name uniqueness is enforced.
- Different users can use the same model name.
- Updating a saved model with a changed name fails.
- Read, update, delete, saved test, and schema inspection enforce ownership.
- List returns all current-user models by default and supports one status filter.
- Schema inspection returns tables/views/columns only.
- Test responses never expose generated SQL, paths, stack traces, raw database errors, row data, or profiling details.

## Focused Verification Commands

From `apps/api`:

```powershell
pytest
```

From `apps/web`:

```powershell
npm run test
npm run lint
```

If builder layout or CSS changes affect workbench geometry, also run from `apps/web`:

```powershell
npm run test:visual:desktop
```
