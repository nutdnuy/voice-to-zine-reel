// =====================================================================
//  voice-to-zine-reel renderer (9:16). Everything story-specific lives in CFG (src/config.js):
//  scenes (plate, start, chapter, camera keys, marks, strips), end card, captions, sound accents.
//  Look: charcoal distressed paper, photocopied engraved plates (Codex CLI) with torn boiling edges,
//  warm-cream torn strips with tall bold condensed type, a few teal / lavender marker strokes,
//  Thai captions with a karaoke sweep, photocopy speckle; the approved wordmark last (untouched).
//  Motion on 2s (12 fps). Camera keys and marks are in the plate's own 1024x1536 pixels.
// =====================================================================
const NEW_DUR = CFG.duration, NEW_FRAMES = Math.round(NEW_DUR * FPS);
const INK = '#141210', CREAM = '#efe3c8', COL = { teal: '#3f9a9c', lav: '#a596d6' };
const THAIF = '"Noto Sans Thai", "Sukhumvit Set", "Thonburi", sans-serif';
const S = CFG.scenes, STARTS = S.map((s) => s.t0), LOGO_T = CFG.logo_t;
const ROT = [-1.2, 1.0, -0.8, 1.3, -1.0, 0.7, -1.3, -0.9, 1.2, -0.7, 1.0, -1.1, 0.9, -0.6, 1.1];
const SHOTS = S.map((s, i) => ({ id: i + 1, key: s.plate + '#' + i, era: i, t0: s.t0, t1: STARTS[i + 1] ?? NEW_DUR, title: s.ch }));
const after = (t) => STARTS.find((s) => s > t + 0.01) ?? NEW_DUR;
const TIMELINE = {
  width: W, height: H, fps: FPS, bpm: 120, duration: NEW_DUR, frames: NEW_FRAMES, loop: NEW_FRAMES / FPS,
  safe: SAFE, format: 'zine', shots: SHOTS, cuts: STARTS.slice(1), morphs: [], cues: { payoff: CFG.payoff },
  acts: [
    { name: '1 Build', role: 'journey', t0: 0, t1: CFG.payoff - 0.45 },
    { name: '2 Silence', role: 'silence', t0: CFG.payoff - 0.45, t1: CFG.payoff },
    { name: '3 Payoff', role: 'gift', t0: CFG.payoff, t1: after(CFG.payoff) },
    { name: '4 Story', role: 'journey', t0: after(CFG.payoff), t1: CFG.quiet_from },
    { name: '5 Close', role: 'goodbye', t0: CFG.quiet_from, t1: NEW_DUR },
  ],
  board: SHOTS.map((s) => ({ t: s.t0 + (s.t1 - s.t0) * 0.75, title: s.title, sound: '', next: '' })),
  narration: VOICE.lines.map((l) => ({ t0: l.t0, t1: l.t1, text: CFG.captions[l.id] || l.text }))
    .concat(CFG.button ? [{ t0: CFG.button.at, t1: CFG.button.end, text: CFG.button.caption }] : []),
};
window.TIMELINE = TIMELINE;

