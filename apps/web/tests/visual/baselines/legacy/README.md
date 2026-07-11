# Approved Desktop Legacy Baselines

This directory is reserved for the approved desktop legacy baseline images for the five in-scope routes.

Current scope:

- Exactly 10 approved baseline images.
- Desktop viewports only: `1366 x 768` and `1440 x 900`.
- One baseline per route and desktop viewport pair.

The approved naming pattern is `legacy-<route>-<viewport>.png`.

Legacy capture is an explicit workflow. Normal migrated-page comparison runs must not refresh or overwrite files in this directory.

Temporary actual images, diff images, traces, and reports belong in Playwright artifact directories outside this baseline folder.
