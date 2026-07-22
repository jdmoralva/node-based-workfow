# Quickstart: CreditModeler Data Models Builder

This guide validates the feature end-to-end after implementation. It assumes the API and web apps are runnable locally and that the Connections feature is already implemented.

## Prerequisites

- At least one internal user account can sign in.
- A saved SQLite Chinook Connection exists for the signed-in user and exposes declared foreign keys.
- If cross-connection manual joins are being verified, at least one additional saved SQLite Connection exists.
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
6. Confirm a new draft contains `schema_version: 2`, a null fact, and empty collections.
7. Enter a unique data model name and save without selecting sources.
8. Confirm the saved draft appears under `Data Models`, the submenu auto-expands, and the model name is read-only after reopen.
9. Click `Test` while the saved draft is incomplete. Confirm this sends the bodyless saved-model test and returns structured completeness errors.
10. Make a local unsaved edit and click `Test`. Confirm the dirty definition uses unsaved Test, does not mark the older saved definition tested, and no generated SQL, paths, stack traces, raw errors, rows, or profiling details appear.
11. Add the Chinook Connection and select `InvoiceLine` as the fact with grain `one row per invoiced track`.
12. Confirm the fact receives a stable `fact_` ID and selecting it opens a detected-join review queue without changing the draft.
13. Review the path-qualified proposals and select the full prerequisite closure needed for the approved tree.
14. Confirm the review states the total tables and relationships that will be added, then use `Add selected`.
15. Confirm dimensions and explicit parent/child relationships are inserted atomically in root-first order.
16. Confirm the queue does not propose `Playlist`, `PlaylistTrack`, or unrelated tables.
17. Confirm the Model map contains this exact rooted graph:

```text
InvoiceLine
|- Invoice
|  `- Customer
|     `- Employee
`- Track
   |- Album
   |  `- Artist
   |- Genre
   `- MediaType
```

18. Confirm all eight edges default to left joins and all nine table instances have exactly one path to `InvoiceLine`.
19. Confirm endpoint cards use `From table`/`Joined table` and parent/child column controls and show detected provenance.
20. Add one allowed row-level business rule and run unsaved Test.
21. Confirm zero-row compilation succeeds and the compile-only warning mentions multi-hop filtering, unmatched lookup values, fanout, and cardinality limits.
22. Save, then run the bodyless saved-model Test. Confirm status becomes `tested` and the saved timestamps and diagnostics refer to the canonical saved definition.
23. Submit or simulate the relationships in a different array order and confirm the same join plan outcome and diagnostic ordering.
24. Change a multi-hop endpoint or key. Confirm compatible key pairs remain and incompatible pairs clear visibly without silent substitution.
25. Save the semantic change. Confirm prior diagnostics remain visible but stale and status becomes `stale` or `draft` according to completeness.
26. Configure an inner join and confirm a path-specific root-filter warning is visible.
27. Remove the `Track→Album` relationship. Confirm `Album→Artist` remains configured as a disconnected repair branch that saves as `draft` and fails Test with connectivity errors.
28. Reattach the branch manually from a root-connected table and retest.
29. Remove an intermediate table and verify both confirmation choices: preserve descendants for reattachment, or remove the entire branch. Cancel once and confirm no partial mutation.
30. Clear the fact and confirm only relationships touching it are removed while dimension branches and business rules remain repairable.
31. Restore the fact and confirm a new stable fact ID is used unless the object is a normalized legacy placeholder.
32. Delete or make unavailable one referenced Connection.
33. Reopen the model and confirm table-instance IDs, table names, aliases, relationships, and business rules remain visible with missing-source diagnostics.
34. Replace the missing Connection and retest successfully.
35. On a narrow viewport, confirm suggestions and cards precede the Model map, key rows stack, keyboard flows remain available, and no horizontal page scrolling is introduced.
36. Drop the data model and confirm it disappears from the submenu after confirmation.

## Chinook Edge Checklist

| Parent/root-side table | Parent column | Child/joined table | Child column |
|---|---|---|---|
| InvoiceLine | InvoiceId | Invoice | InvoiceId |
| Invoice | CustomerId | Customer | CustomerId |
| Customer | SupportRepId | Employee | EmployeeId |
| InvoiceLine | TrackId | Track | TrackId |
| Track | AlbumId | Album | AlbumId |
| Album | ArtistId | Artist | ArtistId |
| Track | GenreId | Genre | GenreId |
| Track | MediaTypeId | MediaType | MediaTypeId |

## Legacy Compatibility Acceptance

1. Open a persisted definition without `schema_version` and confirm the API returns version 2.
2. Confirm the fact receives the first collision-free ID from `fact_root`, `fact_root_1`, and subsequent suffixes and every legacy relationship is translated to explicit parent/child endpoints and columns.
3. Repeat the read and confirm normalization is deterministic and idempotent.
4. Open a legacy partial model with relationships but no fact. Confirm it receives the strict incomplete placeholder and can save/reopen as a draft.
5. Complete the placeholder fact and confirm its ID is retained.
6. Save a semantically unchanged normalized legacy model and confirm stored JSON is rewritten without changing diagnostics, stale state, status, or test timestamps.
7. Confirm create, update, and unsaved Test reject version 1, mixed relationship fields, and unknown versions.
8. Confirm saved Test rejects a request containing any definition body.

## Backend Contract Checks

Use the API contract in [contracts/data-models-api.md](./contracts/data-models-api.md) to validate:

- All endpoints require authentication.
- Users can create drafts with only a valid name.
- Per-user normalized name uniqueness is enforced.
- Different users can use the same model name.
- Updating a saved model with a changed name fails.
- Read, update, delete, saved test, and schema inspection enforce ownership.
- List returns all current-user models by default and supports one status filter.
- Every create/update/unsaved-test definition is strict version 2 and every model response is normalized version 2.
- Saved Test accepts no definition body; dirty drafts use unsaved Test.
- Schema inspection returns safe tables, views, columns, primary keys, and grouped ordered foreign keys; views have empty foreign-key arrays.
- Unresolvable omitted referenced columns and unsafe/system targets are excluded rather than guessed.
- Malformed topology blocks save; incomplete fact/source/object/key, unparented dimensions, disconnected branches, and unavailable columns save as drafts and fail Test.
- Rooted validation and compilation are independent of relationship array order.
- Test responses never expose generated SQL, paths, stack traces, raw database errors, row data, or profiling details.

## TDD Acceptance

- Each backend and frontend behavior starts with a focused failing test, followed by the minimum implementation and refactoring while green.
- Backend fixtures create deterministic temporary Chinook-shaped SQLite databases and do not depend on an untracked local Chinook file.
- Coverage includes normalization, public contract rejection, saved/unsaved Test separation, safe foreign keys, every topology diagnostic/severity class, repair-state round trips, out-of-order compilation, suggestions, atomic batches, manual edges, destructive edits, responsive behavior, and the complete Chinook graph.

## Focused Verification Commands

From `apps/api`:

```powershell
pytest
```

From `apps/web`:

```powershell
npm run test
npm run lint
npm run test:visual:desktop
```