// ---- camera: eased moves between keys (0.8 s each); zoom 1 = the full plate width
function camAt(i, t) {
  const K = S[i].cam; let c = K[0].slice(1);
  for (let k = 1; k < K.length; k++) { const u = EZ.io(seg(t, K[k][0], K[k][0] + 0.8)); if (u <= 0) break; c = c.map((v, j) => lerp(v, K[k][j + 1], u)); }
  return c;
}
const X0 = 50, Y0 = 300, WP = 980, HP = 1225, WI = WP - 24, HI = HP - 24;
function cropOf(c) { const sw = 1024 / c[2], sh = 1280 / c[2]; return { sw, sh, sx: clamp(c[0] - sw / 2, 0, 1024 - sw), sy: clamp(c[1] - sh / 2, 0, 1536 - sh) }; }
function plate(i, o = {}) {
  const sc = S[i], img = asset(sc.plate + '.jpg');
  const k = o.done ? 1 : EZ.back(clamp((TT - sc.t0) / 0.25)), s = lerp(1.1, 1, k), rot = ROT[i % ROT.length] * DEG + (1 - k) * 0.06;
  const c = o.done ? sc.cam[sc.cam.length - 1].slice(1) : camAt(i, TT), cr = cropOf(c), f = WI / cr.sw;
  ctx.save(); ctx.translate(X0 + WP / 2 + (o.dx ?? 0), Y0 + HP / 2 + (o.dy ?? 0)); ctx.rotate(rot); ctx.scale(s, s);
  const P = torn(wobble(rect(-WP / 2, -HP / 2, WP, HP, 2), true, 1.4, 'pl' + i, 9), 'pl' + i, 4);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12; trace(P, true); ctx.fillStyle = '#e8dcc1'; ctx.fill(); ctx.restore();
  const Q = torn(wobble(rect(-WP / 2 + 12, -HP / 2 + 12, WI, HI, 2), true, 1.2, 'pq' + i, 9), 'pq' + i, 2.5);
  ctx.save(); trace(Q, true); ctx.clip();
  if (img) ctx.drawImage(img, cr.sx, cr.sy, cr.sw, cr.sh, -WP / 2 + 12, -HP / 2 + 12, WI, HI);
  const R = RNG('toner', i, B); ctx.fillStyle = 'rgba(20,18,16,0.35)'; ctx.beginPath();
  for (let n = 0; n < 900; n++) ctx.rect(R.r(-WP / 2, WP / 2), R.r(-HP / 2, HP / 2), R.r(1, 2.6), R.r(1, 2.6)); ctx.fill();
  if (!o.done) {
    const L = (ux, uy) => [-WP / 2 + 12 + (ux - cr.sx) * f, -HP / 2 + 12 + (uy - cr.sy) * f];
    for (const m of sc.marks) {
      const [type, t, ux, uy, a, b, colName, dur] = m, col = COL[colName] ?? COL.teal; if (TT < t) continue;
      if (type === 'circle') {
        const P2 = []; for (let n = 0; n <= 44; n++) { const an = -2.2 + n / 44 * (TAU + 0.5); P2.push(L(ux + Math.cos(an) * a * (1 + 0.05 * Math.sin(n * 0.7)), uy + Math.sin(an) * b * (1 + 0.04 * Math.cos(n * 0.9)))); }
        ink(P2, { w: 11, color: col, amt: 2.6, key: 'mc' + i + t, frac: ev(t, 0.5), double: true });
      } else {
        const RW = RNG('mw', i, t), P2 = []; let y = uy; for (let n = 0; n <= 40; n++) { P2.push(L(ux + a * n / 40, y)); y += RW.n(b / 9); }
        ink(P2, { w: 9, color: col, amt: 1.2, key: 'mw' + i + t, frac: EZ.o2(ev(t, dur ?? 1.1)), double: true });
      }
    }
  }
  ctx.restore(); ctx.restore();
}
function strip(str, t, cx, cy, size, rot, colName) {
  if (TT < t - 1e-6) return;
  const stroke = COL[colName] ?? null;
  const k = EZ.back(clamp((TT - t) / 0.2)), s = lerp(1.3, 1, k), thai = /[฀-๿]/.test(str);
  const font = thai ? `900 ${size}px ${THAIF}` : `700 ${size}px ${HEADF}`, sx = thai ? 0.86 : 1;
  ctx.save(); ctx.font = font; const w = ctx.measureText(str).width * sx; ctx.restore();
  const pad = size * 0.32, h = size * (thai ? 1.45 : 1.08), fit = (w + pad * 2) > 840 ? 840 / (w + pad * 2) : 1, bw = w + pad * 2;
  cx = clamp(cx, 70 + bw * fit / 2, 925 - bw * fit / 2);   // inside x 60–940 (phone UI on the right)
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot + (1 - k) * 0.08); ctx.scale(s * fit, s * fit);
  cut(rect(-bw / 2, -h / 2, bw, h, 2), CREAM, { key: 'st' + str, tear: 2.6, amt: 1.6, sb: 16, sy: 9, shc: 'rgba(0,0,0,0.5)', grain: 0.7, shade: false });
  ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = INK;
  const by = size * (thai ? 0.36 : 0.355);
  ctx.save(); ctx.scale(sx, 1); const R = RNG('bleed', str);
  ctx.globalAlpha = 0.18; for (let n = 0; n < 3; n++) ctx.fillText(str, R.n(2), by + R.n(2));
  ctx.globalAlpha = 1; ctx.fillText(str, 0, by); ctx.restore();
  const J = RNG('wear', str); ctx.fillStyle = CREAM; ctx.globalAlpha = 0.5; ctx.beginPath();
  for (let n = 0; n < w * size / 160; n++) ctx.rect(J.r(-w / 2, w / 2), J.r(-size * 0.4, size * 0.4), J.r(1, 3), J.r(1, 2.5)); ctx.fill(); ctx.globalAlpha = 1;
  ctx.restore();
  if (stroke) { const f = ev(t + 0.3, 0.35), L = Math.min(bw * fit * 0.7, 640); if (f > 0) ink([[cx - L / 2, cy + h * fit * 0.62 + 6], [cx + L / 2, cy + h * fit * 0.62 - 10]], { w: 11, color: stroke, amt: 3, key: 'ul' + str, frac: f, double: true }); }
}
function capNow(t) {
  for (const [a, b, txt] of CFG.end_caps) if (t >= a && t < b) return { txt, p: clamp((t - a) / Math.max(0.3, b - a - 0.3)) };
  const L = VOICE.lines;
  for (let i = 0; i < L.length; i++) { const nx = L[i + 1]; if (t >= L[i].t0 - 0.05 && t < Math.min(nx ? nx.t0 - 0.05 : 1e9, L[i].t1 + 0.6)) return { txt: CFG.captions[L[i].id] || L[i].text, p: clamp((t - L[i].t0) / Math.max(0.2, L[i].t1 - L[i].t0)) }; }
  return null;
}
function caption(c) {
  ctx.save(); let fs = 52; ctx.font = `700 ${fs}px ${THAIF}`; let w = ctx.measureText(c.txt).width; if (w > 820) { fs = Math.floor(fs * 820 / w); ctx.font = `700 ${fs}px ${THAIF}`; w = ctx.measureText(c.txt).width; }
  ctx.translate(500, 1440); ctx.rotate(-0.008);
  cut(rect(-w / 2 - 26, -fs * 0.95, w + 52, fs * 1.75, 2), '#f3ead6', { key: 'cap' + c.txt.length, tear: 1.6, sb: 10, sy: 5, shc: 'rgba(0,0,0,0.5)', grain: 0.4, shade: false });
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(165,150,214,0.55)'; ctx.fillRect(-w / 2 - 6, -fs * 0.62, (w + 12) * c.p, fs * 1.1); ctx.restore();
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(c.txt, 0, fs * 0.42); ctx.restore();
}
const eraOf = (t) => { let e = 0; for (let i = 0; i < STARTS.length; i++) if (t >= STARTS[i] - 1e-6) e = i; return e; };
function renderFrame(t, canvas) {
  const cv = canvas || document.getElementById('c'); ctx = cv.getContext('2d');
  F = ((Math.round(t * FPS) % NEW_FRAMES) + NEW_FRAMES) % NEW_FRAMES; B = Math.floor(F / 2); TT = B * 2 / FPS;
  const e = eraOf(F / FPS); E0 = STARTS[e]; if (TT < E0) TT = E0;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const J = RNG('bgj', B); ctx.fillStyle = '#1b1917'; ctx.fillRect(0, 0, W, H);
  const bg = asset('bg-charcoal.jpg'); if (bg) ctx.drawImage(bg, 0, 0, 1024, 1536, -120 + J.n(1.5), J.n(1.5), 1320, 1980);
  ink([[60, 1650], [330, 1560]], { w: 9, color: COL.teal, amt: 2.5, key: 'gd1' }); ink([[760, 1720], [1010, 1640]], { w: 9, color: COL.lav, amt: 2.5, key: 'gd2' });
  if (e > 0) plate(e - 1, { done: true, dx: -14 * (e % 2 ? 1 : -1), dy: 10 });
  plate(e);
  ctx.save(); ctx.font = `400 30px ${TYPEF}`; ctx.fillStyle = 'rgba(239,227,200,0.85)'; ctx.textAlign = 'center'; ctx.fillText(CFG.tagline, 520, 118); ctx.restore();
  strip(CFG.title, -10, 520, 205, 96, -0.022, null);
  ctx.font = `700 34px ${HEADF}`; const cw = ctx.measureText(S[e].ch).width; ctx.save(); ctx.translate(915 - cw / 2, 312); ctx.rotate(0.03);
  cut(rect(-cw / 2 - 18, -26, cw + 36, 48, 2), INK, { key: 'chap' + e, tear: 1.5, sb: 6, shc: 'rgba(0,0,0,0.4)', grain: false, shade: false });
  ctx.font = `700 34px ${HEADF}`; ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.fillText(S[e].ch, 0, 12); ctx.restore();
  for (const k of S[e].keys) strip(k[0], k[1], k[2], k[3], k[4], k[5], k[6]);
  const c = capNow(t); if (c) caption(c);
  { const R = RNG('speck', B); ctx.fillStyle = 'rgba(10,8,6,0.22)'; ctx.beginPath(); for (let n = 0; n < 2600; n++) ctx.rect(R.r(0, W), R.r(0, H), 1.8, 1.8); ctx.fill();
    ctx.fillStyle = 'rgba(245,235,210,0.12)'; ctx.beginPath(); for (let n = 0; n < 1600; n++) ctx.rect(R.r(0, W), R.r(0, H), 1.6, 1.6); ctx.fill();
    const v = ctx.createRadialGradient(540, 900, 650, 540, 900, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.35)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
  // the approved wordmark, unchanged, after the print pass (never textured, rotated or recoloured):
  // a small corner badge for the whole reel (CFG.logo_corner: 'bottom-right' | 'top' | null), large on the end card at
  // LOGO_T (the corner badge hides then). Bottom-right sits under the captions, right edge at x 925 (left of the phone's buttons)
  const logo = asset('quantcorner-wordmark-dark.png');
  if (logo && CFG.logo_corner && !(LOGO_T != null && TT >= LOGO_T)) {
    const lw = CFG.logo_corner === 'top' ? 260 : 240, lh = lw * logo.naturalHeight / logo.naturalWidth;
    if (CFG.logo_corner === 'top') ctx.drawImage(logo, 520 - lw / 2, 30, lw, lh); else ctx.drawImage(logo, 925 - lw, 1520, lw, lh);
  }
  if (logo && LOGO_T != null && TT >= LOGO_T) { const k = EZ.o3(clamp((TT - LOGO_T) / 0.3)), lw = 560 * lerp(0.92, 1, k), lh = lw * logo.naturalHeight / logo.naturalWidth; ctx.globalAlpha = k; ctx.drawImage(logo, 500 - lw / 2, 1423 - lh / 2, lw, lh); ctx.globalAlpha = 1; }
  ctx.restore();
  return SHOTS[e].id;
}
const RFZ = renderFrame; window.renderFrame = renderFrame; window.anchorAt = () => null;
function shotAtFrame(fr) { return SHOTS[eraOf(fr / FPS)]; }   // read by the animate review tool
const eraAt = (t) => eraOf(t);
// ---- sound design (Nuth's library + licensed set, see assets/sfx/LICENSES.md); mixed by scripts/mix_sfx.py
window.SFX_EVENTS = (() => {
  const E = [];
  S.forEach((sc, i) => {
    if (i > 0) E.push(['SWOOSH #3.mp3', sc.t0 - 0.3, -17], ['QUIKTEAR.WAV', sc.t0 - 0.06, -16], ['paper-slip.wav', sc.t0, -13]);
    sc.cam.slice(1).forEach(([t]) => { if (t - sc.t0 > 0.5) E.push(['SWOOSH #5.mp3', t - 0.05, -21]); });
    sc.keys.forEach(([, t]) => { if (t > sc.t0 + 0.1 || i === 0) E.push(['THUDHIT.WAV', t, -17], ['soft-thock.wav', t, -13]); });
    sc.marks.forEach(([, t]) => E.push(['tick.wav', t, -18]));
  });
  E.push(['DRAMATIC IMPACT (FROM BLACK OPS 3 TRAILER).mp3', CFG.payoff, -7], ['impact-bass-1.mp3', CFG.payoff, -13]);
  for (const [t, kind] of CFG.accents) if (kind === 'boom') E.push(['BOOM SWOOSH.mp3', t - 0.45, -13]);
  if (CFG.end_card) E.push(['Clock Ticking Sound Effect.mp3', CFG.end0, -24]);
  if (CFG.button) E.push(['SHRTBASS.mp3', CFG.button.at, -13], ['impact-bass-1.mp3', CFG.button.at, -17]);
  if (LOGO_T != null) E.push(['QUIETPOP.WAV', LOGO_T, -16]);
  return E.filter((e) => e[1] >= 0 && e[1] < NEW_DUR).sort((a, b) => a[1] - b[1]);
})();
window.MUSIC_CUES = { payoff: CFG.payoff, quiet_from: CFG.quiet_from, button: CFG.button ? CFG.button.at : NEW_DUR, duration: NEW_DUR };
if (!new URLSearchParams(location.search).has('export')) {
  const QS = new URLSearchParams(location.search), go = () => {
    if (QS.has('t')) { RFZ(parseFloat(QS.get('t'))); return; }
    const t0 = performance.now(); const tick = () => { RFZ(Math.floor(((performance.now() - t0) / 1000 % NEW_DUR) * FPS) / FPS); requestAnimationFrame(tick); }; tick();
  };
  if (window.ASSETS_READY) window.ASSETS_READY.then(go); else go();
}
