#!/usr/bin/env python3
"""Write the content blocks of the home page and the blog index from content/data.json.

    python3 tools/build_home.py           rewrite the blocks in index.html and blog/index.html
    python3 tools/build_home.py --check   only check them; exit 1 if one is out of date

Standard library only. Each block sits between <!-- render:NAME --> and <!-- /render:NAME -->.
In the browser, assets/site.js builds the same blocks from data.json again and swaps a block only
if it differs, so edits saved from admin.html show up without running this script. What this
script writes is what readers without JavaScript and search engines get. The two renderers must
produce identical markup: change them together.
"""
import html
import json
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
PAGES = ["index.html", "blog/index.html"]

LINKS = [("pdf", "PDF"), ("arxiv", "arXiv"), ("doi", "DOI"), ("code", "Code"), ("project", "Project page"),
         ("video", "Video"), ("slides", "Slides"), ("poster", "Poster")]
EXPERIENCE = [("research", "Research"), ("teaching", "Teaching"), ("service", "Service"), ("professional", "Professional")]
AWARDS = [("award", "Awards"), ("scholarship", "Scholarships")]


def esc(s):
    return html.escape("" if s is None else str(s), quote=False).replace('"', "&quot;")


def text(s):
    return "" if s is None else str(s)


def num(s):
    try:
        return float(s)
    except (TypeError, ValueError):
        return 0.0


def lines(s):
    return [x.strip() for x in text(s).split("\n") if x.strip()]


MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def when(s):
    """'2026.11' or '2026-11' -> 'Nov 2026', '2026-11-10' -> 'Nov 10, 2026'; anything else as written."""
    t = text(s).strip()
    m = re.fullmatch(r"([0-9]{4})[.-]([0-9]{1,2})", t)
    if m and 1 <= int(m.group(2)) <= 12:
        return f"{MONTHS[int(m.group(2)) - 1]} {m.group(1)}"
    m = re.fullmatch(r"([0-9]{4})[.-]([0-9]{1,2})[.-]([0-9]{1,2})", t)
    if m and 1 <= int(m.group(2)) <= 12:
        return f"{MONTHS[int(m.group(2)) - 1]} {int(m.group(3))}, {m.group(1)}"
    return t


def abstract_of(body):
    """The text under an '## Abstract' heading, or the whole body if it has no headings."""
    t = text(body).replace("\r", "")
    if not t.strip():
        return ""
    ls = t.split("\n")
    if not any(l.startswith("#") for l in ls):
        return t.strip()
    out, inside = [], False
    for l in ls:
        if l.startswith("#"):
            if inside:
                break
            inside = l.lstrip("#").strip().lower() == "abstract"
            continue
        if inside:
            out.append(l)
    return "\n".join(out).strip()


def paragraphs(t):
    return [" ".join(x.strip() for x in b.split("\n") if x.strip()) for b in re.split(r"\n\s*\n", t) if b.strip()]


