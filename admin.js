// The edit page (admin.html). It edits content/data.json, which the home page and the blog index read.
//
// The site is static (GitHub Pages), so edits are saved by committing content/data.json and
// uploaded photos straight to your GitHub repo through the GitHub API. Only someone holding a
// GitHub token with write access to the repo can save. The token is kept in this browser,
// encrypted with your own password (AES-GCM, key derived with PBKDF2), and never leaves it
// except to talk to api.github.com.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

  const API = localStorage.getItem("lb-api") || "https://api.github.com";
  const STORE = "lb-admin-v1";
  const DATA_PATH = "content/data.json";
  const IMG_DIR = "content/images";

  const S = { mode: null, cfg: null, token: null, data: null, sha: null, dirty: false, tab: "publications", edit: null, blobs: {} };

  /* ---------- status ---------- */
  const status = (msg, kind = "") => { const el = $("#status"); el.innerHTML = msg; el.className = `status ${kind}`; };
  const setDirty = (v = true) => {
    S.dirty = v;
    $("#save").disabled = !v;
    if (v) status("Unsaved changes");
  };

  /* ---------- base64 helpers (UTF-8 safe) ---------- */
  const bytesToB64 = (bytes) => {
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const b64ToBytes = (b) => Uint8Array.from(atob(b.replace(/\s/g, "")), (c) => c.charCodeAt(0));
  const textToB64 = (t) => bytesToB64(new TextEncoder().encode(t));
  const b64ToText = (b) => new TextDecoder().decode(b64ToBytes(b));

  /* ---------- password lock (token encrypted on this device) ---------- */
  async function keyFrom(password, salt) {
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function seal(password, text) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyFrom(password, salt), new TextEncoder().encode(text));
    return { salt: bytesToB64(salt), iv: bytesToB64(iv), ct: bytesToB64(new Uint8Array(ct)) };
  }
  async function unseal(password, box) {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBytes(box.iv) }, await keyFrom(password, b64ToBytes(box.salt)), b64ToBytes(box.ct));
    return new TextDecoder().decode(pt);
  }
  const readBox = () => { try { return JSON.parse(localStorage.getItem(STORE)); } catch { return null; } };

  /* ---------- GitHub API ---------- */
  async function gh(path, opts = {}) {
    const { owner, repo } = S.cfg;
    const res = await fetch(`${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${path}`, {
      ...opts,
      headers: {
        Authorization: `Bearer ${S.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const e = new Error(j.message || res.statusText);
      e.status = res.status;
      throw e;
    }
    return res.json();
  }
  async function loadGitHub() {
    const j = await gh(`contents/${DATA_PATH}?ref=${encodeURIComponent(S.cfg.branch)}`);
    S.sha = j.sha;
    S.data = JSON.parse(b64ToText(j.content));
  }
  async function saveGitHub() {
    const j = await gh(`contents/${DATA_PATH}`, {
      method: "PUT",
      body: JSON.stringify({ message: "Update portfolio content", content: textToB64(JSON.stringify(S.data, null, 2) + "\n"), sha: S.sha, branch: S.cfg.branch }),
    });
    S.sha = j.content.sha;
  }
  async function putFile(path, b64, message, replace = false) {
    let sha;
    if (replace) {
      try { sha = (await gh(`contents/${path}?ref=${encodeURIComponent(S.cfg.branch)}`)).sha; } catch (e) { if (e.status !== 404) throw e; }
    }
    await gh(`contents/${path}`, { method: "PUT", body: JSON.stringify({ message, content: b64, branch: S.cfg.branch, ...(sha ? { sha } : {}) }) });
  }
  async function uploadCV(file) {
    if (!file) return;
    if (S.mode !== "github") { alert("PDF upload needs GitHub mode (unlock with your token)."); return; }
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) { alert("Please choose a PDF file."); return; }
    status("Uploading CV…");
    try {
      await putFile("content/cv.pdf", bytesToB64(new Uint8Array(await file.arrayBuffer())), "Update CV", true);
      S.data.contact.cv = "content/cv.pdf";
      setDirty();
      renderPanel();
      status("CV uploaded — click Save to publish", "ok");
    } catch (e) { status(`Upload failed: ${explain(e)}`, "err"); }
  }
  const explain = (e) =>
    e.status === 401 ? "GitHub didn't accept that token. Check it and try again."
    : e.status === 403 ? "That token can't write to this repo. It needs “Contents: Read and write”."
    : e.status === 404 ? `Couldn't find <code>${DATA_PATH}</code> in ${esc(S.cfg.owner)}/${esc(S.cfg.repo)} (branch ${esc(S.cfg.branch)}). Check the repo name, and that the site is pushed.`
    : e.status === 409 ? "The file changed on GitHub since you opened it. Reload this page, then make your edit again."
    : esc(e.message || "Something went wrong.");

  function guessRepo() {
    const h = location.hostname;
    if (h.endsWith(".github.io")) {
      const owner = h.split(".")[0];
      const seg = location.pathname.split("/").filter(Boolean)[0];
      return { owner, repo: seg && !seg.endsWith(".html") ? seg : `${owner}.github.io`, branch: "main" };
    }
    return { owner: "", repo: "", branch: "main" };
  }

  /* ---------- gate (locked) ---------- */
  function renderGate(msg = "") {
    S.token = null;
    $("#editor").hidden = true;
    $("#gate").hidden = false;
    $("#save").hidden = true;
    $("#lock").hidden = true;
    status("");
    const box = readBox();
    if (box) {
      $("#gate").innerHTML = `
        <h2>Welcome back</h2>
        <p>Enter your password to unlock editing for <b>${esc(box.owner)}/${esc(box.repo)}</b>.</p>
        <form id="unlockForm">
          <label class="field"><span>Password</span><input type="password" id="g-pw" autocomplete="current-password" required autofocus /></label>
          <div class="actions">
            <button class="primary" type="submit">Unlock</button>
            <button class="link" type="button" id="g-local">Edit locally instead</button>
            <button class="link" type="button" id="g-forget">Forget this device</button>
          </div>
          <div class="err" id="g-err">${msg}</div>
        </form>`;
      $("#unlockForm").onsubmit = async (e) => {
        e.preventDefault();
        $("#g-err").textContent = "Unlocking…";
        try { S.token = await unseal($("#g-pw").value, box); }
        catch { $("#g-err").textContent = "Wrong password."; return; }
        S.cfg = { owner: box.owner, repo: box.repo, branch: box.branch };
        await connect();
      };
      $("#g-forget").onclick = () => {
        if (confirm("Remove the saved token from this browser? You'll need to set it up again.")) { localStorage.removeItem(STORE); renderGate(); }
      };
    } else {
      const g = guessRepo();
      $("#gate").innerHTML = `
        <h2>Set up editing</h2>
        <p>Your edits are saved straight to your GitHub repo, so only you — with your GitHub token — can change the site.
          You'll do this once; after that, just your password.</p>
        <form id="setupForm">
          <div class="row">
            <label class="field"><span>GitHub user</span><input type="text" id="g-owner" value="${esc(g.owner)}" autocomplete="username" required /></label>
            <label class="field"><span>Repository</span><input type="text" id="g-repo" value="${esc(g.repo)}" autocomplete="off" required /></label>
            <label class="field"><span>Branch</span><input type="text" id="g-branch" value="${esc(g.branch)}" autocomplete="off" required /></label>
          </div>
          <label class="field"><span>GitHub token</span><input type="password" id="g-token" autocomplete="off" required placeholder="github_pat_…" /></label>
          <details>
            <summary>How do I get a token?</summary>
            <ol>
              <li>Open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub → Fine-grained tokens → Generate new token</a>.</li>
              <li><b>Repository access</b>: Only select repositories → this site's repo.</li>
              <li><b>Permissions → Repository → Contents</b>: Read and write.</li>
              <li>Generate, copy, and paste it here.</li>
            </ol>
          </details>
          <div class="grid2">
            <label class="field"><span>Choose a password</span><input type="password" id="g-pw" autocomplete="new-password" minlength="6" required /></label>
            <label class="field"><span>Repeat it</span><input type="password" id="g-pw2" autocomplete="new-password" minlength="6" required /></label>
          </div>
          <small style="color:var(--soft)">The token is encrypted with this password and stored only in this browser.</small>
          <div class="actions">
            <button class="primary" type="submit">Connect</button>
            <button class="link" type="button" id="g-local">Edit locally instead (download the file)</button>
          </div>
          <div class="err" id="g-err">${msg}</div>
        </form>`;
      $("#setupForm").onsubmit = async (e) => {
        e.preventDefault();
        if ($("#g-pw").value !== $("#g-pw2").value) { $("#g-err").textContent = "The passwords don't match."; return; }
        S.cfg = { owner: $("#g-owner").value.trim(), repo: $("#g-repo").value.trim(), branch: $("#g-branch").value.trim() || "main" };
        S.token = $("#g-token").value.trim();
        $("#g-err").textContent = "Connecting…";
        const ok = await connect(true);
        if (ok) {
          const box = await seal($("#g-pw").value, S.token);
          localStorage.setItem(STORE, JSON.stringify({ v: 1, ...S.cfg, ...box }));
        }
      };
    }
    $("#g-local").onclick = startLocal;
  }

  async function connect(fromSetup = false) {
    try {
      await loadGitHub();
    } catch (e) {
      const m = explain(e);
      if (fromSetup) $("#g-err").innerHTML = m; else renderGate(m);
      S.token = fromSetup ? S.token : null;
      return false;
    }
    S.mode = "github";
    startEditor();
    status(`Connected to ${esc(S.cfg.owner)}/${esc(S.cfg.repo)}`, "ok");
    return true;
  }

  async function startLocal() {
    try {
      const res = await fetch(`${DATA_PATH}?v=${Date.now()}`, { cache: "no-store" });
      S.data = await res.json();
    } catch {
      $("#g-err").textContent = `Couldn't read ${DATA_PATH}. Open this page through a web server.`;
      return;
    }
    S.mode = "local";
    startEditor();
    status("Local mode — changes are downloaded as data.json");
  }

  /* ---------- editor shell ---------- */
  function startEditor() {
    $("#gate").hidden = true;
    $("#editor").hidden = false;
    $("#save").hidden = false;
    $("#lock").hidden = S.mode !== "github";
    $("#save").textContent = S.mode === "github" ? "Save" : "Download data.json";
    setDirty(false);
    if (!S.data.experience && (S.data.professional || S.data.timeline)) S.data.experience = (S.data.professional || S.data.timeline).map((x) => ({ kind: "professional", ...x }));
    delete S.data.timeline; delete S.data.professional;
    S.data.publications ||= []; S.data.projects ||= []; S.data.posts ||= []; S.data.education ||= []; S.data.experience ||= [];
    S.data.awards ||= []; S.data.news ||= []; S.data.contact ||= {}; S.data.profile ||= {};
    renderTabs();
    renderPanel();
  }

  // Only fields the site shows are offered here. Keys the site no longer uses (projects, skills,
  // a paper's "selected" flag, BibTeX, ...) stay in data.json untouched.
  const LINKS_PUB = [["pdf", "PDF"], ["arxiv", "arXiv"], ["doi", "DOI"], ["code", "Code"], ["project", "Project page"], ["video", "Video"], ["slides", "Slides"], ["poster", "Poster"]];
  const SECTIONS = [
    { key: "profile", label: "Profile", kind: "object", hint: "The top of the home page: your name, one line under it, and the bio.", fields: [
      { k: "name", label: "Full name" },
      { k: "oneLiner", label: "One line under your name" },
      { k: "bio", label: "Bio", type: "textarea" },
      { k: "$me", label: "Your name in author lists", help: "Set in bold on your papers" },
    ] },
    { key: "news", label: "News", kind: "list", hint: "Newest first. Every item is shown.", title: (n) => n.text || "New item", meta: (n) => n.when || "",
      blank: () => ({ when: "", kind: "paper", text: "" }),
      fields: [{ k: "when", label: "When", help: "e.g. 2026.03" }, { k: "text", label: "News", type: "textarea", small: true }] },
    { key: "publications", label: "Papers", kind: "list", rich: true, links: LINKS_PUB, hint: "Grouped by year on the site, newest year first; within a year, in this order. A reader can open the abstract and the figure under each paper.",
      title: (p) => p.title || "Untitled paper", meta: (p) => [p.venue, p.status === "accepted" ? "accepted" : ""].filter(Boolean).join(" · "),
      blank: () => ({ id: "", title: "", authors: S.data.me ? [S.data.me] : [], venue: "", year: new Date().getFullYear(), type: "conference", badge: "", selected: false, links: {}, bibtex: "", cover: "", images: [], body: "" }),
      fields: [
        { k: "title", label: "Title" },
        { k: "authors", label: "Authors", type: "tags", help: "Comma-separated, in order" },
        { row: [{ k: "venue", label: "Venue", help: "e.g. CVPR 2026" }, { k: "year", label: "Year", type: "number" }] },
        { row: [{ k: "status", label: "Status", type: "select", options: ["published", "accepted"] }, { k: "badge", label: "Badge", help: "e.g. Oral, Best Paper" }] },
        { k: "links", type: "links" },
      ] },
    { key: "posts", label: "Blog", kind: "list", hint: "The list on the home page and on blog/. A post itself is a folder under blog/ in the repo: add the folder first, then list it here.",
      title: (p) => p.title || "Untitled post", meta: (p) => [p.date, p.url].filter(Boolean).join(" · "),
      blank: () => ({ title: "", date: new Date().toISOString().slice(0, 10), url: "blog/", summary: "" }),
      fields: [
        { k: "title", label: "Title" },
        { row: [{ k: "date", label: "Date", help: "YYYY-MM-DD" }, { k: "url", label: "Address", help: "e.g. blog/my-post/" }] },
        { k: "summary", label: "One-line summary", type: "textarea", small: true },
      ] },
    { key: "education", label: "Education", kind: "list", hint: "Newest first.", title: (t) => t.what || "New degree", meta: (t) => [t.when, t.where].filter(Boolean).join(" · "),
      blank: () => ({ when: "", what: "", where: "", detail: "" }),
      fields: [{ row3: [{ k: "when", label: "When", help: "e.g. 2023 – Present" }, { k: "what", label: "Degree", help: "e.g. Ph.D. in Computer Science" }, { k: "where", label: "School" }] },
        { k: "detail", label: "Detail (optional)", type: "textarea", small: true, help: "One line per point, e.g. advisor, thesis, GPA" }] },
    { key: "experience", label: "Experience", kind: "list", hint: "Grouped into Research, Teaching and Service on the site (Professional too, if you add any). Newest first.",
      title: (t) => t.what || "New position", meta: (t) => [t.kind, t.when, t.where].filter(Boolean).join(" · "),
      blank: () => ({ kind: "research", when: "", what: "", where: "", detail: "" }),
      fields: [{ row: [{ k: "kind", label: "Type", type: "select", options: ["research", "teaching", "service", "professional"] }, { k: "when", label: "When", help: "e.g. Mar 2025 – Present" }] },
        { row: [{ k: "what", label: "Role / course" }, { k: "where", label: "Organization" }] },
        { k: "detail", label: "Detail (optional)", type: "textarea", small: true, help: "What you worked on, one line per point" }] },
    { key: "awards", label: "Awards", kind: "list", hint: "Awards first, then scholarships. Newest first.", title: (t) => t.what || "New award", meta: (t) => [t.kind, t.when, t.where].filter(Boolean).join(" · "),
      blank: () => ({ kind: "award", when: "", what: "", where: "" }),
      fields: [{ row: [{ k: "kind", label: "Type", type: "select", options: ["award", "scholarship"] }, { k: "when", label: "When" }] }, { row: [{ k: "what", label: "Award" }, { k: "where", label: "From", help: "Left out on the site if the award's name already says it" }] }] },
    { key: "contact", label: "Contact", kind: "object", hint: "Shown under your bio. Empty fields are left out.", fields: [
      { k: "email", label: "Email" }, { k: "linkedin", label: "LinkedIn URL" },
      { k: "github", label: "GitHub URL" }, { k: "scholar", label: "Google Scholar URL" },
      { k: "cv", label: "CV (PDF)", type: "cv" },
    ] },
  ];
  const sec = () => SECTIONS.find((s) => s.key === S.tab);

  function renderTabs() {
    $("#tabs").innerHTML = SECTIONS.map((s) => `<button data-tab="${s.key}" aria-current="${s.key === S.tab}">${s.label}${s.kind === "list" ? ` <small>${(S.data[s.key] || []).length}</small>` : ""}</button>`).join("");
  }

  /* ---------- fields ---------- */
  const valueOf = (obj, k) => (k === "$me" ? S.data.me || "" : obj[k]);
  function fieldHTML(f, obj, sectionDef) {
    if (f.row || f.row3) return `<div class="${f.row ? "grid2" : "grid3"}">${(f.row || f.row3).map((x) => fieldHTML(x, obj, sectionDef)).join("")}</div>`;
    const v = valueOf(obj, f.k);
    const help = f.help ? `<small>${esc(f.help)}</small>` : "";
    switch (f.type) {
      case "textarea":
        return `<label class="field"><span>${esc(f.label)}</span><textarea data-k="${f.k}" ${f.small ? 'style="min-height:60px"' : ""}>${esc(v || "")}</textarea>${help}</label>`;
      case "tags":
        return `<label class="field"><span>${esc(f.label)}</span><input type="text" data-k="${f.k}" data-t="tags" value="${esc((v || []).join(", "))}" />${help}</label>`;
      case "number":
        return `<label class="field"><span>${esc(f.label)}</span><input type="number" data-k="${f.k}" data-t="number" value="${esc(v ?? "")}" ${f.min ? `min="${f.min}"` : ""} ${f.max ? `max="${f.max}"` : ""} />${help}</label>`;
      case "select":
        return `<label class="field"><span>${esc(f.label)}</span><select data-k="${f.k}">${f.options.map((o) => `<option ${o === v ? "selected" : ""}>${o}</option>`).join("")}</select>${help}</label>`;
      case "check":
        return `<label class="check" style="margin-top:26px"><input type="checkbox" data-k="${f.k}" data-t="check" ${v ? "checked" : ""} /> ${esc(f.label)}</label>`;
      case "links":
        return `<fieldset><legend>Links</legend><div class="grid2">${sectionDef.links.map(([lk, ll]) =>
          `<label class="field"><span>${ll}</span><input type="url" data-k="links.${lk}" value="${esc((obj.links || {})[lk] || "")}" placeholder="https://…" /></label>`).join("")}</div></fieldset>`;
      case "cv":
        return `<label class="field"><span>${esc(f.label)}</span>
          <div style="display:flex;gap:8px"><input type="text" data-k="cv" value="${esc(v || "")}" placeholder="content/cv.pdf or https://…" />
          <button type="button" class="btn small" data-act="cv-upload" style="white-space:nowrap">Upload PDF</button></div>
          <small>Linked as “CV (PDF)” under your bio. The menu's CV link always opens content/cv.pdf, which Upload PDF replaces.${v ? ` <a href="${esc(v)}" target="_blank" rel="noopener">Open current CV</a>` : ""}</small></label>`;
      default:
        return `<label class="field"><span>${esc(f.label)}</span><input type="text" data-k="${f.k}" value="${esc(v ?? "")}" />${help}</label>`;
    }
  }
  function readInput(el, target) {
    const k = el.dataset.k, t = el.dataset.t;
    let v = t === "check" ? el.checked : el.value;
    if (t === "tags") v = el.value.split(",").map((x) => x.trim()).filter(Boolean);
    if (t === "number") v = el.value === "" ? "" : Number(el.value);
    if (k === "$me") S.data.me = v;
    else if (k.startsWith("links.")) { target.links ||= {}; const lk = k.slice(6); if (v) target.links[lk] = v; else delete target.links[lk]; }
    else target[k] = v;
  }

  /* ---------- panels ---------- */
  function renderPanel() {
    const s = sec();
    if (s.kind === "object") {
      const obj = S.data[s.key];
      $("#panel").innerHTML = `<h2>${s.label}</h2><p class="hint">${s.hint}</p><form data-target="object" onsubmit="return false">${s.fields.map((f) => fieldHTML(f, obj, s)).join("")}</form>`;
      return;
    }
    if (S.edit && S.edit.section === s.key) return renderItem();
    const list = S.data[s.key];
    $("#panel").innerHTML = `
      <div class="panel-head"><h2>${s.label}</h2><span class="spacer"></span><button class="btn" data-act="add">+ Add</button></div>
      <p class="hint">${s.hint}</p>
      ${list.length ? `<ul class="items">${list.map((it, i) => `
        <li>
          ${s.rich ? (it.cover ? `<img class="thumb" src="${esc(src(it.cover))}" alt="">` : `<span class="thumb"></span>`) : ""}
          <div class="txt"><div class="t">${esc(s.title(it))}</div><div class="m">${esc(s.meta(it) || "")}</div></div>
          <div class="acts">
            <button class="btn small" data-act="edit" data-i="${i}">Edit</button>
            <button class="btn small" data-act="up" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="Move up">↑</button>
            <button class="btn small" data-act="down" data-i="${i}" ${i === list.length - 1 ? "disabled" : ""} aria-label="Move down">↓</button>
            <button class="btn small danger" data-act="del" data-i="${i}">Delete</button>
          </div>
        </li>`).join("")}</ul>` : `<p class="empty">Nothing here yet.</p>`}`;
  }

  const src = (p) => S.blobs[p] || p;
  function renderItem() {
    const s = sec(), it = S.data[s.key][S.edit.i];
    if (!it) { S.edit = null; return renderPanel(); }
    $("#panel").innerHTML = `
      <div class="panel-head">
        <button class="btn small" data-act="back">← ${s.label}</button>
        <h2 style="font-size:19px">${esc(s.title(it))}</h2><span class="spacer"></span>
        <button class="btn small danger" data-act="del" data-i="${S.edit.i}">Delete</button>
      </div>
      <form data-target="item" onsubmit="return false">${s.fields.map((f) => fieldHTML(f, it, s)).join("")}</form>
      ${s.rich ? richHTML(it) : ""}`;
  }

  // a paper's figure and abstract: the site shows the cover image and the text under "## Abstract"
  function richHTML(it) {
    return `
      <fieldset><legend>Figure</legend>
        <div class="imgs" id="imgs">${imagesHTML(it)}</div>
        <small style="color:var(--soft);display:block;margin-bottom:10px">The cover is shown above the abstract when a reader opens it. ${S.mode === "github" ? "Photos are resized and saved to your repo right away. Drop files here or click +." : "Connect GitHub to upload photos."}</small>
      </fieldset>
      <fieldset><legend>Abstract</legend>
        <textarea class="md-area" data-k="body" placeholder="## Abstract&#10;Paste the abstract here. A blank line starts a new paragraph.">${esc(it.body || "")}</textarea>
        <small style="color:var(--soft);display:block;margin-top:6px">The site shows the text under the “## Abstract” heading (all of it if there is no heading) as plain paragraphs.</small>
      </fieldset>`;
  }
  function imagesHTML(it) {
    const imgs = it.images || [];
    return imgs.map((p, k) => `
      <div class="img">
        ${p === it.cover ? `<span class="badge">Cover</span>` : ""}
        <img src="${esc(src(p))}" alt="" />
        <div class="row">
          ${p === it.cover ? `<button type="button" class="btn small" data-img="uncover" data-k="${k}">Uncover</button>` : `<button type="button" class="btn small" data-img="cover" data-k="${k}">Cover</button>`}
          <button type="button" class="btn small danger" data-img="remove" data-k="${k}">✕</button>
        </div>
      </div>`).join("") + `<div class="img up" data-img="add" role="button" tabindex="0">+ Add photos</div>`;
  }

  /* ---------- photos ---------- */
  async function resize(file) {
    if (/gif|svg/.test(file.type)) return { blob: file, ext: file.type.includes("svg") ? "svg" : "gif" };
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.86));
    return { blob, ext: "jpg" };
  }
  async function addPhotos(files) {
    const it = currentItem();
    if (!it) return;
    if (S.mode !== "github") { alert("Photo upload needs GitHub mode (unlock with your token)."); return; }
    const base = slug(it.id || it.title) || "photo";
    let n = 0;
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      status(`Uploading photo ${++n} of ${files.length}…`);
      try {
        const { blob, ext } = await resize(file);
        const path = `${IMG_DIR}/${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}.${ext}`;
        await putFile(path, bytesToB64(new Uint8Array(await blob.arrayBuffer())), `Add photo for ${it.title || base}`);
        S.blobs[path] = URL.createObjectURL(blob);
        it.images ||= [];
        it.images.push(path);
        if (!it.cover) it.cover = path;
        setDirty();
        $("#imgs") && ($("#imgs").innerHTML = imagesHTML(it));
      } catch (e) {
        status(`Upload failed: ${explain(e)}`, "err");
        return;
      }
    }
    status(`Uploaded ${n} photo${n === 1 ? "" : "s"} — click Save to publish`, "ok");
  }
  const currentItem = () => (S.edit ? S.data[S.edit.section][S.edit.i] : null);

  /* ---------- events ---------- */
  $("#tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    S.tab = b.dataset.tab;
    S.edit = null;
    renderTabs();
    renderPanel();
  });

  $("#panel").addEventListener("input", (e) => {
    const el = e.target.closest("[data-k]");
    if (!el) return;
    const s = sec();
    const target = S.edit ? currentItem() : S.data[s.key];
    readInput(el, target);
    setDirty();
    if (el.dataset.k === "title" && S.edit) $(".panel-head h2").textContent = s.title(target);
  });

  $("#panel").addEventListener("click", (e) => {
    const s = sec();
    const a = e.target.closest("[data-act]");
    if (a) {
      const list = S.data[s.key], i = +a.dataset.i;
      switch (a.dataset.act) {
        case "add": list.unshift(s.blank()); S.edit = { section: s.key, i: 0 }; setDirty(); renderTabs(); return renderItem();
        case "edit": S.edit = { section: s.key, i }; return renderItem();
        case "back": S.edit = null; return renderPanel();
        case "cv-upload": return $("#pdfPicker").click();
        case "up": [list[i - 1], list[i]] = [list[i], list[i - 1]]; setDirty(); return renderPanel();
        case "down": [list[i + 1], list[i]] = [list[i], list[i + 1]]; setDirty(); return renderPanel();
        case "del":
          if (!confirm(`Delete “${s.title(list[i])}”?`)) return;
          list.splice(i, 1); S.edit = null; setDirty(); renderTabs(); return renderPanel();
      }
    }
    const im = e.target.closest("[data-img]");
    if (im) {
      const it = currentItem(), k = +im.dataset.k;
      switch (im.dataset.img) {
        case "add": return $("#filePicker").click();
        case "cover": it.cover = it.images[k]; break;
        case "uncover": it.cover = ""; break;
        case "remove":
          if (!confirm("Remove this photo from the page? (The file stays in your repo.)")) return;
          if (it.cover === it.images[k]) it.cover = "";
          it.images.splice(k, 1);
          break;
      }
      setDirty();
      $("#imgs").innerHTML = imagesHTML(it);
    }
  });
  $("#panel").addEventListener("keydown", (e) => {
    if (e.target.matches('[data-img="add"]') && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); $("#filePicker").click(); }
  });
  $("#panel").addEventListener("dragover", (e) => { if (e.target.closest("#imgs")) { e.preventDefault(); $("#imgs").classList.add("drop"); } });
  $("#panel").addEventListener("dragleave", (e) => { if (e.target.closest("#imgs")) $("#imgs").classList.remove("drop"); });
  $("#panel").addEventListener("drop", (e) => {
    if (!e.target.closest("#imgs")) return;
    e.preventDefault();
    $("#imgs").classList.remove("drop");
    addPhotos([...e.dataTransfer.files]);
  });
  $("#filePicker").addEventListener("change", async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    await addPhotos(files);
  });

  $("#pdfPicker").addEventListener("change", (e) => { const f = e.target.files[0]; e.target.value = ""; uploadCV(f); });

  // every paper keeps a unique id (older pages linked to them; the editor still fills them in)
  function tidy() {
    ["publications", "projects"].forEach((k) => {
      const seen = new Set();
      S.data[k].forEach((it) => {
        let id = slug(it.id || it.title) || "item";
        while (seen.has(id)) id += "-2";
        seen.add(id);
        it.id = id;
      });
    });
  }
  async function save() {
    if (!S.dirty) return;
    tidy();
    if (S.mode === "local") {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S.data, null, 2) + "\n"], { type: "application/json" }));
      a.download = "data.json";
      a.click();
      setDirty(false);
      status("Downloaded. Replace content/data.json in your repo with it.", "ok");
      return;
    }
    $("#save").disabled = true;
    status("Saving…");
    try {
      await saveGitHub();
      setDirty(false);
      status(`Saved ✓ — the site updates in about a minute. <a href="./" target="_blank">View</a>`, "ok");
    } catch (e) {
      $("#save").disabled = false;
      status(explain(e), "err");
    }
    if (S.edit) renderItem(); else renderPanel();
  }
  $("#save").addEventListener("click", save);
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && S.data) { e.preventDefault(); save(); }
  });
  $("#lock").addEventListener("click", () => {
    if (S.dirty && !confirm("You have unsaved changes. Lock anyway?")) return;
    S.data = null; S.edit = null;
    renderGate();
  });
  window.addEventListener("beforeunload", (e) => { if (S.dirty) { e.preventDefault(); e.returnValue = ""; } });

  renderGate();
})();
