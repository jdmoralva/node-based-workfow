from pathlib import Path
import sys
import unittest


FRONTEND_ROOT = Path(__file__).resolve().parents[2]
if str(FRONTEND_ROOT) not in sys.path:
    sys.path.insert(0, str(FRONTEND_ROOT))

from scripts.build_dashboard_shell import render_page
from scripts.dashboard_shell_build.context import load_build_context


class RenderPageTests(unittest.TestCase):
    def test_creditmodeler_page_renders_runtime_script(self) -> None:
        build_context = load_build_context()
        creditmodeler_page = next(
            page for page in build_context["pages"] if page["output"] == "creditmodeler-service.html"
        )

        html = render_page(creditmodeler_page, build_context)

        self.assertIn('data-page-bootstrap="creditmodeler-service"', html)
        self.assertIn("bootstrapCreditmodelerServicePage", html)


if __name__ == "__main__":
    unittest.main()