class Renderer:
    def __init__(self, data, root):
        self.d = data
        self.root = root

    def url(self, u):
        u = text(u)
        return u if re.match(r"^([a-z][a-z0-9+.-]*:|//|#)", u, re.I) else self.root + u

    def intro(self):
        p, c = self.d.get("profile") or {}, self.d.get("contact") or {}
        items = []
        if c.get("email"):
            items.append(f'<li><a href="mailto:{esc(c["email"])}">{esc(c["email"])}</a></li>')
        for key, label in (("linkedin", "LinkedIn"), ("github", "GitHub"), ("scholar", "Google Scholar")):
            if c.get(key):
                items.append(f'<li><a href="{esc(self.url(c[key]))}">{label}</a></li>')
        if c.get("cv"):
            items.append(f'<li><a href="{esc(self.url(c["cv"]))}">CV</a></li>')
        parts = [f'<h1>{esc(p.get("name"))}</h1>']
        if p.get("oneLiner"):
            parts.append(f'<p class="dek">{esc(p["oneLiner"])}</p>')
        if p.get("bio"):
            parts.append(f'<p class="bio">{esc(p["bio"])}</p>')
        if items:
            parts.append('<ul class="contact">\n' + "\n".join(items) + "\n</ul>")
        return "\n".join(parts)

    def news(self):
        out = []
        for n in self.d.get("news") or []:
            w = when(n.get("when"))
            out.append(f"<li>{esc(n.get('text'))}" + (f' <span class="meta">{esc(w)}</span>' if w else "") + "</li>")
        return "\n".join(out)

    def pub(self, p, k):
        me = self.d.get("me")
        authors = ", ".join(f'<span class="me">{esc(a)}</span>' if a == me else esc(a) for a in p.get("authors") or [])
        abstract = abstract_of(p.get("body"))
        cover = text(p.get("cover"))
        venue, year = text(p.get("venue")), text(p.get("year"))
        where = [esc(venue)] if venue else []
        if year and year not in venue:
            where.append(esc(year))
        if p.get("status") == "accepted":
            where.append("accepted")
        if p.get("badge"):
            where.append(esc(p["badge"]))
        meta = [f'<span class="venue">{", ".join(where)}</span>'] if where else []
        links = p.get("links") or {}
        for key, label in LINKS:
            if links.get(key):
                meta.append(f'<a href="{esc(self.url(links[key]))}">{label}</a>')
        more = bool(abstract or cover)
        if more:
            meta.append(f'<label class="more" for="abs-{k}">{"Abstract" if abstract else "Figure"}</label>')
        parts = [f'<h3 class="pub-title">{esc(p.get("title"))}</h3>']
        if authors:
            parts.append(f'<p class="pub-authors">{authors}</p>')
        if more:
            parts.append(f'<input class="more-toggle" type="checkbox" id="abs-{k}">')
        if meta:
            parts.append('<p class="pub-meta">' + "\n".join(meta) + "</p>")
        if more:
            body = [f'<a href="{esc(self.url(cover))}"><img src="{esc(self.url(cover))}" alt="Overview figure" loading="lazy"></a>'] if cover else []
            body += [f"<p>{esc(x)}</p>" for x in paragraphs(abstract)]
            parts.append('<div class="more-body">' + "\n".join(body) + "</div>")
        return '<li class="pub">' + "\n".join(parts) + "</li>"

    def publications(self):
        pubs = [p for _, p in sorted(enumerate(self.d.get("publications") or []), key=lambda t: (-num(t[1].get("year")), t[0]))]
        return "\n".join(self.pub(p, k) for k, p in enumerate(pubs))

    def posts(self):
        items = sorted(self.d.get("posts") or [], key=lambda p: text(p.get("date")), reverse=True)
        if not items:
            return '<li class="empty">No posts yet.</li>'
        out = []
        for p in items:
            date = text(p.get("date"))
            li = f'<a class="post-link" href="{esc(self.url(p.get("url")))}">{esc(p.get("title"))}</a>'
            if date:
                li += f' <span class="meta"><time datetime="{esc(date)}">{esc(when(date))}</time></span>'
            if p.get("summary"):
                li += f'\n<p class="sum">{esc(p["summary"])}</p>'
            out.append(f"<li>{li}</li>")
        return "\n".join(out)

    def entry(self, e):
        """One line for what and where, a gray line for when (and the detail, if it is a single line), then the details."""
        head = f'<span class="t">{esc(e.get("what"))}</span>'
        if e.get("where"):
            head += f'<span class="w">, {esc(e["where"])}</span>'
        detail = lines(e.get("detail"))
        meta = []
        if text(e.get("when")):
            meta.append(esc(e.get("when")))
        if len(detail) == 1:
            meta.append(esc(detail[0]))
        li = f'<p class="entry-title">{head}</p>'
        if meta:
            li += f'\n<p class="meta">{" · ".join(meta)}</p>'
        if len(detail) > 1:
            li += '\n<ul class="d">' + "".join(f"<li>{esc(x)}</li>" for x in detail) + "</ul>"
        return f"<li>{li}</li>"

    def award(self, a):
        li = f'<span class="t">{esc(a.get("what"))}</span>'
        where = text(a.get("where"))
        if where and where not in text(a.get("what")):
            li += f'<span class="w">, {esc(where)}</span>'
        if text(a.get("when")):
            li += f' <span class="meta">{esc(a.get("when"))}</span>'
        return f"<li>{li}</li>"

    def grouped(self, rows, kinds, cls, fmt):
        first = kinds[0][0]
        known = [k for k, _ in kinds]
        groups = [(label, [r for r in rows if (r.get("kind") or first) == k]) for k, label in kinds]
        other = [r for r in rows if (r.get("kind") or first) not in known]
        if other:
            groups.append(("Other", other))
        used = [(label, rs) for label, rs in groups if rs]
        out = []
        for label, rs in used:
            head = f'<h3 class="sub">{label}</h3>\n' if len(used) > 1 else ""
            out.append(head + f'<ul class="list {cls}">\n' + "\n".join(fmt(r) for r in rs) + "\n</ul>")
        return "\n".join(out)

    def research(self):
        """The research plan: each direction is a title and a short paragraph (blank lines start new paragraphs)."""
        out = []
        for r in self.d.get("research") or []:
            parts = [f'<h3 class="plan-title">{esc(r.get("title"))}</h3>'] if text(r.get("title")) else []
            parts += [f'<p class="plan-text">{esc(x)}</p>' for x in paragraphs(text(r.get("text")))]
            out.append("<li>" + "\n".join(parts) + "</li>")
        return "\n".join(out)

    def education(self):
        return "\n".join(self.entry(e) for e in self.d.get("education") or [])

    def experience(self):
        return self.grouped(self.d.get("experience") or [], EXPERIENCE, "entries", self.entry)

    def awards(self):
        return self.grouped(self.d.get("awards") or [], AWARDS, "awards", self.award)


BLOCK = re.compile(r"(<!-- render:(?P<name>[\w-]+) -->\s*<(?P<tag>[a-z0-9]+)\b[^>]*>)(?P<inner>.*?)(</(?P=tag)>\s*<!-- /render:(?P=name) -->)", re.S)


def build(page, data):
    src = page.read_text(encoding="utf-8")
    m = re.search(r'<body[^>]*\sdata-root="([^"]*)"', src)
    r = Renderer(data, m.group(1) if m else "")

    def fill(b):
        render = getattr(r, b.group("name").replace("-", "_"), None)
        if render is None:
            sys.exit(f"{page}: no renderer for block '{b.group('name')}'")
        return b.group(1) + render() + b.group(5)

    return src, BLOCK.sub(fill, src)


def main():
    check = "--check" in sys.argv[1:]
    data = json.loads((SITE / "content" / "data.json").read_text(encoding="utf-8"))
    stale = []
    for name in PAGES:
        page = SITE / name
        old, new = build(page, data)
        if old != new:
            stale.append(name)
            if not check:
                page.write_text(new, encoding="utf-8")
    if check:
        print("out of date: " + ", ".join(stale) if stale else "up to date")
        sys.exit(1 if stale else 0)
    print("updated: " + ", ".join(stale) if stale else "already up to date")


if __name__ == "__main__":
    main()
