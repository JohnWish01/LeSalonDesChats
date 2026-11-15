/* Le Salon des Chats : tout le dessin (chats, objets, pièces, effets). */

let ctx = null;            // contexte de dessin courant (la pièce, ou un aperçu)
const OUT = 'rgba(20,10,12,.35)';
function blob(fill, path){ ctx.beginPath(); path(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = OUT; ctx.stroke(); }
const ell = (x, y, rx, ry, r = 0) => () => ctx.ellipse(x, y, rx, ry, r, 0, Math.PI * 2);
const now = () => performance.now() / 1000;
function withCtx(c2, fn){ const old = ctx; ctx = c2; try { fn(); } finally { ctx = old; } }

/* ================= CHATS ================= */
const SPOTS = [[-.6, -.4], [-.25, -.62], [.1, -.3], [.45, -.55], [-.45, .1], [.2, .15], [.62, -.1], [-.1, .45], [.4, .45]];
const STARS = [[-.6, -.3], [-.2, -.6], [.15, -.2], [.5, -.5], [-.4, .2], [.3, .3], [.65, 0], [0, .5], [-.7, .1], [.4, -.1]];

function bodyPattern(co, x, y, rx, ry){
  const T = now();
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
  switch (co.pat){
    case 'tabby': case 'fluffy':
      ctx.strokeStyle = co.dark; ctx.globalAlpha = co.pat === 'fluffy' ? .55 : 1; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
      for (let i = -2; i <= 2; i++){ ctx.beginPath(); ctx.moveTo(x + i * rx * .36 - 3, y - ry); ctx.quadraticCurveTo(x + i * rx * .36 + 4, y - ry * .2, x + i * rx * .36 - 2, y + ry * .25); ctx.stroke(); }
      ctx.globalAlpha = 1;
      if (co.pat === 'fluffy'){ ctx.fillStyle = '#e8d6c0'; ctx.beginPath(); ctx.ellipse(x + rx * .62, y + ry * .15, rx * .35, ry * .85, 0, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'tux':
      ctx.fillStyle = '#f4efe7'; ctx.beginPath(); ctx.ellipse(x + rx * .35, y + ry * .75, rx * .7, ry * .55, 0, 0, Math.PI * 2); ctx.fill(); break;
    case 'calico':
      ctx.fillStyle = '#e08a3c'; ctx.beginPath(); ctx.ellipse(x - rx * .4, y - ry * .5, rx * .45, ry * .6, .4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a2527'; ctx.beginPath(); ctx.ellipse(x + rx * .35, y - ry * .6, rx * .35, ry * .45, -.3, 0, Math.PI * 2); ctx.fill(); break;
    case 'points': {
      const g = ctx.createLinearGradient(x - rx, 0, x + rx, 0); g.addColorStop(0, 'rgba(90,64,51,.45)'); g.addColorStop(.4, 'rgba(90,64,51,0)');
      ctx.fillStyle = g; ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2); break;
    }
    case 'spots':
      for (const [u, v] of SPOTS){
        ctx.fillStyle = co.dark; ctx.beginPath(); ctx.ellipse(x + u * rx, y + v * ry, rx * .13, ry * .22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = mix(co.base, co.dark, .35); ctx.beginPath(); ctx.ellipse(x + u * rx, y + v * ry, rx * .06, ry * .1, 0, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case 'sphynx':
      ctx.strokeStyle = 'rgba(150,90,80,.45)'; ctx.lineWidth = 1.3;
      for (let i = 0; i < 3; i++){ ctx.beginPath(); ctx.arc(x - rx * .1 + i * rx * .25, y - ry * .2, ry * .6, Math.PI * 1.15, Math.PI * 1.6); ctx.stroke(); }
      break;
    case 'gold': {
      const pos = ((T * .45) % 2 - .5) * rx * 3;
      const g = ctx.createLinearGradient(x + pos - 22, y - ry, x + pos + 22, y + ry);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,250,210,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2); break;
    }
    case 'galaxy': {
      const g = ctx.createRadialGradient(x - rx * .2, y - ry * .2, 1, x, y, rx);
      g.addColorStop(0, 'rgba(160,90,230,.6)'); g.addColorStop(.5, 'rgba(230,90,170,.25)'); g.addColorStop(1, 'rgba(40,40,110,0)');
      ctx.fillStyle = g; ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2);
      STARS.forEach(([u, v], i) => { ctx.globalAlpha = .5 + .5 * Math.sin(T * 3 + i * 1.7); ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(x + u * rx, y + v * ry, 1.3, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1; break;
    }
  }
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.lineWidth = 1.6; ctx.strokeStyle = OUT; ctx.stroke();
}

/* ================= OBJETS ================= */
function kibbles(cx, cy, rx, n, color){
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++){ const a = i * 2.4, r = (i % 5) / 4 * rx; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .25 - (i > 8 ? 2 : 0), 2.4, 0, Math.PI * 2); ctx.fill(); }
}
function dish(x, w, col, top){
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - w, -12); ctx.lineTo(x + w, -12); ctx.lineTo(x + w * .72, 1); ctx.lineTo(x - w * .72, 1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = top; ctx.beginPath(); ctx.ellipse(x, -12, w, w * .23, 0, 0, Math.PI * 2); ctx.fill();
}
function shadow(rx, ry = rx * .18){ ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(0, 2, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }

function drawBowl(o){
  const d = ITEMS[o.type], f = clamp((o.food || 0) / d.cap, 0, 1), col = foodById(o.foodType).color;
  if (o.type === 'bowl1'){
    shadow(24); dish(0, 22, '#4f8fd6', '#7bb3ee'); kibbles(0, -13, 15, Math.ceil(f * 14), col);
  } else if (o.type === 'bowl2'){
    shadow(34); blob('#d9c9a8', () => ctx.roundRect(-34, -6, 68, 8, 4));
    ctx.save(); ctx.translate(0, -4);
    dish(-15, 15, '#d65a5a', '#ef8a8a'); dish(15, 15, '#d65a5a', '#ef8a8a');
    kibbles(-15, -13, 10, Math.ceil(f * 9), col); kibbles(15, -13, 10, Math.ceil(Math.max(0, f - .1) * 9), col);
    ctx.restore();
  } else {
    shadow(28); dish(0, 24, '#7a8a96', '#a8b6c0'); kibbles(0, -13, 15, Math.ceil(Math.min(1, f * 3) * 12), col);
    blob('rgba(220,235,245,.55)', () => ctx.roundRect(-13, -56, 26, 40, 5));
    ctx.save(); ctx.beginPath(); ctx.roundRect(-13, -56, 26, 40, 5); ctx.clip();
    const lvl = 36 * f; ctx.fillStyle = col; ctx.fillRect(-13, -18 - lvl, 26, lvl);
    ctx.fillStyle = 'rgba(0,0,0,.15)'; for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.arc(-9 + (i * 7) % 18, -20 - (i * 5) % Math.max(1, lvl), 1.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    blob('#5d6b76', () => ctx.roundRect(-15, -60, 30, 6, 3));
  }
}

function drawWater(o){
  const t = now();
  if (o.type === 'water1'){
    shadow(22); dish(0, 20, '#e8eef3', '#7cc4e8');
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1; const k = (t * .5) % 1;
    ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(0, -12, 5 + k * 12, 1 + k * 2.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    return;
  }
  const big = o.type === 'water3';
  const w = big ? 40 : 36;
  shadow(w + 4);
  blob('#e8eef3', () => { ctx.moveTo(-w, -16); ctx.lineTo(w, -16); ctx.lineTo(w - 8, 0); ctx.lineTo(-w + 8, 0); ctx.closePath(); });
  ctx.fillStyle = big ? '#d8708e' : '#5aa6d6'; ctx.fillRect(-w + 4, -10, w * 2 - 8, 3);
  ctx.fillStyle = '#7cc4e8'; ctx.beginPath(); ctx.ellipse(0, -16, w - 2, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1;
  for (let i = 0; i < 2; i++){ const k = (t * .8 + i * .5) % 1; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(0, -16, 8 + k * (w - 12), 1.5 + k * 3.5, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalAlpha = 1;
  const top = big ? -46 : -34;
  blob('#d5dee6', () => ctx.roundRect(-5, top, 10, -top - 16, 3));
  if (big){
    ['#f29ab4', '#f6b8ca', '#f29ab4'].forEach((c, i) => { ctx.save(); ctx.translate(0, top + 2); ctx.rotate((i - 1) * .7); blob(c, ell(0, -9, 6, 10)); ctx.restore(); });
    blob('#ffd75a', ell(0, top, 4, 4));
  }
  ctx.strokeStyle = 'rgba(150,210,240,.85)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  for (const sd of [-1, 1]){ ctx.beginPath(); ctx.moveTo(0, top); ctx.quadraticCurveTo(sd * (big ? 16 : 10), top - 10, sd * (big ? 22 : 14), -17); ctx.stroke(); }
  ctx.fillStyle = 'rgba(210,240,255,.9)';
  for (let i = 0; i < 4; i++){ const k = (t * 1.6 + i / 4) % 1, sd = i % 2 ? 1 : -1; ctx.beginPath(); ctx.arc(sd * (3 + k * (big ? 18 : 11)), top - Math.sin(k * Math.PI) * 8 + k * (-top - 18), 1.2, 0, Math.PI * 2); ctx.fill(); }
}

function drawLitter(o, x, y, s){
  const d = ITEMS[o.type], frac = (o.dirt || 0) / d.uses, t = now();
  shadow(42, 7);
  if (o.type === 'litter1'){
    blob('#5f86a3', () => { ctx.moveTo(-38, -16); ctx.lineTo(38, -16); ctx.lineTo(32, 0); ctx.lineTo(-32, 0); ctx.closePath(); });
    blob('#7fa6c2', () => ctx.roundRect(-40, -21, 80, 7, 3));
    ctx.fillStyle = mix('#ecdcb2', '#c9b282', frac); ctx.beginPath(); ctx.ellipse(0, -19, 35, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a5530';
    for (const cl of (o.clumps || [])){ ctx.beginPath(); ctx.ellipse(cl[0] * 26, -20 + cl[1] * 2.5, 5.5, 3, 0, 0, Math.PI * 2); ctx.fill(); }
  } else if (o.type === 'litter2'){
    blob('#8a6aa8', () => { ctx.moveTo(-38, -16); ctx.lineTo(38, -16); ctx.lineTo(32, 0); ctx.lineTo(-32, 0); ctx.closePath(); });
    blob('#a98ac6', () => { ctx.moveTo(-38, -16); ctx.bezierCurveTo(-38, -52, 38, -52, 38, -16); ctx.closePath(); });
    blob('#3a2a46', () => { ctx.moveTo(-12, -16); ctx.bezierCurveTo(-12, -34, 12, -34, 12, -16); ctx.closePath(); });
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.ellipse(-20, -36, 8, 3, -.5, 0, Math.PI * 2); ctx.fill();
  } else {
    blob('#e9edf0', () => { ctx.moveTo(-38, -10); ctx.bezierCurveTo(-40, -58, 40, -58, 38, -10); ctx.lineTo(32, 0); ctx.lineTo(-32, 0); ctx.closePath(); });
    blob('#2f3a44', () => ctx.ellipse(0, -22, 14, 13, 0, 0, Math.PI * 2));
    blob('#c9d3da', () => ctx.roundRect(-36, -10, 72, 10, 4));
    ctx.fillStyle = frac < .5 ? '#5ad16a' : frac < 1 ? '#f2b84a' : '#ef5a5a';
    ctx.beginPath(); ctx.arc(26, -6, 2.4, 0, Math.PI * 2); ctx.fill();
  }
  if (frac >= (d.covered ? .75 : .5)) stinkLines(x, y, s, t);
}
function stinkLines(x, y, s, t){
  ctx.restore(); ctx.save();
  ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++){
    const k = (t * .6 + i / 3) % 1, bx = x + (i - 1) * 14 * s, by = y - (30 + k * 40) * s;
    ctx.strokeStyle = `rgba(150,200,90,${(1 - k) * .85})`; ctx.beginPath();
    for (let j = 0; j <= 8; j++){ const yy = by - j * 2.2 * s, xx = bx + Math.sin(j * .9 + t * 4 + i) * 3 * s; j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke();
  }
}

function drawBoxItem(o){
  const oc = o.occupant && o.occupant.state === 'box' ? o.occupant : null;
  const shake = Math.max(0, (o.shakeUntil || 0) - performance.now()) / 450;
  ctx.rotate(Math.sin(performance.now() / 28) * .07 * shake);
  shadow(44, 8);
  blob('#7d4f2a', () => { ctx.moveTo(-36, -34); ctx.lineTo(-28, -44); ctx.lineTo(28, -44); ctx.lineTo(36, -34); ctx.closePath(); });
  if (oc){ ctx.save(); ctx.scale(oc.dir, 1); head(oc.coat, 0, -44, 14, oc.lazy > .5 && oc.timer > 3, {acc: oc.acc, kitten: oc.kitten}); ctx.restore(); }
  blob('#c98b4f', () => ctx.rect(-36, -34, 72, 34));
  ctx.fillStyle = 'rgba(255,235,200,.3)'; ctx.fillRect(-5, -34, 10, 34);
  blob('#b47a42', () => { ctx.moveTo(-36, -34); ctx.lineTo(-54, -48); ctx.lineTo(-40, -56); ctx.lineTo(-26, -43); ctx.closePath(); });
  blob('#b47a42', () => { ctx.moveTo(36, -34); ctx.lineTo(54, -46); ctx.lineTo(44, -55); ctx.lineTo(27, -43); ctx.closePath(); });
  if (oc){
    const pc = oc.coat.pat === 'tux' ? '#f4efe7' : oc.coat.pat === 'points' ? oc.coat.dark : oc.coat.base;
    blob(pc, ell(-8, -35, 5, 3.5)); blob(pc, ell(8, -35, 5, 3.5));
  }
}

function drawBed(o){
  const oc = o.occupant && o.occupant.state === 'bed' ? o.occupant : null;
  if (o.type === 'bed1'){
    shadow(40, 7);
    blob('#a8743e', () => { ctx.moveTo(-38, -20); ctx.quadraticCurveTo(-40, 2, 0, 2); ctx.quadraticCurveTo(40, 2, 38, -20); ctx.closePath(); });
    ctx.strokeStyle = 'rgba(80,50,20,.35)'; ctx.lineWidth = 1.2;
    for (let i = -3; i <= 3; i++){ ctx.beginPath(); ctx.moveTo(i * 10, -19); ctx.lineTo(i * 9, 0); ctx.stroke(); }
    blob('#efe2c8', ell(0, -20, 34, 8));
  } else {
    shadow(44, 8);
    blob('#a3283a', () => ctx.roundRect(-42, -24, 84, 24, 12));
    blob('#c23a4e', ell(0, -22, 38, 8));
    ctx.strokeStyle = '#e8c35a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-40, -22, 80, 20, 10); ctx.stroke();
    ctx.fillStyle = '#e8c35a';
    for (const sx of [-42, 42]){ ctx.beginPath(); ctx.moveTo(sx, -6); ctx.lineTo(sx - 3, 4); ctx.lineTo(sx + 3, 4); ctx.closePath(); ctx.fill(); }
  }
  if (oc){ ctx.save(); ctx.translate(0, -16); const k = .9; ctx.scale(oc.dir * k, k); drawCatBody(oc, 'sleep'); ctx.restore(); }
}

const TREE_SPOTS = [[-24, -78], [8, -152], [-20, -222]];
function drawTree(o){
  const lv = ITEMS[o.type].levels, t = now();
  shadow(54, 9);
  const post = (x, y0, y1) => {
    blob('#d9b98a', () => ctx.rect(x - 7, y1, 14, y0 - y1));
    ctx.strokeStyle = 'rgba(120,85,45,.55)'; ctx.lineWidth = 1.2;
    for (let y = y1 + 4; y < y0; y += 5){ ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y + 2.5); ctx.stroke(); }
  };
  const deck = (x, y, w) => { blob('#7b5a8c', () => ctx.roundRect(x - w / 2, y, w, 9, 4)); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x - w / 2 + 3, y + 1.5, w - 6, 2.5); };
  if (lv >= 3) post(-20, -150, -222);
  if (lv >= 2) post(8, -4, -152);
  post(-24, -4, -78);
  blob('#6a4c7a', () => ctx.roundRect(-48, -10, 96, 12, 5));
  deck(-24, -78, 60);
  const sw = Math.sin(t * 1.8) * 6;
  ctx.strokeStyle = '#e9dcc6'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-46, -69); ctx.lineTo(-46 + sw, -40); ctx.stroke();
  ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.arc(-46 + sw, -37, 5, 0, Math.PI * 2); ctx.fill();
  if (lv >= 2) deck(8, -152, 70);
  if (lv >= 3){
    blob('#8e6aa0', () => ctx.roundRect(4, -146, 34, 30, 5));
    blob('#3a2a46', ell(21, -131, 8, 9));
    deck(-20, -222, 64);
  }
}

function drawScratch(o){
  const t = now();
  shadow(30, 6);
  blob('#7b5a8c', () => ctx.roundRect(-26, -9, 52, 10, 4));
  blob('#d9b98a', () => ctx.rect(-8, -88, 16, 80));
  ctx.strokeStyle = 'rgba(120,85,45,.55)'; ctx.lineWidth = 1.2;
  for (let y = -84; y < -10; y += 5){ ctx.beginPath(); ctx.moveTo(-8, y); ctx.lineTo(8, y + 2.5); ctx.stroke(); }
  blob('#6a4c7a', ell(0, -90, 16, 5));
  const sw = Math.sin(t * 2.2) * 5;
  ctx.strokeStyle = '#e9dcc6'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(12, -90); ctx.lineTo(16 + sw, -62); ctx.stroke();
  ctx.fillStyle = '#5ac8b8'; ctx.beginPath(); ctx.arc(16 + sw, -59, 4.5, 0, Math.PI * 2); ctx.fill();
}

function drawToy(o){
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0, 1, 12, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.lineCap = 'round';
  const face = o.face || 1, rot = o.rot || 0;
  if (o.type === 'mouse' || o.type === 'robot'){
    ctx.scale(face, 1);
    ctx.strokeStyle = '#c98a9a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-9, -4); ctx.quadraticCurveTo(-16, -2, -18, -7 + Math.sin(rot) * 2); ctx.stroke();
    blob(o.type === 'robot' ? '#b8c0c8' : '#9aa0a6', ell(0, -5, 10, 5.5));
    if (o.type === 'robot'){
      ctx.save(); ctx.translate(-2, -11); ctx.rotate(now() * 6);
      ctx.fillStyle = '#e8c35a'; ctx.fillRect(-5, -1, 10, 2); ctx.fillRect(-1, -5, 2, 4); ctx.restore();
    }
    ctx.fillStyle = '#f0b6c4'; ctx.beginPath(); ctx.arc(4, -10, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(10, -4.5, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(7, -6, 1, 0, Math.PI * 2); ctx.fill();
  } else if (o.type === 'bell'){
    ctx.translate(0, -6); ctx.rotate(rot);
    blob('#7ad0c8', ell(0, 0, 6, 6));
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.moveTo(0, -6); ctx.lineTo(0, 6); ctx.stroke();
    ctx.fillStyle = '#f2c94c'; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); ctx.fill();
  } else if (o.type === 'fish'){
    ctx.scale(face, 1);
    blob('#f29a4a', () => { ctx.moveTo(-8, -5); ctx.lineTo(-15, -10); ctx.lineTo(-14, 0); ctx.closePath(); });
    blob('#f6a95c', ell(0, -5, 10, 5));
    ctx.strokeStyle = 'rgba(180,90,30,.6)'; ctx.lineWidth = 1;
    for (const x of [-3, 1]){ ctx.beginPath(); ctx.arc(x, -5, 4, -.9, .9); ctx.stroke(); }
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(6, -6, 1, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = '#d0486c'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-3, -1); ctx.quadraticCurveTo(-18, 2, -26 - Math.sin(rot) * 5, -1); ctx.stroke();
    ctx.translate(0, -9); ctx.rotate(rot);
    ctx.fillStyle = '#e0577a'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f6a3bb'; ctx.lineWidth = 1.3;
    for (let i = 0; i < 4; i++){ ctx.beginPath(); ctx.ellipse(0, 0, 8.3, 2.2 + i * 1.8, i * .8, 0, Math.PI * 2); ctx.stroke(); }
  }
}

function drawRug(o){
  if (o.type === 'rug1'){
    ctx.fillStyle = '#b8493f'; ctx.beginPath(); ctx.ellipse(0, 0, 90, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e8a64e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, 0, 72, 16, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(232,166,78,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 48, 10, 0, 0, Math.PI * 2); ctx.stroke();
  } else {
    const q = () => { ctx.moveTo(-96, -22); ctx.lineTo(96, -22); ctx.lineTo(112, 22); ctx.lineTo(-112, 22); ctx.closePath(); };
    ctx.beginPath(); q(); ctx.fillStyle = '#2f3f7a'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-84, -16); ctx.lineTo(84, -16); ctx.lineTo(97, 16); ctx.lineTo(-97, 16); ctx.closePath(); ctx.fillStyle = '#9c2f3a'; ctx.fill();
    ctx.strokeStyle = '#e8c35a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#e8c35a'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f3f7a'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(232,195,90,.7)';
    for (let i = -4; i <= 4; i++){ ctx.beginPath(); ctx.arc(i * 21, -19, 1.6, 0, Math.PI * 2); ctx.arc(i * 24, 19, 1.6, 0, Math.PI * 2); ctx.fill(); }
  }
}

function drawPlant(o){
  const k = ITEMS[o.type].size, t = now();
  shadow(16 * k, 4 * k);
  blob('#c46a3e', () => { ctx.moveTo(-12 * k, -24 * k); ctx.lineTo(12 * k, -24 * k); ctx.lineTo(9 * k, 0); ctx.lineTo(-9 * k, 0); ctx.closePath(); });
  blob('#a8552e', () => ctx.roundRect(-13 * k, -27 * k, 26 * k, 5 * k, 2));
  const leaves = o.type === 'plant2'
    ? [[-14, -70, -.6], [12, -76, .5], [-4, -92, -.1], [18, -56, .9], [-20, -50, -1], [4, -60, .2], [-10, -82, -.4], [10, -94, .3]]
    : [[-9, -40, -.7], [9, -42, .6], [0, -50, 0], [-12, -32, -1.1], [12, -33, 1.1]];
  leaves.forEach(([lx, ly, r], i) => {
    const sw = Math.sin(t * 1.2 + i) * .05;
    ctx.save(); ctx.translate(lx * (o.type === 'plant2' ? 1 : k), ly * (o.type === 'plant2' ? 1 : k) + (o.type === 'plant2' ? 0 : 0)); ctx.rotate(r + sw);
    blob(i % 2 ? '#4f9a5a' : '#3f8a4c', ell(0, 0, 6 * (o.type === 'plant2' ? 1.4 : k * .9), 12 * (o.type === 'plant2' ? 1.4 : k * .9)));
    ctx.restore();
  });
  if (o.type === 'plant2'){ ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(0, -80); ctx.stroke(); }
}

function drawLamp(o, lit){
  if (o.type === 'lamp1'){
    shadow(18, 4);
    blob('#2a2025', ell(0, -2, 16, 4));
    ctx.fillStyle = '#2a2025'; ctx.fillRect(-1.8, -122, 3.6, 120);
    blob(lit ? '#ffd89a' : '#d9c6a6', () => { ctx.moveTo(-26, -118); ctx.lineTo(26, -118); ctx.lineTo(16, -146); ctx.lineTo(-16, -146); ctx.closePath(); });
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(-26, -121, 52, 3);
  } else {
    shadow(14, 4);
    blob('#c9a24a', ell(0, -3, 12, 4));
    ctx.fillStyle = '#c9a24a'; ctx.fillRect(-1.6, -52, 3.2, 50);
    const g = ctx.createRadialGradient(-5, -72, 2, 0, -66, 17);
    g.addColorStop(0, lit ? '#fff6dc' : '#f4ecdc'); g.addColorStop(1, lit ? '#ffc96a' : '#d9cdb8');
    blob(g, ell(0, -66, 16, 16));
  }
}
const lampHead = o => o.type === 'lamp1' ? -132 : -66;

function drawPuddle(q){
  ctx.fillStyle = 'rgba(232,205,70,.55)'; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r, q.r * .38, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(q.x - q.r * .3, q.y - q.r * .1, q.r * .3, q.r * .08, 0, 0, Math.PI * 2); ctx.fill();
}

/* Dessine un objet posé à (x, y) avec l'échelle s. */
function drawItemAt(o, x, y, s, lit){
  const d = ITEMS[o.type];
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  switch (d.kind){
    case 'bowl': drawBowl(o); break;
    case 'water': drawWater(o); break;
    case 'litter': drawLitter(o, x, y, s); break;
    case 'box': drawBoxItem(o); break;
    case 'bed': drawBed(o); break;
    case 'tree': drawTree(o); break;
    case 'scratch': drawScratch(o); break;
    case 'toy': drawToy(o); break;
    case 'rug': drawRug(o); break;
    case 'plant': drawPlant(o); break;
    case 'lamp': drawLamp(o, lit); break;
  }
  ctx.restore();
}

/* ================= PIÈCES ================= */
function winGeom(){
  const room = G ? G.room : 'salon';
  if (room === 'veranda') return {wx: W * .05, wy: floorTop * .08, ww: W * .9, wh: floorTop * .78, sill: [.18, .42, .66, .86]};
  if (room === 'chateau'){ const ww = Math.min(W * .2, 190); return {wx: W * .5 - ww / 2, wy: floorTop * .1, ww, wh: floorTop * .72, arch: true, sill: [.3, .7]}; }
  return {wx: W * .62, wy: floorTop * .14, ww: Math.min(W * .26, 230), wh: floorTop * .62, sill: [.28, .72]};
}
function windowPath(g){
  ctx.beginPath();
  if (g.arch){ const r = g.ww / 2; ctx.moveTo(g.wx, g.wy + g.wh); ctx.lineTo(g.wx, g.wy + r); ctx.arc(g.wx + r, g.wy + r, r, Math.PI, 0); ctx.lineTo(g.wx + g.ww, g.wy + g.wh); ctx.closePath(); }
  else ctx.rect(g.wx, g.wy, g.ww, g.wh);
}
function sky(g, t){
  const sh = sunHeight(), dusk = 1 - Math.min(1, Math.abs(sh) / .35);
  const sk = ctx.createLinearGradient(0, g.wy, 0, g.wy + g.wh);
  sk.addColorStop(0, mix(mix('#16203f', '#5fb4ea', daylight), '#6a5a9a', dusk * .5));
  sk.addColorStop(1, mix(mix('#3b3d6e', '#cdeefc', daylight), '#f4a36b', dusk * .8));
  ctx.fillStyle = sk; ctx.fillRect(g.wx, g.wy, g.ww, g.wh);
  ctx.fillStyle = '#fff';
  for (const [sx, sy, sp] of STARFIELD){ ctx.globalAlpha = (.4 + .6 * Math.abs(Math.sin(t * .8 + sp * 9))) * (1 - daylight); ctx.fillRect(g.wx + sx * g.ww, g.wy + sy * g.wh * .8, 1.6, 1.6); }
  ctx.globalAlpha = 1;
  const orb = (ph, col, isSun) => {
    const k = ((ph % 1) + 1) % 1; if (k < .2 || k > .8) return;
    const u = (k - .2) / .6, r = Math.min(g.ww, g.wh, 230) * .12;
    const ox = g.wx + g.ww * (.1 + .8 * u), oy = g.wy + g.wh * (1.05 - .8 * Math.sin(Math.PI * u));
    if (isSun){ const gr = ctx.createRadialGradient(ox, oy, r * .5, ox, oy, r * 3.5); gr.addColorStop(0, 'rgba(255,240,180,.55)'); gr.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = gr; ctx.fillRect(g.wx, g.wy, g.ww, g.wh); }
    ctx.globalAlpha = isSun ? 1 : 1 - daylight * .7; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  };
  orb(dayPhase + .5, '#f7efd2', false);
  orb(dayPhase, mix('#ff9a5a', '#ffe9a0', smooth(0, .4, sh)), true);
}
const STARFIELD = Array.from({length: 40}, () => [Math.random(), Math.random(), Math.random()]);

function drawBirds(g){
  const s = Math.min(g.ww, g.wh, 230) / 180;
  ctx.lineCap = 'round';
  for (const b of birds){
    const x = g.wx + g.ww * b.u, y = g.wy + g.wh * b.v + Math.sin(b.ph * .3) * 4 * s, flap = Math.sin(b.ph);
    ctx.strokeStyle = b.col; ctx.fillStyle = b.col; ctx.lineWidth = 2.2 * s + .6;
    ctx.beginPath(); ctx.moveTo(x - 9 * s, y - flap * 6 * s);
    ctx.quadraticCurveTo(x - 4 * s, y - 2 * s - flap * 2 * s, x, y);
    ctx.quadraticCurveTo(x + 4 * s, y - 2 * s - flap * 2 * s, x + 9 * s, y - flap * 6 * s); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y + s, 3 * s, 2 * s, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawRoom(t){
  const room = G.room, g = winGeom();
  if (room === 'veranda'){
    ctx.fillStyle = mix('#3c5a48', '#a9cdb4', daylight); ctx.fillRect(0, 0, W, floorTop);
    ctx.save(); windowPath(g); ctx.clip(); sky(g, t);
    // le jardin derrière la vitre
    ctx.fillStyle = mix('#1f3a2a', '#5aa05e', daylight);
    ctx.beginPath(); ctx.moveTo(g.wx, g.wy + g.wh);
    for (let i = 0; i <= 12; i++){ const x = g.wx + g.ww * i / 12; ctx.lineTo(x, g.wy + g.wh * (.72 - (i % 2 ? .08 : 0) - Math.sin(i * 1.7) * .04)); }
    ctx.lineTo(g.wx + g.ww, g.wy + g.wh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = mix('#173022', '#3f8a4c', daylight);
    for (const u of [.12, .5, .85]){ ctx.beginPath(); ctx.arc(g.wx + g.ww * u, g.wy + g.wh * .55, g.wh * .16, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(g.wx + g.ww * u - 3, g.wy + g.wh * .6, 6, g.wh * .2); }
    drawBirds(g);
    ctx.restore();
    ctx.fillStyle = '#f2efe6';
    const n = 5; for (let i = 0; i <= n; i++) ctx.fillRect(g.wx + g.ww * i / n - 4, g.wy, 8, g.wh);
    ctx.fillRect(g.wx, g.wy - 4, g.ww, 8); ctx.fillRect(g.wx, g.wy + g.wh * .45, g.ww, 5);
    ctx.fillRect(g.wx - 10, g.wy + g.wh + 4, g.ww + 20, 9);
    // carrelage
    ctx.fillStyle = mix('#7a4636', '#c47a5a', daylight); ctx.fillRect(0, floorTop, W, H - floorTop);
    ctx.strokeStyle = 'rgba(60,25,15,.3)'; ctx.lineWidth = 1;
    for (let i = -20; i < 40; i++){ const x0 = i * 46; ctx.beginPath(); ctx.moveTo(x0, floorTop); ctx.lineTo(x0 + (H - floorTop) * .8, H); ctx.moveTo(x0, floorTop); ctx.lineTo(x0 - (H - floorTop) * .8, H); ctx.stroke(); }
    ctx.fillStyle = '#e8e2d2'; ctx.fillRect(0, floorTop - 6, W, 8);
  } else if (room === 'chateau'){
    const wall = ctx.createLinearGradient(0, 0, 0, floorTop);
    wall.addColorStop(0, mix('#3a3640', '#7d7684', daylight)); wall.addColorStop(1, mix('#4a4552', '#948c98', daylight));
    ctx.fillStyle = wall; ctx.fillRect(0, 0, W, floorTop);
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1.2;
    for (let r = 0, y = 0; y < floorTop; r++, y += 26){ ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); for (let x = (r % 2) * 30; x < W; x += 60){ ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, Math.min(y + 26, floorTop)); ctx.stroke(); } }
    ctx.save(); windowPath(g); ctx.clip(); sky(g, t); drawBirds(g); ctx.restore();
    ctx.strokeStyle = '#d8cdb8'; ctx.lineWidth = 7; windowPath(g); ctx.stroke();
    ctx.fillStyle = '#d8cdb8'; ctx.fillRect(g.wx + g.ww / 2 - 3, g.wy + g.ww / 2, 6, g.wh - g.ww / 2);
    ctx.fillRect(g.wx - 14, g.wy + g.wh + 4, g.ww + 28, 9);
    // bannières
    for (const bx of [W * .14, W * .86]){
      ctx.fillStyle = '#8a1f2e'; ctx.beginPath(); ctx.moveTo(bx - 26, floorTop * .1); ctx.lineTo(bx + 26, floorTop * .1); ctx.lineTo(bx + 26, floorTop * .7); ctx.lineTo(bx, floorTop * .62); ctx.lineTo(bx - 26, floorTop * .7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8c35a'; ctx.fillRect(bx - 28, floorTop * .1 - 4, 56, 5);
      ctx.save(); ctx.translate(bx, floorTop * .35); ctx.scale(.9, .9);
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.moveTo(-10, -4); ctx.lineTo(-7, -15); ctx.lineTo(-2, -9); ctx.moveTo(10, -4); ctx.lineTo(7, -15); ctx.lineTo(2, -9); ctx.fill();
      ctx.restore();
      // torche murale
      ctx.fillStyle = '#4a3a2a'; ctx.fillRect(bx - 2, floorTop * .78, 4, 16);
      ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.ellipse(bx, floorTop * .76 + Math.sin(t * 9 + bx) * 1.5, 4, 8, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = mix('#3a2418', '#6e4630', daylight); ctx.fillRect(0, floorTop, W, H - floorTop);
    ctx.strokeStyle = 'rgba(20,10,5,.3)';
    for (let y = floorTop + 16, i = 0; y < H; y += 16 + i * 3, i++){ ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = '#8a1f2e'; ctx.beginPath(); ctx.moveTo(W * .44, floorTop); ctx.lineTo(W * .56, floorTop); ctx.lineTo(W * .66, H); ctx.lineTo(W * .34, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e8c35a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#2a2228'; ctx.fillRect(0, floorTop - 6, W, 8);
  } else {
    const wall = ctx.createLinearGradient(0, 0, 0, floorTop);
    wall.addColorStop(0, mix('#2f4a4d', '#6f9c9a', daylight)); wall.addColorStop(1, mix('#3f6063', '#8bb3ad', daylight));
    ctx.fillStyle = wall; ctx.fillRect(0, 0, W, floorTop);
    ctx.fillStyle = 'rgba(255,255,255,.035)'; for (let x = 0; x < W; x += 36) ctx.fillRect(x, 0, 14, floorTop);
    ctx.fillStyle = '#e9dcc6'; ctx.fillRect(g.wx - 7, g.wy - 7, g.ww + 14, g.wh + 14);
    ctx.save(); windowPath(g); ctx.clip(); sky(g, t); drawBirds(g); ctx.restore();
    ctx.fillStyle = '#e9dcc6'; ctx.fillRect(g.wx + g.ww / 2 - 3, g.wy, 6, g.wh); ctx.fillRect(g.wx, g.wy + g.wh / 2 - 3, g.ww, 6);
    ctx.fillRect(g.wx - 14, g.wy + g.wh + 4, g.ww + 28, 9);
    const fl = ctx.createLinearGradient(0, floorTop, 0, H);
    fl.addColorStop(0, mix('#7a4f35', '#a07250', daylight)); fl.addColorStop(1, mix('#a66c45', '#c99366', daylight));
    ctx.fillStyle = fl; ctx.fillRect(0, floorTop, W, H - floorTop);
    ctx.strokeStyle = 'rgba(40,20,10,.25)'; ctx.lineWidth = 1;
    for (let y = floorTop + 14, i = 0; y < H; y += 14 + i * 3, i++){ ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = '#26383a'; ctx.fillRect(0, floorTop - 6, W, 8);
  }
  // rayon de soleil sur le sol
  if (daylight > .01){
    const off = (.5 - dayPhase) * W * .8;
    ctx.fillStyle = `rgba(255,240,200,${.12 * daylight})`;
    ctx.beginPath(); ctx.moveTo(g.wx, floorTop); ctx.lineTo(g.wx + g.ww, floorTop); ctx.lineTo(g.wx + g.ww + off, H); ctx.lineTo(g.wx + off, H); ctx.closePath(); ctx.fill();
  }
}

function drawNight(lamps){
  const n = 1 - daylight;
  if (n > .01){ ctx.fillStyle = `rgba(12,16,42,${.45 * n})`; ctx.fillRect(0, 0, W, H); }
  const glow = (x, y, r, a) => {
    const lg = ctx.createRadialGradient(x, y, 4, x, y, r);
    lg.addColorStop(0, `rgba(255,196,120,${a})`); lg.addColorStop(1, 'rgba(255,196,120,0)');
    ctx.fillStyle = lg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  for (const o of lamps){ const s = scaleAt(o.y); glow(o.x, o.y + lampHead(o) * s, W * (o.type === 'lamp1' ? .42 : .32), (.06 + .34 * n) * (o.type === 'lamp1' ? 1 : .9)); }
  if (G.room === 'chateau') for (const bx of [W * .14, W * .86]) glow(bx, floorTop * .76, W * .22, .05 + .25 * n);
  // horloge
  const h = dayPhase * 24, hh = Math.floor(h), mm = Math.floor((h - hh) * 4) * 15;
  const lbl = hh < 6 ? 'Nuit' : hh < 12 ? 'Matin' : hh < 18 ? 'Après-midi' : hh < 22 ? 'Soir' : 'Nuit';
  const txt = `Jour ${G.day} · ${lbl} · ${String(hh).padStart(2, '0')}h${String(mm).padStart(2, '0')}`;
  ctx.font = '700 13px Nunito, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const tw = ctx.measureText(txt).width + 20;
  ctx.fillStyle = 'rgba(25,18,28,.72)'; ctx.beginPath(); ctx.roundRect(12, 12, tw, 26, 13); ctx.fill();
  ctx.fillStyle = '#f3e9dc'; ctx.fillText(txt, 22, 25.5);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
}

function drawFight(f){
  const s = scaleAt(f.y), t = now();
  if (f.phase === 'brawl'){
    ctx.save(); ctx.translate(f.x, f.y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0, 0, 50, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineCap = 'round';
    const cols = [f.a.coat.base, f.b.coat.base];
    for (let i = 0; i < 6; i++){
      const a = t * 3 + i * 1.05;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 18, -30 + Math.sin(a) * 12); ctx.lineTo(Math.cos(a) * 40, -30 + Math.sin(a) * 28);
      ctx.strokeStyle = OUT; ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = cols[i % 2]; ctx.lineWidth = 6; ctx.stroke();
    }
    for (let i = 0; i < 9; i++){
      const a = i / 9 * Math.PI * 2 + Math.sin(t * 5 + i) * .3, rr = 24 + Math.sin(t * 9 + i * 2) * 4;
      ctx.fillStyle = i % 2 ? '#d8d0c2' : '#c4bbab';
      ctx.beginPath(); ctx.arc(Math.cos(a) * rr * 1.2, -30 + Math.sin(a) * rr * .8, 17 + Math.sin(t * 7 + i) * 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#e4ddd0'; ctx.beginPath(); ctx.arc(0, -30, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a4a3a'; ctx.font = '800 16px "Baloo 2", system-ui'; ctx.textAlign = 'center';
    ctx.fillText(['#@!', '%&!', '!!?'][Math.floor(t * 3) % 3], Math.sin(t * 4) * 6, -25);
    ctx.restore();
  }
  if (f.phase !== 'stare'){
    const pr = (t * 1.2) % 1;
    ctx.strokeStyle = f.phase === 'brawl' ? `rgba(255,90,90,${1 - pr})` : `rgba(255,180,80,${(1 - pr) * .8})`;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(f.x, f.y - 30 * s, (50 + pr * 25) * s, (40 + pr * 20) * s, 0, 0, Math.PI * 2); ctx.stroke();
  }
}

/* ================= APERÇUS (boutique, aménagement, création de chat) ================= */
function previewInst(type){
  const d = ITEMS[type];
  return {type, food: d.cap ? d.cap * .8 : 0, foodType:'croq', dirt:0, clumps:[], face:1, rot:.4};
}
function renderItemPreview(cv, type){
  const d = ITEMS[type], w = cv.width, h = cv.height, c2 = cv.getContext('2d');
  c2.clearRect(0, 0, w, h);
  const s = Math.min((w * .82) / (d.hit[0] * 2 + 8), (h * .8) / (d.hit[1] + 14), 1.6);
  withCtx(c2, () => drawItemAt(previewInst(type), w / 2, h - (d.kind === 'rug' ? h / 2 : 8), s, false));
}
function renderCatPreview(cv, coat, t){
  const w = cv.width, h = cv.height, c2 = cv.getContext('2d');
  c2.clearRect(0, 0, w, h);
  const fake = {coat, dir: 1, state: 'idle', tailT: t, happy: 50, phase: 0, blinkT: (t % 4) < .15 ? 1 : 0};
  const s = Math.min(w / 70, h / 80) * (coat.pat === 'fluffy' ? 1.08 : 1);
  withCtx(c2, () => {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(w / 2, h - 8, 26 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(w / 2 + 2 * s, h - 8); ctx.scale(s, s); drawCatBody(fake, 'sit'); ctx.restore();
  });
}
