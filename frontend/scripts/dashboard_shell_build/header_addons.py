from scripts.dashboard_shell_build.context import render_partial


def render_header_addon(name: str | None, placement: str, header_addons: dict) -> str:
    if not name:
        return ""

    addon = header_addons[name]
    if addon["placement"] != placement:
        return ""

    if addon["variant"] == "stagebar":
        items = "\n".join(
            f'          <span class="service-stagebar__item{" service-stagebar__item--active" if item.get("active") else ""}">{item["label"]}</span>'
            for item in addon["items"]
        )
        return render_partial("stagebar.html", {
            "ARIA_LABEL": addon["ariaLabel"],
            "ITEMS": items,
        })

    if addon["variant"] == "services-toolbar":
        tools = "\n".join(
            f'          <button class="services-tool" type="button" aria-label="{tool["label"]}"><svg><use href="#{tool["icon"]}"></use></svg></button>'
            for tool in addon["tools"]
        )
        action_dot = '<span class="services-add-dot" aria-hidden="true"></span>' if addon["action"].get("dot") else ""
        return render_partial("services-toolbar.html", {
            "ARIA_LABEL": addon["ariaLabel"],
            "TOOLS": tools,
            "TITLE": addon["title"],
            "ACTION_DOT": action_dot,
            "ACTION_LABEL": addon["action"]["label"],
        })

    raise ValueError(f'Unknown HeaderAddon variant: {addon["variant"]}')
