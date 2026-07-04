from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.dashboard_shell_build.context import load_build_context
from scripts.dashboard_shell_build.header_addons import render_header_addon
from scripts.dashboard_shell_build.output_writer import write_output
from scripts.dashboard_shell_build.page_specs import build_page_spec
from scripts.dashboard_shell_build.shell import build_breadcrumbs, build_body_attrs, build_runtime_script, build_sidebar, build_styles


def render_page(page: dict, build_context: dict) -> str:
    html = build_context["template"]
    html = html.replace("{{TITLE}}", page["title"])
    html = html.replace("{{BODY_ATTRS}}", build_body_attrs(page["bodyClass"], page.get("bootstrapKey")))
    html = html.replace("{{STYLE_LINKS}}", build_styles(page["styles"]))
    html = html.replace("{{RUNTIME_SCRIPT}}", build_runtime_script(page.get("bootstrapKey")))
    html = html.replace("{{ICON_SPRITE}}", build_context["icon_sprite"])
    html = html.replace("{{BREADCRUMBS}}", build_breadcrumbs(page["breadcrumbs"]))
    html = html.replace(
        "{{HEADER_ROW_ADDON}}",
        render_header_addon(page["pageSpec"].get("headerAddon"), "breadcrumb", build_context["header_addons"]),
    )
    html = html.replace("{{SIDEBAR_ITEMS}}", build_sidebar(page["activeNav"], build_context["shell_config"]["sidebarItems"]))
    html = html.replace(
        "{{MAIN_CONTENT}}",
        build_page_spec(
            page["pageSpec"],
            build_context["entity_cards"],
            build_context["tree_menus"],
            build_context["header_addons"],
        ),
    )
    return html


def main() -> None:
    build_context = load_build_context()
    for page in build_context["pages"]:
        html = render_page(page, build_context)
        write_output(build_context["root"], page["output"], html)

    print(f'Generated {len(build_context["pages"])} pages to {build_context["root"]}')


if __name__ == "__main__":
    main()
