/* Interactive figures for the post (plain JavaScript, no libraries).
   #robot-demo  the best robot of a chosen generation and, faint, the zero-weight brain on one joystick episode, drawn in 3D on a canvas,
                with the joystick command, a ball where a robot that obeys exactly would be, and commanded vs measured velocity.
   #astra-sees  short verbatim excerpts of what Astra reads and writes in generation 27.
   Data files sit in data/ next to this script. */
(() => {
  "use strict";
  const BASE = new URL(".", (document.currentScript && document.currentScript.src) || location.href).href;
  const GENS = [0, 10, 28, 51, 61, 78, 90, 99], START_GEN = 99;
  const COL = {ink: "#16181c", ink2: "#474c55", muted: "#6b717b", grid: "#e4e7eb", blue: "#1e4f91", cmd: "#c45a00", zero: "#8d939c", bg: "#fbfbfc"};
  const SANS = '"IBM Plex Sans", system-ui, sans-serif';

  const el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else e.setAttribute(k, v);
    }
    for (const c of kids) if (c != null) e.append(c);
    return e;
  };
  const getJSON = url => fetch(url).then(r => { if (!r.ok) throw new Error(r.status + " " + url); return r.json(); });
  const fix = (v, d = 2) => { const s = Math.abs(v).toFixed(d); return (v < 0 && +s !== 0 ? "−" : "") + s; };
  const sgn = (v, d = 2) => { const s = Math.abs(v).toFixed(d); return (+s === 0 ? " " : v < 0 ? "−" : "+") + s; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- robot replay ---------------- */
  function robotDemo(root) {
    root.classList.add("wd", "wd-robot");
    const genBtns = GENS.map(g => el("button", {type: "button", class: "wd-gen", "aria-pressed": "false", "data-g": String(g), text: String(g)}));
    const bar = el("div", {class: "wd-bar", role: "group", "aria-label": "Generation"}, el("span", {class: "wd-lab", text: "Generation"}), ...genBtns);
    const info = el("p", {class: "wd-info"});
    const cv = el("canvas", {role: "img", "aria-label": "3D replay of the selected generation's best robot and the zero-weight brain on one joystick episode"});
    const msg = el("div", {class: "wd-msg", text: "Loading…"});
    const stage = el("div", {class: "wd-stage"}, cv, msg, el("div", {class: "wd-hint", text: "drag sideways to turn the view"}));
    const play = el("button", {type: "button", class: "wd-play"});
    const scrub = el("input", {type: "range", min: "0", max: "249", step: "1", value: "0", "aria-label": "Time in the episode"});
    const clock = el("span", {class: "wd-time"});
    const ctl = el("div", {class: "wd-ctl"}, play, scrub, clock);
    const item = (sw, text) => el("li", {}, sw, text);
    const sw = (color, dot, extra = "") => el("span", {class: "wd-sw" + (dot ? " dot" : ""), style: `background:${color};${extra}`});
    const legend = el("ul", {class: "wd-legend"},
      item(sw(COL.blue), "best robot of the generation"),
      item(sw(COL.zero, false, "opacity:.6"), "zero-weight brain"),
      item(sw(COL.cmd), "joystick command (arrow) and commanded velocity (chart)"),
      item(sw(COL.cmd, true, "opacity:.85"), "where a robot that obeys exactly would be"));
    const ch = el("canvas", {role: "img", "aria-label": "Commanded and measured forward, sideways and turning velocity over the episode"});
    const now = el("p", {class: "wd-now", "aria-live": "off"});
    root.replaceChildren(bar, info, stage, ctl, legend, el("div", {class: "wd-chart"}, ch), now);

    const S = {zero: null, d: null, cache: {}, gen: null, t: 0, N: 250, dt: 0.08, az: null, el: 0.45, T: null, D: 3, dirty: true, visible: true, snap: true,
      playing: !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)};
    const T = () => (S.N - 1) * S.dt;
    const setPlay = p => { S.playing = p; play.textContent = p ? "❚❚ Pause" : "▶ Play"; play.setAttribute("aria-label", p ? "Pause" : "Play"); };
    setPlay(S.playing);

    // ---- data ----
    // frames: per frame [trunk x,y,z in mm, then the other 16 bodies relative to the trunk in mm]; bodies: trunk, FR/FL/RR/RL hip, thigh, calf, then the four feet
    const LEGS = [[1, 2], [2, 3], [3, 13], [4, 5], [5, 6], [6, 14], [7, 8], [8, 9], [9, 15], [10, 11], [11, 12], [12, 16]];
    const bodies = (lane, fi) => {
      const F = lane.f, n = F.length, x = Math.min(fi, n - 1), i = Math.floor(x), a = x - i, A = F[i], B = F[Math.min(i + 1, n - 1)];
      const v = j => (A[j] + (B[j] - A[j]) * a) / 1000, t = [v(0), v(1), v(2)], P = [t];
      for (let k = 1; k < 17; k++) P.push([t[0] + v(3 * k), t[1] + v(3 * k + 1), t[2] + v(3 * k + 2)]);
      return P;
    };
    const heading = P => Math.atan2((P[1][1] + P[4][1] - P[7][1] - P[10][1]) / 2, (P[1][0] + P[4][0] - P[7][0] - P[10][0]) / 2);
    const at = (arr, fi) => { const x = clamp(fi, 0, arr.length - 1), i = Math.floor(x), a = x - i, A = arr[i], B = arr[Math.min(i + 1, arr.length - 1)]; return A.map((u, k) => u + (B[k] - u) * a); };

    const setInfo = () => {
      const d = S.d, z = S.zero.zero, falls = d.test.falls;
      info.replaceChildren(
        "Generation ", el("b", {text: String(d.gen)}), ": robot ", el("b", {text: d.id}), ", the best on that generation’s exam. On the hidden test of 64 episodes it had a velocity error of ",
        el("b", {text: fix(d.test.vel, 3) + " m/s"}), ` with ${falls} fall${falls === 1 ? "" : "s"}. In this episode: ${fix(d.best.vel_err)} m/s, against ${fix(z.vel_err)} for the zero-weight brain.`,
        d.gen === 0 ? " In generation 0 every weight is zero, so the two robots are the same." : "");
    };
    const load = async g => {
      S.gen = g; genBtns.forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.g === g)));
      msg.hidden = false; msg.textContent = "Loading…";
      try {
        if (!S.zero) S.zero = await getJSON(BASE + "data/replay_zero.json");
        const d = S.cache[g] || (S.cache[g] = await getJSON(BASE + "data/replay_g" + String(g).padStart(3, "0") + ".json"));
        if (S.gen !== g) return;
        S.d = d; S.dt = d.dt; S.N = Math.max(d.cmd.length, d.best.f.length, S.zero.zero.f.length); scrub.max = String(S.N - 1);
        if (S.t > T()) S.t = 0;
        if (S.az == null) S.az = heading(bodies(d.best, 0)) + Math.PI + 0.85;   // first view: from behind, a little to the side
        setInfo(); msg.hidden = true; S.snap = true; S.dirty = true; drawChart();
      } catch (e) {
        if (S.gen === g) msg.textContent = "Could not load the replay. Reload the page to try again.";
      }
    };
    genBtns.forEach(b => b.addEventListener("click", () => load(+b.dataset.g)));
    play.addEventListener("click", () => { if (!S.playing && S.t >= T() - 1e-6) S.t = 0; setPlay(!S.playing); S.dirty = true; });
    scrub.addEventListener("input", () => { S.t = +scrub.value * S.dt; S.snap = true; S.dirty = true; });

    // ---- sizes ----
    let W = 0, H = 0, dpr = 1, CW = 0, lastW = -1;
    const CH = 156;
    const resize = () => {
      const w = Math.round(stage.clientWidth); if (!w || w === lastW) return; lastW = w;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = w; H = Math.round(clamp(w * 0.6, 230, 420));
      cv.style.height = H + "px"; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      CW = Math.round(ch.parentNode.clientWidth || w); ch.style.height = CH + "px"; ch.width = Math.round(CW * dpr); ch.height = Math.round(CH * dpr);
      S.dirty = true; drawChart();
    };
    if (window.ResizeObserver) new ResizeObserver(resize).observe(root); else window.addEventListener("resize", resize);
    if (window.IntersectionObserver) new IntersectionObserver(es => { S.visible = es[es.length - 1].isIntersecting; S.dirty = true; }).observe(root);

    // ---- camera: orbit around a target on the floor, z up (MuJoCo axes) ----
    const NEAR = 0.08, FOV = 40 * Math.PI / 180;
    let V = null;
    const setView = () => {
      const ce = Math.cos(S.el), tz = 0.22, cx = S.T[0] + S.D * ce * Math.cos(S.az), cy = S.T[1] + S.D * ce * Math.sin(S.az), cz = tz + S.D * Math.sin(S.el);
      let fx = S.T[0] - cx, fy = S.T[1] - cy, fz = tz - cz; const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
      let rx = fy, ry = -fx; const rl = Math.hypot(rx, ry) || 1; rx /= rl; ry /= rl;
      V = {cx, cy, cz, fx, fy, fz, rx, ry, ux: ry * fz, uy: -rx * fz, uz: rx * fy - ry * fx, foc: H / (2 * Math.tan(FOV / 2))};
    };
    const cam = p => { const dx = p[0] - V.cx, dy = p[1] - V.cy, dz = p[2] - V.cz; return [dx * V.rx + dy * V.ry, dx * V.ux + dy * V.uy + dz * V.uz, dx * V.fx + dy * V.fy + dz * V.fz]; };
    const scr = c => [W / 2 + V.foc * c[0] / c[2], H / 2 - V.foc * c[1] / c[2]];
    const seg = (g, a, b) => {   // one 3D segment into the current path, clipped at the near plane
      let A = cam(a), B = cam(b);
      if (A[2] < NEAR && B[2] < NEAR) return;
      if (A[2] < NEAR) { const s = (NEAR - A[2]) / (B[2] - A[2]); A = A.map((u, k) => u + (B[k] - u) * s); }
      if (B[2] < NEAR) { const s = (NEAR - B[2]) / (A[2] - B[2]); B = B.map((u, k) => u + (A[k] - u) * s); }
      const p = scr(A), q = scr(B); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]);
    };
    const path3 = (g, pts) => { let on = false; for (const p of pts) { const c = cam(p); if (c[2] < NEAR) { on = false; continue; } const s = scr(c); on ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); on = true; } };
    const poly = (g, pts, closed) => { const c = pts.map(cam); if (c.some(u => u[2] < NEAR)) return false; c.forEach((u, k) => { const s = scr(u); k ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); }); if (closed) g.closePath(); return true; };

    const drawRobot = (g, P, color, alpha, w, shadow) => {
      g.lineCap = "round"; g.lineJoin = "round";
      if (shadow) { g.globalAlpha = 0.09; g.fillStyle = COL.ink; g.beginPath(); if (poly(g, [1, 4, 10, 7].map(i => [P[i][0], P[i][1], 0.002]), true)) g.fill(); }
      g.globalAlpha = alpha; g.strokeStyle = color; g.fillStyle = color; g.lineWidth = w;
      g.beginPath();
      if (poly(g, [1, 4, 10, 7].map(i => P[i]), true)) { g.globalAlpha = alpha * 0.22; g.fill(); g.globalAlpha = alpha; g.stroke(); }
      g.beginPath(); for (const [a, b] of LEGS) seg(g, P[a], P[b]); g.stroke();
      const h = heading(P), fm = [(P[1][0] + P[4][0]) / 2 + 0.05 * Math.cos(h), (P[1][1] + P[4][1]) / 2 + 0.05 * Math.sin(h), (P[1][2] + P[4][2]) / 2];
      for (const p of [fm, P[13], P[14], P[15], P[16]]) { const c = cam(p); if (c[2] > NEAR) { const s = scr(c); g.beginPath(); g.arc(s[0], s[1], p === fm ? w * 1.15 : w * 0.85, 0, 2 * Math.PI); g.fill(); } }
      g.globalAlpha = 1;
    };
    const label = (g, p, text, color) => { const c = cam(p); if (c[2] < NEAR) return; const s = scr(c); g.font = `500 11px ${SANS}`; g.textAlign = "center"; g.fillStyle = color; g.fillText(text, s[0], s[1]); };
    const arrowHead = (g, x, y, ux, uy, hs) => { g.beginPath(); if (poly(g, [[x, y, 0.004], [x - ux * hs - uy * hs * 0.55, y - uy * hs + ux * hs * 0.55, 0.004], [x - ux * hs + uy * hs * 0.55, y - uy * hs - ux * hs * 0.55, 0.004]], true)) g.fill(); };

    const render = () => {
      const d = S.d, z = S.zero.zero, fi = clamp(S.t / S.dt, 0, S.N - 1);
      const Pb = bodies(d.best, fi), Pz = bodies(z, fi), ball = at(d.ball, fi).map(u => u / 1000), c = at(d.cmd, fi);
      // camera target: between the robot and the ball; back off when they are far apart
      const tx = (Pb[0][0] + ball[0]) / 2, ty = (Pb[0][1] + ball[1]) / 2, sep = Math.hypot(Pb[0][0] - ball[0], Pb[0][1] - ball[1]);
      const Dw = clamp(1.9 + 1.0 * sep, 1.9, 6) * (W < 480 ? 1.12 : 1);
      if (!S.T || S.snap) { S.T = [tx, ty]; S.D = Dw; S.snap = false; } else { S.T[0] += (tx - S.T[0]) * 0.1; S.T[1] += (ty - S.T[1]) * 0.1; S.D += (Dw - S.D) * 0.05; }
      setView();
      const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = COL.bg; g.fillRect(0, 0, W, H);
      // floor grid, 0.5 m
      g.strokeStyle = COL.grid; g.lineWidth = 1; g.beginPath();
      const gx = Math.round(S.T[0] * 2) / 2, gy = Math.round(S.T[1] * 2) / 2, R = 6;
      for (let k = -R; k <= R; k += 0.5) { seg(g, [gx + k, gy - R, 0], [gx + k, gy + R, 0]); seg(g, [gx - R, gy + k, 0], [gx + R, gy + k, 0]); }
      g.stroke();
      // the path a robot that obeys exactly would take (dashed), and the path the best robot took so far
      g.strokeStyle = COL.cmd; g.globalAlpha = 0.45; g.lineWidth = 1.5; g.setLineDash([5, 4]); g.beginPath();
      path3(g, d.ball.map(b => [b[0] / 1000, b[1] / 1000, 0.003]));
      g.stroke(); g.setLineDash([]);
      g.strokeStyle = COL.blue; g.globalAlpha = 0.4; g.lineWidth = 1.5; g.beginPath();
      const F = d.best.f, iN = Math.min(Math.floor(fi), F.length - 1);
      for (let i = 1; i <= iN; i++) seg(g, [F[i - 1][0] / 1000, F[i - 1][1] / 1000, 0.003], [F[i][0] / 1000, F[i][1] / 1000, 0.003]);
      seg(g, [F[iN][0] / 1000, F[iN][1] / 1000, 0.003], [Pb[0][0], Pb[0][1], 0.003]); g.stroke(); g.globalAlpha = 1;
      // zero-weight brain, faint
      drawRobot(g, Pz, COL.zero, 0.5, 2, false);
      // joystick command at the best robot, in its own frame: arrow = (forward, sideways) velocity, 0.5 m per m/s; arc = turning rate over 1 s
      const h = heading(Pb), ch_ = Math.cos(h), sh = Math.sin(h), vx = c[0] * ch_ - c[1] * sh, vy = c[0] * sh + c[1] * ch_, L = Math.hypot(vx, vy) * 0.5, x0 = Pb[0][0], y0 = Pb[0][1];
      g.strokeStyle = COL.cmd; g.fillStyle = COL.cmd; g.lineWidth = 2.5; g.lineCap = "round";
      if (L > 0.03) { const ux = vx / Math.hypot(vx, vy), uy = vy / Math.hypot(vx, vy), hs = Math.min(0.09, 0.45 * L); g.beginPath(); seg(g, [x0, y0, 0.004], [x0 + ux * (L - hs * 0.7), y0 + uy * (L - hs * 0.7), 0.004]); g.stroke(); arrowHead(g, x0 + ux * L, y0 + uy * L, ux, uy, hs); }
      if (Math.abs(c[2]) > 0.05) {
        const sweep = clamp(c[2], -1.6 * Math.PI, 1.6 * Math.PI), r = 0.36, a0 = h + Math.PI - sweep / 2, n = 24;
        g.beginPath(); for (let k = 0; k < n; k++) { const a = a0 + sweep * k / n, b = a0 + sweep * (k + 1) / n; seg(g, [x0 + r * Math.cos(a), y0 + r * Math.sin(a), 0.004], [x0 + r * Math.cos(b), y0 + r * Math.sin(b), 0.004]); } g.stroke();
        const a1 = a0 + sweep, s = Math.sign(sweep); arrowHead(g, x0 + r * Math.cos(a1) - Math.sin(a1) * s * 0.03, y0 + r * Math.sin(a1) + Math.cos(a1) * s * 0.03, -Math.sin(a1) * s, Math.cos(a1) * s, 0.07);
      }
      // the ball: where a robot that obeys exactly would be, at trunk height, with a stem to the floor
      const bz = 0.27, bc = cam([ball[0], ball[1], bz]);
      g.strokeStyle = COL.cmd; g.lineWidth = 1; g.globalAlpha = 0.6; g.beginPath(); seg(g, [ball[0], ball[1], 0], [ball[0], ball[1], bz]); g.stroke();
      if (bc[2] > NEAR) { const s = scr(bc); g.globalAlpha = 0.85; g.fillStyle = COL.cmd; g.beginPath(); g.arc(s[0], s[1], Math.max(3, V.foc * 0.045 / bc[2]), 0, 2 * Math.PI); g.fill(); }
      g.globalAlpha = 1;
      // best robot on top
      drawRobot(g, Pb, COL.blue, 1, 2.6, true);
      label(g, [Pb[0][0], Pb[0][1], Pb[0][2] + 0.3], d.gen === 0 ? d.id + " (all zeros)" : d.id, COL.blue);
      if (d.gen !== 0 && Math.hypot(Pz[0][0] - Pb[0][0], Pz[0][1] - Pb[0][1]) > 0.5) label(g, [Pz[0][0], Pz[0][1], Pz[0][2] + 0.3], "zero weights", COL.muted);
      // controls and readout
      scrub.value = String(Math.round(fi)); clock.textContent = `${S.t.toFixed(1)} / ${T().toFixed(0)} s`;
      const win = Math.round(1 / S.dt), m = d.best.meas, j1 = Math.min(Math.floor(fi), m.length - 1), j0 = Math.max(0, j1 - win + 1), avg = [0, 1, 2].map(k => { let a = 0; for (let j = j0; j <= j1; j++) a += m[j][k]; return a / (j1 - j0 + 1); });
      now.textContent = `t ${S.t.toFixed(1)} s · command: forward ${sgn(c[0])}, sideways ${sgn(c[1])} m/s, turn ${sgn(c[2])} rad/s · robot, last 1 s: ${sgn(avg[0])}, ${sgn(avg[1])}, ${sgn(avg[2])}`;
      playhead();
    };

    // ---- strip chart: commanded vs measured, three rows ----
    const ROWS = [["forward", 0, 1.6, "m/s"], ["sideways", 1, 0.9, "m/s"], ["turn", 2, 1.3, "rad/s"]], RH = 44, LW = 64, TOP = 4;
    let chartImg = null, chartReady = false;   // the static chart lives on an offscreen canvas; the playhead is drawn over a copy of it
    const cX = i => LW + (CW - LW - 8) * i / Math.max(1, S.N - 1);
    const drawChart = () => {
      if (!S.d || !CW) return;
      chartImg = chartImg || document.createElement("canvas"); chartImg.width = ch.width; chartImg.height = ch.height;
      const g = chartImg.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = "#ffffff"; g.fillRect(0, 0, CW, CH);
      const d = S.d;
      ROWS.forEach(([name, k, lim, unit], r) => {
        const y0 = TOP + r * RH, Y = v => y0 + RH / 2 - clamp(v / lim, -1, 1) * (RH / 2 - 4);
        g.fillStyle = COL.ink2; g.font = `11px ${SANS}`; g.textAlign = "left"; g.fillText(name, 0, y0 + RH / 2 - 1); g.fillStyle = COL.muted; g.font = `10px ${SANS}`; g.fillText(unit, 0, y0 + RH / 2 + 11);
        g.strokeStyle = COL.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(LW, Y(0) + 0.5); g.lineTo(CW - 8, Y(0) + 0.5); g.stroke();
        const line = (arr, color, w, a) => { g.globalAlpha = a; g.strokeStyle = color; g.lineWidth = w; g.lineJoin = "round"; g.beginPath(); arr.forEach((v, i) => { const x = cX(i), y = Y(v[k]); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.globalAlpha = 1; };
        line(d.cmd, COL.cmd, 6, 0.18); line(d.cmd, COL.cmd, 1.4, 1); line(d.best.meas, COL.blue, 1.2, 0.9);
      });
      g.fillStyle = COL.muted; g.font = `10px ${SANS}`; g.textAlign = "center";
      for (let s = 0; s <= 20; s += 5) g.fillText(s + " s", clamp(cX(s / S.dt), LW + 8, CW - 18), CH - 4);
      chartReady = true; playhead();
    };
    const playhead = () => {
      if (!chartReady || !S.d) return;
      const g = ch.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(chartImg, 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const x = Math.round(cX(clamp(S.t / S.dt, 0, S.N - 1))) + 0.5; g.strokeStyle = "rgba(22,24,28,.55)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 2); g.lineTo(x, TOP + 3 * RH); g.stroke();
    };

    // ---- input: drag the 3D view sideways to orbit (vertical swipes still scroll the page); tap or drag the chart to move in time ----
    let drag = null;
    cv.addEventListener("pointerdown", e => { drag = {x: e.clientX, y: e.clientY, az: S.az, el: S.el}; try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
    cv.addEventListener("pointermove", e => { if (!drag) return; S.az = drag.az - (e.clientX - drag.x) * 0.01; if (e.pointerType === "mouse") S.el = clamp(drag.el + (e.clientY - drag.y) * 0.005, 0.12, 1.25); S.dirty = true; });
    const endDrag = () => { drag = null; }; cv.addEventListener("pointerup", endDrag); cv.addEventListener("pointercancel", endDrag);
    let cdrag = false;
    const seekChart = e => { const r = ch.getBoundingClientRect(), x = e.clientX - r.left; S.t = clamp((x - LW) / (CW - LW - 8), 0, 1) * T(); S.snap = true; S.dirty = true; };
    ch.addEventListener("pointerdown", e => { cdrag = true; try { ch.setPointerCapture(e.pointerId); } catch (_) {} seekChart(e); });
    ch.addEventListener("pointermove", e => { if (cdrag) seekChart(e); });
    const endC = () => { cdrag = false; }; ch.addEventListener("pointerup", endC); ch.addEventListener("pointercancel", endC);

    // ---- loop ----
    let last = performance.now();
    const loop = t => {
      const dt = Math.min(0.1, Math.max(0, (t - last) / 1000)); last = t;
      if (S.d && S.playing && S.visible) { S.t += dt; if (S.t > T()) S.t = 0; S.dirty = true; }
      if (S.d && S.dirty && S.visible && W) { S.dirty = false; render(); }
      requestAnimationFrame(loop);
    };
    resize();
    requestAnimationFrame(loop);
    load(START_GEN);
  }

  /* ---------------- what Astra gets ---------------- */
  function astraSees(root) {
    root.classList.add("wd", "wd-astra");
    root.replaceChildren(el("p", {class: "wd-cap", text: "Loading…"}));
    getJSON(BASE + "data/astra_excerpts.json").then(d => {
      const uid = "wd-astra-" + Math.random().toString(36).slice(2, 7);
      const tabs = el("div", {class: "wd-tabs", role: "tablist", "aria-label": "What Astra gets"});
      const panel = el("div", {class: "wd-panel", role: "tabpanel", id: uid + "-panel", tabindex: "0"});
      const btns = d.tabs.map(t => el("button", {type: "button", class: "wd-tab", role: "tab", id: `${uid}-${t.key}`, "aria-controls": uid + "-panel", "aria-selected": "false", tabindex: "-1", text: t.label}));
      const show = i => {
        btns.forEach((b, k) => { b.setAttribute("aria-selected", String(k === i)); b.tabIndex = k === i ? 0 : -1; });
        const t = d.tabs[i], pre = el("pre", {class: "wd-pre" + (t.wrap ? " wrap" : "")}), lines = t.text.split("\n");
        lines.forEach((line, k) => { pre.append(t.hl.includes(k) ? el("mark", {text: line}) : line); if (k < lines.length - 1) pre.append("\n"); });
        panel.setAttribute("aria-labelledby", btns[i].id);
        panel.replaceChildren(el("p", {class: "wd-cap", text: t.caption}), pre, el("p", {class: "wd-src", text: t.src}));
      };
      btns.forEach((b, i) => {
        b.addEventListener("click", () => show(i));
        b.addEventListener("keydown", e => {
          const n = btns.length, j = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
          if (j < 0) return; e.preventDefault(); show(j); btns[j].focus();
        });
      });
      tabs.append(...btns); root.replaceChildren(tabs, panel); show(0);
    }).catch(() => root.replaceChildren(el("p", {class: "wd-cap", text: "Could not load the excerpts. Reload the page to try again."})));
  }

  const start = () => {
    const r = document.getElementById("robot-demo"); if (r) robotDemo(r);
    const a = document.getElementById("astra-sees"); if (a) astraSees(a);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
