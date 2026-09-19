#!/usr/bin/env python3
"""Render content/site.json into the SYNC-marked regions of the site's HTML.

Only text between <!-- SYNC:name --> and <!-- /SYNC:name --> is rewritten;
everything else in the pages (design, scripts, modals) is left alone.

  python3 scripts/render.py            # write changes
  python3 scripts/render.py --check    # exit 1 if pages are out of date
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATEGORIES = {"fullstack", "ai-ml", "hardware"}
e = html.escape


def fail(msg):
    sys.exit(f"render.py: {msg}")


def validate(data):
    ids = set()
    for ent in data["entries"]:
        for key in ("id", "title", "label", "year", "sort", "category", "summary", "tags", "source"):
            if key not in ent:
                fail(f"entry {ent.get('id', '?')} is missing '{key}'")
        if ent["id"] in ids:
            fail(f"duplicate entry id {ent['id']}")
        ids.add(ent["id"])
        if ent["category"] not in CATEGORIES:
            fail(f"entry {ent['id']} has unknown category {ent['category']} (use {sorted(CATEGORIES)})")
        if not re.fullmatch(r"\d{4}-\d{2}", ent["sort"]):
            fail(f"entry {ent['id']} sort must be YYYY-MM")
        if ent["source"] not in ("resume", "site-only"):
            fail(f"entry {ent['id']} source must be 'resume' or 'site-only'")
        if "—" in ent["summary"]:
            fail(f"entry {ent['id']} summary contains an em dash")
    home = [x for x in data["entries"] if x.get("home")]
    if len(home) > 4:
        fail(f"{len(home)} entries have home: true; the home grid holds at most 4")


def chips_home(tags):
    return "\n".join(
        f'<span class="text-[10px] px-3 py-1 bg-white/5 border border-white/10 '
        f'text-on-surface-variant font-space-grotesk uppercase">{e(t)}</span>'
        for t in tags
    )


def render_skills(data):
    out = []
    for i, group in enumerate(data["skills"]):
        accent = " border-l-4 border-l-primary" if i == 0 else ""
        items = group["items"] + group.get("site_extras", [])
        out.append(
            f'<div class="glass-panel p-6{accent}">\n'
            f'<div class="text-[10px] text-primary uppercase tracking-[0.25em] font-bold font-space-grotesk mb-3">{e(group["label"])}</div>\n'
            f'<div class="flex flex-wrap gap-2">\n{chips_home(items)}\n</div>\n</div>'
        )
    return "\n".join(out)


def sorted_entries(data):
    return sorted(data["entries"], key=lambda x: x["sort"], reverse=True)


def render_home_cards(data):
    out = []
    home = [x for x in sorted_entries(data) if x.get("home")]
    home.sort(key=lambda x: x.get("home_order", 99))
    for i, ent in enumerate(home):
        border = " border-t border-[#2A2A4A]/20" if i >= 2 else ""
        action = ""
        if ent.get("video"):
            vid = e(ent["video"])
            action = (
                f'\n<button onclick="document.getElementById(\'{vid}\').classList.remove(\'hidden\')" '
                'class="inline-flex items-center gap-3 pt-4 text-primary font-bold uppercase tracking-widest text-[10px] hover:opacity-70 transition-opacity">\n'
                'VIEW_VIDEO\n<span class="material-symbols-outlined text-sm">play_circle</span>\n</button>'
            )
        elif ent.get("link"):
            action = (
                f'\n<a class="inline-flex items-center gap-3 pt-4 text-primary font-bold uppercase tracking-widest text-[10px] hover:opacity-70 transition-opacity" '
                f'href="{e(ent["link"]["url"])}" target="_blank">\n{e(ent["link"].get("text", "VIEW_CODE"))}\n'
                '<span class="material-symbols-outlined text-sm">arrow_forward</span>\n</a>'
            )
        out.append(
            f'<!-- Initiative {i + 1:02d} -->\n'
            f'<div class="p-12 hover:bg-primary/5 transition-colors group relative overflow-hidden{border}">\n'
            f'<div class="absolute top-8 right-8 text-6xl font-black text-white/5 group-hover:text-primary/10 transition-colors font-space-grotesk">{i + 1:02d}</div>\n'
            '<div class="space-y-6">\n'
            f'<h4 class="text-xl font-bold uppercase tracking-tight text-primary">{e(ent["title"])}</h4>\n'
            f'<p class="text-sm text-on-surface-variant leading-relaxed">{e(ent["summary"])}</p>\n'
            f'<div class="flex flex-wrap gap-2 pt-4">\n{chips_home(ent["tags"])}\n</div>{action}\n'
            '</div>\n</div>'
        )
    return "\n".join(out)


def render_timeline(data):
    out = []
    current_year = None
    for n, ent in enumerate(sorted_entries(data), start=1):
        if ent["year"] != current_year:
            mt = "" if current_year is None else " mt-8"
            current_year = ent["year"]
            out.append(
                f'\n<!-- ===== {current_year} ===== -->\n'
                f'<div class="timeline-year" data-year="{current_year}">\n'
                f'    <h2 class="text-3xl md:text-4xl font-black font-space-grotesk tracking-tighter gradient-text mb-2{mt}">{current_year}</h2>\n'
                '</div>\n'
            )
        tags = "\n".join(
            f'            <span class="px-3 py-1 text-[9px] font-bold font-space-grotesk uppercase tracking-widest {"tag-primary" if j == 0 else "tag-secondary"} border">{e(t.upper())}</span>'
            for j, t in enumerate(ent["tags"])
        )
        link = ent.get("link")
        if link:
            open_tag = f'<a href="{e(link["url"])}" target="_blank" class="timeline-event project-card block group" data-category="{ent["category"]}">'
            card_cls, close_tag = "glass-card p-8 md:p-10 relative overflow-hidden", "</a>"
            h3_hover = " group-hover:text-primary transition-colors"
        else:
            open_tag = f'<div class="timeline-event project-card" data-category="{ent["category"]}">'
            card_cls, close_tag = "glass-card p-8 md:p-10 relative overflow-hidden group", "</div>"
            h3_hover = ""
        out.append(
            f'{open_tag}\n'
            f'    <div class="{card_cls}">\n'
            f'        <div class="absolute top-6 right-8 text-[3.5rem] font-black font-space-grotesk text-white/5 group-hover:text-primary/10 transition-colors">{n:02d}</div>\n'
            f'        <span class="text-[10px] font-space-grotesk tracking-widest text-primary/60 font-bold mb-3 block">{e(ent["label"])}</span>\n'
            f'        <h3 class="text-lg md:text-xl font-bold font-space-grotesk uppercase text-white mb-2 tracking-tight{h3_hover}">{e(ent["title"])}</h3>\n'
            '        <p class="text-white/40 font-inter text-sm leading-relaxed mb-6 max-w-lg">\n'
            f'            {e(ent["summary"])}\n'
            '        </p>\n'
            f'        <div class="flex flex-wrap gap-2">\n{tags}\n        </div>\n'
            '    </div>\n'
            f'{close_tag}'
        )
    return "\n".join(out) + "\n"


def about(key):
    return lambda data: e(data["about"][key])


def render_about_context(data):
    return "\n".join(
        f'<p class="text-xl leading-relaxed text-on-surface-variant font-light">\n{e(p)}\n</p>'
        for p in data["about"]["context"]
    )


def render_last_sync(data):
    return e(data["meta"]["last_sync"].replace("-", "."))


PAGES = {
    "index.html": {"skills": render_skills, "home-cards": render_home_cards},
    "projects.html": {"timeline": render_timeline},
    "about.html": {
        "about-location": about("location"),
        "about-headline": lambda d: f'{e(d["about"]["headline_lead"])} <span class="italic text-primary font-light">{e(d["about"]["headline_accent"])}</span>',
        "about-intro": about("intro"),
        "about-context": render_about_context,
        "last-sync": render_last_sync,
    },
}


def replace_region(text, name, body, page):
    pattern = re.compile(rf"(<!-- SYNC:{re.escape(name)} -->)(.*?)(<!-- /SYNC:{re.escape(name)} -->)", re.S)
    matches = pattern.findall(text)
    if len(matches) != 1:
        fail(f"{page}: expected exactly one SYNC:{name} region, found {len(matches)}")
    inline = "\n" not in matches[0][1]
    inner = body if inline else f"\n{body}\n"
    return pattern.sub(lambda m: m.group(1) + inner + m.group(3), text)


def main():
    check = "--check" in sys.argv
    data = json.loads((ROOT / "content" / "site.json").read_text())
    validate(data)
    index_html = (ROOT / "index.html").read_text()
    for ent in data["entries"]:
        if ent.get("video") and f'id="{ent["video"]}"' not in index_html:
            fail(f"entry {ent['id']} points at video modal #{ent['video']}, which index.html does not have")
    stale = []
    for page, regions in PAGES.items():
        path = ROOT / page
        original = path.read_text()
        text = original
        for name, fn in regions.items():
            text = replace_region(text, name, fn(data), page)
        if text != original:
            stale.append(page)
            if not check:
                path.write_text(text)
    if check:
        if stale:
            print("out of date: " + ", ".join(stale))
            sys.exit(1)
        print("all pages match content/site.json")
    else:
        print("updated: " + (", ".join(stale) if stale else "nothing (already current)"))


if __name__ == "__main__":
    main()
