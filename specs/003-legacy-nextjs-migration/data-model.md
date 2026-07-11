# Data Model: Legacy Frontend Standalone Migration

## Migrated Route

### Purpose
Represents one standalone application route that replaces one generated legacy page.

### Fields
- `key`: stable internal route identifier
- `path`: standalone application path
- `legacy_output`: legacy generated page name being replaced
- `title`: page-level title or label
- `page_kind`: landing, login, applications, services, or workbench
- `active_nav`: section that should appear active in shared navigation

### Validation rules
- every migrated route must map to exactly one supported application path
- no migrated route may keep a `.html` destination in production metadata
- the root route must render the landing page and must not redirect automatically

### Relationships
- One migrated route can own one breadcrumb trail
- One migrated route can render zero or more interactive cards
- One migrated route can reference zero or one workbench tree menu

## Supported Destination

### Purpose
Represents an approved internal destination that a navigation element may open.

### Fields
- `key`: stable destination identifier
- `path`: application path
- `legacy_href`: original legacy destination value
- `label`: accessible or user-facing destination label
- `is_supported`: whether the destination is approved for navigation

### Validation rules
- supported destinations must be explicitly declared before they can be used
- unsupported or unknown legacy destinations must not render as links
- destination labels must remain meaningful for navigation and accessibility checks

### Relationships
- One supported destination can be referenced by many navigation elements

## Breadcrumb Trail

### Purpose
Represents the ordered page hierarchy shown for a migrated route.

### Fields
- `route_key`: route that owns the breadcrumb trail
- `segments`: ordered collection of breadcrumb segments

### Validation rules
- the last segment must always represent the current page
- the current page segment must not be navigable
- intermediate navigable segments must point only to supported destinations

### Relationships
- One breadcrumb trail belongs to one migrated route
- One breadcrumb trail contains many breadcrumb segments

## Breadcrumb Segment

### Purpose
Represents one labeled step inside a breadcrumb trail.

### Fields
- `label`: displayed segment text
- `kind`: home, link, or current
- `destination_key`: optional supported destination reference
- `position`: zero-based order in the trail

### Validation rules
- `current` segments must not include a destination
- `link` and `home` segments must reference a supported destination

## Interactive Card

### Purpose
Represents an application or service card that may expose both navigation and local controls.

### Fields
- `title`: card title
- `collection`: applications or services
- `is_selected`: whether the card can appear visually selected
- `destination_key`: optional supported destination reference
- `link_label`: accessible card-link label when navigable
- `menu_label`: label for non-navigation menu controls
- `meta_items`: optional collection of metadata badges or counters
- `control_set`: local actions such as delete, more options, or metadata buttons

### Validation rules
- only cards with a supported destination may behave as links
- control activation must not trigger navigation
- cards without a supported destination remain interactive only for non-navigation behavior

### Relationships
- Many interactive cards can appear on one migrated route

## Workbench Tree Item

### Purpose
Represents one selectable item in the CreditModeler object tree.

### Fields
- `label`: item name
- `icon_key`: visual icon identifier
- `node_kind`: leaf or submenu
- `is_expanded_by_default`: initial expanded state for submenu nodes
- `toggle_label`: accessible label for expanding or collapsing submenu nodes
- `children`: nested tree items

### Validation rules
- submenu items must declare their expanded-state behavior
- leaf items must not expose expand/collapse controls
- selected and expanded states must remain visible and keyboard-discernible

### Relationships
- One workbench tree item can contain many child workbench tree items

## Visual Baseline Scenario

### Purpose
Represents one required screenshot validation target for route-by-route visual regression testing.

### Fields
- `route_key`: migrated route being captured
- `viewport`: required viewport size
- `baseline_source`: current generated legacy page used as reference
- `checkpoint_set`: ordered list of visual aspects to review

### Validation rules
- every migrated route must have one scenario for each required viewport
- checkpoint sets must include the route-applicable items from the approved visual review list
- baseline scenarios must remain tied to the current generated frontend until a new approved baseline replaces them

### Relationships
- One migrated route owns many visual baseline scenarios
