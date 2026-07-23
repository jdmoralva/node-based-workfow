# Align Dimension Remove Action

## Goal

Align the dimension card's `Remove` action with the first-row field labels, matching the relationship card, without allowing its click target to overlap a selector.

## Layout

- Move the dimension `Remove` button into the dimension field grid.
- Keep `Remove` before the dimension controls in keyboard and accessibility-tree order, matching relationship cards.
- Use a dedicated action column on desktop so the first row contains source connection, table or view, and `Remove`.
- Keep alias and primary-key controls on the second row.
- Optically align the button text with the relationship card's `Remove` text while retaining the existing 40px minimum hit area.
- Leave relationship-card markup and behavior unchanged.

## Responsive Behavior

- At widths up to 620px, place source connection and `Remove` on the first row.
- Let table, alias, and primary-key controls span the full grid width below that row.
- Preserve existing 40px mobile control heights and prevent horizontal overflow.

## Accessibility And Behavior

- Keep the native button, accessible name, confirmation flow, and removal behavior unchanged.
- Ensure the button and every selector occupy separate, non-overlapping rectangles.
- Preserve keyboard focus and the existing destructive-action styling.

## Verification

- Add a Playwright geometry assertion that compares the dimension and relationship `Remove` alignment within their cards.
- Assert that focus advances from `Remove` to source connection without jumping backward after the form controls.
- Assert that the dimension action does not overlap either first-row selector on desktop or mobile.
- Exercise responsive geometry and overflow at the standard 390px mobile viewport.
- Run the focused Playwright regression, frontend lint, and `git diff --check`.
- Verify the result visually at desktop and mobile widths.
