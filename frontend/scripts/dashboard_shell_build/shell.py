from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def build_styles(styles: list[str]) -> str:
    return "\n".join(f'  <link rel="stylesheet" href="{href}">' for href in styles)


def build_body_attrs(body_class: str, bootstrap_key: str | None) -> str:
    attrs: list[str] = []
    if body_class:
        attrs.append(f'class="{body_class}"')
    if bootstrap_key:
        attrs.append(f'data-page-bootstrap="{bootstrap_key}"')
    return f' {" ".join(attrs)}' if attrs else ""


def build_runtime_script(bootstrap_key: str | None) -> str:
    if not bootstrap_key:
        return ""

    bundles = {
        "card-grid": {
            "sources": [
                "assets/js/controllers/card-selection-controller.js",
                "assets/js/pages/card-grid-page.js",
            ],
            "bootstrap": "bootstrapCardGridPage",
        },
        "creditmodeler-service": {
            "sources": [
                "assets/js/controllers/tree-toggle-controller.js",
                "assets/js/pages/creditmodeler-service-page.js",
            ],
            "bootstrap": "bootstrapCreditmodelerServicePage",
        },
    }

    def inline_module_source(relative_path: str) -> str:
        module_source = (ROOT / relative_path).read_text(encoding="utf-8")
        lines = [line for line in module_source.splitlines() if not line.lstrip().startswith('import ')]
        source = "\n".join(lines)
        source = source.replace('export function ', 'function ')
        source = source.replace('export const ', 'const ')
        source = source.replace('export let ', 'let ')
        source = source.replace('export class ', 'class ')
        return source

    bundle = bundles[bootstrap_key]
    source_blocks = "\n\n".join(inline_module_source(path) for path in bundle["sources"])
    registry = (
        f"const pageBootstrapRegistry = {{ '{bootstrap_key}': {bundle['bootstrap']} }};\n"
        "function readBootstrapKey(root) {\n"
        "  return root.dataset.pageBootstrap || '';\n"
        "}\n\n"
        "function bootstrapPage(root) {\n"
        "  const pageBootstrapKey = readBootstrapKey(root);\n"
        "  if (!pageBootstrapKey) {\n"
        "    return null;\n"
        "  }\n\n"
        "  const bootstrapAdapter = pageBootstrapRegistry[pageBootstrapKey];\n"
        "  if (!bootstrapAdapter) {\n"
        "    throw new Error(`Unknown PageBootstrapRegistry key: ${pageBootstrapKey}`);\n"
        "  }\n\n"
        "  return bootstrapAdapter({ root });\n"
        "}\n\n"
        "window.pageBootstrap = bootstrapPage(document.body);"
    )

    return f'  <script type="module">\n{source_blocks}\n\n{registry}\n  </script>'


def build_breadcrumbs(items: list[dict]) -> str:
    parts: list[str] = []
    for index, item in enumerate(items):
        if item["type"] == "home":
            parts.append(
                f'          <a href="{item["href"]}" class="breadcrumbs__link" aria-label="Home"><svg><use href="#icon-home"></use></svg></a>'
            )
        elif item["type"] == "link":
            parts.append(f'          <a href="{item["href"]}" class="breadcrumbs__link">{item["label"]}</a>')
        else:
            parts.append(f'          <span class="breadcrumbs__current">{item["label"]}</span>')

        if index < len(items) - 1:
            parts.append('          <svg class="breadcrumbs__divider"><use href="#icon-arrow-right"></use></svg>')

    return "\n".join(parts)


def build_sidebar(active_key: str, items: list[dict]) -> str:
    rendered: list[str] = []
    for index, item in enumerate(items):
        active_class = " sidebar__action--active" if item["key"] == active_key else ""
        aria_current = ' aria-current="page"' if item["key"] == active_key else ""
        rendered.append(
            f'        <a class="sidebar__action{active_class}" href="{item["href"]}" aria-label="{item["label"]}"{aria_current}><svg><use href="#{item["icon"]}"></use></svg></a>'
        )
        if index == 1:
            rendered.append('        <span class="sidebar__divider" aria-hidden="true"></span>')
    return "\n".join(rendered)
