/* Joystick figure for the post (three.js r128, vendored in vendor/three.min.js and loaded from here, so the page needs no other tag).
   #joystick-demo  the reader drives the robot with two sticks, as on a gamepad: the left one sets forward and sideways velocity, the right one
                   (left-right only) sets the turning rate; both work at once (two fingers, or keys). Every input is
                   snapped to the nearest command of the grid the clips were recorded on. The robot plays the 1 s clip of that command in a loop,
                   and its trunk moves with the velocity MEASURED in that clip.
   The 3D look (lights, floor, grid, fog, Go1 bodies, velocity arrow) is the one of the replay on the SW-Lab page.
   Data: data/joystick_lib.json next to this script. */
(() => {
  "use strict";
  const BASE = new URL(".", (document.currentScript && document.currentScript.src) || location.href).href;
  const GREEN = 0x118659, DGREEN = 0x0b5e3f, DARK = 0x333333, BG = 0xfbfcfc;
  const FADE = 0.1, TRAIL = 5, SAMPLE = 0.04, FAR = 150;   // TRAIL: seconds of the robot's path drawn behind it

  const el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else e.setAttribute(k, v);
    }
    for (const c of kids) if (c != null) e.append(c);
    return e;
  };
  const getJSON = url => fetch(url).then(r => { if (!r.ok) throw new Error(r.status + " " + url); return r.json(); });
  const sgn = (v, d = 2) => { const s = Math.abs(v).toFixed(d); return (+s === 0 ? " " : v < 0 ? "−" : "+") + s; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const nearestIdx = (arr, v) => { let b = 0; for (let i = 1; i < arr.length; i++) if (Math.abs(arr[i] - v) < Math.abs(arr[b] - v)) b = i; return b; };
  let threeP = null;
  const loadThree = () => threeP || (threeP = new Promise((res, rej) => {
    if (window.THREE) { res(window.THREE); return; }
    const s = document.createElement("script");
    s.src = BASE + "vendor/three.min.js"; s.async = true;
    s.onload = () => (window.THREE ? res(window.THREE) : rej(new Error("three.js")));
    s.onerror = () => rej(new Error("three.js"));
    document.head.appendChild(s);
  }));
  let uid = 0;

  function joystickDemo(root) {
    root.classList.add("jd");
    const id = "jd" + (++uid);
    const reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

    // ---- DOM: the 3D view, one row of controls, a one-line readout of the measured velocity, one line about the keys ----
    const msg = el("div", {class: "jd-msg", text: "Loading…"});
    const fallNote = el("div", {class: "jd-fall", hidden: ""}, "This command makes it fall; the robot stands still.");
    const stage = el("div", {class: "jd-stage"}, fallNote, msg);

    const ticks = el("span", {class: "jd-ticks", "aria-hidden": "true"});
    const knob = el("span", {class: "jd-knob"});
    const pad = el("div", {class: "jd-pad", tabindex: "0", role: "group", "aria-roledescription": "joystick", "aria-label": "Move stick: forward, back and sideways", "aria-describedby": id + "-keys"}, ticks, knob);
    const tTicks = el("span", {class: "jd-ticks", "aria-hidden": "true"});
    const tKnob = el("span", {class: "jd-knob"});
    const track = el("div", {class: "jd-track", tabindex: "0", role: "slider", "aria-label": "Turn stick", "aria-orientation": "horizontal",
      "aria-valuemin": "0", "aria-valuemax": "4", "aria-valuenow": "2", "aria-describedby": id + "-keys"}, tTicks, tKnob);
    const stopB = el("button", {type: "button", class: "jd-stop", text: "Stop"});
    const ctl = el("div", {class: "jd-ctl"},
      el("div", {class: "jd-stick"}, pad, el("div", {class: "jd-name", "aria-hidden": "true", text: "Move"})),
      el("div", {class: "jd-stick jd-turn"}, track, el("div", {class: "jd-name", "aria-hidden": "true"}, el("span", {text: "↺"}), el("span", {text: "Turn"}), el("span", {text: "↻"}))),
      stopB);

    const cells = {meas: []};
    const WORDS = [["forward", "m/s"], ["sideways", "m/s"], ["turn", "rad/s"]];
    const line = (k, label) => el("div", {class: "jd-row jd-" + k}, el("span", {class: "jd-lab", text: label}),
      ...WORDS.map(([w, u]) => { const b = el("b", {text: " 0.00"}); cells[k].push(b); return el("span", {}, el("span", {class: "jd-w", text: w + " "}), b, el("span", {class: "jd-u", text: " " + u})); }));
    const readout = el("div", {class: "jd-read", "aria-hidden": "true"},
      el("div", {class: "jd-row jd-head"}, el("span"), ...WORDS.map(([w, u]) => el("span", {text: w + " " + u}))),
      line("meas", "measured"));
    const keys = el("p", {class: "jd-keys", id: id + "-keys", text: "Keys: W A S D move, Q E turn, Space stops"});
    const live = el("p", {class: "jd-live", "aria-live": "polite"});
    // the sparse circuit under the 3D view (its data loads only when the figure comes near the viewport)
    const circCv = el("canvas", {class: "jd-circ-cv", role: "img",
      "aria-label": "The robot's neural network, layers of 56, 512, 256, 128 and 12 units from left to right. Only the non-zero weights are drawn; they light up with the network's activity as the robot walks."});
    const circCap = el("p", {class: "jd-circ-cap"});
    const circ = el("div", {class: "jd-circ"}, circCv, circCap);
    root.replaceChildren(stage, circ, ctl, readout, keys, live);

    // ---- state ----
    const S = {L: null, ix: -1, iy: -1, iw: -1, cmd: [0, 0, 0], fell: false, prev: null, cur: null, w: 1, phase: 0, time: 0, acc: 0,
      x: 0, y: 0, yaw: 0, trail: [[0, 0]], azOff: 0, camT: null, camS: 1,
      visible: true, running: false, held: reduce, dragMove: false, dragTurn: false};
    root._jd = S;   // handle for tests and for the curious reader's console

    Promise.all([getJSON(BASE + "data/joystick_lib.json"), loadThree()]).then(([L, THREE]) => init(L, THREE))
      .catch(() => { msg.textContent = "Could not load the 3D view. Reload the page to try again."; });

    // the circuit's data: fetched once the figure is near the viewport; if anything fails, the strip goes away quietly
    let circAsked = false;
    const loadCirc = () => {
      if (circAsked) return; circAsked = true;
      const bin = fetch(BASE + "data/joystick_act.json").then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(j => { const t = atob(j.b64), u = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u.buffer; });
      Promise.all([getJSON(BASE + "data/joystick_net.json"), bin]).then(([N, buf]) => {
        S.circ = sparseCircuit(circCv, circCap, N, new Uint8Array(buf), S);
        if (S.draw && !S.running) S.draw();
      }).catch(() => { S.circ = null; circ.hidden = true; });
    };
    if (window.IntersectionObserver) {
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); loadCirc(); } }, {rootMargin: "800px 0px"});
      io.observe(root);
    } else loadCirc();

    function init(L, T3) {
      S.L = L;
      const G = L.grid, NB = L.names.length, par = L.parents, dt = L.dt;
      const rootIdx = Math.max(0, par.indexOf(-1));
      const kids = par.map(() => []); par.forEach((p, i) => { if (p >= 0) kids[p].push(i); });
      const key = c => c.map(v => (+v).toFixed(2)).join(",");
      const byCmd = new Map(); L.clips.forEach(c => byCmd.set(key(c.cmd), c));
      const clipAt = (i, j, k) => byCmd.get(key([G.vx[i], G.vy[j], G.wz[k]])) || L.clips[(i * G.vy.length + j) * G.wz.length + k] || null;
      const i0 = nearestIdx(G.vx, 0), j0 = nearestIdx(G.vy, 0), k0 = nearestIdx(G.wz, 0);

      // standing pose: the mean over the zero command's clip, feet at their lowest
      const zc = [clipAt(i0, j0, k0), ...L.clips].find(c => c && !c.fell && c.frames && c.frames.length) || L.clips[0];
      const stand = new Array(3 * NB).fill(0);
      zc.frames.forEach(f => f.forEach((v, k) => { stand[k] += v / zc.frames.length; }));
      for (let b = 0; b < NB; b++) if (!kids[b].length) stand[3 * b + 2] = Math.min(...zc.frames.map(f => f[3 * b + 2]));
      const STILL = {frames: [stand], n: 1, meas: [0, 0, 0], ci: -1};
      const srcs = new Map();
      const srcOf = c => { if (!srcs.has(c)) srcs.set(c, {frames: c.frames, n: c.frames.length, meas: c.meas, ci: L.clips.indexOf(c)}); return srcs.get(c); };
      S.prev = S.cur = STILL;
      // the hips (children of the trunk) give the trunk its orientation: the library stores positions only
      const hips = kids[rootIdx], hx = b => stand[3 * b] - stand[3 * rootIdx], hy = b => stand[3 * b + 1] - stand[3 * rootIdx + 1];
      const front = hips.filter(b => hx(b) > 0), rear = hips.filter(b => hx(b) < 0), leftH = hips.filter(b => hy(b) > 0), rightH = hips.filter(b => hy(b) < 0);
      const orientable = front.length && rear.length && leftH.length && rightH.length;

      // ---- the 3D scene, as on the SW-Lab page ----
      let renderer;
      try { renderer = new T3.WebGLRenderer({antialias: true}); } catch (e) { msg.textContent = "This browser cannot show the 3D view (WebGL is off)."; return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.5 : 2));
      renderer.setClearColor(BG); renderer.shadowMap.enabled = true;
      const cv = renderer.domElement;
      cv.setAttribute("role", "img");
      cv.setAttribute("aria-label", "3D view of the robot walking with your command");
      stage.prepend(cv);
      const scene = new T3.Scene(); scene.fog = new T3.Fog(BG, 12, 30);
      const camera = new T3.PerspectiveCamera(38, 1, 0.05, 200);
      scene.add(new T3.HemisphereLight(0xffffff, 0xdfe5e2, 0.85));
      const sun = new T3.DirectionalLight(0xffffff, 0.75); sun.position.set(-4, 10, 6); sun.castShadow = true;
      const smap = window.innerWidth < 640 ? 1024 : 2048; sun.shadow.mapSize.set(smap, smap);
      Object.assign(sun.shadow.camera, {left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40}); scene.add(sun, sun.target);
      const floor = new T3.Mesh(new T3.PlaneGeometry(400, 400), new T3.MeshStandardMaterial({color: 0xf4f6f5, roughness: 1, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1}));   // pushed back in depth, so the grid 1 mm above never sinks into it
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
      // the page's 1 m grid (GridHelper colours), cut into 1 m pieces: some GPUs drop very long lines that cross the view.
      // It follows the robot by whole metres, which looks the same (past 30 m the fog hides everything).
      const RG = 36, gp = [];
      for (let a = -RG; a <= RG; a++) for (let b = -RG; b < RG; b++) gp.push(a, 0, b, a, 0, b + 1, b, 0, a, b + 1, 0, a);
      const gg = new T3.BufferGeometry(); gg.setAttribute("position", new T3.Float32BufferAttribute(gp, 3));
      const grid = new T3.LineSegments(gg, new T3.LineBasicMaterial({color: 0xe6ebe8})); grid.position.y = 0.001; grid.frustumCulled = false; scene.add(grid);
      const world = new T3.Group(); world.rotation.x = -Math.PI / 2; scene.add(world);   // MuJoCo is z-up
      S.three = {scene, camera, renderer, floor, grid};

      // Go1: trunk box, a cylinder from each body to its parent, a dark sphere on each joint
      const mat = new T3.MeshStandardMaterial({color: GREEN, roughness: 0.5});
      const dark = new T3.MeshStandardMaterial({color: DARK, roughness: 0.6});
      const trunk = new T3.Mesh(new T3.BoxGeometry(0.38, 0.19, 0.11), mat); trunk.castShadow = true; world.add(trunk);
      const cylG = new T3.CylinderGeometry(0.022, 0.022, 1, 10), links = [], joints = [];
      for (let i = 0; i < NB; i++) {
        if (par[i] < 0) continue;
        const foot = /foot$/i.test(L.names[i] || "") || !kids[i].length;
        const cyl = new T3.Mesh(cylG, foot ? dark : mat); cyl.castShadow = true; world.add(cyl); links.push([i, par[i], cyl]);
        const sp = new T3.Mesh(new T3.SphereGeometry(foot ? 0.025 : 0.03, 12, 8), dark); sp.castShadow = true; world.add(sp); joints.push([i, sp]);
      }
      // the robot's path over the last TRAIL seconds (green), just above the grid
      const NPT = Math.ceil(TRAIL / SAMPLE) + 1;
      const pathGeo = new T3.BufferGeometry(); pathGeo.setAttribute("position", new T3.BufferAttribute(new Float32Array(3 * NPT), 3)); pathGeo.setDrawRange(0, 0);
      const path = new T3.Line(pathGeo, new T3.LineBasicMaterial({color: GREEN})); path.frustumCulled = false; world.add(path);
      const setPath = pts => {
        const a = pathGeo.attributes.position, n = Math.min(pts.length, NPT), o = pts.length - n;
        for (let k = 0; k < n; k++) a.setXYZ(k, pts[o + k][0], pts[o + k][1], 0.014);
        a.needsUpdate = true; pathGeo.setDrawRange(0, n);
      };
      // the measured velocity: a dark green arrow above the trunk
      const velA = new T3.ArrowHelper(new T3.Vector3(1, 0, 0), new T3.Vector3(), 0.3, DGREEN, 0.08, 0.05); world.add(velA);

      // ---- the Move stick: one faint tick per (forward, sideways) grid command, zero at the centre ----
      const step = 0.32 / Math.max(i0, G.vx.length - 1 - i0, j0, G.vy.length - 1 - j0, 1);
      const dotPos = (i, j) => [-(j - j0) * step, -(i - i0) * step];   // pad units, centre 0, edge ±0.5; left is +sideways
      const dotEls = [];
      for (let i = 0; i < G.vx.length; i++) for (let j = 0; j < G.vy.length; j++) {
        const [px, py] = dotPos(i, j), d = el("span", {class: "jd-tick" + (i === i0 && j === j0 ? " zero" : "")});
        d.style.left = (50 + 100 * px) + "%"; d.style.top = (50 + 100 * py) + "%"; ticks.append(d); dotEls.push({i, j, d});
      }
      const placeKnob = (px, py) => { knob.style.left = (50 + 100 * px) + "%"; knob.style.top = (50 + 100 * py) + "%"; };
      const snapPad = (px, py) => { let best = null, bd = 1e9; for (const o of dotEls) { const [qx, qy] = dotPos(o.i, o.j), dd = (qx - px) ** 2 + (qy - py) ** 2; if (dd < bd) { bd = dd; best = o; } } return best; };

      // ---- the Turn stick: one tick per turning command along a horizontal track; left end = turn left (+), right end = turn right (−) ----
      const NW = G.wz.length, TIN = 14;   // TIN: px from each end of the track to the outermost tick
      const turnPos = k => NW - 1 - k;
      const tLeft = f => `calc(${TIN}px + (100% - ${2 * TIN}px) * ${f.toFixed(4)})`;
      const tFrac = k => turnPos(k) / Math.max(1, NW - 1);
      G.wz.forEach((w, k) => { const d = el("span", {class: "jd-tick" + (k === k0 ? " zero" : "")}); d.style.left = tLeft(tFrac(k)); tTicks.append(d); });
      const placeTurn = f => { tKnob.style.left = tLeft(f); };
      track.setAttribute("aria-valuemax", String(NW - 1));
      const fmtTurn = w => Math.abs(w) < 1e-9 ? "straight" : (w > 0 ? "left " : "right ") + Math.abs(w).toFixed(1) + " rad/s";

      let draw = () => {};
      const setCmd = (ix, iy, iw, user = true) => {
        ix = clamp(ix, 0, G.vx.length - 1); iy = clamp(iy, 0, G.vy.length - 1); iw = clamp(iw, 0, NW - 1);
        if (!S.dragMove) placeKnob(...dotPos(ix, iy));
        if (!S.dragTurn) placeTurn(tFrac(iw));
        if (user && S.held) { S.held = false; wake(); }
        if (ix === S.ix && iy === S.iy && iw === S.iw) return;
        S.ix = ix; S.iy = iy; S.iw = iw; S.cmd = [G.vx[ix], G.vy[iy], G.wz[iw]];
        const c = clipAt(ix, iy, iw), next = !c || c.fell ? STILL : srcOf(c);
        S.fell = !c || !!c.fell; S.clip = c;
        if (next !== S.cur) { if (S.w >= 0.5) S.prev = S.cur; S.cur = next; S.w = 0; }
        track.setAttribute("aria-valuenow", String(turnPos(iw))); track.setAttribute("aria-valuetext", fmtTurn(S.cmd[2]));
        cells.meas.forEach((b, k) => { b.textContent = S.fell ? (k ? "" : " falls") : sgn(c.meas[k]); });
        fallNote.hidden = !S.fell;
        live.textContent = `Command: forward ${sgn(S.cmd[0])} m/s, sideways ${sgn(S.cmd[1])} m/s, turn ${sgn(S.cmd[2])} rad/s. ` +
          (S.fell ? (c ? "This command makes it fall, so the robot is kept standing still." : "No clip was recorded for this command; the robot stands still.")
            : `Measured: ${sgn(c.meas[0])} m/s, ${sgn(c.meas[1])} m/s, ${sgn(c.meas[2])} rad/s.`);
        if (!S.running) draw();
      };
      S.setCmd = setCmd;

      // ---- input: the two sticks; each follows its own pointer, so two fingers can drive both at once.
      //      A stick stays where it is let go (on the nearest command), it does not spring back. ----
      const padXY = e => { const r = pad.getBoundingClientRect(); let px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5; const m = Math.hypot(px, py); if (m > 0.4) { px *= 0.4 / m; py *= 0.4 / m; } return [px, py]; };
      const fromPad = e => { const [px, py] = padXY(e); placeKnob(px, py); const o = snapPad(px, py); setCmd(o.i, o.j, S.iw); };
      const fromTrack = e => { const r = track.getBoundingClientRect(), f = clamp((e.clientX - r.left - TIN) / Math.max(1, r.width - 2 * TIN), 0, 1); placeTurn(f); setCmd(S.ix, S.iy, NW - 1 - Math.round(f * (NW - 1))); };
      const bindStick = (box, flag, follow, settle) => {
        let pid = null;
        box.addEventListener("pointerdown", e => {
          if (pid !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
          pid = e.pointerId; S[flag] = true; box.classList.add("drag");
          try { box.setPointerCapture(pid); } catch (_) {}
          if (e.pointerType !== "mouse") e.preventDefault();   // a mouse press still focuses the stick (for the keys), without a focus ring
          follow(e);
        });
        box.addEventListener("pointermove", e => { if (e.pointerId === pid) follow(e); });
        const end = e => { if (e.pointerId !== pid) return; pid = null; S[flag] = false; box.classList.remove("drag"); settle(); };
        for (const t of ["pointerup", "pointercancel", "lostpointercapture"]) box.addEventListener(t, end);
      };
      bindStick(pad, "dragMove", fromPad, () => placeKnob(...dotPos(S.ix, S.iy)));
      bindStick(track, "dragTurn", fromTrack, () => placeTurn(tFrac(S.iw)));
      stopB.addEventListener("click", () => setCmd(i0, j0, k0));

      // ---- input: keys, while the figure has focus or the mouse is over it. Only with focus do these keys stop scrolling the page;
      //      a focused button keeps its own space and enter. ----
      const KEYS = {w: [1, 0, 0], ArrowUp: [1, 0, 0], s: [-1, 0, 0], ArrowDown: [-1, 0, 0], a: [0, 1, 0], d: [0, -1, 0],
        q: [0, 0, 1], ArrowLeft: [0, 0, 1], e: [0, 0, -1], ArrowRight: [0, 0, -1]};
      let hover = false;
      root.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") hover = true; });
      root.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") hover = false; });
      document.addEventListener("keydown", e => {
        if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
        const t = e.target, inside = root.contains(t);
        if (!inside && !(hover && (t === document.body || t === document.documentElement))) return;
        const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (inside && t.tagName === "BUTTON" && (k === " " || k === "Enter")) return;
        let next = null;
        if (k === " " || k === "Spacebar") next = [i0, j0, k0];
        else if (t === track && (k === "Home" || k === "End")) next = [S.ix, S.iy, k === "Home" ? NW - 1 : 0];
        else if (KEYS[k]) next = [S.ix + KEYS[k][0], S.iy + KEYS[k][1], S.iw + KEYS[k][2]];
        if (!next) return;
        if (inside) e.preventDefault();
        setCmd(...next);
      });

      // ---- input: drag the 3D view sideways to orbit (vertical swipes still scroll the page) ----
      let drag = null;
      cv.addEventListener("pointerdown", e => { drag = {x: e.clientX, off: S.azOff}; try { cv.setPointerCapture(e.pointerId); } catch (_) {} pad.focus({preventScroll: true}); });
      cv.addEventListener("pointermove", e => { if (!drag) return; S.azOff = drag.off - (e.clientX - drag.x) * 0.01; if (!S.running) draw(); });
      const endDrag = () => { drag = null; }; cv.addEventListener("pointerup", endDrag); cv.addEventListener("pointercancel", endDrag);

      // ---- simulation ----
      const local = new Float64Array(3 * NB), la = new Float64Array(3 * NB), lb = new Float64Array(3 * NB);
      const sample = (src, ph, out) => {
        const n = src.n, f = ((ph / dt) % n + n) % n, i = Math.floor(f) % n, a = f - Math.floor(f), A = src.frames[i], B = src.frames[(i + 1) % n];
        for (let k = 0; k < out.length; k++) out[k] = A[k] + (B[k] - A[k]) * a;
      };
      const vel = () => [0, 1, 2].map(k => S.prev.meas[k] + (S.cur.meas[k] - S.prev.meas[k]) * S.w);
      const move = (p, v, h) => { const ym = p.yaw + v[2] * h / 2; p.x += (v[0] * Math.cos(ym) - v[1] * Math.sin(ym)) * h; p.y += (v[0] * Math.sin(ym) + v[1] * Math.cos(ym)) * h; p.yaw += v[2] * h; };
      const recentre = () => {   // far from the start: shift everything back by whole metres, so the 1 m grid looks the same
        const dx = Math.round(S.x), dy = Math.round(S.y);
        S.x -= dx; S.y -= dy;
        for (const p of S.trail) { p[0] -= dx; p[1] -= dy; }
        if (S.camT) { S.camT.x -= dx; S.camT.z += dy; camera.position.x -= dx; camera.position.z += dy; }
      };
      const stepSim = h => {
        S.time += h; S.phase += h;
        if (S.w < 1) S.w = Math.min(1, S.w + h / FADE);
        move(S, vel(), h);
        S.acc += h;
        while (S.acc >= SAMPLE) { S.acc -= SAMPLE; S.trail.push([S.x, S.y]); }
        if (S.trail.length > NPT) S.trail.splice(0, S.trail.length - NPT);
        if (Math.abs(S.x) > FAR || Math.abs(S.y) > FAR) recentre();
      };
      const P = Array.from({length: NB}, () => new T3.Vector3());
      const pose = () => {
        sample(S.cur, S.phase, lb);
        if (S.w < 1) { sample(S.prev, S.phase, la); for (let k = 0; k < local.length; k++) local[k] = la[k] + (lb[k] - la[k]) * S.w; } else local.set(lb);
        const c = Math.cos(S.yaw), s = Math.sin(S.yaw);
        for (let b = 0; b < NB; b++) { const x = local[3 * b], y = local[3 * b + 1]; P[b].set(S.x + x * c - y * s, S.y + x * s + y * c, local[3 * b + 2]); }
      };
      const UP = new T3.Vector3(0, 1, 0), vA = new T3.Vector3(), vB = new T3.Vector3(), vF = new T3.Vector3(), vL = new T3.Vector3(), vU = new T3.Vector3(), M = new T3.Matrix4();
      const mean = (ids, out) => { out.set(0, 0, 0); ids.forEach(b => out.add(P[b])); return out.multiplyScalar(1 / ids.length); };
      const placeRobot = () => {
        pose();
        trunk.position.copy(P[rootIdx]);
        if (orientable) {
          vF.subVectors(mean(front, vA), mean(rear, vB)).normalize();
          vL.subVectors(mean(leftH, vA), mean(rightH, vB)); vL.addScaledVector(vF, -vL.dot(vF)).normalize();
          vU.crossVectors(vF, vL); M.makeBasis(vF, vL, vU); trunk.quaternion.setFromRotationMatrix(M);
        } else trunk.rotation.set(0, 0, S.yaw);
        for (const [a, b, cyl] of links) {
          vA.subVectors(P[b], P[a]); const len = vA.length();
          cyl.position.addVectors(P[a], P[b]).multiplyScalar(0.5); cyl.scale.set(1, Math.max(len, 1e-3), 1);
          if (len > 1e-6) cyl.quaternion.setFromUnitVectors(UP, vA.multiplyScalar(1 / len));
        }
        for (const [a, sp] of joints) sp.position.copy(P[a]);
      };

      // ---- camera: the page's view (from the side and a little behind, 38° lens), following the robot;
      //      a little farther back on a tall (phone) view ----
      const aim = new T3.Vector3(), want = new T3.Vector3();
      const camAt = (out, cx, cz, s) => {
        const ox = -1.2 * s, oz = 2.6 * s, c = Math.cos(S.azOff), sn = Math.sin(S.azOff);
        return out.set(cx + ox * c + oz * sn, 0.25 + 0.85 * s, cz - ox * sn + oz * c);
      };
      const frame = h => {
        aim.set(S.x, 0.25, -S.y);   // MuJoCo (x, y) is three.js (x, -z)
        const s = camera.aspect < 1.2 ? 0.95 : 0.8;
        const k = S.camT && h > 0 ? 1 - Math.exp(-h / 0.2) : 1;
        if (!S.camT) S.camT = aim.clone(); else S.camT.lerp(aim, k);
        S.camS += (s - S.camS) * k;
        camAt(want, S.camT.x, S.camT.z, S.camS);
        if (k === 1 || !S.camSet) { camera.position.copy(want); S.camSet = true; } else camera.position.lerp(want, k);
        camera.lookAt(S.camT);
        sun.position.set(S.camT.x - 4, 10, S.camT.z + 6); sun.target.position.set(S.camT.x, 0, S.camT.z);
      };

      const render = h => {
        placeRobot();
        setPath([...S.trail, [S.x, S.y]]);
        // the measured velocity, from above the trunk, in world axes
        const v = vel(), yw = S.yaw; vB.set(v[0] * Math.cos(yw) - v[1] * Math.sin(yw), v[0] * Math.sin(yw) + v[1] * Math.cos(yw), 0);
        const vl = vB.length(); velA.visible = vl > 0.05;
        if (velA.visible) { velA.position.set(P[rootIdx].x, P[rootIdx].y, P[rootIdx].z + 0.22); velA.setDirection(vB.multiplyScalar(1 / vl)); velA.setLength(0.12 + 0.35 * vl, 0.08, 0.05); }
        frame(h);
        grid.position.x = Math.round(S.camT.x); grid.position.z = Math.round(S.camT.z);
        renderer.render(scene, camera);
        if (S.circ) S.circ(h);   // the circuit shows the same clip and phase as the robot
      };

      // ---- size: the page's proportions (wider than tall; taller on a phone) ----
      let W = 0, H = 0;
      const resize = () => {
        const w = Math.round(stage.clientWidth); if (!w || w === W) return;
        W = w; H = Math.round(clamp(w * (w < 560 ? 0.72 : 0.56), 240, 430));
        renderer.setSize(W, H, false); cv.style.height = H + "px";
        camera.aspect = W / H; camera.updateProjectionMatrix();
        if (!S.running) draw();
      };
      draw = (h = 0) => { if (W) render(h); };
      S.draw = draw;

      // ---- loop: runs only while the figure is on screen and the tab is visible ----
      let last = 0, raf = 0;
      const loop = t => {
        raf = 0;
        if (!S.visible || document.hidden || S.held) { S.running = false; return; }
        const h = last ? Math.min(0.05, Math.max(0, (t - last) / 1000)) : 0; last = t;
        if (h > 0) stepSim(h);
        draw(h);
        raf = requestAnimationFrame(loop);
      };
      function wake() { if (S.visible && !document.hidden && !S.held && !raf) { S.running = true; last = 0; raf = requestAnimationFrame(loop); } }
      if (window.IntersectionObserver) new IntersectionObserver(es => { S.visible = es[es.length - 1].isIntersecting; wake(); }).observe(root);
      document.addEventListener("visibilitychange", wake);
      if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener("resize", resize);

      // start: walking forward at the slowest forward command that does not fall.
      // With reduced motion the robot stands still until the reader moves a stick.
      let start = i0;
      if (!reduce) for (let i = i0 + 1; i < G.vx.length; i++) { const c = clipAt(i, j0, k0); if (c && !c.fell) { start = i; break; } }
      setCmd(start, j0, k0, false); S.prev = S.cur; S.w = 1;
      msg.hidden = true; resize(); draw(); wake();
    }
  }

  /* The sparse circuit: the network's five layers from left to right. Every unit is a faint dot (a layer wider than ROWS units
     wraps into a block of columns, so its size shows as area); the units that touch a non-zero weight are darker dots; each
     non-zero weight is a thin curve. Live, a curve lights green with |w| x |activity of its source unit| (each curve normalised by
     its own largest value over the recorded clips) and a unit glows with its own |activity|.
     Data: data/joystick_net.json (layout, weights) and data/joystick_act.json (base64 of uint8 [clip][frame][unit], unit = |v| / scale x 255).
     The activity comes from a re-run of the same GPU simulation that made the frames in joystick_lib.json (make_lib_act.py): all 150 clips
     reproduce the published frames exactly (max position difference 0), so each frame shows the activity that produced that pose.
     Returns paint(h): draws the frame the robot is showing (S.prev, S.cur, S.w, S.phase); h = seconds since the last frame (0: no smoothing). */
  function sparseCircuit(cv, cap, N, A, S) {
    const ROWS = 64, NLEV = 7;
    const Ls = N.layers, NLY = Ls.length, sizes = N.sizes;
    const offs = Ls.map(l => l.unit_axis_offset), NU = offs[NLY - 1] + Ls[NLY - 1].used.length;
    const NF = 25, NC = Math.floor(A.length / (NF * NU));
    if (!NC || NC * NF * NU !== A.length) throw new Error("joystick_act.json");
    const ax = Ls.map((l, li) => { const m = new Map(); l.used.forEach((u, k) => m.set(u, offs[li] + k)); return m; });
    const layerOf = new Uint8Array(NU); Ls.forEach((l, li) => l.used.forEach((u, k) => { layerOf[offs[li] + k] = li; }));
    const wcls = a => a < 0.5 ? 0 : a < 2 ? 1 : 2;   // three line widths by |w|
    const E = [];
    for (const [l, s, d, v] of N.weights) {
      if (s < 0) continue;   // biases belong to their unit
      const a = ax[l - 1].get(s), b = ax[l].get(d);
      if (a != null && b != null) E.push([a, b, wcls(Math.abs(v))]);
    }
    const cols = sizes.map(n => Math.ceil(n / ROWS)), rows = sizes.map(n => Math.min(n, ROWS));

    // grid cell (column, row) of every unit: inputs in their display order (unused ones included), outputs in joint order;
    // in a hidden layer the used units keep their display order from top to bottom, spread over the block
    const cell = new Int16Array(2 * NU);
    Ls.forEach((l, li) => {
      if (cols[li] === 1) {
        const ord = l.all_order || l.used;
        l.used.forEach((u, k) => { cell[2 * (offs[li] + k)] = 0; cell[2 * (offs[li] + k) + 1] = Math.max(0, ord.indexOf(u)); });
        return;
      }
      const C = cols[li], R = rows[li], n = l.used.length, taken = new Uint8Array(C * R);
      l.used.forEach((u, k) => {
        const t = Math.min(R - 1, Math.floor((k + 0.5) * R / n)), pc = u % C;
        for (let dd = 0; dd < R; dd++) {
          let done = false;
          for (const r of dd ? [t - dd, t + dd] : [t]) {
            if (r < 0 || r >= R) continue;
            for (let j = 0; j < C && !done; j++) { const c = (pc + j) % C; if (!taken[r * C + c]) { taken[r * C + c] = 1; cell[2 * (offs[li] + k)] = c; cell[2 * (offs[li] + k) + 1] = r; done = true; } }
            if (done) break;
          }
          if (done) break;
        }
      });
    });

    const tot = N.totals || {}, fmt = v => Number(v).toLocaleString("en-US");
    const pct = tot.all ? (100 * tot.nonzero / tot.all).toFixed(2) + "%" : "";
    const num = t => el("span", {class: "jd-num", text: t});
    cap.replaceChildren(num(fmt(tot.nonzero)), " of ", num(fmt(tot.all)), " weights are non-zero (", num(pct), "). Only those are drawn, lit by the robot’s real activity.");

    // input group labels (only where they fit) and the layer sizes
    const SHORT = {"command": "command", "clock features": "clock", "gyro": "gyro", "joint angles": "joint angles", "joint velocities": "joint vel.",
      "last action": "last action", "linear velocity": "lin. vel.", "gravity": "gravity"};
    const inOrd = Ls[0].all_order || [];
    const groups = (N.input_groups || []).map(g => {
      const rs = []; for (let i = g.lo; i < g.hi; i++) { const r = inOrd.indexOf(i); if (r >= 0) rs.push(r); }
      return {name: SHORT[g.name] || g.name, used: g.used && g.used.length > 0, mid: rs.length ? (Math.min(...rs) + Math.max(...rs)) / 2 : -1};
    }).filter(g => g.mid >= 0).sort((a, b) => a.mid - b.mid);

    const ctx = cv.getContext("2d"), stat = document.createElement("canvas"), sx = stat.getContext("2d");
    const css = getComputedStyle(cv);
    const MONO = (css.getPropertyValue("--mono") || "").trim() || "\"JetBrains Mono\", ui-monospace, monospace";
    let W = 0, H = 0, dpr = 1, P = 3, R0 = 1.1, gut = 0, dens = 1, amax = 0.3;
    const X = new Float32Array(NU), Y = new Float32Array(NU), lx = [], top = [];
    const layout = () => {
      const narrow = W < 560;
      gut = narrow ? 0 : 78;
      const padT = 8, padB = 20, plotH = H - padT - padB;
      P = plotH / (ROWS - 1); R0 = narrow ? 1 : 1.15;
      const bw = cols.map(c => (c - 1) * P), L0 = gut + 4, R1 = W - 4;
      const gap = (R1 - L0 - bw.reduce((a, b) => a + b, 0)) / (NLY - 1);
      let x = L0;
      for (let li = 0; li < NLY; li++) { lx[li] = x; top[li] = padT + (plotH - (rows[li] - 1) * P) / 2; x += bw[li] + gap; }
      for (let u = 0; u < NU; u++) { const li = layerOf[u]; X[u] = lx[li] + cell[2 * u] * P; Y[u] = top[li] + cell[2 * u + 1] * P; }
    };
    const curve = (g, a, b) => { const x0 = X[a], y0 = Y[a], x1 = X[b], y1 = Y[b], m = (x1 - x0) * 0.5; g.moveTo(x0, y0); g.bezierCurveTo(x0 + m, y0, x1 - m, y1, x1, y1); };
    const WIDTH = [0.45, 0.8, 1.25], WGAIN = [0.5, 0.75, 1], LO = 0.4;   // LO: below this part of its range a source leaves its curves quiet

    const drawStatic = () => {
      stat.width = cv.width; stat.height = cv.height;
      sx.setTransform(dpr, 0, 0, dpr, 0, 0); sx.clearRect(0, 0, W, H);
      // every unit, used or not
      sx.fillStyle = "#d9d9d9";
      for (let li = 0; li < NLY; li++) for (let k = 0; k < sizes[li]; k++) {
        const c = Math.floor(k / rows[li]), r = k % rows[li];
        sx.fillRect(lx[li] + c * P - 0.75, top[li] + r * P - 0.75, 1.5, 1.5);
      }
      // the non-zero weights, quiet
      for (let w = 0; w < 3; w++) {
        sx.beginPath(); for (const e of E) if (e[2] === w) curve(sx, e[0], e[1]);
        sx.lineWidth = WIDTH[w]; sx.strokeStyle = `rgba(17,17,17,${(0.075 * dens).toFixed(3)})`; sx.stroke();
      }
      // the used units
      sx.fillStyle = "#8f8f8f"; sx.beginPath();
      for (let u = 0; u < NU; u++) { sx.moveTo(X[u] + R0, Y[u]); sx.arc(X[u], Y[u], R0, 0, 2 * Math.PI); }
      sx.fill();
      // labels
      sx.font = "400 10px " + MONO; sx.textBaseline = "alphabetic";
      sx.fillStyle = "#696969";
      for (let li = 0; li < NLY; li++) {
        const cx = lx[li] + (cols[li] - 1) * P / 2, t = String(sizes[li]), tw = sx.measureText(t).width;
        sx.fillText(t, clamp(cx - tw / 2, 0, W - tw), H - 4);
      }
      if (gut) {
        sx.textBaseline = "middle"; sx.textAlign = "right";
        let last = -1e9;
        for (const g of groups) {
          const y = top[0] + g.mid * P;
          if (y - last < 12.5) continue;
          sx.fillStyle = g.used ? "#696969" : "#a8a8a8"; sx.fillText(g.name, lx[0] - 8, y); last = y;
        }
        sx.textAlign = "left";
      }
    };

    const resize = () => {
      const w = Math.round(cv.parentNode.clientWidth); if (!w) return false;
      const h = w < 560 ? 210 : 260, d = Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.5 : 2);
      if (w === W && h === H && d === dpr) return false;
      W = w; H = h; dpr = d;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + "px";
      dens = Math.sqrt(Math.min(1, W / 600)); amax = 0.3 * dens;   // a narrow strip packs the same curves closer: draw them lighter
      layout(); drawStatic(); return true;
    };

    // activity of every unit in [0, 1], for a source (clip) at the robot's phase: frames interpolated as the robot's pose is
    const val = new Float32Array(NU), tmp = new Float32Array(NU), shown = new Float32Array(NU);
    const fill = (src, out) => {
      out.fill(0);
      if (!src || src.ci == null || src.ci < 0 || src.ci >= NC) return;
      const n = Math.min(src.n, NF), dt = (S.L && S.L.dt) || 0.04, f = ((S.phase / dt) % n + n) % n, i = Math.floor(f) % n, a = f - Math.floor(f);
      const o1 = (src.ci * NF + i) * NU, o2 = (src.ci * NF + (i + 1) % n) * NU;
      for (let u = 0; u < NU; u++) out[u] = (A[o1 + u] * (1 - a) + A[o2 + u] * a) / 255;
    };
    // each unit's own range over all recorded frames: a curve is lit by where its source unit is within that range,
    // so a unit that sits near the same value all the time (a saturated tanh) stays quiet and the changes show
    const qlo = new Float32Array(NU).fill(1), qhi = new Float32Array(NU);
    for (let o = 0; o < A.length; o += NU) for (let u = 0; u < NU; u++) { const q = A[o + u] / 255; if (q < qlo[u]) qlo[u] = q; if (q > qhi[u]) qhi[u] = q; }
    const qsp = qhi.map((h, u) => Math.max(h - qlo[u], 0.3));
    const bucketsE = Array.from({length: 3 * NLEV}, () => []), bucketsU = Array.from({length: NLEV}, () => []);
    let started = false;
    const paint = h => {
      if (!W) resize(); if (!W) return;
      fill(S.cur, val);
      if (S.w < 1) { fill(S.prev, tmp); for (let u = 0; u < NU; u++) val[u] = tmp[u] + (val[u] - tmp[u]) * S.w; }
      const k = started && h > 0 ? 1 - Math.exp(-h / 0.035) : 1; started = true;
      for (let u = 0; u < NU; u++) shown[u] += (val[u] - shown[u]) * k;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(stat, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const b of bucketsE) b.length = 0;
      for (const b of bucketsU) b.length = 0;
      for (let j = 0; j < E.length; j++) {
        const e = E[j], s = Math.max(0, ((shown[e[0]] - qlo[e[0]]) / qsp[e[0]] - LO) / (1 - LO)), v = s * s * WGAIN[e[2]], lv = Math.min(NLEV - 1, Math.floor(v * NLEV));
        if (lv > 0) bucketsE[e[2] * NLEV + lv].push(j);
      }
      for (let w = 0; w < 3; w++) for (let lv = 1; lv < NLEV; lv++) {
        const b = bucketsE[w * NLEV + lv]; if (!b.length) continue;
        ctx.beginPath(); for (const j of b) curve(ctx, E[j][0], E[j][1]);
        ctx.lineWidth = WIDTH[w]; ctx.strokeStyle = `rgba(17,134,89,${(amax * lv / (NLEV - 1)).toFixed(3)})`; ctx.stroke();
      }
      for (let u = 0; u < NU; u++) { const lv = Math.min(NLEV - 1, Math.floor(shown[u] * NLEV)); if (lv > 0) bucketsU[lv].push(u); }
      for (let lv = 1; lv < NLEV; lv++) {
        const b = bucketsU[lv]; if (!b.length) continue;
        ctx.beginPath(); for (const u of b) { ctx.moveTo(X[u] + R0 + 0.5, Y[u]); ctx.arc(X[u], Y[u], R0 + 0.5, 0, 2 * Math.PI); }
        ctx.fillStyle = `rgba(17,134,89,${(0.1 + 0.7 * lv / (NLEV - 1)).toFixed(3)})`; ctx.fill();
      }
    };

    const again = () => { if (resize() && S.draw && !S.running) S.draw(); };
    if (window.ResizeObserver) new ResizeObserver(again).observe(cv.parentNode); else window.addEventListener("resize", again);
    if (document.fonts && document.fonts.load) document.fonts.load("10px " + MONO).then(() => { if (W) { drawStatic(); if (S.draw && !S.running) S.draw(); } }).catch(() => {});
    return paint;
  }

  const start = () => { const r = document.getElementById("joystick-demo"); if (r) joystickDemo(r); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
