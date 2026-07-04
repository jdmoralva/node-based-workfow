import json
import os
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "src" / "dashboard_shell"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def read_json(path: Path):
    return json.loads(read_text(path))


def resolve_entity_cards_path() -> Path:
    override = os.environ.get("DASHBOARD_SHELL_ENTITY_CARDS_FILE", "").strip()
    if not override:
        return SOURCE / "entity-cards.json"

    override_path = Path(override)
    if not override_path.is_absolute():
        override_path = ROOT / override_path
    return override_path


def load_build_context() -> dict:
    return {
        "root": ROOT,
        "template": read_text(SOURCE / "template.html"),
        "icon_sprite": read_text(SOURCE / "icon-sprite.html"),
        "shell_config": read_json(SOURCE / "shell-config.json"),
        "pages": read_json(SOURCE / "pages.json"),
        "entity_cards": read_json(resolve_entity_cards_path()),
        "tree_menus": read_json(SOURCE / "tree-menus.json"),
        "header_addons": read_json(SOURCE / "header-addons.json"),
    }


def read_partial(name: str) -> str:
    if not name:
        return ""
    return read_text(SOURCE / "partials" / name)


def render_partial(name: str, context: dict) -> str:
    partial = read_text(SOURCE / "partials" / name)
    for key, value in context.items():
        partial = partial.replace("{{" + key + "}}", value)
    return partial.rstrip("\n")
