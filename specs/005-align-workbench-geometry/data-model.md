# Data Model: Align Workbench Geometry

## Approved Workbench Baseline

### Purpose
Represents the accepted desktop visual reference used to judge the migrated CreditModeler workbench.

### Fields
- `legacy_reference_page`: `frontend/creditmodeler-service.html`
- `viewport_label`: `desktop-standard` or `desktop-wide`
- `viewport_size`: width and height pair
- `baseline_image`: approved legacy screenshot filename
- `tolerance_policy`: shared desktop geometry tolerance inherited from the broader legacy-parity feature

### Validation rules
- exactly two approved desktop baseline scenarios exist for this route
- the same shared desktop tolerance applies to both baseline scenarios
- approved baseline assets are reference inputs only and are never used at runtime

## Workbench Geometry Target

### Purpose
Represents the desktop alignment expectations for the migrated workbench frame and surrounding shell.

### Fields
- `content_top_alignment`: expected vertical start relationship between top shell and workbench content
- `sidebar_alignment`: expected vertical relationship of the narrow application sidebar to the shared shell frame
- `stage_region_alignment`: expected placement of the stage bar or breadcrumb region relative to the workbench body
- `overflow_policy`: no unintended full-page vertical or horizontal overflow at required desktop viewports

### Validation rules
- workbench and sidebar alignment must be derived from shared shell or page geometry
- stage-region spacing may be reduced but must remain visually coherent and usable
- desktop alignment must satisfy the inherited tolerance policy

## Tree Panel Configuration

### Purpose
Represents the desktop layout rules that control the object-tree rail.

### Fields
- `panel_width_token`: single shared width value governing panel width and workbench first-column width
- `indent_strategy`: progressive compact hierarchy spacing across nesting depth
- `row_spacing_policy`: minimized internal gaps without harming usability
- `scroll_policy`: internal vertical scroll allowed; horizontal scroll disallowed for approved content

### Validation rules
- one shared width token drives all desktop tree-panel width decisions
- indentation must preserve visible hierarchy while maximizing label width
- row spacing cannot reduce pointer or keyboard usability

## Approved Tree Content Set

### Purpose
Represents the current tree labels and hierarchy that define readability expectations for this feature.

### Fields
- `aria_label`: `Service objects`
- `top_level_groups`: `Risk Analytics`, `Connections`, `Data Models`
- `nested_examples`: `Variables`, `Scripts`, `Workflows`
- `required_label_fit_examples`: includes `TransitionAnalysis`

### Validation rules
- current approved labels must render fully when they fit inside the approved panel width
- ellipsis is a fallback only for genuinely oversized or future labels
- the feature does not alter the existing label text or hierarchy

## Canvas Usability Target

### Purpose
Represents the desktop canvas-space constraint that must remain true while tree readability improves.

### Fields
- `reference_width_relationship`: visible desktop canvas width relative to the approved legacy baseline
- `tolerance_policy`: inherited shared desktop geometry tolerance
- `adjacent_regions`: tree panel, stage region, and shell frame

### Validation rules
- tree width adjustments must not push the visible canvas width outside the inherited desktop tolerance
- primary workbench regions must remain intact and visually balanced

## Validation Scenario

### Purpose
Represents one executable check path used to confirm the feature works.

### Fields
- `scenario_type`: visual comparison, geometry assertion, accessibility check, or unit tree-behavior check
- `viewport_scope`: desktop-standard, desktop-wide, tablet, or mobile
- `target_region`: sidebar, stage bar, tree panel, canvas, or page-level overflow
- `expected_outcome`: pass condition tied to feature requirements

### Validation rules
- desktop visual comparison scenarios use approved legacy CreditModeler baselines
- desktop geometry scenarios assert workbench top alignment, sidebar alignment, tree width, and canvas relationship
- responsive scenarios only guard against regressions caused by desktop geometry changes and do not require legacy responsive mimicry
