// One job, no libraries: on the home page and the blog index, rebuild the blocks marked data-render
// from content/data.json, so edits saved from admin.html show up without a rebuild. The HTML already
// holds the same blocks (written by tools/build_home.py from the same file), so a block is only
// swapped when data.json has changed since. Keep these renderers identical to the Python ones.
(() => {
  const root = document.body.dataset.root || "";

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const text = (s) => (s == null ? "" : String(s));
  const url = (u) => (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(text(u)) ? text(u) : root + text(u));
  const lines = (s) => text(s).split("\n").map((x) => x.trim()).filter(Boolean);

  const LINKS = [["pdf", "PDF"], ["arxiv", "arXiv"], ["doi", "DOI"], ["code", "Code"], ["project", "Project page"],
    ["video", "Video"], ["slides", "Slides"], ["poster", "Poster"]];
  const EXPERIENCE = [["research", "Research"], ["teaching", "Teaching"], ["service", "Service"], ["professional", "Professional"]];
  const AWARDS = [["award", "Awards"], ["scholarship", "Scholarships"]];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // "2026.11" or "2026-11" -> "Nov 2026", "2026-11-10" -> "Nov 10, 2026"; anything else as written
  function when(s) {
    const t = text(s).trim();
    let m = /^([0-9]{4})[.-]([0-9]{1,2})$/.exec(t);
    if (m && +m[2] >= 1 && +m[2] <= 12) return `${MONTHS[+m[2] - 1]} ${m[1]}`;
    m = /^([0-9]{4})[.-]([0-9]{1,2})[.-]([0-9]{1,2})$/.exec(t);
    if (m && +m[2] >= 1 && +m[2] <= 12) return `${MONTHS[+m[2] - 1]} ${+m[3]}, ${m[1]}`;
    return t;
  }

  // the text under an "## Abstract" heading, or the whole body if it has no headings
  function abstractOf(body) {
    const t = text(body).replace(/\r/g, "");
    if (!t.trim()) return "";
    const ls = t.split("\n");
    if (!ls.some((l) => l.startsWith("#"))) return t.trim();
    const out = [];
    let inside = false;
    for (const l of ls) {
      if (l.startsWith("#")) {
        if (inside) break;
        inside = l.replace(/^#+/, "").trim().toLowerCase() === "abstract";
        continue;
      }
      if (inside) out.push(l);
    }
    return out.join("\n").trim();
  }
  const paragraphs = (t) => t.split(/\n\s*\n/).filter((b) => b.trim()).map((b) => b.split("\n").map((x) => x.trim()).filter(Boolean).join(" "));

  function intro(d) {
    const p = d.profile || {}, c = d.contact || {};
    const items = [];
    if (c.email) items.push(`<li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>`);
    for (const [key, label] of [["linkedin", "LinkedIn"], ["github", "GitHub"], ["scholar", "Google Scholar"]]) {
      if (c[key]) items.push(`<li><a href="${esc(url(c[key]))}">${label}</a></li>`);
    }
    if (c.cv) items.push(`<li><a href="${esc(url(c.cv))}">CV</a></li>`);
    const parts = [`<h1>${esc(p.name)}</h1>`];
    if (p.oneLiner) parts.push(`<p class="dek">${esc(p.oneLiner)}</p>`);
    if (p.bio) parts.push(`<p class="bio">${esc(p.bio)}</p>`);
    if (items.length) parts.push(`<ul class="contact">\n${items.join("\n")}\n</ul>`);
    return parts.join("\n");
  }

  function news(d) {
    return (d.news || []).map((n) => {
      const w = when(n.when);
      return `<li>${esc(n.text)}${w ? ` <span class="meta">${esc(w)}</span>` : ""}</li>`;
    }).join("\n");
  }

  function pub(d, p, k) {
    const authors = (p.authors || []).map((a) => (a === d.me ? `<span class="me">${esc(a)}</span>` : esc(a))).join(", ");
    const abstract = abstractOf(p.body);
    const cover = text(p.cover);
    const venue = text(p.venue), year = text(p.year);
    const where = venue ? [esc(venue)] : [];
    if (year && !venue.includes(year)) where.push(esc(year));
    if (p.status === "accepted") where.push("accepted");
    if (p.badge) where.push(esc(p.badge));
    const meta = where.length ? [`<span class="venue">${where.join(", ")}</span>`] : [];
    const links = p.links || {};
    for (const [key, label] of LINKS) if (links[key]) meta.push(`<a href="${esc(url(links[key]))}">${label}</a>`);
    const more = Boolean(abstract || cover);
    if (more) meta.push(`<label class="more" for="abs-${k}">${abstract ? "Abstract" : "Figure"}</label>`);
    const parts = [`<h3 class="pub-title">${esc(p.title)}</h3>`];
    if (authors) parts.push(`<p class="pub-authors">${authors}</p>`);
    if (more) parts.push(`<input class="more-toggle" type="checkbox" id="abs-${k}">`);
    if (meta.length) parts.push(`<p class="pub-meta">${meta.join("\n")}</p>`);
    if (more) {
      const body = cover ? [`<a href="${esc(url(cover))}"><img src="${esc(url(cover))}" alt="Overview figure" loading="lazy"></a>`] : [];
      for (const x of paragraphs(abstract)) body.push(`<p>${esc(x)}</p>`);
      parts.push(`<div class="more-body">${body.join("\n")}</div>`);
    }
    return `<li class="pub">${parts.join("\n")}</li>`;
  }

  function publications(d) {
    const num = (y) => Number(y) || 0;
    const pubs = (d.publications || []).map((p, i) => [p, i]).sort((a, b) => num(b[0].year) - num(a[0].year) || a[1] - b[1]).map(([p]) => p);
    return pubs.map((p, k) => pub(d, p, k)).join("\n");
  }

  function posts(d) {
    const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    const items = (d.posts || []).slice().sort((a, b) => cmp(text(b.date), text(a.date)));
    if (!items.length) return `<li class="empty">No posts yet.</li>`;
    return items.map((p) => {
      const date = text(p.date);
      let li = `<a class="post-link" href="${esc(url(p.url))}">${esc(p.title)}</a>`;
      if (date) li += ` <span class="meta"><time datetime="${esc(date)}">${esc(when(date))}</time></span>`;
      if (p.summary) li += `\n<p class="sum">${esc(p.summary)}</p>`;
      return `<li>${li}</li>`;
    }).join("\n");
  }

  // one line for what and where, a gray line for when (and the detail, if it is a single line), then the details
  function entry(e) {
    let head = `<span class="t">${esc(e.what)}</span>`;
    if (e.where) head += `<span class="w">, ${esc(e.where)}</span>`;
    const detail = lines(e.detail);
    const meta = [];
    if (text(e.when)) meta.push(esc(e.when));
    if (detail.length === 1) meta.push(esc(detail[0]));
    let li = `<p class="entry-title">${head}</p>`;
    if (meta.length) li += `\n<p class="meta">${meta.join(" · ")}</p>`;
    if (detail.length > 1) li += `\n<ul class="d">${detail.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    return `<li>${li}</li>`;
  }

  // the research plan: each direction is a title and a short paragraph (blank lines start new paragraphs)
  function research(d) {
    return (d.research || []).map((r) => {
      const parts = text(r.title) ? [`<h3 class="plan-title">${esc(r.title)}</h3>`] : [];
      for (const x of paragraphs(text(r.text))) parts.push(`<p class="plan-text">${esc(x)}</p>`);
      return `<li>${parts.join("\n")}</li>`;
    }).join("\n");
  }

  function award(a) {
    let li = `<span class="t">${esc(a.what)}</span>`;
    const where = text(a.where);
    if (where && !text(a.what).includes(where)) li += `<span class="w">, ${esc(where)}</span>`;
    if (text(a.when)) li += ` <span class="meta">${esc(a.when)}</span>`;
    return `<li>${li}</li>`;
  }

  function grouped(rows, kinds, cls, fmt) {
    const first = kinds[0][0];
    const known = kinds.map(([k]) => k);
    const groups = kinds.map(([k, label]) => [label, rows.filter((r) => (r.kind || first) === k)]);
    const other = rows.filter((r) => !known.includes(r.kind || first));
    if (other.length) groups.push(["Other", other]);
    const used = groups.filter(([, rs]) => rs.length);
    return used.map(([label, rs]) => (used.length > 1 ? `<h3 class="sub">${label}</h3>\n` : "") + `<ul class="list ${cls}">\n${rs.map(fmt).join("\n")}\n</ul>`).join("\n");
  }

  const RENDER = {
    intro,
    news,
    publications,
    posts,
    research,
    education: (d) => (d.education || []).map(entry).join("\n"),
    experience: (d) => grouped(d.experience || [], EXPERIENCE, "entries", entry),
    awards: (d) => grouped(d.awards || [], AWARDS, "awards", award),
  };

  async function refresh() {
    const blocks = [...document.querySelectorAll("[data-render]")];
    if (!blocks.length) return;
    let d;
    try {
      const res = await fetch(`${root}content/data.json`, { cache: "no-cache" });
      if (!res.ok) return;
      d = await res.json();
    } catch {
      return; // opened as a file, or offline: the HTML already holds the content
    }
    let swapped = 0;
    for (const el of blocks) {
      const render = RENDER[el.dataset.render];
      if (!render) continue;
      const t = document.createElement("template");
      t.innerHTML = render(d);
      if (t.innerHTML !== el.innerHTML) {
        el.replaceChildren(t.content);
        swapped++;
      }
    }
    document.documentElement.dataset.swapped = String(swapped);
  }

  refresh();
})();
