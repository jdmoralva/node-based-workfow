# Quickstart: Internal User Login

## Purpose

Validate the frontend-only internal login page flow end to end in the current static shell environment.

## Prerequisites

- Run commands from the repository root.
- Use a Python environment that can run the existing frontend shell build scripts.
- Review the feature contract in [contracts/login-page.md](./contracts/login-page.md).

## Validation Steps

### 1. Run the focused shell test

```bash
python -m unittest frontend.scripts.tests.test_build_dashboard_shell
```

Expected outcome:
- The dashboard shell regression test passes.
- Coverage includes the login page generation path and expected bootstrap wiring.

### 2. Rebuild generated frontend pages

```bash
python frontend/scripts/build_dashboard_shell.py
```

Expected outcome:
- The generator reports the rebuilt page count.
- Generated output includes `frontend/login.html`.

### 3. Open the frontend entry point

Open `frontend/index.html` directly in a browser using `file://`.

Expected outcome:
- A visible sign-in entry action is present on the entry page.
- Following the action opens `login.html`.

### 4. Validate required-field behavior

On `frontend/login.html`:

1. Submit with both fields empty.
2. Submit with only username populated.
3. Submit with only password populated.

Expected outcome:
- Missing required fields are clearly identified.
- No placeholder success result is shown while required fields are missing.

### 5. Validate placeholder submit behavior

On `frontend/login.html`:

1. Enter a username.
2. Enter a password.
3. Submit the form.

Expected outcome:
- The page shows a frontend-only informational placeholder result.
- The message does not claim that the user is authenticated.
- No token, stored credential, or mock session behavior is introduced.

## Related Artifacts

- Spec: [spec.md](./spec.md)
- Research: [research.md](./research.md)
- Data model: [data-model.md](./data-model.md)
- UI contract: [contracts/login-page.md](./contracts/login-page.md)
