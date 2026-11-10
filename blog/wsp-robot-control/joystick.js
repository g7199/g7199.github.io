/* Joystick figure for the post (plain JavaScript, no libraries).
   #joystick-demo  the reader drives the robot: a stick sets forward and sideways velocity, a slider sets the turning rate, and every input is
                   snapped to the nearest command of the grid the clips were recorded on. The robot plays the 1 s clip of that command in a loop;
                   its trunk moves with the velocity MEASURED in that clip, and an orange ghost moves with the COMMANDED velocity from the same
                   start (reset onto the robot every 5 s), so the gap between the two is what the robot fails to follow.
   Data: data/joystick_lib.json next to this script. */
(() => {
  "use strict";
  const BASE = new URL(".", (document.currentScript && document.currentScript.src) || location.href).href;
  const COL = {ink: "#16181c", ink2: "#474c55", muted: "#6b717b", grid: "#e4e7eb", blue: "#1e4f91", cmd: "#c45a00", bg: "#fbfbfc"};
  const SANS = '"IBM Plex Sans", system-ui, sans-serif';
  const FADE = 0.1, GHOST_EVERY = 5, WINDOW = 10, SAMPLE = 0.04;

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
  const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));
  const nearestIdx = (arr, v) => { let b = 0; for (let i = 1; i < arr.length; i++) if (Math.abs(arr[i] - v) < Math.abs(arr[b] - v)) b = i; return b; };
  let uid = 0;

  function joystickDemo(root) {
    root.classList.add("jd");
    const id = "jd" + (++uid);

    // ---- DOM ----
    const cv = el("canvas", {role: "img", "aria-label": "3D view of the robot walking with your command, with an orange ghost where the command alone would take it"});
    const msg = el("div", {class: "jd-msg", text: "Loading…"});
    const fallNote = el("div", {class: "jd-fall", hidden: ""}, el("b", {text: "This command makes it fall."}), " The robot is kept standing still.");
    const stage = el("div", {class: "jd-stage"}, cv, fallNote, msg, el("div", {class: "jd-hint", text: "drag sideways to turn the view"}));

    const knob = el("span", {class: "jd-knob"});
    const dots = el("span", {class: "jd-dots"});
    const pad = el("div", {class: "jd-pad", tabindex: "0", role: "group", "aria-roledescription": "joystick", "aria-label": "Stick: forward, back and sideways", "aria-describedby": id + "-keys"},
      el("span", {class: "jd-cross"}), dots, knob);
    const padWrap = el("div", {class: "jd-padwrap"},
      el("span", {class: "jd-dir n", text: "forward"}), el("span", {class: "jd-dir s", text: "back"}),
      el("span", {class: "jd-dir w", text: "left"}), el("span", {class: "jd-dir e", text: "right"}), pad);
    const turn = el("input", {type: "range", min: "0", max: "4", step: "1", value: "2", class: "jd-turn", id: id + "-turn"});
    const turnVal = el("span", {class: "jd-turnval"});
    const turnBox = el("div", {class: "jd-turnbox"},
      el("div", {class: "jd-turnhead"}, el("label", {for: id + "-turn", class: "jd-lab", text: "Turn"}), turnVal),
      turn, el("div", {class: "jd-ticks", "aria-hidden": "true"}, el("span", {text: "left"}), el("span", {text: "0"}), el("span", {text: "right"})));
    const stopB = el("button", {type: "button", class: "jd-btn", text: "Stop"});
    const resetB = el("button", {type: "button", class: "jd-btn", text: "Reset ghost"});
    const PRESETS = [["Walk forward", [1.0, 0, 0]], ["Walk sideways", [0, 0.8, 0]], ["Turn around", [0, 0, 1.2]], ["Walk back", [-1.0, 0, 0]]];
    const presetBtns = PRESETS.map(([t]) => el("button", {type: "button", class: "jd-btn jd-preset", text: t}));
    const presetRow = el("div", {class: "jd-presets", role: "group", "aria-label": "Try a command"}, el("span", {class: "jd-lab", text: "Try:"}), ...presetBtns);
    const keys = el("p", {class: "jd-keys", id: id + "-keys", text: "Keys, after a click on the stick: W S or ↑ ↓ forward and back, A D or ← → sideways, Q E turn, space stops."});
    const side = el("div", {class: "jd-side"}, turnBox, el("div", {class: "jd-btns"}, stopB, resetB), keys);
    const ctl = el("div", {class: "jd-ctl"}, padWrap, side);

    const cells = {};
    const row = (k, label) => { const r = el("tr", {}, el("th", {scope: "row", text: label})); cells[k] = [0, 1, 2].map(() => { const td = el("td"); r.append(td); return td; }); return r; };
    const table = el("table", {class: "jd-status"},
      el("thead", {}, el("tr", {}, el("td"), el("th", {scope: "col", text: "forward m/s"}), el("th", {scope: "col", text: "sideways m/s"}), el("th", {scope: "col", text: "turn rad/s"}))),
      el("tbody", {}, row("cmd", "command"), row("meas", "measured")));
    const live = el("p", {class: "jd-live", "aria-live": "polite"});
    const ch = el("canvas", {role: "img", "aria-label": "Last 10 seconds of commanded and measured forward, sideways and turning velocity"});
    const item = (sw, text) => el("li", {}, sw, text);
    const sw = cls => el("span", {class: "jd-sw " + cls});
    const legend = el("ul", {class: "jd-legend"},
      item(sw("robot"), "robot, moving with the velocity measured in its clip"),
      item(sw("ghost"), "ghost: the command alone, reset onto the robot every 5 s"),
      item(sw("band"), "command (chart)"), item(sw("meas"), "measured (chart)"));
    root.replaceChildren(presetRow, stage, ctl, table, live, el("div", {class: "jd-chart"}, ch), legend);

    // ---- state ----
    const S = {L: null, ix: -1, iy: -1, iw: -1, cmd: [0, 0, 0], fell: false, prev: null, cur: null, w: 1, phase: 0, time: 0, acc: 0,
      x: 0, y: 0, yaw: 0, gh: {x: 0, y: 0, yaw: 0}, ghostT: 0, trailR: [], trailG: [], hist: [],
      az: null, azOff: 0.75, el: 0.42, T: null, D: 2, visible: true, running: false, dragKnob: false};
    root._jd = S;   // handle for tests and for the curious reader's console

    let W = 0, H = 0, dpr = 1, CW = 0, lastW = -1;
    const CH = 150;
    const resize = () => {
      const w = Math.round(stage.clientWidth); if (!w || w === lastW) return; lastW = w;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = w; H = Math.round(clamp(w * 0.56, 220, 400));
      cv.style.height = H + "px"; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      CW = Math.round(ch.parentNode.clientWidth || w); ch.style.height = CH + "px"; ch.width = Math.round(CW * dpr); ch.height = Math.round(CH * dpr);
      if (S.draw) S.draw();
    };

    getJSON(BASE + "data/joystick_lib.json").then(L => init(L)).catch(() => { msg.textContent = "Could not load the joystick data. Reload the page to try again."; });

    function init(L) {
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
      const STILL = {frames: [stand], n: 1, meas: [0, 0, 0]};
      const srcs = new Map();
      const srcOf = c => { if (!srcs.has(c)) srcs.set(c, {frames: c.frames, n: c.frames.length, meas: c.meas}); return srcs.get(c); };
      S.prev = S.cur = STILL;

      // size of the robot (camera distance), its body plate (polygon through the root's children) and its nose
      const rz = stand[3 * rootIdx + 2];
      let ext = 0, top = 0; for (let b = 0; b < NB; b++) { ext = Math.max(ext, Math.abs(stand[3 * b] - stand[3 * rootIdx]), Math.abs(stand[3 * b + 1] - stand[3 * rootIdx + 1])); top = Math.max(top, stand[3 * b + 2]); }
      const size = Math.max(2 * ext, top, 0.2);
      const plate = kids[rootIdx].length >= 3 ? kids[rootIdx].slice().sort((a, b) =>
        Math.atan2(stand[3 * a + 1] - stand[3 * rootIdx + 1], stand[3 * a] - stand[3 * rootIdx]) - Math.atan2(stand[3 * b + 1] - stand[3 * rootIdx + 1], stand[3 * b] - stand[3 * rootIdx])) : null;
      const noseX = plate ? Math.max(...plate.map(b => stand[3 * b])) + 0.04 * size / 0.5 : stand[3 * rootIdx] + 0.3 * size;
      const leaves = []; for (let b = 0; b < NB; b++) if (!kids[b].length) leaves.push(b);

      // ---- the pad: one dot per (forward, sideways) grid command, evenly spaced, zero at the centre ----
      const step = 0.36 / Math.max(i0, G.vx.length - 1 - i0, j0, G.vy.length - 1 - j0, 1);
      const dotPos = (i, j) => [-(j - j0) * step, -(i - i0) * step];   // pad units, centre 0, edge ±0.5; left is +sideways
      const dotEls = [];
      for (let i = 0; i < G.vx.length; i++) for (let j = 0; j < G.vy.length; j++) {
        const [px, py] = dotPos(i, j), d = el("span", {class: "jd-dot" + (i === i0 && j === j0 ? " zero" : "")});
        d.style.left = (50 + 100 * px) + "%"; d.style.top = (50 + 100 * py) + "%"; dots.append(d); dotEls.push({i, j, d});
      }
      const placeKnob = (px, py) => { knob.style.left = (50 + 100 * px) + "%"; knob.style.top = (50 + 100 * py) + "%"; };
      const snapPad = (px, py) => { let best = null, bd = 1e9; for (const o of dotEls) { const [qx, qy] = dotPos(o.i, o.j), dd = (qx - px) ** 2 + (qy - py) ** 2; if (dd < bd) { bd = dd; best = o; } } return best; };

      const turnPos = k => G.wz.length - 1 - k;   // slider: left end = turn left (+), right end = turn right (−)
      turn.max = String(G.wz.length - 1);
      const fmtTurn = w => Math.abs(w) < 1e-9 ? "straight" : (w > 0 ? "left " : "right ") + Math.abs(w).toFixed(1) + " rad/s";

      const setCmd = (ix, iy, iw) => {
        ix = clamp(ix, 0, G.vx.length - 1); iy = clamp(iy, 0, G.vy.length - 1); iw = clamp(iw, 0, G.wz.length - 1);
        if (!S.dragKnob) placeKnob(...dotPos(ix, iy));
        if (ix === S.ix && iy === S.iy && iw === S.iw) return;
        const turnChanged = iw !== S.iw;
        S.ix = ix; S.iy = iy; S.iw = iw; S.cmd = [G.vx[ix], G.vy[iy], G.wz[iw]];
        const c = clipAt(ix, iy, iw), next = !c || c.fell ? STILL : srcOf(c);
        S.fell = !c || !!c.fell; S.clip = c;
        if (next !== S.cur) { if (S.w >= 0.5) S.prev = S.cur; S.cur = next; S.w = 0; }
        // UI
        for (const o of dotEls) { o.d.classList.toggle("on", o.i === ix && o.j === iy); if (turnChanged) { const cc = clipAt(o.i, o.j, iw); o.d.classList.toggle("falls", !cc || !!cc.fell); } }
        turn.value = String(turnPos(iw)); turn.setAttribute("aria-valuetext", fmtTurn(S.cmd[2])); turnVal.textContent = fmtTurn(S.cmd[2]);
        S.cmd.forEach((v, k) => { cells.cmd[k].textContent = sgn(v); });
        if (S.fell) cells.meas.forEach(td => { td.textContent = "falls"; }); else c.meas.forEach((v, k) => { cells.meas[k].textContent = sgn(v); });
        table.classList.toggle("is-fall", S.fell); fallNote.hidden = !S.fell;
        live.textContent = `Command: forward ${sgn(S.cmd[0])} m/s, sideways ${sgn(S.cmd[1])} m/s, turn ${sgn(S.cmd[2])} rad/s. ` +
          (S.fell ? (c ? "This command makes it fall, so the robot is kept standing still." : "No clip was recorded for this command; the robot stands still.")
            : `Measured: ${sgn(c.meas[0])} m/s, ${sgn(c.meas[1])} m/s, ${sgn(c.meas[2])} rad/s.`);
        if (!S.running) draw();
      };
      S.setCmd = setCmd;
      const resetGhost = () => { S.gh = {x: S.x, y: S.y, yaw: S.yaw}; S.ghostT = 0; S.trailR = [[S.x, S.y]]; S.trailG = [[S.x, S.y]]; };
      S.resetGhost = resetGhost;

      // ---- input: stick ----
      const padXY = e => { const r = pad.getBoundingClientRect(); let px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5; const m = Math.hypot(px, py); if (m > 0.45) { px *= 0.45 / m; py *= 0.45 / m; } return [px, py]; };
      const fromPad = e => { const [px, py] = padXY(e); placeKnob(px, py); const o = snapPad(px, py); setCmd(o.i, o.j, S.iw); };
      pad.addEventListener("pointerdown", e => { e.preventDefault(); S.dragKnob = true; pad.classList.add("drag"); try { pad.setPointerCapture(e.pointerId); } catch (_) {} pad.focus({preventScroll: true}); fromPad(e); });
      pad.addEventListener("pointermove", e => { if (S.dragKnob) fromPad(e); });
      const endKnob = () => { if (!S.dragKnob) return; S.dragKnob = false; pad.classList.remove("drag"); placeKnob(...dotPos(S.ix, S.iy)); };
      pad.addEventListener("pointerup", endKnob); pad.addEventListener("pointercancel", endKnob); pad.addEventListener("lostpointercapture", endKnob);
      turn.addEventListener("input", () => setCmd(S.ix, S.iy, G.wz.length - 1 - +turn.value));
      stopB.addEventListener("click", () => setCmd(i0, j0, k0));
      resetB.addEventListener("click", () => { resetGhost(); if (!S.running) draw(); });
      // ---- presets: set the stick to a fixed command; "Turn around" stops after one full turn at the measured turning speed ----
      let presetTimer = null;
      const clearPreset = () => { if (presetTimer) { clearTimeout(presetTimer); presetTimer = null; } };
      root.addEventListener("pointerdown", e => { if (!e.target.closest(".jd-preset")) clearPreset(); }, true);
      root.addEventListener("keydown", clearPreset, true);
      presetBtns.forEach((btn, n) => btn.addEventListener("click", () => {
        clearPreset();
        const v = PRESETS[n][1], ix = G.vx.indexOf(v[0]), iy = G.vy.indexOf(v[1]), iw = G.wz.indexOf(v[2]);
        if (ix < 0 || iy < 0 || iw < 0) return;
        resetGhost(); setCmd(ix, iy, iw);
        const c = clipAt(ix, iy, iw);
        if (n === 2 && c && !c.fell && Math.abs(c.meas[2]) > 0.05) presetTimer = setTimeout(() => { presetTimer = null; setCmd(i0, j0, k0); }, 1000 * 2 * Math.PI / Math.abs(c.meas[2]));
      }));

      // ---- input: keys (anywhere inside the figure; a focused slider keeps its own arrows, a focused button its own space) ----
      root.addEventListener("keydown", e => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        const t = e.target, k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (t === turn && /^Arrow|^Home$|^End$|^Page/.test(k)) return;
        if (t.tagName === "BUTTON" && (k === " " || k === "Enter")) return;
        let d = null;
        if (k === "w" || k === "ArrowUp") d = [1, 0, 0]; else if (k === "s" || k === "ArrowDown") d = [-1, 0, 0];
        else if (k === "a" || k === "ArrowLeft") d = [0, 1, 0]; else if (k === "d" || k === "ArrowRight") d = [0, -1, 0];
        else if (k === "q") d = [0, 0, 1]; else if (k === "e") d = [0, 0, -1];
        else if (k === " " || k === "Spacebar") { e.preventDefault(); setCmd(i0, j0, k0); return; }
        if (!d) return;
        e.preventDefault(); setCmd(S.ix + d[0], S.iy + d[1], S.iw + d[2]);
      });

      // ---- input: drag the 3D view sideways to orbit (vertical swipes still scroll the page) ----
      let drag = null;
      cv.addEventListener("pointerdown", e => { drag = {x: e.clientX, y: e.clientY, off: S.azOff, el: S.el}; try { cv.setPointerCapture(e.pointerId); } catch (_) {} pad.focus({preventScroll: true}); });
      cv.addEventListener("pointermove", e => { if (!drag) return; S.azOff = drag.off - (e.clientX - drag.x) * 0.01; if (e.pointerType === "mouse") S.el = clamp(drag.el + (e.clientY - drag.y) * 0.005, 0.12, 1.2); if (!S.running) draw(); });
      const endDrag = () => { drag = null; }; cv.addEventListener("pointerup", endDrag); cv.addEventListener("pointercancel", endDrag);

      // ---- simulation ----
      const local = new Float64Array(3 * NB), la = new Float64Array(3 * NB), lb = new Float64Array(3 * NB);
      const sample = (src, ph, out) => {
        const n = src.n, f = ((ph / dt) % n + n) % n, i = Math.floor(f) % n, a = f - Math.floor(f), A = src.frames[i], B = src.frames[(i + 1) % n];
        for (let k = 0; k < out.length; k++) out[k] = A[k] + (B[k] - A[k]) * a;
      };
      const vel = () => [0, 1, 2].map(k => S.prev.meas[k] + (S.cur.meas[k] - S.prev.meas[k]) * S.w);
      const move = (p, v, h) => { const ym = p.yaw + v[2] * h / 2; p.x += (v[0] * Math.cos(ym) - v[1] * Math.sin(ym)) * h; p.y += (v[0] * Math.sin(ym) + v[1] * Math.cos(ym)) * h; p.yaw += v[2] * h; };
      const stepSim = h => {
        S.time += h; S.phase += h;
        if (S.w < 1) S.w = Math.min(1, S.w + h / FADE);
        const v = vel(); move(S, v, h); move(S.gh, S.cmd, h);
        S.ghostT += h; if (S.ghostT >= GHOST_EVERY) resetGhost();
        S.acc += h;
        while (S.acc >= SAMPLE) {
          S.acc -= SAMPLE;
          S.hist.push({t: S.time, c: S.cmd.slice(), m: v, f: S.fell});
          S.trailR.push([S.x, S.y]); S.trailG.push([S.gh.x, S.gh.y]);
        }
        while (S.hist.length && S.hist[0].t < S.time - WINDOW - 0.5) S.hist.shift();
      };
      const pose = () => {
        sample(S.cur, S.phase, lb);
        if (S.w < 1) { sample(S.prev, S.phase, la); for (let k = 0; k < local.length; k++) local[k] = la[k] + (lb[k] - la[k]) * S.w; } else local.set(lb);
        const c = Math.cos(S.yaw), s = Math.sin(S.yaw), P = [];
        for (let b = 0; b < NB; b++) { const x = local[3 * b], y = local[3 * b + 1]; P.push([S.x + x * c - y * s, S.y + x * s + y * c, local[3 * b + 2]]); }
        return P;
      };

      // ---- camera: orbit around a point on the floor, z up; it trails behind the robot's heading ----
      const NEAR = 0.05, FOV = 40 * Math.PI / 180;
      let V = null;
      const setView = () => {
        const ce = Math.cos(S.el), tz = 0.7 * rz, cx = S.T[0] + S.D * ce * Math.cos(S.az), cy = S.T[1] + S.D * ce * Math.sin(S.az), cz = tz + S.D * Math.sin(S.el);
        let fx = S.T[0] - cx, fy = S.T[1] - cy, fz = tz - cz; const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
        let rx = fy, ry = -fx; const rl = Math.hypot(rx, ry) || 1; rx /= rl; ry /= rl;
        V = {cx, cy, cz, fx, fy, fz, rx, ry, ux: ry * fz, uy: -rx * fz, uz: rx * fy - ry * fx, foc: H / (2 * Math.tan(FOV / 2))};
      };
      const cam = p => { const dx = p[0] - V.cx, dy = p[1] - V.cy, dz = p[2] - V.cz; return [dx * V.rx + dy * V.ry, dx * V.ux + dy * V.uy + dz * V.uz, dx * V.fx + dy * V.fy + dz * V.fz]; };
      const scr = c => [W / 2 + V.foc * c[0] / c[2], H / 2 - V.foc * c[1] / c[2]];
      const seg = (g, a, b) => {
        let A = cam(a), B = cam(b);
        if (A[2] < NEAR && B[2] < NEAR) return;
        if (A[2] < NEAR) { const s = (NEAR - A[2]) / (B[2] - A[2]); A = A.map((u, k) => u + (B[k] - u) * s); }
        if (B[2] < NEAR) { const s = (NEAR - B[2]) / (A[2] - B[2]); B = B.map((u, k) => u + (A[k] - u) * s); }
        const p = scr(A), q = scr(B); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]);
      };
      const path3 = (g, pts, z) => { let on = false; for (const p of pts) { const c = cam([p[0], p[1], z]); if (c[2] < NEAR) { on = false; continue; } const s = scr(c); on ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); on = true; } };
      const poly = (g, pts, closed) => { const c = pts.map(cam); if (c.some(u => u[2] < NEAR)) return false; c.forEach((u, k) => { const s = scr(u); k ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); }); if (closed) g.closePath(); return true; };
      const label = (g, p, text, color) => { const c = cam(p); if (c[2] < NEAR) return; const s = scr(c); g.font = `500 11px ${SANS}`; g.textAlign = "center"; g.fillStyle = color; g.fillText(text, s[0], s[1]); };
      const atPose = (p, lx, ly, z) => [p.x + lx * Math.cos(p.yaw) - ly * Math.sin(p.yaw), p.y + lx * Math.sin(p.yaw) + ly * Math.cos(p.yaw), z];

      const drawRobot = (g, P) => {
        const lw = 2.6;
        g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = COL.blue; g.fillStyle = COL.blue;
        if (plate) {
          g.globalAlpha = 0.09; g.fillStyle = COL.ink; g.beginPath(); if (poly(g, plate.map(i => [P[i][0], P[i][1], 0.002]), true)) g.fill();
          g.fillStyle = COL.blue; g.lineWidth = lw; g.beginPath();
          if (poly(g, plate.map(i => P[i]), true)) { g.globalAlpha = 0.22; g.fill(); g.globalAlpha = 1; g.stroke(); }
        }
        const segs = [];
        for (let i = 0; i < NB; i++) { const p = par[i]; if (p < 0 || (plate && p === rootIdx)) continue; segs.push([(cam(P[i])[2] + cam(P[p])[2]) / 2, i, p]); }
        segs.sort((a, b) => b[0] - a[0]);
        const dmin = segs.length ? segs[segs.length - 1][0] : 0, dmax = segs.length ? segs[0][0] : 1;
        g.lineWidth = lw;
        for (const [dz, i, p] of segs) { g.globalAlpha = 0.45 + 0.55 * (dmax - dz) / (dmax - dmin || 1); g.beginPath(); seg(g, P[i], P[p]); g.stroke(); }
        g.globalAlpha = 1;
        const nose = atPose(S, noseX, 0, P[rootIdx][2]);
        for (const p of [nose, ...leaves.map(b => P[b])]) { const c = cam(p); if (c[2] > NEAR) { const s = scr(c); g.beginPath(); g.arc(s[0], s[1], p === nose ? lw * 1.15 : lw * 0.85, 0, 2 * Math.PI); g.fill(); } }
      };
      const drawGhost = g => {
        const p = S.gh;
        g.strokeStyle = COL.cmd; g.fillStyle = COL.cmd; g.lineWidth = 1.6; g.setLineDash([4, 3]); g.globalAlpha = 0.9; g.beginPath();
        const ring = plate ? plate.map(b => atPose(p, stand[3 * b] - stand[3 * rootIdx], stand[3 * b + 1] - stand[3 * rootIdx + 1], 0.004))
          : Array.from({length: 20}, (_, k) => atPose(p, 0.25 * size * Math.cos(k * Math.PI / 10), 0.25 * size * Math.sin(k * Math.PI / 10), 0.004));
        if (poly(g, ring, true)) g.stroke();
        g.setLineDash([]); g.beginPath(); seg(g, atPose(p, 0, 0, 0.004), atPose(p, noseX + 0.1 * size, 0, 0.004)); g.stroke();
        g.globalAlpha = 0.6; g.lineWidth = 1; g.beginPath(); seg(g, [p.x, p.y, 0], [p.x, p.y, rz]); g.stroke();
        const bc = cam([p.x, p.y, rz]);
        if (bc[2] > NEAR) { const s = scr(bc); g.globalAlpha = 0.9; g.beginPath(); g.arc(s[0], s[1], Math.max(3, V.foc * 0.04 * size / bc[2]), 0, 2 * Math.PI); g.fill(); }
        g.globalAlpha = 1;
      };

      const render = h => {
        const P = pose();
        // camera target: the robot, pulled a little toward the ghost; back off when the two are far apart
        const sep = Math.hypot(S.gh.x - S.x, S.gh.y - S.y), tx = S.x + (S.gh.x - S.x) * 0.3, ty = S.y + (S.gh.y - S.y) * 0.3;
        const Dw = (2.2 * size + 0.6 * sep) * (W < 480 ? 1.1 : 1), azT = S.yaw + Math.PI + S.azOff;
        if (!S.T) { S.T = [tx, ty]; S.D = Dw; S.az = azT; }
        else { const k = 1 - Math.exp(-h / 0.25), ka = 1 - Math.exp(-h / 0.7); S.T[0] += (tx - S.T[0]) * k; S.T[1] += (ty - S.T[1]) * k; S.D += (Dw - S.D) * k * 0.5; S.az += wrapAngle(azT - S.az) * ka; }
        setView();
        const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = COL.bg; g.fillRect(0, 0, W, H);
        // floor grid, 0.5 m
        g.strokeStyle = COL.grid; g.lineWidth = 1; g.beginPath();
        const gx = Math.round(S.T[0] * 2) / 2, gy = Math.round(S.T[1] * 2) / 2, R = 6;
        for (let k = -R; k <= R; k += 0.5) { seg(g, [gx + k, gy - R, 0], [gx + k, gy + R, 0]); seg(g, [gx - R, gy + k, 0], [gx + R, gy + k, 0]); }
        g.stroke();
        // paths since the last ghost reset
        g.lineWidth = 1.5; g.strokeStyle = COL.cmd; g.globalAlpha = 0.5; g.setLineDash([5, 4]); g.beginPath(); path3(g, [...S.trailG, [S.gh.x, S.gh.y]], 0.003); g.stroke(); g.setLineDash([]);
        g.strokeStyle = COL.blue; g.globalAlpha = 0.4; g.beginPath(); path3(g, [...S.trailR, [S.x, S.y]], 0.003); g.stroke(); g.globalAlpha = 1;
        drawGhost(g);
        drawRobot(g, P);
        label(g, [P[rootIdx][0], P[rootIdx][1], top + 0.35 * size], L.robot || "robot", COL.blue);
        if (sep > 0.6 * size) label(g, [S.gh.x, S.gh.y, rz + 0.3 * size], "command", COL.cmd);
        g.font = `11px ${SANS}`; g.textAlign = "left"; g.fillStyle = COL.muted;
        g.fillText(`ghost back on the robot in ${Math.max(1, Math.ceil(GHOST_EVERY - S.ghostT - 1e-6))} s`, 8, H - 7);
      };

      // ---- rolling strip chart: command as an orange band, measured as a dark-blue line ----
      const lim = [G.vx, G.vy, G.wz].map(a => Math.max(...a.map(Math.abs)) * 1.15 || 1);
      const ROWS = [["forward", "m/s"], ["sideways", "m/s"], ["turn", "rad/s"]], RH = 42, LW = 64, TOP = 4, RP = 6;
      const drawChart = () => {
        if (!CW) return;
        const g = ch.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = "#ffffff"; g.fillRect(0, 0, CW, CH);
        const now = S.time, X = t => LW + (CW - LW - RP) * (1 - (now - t) / WINDOW), H3 = S.hist;
        // the stretches where the command makes it fall
        g.fillStyle = "rgba(196, 90, 0, 0.07)";
        for (let i = 0; i < H3.length; i++) {
          if (!H3[i].f) continue;
          let j = i; while (j + 1 < H3.length && H3[j + 1].f) j++;
          const a = Math.round(Math.max(LW, X(H3[i].t - SAMPLE))), b = Math.round(X(H3[j].t)); if (b > a) g.fillRect(a, TOP, b - a, 3 * RH); i = j;
        }
        // one faint tick per second, moving with the data
        g.strokeStyle = "#f0f1f3"; g.lineWidth = 1; g.beginPath();
        for (let s = Math.ceil(now - WINDOW); s <= now; s++) { const x = Math.round(X(s)) + 0.5; if (x >= LW) { g.moveTo(x, TOP); g.lineTo(x, TOP + 3 * RH); } }
        g.stroke();
        ROWS.forEach(([name, unit], r) => {
          const y0 = TOP + r * RH, Y = v => y0 + RH / 2 - clamp(v / lim[r], -1, 1) * (RH / 2 - 4);
          g.fillStyle = COL.ink2; g.font = `11px ${SANS}`; g.textAlign = "left"; g.fillText(name, 0, y0 + RH / 2 - 1);
          g.fillStyle = COL.muted; g.font = `10px ${SANS}`; g.fillText(unit, 0, y0 + RH / 2 + 11);
          g.strokeStyle = COL.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(LW, Math.round(Y(0)) + 0.5); g.lineTo(CW - RP, Math.round(Y(0)) + 0.5); g.stroke();
          if (!H3.length) return;
          const line = (get, color, w, a) => {
            g.globalAlpha = a; g.strokeStyle = color; g.lineWidth = w; g.lineJoin = "round"; g.lineCap = "butt"; g.beginPath(); let on = false;
            for (const s of H3) { const x = X(s.t); if (x < LW - 2) continue; const y = Y(get(s)); on ? g.lineTo(x, y) : g.moveTo(Math.max(LW, x), y); on = true; }
            g.stroke(); g.globalAlpha = 1;
          };
          line(s => s.c[r], COL.cmd, 8, 0.2); line(s => s.c[r], COL.cmd, 1.2, 0.9); line(s => s.m[r], COL.blue, 1.6, 1);
        });
        g.fillStyle = COL.muted; g.font = `10px ${SANS}`; g.textAlign = "center";
        for (const s of [10, 5]) g.fillText("−" + s + " s", X(now - s), CH - 3);
        g.textAlign = "right"; g.fillText("now", CW - RP, CH - 3);
      };

      const draw = (h = 0) => { if (W) { render(h); drawChart(); } };
      S.draw = draw;

      // ---- loop: runs only while the figure is on screen and the tab is visible ----
      let last = 0, raf = 0;
      const loop = t => {
        raf = 0;
        if (!S.visible || document.hidden) { S.running = false; return; }
        const h = last ? Math.min(0.05, Math.max(0, (t - last) / 1000)) : 0; last = t;
        if (h > 0) stepSim(h);
        draw(h);
        raf = requestAnimationFrame(loop);
      };
      const wake = () => { if (S.visible && !document.hidden && !raf) { S.running = true; last = 0; raf = requestAnimationFrame(loop); } };
      if (window.IntersectionObserver) new IntersectionObserver(es => { S.visible = es[es.length - 1].isIntersecting; wake(); }).observe(root);
      document.addEventListener("visibilitychange", wake);

      // start: walking forward at the slowest forward command that does not fall, ghost on the robot
      let start = i0; for (let i = i0 + 1; i < G.vx.length; i++) { const c = clipAt(i, j0, k0); if (c && !c.fell) { start = i; break; } }
      setCmd(start, j0, k0); S.prev = S.cur; S.w = 1;
      resetGhost(); msg.hidden = true; resize(); draw(); wake();
    }

    if (window.ResizeObserver) new ResizeObserver(resize).observe(root); else window.addEventListener("resize", resize);
    resize();
  }

  const start = () => { const r = document.getElementById("joystick-demo"); if (r) joystickDemo(r); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
