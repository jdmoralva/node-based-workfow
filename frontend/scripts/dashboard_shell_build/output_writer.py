from pathlib import Path


def write_output(root: Path, output_name: str, html: str) -> None:
    output_path = root / output_name
    output_path.write_text(html + "\n", encoding="utf-8")
