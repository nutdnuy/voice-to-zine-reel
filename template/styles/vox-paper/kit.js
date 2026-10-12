// =====================================================================
//  styles/vox-paper/kit.js — Vox-style editorial collage, built on the cut-paper look: torn-edge cutouts with drop shadows, paper grain, crayon, patterns;
//  faces with moods; THE SPARK (a hero: an orange starburst with a face; idle bob, blinks, ray sway);
//  people, hands, props (clock, cat, mug, plant, books), paper tags (year tag, caption strip).
//  Needs from the piece head: HAND (font stack), CX (caption centre x). Built on kit/core.js (time helpers live there).
//  handText(..., { frac }) writes text on. STYLE (at the end) is what the renderer (kit/morph.js) calls.
// =====================================================================
// =====================================================================
const PAL = {
  ink: '#1f1a17', paper: '#f4ecdb', cream: '#ebe0c8', vyel: '#f5cf3a', vred: '#d4412e', news: '#e6dcc6', newsD: '#c9bc9f', slate: '#3b3f46', navy: '#26315f', night: '#141c40',
  wood: '#c08048', woodD: '#97582b', woodL: '#dba26a', tweed: '#7a6650', lamp: '#2f7a5c', mustard: '#d9a441',
  orange: '#ec7a4f', orangeD: '#c4542e', yellow: '#f6cf55', teal: '#3f9f9a', mint: '#a9d9c6', pink: '#f3a3bf', pinkL: '#f8c3d4',
  sky: '#cfe2ee', snow: '#f6fafc', ice: '#a9c8dc', purple: '#8c7ad8', blue: '#4c6fb5', green: '#5aa05a', greenD: '#3d7c46',
  skin1: '#efc19e', skin2: '#c68a62', skin3: '#8a5638', grey: '#8a8590', charcoal: '#4a4550', brick: '#b98576',
};
const HANDF = HAND;
function handText(str, x, y, size, color, o = {}) {
  ctx.save();
  const R = RNG('ht', o.key ?? str, B);
  ctx.translate(x + R.n(0.7), y + R.n(0.7)); ctx.rotate((o.rot ?? 0) + R.n(0.006));
  ctx.font = `${o.weight ?? 400} ${size}px ${HANDF}`; ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
  const w = ctx.measureText(str).width, frac = clamp(o.frac ?? 1);
  if (frac <= 0) { ctx.restore(); return w; }
  if (frac < 1) { ctx.beginPath(); ctx.rect(-4, -size * 1.2, w * frac + 4, size * 1.7); ctx.clip(); }
  ctx.globalAlpha = o.al ?? 1; ctx.fillText(str, 0, 0);
  ctx.restore();
  return w;
}
function handW(str, size, weight = 400) { ctx.save(); ctx.font = `${weight} ${size}px ${HANDF}`; const w = ctx.measureText(str).width; ctx.restore(); return w; }
const dot = (x, y, r, c = PAL.ink) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
function capsulePts(x1, y1, x2, y2, w, n = 8) {
  const a = Math.atan2(y2 - y1, x2 - x1), r = w / 2, P = [];
  for (let i = 0; i <= n; i++) { const t = a - Math.PI / 2 + Math.PI * i / n; P.push([x2 + Math.cos(t) * r, y2 + Math.sin(t) * r]); }
  for (let i = 0; i <= n; i++) { const t = a + Math.PI / 2 + Math.PI * i / n; P.push([x1 + Math.cos(t) * r, y1 + Math.sin(t) * r]); }
  return P;
}
function rot(P, cx, cy, a) { const c = Math.cos(a), s = Math.sin(a); return P.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]); }
function torn(Q, key, amt) {
  if (!amt) return Q;
  const R = RNG('torn', key), n = Q.length;
  return Q.map((p, i) => { const a = Q[(i + 1) % n], b = Q[(i - 1 + n) % n]; const nx = a[1] - b[1], ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1, j = R.n(amt); return [p[0] + nx / l * j, p[1] + ny / l * j]; });
}
function grainIn(bb, key, k = 1) {
  const area = (bb.x1 - bb.x0) * (bb.y1 - bb.y0), n = Math.min(4500, Math.floor(area / 170 * k));
  stipple(bb, { key: key + 'g1', c: 'rgba(255,255,255,0.30)', n, s: 1.5, jit: 0.3 });
  stipple(bb, { key: key + 'g2', c: 'rgba(50,30,15,0.10)', n, s: 1.5, jit: 0.3 });
  pencil(bb, { key: key + 'fb', c: '#ffffff', al: 0.10, per: 700, len: 28, w: 1, a: -0.35, max: 1500 });
}
// a paper cutout. o: key, tear, amt, shadow, sb/sx/sy, pat(bb), crayon (colour), grain (density), shade, line
function cut(P, fill, o = {}) {
  const key = o.key ?? 'cut';
  const Q = torn(wobble(P, true, o.amt ?? 0.9, key, 5), key, o.tear ?? 1.3);
  ctx.save();
  if (o.shadow !== false) { ctx.shadowColor = o.shc ?? 'rgba(35,20,10,0.30)'; ctx.shadowBlur = o.sb ?? 12; ctx.shadowOffsetX = o.sx ?? 3; ctx.shadowOffsetY = o.sy ?? 7; }
  trace(Q, true); ctx.fillStyle = fill; ctx.fill();
  ctx.restore();
  ctx.save(); trace(Q, true); ctx.clip(); const bb = bbox(Q, 2);
  if (o.pat) o.pat(bb);
  if (o.crayon) pencil(bb, { key: key + 'cr', c: o.crayon, al: o.crAl ?? 0.4, per: o.crPer ?? 45, len: o.crLen ?? 20, a: o.crA ?? -0.9, w: 1.7, max: 5000 });
  if (o.grain !== false) grainIn(bb, key, o.grain ?? 1);
  if (o.shade !== false) { const g = ctx.createLinearGradient(bb.x0, bb.y0, bb.x0, bb.y1); g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(30,15,5,0.13)'); ctx.fillStyle = g; ctx.fillRect(bb.x0, bb.y0, bb.x1 - bb.x0, bb.y1 - bb.y0); }
  ctx.restore();
  if (o.line) { ctx.strokeStyle = o.line; ctx.lineWidth = o.lw ?? 3; ctx.lineJoin = 'round'; trace(Q, true); ctx.stroke(); }
  return Q;
}
const rect = (x, y, w, h, r = 4) => rrectPts(x, y, w, h, r);
const pat = {
  stripes: (c, w, gap, a = 0) => (bb) => {
    ctx.save(); const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2, R = Math.hypot(bb.x1 - bb.x0, bb.y1 - bb.y0) / 2 + 10;
    ctx.translate(cx, cy); ctx.rotate(a); ctx.fillStyle = c; for (let x = -R; x < R; x += gap) ctx.fillRect(x, -R, w, 2 * R); ctx.restore();
  },
  dots: (c, r, gap) => (bb) => { ctx.fillStyle = c; ctx.beginPath(); let row = 0; for (let y = bb.y0; y < bb.y1 + gap; y += gap, row++) for (let x = bb.x0 + (row % 2) * gap / 2; x < bb.x1 + gap; x += gap) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); } ctx.fill(); },
  gingham: (c, w) => (bb) => { pat.stripes(c, w, w * 2, 0)(bb); pat.stripes(c, w, w * 2, Math.PI / 2)(bb); },
  lines: (c, gap, y0 = 0) => (bb) => { ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); for (let y = bb.y0 + y0; y < bb.y1; y += gap) { ctx.moveTo(bb.x0, y); ctx.lineTo(bb.x1, y); } ctx.stroke(); },
  grainWood: (c) => (bb) => { const R = RNG('wg', bb.x0, bb.y0); ctx.strokeStyle = c; ctx.lineWidth = 2.2; ctx.beginPath(); for (let y = bb.y0; y < bb.y1; y += R.r(14, 30)) { ctx.moveTo(bb.x0, y); for (let x = bb.x0; x <= bb.x1; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.01 + y) * 4); } ctx.stroke(); },
};
// ---- faces: smile, happy (eyes closed, open mouth), wow, sad, focus
function face(x, y, s, mood = 'smile') {
  const I = PAL.ink;
  const eye = (ex) => {
    if (mood === 'happy') { ink(arcPts(ex, y + 5 * s, 8 * s, Math.PI * 1.15, Math.PI * 1.85, 8), { w: 3.6 * s, color: I, amt: 0.2, key: 'fe' + ex + mood }); return; }
    if (mood === 'focus') { ink([[ex - 7 * s, y], [ex + 7 * s, y]], { w: 3.6 * s, color: I, amt: 0.2, key: 'ff' + ex }); return; }
    dot(ex, y, (mood === 'wow' ? 7.5 : 6) * s, I); dot(ex + 2 * s, y - 2.4 * s, 2 * s, '#fff');
  };
  eye(x - 16 * s); eye(x + 16 * s);
  ctx.fillStyle = 'rgba(240,110,120,0.45)'; ctx.beginPath(); ctx.ellipse(x - 27 * s, y + 11 * s, 7 * s, 4.5 * s, 0, 0, TAU); ctx.ellipse(x + 27 * s, y + 11 * s, 7 * s, 4.5 * s, 0, 0, TAU); ctx.fill();
  if (mood === 'sad') {
    ink([[x - 24 * s, y - 13 * s], [x - 10 * s, y - 9 * s]], { w: 3 * s, color: I, amt: 0.2, key: 'fbl' }); ink([[x + 24 * s, y - 13 * s], [x + 10 * s, y - 9 * s]], { w: 3 * s, color: I, amt: 0.2, key: 'fbr' });
    ink(arcPts(x, y + 22 * s, 8 * s, Math.PI * 1.2, Math.PI * 1.8, 8), { w: 3.2 * s, color: I, amt: 0.2, key: 'fms' });
  } else if (mood === 'wow') { ctx.fillStyle = I; ctx.beginPath(); ctx.ellipse(x, y + 16 * s, 5 * s, 7 * s, 0, 0, TAU); ctx.fill(); }
  else if (mood === 'happy') {
    ctx.fillStyle = I; ctx.beginPath(); ctx.arc(x, y + 10 * s, 10 * s, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8707a'; ctx.beginPath(); ctx.ellipse(x, y + 16 * s, 5.5 * s, 3 * s, 0, 0, TAU); ctx.fill();
  } else ink(arcPts(x, y + 8 * s, 8 * s, Math.PI * 0.2, Math.PI * 0.8, 8), { w: 3.2 * s, color: I, amt: 0.2, key: 'fm' + mood });
}
// ---- THE SPARK: the machine's mind. rays grow in number with the eras (5 in 1950 ... 12 in 2025)
function spark(x, y, r, o = {}) {
  const sc = o.s ?? 1; if (sc <= 0.01) return; r *= sc;
  const key = o.key ?? 'spk', ph = key.length * 1.7;
  y += Math.sin(TT * TAU * 0.9 + ph) * r * 0.035;                       // idle bob
  let mood = o.mood ?? 'smile';
  if (mood !== 'happy' && mood !== 'focus' && (B + Math.round(ph * 5)) % 37 < 2) mood = 'focus';   // a blink
  SPARK_AT = toScreen(x, y);
  const n = o.rays ?? 9, r0 = (o.rot ?? -Math.PI / 2) + Math.sin(TT * 2.1 + ph) * 0.05, RR = RNG('rays', key);
  for (let i = 0; i < n; i++) {
    const a = r0 + i / n * TAU + RR.n(0.05), L = r * (0.92 + RR.f() * 0.16);
    cut(capsulePts(x + Math.cos(a) * r * 0.25, y + Math.sin(a) * r * 0.25, x + Math.cos(a) * L, y + Math.sin(a) * L, r * 0.36), PAL.orange, { key: key + 'r' + i, crayon: PAL.orangeD, crAl: 0.4, crPer: 30, sb: 6, sy: 4, tear: 0.7, grain: 0.6 });
  }
  cut(ellipsePts(x, y, r * 0.52, r * 0.5, 0, 30), PAL.orange, { key: key + 'b', crayon: PAL.orangeD, crAl: 0.3, crPer: 30, shadow: false, tear: 0.5, grain: 0.6 });
  face(x, y + r * 0.04, r / 64, mood);
}
// ---- people: a bust, shoulders at (x, y)
function person(x, y, s, o = {}) {
  const key = o.key ?? 'ps', skin = o.skin ?? PAL.skin2, hair = o.hair ?? '#2b211d';
  cut(rect(x - 125 * s, y, 250 * s, 330 * s, 80 * s), o.shirt ?? PAL.blue, { key: key + 't', pat: o.shirtPat });
  cut(rect(x - 24 * s, y - 46 * s, 48 * s, 66 * s, 12 * s), skin, { key: key + 'n', shadow: false });
  cut(ellipsePts(x - 74 * s, y - 112 * s, 14 * s, 20 * s, 0, 14), skin, { key: key + 'el' });
  cut(ellipsePts(x + 74 * s, y - 112 * s, 14 * s, 20 * s, 0, 14), skin, { key: key + 'er' });
  cut(ellipsePts(x, y - 116 * s, 76 * s, 86 * s, 0, 30), skin, { key: key + 'h' });
  if (o.beard) cut([[x - 74 * s, y - 120 * s], [x - 70 * s, y - 60 * s], [x - 30 * s, y - 32 * s], [x + 30 * s, y - 32 * s], [x + 70 * s, y - 60 * s], [x + 74 * s, y - 120 * s], [x + 50 * s, y - 80 * s], [x - 50 * s, y - 80 * s]], hair, { key: key + 'bd', shadow: false });
  cut([[x - 80 * s, y - 120 * s], [x - 82 * s, y - 170 * s], [x - 40 * s, y - 214 * s], [x + 40 * s, y - 214 * s], [x + 84 * s, y - 168 * s], [x + 80 * s, y - 122 * s], [x + 60 * s, y - 160 * s], [x - 50 * s, y - 166 * s]], hair, { key: key + 'hr', sb: 4 });
  face(x, y - 118 * s, s * 1.25, o.mood ?? 'smile');
  if (o.glasses) { ctx.strokeStyle = PAL.ink; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.arc(x - 21 * s, y - 118 * s, 17 * s, 0, TAU); ctx.moveTo(x + 38 * s, y - 118 * s); ctx.arc(x + 21 * s, y - 118 * s, 17 * s, 0, TAU); ctx.moveTo(x - 4 * s, y - 120 * s); ctx.lineTo(x + 4 * s, y - 120 * s); ctx.stroke(); }
}
// a mitten hand with a sleeve, pointing along angle a from the sleeve end (x, y)
function hand(x, y, s, a, skin, sleeve, o = {}) {
  const c = Math.cos(a), si = Math.sin(a);
  cut(capsulePts(x - c * 200 * s, y - si * 200 * s, x, y, 92 * s, 4), sleeve, { key: (o.key ?? 'hd') + 's', pat: o.sleevePat });
  cut(ellipsePts(x + c * 40 * s, y + si * 40 * s, 46 * s, 36 * s, a, 22), skin, { key: (o.key ?? 'hd') + 'h' });
  cut(ellipsePts(x + c * 36 * s - si * 34 * s, y + si * 36 * s + c * 34 * s, 22 * s, 13 * s, a + 0.5, 14), skin, { key: (o.key ?? 'hd') + 't', sb: 4 });
}
// ---- props
function clock(x, y, r, h, m, key = 'ck') {
  cut(ellipsePts(x, y, r, r, 0, 36), PAL.woodD, { key: key + 'o' });
  cut(ellipsePts(x, y, r * 0.84, r * 0.84, 0, 36), PAL.paper, { key: key + 'i', shadow: false });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ink([[x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.66], [x + Math.cos(a) * r * 0.76, y + Math.sin(a) * r * 0.76]], { w: 4, color: PAL.ink, amt: 0.2, key: key + 't' + i }); }
  const ah = (h % 12 + m / 60) / 12 * TAU - Math.PI / 2, am = m / 60 * TAU - Math.PI / 2;
  ink([[x, y], [x + Math.cos(ah) * r * 0.42, y + Math.sin(ah) * r * 0.42]], { w: 7, color: PAL.ink, amt: 0.3, key: key + 'h' });
  ink([[x, y], [x + Math.cos(am) * r * 0.64, y + Math.sin(am) * r * 0.64]], { w: 5, color: PAL.ink, amt: 0.3, key: key + 'm' });
  dot(x, y, 6);
}
function cat(x, y, s, c = PAL.charcoal, key = 'cat') {   // a sleeping loaf
  cut(ellipsePts(x, y, 80 * s, 40 * s, 0, 30), c, { key: key + 'b' });
  cut(capsulePts(x + 70 * s, y + 20 * s, x - 70 * s, y + 30 * s, 20 * s), c, { key: key + 't', sb: 4 });
  cut([[x - 96 * s, y - 34 * s], [x - 88 * s, y - 72 * s], [x - 70 * s, y - 44 * s], [x - 46 * s, y - 72 * s], [x - 40 * s, y - 30 * s], [x - 50 * s, y + 6 * s], [x - 90 * s, y + 6 * s]], c, { key: key + 'h' });
  ink(arcPts(x - 78 * s, y - 24 * s, 6 * s, 0.2, Math.PI - 0.2, 6), { w: 2.6, color: '#d8d0c4', amt: 0.2, key: key + 'e1' });
  ink(arcPts(x - 58 * s, y - 24 * s, 6 * s, 0.2, Math.PI - 0.2, 6), { w: 2.6, color: '#d8d0c4', amt: 0.2, key: key + 'e2' });
  const zf = mod(TT * 18, 36);
  handText('z', x - 30 * s, y - (70 + zf) * s, 34 * s, 'rgba(255,255,255,0.8)', { key: key + 'z1' });
  handText('z', x - 10 * s, y - (100 + zf) * s, 26 * s, 'rgba(255,255,255,0.6)', { key: key + 'z2' });
}
function mug(x, y, s, c, key = 'mug', steam = true) {
  cut(ellipsePts(x + 46 * s, y + 30 * s, 22 * s, 26 * s, 0, 18), c, { key: key + 'hd', sb: 4 });
  cut(ellipsePts(x + 46 * s, y + 30 * s, 10 * s, 14 * s, 0, 14), 'rgba(0,0,0,0.001)', { key: key + 'hh', shadow: false, grain: false, shade: false });
  cut(rect(x - 44 * s, y, 88 * s, 96 * s, 14 * s), c, { key: key + 'b' });
  if (steam) for (let i = 0; i < 3; i++) { const P = []; for (let k = 0; k <= 10; k++) P.push([x - 22 * s + i * 22 * s + Math.sin(k * 0.9 + i + TT * 4) * 9 * s, y - 14 * s - k * 9 * s]); ink(P, { w: 4 * s, color: 'rgba(255,255,255,0.75)', amt: 0.8, key: key + 'st' + i }); }
}
function plant(x, y, s, pot = PAL.blue, key = 'pl') {
  const R = RNG('pl', key);
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + R.n(0.9), L = R.r(90, 150) * s; cut(rot(ellipsePts(x + Math.cos(a) * L * 0.5, y - 40 * s + Math.sin(a) * L * 0.5, L * 0.5, 20 * s, 0, 16), x + Math.cos(a) * L * 0.5, y - 40 * s + Math.sin(a) * L * 0.5, a), i % 2 ? PAL.green : PAL.greenD, { key: key + 'l' + i, sb: 5 }); }
  cut([[x - 56 * s, y - 40 * s], [x + 56 * s, y - 40 * s], [x + 42 * s, y + 60 * s], [x - 42 * s, y + 60 * s]], pot, { key: key + 'p', pat: pat.stripes('rgba(255,255,255,0.18)', 8, 26) });
}
function books(x, y, s, key = 'bk') {
  const cols = [PAL.teal, PAL.pink, PAL.purple, PAL.yellow, PAL.blue, PAL.green], R = RNG('bk', key);
  let yy = y;
  for (let i = 0; i < 4; i++) { const w = R.r(150, 200) * s, h = R.r(30, 42) * s; cut(rect(x - w / 2 + R.n(10), yy - h, w, h, 4), cols[(i + key.length) % cols.length], { key: key + i, sb: 5, pat: pat.stripes('rgba(255,255,255,0.35)', 6, 1000) }); yy -= h; }
}
function sparkle(x, y, s, c = '#fff8dc') { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s); ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill(); }
function tag(str, x, y, size, o = {}) {   // a torn paper tag with handwriting
  const w = handW(str, size) + size * 0.9, h = size * 1.45;
  const ts = o.s ?? 1; if (ts <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? -0.03); ctx.scale(ts, ts);
  cut(rect(-w / 2, -h / 2, w, h, 3), o.fill ?? PAL.paper, { key: 'tag' + str, tear: 1.6 });
  if (o.tape !== false) cut(rect(-34, -h / 2 - 16, 68, 30, 2), 'rgba(240,230,190,0.75)', { key: 'tape' + str, shadow: false, grain: 0.3, shade: false });
  handText(str, -w / 2 + size * 0.45, size * 0.36, size, o.color ?? PAL.ink, { key: 'tagt' + str, frac: o.frac });
  ctx.restore();
}
// tag and caption sit inside the format's safe area (9:16: y 330 and 1440)
const yearTag = (str) => { const f = () => tag(str, 70 + (handW(str, 80) + 72) / 2, SAFE.top + 90, 80, { rot: -0.04, s: popS(E0 + 0.2) }); if (DEFER) DEFER.push(f); else f(); };
const capStrip = (str) => { const f = () => tag(str, CX, H - SAFE.bottom - 60, 50, { rot: 0.012, tape: false, frac: ev(E0 + 0.45, 0.6) }); if (DEFER) DEFER.push(f); else f(); };


