// Loads content/data.json, then draws the bento (bento.js) and handles the detail sheets.
(async () => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const two = (n) => String(n).padStart(2, "0");
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "item";

  /* ---------- load content ---------- */
  let D;
  try {
    const res = await fetch(`content/data.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    D = await res.json();
  } catch (e) {
    $("#scene").innerHTML = `<p class="empty">Couldn't load <code>content/data.json</code>. Open this page through a web server (e.g. GitHub Pages, or <code>python3 -m http.server</code>).</p>`;
    return;
  }
  window.PORTFOLIO = D;
  const P = D.profile;
  ["publications", "projects"].forEach((k) =>
    (D[k] || []).forEach((it, i) => { if (!it.id) it.id = `${slug(it.title)}-${i}`; it.images ||= []; }));

  const TYPE_LABEL = { conference: "Conference", journal: "Journal", preprint: "Preprint", workshop: "Workshop" };
  const PUB_LINK = { doi: "DOI", pdf: "PDF", arxiv: "arXiv", code: "Code", project: "Project", video: "Video", slides: "Slides", poster: "Poster" };
  const PROJ_LINK = { github: "GitHub", demo: "Demo", paper: "Paper", video: "Video", slides: "Slides" };

  const pubs = D.publications.map((p, i) => ({ ...p, _i: i })).sort((a, b) => b.year - a.year || a._i - b._i);
  const selected = pubs.filter((p) => p.selected);
  const awards = D.awards || [];

  const c = D.contact || {};
  const contacts = [
    c.email && ["Email", c.email, `mailto:${c.email}`],
    c.github && ["GitHub", c.github.replace(/^https?:\/\//, ""), c.github],
    c.scholar && ["Scholar", "Google Scholar", c.scholar],
    c.linkedin && ["LinkedIn", c.linkedin.replace(/^https?:\/\/(www\.)?/, ""), c.linkedin],
    c.cv && ["CV", "PDF", c.cv],
  ].filter(Boolean);

  // shared with bento.js (the illustration)
  window.LB = { D, P, pubs, selected, awards, contacts, esc, two, eduCount: (D.education || []).length, xpCount: (D.experience || D.professional || []).length };
  window.initBento && window.initBento();

  if (c.cv) {
    const a = $("#cv-link");
    a.href = c.cv;
    a.hidden = false;
  }
  const first = P.firstName || P.name.split(" ")[0];
  $("#name").textContent = `${first}'s Research Bento`;
  document.title = `${P.name} — Research Bento`;
  const mod = new Date(document.lastModified);
  $("#foot").innerHTML = `Packed fresh · ${mod.getFullYear()}.${two(mod.getMonth() + 1)} · ${esc(P.name)} <a class="edit-link" href="admin.html" aria-label="Edit this site">✎</a>`;

  /* ---------- tiny, safe markdown ---------- */
  const safeUrl = (u) => !/^\s*(javascript|data|vbscript):/i.test(u);
  const inline = (t) => esc(t)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, a, u) => (safeUrl(u) ? `<img src="${u}" alt="${a}" loading="lazy">` : m))
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t2, u) => (safeUrl(u) ? `<a href="${u}" target="_blank" rel="noopener">${t2}</a>` : m))
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  const md = (src = "") => {
    let html = "", para = [], list = null, quote = [], code = null;
    const flush = () => {
      if (para.length) { html += `<p>${inline(para.join(" "))}</p>`; para = []; }
      if (list) { html += `<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`; list = null; }
      if (quote.length) { html += `<blockquote>${inline(quote.join(" "))}</blockquote>`; quote = []; }
    };
    String(src).replace(/\r/g, "").split("\n").forEach((line) => {
      if (code !== null) {
        if (/^```/.test(line)) { html += `<pre><code>${esc(code.join("\n"))}</code></pre>`; code = null; } else code.push(line);
        return;
      }
      if (/^```/.test(line)) { flush(); code = []; return; }
      let m;
      if (!line.trim()) return flush();
      if ((m = line.match(/^(#{1,3})\s+(.*)/))) { flush(); html += `<h${m[1].length === 3 ? 5 : 4}>${inline(m[2])}</h${m[1].length === 3 ? 5 : 4}>`; return; }
      if ((m = line.match(/^\s*[-*]\s+(.*)/)) || (m = line.match(/^\s*\d+\.\s+(.*)/))) {
        const tag = /^\s*\d+\./.test(line) ? "ol" : "ul";
        if (para.length || quote.length || (list && list.tag !== tag)) flush();
        list ||= { tag, items: [] };
        list.items.push(m[1]);
        return;
      }
      if ((m = line.match(/^>\s?(.*)/))) { if (para.length || list) flush(); quote.push(m[1]); return; }
      if (list || quote.length) flush();
      para.push(line.trim());
    });
    if (code !== null) html += `<pre><code>${esc(code.join("\n"))}</code></pre>`;
    flush();
    return html;
  };

  /* ---------- sheet content ---------- */
  const authorsHTML = (authors) => authors.map((a) => (a === D.me ? `<span class="me">${esc(a)}</span>` : esc(a))).join(", ");
  const linkList = (links = {}, labels) =>
    Object.entries(links).filter(([, u]) => u)
      .map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${labels[k] || esc(k)}</a>`).join("");
  const contactList = () => `<div class="contacts">${contacts.map(([l, v, u]) =>
    `<a href="${esc(u)}" ${u.startsWith("mailto") ? "" : 'target="_blank" rel="noopener"'}>${l}<span>${esc(v)}</span></a>`).join("")}</div>`;
  const hasStory = (it) => (it.body && it.body.trim()) || (it.images && it.images.length) || it.cover;

  const makeBibtex = (p) => {
    if (p.bibtex) return p.bibtex;
    const firstA = (p.authors[0] || "anon").split(" ").pop().toLowerCase();
    const word = (p.title.match(/[A-Za-z]+/) || ["paper"])[0].toLowerCase();
    const kind = p.type === "journal" ? "article" : p.type === "preprint" ? "misc" : "inproceedings";
    const where = p.type === "journal" ? "journal" : p.type === "preprint" ? "howpublished" : "booktitle";
    const names = p.authors.map((a) => { const s = a.split(" "); const l = s.pop(); return `${l}, ${s.join(" ")}`; });
    const doi = p.links && p.links.doi ? `,\n  doi={${p.links.doi.replace(/^https?:\/\/doi\.org\//, "")}}` : "";
    const note = p.status === "accepted" ? ",\n  note={Accepted}" : "";
    return `@${kind}{${firstA}${p.year}${word},\n  title={${p.title}},\n  author={${names.join(" and ")}},\n  ${where}={${p.venue}},\n  year={${p.year}}${doi}${note}\n}`;
  };

  const pubState = { type: "all", selectedOnly: false, q: "" };
  function pubList() {
    const q = pubState.q.trim().toLowerCase();
    const list = pubs.filter((p) =>
      (pubState.type === "all" || p.type === pubState.type) &&
      (!pubState.selectedOnly || p.selected) &&
      (!q || `${p.title} ${p.authors.join(" ")} ${p.venue}`.toLowerCase().includes(q)));
    if (!list.length) return `<p class="empty">No papers match that.</p>`;
    return [...new Set(list.map((p) => p.year))].map((y) => `
      <div class="year"><span>${y}</span></div>
      ${list.filter((p) => p.year === y).map((p) => `
        <article class="pub${p.cover ? " has-thumb" : ""}">
          ${p.cover ? `<button class="thumb" data-detail="papers:${esc(p.id)}" aria-label="Open ${esc(shortTitle(p.title))}"><img src="${esc(p.cover)}" alt="" loading="lazy"></button>` : ""}
          <div class="pub-meta">
            <span class="kind ${p.type}">${TYPE_LABEL[p.type] || p.type}</span>
            <span>${esc(p.venue)}</span>${p.status === "accepted" ? `<span class="accepted">Accepted</span>` : ""}
            ${p.badge ? `<span class="award">— ${esc(p.badge)}</span>` : ""}
          </div>
          <h3 class="pub-title"><button class="title-link" data-detail="papers:${esc(p.id)}">${p.selected ? `<span class="star" title="Selected">✦</span>` : ""}${esc(p.title)}</button></h3>
          <p class="pub-authors">${authorsHTML(p.authors)}</p>
          <div class="links">${linkList(p.links, PUB_LINK)}<button type="button" data-bib="${p._i}">BibTeX</button>${hasStory(p) ? `<button type="button" class="more" data-detail="papers:${esc(p.id)}">Read more →</button>` : ""}</div>
        </article>`).join("")}`).join("");
  }
  function papersView() {
    const counts = pubs.reduce((m, p) => ((m[p.type] = (m[p.type] || 0) + 1), m), {});
    const types = Object.keys(TYPE_LABEL).filter((t) => counts[t]);
    return `
      <div class="toolbar">
        <button class="filter" data-type="all" aria-pressed="${pubState.type === "all"}">All<span class="n">${pubs.length}</span></button>
        ${types.map((t) => `<button class="filter" data-type="${t}" aria-pressed="${pubState.type === t}">${TYPE_LABEL[t]}<span class="n">${counts[t]}</span></button>`).join("")}
        ${selected.length ? `<button class="filter" data-selected aria-pressed="${pubState.selectedOnly}">✦ Selected</button>` : ""}
        <input class="search" type="search" placeholder="Search title, author, venue" value="${esc(pubState.q)}" />
      </div>
      <div id="pub-list">${pubList()}</div>`;
  }

  const STOP = /^(via|and|of|for|the|in|on|with|a|an|to|under|when|from)$/i;
  const shortTitle = (t = "") => {
    const q = t.match(/^(.{3,40}?\?)\s/);
    if (q) return q[1];
    const head = t.split(/:\s/)[0];
    if (head.length <= 34) return head;
    const out = [];
    for (const w of head.split(" ")) { if ([...out, w].join(" ").length > 30) break; out.push(w); }
    while (out.length > 1 && STOP.test(out[out.length - 1])) out.pop();
    return out.join(" ");
  };
  const gallery = (it) => (it.images || []).filter((src) => src !== it.cover).length
    ? `<div class="gallery">${it.images.filter((src) => src !== it.cover).map((src) => `<a href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="" loading="lazy"></a>`).join("")}</div>` : "";
  const paperDetail = (p) => `
    <button class="back" data-back="papers">← All publications</button>
    <div class="pub-meta">
      <span class="kind ${p.type}">${TYPE_LABEL[p.type] || p.type}</span><span>${esc(p.venue)}</span>${p.status === "accepted" ? `<span class="accepted">Accepted</span>` : ""}
      ${p.badge ? `<span class="award">— ${esc(p.badge)}</span>` : ""}
    </div>
    <h3 class="detail-title">${esc(p.title)}</h3>
    <p class="pub-authors">${authorsHTML(p.authors)}</p>
    <div class="links">${linkList(p.links, PUB_LINK)}<button type="button" data-bib="${p._i}">BibTeX</button></div>
    ${p.cover ? `<figure class="cover"><img src="${esc(p.cover)}" alt=""></figure>` : ""}
    ${p.body && p.body.trim() ? `<div class="md">${md(p.body)}</div>` : ""}
    ${gallery(p)}`;
  const projectDetail = (p) => `
    <button class="back" data-back="projects">← All projects</button>
    <h3 class="detail-title">${esc(p.title)}${p.featured ? `<small>FEATURED</small>` : ""}</h3>
    ${p.role || p.year ? `<p class="proj-meta">${esc([p.role, p.year].filter(Boolean).join(" · "))}</p>` : ""}
    <p class="lead">${esc(p.desc || "")}</p>
    <div class="tags">${(p.tags || []).map((t) => `<span>${esc(t)}</span>`).join("")}</div>
    <div class="links">${linkList(p.links, PROJ_LINK)}</div>
    ${p.cover ? `<figure class="cover"><img src="${esc(p.cover)}" alt=""></figure>` : ""}
    <div class="md">${p.body && p.body.trim() ? md(p.body) : ""}</div>
    ${gallery(p)}`;

  const timelineList = (rows, a, b, cc) => `<ul class="tl">${rows.map((t) => `
    <li><span class="w">${esc(t[a])}</span><div><div class="what">${esc(t[b])}</div>${cc && t[cc] ? `<div class="where">${esc(t[cc])}</div>` : ""}${t.detail ? `<div class="detail">${esc(t.detail)}</div>` : ""}</div></li>`).join("")}</ul>`;
  const education = D.education || [];
  const experience = D.experience || (D.professional || []).map((x) => ({ ...x, kind: "professional" }));
  const grouped = (rows, groups) => {
    const html = groups
      .map(([kind, h]) => [h, rows.filter((r) => (r.kind || groups[0][0]) === kind)])
      .filter(([, rs]) => rs.length)
      .map(([h, rs], i, all) => `${all.length > 1 ? `<p class="label">${h}</p>` : ""}${timelineList(rs, "when", "what", "where")}`).join("");
    return html || `<p class="empty">Nothing here yet.</p>`;
  };

  const NEWS_KIND = { paper: "Paper", project: "Project", academic: "Academic", award: "Award", career: "Career" };
  const VIEWS = {
    about: { no: "The Label", title: "About", html: () => `
      <div class="about-body">
        <p class="lede">${esc(P.oneLiner)}</p>
        <p>${esc(P.bio)}</p>
        <p class="label">Ingredients · Interests</p>
        <div class="tags">${(P.interests || []).map((t) => `<span>${esc(t)}</span>`).join("")}</div>
        <p class="label">Say hello</p>
        ${contactList()}
      </div>` },
    papers: { no: "Kimbap", title: `Publications · ${pubs.length}`, html: papersView },
    projects: { no: "Sausage stir-fry", title: "Projects", html: () => D.projects.map((p) => `
      <article class="proj${p.cover ? " has-thumb" : ""}">
        ${p.cover ? `<button class="thumb" data-detail="projects:${esc(p.id)}" aria-label="Open ${esc(shortTitle(p.title))}"><img src="${esc(p.cover)}" alt="" loading="lazy"></button>` : ""}
        <h3><button class="title-link" data-detail="projects:${esc(p.id)}">${esc(p.title)}</button>${p.featured ? `<small>FEATURED</small>` : ""}</h3>
        ${p.role || p.year ? `<p class="proj-meta">${esc([p.role, p.year].filter(Boolean).join(" · "))}</p>` : ""}
        <p>${esc(p.desc)}</p>
        <div class="tags">${(p.tags || []).map((t) => `<span>${esc(t)}</span>`).join("")}</div>
        <div class="links">${linkList(p.links, PROJ_LINK)}${hasStory(p) ? `<button type="button" class="more" data-detail="projects:${esc(p.id)}">Read more →</button>` : ""}</div>
      </article>`).join("") },
    skills: { no: "Tamagoyaki", title: "Skills", compact: true, html: () => {
      const groups = [...new Set(D.skills.map((s) => s.group || ""))];
      return groups.map((g) => `
        <div class="skill-group">
          ${g ? `<p class="label">${esc(g)}</p>` : ""}
          <div class="chips">${D.skills.filter((s) => (s.group || "") === g).map((s) => `<span>${esc(s.name)}</span>`).join("")}</div>
        </div>`).join("") || `<p class="empty">Nothing here yet.</p>`;
    } },
    education: { no: "Tonkatsu", title: "Education", html: () => grouped(education, [["", "Education"]]) },
    experience: { no: "Grilled salmon", title: "Experience", html: () => grouped(experience, [["research", "Research"], ["professional", "Professional"], ["teaching", "Teaching"]]) },
    awards: { no: "Dessert", title: "Awards & Honors", html: () => grouped(awards, [["award", "Awards & Competitions"], ["scholarship", "Scholarships"]]) },
    news: { no: "The Receipt", title: "News", html: () => `<ul class="tl">${D.news.map((n) => `
      <li><span class="w">${esc(n.when)}</span><div>${n.kind ? `<span class="news-kind">${esc(NEWS_KIND[n.kind] || n.kind)}</span>` : ""}<div class="what">${esc(n.text)}</div></div></li>`).join("")}</ul>` },
    contact: { no: "Chopsticks", title: "Say hello", compact: true, html: () => `<div class="contact-cards">${contacts.map(([l, v, u]) =>
      `<a class="contact-card" href="${esc(u)}" ${u.startsWith("mailto") ? "" : 'target="_blank" rel="noopener"'}><span class="k">${l}</span><span class="v">${esc(l === "CV" ? "Download PDF" : v)}</span><span class="go">→</span></a>`).join("")}</div>` },
  };

  /* ---------- open / close ---------- */
  const sheet = $("#sheet");
  const body = $("#sheet-body");
  function show(no, title, html, hash, compact = false) {
    $("#sheet-art").hidden = true;
    $("#sheet-no").textContent = no;
    $("#sheet-title").textContent = title;
    sheet.classList.toggle("compact", compact);
    body.innerHTML = html;
    body.scrollTop = 0;
    if (!sheet.open) sheet.showModal();
    body.focus({ preventScroll: true });
    history.replaceState(null, "", `#${hash}`);
  }
  function openSheet(key) {
    const v = VIEWS[key];
    if (v) show(v.no, v.title, v.html(), key, !!v.compact);
  }
  function openDetail(kind, id) {
    if (kind === "papers") {
      const p = pubs.find((x) => x.id === id);
      if (p) return show(`Kimbap · ${p.venue}${p.status === "accepted" ? " (accepted)" : ""}`, p.short || shortTitle(p.title), paperDetail(p), `papers/${id}`);
    }
    if (kind === "projects") {
      const p = D.projects.find((x) => x.id === id);
      if (p) return show(`Sausage stir-fry · ${p.year || "Project"}`, p.short || shortTitle(p.title), projectDetail(p), `projects/${id}`);
    }
    openSheet(kind);
  }
  sheet.addEventListener("close", () => history.replaceState(null, "", location.pathname + location.search));
  $("#sheet-close").addEventListener("click", () => sheet.close());
  sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.close(); });
  document.addEventListener("click", (e) => {
    const d = e.target.closest("[data-detail]");
    if (d) { const [k, id] = d.dataset.detail.split(":"); return openDetail(k, id); }
    const b = e.target.closest("[data-back]");
    if (b) return openSheet(b.dataset.back);
    const t = e.target.closest("[data-open]");
    if (t) openSheet(t.dataset.open);
  });
  document.addEventListener("keydown", (e) => {
    const t = e.target.closest && e.target.closest("[data-open]");
    if (t && (e.key === "Enter" || e.key === " ") && t.tagName !== "BUTTON") { e.preventDefault(); openSheet(t.dataset.open); }
  });

  body.addEventListener("click", (e) => {
    const f = e.target.closest(".filter");
    if (f) {
      if (f.hasAttribute("data-selected")) pubState.selectedOnly = !pubState.selectedOnly;
      else pubState.type = f.dataset.type;
      body.querySelectorAll(".filter").forEach((b) =>
        b.setAttribute("aria-pressed", b.hasAttribute("data-selected") ? pubState.selectedOnly : b.dataset.type === pubState.type));
      $("#pub-list").innerHTML = pubList();
      return;
    }
    const bib = e.target.closest("[data-bib]");
    if (bib) copy(makeBibtex(D.publications[+bib.dataset.bib]));
  });
  body.addEventListener("input", (e) => {
    if (!e.target.classList.contains("search")) return;
    pubState.q = e.target.value;
    $("#pub-list").innerHTML = pubList();
  });

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const t = document.createElement("textarea");
      t.value = text; sheet.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
    }
    toast("BibTeX copied");
  }
  let timer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(timer); timer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  let [hk, hid] = decodeURIComponent(location.hash.slice(1)).split("/");
  if (hk === "timeline") hk = "education";
  if (hid) openDetail(hk, hid);
  else if (VIEWS[hk]) openSheet(hk);
})();
