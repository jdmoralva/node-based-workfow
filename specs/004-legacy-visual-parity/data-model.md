# Data Model: Legacy Visual Parity

## Legacy Reference Page

### Purpose
Represents one generated legacy page that remains the approved desktop visual source for a migrated route.

### Fields
- `key`: stable page identifier
- `legacy_path`: path to the generated legacy page
- `migrated_route`: corresponding route in `apps/web`
- `desktop_checkpoint_set`: named list of desktop review checkpoints

### Validation rules
- each in-scope migrated route maps to exactly one legacy reference page
- legacy reference pages are used only for capture and review, never for production runtime

### Relationships
- One legacy reference page owns many desktop baseline scenarios

## Desktop Baseline Scenario

### Purpose
Represents one required desktop screenshot comparison target.

### Fields
- `route_key`: migrated route identifier
- `viewport_label`: `desktop-standard` or `desktop-wide`
- `viewport_size`: width and height pair
- `baseline_filename`: approved desktop image filename
- `reference_page_key`: linked legacy reference page
- `checkpoint_set`: applicable desktop review items

### Validation rules
- every in-scope route has exactly two desktop baseline scenarios
- baseline filenames are canonical and route-neutral
- missing approved baselines fail comparison runs

### Relationships
- Many desktop baseline scenarios belong to one legacy reference page

## Responsive Validation Scenario

### Purpose
Represents one non-screenshot responsive validation target for tablet or mobile behavior.

### Fields
- `route_key`: migrated route identifier
- `viewport_label`: `tablet` or `mobile`
- `viewport_size`: width and height pair
- `required_behaviors`: ordered list of page-specific usability checks
- `allowed_adaptations`: layout changes that are acceptable at that viewport

### Validation rules
- every in-scope route has one tablet scenario and one mobile scenario
- allowed adaptations may include stacking, collapsing, reordering, or resizing regions
- primary task regions must remain visible, reachable, and usable

### Relationships
- One migrated route owns many responsive validation scenarios

## Critical Layout Region

### Purpose
Represents a visually important region whose size or placement materially affects desktop recognition or responsive usability.

### Fields
- `name`: region name such as top bar, hero ribbon, card grid, login panel, stage bar, object tree, or design canvas
- `page_scope`: routes where the region applies
- `desktop_geometry_required`: whether desktop geometry must align with legacy measurements
- `responsive_usability_required`: whether the region must be validated for visibility and use on tablet/mobile
- `desktop_review_notes`: route-specific geometry expectations captured during desktop parity review

### Validation rules
- desktop-critical regions participate in geometry assertions when parity matters
- responsive-critical regions must remain unclipped and operable after layout adaptation
- route notes distinguish shared shell expectations from login-only and workbench-only desktop checkpoint rules

## Baseline Artifact Set

### Purpose
Represents the approved and temporary outputs associated with desktop visual comparison runs.

### Fields
- `approved_directory`: version-controlled location for approved desktop baseline images
- `temporary_directory`: location for actual, diff, trace, and report artifacts
- `refresh_mode`: explicit baseline-generation operation only
- `comparison_mode`: normal validation operation without baseline mutation

### Validation rules
- approved artifacts and temporary artifacts must remain separate
- comparison mode must never auto-approve or refresh baselines

## Responsive Review Checklist

### Purpose
Represents the standard pass conditions used to judge responsive usability when legacy screenshots are not authoritative.

### Fields
- `navigation_access`: whether primary navigation remains reachable
- `action_visibility`: whether key actions remain visible or discoverable
- `content_flow`: whether primary content remains readable in intended order
- `control_usability`: whether forms, cards, tree items, and toolbar controls remain usable
- `overflow_status`: whether unintended horizontal overflow is absent
- `clipping_status`: whether primary controls or content are clipped or overlapped

### Validation rules
- every responsive scenario must be evaluated against this checklist with any page-specific additions