// =====================================================================
//  VOX LAYER — editorial collage on top of the cut-paper medium (Nuth's Vox brief):
//  warm off-white paper (never pure white), halftone + paper texture multiplied over every frame, motion on 2s
//  (12 fps), rough marker / highlighter markup (multiply), contrast callouts (dim everything but the subject),
//  ink-bleed typewriter text with flecks, newspaper clippings, rubber stamps, scan-line screens.
//  Colour means one thing: VOX YELLOW = Bachelier's idea (the random walk); RED = doubt / rejection.
// =====================================================================
const HEADF = '"DIN Condensed", "Avenir Next Condensed", "Arial Narrow", Impact, sans-serif';
const TYPEF = '"American Typewriter", "Courier New", Courier, monospace';
const SERIF = '"Baskerville", "Times New Roman", Georgia, serif';
// bold condensed headline (Vox title type). o: color, align, frac (wipe-on), rot, track
function vxHead(str, x, y, size, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? 0);
  ctx.font = `700 ${size}px ${HEADF}`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = o.align ?? 'left';
  const w = ctx.measureText(str).width, frac = clamp(o.frac ?? 1);
  if (frac <= 0) { ctx.restore(); return w; }
  const x0 = o.align === 'center' ? -w / 2 : o.align === 'right' ? -w : 0;
  if (frac < 1) { ctx.beginPath(); ctx.rect(x0 - 6, -size * 1.1, (w + 12) * frac, size * 1.5); ctx.clip(); }
  ctx.fillStyle = o.color ?? PAL.ink; ctx.fillText(str, 0, 0);
  ctx.restore(); return w;
}
// typewriter text with ink bleed (stacked faint shadows), rough fractal edge and ink flecks. o: count (chars typed), color
function vxType(str, x, y, size, o = {}) {
  const n = Math.floor(o.count ?? str.length), s = str.slice(0, n); if (!s) return 0;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? 0);
  ctx.font = `${o.weight ?? 400} ${size}px ${o.font ?? TYPEF}`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const col = o.color ?? PAL.ink, R = RNG('vt', o.key ?? str);
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.16; for (let i = 0; i < 3; i++) ctx.fillText(s, R.n(1.6), R.n(1.6));   // bleed
  ctx.globalAlpha = 1; ctx.fillText(s, 0, 0);
  const w = ctx.measureText(s).width;
  // uneven inking: paper-coloured specks eat into the glyphs, ink flecks spray around them
  const J = RNG('vtj', o.key ?? str, B);
  ctx.fillStyle = PAL.paper; ctx.globalAlpha = 0.55; ctx.beginPath();
  for (let i = 0; i < w * size / 90; i++) ctx.rect(R.r(0, w), R.r(-size * 0.8, 0), 1.6, 1.6);
  ctx.fill();
  ctx.fillStyle = col; ctx.globalAlpha = 0.5; ctx.beginPath();
  for (let i = 0; i < w / 14; i++) { const fx = R.r(-4, w + 4), fy = R.r(-size * 1.05, size * 0.25); ctx.moveTo(fx + J.n(0.4), fy); ctx.arc(fx + J.n(0.4), fy, R.r(0.5, 1.5), 0, TAU); }
  ctx.fill(); ctx.restore(); return w;
}
const vxTypeW = (str, size, weight = 400) => { ctx.save(); ctx.font = `${weight} ${size}px ${TYPEF}`; const w = ctx.measureText(str).width; ctx.restore(); return w; };
// highlighter swipe (multiply, ragged ends, turbulent edge). frac = write-on 0..1
function vxHighlight(x, y, w, h, frac = 1, o = {}) {
  frac = clamp(frac); if (frac <= 0) return;
  const key = o.key ?? 'hl' + x + y, R = RNG('hlr', key), J = RNG('hlj', key, B), ww = w * frac, P = [];
  for (let i = 0; i <= 14; i++) P.push([x + ww * i / 14, y + R.n(h * 0.06) + J.n(0.8)]);
  P.push([x + ww + R.n(6), y + h * 0.5]);
  for (let i = 14; i >= 0; i--) P.push([x + ww * i / 14, y + h + R.n(h * 0.07) + J.n(0.8)]);
  P.push([x - 6 + R.n(4), y + h * 0.5]);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = o.color ?? PAL.vyel; ctx.globalAlpha = o.al ?? 0.85;
  trace(P, true); ctx.fill();
  ctx.globalAlpha = 0.25; ctx.strokeStyle = o.color ?? PAL.vyel; ctx.lineWidth = 2;   // darker streaks of a real chisel tip
  for (let k = 0; k < 3; k++) { const yy = y + h * (0.2 + 0.3 * k) + R.n(3); ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + ww, yy + R.n(3)); ctx.stroke(); }
  ctx.restore();
}
// marker stroke along a path (rough, multiply). frac = write-on
function vxMark(P, o = {}) {
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  ink(P, { w: o.w ?? 9, color: o.color ?? PAL.vred, amt: o.amt ?? 2.2, key: o.key ?? 'mk', frac: o.frac, alpha: o.al ?? 0.92, closed: o.closed, double: true });
  ctx.restore();
}
// a hand-drawn marker loop around a box (overlapping ends, like a real circle-it gesture)
function vxCircle(cx, cy, rx, ry, frac = 1, o = {}) {
  const P = []; for (let i = 0; i <= 40; i++) { const a = -2.2 + i / 40 * (TAU + 0.5); P.push([cx + Math.cos(a) * rx * (1 + 0.05 * Math.sin(i * 0.7)), cy + Math.sin(a) * ry * (1 + 0.04 * Math.cos(i * 0.9))]); }
  vxMark(P, { ...o, frac });
}
// an arrow drawn on with the marker from a to b (with a slight bow)
function vxArrow(a, b, frac = 1, o = {}) {
  const m = [(a[0] + b[0]) / 2 + (b[1] - a[1]) * (o.bow ?? 0.15), (a[1] + b[1]) / 2 - (b[0] - a[0]) * (o.bow ?? 0.15)], P = [];
  for (let i = 0; i <= 16; i++) { const t = i / 16; P.push([(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * m[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * m[1] + t * t * b[1]]); }
  vxMark(P, { ...o, frac: clamp(frac / 0.8) });
  if (frac > 0.8) { const k = (frac - 0.8) / 0.2, q = P[14], ang = Math.atan2(b[1] - q[1], b[0] - q[0]), L = (o.head ?? 34) * k;
    vxMark([[b[0] - Math.cos(ang - 0.5) * L, b[1] - Math.sin(ang - 0.5) * L], b, [b[0] - Math.cos(ang + 0.5) * L, b[1] - Math.sin(ang + 0.5) * L]], { ...o, key: (o.key ?? 'ar') + 'h' }); }
}
// contrast callout: dims everything outside outline P (screen coords). u = 0..1 strength
function vxDim(P, u, o = {}) {
  if (u <= 0) return;
  ctx.save(); screen();
  const Q = wobble(P, true, 2, o.key ?? 'dim', 9); trace(Q, true);   // trace() begins the path; add the frame after it
  ctx.rect(0, 0, W, H);
  ctx.fillStyle = `rgba(${o.rgb ?? '28,24,22'},${(o.al ?? 0.62) * clamp(u)})`; ctx.fill('evenodd');
  ctx.restore();
}
// a rubber stamp: boxed condensed caps, eroded ink, slight rotation; s = pop scale
function vxStamp(str, x, y, size, o = {}) {
  const s = o.s ?? 1; if (s <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? -0.12); ctx.scale(s, s);
  ctx.globalCompositeOperation = 'multiply';
  ctx.font = `700 ${size}px ${HEADF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(str).width + size * 0.7, h = size * 1.35, col = o.color ?? PAL.vred;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.globalAlpha = 0.85; ctx.lineWidth = size * 0.09;
  trace(wobble(rrectPts(-w / 2, -h / 2, w, h, 8), true, 1.2, 'st' + str), true); ctx.stroke();
  ctx.fillText(str, 0, size * 0.06);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.6; ctx.fillStyle = PAL.paper;   // worn rubber
  const R = RNG('stw', str); ctx.beginPath(); for (let i = 0; i < w * h / 260; i++) ctx.rect(R.r(-w / 2, w / 2), R.r(-h / 2, h / 2), R.r(1, 3.2), R.r(1, 2.4)); ctx.fill();
  ctx.restore();
}
// a newspaper clipping: torn newsprint with ruled columns of grey "text", a headline. o: head, rows, rot, key
function vxClip(x, y, w, h, o = {}) {
  const key = o.key ?? 'clip' + x;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(o.rot ?? 0); ctx.translate(-w / 2, -h / 2);
  cut(rect(0, 0, w, h, 2), o.fill ?? PAL.news, { key, tear: 2.2, sb: 10, crayon: false });
  const R = RNG('clipr', key), cols = o.cols ?? Math.max(1, Math.round(w / 260)), gap = 18, cw = (w - 40 - gap * (cols - 1)) / cols;
  let top = 30;
  if (o.head) { ctx.fillStyle = PAL.ink; ctx.font = `700 ${o.hs ?? 40}px ${o.headFont ?? SERIF}`; ctx.textBaseline = 'top'; ctx.fillText(o.head, 20, top, w - 40); top += (o.hs ?? 40) * 1.25; ctx.fillStyle = 'rgba(30,25,20,0.7)'; ctx.fillRect(20, top, w - 40, 2); top += 14; }
  ctx.fillStyle = 'rgba(40,34,28,0.38)';
  for (let c = 0; c < cols; c++) for (let yy = top; yy < h - 22; yy += 13) { const lw = cw * (R.f() < 0.12 ? R.r(0.3, 0.7) : R.r(0.9, 1)); ctx.fillRect(20 + c * (cw + gap), yy, lw, 5); }
  ctx.restore();
}
// a random walk (Brownian path) from (x, y) over width w: frac = write-on; returns the points
function vxWalkPts(x, y, w, amp, n, seed) {
  const R = RNG('walk', seed), P = [[x, y]]; let v = y;
  for (let i = 1; i <= n; i++) { v += R.n(amp); P.push([x + w * i / n, v]); }
  return P;
}
function vxWalk(P, frac = 1, o = {}) { ink(P, { raw: true, w: o.w ?? 6, color: o.color ?? PAL.ink, frac, alpha: o.al ?? 1, key: o.key ?? 'wk' }); return frac >= 1 ? P[P.length - 1] : pointAt(P, frac); }
// THE HERO: the Brownian particle — a yellow ink dot with a face that jitters on every boil step. Its jitter is the idea.
function vxDot(x, y, r, o = {}) {
  const J = RNG('dot', o.key ?? 'd', B), j = o.jit ?? r * 0.18;
  x += J.n(j); y += J.n(j); SPARK_AT = toScreen(x, y);
  cut(ellipsePts(x, y, r, r, 0, 26), PAL.vyel, { key: (o.key ?? 'd') + 'b', crayon: '#e0b11f', crAl: 0.45, crPer: 25, sb: 8, sy: 5, tear: 0.6, grain: 0.6 });
  if (o.face !== false) face(x, y + r * 0.04, r / 60, o.mood ?? 'smile');
}
// a screen (monitor/ticker) treatment: scan lines (venetian blinds), chromatic edge, flicker
function vxScreen(x, y, w, h, drawFn, o = {}) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = o.bg ?? '#1d2b28'; ctx.fillRect(x, y, w, h);
  drawFn();
  const J = RNG('flk', B); ctx.fillStyle = `rgba(255,255,240,${0.03 + J.f() * 0.04})`; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; for (let yy = y; yy < y + h; yy += 6) ctx.fillRect(x, yy, w, 2.5);
  const g = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.restore();
}
// halftone dot field inside a box (newsprint photo look)
function vxHalftone(bb, c, gap = 14, dens = () => 0.5) {
  ctx.fillStyle = c; ctx.beginPath(); let row = 0;
  for (let yy = bb.y0; yy < bb.y1; yy += gap, row++) for (let xx = bb.x0 + (row % 2) * gap / 2; xx < bb.x1; xx += gap) { const r = gap * 0.5 * clamp(dens(xx, yy)); if (r > 0.4) { ctx.moveTo(xx + r, yy); ctx.arc(xx, yy, r, 0, TAU); } }
  ctx.fill();
}
// ---- the print pass (static textures cached once, offset by the boil so the paper "breathes" at 12 fps)
const VXTEX = {};
function vxTex(name, make) { if (!VXTEX[name]) { const c = document.createElement('canvas'); c.width = W + 64; c.height = H + 64; make(c.getContext('2d'), c.width, c.height); VXTEX[name] = c; } return VXTEX[name]; }
function vxPrint() {
  const paperT = vxTex('paper', (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    const R = RNG('ptex');
    for (let i = 0; i < 60000; i++) { const v = 200 + Math.floor(R.f() * 55); g.fillStyle = `rgb(${v},${v - 6},${v - 16})`; g.fillRect(R.r(0, w), R.r(0, h), R.r(1, 3), R.r(1, 3)); }
    g.strokeStyle = 'rgba(120,95,60,0.18)'; g.lineWidth = 1;
    for (let i = 0; i < 900; i++) { const x = R.r(0, w), y = R.r(0, h), a = R.r(0, TAU), l = R.r(8, 40); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.4) * l * 0.5, y + Math.sin(a + 0.4) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    // blotches (uneven absorption of light)
    for (let i = 0; i < 40; i++) { const x = R.r(0, w), y = R.r(0, h), r = R.r(80, 320), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(150,120,80,0.10)'); gr.addColorStop(1, 'rgba(150,120,80,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  });
  const dotsT = vxTex('dots', (g, w, h) => {   // a 45-degree halftone grunge screen
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(60,50,40,0.5)';
    const R = RNG('dtex'), gap = 7; g.save(); g.translate(w / 2, h / 2); g.rotate(Math.PI / 4);
    for (let yy = -w; yy < w; yy += gap) for (let xx = -w; xx < w; xx += gap) { const n = 0.5 + 0.5 * Math.sin(xx * 0.004 + R.f() * 0.4) * Math.cos(yy * 0.005); const r = 1.6 * n * (R.f() < 0.75 ? 1 : 0); if (r > 0.3) { g.beginPath(); g.arc(xx, yy, r, 0, TAU); g.fill(); } }
    g.restore();
  });
  const J = RNG('print', B), ox = -Math.floor(J.r(0, 48)), oy = -Math.floor(J.r(0, 48));
  ctx.save(); screen();
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.55; ctx.drawImage(paperT, ox, oy);
  ctx.globalAlpha = 0.16; ctx.drawImage(dotsT, -Math.floor(J.r(0, 6)), -Math.floor(J.r(0, 6)));
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(40,25,10,0)'); v.addColorStop(1, 'rgba(40,25,10,0.28)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  grain({ n: 2600 });
}

// =====================================================================
//  STYLE — the hooks the renderer (kit/morph.js) calls.
// =====================================================================
const STYLE = {
  name: 'vox-paper',
  paper: '#efe6d2',
  backdrop(c) { cut(rect(-30, -30, W + 60, H + 60, 0), c, { key: 'backdrop', shadow: false, tear: 0, grain: 0.5, shade: false }); },
  window(P, key, src) {
    const Q = torn(wobble(P, true, 3, key, 9), key, 2.4);
    ctx.save(); ctx.shadowColor = 'rgba(35,20,10,0.35)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; trace(Q, true); ctx.fillStyle = STYLE.paper; ctx.fill(); ctx.restore();
    ctx.save(); trace(Q, true); ctx.clip(); ctx.drawImage(src, 0, 0); ctx.restore();
    ctx.save(); trace(Q, true); ctx.strokeStyle = '#f7f0e0'; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
  },
  blob(P, c, key) { cut(P, c, { key, tear: 1.0, amt: 1.2 }); },
  hero(x, y, r, o) { vxDot(x, y, r, o); },
  heroColor: PAL.vyel,
  post() { vxPrint(); },
};
