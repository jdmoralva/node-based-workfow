from scripts.dashboard_shell_build.context import render_partial
from scripts.dashboard_shell_build.entity_cards import build_entity_cards
from scripts.dashboard_shell_build.header_addons import render_header_addon
from scripts.dashboard_shell_build.tree_menus import build_tree_menu


def render_card_grid_page(spec: dict, entity_cards: dict) -> str:
    sections = [
        render_partial("card-grid-hero.html", {
            "ARIA_LABEL": spec["hero"]["ariaLabel"],
            "TITLE": spec["hero"]["title"],
            "ACTION_LABEL": spec["hero"]["actionLabel"],
        }),
        render_partial("card-grid.html", {
            "ARIA_LABEL": spec["cards"]["ariaLabel"],
            "ENTITY_CARDS": build_entity_cards(spec["cards"]["entityCards"], entity_cards),
        }),
    ]
    return "\n\n".join(sections)


def render_service_list_page(spec: dict, entity_cards: dict, header_addons: dict) -> str:
    sections = [
        render_header_addon(spec.get("headerAddon"), "content", header_addons),
        render_partial("services-grid.html", {
            "ARIA_LABEL": spec["cards"]["ariaLabel"],
            "ENTITY_CARDS": build_entity_cards(spec["cards"]["entityCards"], entity_cards),
        }),
    ]
    return "\n\n".join(sections)


def render_workbench_page(spec: dict, tree_menus: dict) -> str:
    workbench = spec["workbench"]
    sections = [
        render_partial("workbench.html", {
            "ARIA_LABEL": workbench["ariaLabel"],
            "TREE_PANEL_ARIA_LABEL": workbench["treePanelAriaLabel"],
            "CANVAS_ARIA_LABEL": workbench["canvasAriaLabel"],
            "SEARCH_REGION_ARIA_LABEL": workbench["searchRegionAriaLabel"],
            "SEARCH_INPUT_ARIA_LABEL": workbench["searchInputAriaLabel"],
            "ADD_OBJECT_ARIA_LABEL": workbench["addObjectAriaLabel"],
            "GRID_VIEW_ARIA_LABEL": workbench["gridViewAriaLabel"],
            "BRANCH_VIEW_ARIA_LABEL": workbench["branchViewAriaLabel"],
            "TREE_MENU": build_tree_menu(workbench["treeMenu"], tree_menus),
            "CANVAS_HINT": workbench["canvasHint"],
        }),
    ]
    return "\n\n".join(sections)


def build_page_spec(page_spec: dict, entity_cards: dict, tree_menus: dict, header_addons: dict) -> str:
    page_type = page_spec["type"]
    if page_type == "card-grid":
        return render_card_grid_page(page_spec, entity_cards)
    if page_type == "service-list":
        return render_service_list_page(page_spec, entity_cards, header_addons)
    if page_type == "workbench":
        return render_workbench_page(page_spec, tree_menus)
    raise ValueError(f"Unknown PageSpec type: {page_type}")
