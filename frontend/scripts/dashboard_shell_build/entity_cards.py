from scripts.dashboard_shell_build.context import render_partial


def render_environment_entity_card(item: dict) -> str:
    classes = ["environment-card"]
    if item.get("selected"):
        classes.append("environment-card--selected")
    if item.get("href"):
        classes.append("environment-card--navigable")

    stretched_link = ""
    if item.get("href"):
        stretched_link = (
            f'\n          <a class="environment-card__stretched-link" href="{item["href"]}" aria-label="{item["linkLabel"]}"></a>'
        )

    meta_buttons = "\n".join(
        f'            <button class="meta-icon" type="button" aria-label="{meta["label"]}"><svg><use href="#{meta["icon"]}"></use></svg></button>'
        for meta in item["meta"]
    )

    return render_partial("environment-card.html", {
        "CLASSES": " ".join(classes),
        "STRETCHED_LINK": stretched_link,
        "MENU_LABEL": item["menuLabel"],
        "BADGE_ICON": item["badgeIcon"],
        "TITLE": item["title"],
        "META_ARIA": item["metaAria"],
        "META_BUTTONS": meta_buttons,
    })


def render_service_entity_card(item: dict) -> str:
    classes = ["service-card"]
    if item.get("href"):
        classes.append("service-card--navigable")

    title = item["title"]
    stretched_link = ""
    if item.get("href"):
        stretched_link = (
            f'\n          <a class="service-card__stretched-link" href="{item["href"]}" aria-label="{item.get("linkLabel", f"Open {title} service")}"></a>'
        )

    return render_partial("service-card.html", {
        "CLASSES": " ".join(classes),
        "STRETCHED_LINK": stretched_link,
        "DELETE_LABEL": item.get("deleteLabel", f"Delete {title}"),
        "MORE_LABEL": item.get("moreLabel", f"More {title} options"),
        "TITLE": title,
    })


def build_entity_cards(spec: dict | None, entity_cards: dict) -> str:
    if not spec:
        return ""

    items = entity_cards[spec["collection"]]
    if spec["variant"] == "environment":
        return "\n".join(render_environment_entity_card(item) for item in items)
    if spec["variant"] == "service":
        return "\n".join(render_service_entity_card(item) for item in items)
    raise ValueError(f'Unknown EntityCard variant: {spec["variant"]}')
