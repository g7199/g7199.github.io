// 🍱 A storybook lunchbox on a sunlit table — painted in SVG with a crayon texture.
// Seen from slightly above and in front: top faces as-is, the box's side shows below.
// main.js calls window.initBento() once content/data.json has loaded.
window.initBento = () => {
  const { D, P, pubs, selected, awards, contacts, esc, two, eduCount, xpCount } = window.LB;
  const scene = document.getElementById("scene");

  const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const f = (n) => (+n).toFixed(1);
  const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

  /* ---------- palette ---------- */
  const K = {
    ink: "#3b2f27", soft: "#7d6f63", paper: "#f6eedd", paperLine: "#dccbab",
    rim: "#c6965f", rimHi: "#e6c18f", rimLine: "#7a522d",
    well: "#e6cda3", wellBack: "#c7a06d", divTop: "#d8b07b",
    terra: "#a95b3a", sage: "#6f8a5a",
  };
  const shadow = (cx, cy, rx, ry, op = 0.3) =>
    `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="#3a1a08" opacity="${op}" filter="url(#blur4)"/>`;
  const crayon = (inner) => `<g filter="url(#crayon)">${inner}</g>`;

  /* =========================================================
     DISHES
     ========================================================= */

  // 🍚 Rice — densely packed grains, a soft mound, gomashio, a wrinkled umeboshi, takuan on shiso
  const shisoLeaf = (L, W, seed) => {
    const r = rng(seed);
    const n = 12;
    let top = `M${-L} 0`, bot = "";
    for (let i = 1; i <= n; i++) {
      const t = i / n, x = -L + t * 2 * L, w = Math.sin(Math.PI * t) * W;
      top += ` L${f(x - L / n / 2)} ${f(-w - 3 - r() * 2)} L${f(x)} ${f(-w + 1)}`;
    }
    for (let i = n; i >= 0; i--) {
      const t = i / n, x = -L + t * 2 * L, w = Math.sin(Math.PI * t) * W;
      bot += ` L${f(x + L / n / 2)} ${f(w + 3 + r() * 2)} L${f(x)} ${f(w - 1)}`;
    }
    let veins = `<path d="M${-L + 4} 0 Q0 -3 ${L - 4} 0" stroke="#a7cf86" stroke-width="2" fill="none"/>`;
    for (let i = 1; i < 6; i++) {
      const x = -L + (i / 6) * 2 * L, w = Math.sin((Math.PI * i) / 6) * W * 0.8;
      veins += `<path d="M${f(x)} -1 Q${f(x + 10)} ${f(-w * 0.5)} ${f(x + 18)} ${f(-w)} M${f(x)} 1 Q${f(x + 10)} ${f(w * 0.5)} ${f(x + 18)} ${f(w)}" stroke="#9cc77c" stroke-width="1.1" fill="none" opacity=".8"/>`;
    }
    return `<path d="${top}${bot}Z" fill="url(#leafGrad)" stroke="#3d6b2b" stroke-width="1.3" stroke-linejoin="round"/>${veins}`;
  };
  // smooth closed curve through points (Catmull-Rom → cubic Bézier)
  const closedCurve = (pts) => {
    const N = pts.length;
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < N; i++) {
      const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + "Z";
  };

  // ---- tiny 2.5D helpers shared by the dishes drawn "in the box's view" ----
  // same view as the box: higher things move up and (on the left side of the box) left
  const KX3 = 0.95, SZ3 = 0.55;
  const proj3 = (X, Y, Z) => [X - Z * KX3, Y - Z * SZ3];
  // rounded rectangle outline as dense points, with a lumpy edge
  const roundRectPts = (w, h, rad, jit, seed2) => {
    const q = rng(seed2), pts = [];
    const add = (x, y, nx, ny) => { const j = (q() - 0.5) * jit; pts.push([x + nx * j, y + ny * j]); };
    for (let x = rad; x < w - rad; x += 6) add(x, 0, 0, -1);
    for (let k = 0; k <= 8; k++) { const a2 = -Math.PI / 2 + (k / 8) * (Math.PI / 2); add(w - rad + Math.cos(a2) * rad, rad + Math.sin(a2) * rad, Math.cos(a2), Math.sin(a2)); }
    for (let y = rad; y < h - rad; y += 6) add(w, y, 1, 0);
    for (let k = 0; k <= 8; k++) { const a2 = (k / 8) * (Math.PI / 2); add(w - rad + Math.cos(a2) * rad, h - rad + Math.sin(a2) * rad, Math.cos(a2), Math.sin(a2)); }
    for (let x = w - rad; x > rad; x -= 6) add(x, h, 0, 1);
    for (let k = 0; k <= 8; k++) { const a2 = Math.PI / 2 + (k / 8) * (Math.PI / 2); add(rad + Math.cos(a2) * rad, h - rad + Math.sin(a2) * rad, Math.cos(a2), Math.sin(a2)); }
    for (let y = h - rad; y > rad; y -= 6) add(0, y, -1, 0);
    for (let k = 0; k <= 8; k++) { const a2 = Math.PI + (k / 8) * (Math.PI / 2); add(rad + Math.cos(a2) * rad, rad + Math.sin(a2) * rad, Math.cos(a2), Math.sin(a2)); }
    return pts;
  };
  // keep the part of a polygon between two vertical lines; cut edges stay straight and dense
  const clipX = (pts, xa, xb) => {
    const cut = (P, keep, X) => {
      const out = [];
      for (let i = 0; i < P.length; i++) {
        const A = P[i], B = P[(i + 1) % P.length], ia = keep(A[0]), ib = keep(B[0]);
        if (ia) out.push(A);
        if (ia !== ib) { const t = (X - A[0]) / (B[0] - A[0]); out.push([X, A[1] + (B[1] - A[1]) * t]); }
      }
      return out;
    };
    let P = cut(pts, (x) => x >= xa, xa);
    P = cut(P, (x) => x <= xb, xb);
    const dense = [];
    P.forEach((A, i) => {
      const B = P[(i + 1) % P.length];
      dense.push(A);
      const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
      if (len > 9) for (let t = 7; t < len - 4; t += 7) dense.push([A[0] + ((B[0] - A[0]) * t) / len, A[1] + ((B[1] - A[1]) * t) / len]);
    });
    return dense;
  };
  const movePts = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);

  // 🥢 Tonkatsu — ONE organic cutlet (rounded, a little wavy), cut into slices pulled slightly apart.
  //    Sides are rounded like a real fried cutlet; each inner slice shows its pink cut face on the right.
  const tonkatsuArt = (c) => {
    const r = rng(17);
    const { x0, y0, x1, y1 } = c;
    const H = 30, n = 4, g = 15, Re = H * 0.42;
    const xl = x0 + 3 + H * KX3, yb = y0 + 3 + H * SZ3, D = (y1 - 4) - yb;
    const w = ((x1 - 2) - xl - (n - 1) * g) / n, Wt = n * w;
    // organic outline: a soft superellipse with gentle waves and a shaggy crumb edge
    const q0 = rng(905), outline = [];
    for (let k = 0; k < 120; k++) {
      const t = (k / 120) * Math.PI * 2, ct = Math.cos(t), st = Math.sin(t), pw = 7;
      const rr = 1 / Math.pow(Math.pow(Math.abs(ct), pw) + Math.pow(Math.abs(st), pw), 1 / pw);
      const wav = 1 + 0.012 * Math.sin(2 * t + 1.1) + 0.01 * Math.sin(3 * t + 2.3) + 0.008 * Math.sin(5 * t);
      let x = Wt / 2 + (Wt / 2) * rr * ct * wav, y = D / 2 + (D / 2) * rr * st * (wav + 0.02 * Math.sin(4 * t));
      x += (y / D - 0.5) * 4;
      const jj = (q0() - 0.5) * 3;
      outline.push([x + ct * jj, y + st * jj]);
    }
    const insetAt = (z) => { const e = Math.abs(z - H / 2), flat = H / 2 - Re; return e <= flat ? 0 : Re - Math.sqrt(Math.max(0, Re * Re - (e - flat) ** 2)); };
    const flakes = (bx, by, bw, bh, count) => {
      let o = "";
      for (let k = 0; k < count; k++) {
        const px = bx + r() * bw, py = by + r() * bh, sz = 1.1 + r() * 2.2, v = 3 + Math.floor(r() * 3), t = r();
        let poly = "";
        for (let q2 = 0; q2 < v; q2++) { const an = (q2 / v) * 6.283 + r() * 1.1, rr = sz * (0.55 + r() * 0.7); poly += `${f(px + Math.cos(an) * rr)},${f(py + Math.sin(an) * rr * 0.75)} `; }
        const col = t < 0.45 ? "#f8d48a" : t < 0.75 ? "#efbb5f" : t < 0.9 ? "#fde7b4" : "#c98432";
        o += `<polygon points="${poly}" fill="#7a3f10" opacity=".55" transform="translate(.8 1.1)"/><polygon points="${poly}" fill="${col}"/>`;
      }
      for (let k = 0; k < count / 14; k++) o += `<circle cx="${f(bx + r() * bw)}" cy="${f(by + r() * bh)}" r="${f(0.5 + r() * 0.5)}" fill="#fff" opacity=".9"/>`;
      return o;
    };
    // tonkatsu sauce, drizzled from a bottle in a zigzag across the whole cutlet.
    // It lies on each slice's top, breaks where the slices were pulled apart,
    // and only runs down where a stroke crosses the front edge.
    const openCurve = (pts) => {
      let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
        d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
      }
      return d;
    };
    const rz = rng(77), zig = [];
    for (let X = -16, k = 0; X <= Wt + 16; X += 21 + rz() * 4, k++) zig.push([X, D * (k % 2 ? 0.86 : 0.16) + (rz() - 0.5) * D * 0.06, k % 2]);
    const sauceLayers = (d, w) => `
      <path d="${d}" stroke="#5a2a10" stroke-width="${f(w + 6)}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".28" filter="url(#blur2)"/>
      <path d="${d}" stroke="#3b1405" stroke-width="${f(w + 1.4)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${d}" stroke="url(#katsuSauce)" stroke-width="${f(w)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${d}" stroke="#d29a6a" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".65" stroke-dasharray="14 9 30 12" transform="translate(-1 -1.6)"/>`;
    const sauceOn = (j, poly, offX, offY, xa, xb) => {
      const sx = offX - H * KX3, sy = yb + offY - H * SZ3;
      const line = openCurve(zig.map(([X, Y]) => [X + sx, Y + sy]));
      let o = `<g clip-path="url(#kTop${j})">${sauceLayers(line, 6.5)}`;
      // a few sesame seeds caught in the sauce
      for (let k = 0; k < 4; k++) {
        const X = xa + 8 + rz() * (xb - xa - 16), Y = D * (0.25 + rz() * 0.5);
        o += `<ellipse cx="${f(X + sx)}" cy="${f(Y + sy)}" rx="2.4" ry="1.2" fill="#f4e7c6" stroke="#a88f60" stroke-width=".4" transform="rotate(${f(rz() * 180)} ${f(X + sx)} ${f(Y + sy)})"/>`;
      }
      o += `</g>`;
      // runs over the front edge, down the rounded side
      zig.forEach(([X, , front], k) => {
        if (!front || X < xa + 7 || X > xb - 7 || (k * 7 + j) % 3 === 0) return;
        const near = poly.filter(([x]) => Math.abs(x - X) < 6);
        if (!near.length) return;
        const yf = Math.max(...near.map(([, y]) => y));
        const top3 = [X + offX - H * KX3, yb + offY + yf - Re - H * SZ3];
        const len = 0.38 + ((k * 13 + j * 5) % 7) * 0.05;
        const z2 = H * (1 - len);
        const bot3 = [X + offX - z2 * KX3, yb + offY + yf - z2 * SZ3 + 2];
        const run = `M${f(top3[0])} ${f(top3[1])} Q${f((top3[0] + bot3[0]) / 2 + 1.5)} ${f((top3[1] + bot3[1]) / 2)} ${f(bot3[0])} ${f(bot3[1])}`;
        o += sauceLayers(run, 5.6) + `<circle cx="${f(bot3[0])}" cy="${f(bot3[1] + 1)}" r="4.1" fill="url(#katsuSauce)" stroke="#3b1405" stroke-width=".7"/>
          <ellipse cx="${f(bot3[0] - 1.3)}" cy="${f(bot3[1] - 0.4)}" rx="1.1" ry="1.7" fill="#fff" opacity=".7"/>`;
      });
      return o;
    };

    let s = "<!--LIFT-->";                       // no garnish: the cutlet fills the compartment
    for (let j = 0; j < n; j++) {
      const xa = j * w, xb = (j + 1) * w, offX = xl + j * g + [0, 1, -1, 1][j], offY = [0, 3, -1, 2][j];
      const poly = clipX(outline, xa, xb);
      const cx = poly.reduce((a2, p2) => a2 + p2[0], 0) / poly.length, cy = poly.reduce((a2, p2) => a2 + p2[1], 0) / poly.length;
      const onCut = ([x]) => (j > 0 && Math.abs(x - xa) < 0.5) || (j < n - 1 && Math.abs(x - xb) < 0.5);
      // the slice's outline at height z: pulled in near top and bottom so the sides are rounded
      const layer = (z) => {
        const ins = insetAt(z);
        return poly.map((p2) => {
          if (onCut(p2)) return [p2[0], p2[1] + Math.sign(cy - p2[1]) * ins];
          const dx = p2[0] - cx, dy = p2[1] - cy, dl = Math.hypot(dx, dy) || 1;
          return [p2[0] - (dx / dl) * ins, p2[1] - (dy / dl) * ins];
        });
      };
      const at = (z) => closedCurve(movePts(layer(z), offX - z * KX3, yb + offY - z * SZ3));
      s += `<path d="${at(0)}" fill="#2a1004" opacity=".35" transform="translate(4 5)" filter="url(#blur4)"/>`;
      let body = "";
      for (let k = 0; k <= 12; k++) body += `<path d="${at((H * k) / 12)}" fill="url(#katsuFront)"/>`;
      s += `<g filter="url(#panko)">${body}</g>`;
      // rounded pink cut face
      if (j < n - 1) {
        const ys = poly.filter(([x]) => Math.abs(x - xb) < 0.5).map(([, y]) => y);
        const ya = Math.min(...ys), yz = Math.max(...ys), X = offX + xb;
        const P = (y, z) => proj3(X, yb + offY + y, z).map(f).join(" ");
        const prof = (pad) => {
          const pts2 = [];
          for (let k = 0; k <= 10; k++) { const z = pad + ((H - 2 * pad) * k) / 10; pts2.push(P(ya + insetAt(z) + pad * 1.2, z)); }
          for (let k = 10; k >= 0; k--) { const z = pad + ((H - 2 * pad) * k) / 10; pts2.push(P(yz - insetAt(z) - pad * 1.2, z)); }
          return "M" + pts2.join(" L") + "Z";
        };
        let fib = "";
        for (let k = 0; k < 5; k++) {
          const zz = H * (0.28 + k * 0.11);
          fib += `<path d="M${P(ya + 16 + r() * 10, zz)} L${P(yz - 16 - r() * 10, zz + (r() - 0.5) * 2)}" stroke="${k % 2 ? "#fbe9e1" : "#d18c7c"}" stroke-width=".8" opacity=".35"/>`;
        }
        s += `<path d="${prof(0)}" fill="#c98432" stroke="#8e4c16" stroke-width=".8" stroke-linejoin="round" filter="url(#panko)"/>
          <path d="${prof(4.5)}" fill="url(#porkSide)" stroke="#e6ad9c" stroke-width="1.2" stroke-linejoin="round"/>${fib}
          <path d="M${P(ya + 14, H - 7)} L${P(yz - 14, H - 7)}" stroke="#fdf1ea" stroke-width="2" opacity=".65" stroke-linecap="round"/>`;
      }
      // top crust
      const topD = at(H), T0 = proj3(offX + xa, yb + offY, H);
      s += `<path d="${topD}" fill="url(#katsuCrust)" filter="url(#panko)"/>
        <clipPath id="kTop${j}"><path d="${topD}"/></clipPath>
        <g clip-path="url(#kTop${j})">${flakes(T0[0] - 4, T0[1] - 4, w + 8, D + 8, 340)}<rect x="${f(T0[0] - 6)}" y="${f(T0[1] - 6)}" width="${f(w + 12)}" height="${f(D + 12)}" fill="url(#katsuShade)"/></g>
        <path d="${topD}" fill="none" stroke="#a5611f" stroke-width=".9" opacity=".4"/>`;
      s += sauceOn(j, poly, offX, offY, xa, xb);
    }
    return s;
  };

  // 🐟 Grilled salmon (Experience) — two glossy fillets with silver skin, a lemon wedge on shiso
  const salmonFillet = (x, y, sc, rot, seed) => {
    const r = rng(seed);
    const body = "M-88 -16 C-80 -42 -10 -50 40 -44 C72 -40 92 -26 90 -6 L86 26 C60 40 -40 44 -84 30 C-92 18 -92 -2 -88 -16Z";
    let flakes = "", sear = "", gloss = "";
    for (let i = -3; i <= 3; i++) {
      const fx = i * 24 + (r() - 0.5) * 6;
      flakes += `<path d="M${f(fx - 8)} -40 Q${f(fx + 12)} -6 ${f(fx - 2)} 32" stroke="#fde4d2" stroke-width="3.4" fill="none" opacity=".85" stroke-linecap="round"/>
        <path d="M${f(fx + 4)} -40 Q${f(fx + 22)} -6 ${f(fx + 10)} 32" stroke="#f6b597" stroke-width="1.4" fill="none" opacity=".6" stroke-linecap="round"/>`;
    }
    for (let i = 0; i < 7; i++) sear += `<ellipse cx="${f(-70 + r() * 150)}" cy="${f(-36 + r() * 18)}" rx="${f(8 + r() * 14)}" ry="${f(4 + r() * 5)}" fill="#a24d22" opacity="${f(0.22 + r() * 0.2)}" filter="url(#blur3)"/>`;
    for (let i = 0; i < 5; i++) sear += `<ellipse cx="${f(-60 + r() * 130)}" cy="${f(-30 + r() * 22)}" rx="${f(2 + r() * 3)}" ry="${f(1.5 + r() * 1.5)}" fill="#5e2a12" opacity=".4"/>`;
    for (let i = 0; i < 8; i++) gloss += `<ellipse cx="${f(-60 + r() * 120)}" cy="${f(-30 + r() * 40)}" rx="${f(2 + r() * 4)}" ry="${f(1 + r() * 1.2)}" fill="#fff" opacity="${f(0.5 + r() * 0.35)}"/>`;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${sc})">
      <ellipse cx="4" cy="34" rx="92" ry="14" fill="#2a0f04" opacity=".38" filter="url(#blur6)"/>
      <path d="M-84 30 C-40 44 60 40 86 26 L84 38 C58 52 -42 56 -86 42Z" fill="url(#salmonSkin)" stroke="#33363c" stroke-width="1.2"/>
      <path d="M-70 40 C-30 50 40 48 74 36" stroke="#c9ced8" stroke-width="1.6" fill="none" opacity=".7"/>
      <path d="${body}" fill="url(#salmonFlesh)" stroke="#c4532e" stroke-width="1.4"/>
      <g clip-path="url(#salmonClip)">${flakes}${sear}</g>
      <ellipse cx="-30" cy="-26" rx="40" ry="9" fill="#fff" opacity=".22" filter="url(#blur3)"/>
      ${gloss}
    </g>`;
  };
  const lemonWedge = (x, y, sc, rot) => {
    let seg = "";
    for (let i = 1; i < 6; i++) { const a = Math.PI * (i / 6); seg += `<path d="M0 0 L${f(-Math.cos(a) * 25)} ${f(-Math.sin(a) * 25)}" stroke="#fff7cf" stroke-width="2" opacity=".9"/>`; }
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${sc})">
      ${shadow(3, 6, 34, 6, 0.3)}
      <path d="M-34 0 A34 34 0 0 1 34 0Z" fill="#e8bf25" stroke="#c99a12" stroke-width="1.4"/>
      <path d="M-29 0 A29 29 0 0 1 29 0Z" fill="#fbf3cf"/>
      <path d="M-26 0 A26 26 0 0 1 26 0Z" fill="url(#lemonPulp)"/>
      ${seg}
      <path d="M-30 -9 Q-22 -24 -6 -28" stroke="#fff" stroke-width="2.4" fill="none" opacity=".7" stroke-linecap="round"/>
    </g>`;
  };
  // two thick pieces of grilled salmon lying flat — same 2.5D view as the tonkatsu
  const salmonArt = (c) => {
    const r = rng(81);
    const { x0, y0, x1, y1 } = c;
    let s = lettuceBed(c, 81) + "<!--LIFT-->";
    const H = 22;
    const piece = (bx, by, w, h, skew, seed2) => {
      const outline = roundRectPts(w, h, 26, 1.6, seed2).map(([x, y]) => [x + (y / h - 0.5) * skew + Math.sin((y / h) * Math.PI) * 6, y]);
      const at = (z) => closedCurve(movePts(outline, bx - z * KX3, by - z * SZ3));
      let o = `<path d="${at(0)}" fill="#2a1004" opacity=".32" transform="translate(3 4)" filter="url(#blur4)"/>`;
      // body: silver skin at the bottom, flaky orange flesh above
      for (let k = 0; k <= 8; k++) {
        const z = (H * k) / 8;
        o += `<path d="${at(z)}" fill="${k <= 1 ? "url(#salmonSkin)" : "url(#salmonSide)"}"/>`;
      }
      // flake lines running round the sides
      [0.38, 0.62, 0.84].forEach((q) => { o += `<path d="${at(H * q)}" fill="none" stroke="#fde1d0" stroke-width="1.6" opacity=".75"/>`; });
      o += `<path d="${at(H * 0.24)}" fill="none" stroke="#d9dee6" stroke-width="1.2" opacity=".7"/>`;
      // top: glossy flesh with curved white fat lines and grill marks
      const topD = at(H), T = proj3(bx, by, H), id = `sTop${seed2}`;
      let det = "";
      for (let k = 1; k <= 6; k++) {
        const yy = T[1] + (k / 7) * h, bow = 10 + r() * 6;
        det += `<path d="M${f(T[0] - 10)} ${f(yy)} Q${f(T[0] + w * 0.5)} ${f(yy + bow)} ${f(T[0] + w + 20)} ${f(yy - 2)}" stroke="#fde6d8" stroke-width="${f(2.4 + r() * 1.2)}" fill="none" opacity=".85"/>
          <path d="M${f(T[0] - 10)} ${f(yy + 3)} Q${f(T[0] + w * 0.5)} ${f(yy + bow + 3)} ${f(T[0] + w + 20)} ${f(yy + 1)}" stroke="#d86a45" stroke-width="1" fill="none" opacity=".5"/>`;
      }
      for (let k = 0; k < 6; k++) det += `<ellipse cx="${f(T[0] + 10 + r() * (w - 10))}" cy="${f(T[1] + 8 + r() * (h - 16))}" rx="${f(10 + r() * 14)}" ry="${f(5 + r() * 6)}" fill="#a8461f" opacity="${f(0.22 + r() * 0.18)}" filter="url(#blur3)"/>`;
      for (let k = 0; k < 14; k++) det += `<circle cx="${f(T[0] + 8 + r() * (w - 8))}" cy="${f(T[1] + 6 + r() * (h - 12))}" r="${f(0.8 + r() * 1.2)}" fill="#5e2410" opacity=".5"/>`;
      det += `<ellipse cx="${f(T[0] + w * 0.32)}" cy="${f(T[1] + h * 0.26)}" rx="${f(w * 0.28)}" ry="${f(h * 0.12)}" fill="#fff" opacity=".22" filter="url(#blur3)"/>`;
      for (let k = 0; k < 7; k++) det += `<ellipse cx="${f(T[0] + 10 + r() * (w - 20))}" cy="${f(T[1] + 8 + r() * (h * 0.6))}" rx="${f(2 + r() * 3)}" ry="1.1" fill="#fff" opacity="${f(0.55 + r() * 0.3)}"/>`;
      o += `<path d="${topD}" fill="url(#salmonFlesh)" stroke="#c4532e" stroke-width="1"/>
        <clipPath id="${id}"><path d="${topD}"/></clipPath><g clip-path="url(#${id})">${det}</g>`;
      return o;
    };
    s += piece(x0 + 14 + H * KX3, y0 + 18 + H * SZ3, 122, 112, 10, 951);
    s += piece(x0 + 160 + H * KX3, y0 + 28 + H * SZ3, 106, 104, -8, 952);
    s += `<g transform="translate(${x1 - 46} ${y1 - 34}) rotate(-20)">${shisoLeaf(44, 19, 12)}</g>`;
    s += lemonWedge(x1 - 40, y1 - 30, 0.9, -24);
    return s;
  };

  // 🍣 Kimbap — one roll laid down and sliced: nori with a sesame-oil sheen, seeds on top,
  //    and only a thin line of rice showing at each cut
  const kimbapArt = (c) => {
    const r = rng(11);
    const { x0, y0, x1, y1 } = c;
    const yTop = y0 + 30, H = y1 - y0 - 44, yBot = yTop + H;
    const k = Math.max(5, Math.round((x1 - x0) / 46));
    const sw = (x1 - x0 + 20) / k;
    let s = lettuceBed(c, 13);
    s += `<rect x="${x0}" y="${f(yBot - 10)}" width="${x1 - x0}" height="20" fill="#120804" opacity=".5" filter="url(#blur4)"/>` + "<!--LIFT-->";
    for (let i = 0; i < k; i++) {
      const x = x0 - 10 + i * sw + (r() - 0.5) * 2, dy = (r() - 0.5) * 4, rot = (r() - 0.5) * 2.4;
      const t = yTop + dy, b = yBot + dy, w = sw - 2;
      const body = `M${f(x)} ${f(t + 10)} Q${f(x + w / 2)} ${f(t - 8)} ${f(x + w)} ${f(t + 10)} L${f(x + w)} ${f(b - 10)} Q${f(x + w / 2)} ${f(b + 8)} ${f(x)} ${f(b - 10)}Z`;
      let det = "";
      for (let j = 0; j < 2; j++) {
        const fx = x + 8 + r() * (w - 20), fy = t + 20 + r() * (H - 44);
        det += `<path d="M${f(fx)} ${f(fy)} q${f(3 + r() * 3)} ${f(10 + r() * 8)} ${f(1 + r() * 3)} ${f(20 + r() * 10)}" stroke="#617261" stroke-width="1" fill="none" opacity=".22"/>`;
      }
      for (let j = 0; j < 7; j++) {
        const sx = x + 7 + r() * (w - 14), sy = t + 8 + r() * H * 0.62, a = r() * 180;
        det += `<g transform="translate(${f(sx)} ${f(sy)}) rotate(${f(a)})"><ellipse cx=".7" cy="1" rx="2.6" ry="1.4" fill="#000" opacity=".4"/><ellipse rx="2.6" ry="1.4" fill="#f1e5c3"/><ellipse cx="-.9" cy="-.4" rx=".9" ry=".4" fill="#fff"/></g>`;
      }
      s += `<g transform="rotate(${f(rot)} ${f(x + w / 2)} ${f((t + b) / 2)})">
        <path d="${body}" fill="url(#noriLog)" stroke="#0a0c0a" stroke-width="1.2"/>
        <path d="M${f(x + 1)} ${f(t + H * 0.1)} Q${f(x - 2.5)} ${f(t + H / 2)} ${f(x + 1)} ${f(b - H * 0.1)} Q${f(x + 3.2)} ${f(t + H / 2)} ${f(x + 1)} ${f(t + H * 0.1)}Z" fill="#f3ede1"/>
        <circle cx="${f(x - 0.4)}" cy="${f(t + H * 0.46)}" r="1.4" fill="${["#e8b440", "#d9763a", "#5f8a3c"][i % 3]}"/>
        <path d="M${f(x + 3)} ${f(t + 8)} L${f(x + 3)} ${f(b - 8)}" stroke="#000" stroke-width="2" opacity=".35"/>
        ${det}
      </g>`;
    }
    // one soft sesame-oil sheen across the whole roll + a few sparkles
    s += `<rect x="${x0}" y="${f(yTop + H * 0.12)}" width="${x1 - x0}" height="${f(H * 0.22)}" fill="url(#sheen)" filter="url(#blur3)"/>
      <rect x="${x0}" y="${f(yTop + H * 0.62)}" width="${x1 - x0}" height="${f(H * 0.38)}" fill="url(#rollCore)"/>`;
    for (let i = 0; i < 12; i++) s += `<circle cx="${f(x0 + 10 + r() * (x1 - x0 - 20))}" cy="${f(yTop + H * (0.14 + r() * 0.14))}" r="${f(0.8 + r() * 1.2)}" fill="#fff" opacity="${f(0.6 + r() * 0.3)}"/>`;
    return s;
  };

  // 🥬 lettuce bed
  const lettuceBed = (c, seed) => {
    const r = rng(seed);
    const { x0, y0, x1, y1 } = c;
    let d = `M${x0 - 10} ${y1 + 10} L${x0 - 10} ${y0 + 16}`;
    const n = Math.round((x1 - x0) / 24);
    for (let i = 0; i < n; i++) {
      const xa = x0 + ((i + 0.5) / n) * (x1 - x0), xb = x0 + ((i + 1) / n) * (x1 - x0);
      d += ` Q${f(xa)} ${f(y0 - 6 - r() * 8)} ${f(xb)} ${f(y0 + 10 + r() * 8)}`;
    }
    d += ` L${x1 + 10} ${y1 + 10}Z`;
    let veins = "";
    for (let i = 0; i < (x1 - x0) / 44; i++) {
      const x = x0 + 20 + i * 44 + r() * 12;
      veins += `<path d="M${f(x)} ${y1} Q${f(x + 10)} ${f((y0 + y1) / 2)} ${f(x + 4)} ${f(y0 + 16)}" stroke="#d9e8b0" stroke-width="1.6" fill="none" opacity=".35"/>`;
    }
    return `<path d="${d}" fill="url(#lettuce)" stroke="#4f7034" stroke-width="2"/>${veins}`;
  };

  // 🥚 Tamagoyaki — three slices leaned against each other, rolled layers on the cut face
  const tamagoSlice = (x, base, w, h, seed) => {
    const r = rng(seed);
    const top = base - h;
    // rolled layers: a squircle spiral from the center outward
    const cx = x + w * 0.5, cy = top + h * 0.52, turns = 2.6, steps = 200;
    let pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, th = t * turns * Math.PI * 2 + 0.6;
      const k = 0.1 + 0.8 * t;
      const cs = Math.cos(th), sn = Math.sin(th);
      const px = Math.sign(cs) * Math.pow(Math.abs(cs), 0.6), py = Math.sign(sn) * Math.pow(Math.abs(sn), 0.6);
      pts.push(`${f(cx + px * k * w * 0.44 + (r() - 0.5) * 0.6)} ${f(cy + py * k * h * 0.4)}`);
    }
    const spiral = `M${pts.join(" L")}`;
    let pores = "";
    for (let i = 0; i < 16; i++) pores += `<circle cx="${f(x + 12 + r() * (w - 24))}" cy="${f(top + 12 + r() * (h - 24))}" r="${f(0.8 + r() * 1.3)}" fill="#fff8dc" opacity=".7"/>`;
    const layers = `<path d="${spiral}" fill="none" stroke="#e3ad48" stroke-width="1.5" opacity=".5" stroke-linejoin="round"/>
      <path d="${spiral}" fill="none" stroke="#fff6d6" stroke-width="1" opacity=".6" transform="translate(1.4 1.2)"/>${pores}`;
    let sear = "";
    for (let i = 0; i < 6; i++) sear += `<ellipse cx="${f(x + 18 + r() * (w - 20))}" cy="${f(top - 6 + r() * 10)}" rx="${f(6 + r() * 8)}" ry="${f(3 + r() * 3)}" fill="#9c5a1a" opacity="${f(0.25 + r() * 0.2)}" filter="url(#blur2)"/>`;
    return `
      ${shadow(x + w / 2 + 8, base + 2, w * 0.6, 8, 0.4)}
      <rect x="${f(x + 12)}" y="${f(top - 14)}" width="${f(w)}" height="${f(h)}" rx="22" fill="url(#eggCrust)" stroke="#a96d24" stroke-width="2"/>
      ${sear}
      <rect x="${f(x)}" y="${f(top)}" width="${f(w)}" height="${f(h)}" rx="22" fill="url(#eggCut)" stroke="#d29634" stroke-width="2.6"/>
      <rect x="${f(x + 3)}" y="${f(top + 3)}" width="${f(w - 6)}" height="${f(h - 6)}" rx="19" fill="none" stroke="#eab64c" stroke-width="4" opacity=".55"/>
      ${layers}
      <ellipse cx="${f(x + w * 0.3)}" cy="${f(top + h * 0.22)}" rx="${f(w * 0.2)}" ry="8" fill="#fff" opacity=".45" filter="url(#blur2)"/>
      <path d="M${f(x + 14)} ${f(top + 12)} Q${f(x + w * 0.3)} ${f(top + 6)} ${f(x + w * 0.5)} ${f(top + 8)}" stroke="#fff" stroke-width="2.4" fill="none" opacity=".8" stroke-linecap="round"/>`;
  };
  const tamagoArt = (c) => {
    const { x0, y1 } = c;
    let s = lettuceBed(c, 21) + "<!--LIFT-->";
    const w = 104, h = 98;
    s += tamagoSlice(x0 + 86, y1 - 36, w, h, 31);
    s += tamagoSlice(x0 + 46, y1 - 20, w, h, 32);
    s += tamagoSlice(x0 + 8, y1 - 4, w, h, 33);
    return s;
  };

  // 🌭 Sausage & veggie stir-fry — one glossy heap: diagonal-cut sausage, pepper strips, onion
  const sausagePiece = (x, y, rot, sc) => `
    <g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(sc)})">
      <ellipse cx="2" cy="12" rx="20" ry="5" fill="#3a0f05" opacity=".35" filter="url(#blur2)"/>
      <path d="M-14 -12 L12 -12 Q20 -12 18 0 Q16 12 8 12 L-14 12 Q-22 12 -22 0 Q-22 -12 -14 -12Z" fill="url(#sausBody)" stroke="#7d2c18" stroke-width="1.3"/>
      <ellipse cx="13" cy="0" rx="7.5" ry="11.6" transform="rotate(12 13 0)" fill="url(#sausCut)" stroke="#b9553c" stroke-width="1.1"/>
      <path d="M-20 4 Q-6 10 10 6" stroke="#8a2a17" stroke-width="3" fill="none" opacity=".35" stroke-linecap="round"/>
      <path d="M-15 -7 Q-4 -10 7 -8.5" stroke="#fff" stroke-width="2.4" fill="none" opacity=".75" stroke-linecap="round"/>
      <circle cx="9" cy="-8.5" r="1.3" fill="#fff" opacity=".85"/>
    </g>`;
  const pepperStrip = (x, y, rot, sc, col) => `
    <g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(sc)})">
      <ellipse cx="1" cy="7" rx="11" ry="3" fill="#3a0f05" opacity=".3" filter="url(#blur2)"/>
      <path d="M-11 -7 Q0 -11 11 -6 L10 2 Q0 -1 -10 3Z" fill="${col[1]}"/>
      <path d="M-11 -4 Q0 -9 11 -3 L10 6 Q0 2 -10 7Z" fill="${col[0]}" stroke="${col[1]}" stroke-width="1.1"/>
      <path d="M-7 -4 Q0 -7 7 -3" stroke="${col[2]}" stroke-width="1.6" fill="none" opacity=".9" stroke-linecap="round"/>
      <path d="M-11 -4 Q0 -9 11 -3 L10 6 Q0 2 -10 7Z" fill="#a33a1e" opacity=".18"/>
    </g>`;
  const onionSliver = (x, y, rot, sc) => `
    <g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(sc)})">
      <path d="M-13 5 Q-12 -8 0 -9 Q12 -8 13 5 Q0 -1 -13 5Z" fill="#f0d6a8" stroke="#c99a62" stroke-width="1.1"/>
      <path d="M-8 2 Q-7 -5 0 -5.5 Q7 -5 8 2" stroke="#fff4dc" stroke-width="1.4" fill="none" opacity=".8"/>
      <path d="M-13 5 Q-12 -8 0 -9 Q12 -8 13 5 Q0 -1 -13 5Z" fill="#c4562f" opacity=".2"/>
    </g>`;
  const stirFryArt = (c) => {
    const r = rng(57);
    const { x0, y0, x1, y1 } = c;
    let d = `M${x0 - 6} ${y1 + 12} L${x0 - 4} ${y0 + 20}`;
    const n = Math.round((x1 - x0) / 34);
    for (let i = 0; i < n; i++) {
      const xa = x0 + ((i + 0.5) / n) * (x1 - x0), xb = x0 + ((i + 1) / n) * (x1 - x0);
      d += ` Q${f(xa)} ${f(y0 - 4 - r() * 8)} ${f(xb)} ${f(y0 + 10 + r() * 8)}`;
    }
    d += ` L${x1 + 6} ${y1 + 12}Z`;
    let s = lettuceBed(c, 49) + `<rect x="${x0}" y="${y0 + 24}" width="${x1 - x0}" height="${y1 - y0}" fill="#3a1408" opacity=".35" filter="url(#blur4)"/>` + "<!--LIFT-->" + `<path d="${d}" fill="url(#stirSauce)"/>`;
    for (let i = 0; i < 16; i++) s += `<ellipse cx="${f(x0 + 10 + r() * (x1 - x0 - 20))}" cy="${f(y0 + 30 + r() * (y1 - y0 - 30))}" rx="${f(10 + r() * 14)}" ry="${f(5 + r() * 6)}" fill="#5a1a0c" opacity=".25" filter="url(#blur2)"/>`;
    const pieces = [];
    const cw = 42, ch = 28;
    for (let gy = y0 + 10; gy < y1 + 10; gy += ch) for (let gx = x0 - 8; gx < x1 + 8; gx += cw) {
      const x = gx + r() * cw, y = gy + r() * ch, t = r(), rot = -50 + r() * 100, sc = 1.12 + r() * 0.3;
      pieces.push([y, t < 0.55 ? sausagePiece(x, y, rot, sc)
        : t < 0.75 ? pepperStrip(x, y, rot, sc, ["#4e8b2e", "#2f5e1a", "#93c866"])
        : t < 0.85 ? pepperStrip(x, y, rot, sc, ["#eab133", "#a7761a", "#fadb83"])
        : onionSliver(x, y, rot, sc)]);
    }
    pieces.sort((a, b) => a[0] - b[0]).forEach(([, p]) => (s += p));
    for (let i = 0; i < 18; i++) {
      const x = x0 + 18 + r() * (x1 - x0 - 36), y = y0 + 24 + r() * (y1 - y0 - 34);
      s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="1.4" fill="#f5e8c8" stroke="#a88f60" stroke-width=".4" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})"/>`;
    }
    return s;
  };

  // 🍓 🍇 Dessert — real-looking strawberries (one halved) and a bunch of grapes in a paper cup
  const BERRY = "M0 -24 C13 -26 26 -18 26 -4 C26 11 15 24 3 31 C0 32.5 -3 32 -5 30.5 C-17 24 -26 10 -26 -4 C-26 -18 -13 -26 0 -24Z";
  const berryHalfW = (y) => (y < -24 || y > 31 ? 0 : y <= -4 ? 26 * Math.sqrt(Math.max(0, 1 - ((y + 4) / 22) ** 2)) : 26 * (1 - ((y + 4) / 36) ** 1.6));
  const calyx = (seed) => {
    const r = rng(seed);
    let g = "";
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.42 + (r() - 0.5) * 0.25, L = 15 + r() * 7;
      const tx = Math.cos(a + Math.PI) * L * -1, ty = Math.sin(a) * L * 0.55 - 24;
      const nx = -Math.sin(a) * 3.2, ny = Math.cos(a) * 3.2 * 0.55;
      g += `<path d="M${f(nx)} ${f(-24 + ny)} Q${f(tx * 0.5 + nx * 1.4)} ${f((ty - 24) / 2 + ny)} ${f(tx)} ${f(ty)} Q${f(tx * 0.5 - nx * 1.4)} ${f((ty - 24) / 2 - ny)} ${f(-nx)} ${f(-24 - ny)}Z" fill="url(#sepal)" stroke="#2c5a1f" stroke-width=".9"/>
        <path d="M0 -24 Q${f(tx * 0.5)} ${f((ty - 24) / 2)} ${f(tx * 0.85)} ${f(-24 + (ty + 24) * 0.85)}" stroke="#9cd07a" stroke-width=".9" fill="none" opacity=".8"/>`;
    }
    return g + `<path d="M0 -25 Q2 -33 6 -37" stroke="#5c8a3a" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M0.6 -26 Q2.4 -32 5.4 -35.5" stroke="#a8d07c" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
  };
  const strawberry = (x, y, s, rot, seed) => {
    const r = rng(seed);
    let seeds = "", spark = "";
    for (let j = 0; j < 8; j++) {
      const yy = -17 + j * 6.2, hw = berryHalfW(yy) - 3;
      if (hw < 3) continue;
      const cnt = Math.max(1, Math.round((hw * 2) / 7.2));
      for (let k = 0; k < cnt; k++) {
        const u = cnt === 1 ? 0 : (k / (cnt - 1)) * 2 - 1;
        const xx = u * hw + (j % 2 ? 1.8 : -1.8) + (r() - 0.5) * 1.2;
        const edge = Math.abs(xx) / (hw + 3), sx = 1 - edge * 0.55, op = 1 - edge * 0.5;
        seeds += `<g transform="translate(${f(xx)} ${f(yy + (r() - 0.5) * 1.4)}) scale(${f(sx)} 1)" opacity="${f(op)}">
          <ellipse rx="2.3" ry="2.9" fill="#7a0e1d" opacity=".42"/><ellipse cx=".2" cy=".3" rx="1" ry="1.5" fill="#f2cf72"/><circle cx="-1.6" cy="-1.8" r=".7" fill="#fff" opacity=".75"/></g>`;
      }
    }
    for (let i = 0; i < 9; i++) spark += `<circle cx="${f(-16 + r() * 18)}" cy="${f(-16 + r() * 22)}" r="${f(0.6 + r() * 0.8)}" fill="#fff" opacity="${f(0.6 + r() * 0.35)}"/>`;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${s})">
      <ellipse cx="3" cy="6" rx="24" ry="28" fill="#3a0a08" opacity=".32" filter="url(#blur4)"/>
      <path d="${BERRY}" fill="url(#berryBody)" stroke="#8a1424" stroke-width="1.2"/>
      <ellipse cx="0" cy="-19" rx="19" ry="7" fill="#f59a62" opacity=".35" filter="url(#blur2)"/>
      <path d="M14 -14 C22 -6 22 8 10 22" stroke="#ff8f86" stroke-width="2.4" fill="none" opacity=".35" stroke-linecap="round"/>
      ${seeds}
      <ellipse cx="-10" cy="-8" rx="7" ry="11" fill="#fff" opacity=".3" filter="url(#blur2)" transform="rotate(20 -10 -8)"/>
      ${spark}
      ${calyx(seed + 7)}
    </g>`;
  };
  const strawberryHalf = (x, y, s, rot, seed) => {
    const r = rng(seed);
    let rim = "", fib = "";
    for (let i = 0; i < 22; i++) {
      const t = i / 21, yy = -22 + t * 50, hw = berryHalfW(yy) - 1.6;
      [-1, 1].forEach((sd) => (rim += `<ellipse cx="${f(sd * hw)}" cy="${f(yy)}" rx=".9" ry="1.3" fill="#f2cf72" opacity=".9"/>`));
    }
    for (let i = 0; i < 14; i++) {
      const yy = -16 + i * 3.4, hw = berryHalfW(yy) - 4;
      [-1, 1].forEach((sd) => (fib += `<path d="M${f(sd * 3)} ${f(yy)} Q${f(sd * hw * 0.6)} ${f(yy + 2)} ${f(sd * hw)} ${f(yy + 3)}" stroke="#f7c2c2" stroke-width=".9" fill="none" opacity=".6"/>`));
    }
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${s})">
      <ellipse cx="3" cy="6" rx="24" ry="28" fill="#3a0a08" opacity=".28" filter="url(#blur4)"/>
      <path d="${BERRY}" fill="url(#berryCut)" stroke="#b31b2c" stroke-width="2.2"/>
      ${fib}
      <path d="M0 -20 C6 -10 5 10 1 24 C-3 10 -6 -10 0 -20Z" fill="#fff4f1" opacity=".9"/>
      ${rim}
      <ellipse cx="-8" cy="-6" rx="6" ry="10" fill="#fff" opacity=".35" filter="url(#blur2)"/>
      <circle cx="-12" cy="-10" r="1.2" fill="#fff" opacity=".9"/><circle cx="-6" cy="4" r=".9" fill="#fff" opacity=".8"/>
      <path d="M-14 -25 Q-6 -31 0 -25 Q6 -31 14 -25 Q6 -27 0 -23 Q-6 -27 -14 -25Z" fill="#3f7a2c" stroke="#2c5a1f" stroke-width=".8"/>
    </g>`;
  };
  const grape = (x, y, R, green, rot) => `
    <g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">
      <ellipse cx="2" cy="${f(R * 0.6)}" rx="${f(R * 0.9)}" ry="${f(R * 0.5)}" fill="#1f0a1c" opacity=".3" filter="url(#blur3)"/>
      <ellipse rx="${f(R * 0.9)}" ry="${f(R)}" fill="url(#${green ? "muscat" : "grapeP"})" stroke="${green ? "#7c9a33" : "#2a1236"}" stroke-width="1" stroke-opacity=".6"/>
      ${green
        ? `<path d="M${f(-R * 0.2)} ${f(-R * 0.9)} Q${f(-R * 0.45)} 0 ${f(-R * 0.2)} ${f(R * 0.9)} M${f(R * 0.25)} ${f(-R * 0.88)} Q${f(R * 0.48)} 0 ${f(R * 0.25)} ${f(R * 0.88)}" stroke="#f1f8c4" stroke-width=".9" fill="none" opacity=".55"/>`
        : `<ellipse rx="${f(R * 0.9)}" ry="${f(R)}" fill="url(#bloom)" opacity=".28"/>`}
      <path d="M${f(R * 0.25)} ${f(R * 0.82)} Q${f(R * 0.78)} ${f(R * 0.45)} ${f(R * 0.82)} ${f(-R * 0.05)}" stroke="${green ? "#f3fac4" : "#a78ad0"}" stroke-width="1.8" fill="none" opacity=".55" stroke-linecap="round"/>
      <ellipse cx="${f(-R * 0.36)}" cy="${f(-R * 0.45)}" rx="${f(R * 0.2)}" ry="${f(R * 0.11)}" fill="#fff" opacity=".9" transform="rotate(-35 ${f(-R * 0.36)} ${f(-R * 0.45)})"/>
      <circle cx="${f(-R * 0.12)}" cy="${f(-R * 0.62)}" r="${f(R * 0.05)}" fill="#fff" opacity=".8"/>
    </g>`;
  const paperCup = (c) => {
    const { x0, y0, x1, y1 } = c;
    let pleats = "";
    for (let x = x0 + 6; x < x1; x += 8) pleats += `<path d="M${x} ${y0 + 2} l1 14" stroke="#e2bdb7" stroke-width="1.2"/><path d="M${x} ${y1 - 2} l1 -14" stroke="#e2bdb7" stroke-width="1.2"/>`;
    for (let y = y0 + 8; y < y1; y += 8) pleats += `<path d="M${x0 + 2} ${y} l14 1" stroke="#e2bdb7" stroke-width="1.2"/><path d="M${x1 - 2} ${y} l-14 1" stroke="#e2bdb7" stroke-width="1.2"/>`;
    return `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="#f4dcd7"/>${pleats}
      <rect x="${x0 + 16}" y="${y0 + 16}" width="${x1 - x0 - 32}" height="${y1 - y0 - 32}" rx="10" fill="#f8e9e5"/>`;
  };
  const dessertArt = (c) => {
    const r = rng(71);
    const { x0, y0 } = c;
    let s = paperCup(c) + "<!--LIFT-->";
    // grape bunch: stems first, then grapes back to front
    s += `<path d="M${x0 + 18} ${y0 + 12} Q${x0 + 60} ${y0 + 2} ${x0 + 104} ${y0 + 16} Q${x0 + 126} ${y0 + 22} ${x0 + 144} ${y0 + 14}" stroke="#7a6436" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="M${x0 + 18} ${y0 + 12} Q${x0 + 60} ${y0 + 2} ${x0 + 104} ${y0 + 16}" stroke="#b49a5c" stroke-width="1.2" fill="none" opacity=".7"/>`;
    const P = [];
    [[24, [32, 64, 96, 128]], [50, [18, 48, 80, 112, 142]], [78, [32, 64, 96, 126]], [104, [48, 80, 110]], [126, [64, 94]]]
      .forEach(([yy, xs]) => xs.forEach((xx) => P.push([x0 + xx + (r() - 0.5) * 8, y0 + yy + (r() - 0.5) * 6, 16 + r() * 2.5, false, r() * 40 - 20])));
    [[160, 98], [188, 92], [206, 118], [174, 124], [150, 132], [200, 146]]
      .forEach(([xx, yy]) => P.push([x0 + xx + (r() - 0.5) * 4, y0 + yy, 17 + r() * 2, true, r() * 30 - 15]));
    P.sort((a, b) => a[1] - b[1]).forEach(([x, y, R, g, rot]) => (s += grape(x, y, R, g, rot)));
    // mint
    s += `<g transform="translate(${x0 + 26} ${y0 + 150}) rotate(-30)">
      <path d="M0 0 C-14 -10 -18 -24 -6 -28 C2 -20 4 -10 0 0Z" fill="#5f9c4a" stroke="#2f5d22" stroke-width="1.1"/>
      <path d="M0 0 C13 -11 27 -9 27 3 C18 7 9 5 0 0Z" fill="#6aab52" stroke="#2f5d22" stroke-width="1.1"/>
      <path d="M0 0 L-5 -26 M0 0 L25 2" stroke="#a8d48e" stroke-width="1"/></g>`;
    // strawberries, tumbled — one cut in half
    [["w", 58, 172, 1.32, -62, 1], ["h", 150, 176, 1.28, -18, 2], ["w", 108, 206, 1.36, 14, 3], ["w", 190, 210, 1.26, 74, 4]]
      .sort((a, b) => a[2] - b[2])
      .forEach(([k, xx, yy, sc, rot, sd]) => (s += k === "h" ? strawberryHalf(x0 + xx, y0 + yy, sc, rot, 90 + sd) : strawberry(x0 + xx, y0 + yy, sc, rot, 90 + sd)));
    return s;
  };

  /* =========================================================
     BENTO PICKS (little paper flags = the menu)
     ========================================================= */
  const pick = ({ key, x, y, rot, title, num, sub, scale = 1 }) => {
    const w = Math.max(134, (title.length + 3) * 12.5 + 24, sub ? sub.length * 6.4 + 26 : 0), h = sub ? 58 : 44;
    return `<g class="hit sticker" data-open="${key}" tabindex="-1" aria-hidden="true" transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${scale})">
      <line x1="18" y1="${h - 4}" x2="36" y2="${h + 44}" stroke="#2a160c" stroke-width="4" opacity=".22" filter="url(#blur2)" transform="translate(5 5)"/>
      <rect x="3" y="5" width="${w}" height="${h}" rx="2" fill="#2a160c" opacity=".22" filter="url(#blur3)"/>
      ${crayon(`<line x1="16" y1="${h - 6}" x2="34" y2="${h + 40}" stroke="#c9a273" stroke-width="3.5" stroke-linecap="round"/>
        <rect width="${w}" height="${h}" rx="2" fill="${K.paper}" stroke="${K.paperLine}" stroke-width="1.5"/>`)}
      <text x="12" y="31" class="t-hand t-bold" font-size="28" fill="${K.ink}">${esc(title)}<tspan font-size="28" fill="${K.terra}" dx="7">${num}</tspan></text>
      ${sub ? `<text x="12" y="49" class="t-sans" font-size="11.5" fill="${K.soft}">${esc(sub)}</text>` : ""}
    </g>`;
  };

  /* ---------- barcode ---------- */
  const barcode = (text, x, y, w, h, color = K.ink) => {
    let hsh = 0;
    for (const ch of text) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0;
    const r = rng(hsh || 1);
    const widths = [];
    let total = 0;
    for (let i = 0; i < 52; i++) { const bw = 1 + Math.floor(r() * 3); widths.push(bw); total += bw; }
    const k = w / total;
    let cx = x, s = "";
    widths.forEach((bw, i) => { if (i % 2 === 0) s += `<rect x="${f(cx)}" y="${f(y)}" width="${f(bw * k)}" height="${h}" fill="${color}"/>`; cx += bw * k; });
    return s;
  };

  /* ---------- the label on the side of the box (= About) ---------- */
  const LABEL_W = 300, LABEL_H = 78;
  const productLabel = (x, y, scale, rot = 0) => {
    const w = LABEL_W, h = LABEL_H;
    return `
    <g class="hit sticker" data-open="about" tabindex="0" role="button" aria-label="Open About"
       transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${scale})">
      <rect x="1.5" y="3" width="${w}" height="${h}" rx="3" fill="#000" opacity=".26" filter="url(#blur3)"/>
      ${crayon(`<rect width="${w}" height="${h}" rx="3" fill="${K.paper}" stroke="${K.paperLine}" stroke-width="1.2"/>
        <circle cx="${w - 32}" cy="${h / 2}" r="17" fill="none" stroke="${K.terra}" stroke-width="1.6" opacity=".6"/>`)}
      <text x="22" y="24" class="t-sans" font-size="8.5" fill="${K.soft}" letter-spacing="2.6">RESEARCH BENTO</text>
      <line x1="22" y1="31" x2="40" y2="31" stroke="${K.terra}" stroke-width="1.2" opacity=".7"/>
      <text x="22" y="51" class="t-serif" font-size="17" font-weight="500" fill="${K.ink}" letter-spacing=".2">${esc(P.name)}</text>
      <text x="22" y="66" class="t-sans" font-size="10" fill="${K.soft}">${esc(truncate(`${P.role} · ${P.affiliation}`, 44))}</text>
      <g transform="rotate(-10 ${w - 32} ${h / 2})" opacity=".75">
        <text x="${w - 32}" y="${h / 2 - 1}" class="t-sans" font-weight="600" font-size="7" fill="${K.terra}" text-anchor="middle" letter-spacing="1">FRESH</text>
        <text x="${w - 32}" y="${h / 2 + 8}" class="t-sans" font-weight="600" font-size="7" fill="${K.terra}" text-anchor="middle" letter-spacing="1">TODAY</text>
      </g>
    </g>`;
  };

  /* =========================================================
     THE BOX
     ========================================================= */
  // the bed (rice, lettuce, paper cup) stays put; only the food on top lifts on hover
  const food = (key, label, inner) => {
    const [bed, rest = ""] = inner.split("<!--LIFT-->");
    const [items, plain = ""] = rest.split("<!--PLAIN-->");
    return `<g class="hit" data-open="${key}" tabindex="0" role="button" aria-label="${label}"><g clip-path="url(#clip-${key})">
      <g class="bed">${crayon(bed)}</g><g class="lift">${crayon(items)}${plain}</g></g></g>`;
  };

  const bentoBox = ({ fh = 120, pickScale = 1, subs = true, label = true }) => {
    const BW = 940, TH = 470;
    const X0 = 26, X1 = BW - 26, Y0 = 22, Y1 = TH - 26;
    const VA = 332, HB = 202, VC = 706, VD = 686, HL = 258, h6 = 6;
    const C = {
      education: { x0: X0, y0: Y0, x1: VA - h6, y1: HL - h6 },
      experience: { x0: X0, y0: HL + h6, x1: VA - h6, y1: Y1 },
      papers: { x0: VA + h6, y0: Y0, x1: VC - h6, y1: HB - h6 },
      skills: { x0: VC + h6, y0: Y0, x1: X1, y1: HB - h6 },
      projects: { x0: VA + h6, y0: HB + h6, x1: VD - h6, y1: Y1 },
      awards: { x0: VD + h6, y0: HB + h6, x1: X1, y1: Y1 },
    };
    let s = "";

    s += `<ellipse cx="${BW / 2}" cy="${TH + fh - 4}" rx="${BW / 2 + 18}" ry="36" fill="#3a1a08" opacity=".4" filter="url(#blur12)"/>`;
    let shell = `<rect x="0" y="40" width="${BW}" height="${TH + fh - 40}" rx="34" fill="url(#sideGrad)" stroke="${K.rimLine}" stroke-width="3"/>
      <rect x="0" y="40" width="${BW}" height="${TH + fh - 40}" rx="34" fill="url(#woodGrain)" opacity=".55"/>
      <rect x="0" y="0" width="${BW}" height="${TH}" rx="34" fill="${K.rim}" stroke="${K.rimLine}" stroke-width="3"/>
      <rect x="0" y="0" width="${BW}" height="${TH}" rx="34" fill="url(#woodGrain)" opacity=".45"/>
      <rect x="3" y="3" width="${BW - 6}" height="${TH - 6}" rx="31" fill="none" stroke="${K.rimHi}" stroke-width="2"/>
      <path d="M40 6 H${BW * 0.45}" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>
      <rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" rx="16" fill="${K.well}"/>`;
    Object.values(C).forEach(({ x0, y0, x1, y1 }) => {
      shell += `<g clip-path="url(#wellClip)"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${K.well}"/>
        <rect x="${x0}" y="${y0}" width="${x1 - x0}" height="20" fill="${K.wellBack}"/>
        <rect x="${x0}" y="${y0 + 20}" width="${x1 - x0}" height="12" fill="url(#backFade)"/></g>`;
    });
    s += crayon(shell);

    s += food("education", "Open Education", tonkatsuArt(C.education));
    s += food("papers", "Open Publications", kimbapArt(C.papers));
    s += food("skills", "Open Skills", tamagoArt(C.skills));

    const vDiv = (x, y0, y1) => `<rect x="${x - h6}" y="${y0}" width="12" height="${y1 - y0}" fill="${K.divTop}" stroke="#9c7244" stroke-width="1.2"/>`;
    s += crayon(vDiv(VA, Y0, Y1) + vDiv(VC, Y0, HB) +
      `<rect x="${VA}" y="${HB - h6}" width="${X1 - VA}" height="12" fill="${K.divTop}" stroke="#9c7244" stroke-width="1.2"/>
       <rect x="${VA}" y="${HB + 5}" width="${X1 - VA}" height="7" fill="#b98a55"/>
       <rect x="${X0}" y="${HL - h6}" width="${VA - X0}" height="12" fill="${K.divTop}" stroke="#9c7244" stroke-width="1.2"/>
       <rect x="${X0}" y="${HL + 5}" width="${VA - X0}" height="7" fill="#b98a55"/>`);

    s += food("experience", "Open Experience", salmonArt(C.experience));
    s += food("projects", "Open Projects", stirFryArt(C.projects));
    s += food("awards", "Open Awards", dessertArt(C.awards));
    s += crayon(vDiv(VD, HB, Y1));

    s += crayon(`<path clip-path="url(#frontRimClip)" fill-rule="evenodd" fill="${K.rim}" stroke="${K.rimLine}" stroke-width="3"
      d="M34 0 H${BW - 34} A34 34 0 0 1 ${BW} 34 V${TH - 34} A34 34 0 0 1 ${BW - 34} ${TH} H34 A34 34 0 0 1 0 ${TH - 34} V34 A34 34 0 0 1 34 0Z
         M${X0 + 16} ${Y0} H${X1 - 16} A16 16 0 0 1 ${X1} ${Y0 + 16} V${Y1 - 16} A16 16 0 0 1 ${X1 - 16} ${Y1} H${X0 + 16} A16 16 0 0 1 ${X0} ${Y1 - 16} V${Y0 + 16} A16 16 0 0 1 ${X0 + 16} ${Y0}Z"/>
      <path d="M4 ${TH - 30} Q6 ${TH - 4} 34 ${TH - 3} H${BW - 34} Q${BW - 6} ${TH - 4} ${BW - 4} ${TH - 30}" stroke="${K.rimHi}" stroke-width="2" fill="none"/>`);

    // one continuous outline all the way round: outer edge of the box and inner edge of the well
    s += crayon(`<path fill="none" stroke="${K.rimLine}" stroke-width="3" stroke-linejoin="round"
      d="M34 0 H${BW - 34} A34 34 0 0 1 ${BW} 34 V${TH - 34} A34 34 0 0 1 ${BW - 34} ${TH} H34 A34 34 0 0 1 0 ${TH - 34} V34 A34 34 0 0 1 34 0Z"/>
      <path fill="none" stroke="${K.rimLine}" stroke-width="2.4" stroke-linejoin="round"
      d="M${X0 + 16} ${Y0} H${X1 - 16} A16 16 0 0 1 ${X1} ${Y0 + 16} V${Y1 - 16} A16 16 0 0 1 ${X1 - 16} ${Y1} H${X0 + 16} A16 16 0 0 1 ${X0} ${Y1 - 16} V${Y0 + 16} A16 16 0 0 1 ${X0 + 16} ${Y0}Z"/>`);

    // the menu, as bento picks
    const topPub = selected[0] || pubs[0];
    const proj = D.projects.find((p) => p.featured) || D.projects[0];
    s += pick({ key: "education", x: 42, y: 34, rot: 0, title: "Education", num: two(eduCount), sub: subs ? "crispy tonkatsu" : "", scale: pickScale });
    s += pick({ key: "experience", x: 42, y: 272, rot: 0, title: "Experience", num: two(xpCount), sub: subs ? "research · work · teaching" : "", scale: pickScale });
    s += pick({ key: "papers", x: 354, y: 34, rot: 0, title: "Papers", num: two(pubs.length), sub: subs ? `kimbap${selected.length ? ` · ${selected.length} selected` : topPub ? ` · ${topPub.venue}` : ""}` : "", scale: pickScale });
    s += pick({ key: "skills", x: 726, y: 34, rot: 0, title: "Skills", num: two(D.skills.length), sub: subs ? "rolled omelette" : "", scale: pickScale });
    s += pick({ key: "projects", x: 354, y: 216, rot: 0, title: "Projects", num: two(D.projects.length), sub: subs ? "sausage & veggie stir-fry" : "", scale: pickScale });
    s += pick({ key: "awards", x: 706, y: 216, rot: 0, title: "Awards", num: two(awards.length), sub: subs ? "something sweet" : "", scale: pickScale });

    s += `<g transform="translate(${BW - 92} ${TH + fh / 2 + 4})" opacity=".55" pointer-events="none">
      <circle r="30" fill="none" stroke="#5a3519" stroke-width="2.2"/><circle r="24" fill="none" stroke="#5a3519" stroke-width="1"/>
      <text y="-2" class="t-hand t-bold" font-size="20" fill="#5a3519" text-anchor="middle">LB</text>
      <text y="13" class="t-sans" font-size="7.5" fill="#5a3519" text-anchor="middle" letter-spacing="1.2">EST. 2017</text></g>
      <path d="M8 ${TH + 8} H${BW - 8}" stroke="#e7c697" stroke-width="2" opacity=".55"/>`;
    if (label) s += productLabel(36, TH + (fh - LABEL_H) / 2 + 1, 1);
    else s += `<text x="${BW / 2}" y="${TH + fh / 2 + 8}" class="t-hand" font-size="30" fill="#7b6f66" text-anchor="middle">Lunchbox Mart</text>`;

    const clip = (k, c, up) => `<clipPath id="clip-${k}"><rect x="${c.x0}" y="${c.y0 - up}" width="${c.x1 - c.x0}" height="${c.y1 - c.y0 + up}"/></clipPath>`;
    const R = C.education;
    const defs = `
      <clipPath id="wellClip"><rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" rx="16"/></clipPath>
      <clipPath id="riceClip"><rect x="${R.x0}" y="${R.y0 + 3}" width="${R.x1 - R.x0}" height="${R.y1 - R.y0}"/></clipPath>
      <clipPath id="salmonClip"><path d="M-88 -16 C-80 -42 -10 -50 40 -44 C72 -40 92 -26 90 -6 L86 26 C60 40 -40 44 -84 30 C-92 18 -92 -2 -88 -16Z"/></clipPath>
      ${clip("education", C.education, 0)}${clip("experience", C.experience, 30)}${clip("papers", C.papers, 12)}${clip("skills", C.skills, 12)}${clip("projects", C.projects, 30)}${clip("awards", C.awards, 30)}
      <clipPath id="frontRimClip"><rect x="-10" y="${Y0 + 100}" width="${BW + 20}" height="${TH}"/></clipPath>`;
    return { svg: s, defs, w: BW, h: TH + fh };
  };

  /* ---------- 🧾 the receipt (= News) ---------- */
  const wrap = (text, cols) => {
    const out = [];
    let line = "";
    text.split(/\s+/).forEach((word) => {
      if ((line + " " + word).trim().length > cols && line) { out.push(line); line = word; }
      else line = (line + " " + word).trim();
    });
    if (line) out.push(line);
    return out;
  };
  const NEWS_KIND = { paper: "PAPER", project: "PROJECT", academic: "ACADEMIC", award: "AWARD", career: "CAREER" };
  const receipt = (x, y, rot, scale) => {
    const RW = 300, LH = 19, FS = 13.5;
    const mod = new Date(document.lastModified);
    const date = `${mod.getFullYear()}-${two(mod.getMonth() + 1)}-${two(mod.getDate())}`;
    let yy = 38, t = "";
    const line = (txt, opts = {}) => {
      const { x: lx = 18, anchor = "start", size = FS, bold = false, color = K.ink } = opts;
      t += `<text x="${lx}" y="${yy}" class="t-mono" font-weight="${bold ? 700 : 400}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(txt)}</text>`;
    };
    const dash = () => { t += `<line x1="16" x2="${RW - 16}" y1="${yy - 6}" y2="${yy - 6}" stroke="#b5ab9e" stroke-dasharray="4 3"/>`; yy += 12; };
    line("LUNCHBOX MART", { x: RW / 2, anchor: "middle", size: 18, bold: true }); yy += 18;
    line("research bentos · since 2017", { x: RW / 2, anchor: "middle", size: 11, color: K.soft }); yy += 22;
    line(date, { size: 11, color: K.soft }); line(`No.${two(D.news.length)}${two(pubs.length)}`, { x: RW - 18, anchor: "end", size: 11, color: K.soft }); yy += 18;
    dash();
    line("TODAY'S NEWS", { bold: true }); yy += LH + 6;
    const shown = D.news.slice(0, 5), more = D.news.length - shown.length;
    shown.forEach((n) => {
      line(n.when, { size: 11.5, color: K.soft });
      if (n.kind) line(NEWS_KIND[n.kind] || String(n.kind).toUpperCase(), { x: RW - 18, anchor: "end", size: 11, bold: true, color: K.terra });
      yy += LH - 3;
      wrap(n.text, 33).forEach((l) => { line(l, { x: 18, size: 12.5 }); yy += LH - 2; });
      yy += 9;
    });
    if (more > 0) { line(`+ ${more} more · tap to see all`, { x: RW / 2, anchor: "middle", size: 11.5, color: K.soft }); yy += LH + 2; }
    yy += 2; dash();
    line("TOTAL", { bold: true, size: 14.5 }); line(`${two(D.news.length)} items`, { x: RW - 18, anchor: "end", bold: true, size: 14.5 }); yy += LH;
    line("papers / projects", { size: 11, color: K.soft }); line(`${two(pubs.length)} / ${two(D.projects.length)}`, { x: RW - 18, anchor: "end", size: 11, color: K.soft }); yy += 16;
    dash();
    t += barcode("news" + date, 22, yy - 4, RW - 44, 40); yy += 60;
    line("thank you, come again :)", { x: RW / 2, anchor: "middle", size: 11.5, color: K.soft }); yy += 16;
    const RH = yy;
    let zig = `M0 0 H${RW} V${RH}`;
    for (let zx = RW; zx > 0; zx -= 12) zig += ` L${zx - 6} ${RH + 8} L${zx - 12} ${RH}`;
    zig += "Z";
    return {
      h: (RH + 10) * scale,
      svg: `<g class="hit sticker" data-open="news" tabindex="0" role="button" aria-label="Open News"
         transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${scale})">
        <path d="${zig}" fill="#2a160c" opacity=".22" transform="translate(6 10)" filter="url(#blur6)"/>
        ${crayon(`<path d="${zig}" fill="#fbf7ef" stroke="#e2d9c8" stroke-width="1.5"/>`)}
        ${t}
      </g>`,
    };
  };

  /* ---------- 🥢 chopsticks in a paper sleeve (= Contact) ---------- */
  const chopsticks = (x, y, rot, len, scale = 1) => {
    const email = (D.contact || {}).email || "";
    return `
    <g class="hit sticker" data-open="contact" tabindex="0" role="button" aria-label="Open Contact"
       transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${scale})">
      <rect x="6" y="16" width="${len + 96}" height="60" rx="8" fill="#2a160c" opacity=".25" filter="url(#blur6)"/>
      ${crayon(`<rect x="${len - 12}" y="12" width="122" height="14" rx="7" fill="#d8b789" stroke="#a9875a" stroke-width="1.2"/>
        <rect x="${len - 12}" y="38" width="112" height="14" rx="7" fill="#cda877" stroke="#a9875a" stroke-width="1.2"/>
        <rect x="0" y="0" width="${len}" height="64" rx="3" fill="#f6f1e5" stroke="#ddd2bf" stroke-width="1.5"/>
        <rect x="${len - 80}" y="0" width="7" height="64" fill="${K.sage}"/>
        ${[0, 1, 2].map((i) => `<circle cx="${30 + i * 20}" cy="32" r="6" fill="${K.ink}"/>`).join("")}`)}
      <text x="104" y="31" class="t-hand t-bold" font-size="31" fill="${K.ink}">say hello</text>
      ${email ? `<text x="104" y="51" class="t-sans" font-size="13.5" fill="${K.soft}">${esc(email)}</text>` : ""}
      <text x="${len - 96}" y="38" class="t-sans" font-size="13" fill="${K.soft}" text-anchor="end">${esc(contacts.map(([l]) => l).join(" · "))}</text>
    </g>`;
  };

  /* ---------- 🌼 storybook details on the table ---------- */
  const daisy = (x, y, s, rot) => `
    <g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})" pointer-events="none">
      ${crayon(`<path d="M0 0 Q20 30 8 70" stroke="#5d8a3e" stroke-width="3" fill="none"/>
      <path d="M10 34 q16 -8 22 4 q-14 6 -22 -4Z" fill="#6d9a4a"/>
      ${Array.from({ length: 12 }, (_, i) => `<ellipse cx="0" cy="-12" rx="4" ry="11" fill="#fffdf6" stroke="#e5dccb" stroke-width="1" transform="rotate(${i * 30})"/>`).join("")}
      <circle r="7" fill="#efbf3a" stroke="#c9952a" stroke-width="1.2"/>
      <circle cx="-2" cy="-2" r="2.4" fill="#fbe08a"/>`)}
    </g>`;
  const leafShadows = (cx, cy, seed, n = 14) => {
    const r = rng(seed);
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = cx + (r() - 0.5) * 360, y = cy + (r() - 0.5) * 220, a = r() * 180, L = 34 + r() * 30;
      s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(L)}" ry="${f(L * 0.38)}" transform="rotate(${f(a)} ${f(x)} ${f(y)})"/>`;
    }
    s += `<path d="M${cx - 200} ${cy - 120} Q${cx} ${cy - 20} ${cx + 220} ${cy + 130}" stroke="#4a3a1e" stroke-width="10" fill="none"/>`;
    return `<g class="leafy" fill="#4a3a1e" opacity=".11" filter="url(#blurLeaf)" pointer-events="none">${s}</g>`;
  };
  const napkin = (x, y, w, h, rot) => `
    <g transform="translate(${f(x)} ${f(y)}) rotate(${rot})" pointer-events="none">
      <rect x="6" y="12" width="${w}" height="${h}" rx="6" fill="#3a2a14" opacity=".14" filter="url(#blur6)"/>
      ${crayon(`<rect width="${w}" height="${h}" rx="6" fill="#dfe3dc"/>
        <rect width="${w}" height="${h}" rx="6" fill="url(#gingham)"/>
        <rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="3" fill="none" stroke="#b8c4bd" stroke-width="1.5" stroke-dasharray="5 4"/>
        <path d="M${w - 120} ${h} L${w} ${h - 120} L${w} ${h} Z" fill="#ccd3cb"/>
        <path d="M${w - 120} ${h} L${w} ${h - 120}" stroke="#aab7b0" stroke-width="2"/>`)}
    </g>`;
  const teacup = (x, y, s) => `
    <g transform="translate(${f(x)} ${f(y)}) scale(${s})">
      ${shadow(6, 34, 78, 16, 0.25)}
      ${crayon(`<ellipse cx="0" cy="22" rx="78" ry="30" fill="#efe8da" stroke="#cdbfa5" stroke-width="2"/>
        <ellipse cx="0" cy="18" rx="58" ry="20" fill="#e3d9c6"/>
        <path d="M38 -2 C64 -6 70 20 40 21" stroke="#cdbfa5" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M38 -2 C64 -6 70 20 40 21" stroke="#f4efe4" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M-46 -8 L-40 26 Q0 44 40 26 L46 -8Z" fill="#f4efe4" stroke="#cdbfa5" stroke-width="2"/>
        <path d="M-44 4 Q0 18 44 4" stroke="#9fb7c2" stroke-width="5" fill="none" opacity=".8"/>
        <ellipse cx="0" cy="-8" rx="46" ry="16" fill="#f8f4ec" stroke="#cdbfa5" stroke-width="2"/>
        <ellipse cx="0" cy="-7" rx="40" ry="12.5" fill="url(#tea)"/>
        <ellipse cx="-12" cy="-11" rx="13" ry="3.4" fill="#fff" opacity=".45"/>`)}
      ${[-16, 0, 16].map((dx, i) => `<path class="steam" style="animation-delay:${i * 0.9}s" d="M${dx} -26 q-8 -14 0 -26 q8 -12 0 -26" stroke="#fffaf0" stroke-width="4" fill="none" stroke-linecap="round" opacity=".0"/>`).join("")}
    </g>`;
  // a little paper speech bubble centred on cx, with a tail pointing at (tx, ty).
  // Its width is fitted to the real text width after render (see fitBubbles).
  const BUBBLE_H = 48;
  const bubblePath = (cx, y, w, tx, ty) => {
    const h = BUBBLE_H, r = h / 2, L = cx - w / 2, R = cx + w / 2;
    return `M${f(L + r)} ${y} H${f(R - r)} A${r} ${r} 0 0 1 ${f(R - r)} ${y + h} H${f(L + 50)} L${tx} ${ty} L${f(L + 30)} ${y + h} H${f(L + r)} A${r} ${r} 0 0 1 ${f(L + r)} ${y}Z`;
  };
  const bubble = (cx, y, text, tx, ty) => {
    const w = Math.round(text.length * 8 + 48);
    return `<g class="bubble" data-cx="${cx}" data-y="${y}" data-tx="${tx}" data-ty="${ty}">
      <path class="bb-shadow" d="${bubblePath(cx + 3, y + 5, w, tx + 3, ty + 5)}" fill="#2a160c" opacity=".16" filter="url(#blur3)"/>
      ${crayon(`<path class="bb-body" d="${bubblePath(cx, y, w, tx, ty)}" fill="${K.paper}" stroke="${K.paperLine}" stroke-width="1.5" stroke-linejoin="round"/>`)}
      <text x="${cx}" y="${y + BUBBLE_H / 2 + 8}" class="t-hand t-bold" font-size="23" fill="${K.ink}" text-anchor="middle">${esc(text)}</text>
    </g>`;
  };
  const fitBubbles = () => scene.querySelectorAll(".bubble").forEach((g) => {
    const t = g.querySelector("text");
    const tw = t.getComputedTextLength ? t.getComputedTextLength() : 0;
    if (!tw) return;
    const [cx, y, tx, ty] = ["cx", "y", "tx", "ty"].map((k) => +g.dataset[k]);
    const w = tw + 52;
    g.querySelector(".bb-body").setAttribute("d", bubblePath(cx, y, w, tx, ty));
    g.querySelector(".bb-shadow").setAttribute("d", bubblePath(cx + 3, y + 5, w, tx + 3, ty + 5));
  });
  const motes = (x0, y0, w, h, seed, n = 12) => {
    const r = rng(seed);
    let s = "";
    for (let i = 0; i < n; i++) s += `<circle class="mote" style="animation-delay:${f(r() * 6)}s;animation-duration:${f(6 + r() * 5)}s" cx="${f(x0 + r() * w)}" cy="${f(y0 + r() * h)}" r="${f(1.5 + r() * 2.2)}" fill="#fff8e2"/>`;
    return `<g pointer-events="none">${s}</g>`;
  };

  /* =========================================================
     DEFS + SCENE
     ========================================================= */
  const defsFor = (ppu) => {
    const gf = Math.min(0.9, Math.max(0.36, 0.6 * ppu)), wf = Math.min(0.06, (0.03 * ppu) / 0.85), ds = Math.max(3, 3.2 / ppu);
    return `
    <filter id="crayon" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${wf.toFixed(3)}" numOctaves="2" seed="4" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="${f(ds)}" xChannelSelector="R" yChannelSelector="G" result="wob"/>
      <feTurbulence type="fractalNoise" baseFrequency="${(gf * 0.22).toFixed(3)} ${(gf * 0.85).toFixed(3)}" numOctaves="3" seed="11" result="grain"/>
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="g1"/>
      <feComponentTransfer in="g1" result="mask"><feFuncA type="table" tableValues="1 1 1 1 .97 .9 .84 .8"/></feComponentTransfer>
      <feComposite in="wob" in2="mask" operator="in" result="speck"/>
      <feComponentTransfer in="g1" result="dark"><feFuncA type="table" tableValues=".14 .07 .02 0 0 0 0 0"/></feComponentTransfer>
      <feComposite in="dark" in2="speck" operator="in" result="darkIn"/>
      <feMerge><feMergeNode in="speck"/><feMergeNode in="darkIn"/></feMerge>
    </filter>
    <filter id="panko" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="2" seed="7" result="n"/>
      <feDiffuseLighting in="n" surfaceScale="2.3" diffuseConstant="1" lighting-color="#fff" result="lit"><feDistantLight azimuth="235" elevation="55"/></feDiffuseLighting>
      <feComposite in="SourceGraphic" in2="lit" operator="arithmetic" k1=".55" k2=".62" k3="0" k4="0" result="shaded"/>
      <feComposite in="shaded" in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="blur2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="blur3" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="blur4" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="blur6" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="blur12" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="12"/></filter>
    <filter id="blurLeaf" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
    <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="9" stroke="#000" stroke-width="2.4"/></pattern>
    <radialGradient id="grainFill" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f6f2ea"/><stop offset="1" stop-color="#e2d9c9"/></radialGradient>
    <g id="grain"><ellipse cx=".9" cy="1.7" rx="6.6" ry="3.2" fill="#c9bea9" opacity=".5"/><ellipse rx="6.6" ry="3.3" fill="url(#grainFill)"/><ellipse cx="-2.3" cy="-1.1" rx="2.6" ry=".9" fill="#fff" opacity=".95"/></g>
    <radialGradient id="riceBase" cx=".45" cy=".4" r=".8"><stop offset="0" stop-color="#fdfbf6"/><stop offset="1" stop-color="#e8e2d8"/></radialGradient>
    <radialGradient id="riceLight" cx=".42" cy=".32" r=".75"><stop offset="0" stop-color="#fff6dc" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#8a7a62" stop-opacity=".22"/></radialGradient>
    <linearGradient id="riceWallTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3a24" stop-opacity=".45"/><stop offset=".09" stop-color="#5a3a24" stop-opacity="0"/></linearGradient>
    <linearGradient id="riceWallSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3a24" stop-opacity=".3"/><stop offset=".1" stop-color="#5a3a24" stop-opacity="0"/><stop offset=".9" stop-color="#5a3a24" stop-opacity="0"/><stop offset="1" stop-color="#5a3a24" stop-opacity=".22"/></linearGradient>
    <radialGradient id="umeStain"><stop offset="0" stop-color="#e98a9a" stop-opacity=".45"/><stop offset="1" stop-color="#e98a9a" stop-opacity="0"/></radialGradient>
    <radialGradient id="umeGrad" cx=".38" cy=".34" r=".78"><stop offset="0" stop-color="#d9606e"/><stop offset=".55" stop-color="#a9343f"/><stop offset="1" stop-color="#78202c"/></radialGradient>
    <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fb35c"/><stop offset="1" stop-color="#3f7230"/></linearGradient>
    <linearGradient id="takuanStick" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe164"/><stop offset=".6" stop-color="#f6cf35"/><stop offset="1" stop-color="#e8b81c"/></linearGradient>
    <radialGradient id="takuanGrad" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#fbe36a"/><stop offset=".75" stop-color="#f6d03a"/><stop offset="1" stop-color="#eebd22"/></radialGradient>
    <linearGradient id="sideGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b2814c"/><stop offset=".8" stop-color="#93653a"/><stop offset="1" stop-color="#744c28"/></linearGradient>
    <pattern id="woodGrain" width="260" height="22" patternUnits="userSpaceOnUse"><path d="M0 6 Q65 2 130 7 T260 6" stroke="#7d5129" stroke-width="1.6" fill="none" opacity=".45"/><path d="M0 15 Q70 19 140 14 T260 16" stroke="#7d5129" stroke-width="1.1" fill="none" opacity=".35"/><path d="M40 11 Q90 9 120 12" stroke="#f1d3a2" stroke-width="1.2" fill="none" opacity=".4"/></pattern>
    <linearGradient id="noriLog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f3d31"/><stop offset=".22" stop-color="#405044"/><stop offset=".55" stop-color="#222c24"/><stop offset="1" stop-color="#101511"/></linearGradient>
    <linearGradient id="rollCore" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f3ea" stop-opacity="0"/><stop offset=".5" stop-color="#eef6ee" stop-opacity=".42"/><stop offset="1" stop-color="#e8f3ea" stop-opacity="0"/></linearGradient>
    <radialGradient id="eggCut" cx=".42" cy=".4" r=".7"><stop offset="0" stop-color="#fff2bf"/><stop offset=".6" stop-color="#f7d775"/><stop offset="1" stop-color="#ecb84c"/></radialGradient>
    <linearGradient id="eggCrust" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0c25c"/><stop offset="1" stop-color="#c88730"/></linearGradient>
    <linearGradient id="sausBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ed9472"/><stop offset=".3" stop-color="#cf6043"/><stop offset=".75" stop-color="#a5402a"/><stop offset="1" stop-color="#7a2a1a"/></linearGradient>
    <radialGradient id="stirSauce" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#c25a35"/><stop offset=".6" stop-color="#a1422a"/><stop offset="1" stop-color="#76291a"/></radialGradient>
    <radialGradient id="sausCut" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#eeb39c"/><stop offset=".65" stop-color="#d9826a"/><stop offset="1" stop-color="#b9553f"/></radialGradient>
    <linearGradient id="sausCore" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="#4a1208" stop-opacity="0"/><stop offset=".8" stop-color="#4a1208" stop-opacity=".35"/><stop offset="1" stop-color="#4a1208" stop-opacity=".1"/></linearGradient>
    <linearGradient id="lettuce" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3d98e"/><stop offset="1" stop-color="#78a04c"/></linearGradient>
    <radialGradient id="berryBody" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="#ff6d5f"/><stop offset=".45" stop-color="#e02a39"/><stop offset=".85" stop-color="#b3172b"/><stop offset="1" stop-color="#8c1224"/></radialGradient>
    <radialGradient id="berryCut" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#fde6e2"/><stop offset=".45" stop-color="#f7a3a0"/><stop offset=".8" stop-color="#e5404c"/><stop offset="1" stop-color="#c11f31"/></radialGradient>
    <linearGradient id="sepal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fae47"/><stop offset="1" stop-color="#2f6322"/></linearGradient>
    <radialGradient id="muscat" cx=".5" cy=".6" r=".7"><stop offset="0" stop-color="#f6fac6"/><stop offset=".55" stop-color="#cfe27c"/><stop offset="1" stop-color="#93b03e"/></radialGradient>
    <pattern id="bloom" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#e9defa"/><circle cx="4" cy="3.5" r=".5" fill="#e9defa"/><circle cx="2.5" cy="5" r=".4" fill="#e9defa"/></pattern>
    <linearGradient id="calyxGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cb24f"/><stop offset="1" stop-color="#3d6a28"/></linearGradient>
    <radialGradient id="grapeP" cx=".36" cy=".32" r=".78"><stop offset="0" stop-color="#8f70b6"/><stop offset=".5" stop-color="#583282"/><stop offset="1" stop-color="#2b1540"/></radialGradient>
        <pattern id="gingham" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="36" height="18" fill="#9fb2ad" opacity=".22"/><rect width="18" height="36" fill="#9fb2ad" opacity=".22"/></pattern>
    <radialGradient id="tea" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#d4a45a"/><stop offset=".7" stop-color="#b8833c"/><stop offset="1" stop-color="#94652b"/></radialGradient>
    <linearGradient id="salmonFlesh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f9a982"/><stop offset=".5" stop-color="#ef8058"/><stop offset="1" stop-color="#d9623b"/></linearGradient>
    <linearGradient id="salmonSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a8f99"/><stop offset=".5" stop-color="#555962"/><stop offset="1" stop-color="#34373d"/></linearGradient>
    <linearGradient id="salmonSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f08a60"/><stop offset="1" stop-color="#cf6038"/></linearGradient>
    <radialGradient id="lemonPulp" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#fff3a8"/><stop offset="1" stop-color="#f6da4f"/></radialGradient>
    <radialGradient id="katsuCrust" cx=".4" cy=".3" r=".85"><stop offset="0" stop-color="#f6c066"/><stop offset=".55" stop-color="#e7a347"/><stop offset="1" stop-color="#c98232"/></radialGradient>
    <linearGradient id="porkEdge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8672f" stop-opacity=".35"/><stop offset=".12" stop-color="#fff" stop-opacity="0"/><stop offset=".88" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#8a4a1f" stop-opacity=".35"/></linearGradient>
    <radialGradient id="porkSide" cx=".38" cy=".45" r=".75"><stop offset="0" stop-color="#f6ddd3"/><stop offset=".5" stop-color="#ecbfb1"/><stop offset="1" stop-color="#d79484"/></radialGradient>
    <linearGradient id="porkFace" x1="0" y1="0" x2="1" y2=".3"><stop offset="0" stop-color="#d9988a"/><stop offset=".25" stop-color="#efc3b6"/><stop offset=".6" stop-color="#f5d6cb"/><stop offset="1" stop-color="#e2a798"/></linearGradient>
    <radialGradient id="poolFill" cx=".45" cy=".4" r=".62"><stop offset="0" stop-color="#3a1305"/><stop offset=".62" stop-color="#5b230b"/><stop offset=".86" stop-color="#8a3e15"/><stop offset="1" stop-color="#b8662a"/></radialGradient>
    <radialGradient id="poolSheen" cx=".5" cy=".2" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="porkCut" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dcae8e"/><stop offset=".45" stop-color="#ecc9ad"/><stop offset="1" stop-color="#d9a585"/></linearGradient>
    <linearGradient id="porkShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#6b3410" stop-opacity=".25"/></linearGradient>
    <linearGradient id="katsuSauce" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a3c17"/><stop offset=".4" stop-color="#682a0e"/><stop offset="1" stop-color="#461807"/></linearGradient>
    <radialGradient id="katsuSauceR" gradientUnits="userSpaceOnUse" cx="180" cy="110" r="190"><stop offset="0" stop-color="#6e2d10"/><stop offset=".6" stop-color="#55210a"/><stop offset="1" stop-color="#3e1606"/></radialGradient>
    <linearGradient id="sauceSheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="katsuFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c27a2e"/><stop offset="1" stop-color="#8f5320"/></linearGradient>
    <linearGradient id="katsuSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d08a36"/><stop offset="1" stop-color="#a0601f"/></linearGradient>
    <linearGradient id="katsuMeat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c98a45"/><stop offset=".25" stop-color="#f3e2c9"/><stop offset=".8" stop-color="#ead2b2"/><stop offset="1" stop-color="#b07436"/></linearGradient>
    <linearGradient id="katsuShade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6dc" stop-opacity=".32"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#5a2a08" stop-opacity=".28"/></linearGradient>
    <radialGradient id="sunPatch" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff7e0" stop-opacity=".85"/><stop offset=".6" stop-color="#fff2d4" stop-opacity=".35"/><stop offset="1" stop-color="#fff2d4" stop-opacity="0"/></radialGradient>
    <linearGradient id="backFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4422" stop-opacity=".4"/><stop offset="1" stop-color="#6b4422" stop-opacity="0"/></linearGradient>`;
  };

  function render() {
    const mobile = scene.clientWidth < 700;
    let vbW, vbH, body, box;
    if (!mobile) {
      box = bentoBox({ fh: 120 });
      const r = receipt(1046, 30, 0, 1);
      const cupY = Math.max(r.h + 152, box.h + 150), cupX = 1118;
      vbW = 1380;
      vbH = Math.max(box.h + 230, cupY + 100);
      body = `<ellipse cx="460" cy="300" rx="760" ry="420" fill="url(#sunPatch)"/>
        ${napkin(14, 8, 992, 660, 0)}
        <a class="hit sticker" href="${esc((D.contact || {}).linkedin || "#")}" target="_blank" rel="noopener" aria-label="Up for a coffee chat? Open LinkedIn">
          ${teacup(cupX, cupY, 1.3)}
          ${bubble(cupX + 124, cupY - 112, "Up for a coffee chat?", cupX + 30, cupY - 38)}
        </a>
        <g transform="translate(40 30)">${box.svg}</g>
        
        ${chopsticks(40, box.h + 112, 0, 642, 1.25)}
        ${daisy(978, box.h + 30, 0.8, 64)}${daisy(1024, box.h + 12, 0.68, 100)}
        ${r.svg}
        ${leafShadows(1230, 140, 7)}
        ${motes(80, 20, 900, 420, 3)}`;
    } else {
      box = bentoBox({ fh: 90, pickScale: 1.3, subs: false, label: false });
      const lblY = 30 + box.h + 30;
      const chopY = lblY + LABEL_H * 2.4 + 56;
      const r = receipt(132, chopY + 160, 0, 2.45);
      vbW = 1000;
      vbH = chopY + 160 + r.h + 60;
      body = `<ellipse cx="420" cy="320" rx="700" ry="520" fill="url(#sunPatch)"/>
        ${napkin(-20, 4, 1040, 640, 0)}
        <g transform="translate(30 30)">${box.svg}</g>
        ${productLabel((1000 - LABEL_W * 2.4) / 2, lblY, 2.4, 0)}
        ${chopsticks(30, chopY, 0, 540, 1.45)}
        ${r.svg}
        ${leafShadows(820, 120, 7, 10)}
        ${motes(60, 20, 880, 500, 3, 8)}`;
    }
    const ppu = scene.clientWidth / vbW;
    scene.innerHTML = `<svg viewBox="0 0 ${vbW} ${vbH}" role="img" aria-label="${esc(P.name)}'s research bento"><defs>${defsFor(ppu)}${box.defs}</defs>${body}</svg>`;
    fitBubbles();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBubbles);

  let lastW = scene.clientWidth || 1000;
  render(); // draw right away (ResizeObserver may not fire in a background tab)
  new ResizeObserver(() => {
    const w = scene.clientWidth;
    if (!lastW || Math.abs(w - lastW) / lastW > 0.2 || (w < 700) !== (lastW < 700)) { lastW = w; render(); }
  }).observe(scene);
};
