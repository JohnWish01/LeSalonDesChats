/* Le Salon des Chats : dessin des chats (poses, expressions, démarche, accessoires, chatons). */

function isAsleep(c){ return c.state === 'sleep' || c.state === 'bed' || (c.state === 'perch' && c.perchSleep); }
function catSize(c){ return (c.kitten ? .62 + .38 * (c.grow || 0) : 1) * (c.coat.pat === 'fluffy' ? 1.12 : 1); }

/* L'expression du visage selon ce que vit le chat. */
function expr(c){
  if (isAsleep(c)) return {eyes: 'closed'};
  const a = c.anim && c.anim.type;
  if (a === 'yawn' || c.state === 'cough') return {eyes: 'closed', mouth: 'yawn', ears: c.state === 'cough' ? 'flat' : undefined};
  if (a === 'groom' || (c.state === 'groomFriend' && !c.moving)) return {eyes: 'happy', mouth: 'tongue'};
  if (c.state === 'fight' || c.state === 'flee' || (c.sulkT || 0) > 0) return {eyes: 'angry', ears: 'flat'};
  if (c.sick) return {eyes: 'sad', ears: 'droop'};
  if (c.state === 'chase' || c.state === 'toy' || c.state === 'crazy') return {eyes: 'wide', ears: 'perk'};
  if ((c.purrT || 0) > 0 || c.state === 'rub') return {eyes: 'happy'};
  if (c.state === 'trick') return {eyes: 'open', ears: 'perk'};
  if ((c.blinkT || 0) > 0) return {eyes: 'closed'};
  if (c.happy > 85) return {eyes: 'open', ears: 'perk'};
  if (c.happy < 30) return {eyes: 'half', ears: 'droop'};
  return {eyes: 'open'};
}

/* ---------- accessoires ---------- */
function drawNeckAcc(id, hx, hy, r){
  const a = ACC[id]; if (!a) return;
  if (id === 'bow'){
    ctx.save(); ctx.translate(hx + r * .15, hy + r * .9);
    blob(a.color, () => { ctx.moveTo(0, 0); ctx.lineTo(-r * .45, -r * .25); ctx.lineTo(-r * .45, r * .25); ctx.closePath(); });
    blob(a.color, () => { ctx.moveTo(0, 0); ctx.lineTo(r * .45, -r * .25); ctx.lineTo(r * .45, r * .25); ctx.closePath(); });
    blob(mix(a.color, '#000000', .2), ell(0, 0, r * .12, r * .12));
    ctx.restore(); return;
  }
  if (id === 'bandana'){
    blob(a.color, () => { ctx.moveTo(hx - r * .6, hy + r * .55); ctx.lineTo(hx + r * .5, hy + r * .62); ctx.lineTo(hx - r * .1, hy + r * 1.25); ctx.closePath(); });
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    for (const [u, v] of [[-.3, .7], [.1, .75], [-.12, .95]]){ ctx.beginPath(); ctx.arc(hx + u * r, hy + v * r, r * .05, 0, Math.PI * 2); ctx.fill(); }
    return;
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUT; ctx.lineWidth = r * .3;
  ctx.beginPath(); ctx.ellipse(hx - r * .05, hy + r * .58, r * .6, r * .3, 0, .25, Math.PI - .25); ctx.stroke();
  ctx.strokeStyle = a.color; ctx.lineWidth = r * .22; ctx.stroke();
  if (a.bell){ blob('#f2c24a', ell(hx + r * .05, hy + r * .98, r * .16, r * .16)); ctx.fillStyle = '#8a5a10'; ctx.fillRect(hx + r * .02, hy + r * 1.02, r * .06, r * .08); }
  else { blob('#e8e2d2', ell(hx + r * .05, hy + r * .95, r * .1, r * .12)); }
}
function drawHeadAcc(id, hx, hy, r){
  const a = ACC[id]; if (!a) return;
  if (id === 'hat'){
    blob(a.color, () => { ctx.ellipse(hx - r * .05, hy - r * .55, r * .5, r * .55, 0, Math.PI, 0); ctx.closePath(); });
    ctx.fillStyle = '#c23a4e'; ctx.fillRect(hx - r * .55, hy - r * .68, r, r * .13);
    blob(a.color, ell(hx - r * .05, hy - r * .55, r * .78, r * .12));
  } else if (id === 'beret'){
    ctx.save(); ctx.translate(hx - r * .15, hy - r * .78); ctx.rotate(-.25);
    blob(a.color, ell(0, 0, r * .7, r * .26)); ctx.fillStyle = a.color; ctx.fillRect(-r * .03, -r * .42, r * .08, r * .2);
    ctx.restore();
  } else if (id === 'flower'){
    const fx0 = hx + r * .3, fy0 = hy - r * .95;
    for (let i = 0; i < 5; i++){ const ang = i / 5 * Math.PI * 2; blob(a.color, ell(fx0 + Math.cos(ang) * r * .17, fy0 + Math.sin(ang) * r * .17, r * .13, r * .13)); }
    blob('#ffd75a', ell(fx0, fy0, r * .1, r * .1));
  } else if (id === 'crown'){
    blob(a.color, () => {
      const y0 = hy - r * .78, w = r * .5;
      ctx.moveTo(hx - w, y0); ctx.lineTo(hx - w, y0 - r * .45); ctx.lineTo(hx - w * .5, y0 - r * .2); ctx.lineTo(hx, y0 - r * .55);
      ctx.lineTo(hx + w * .5, y0 - r * .2); ctx.lineTo(hx + w, y0 - r * .45); ctx.lineTo(hx + w, y0); ctx.closePath();
    });
    ctx.fillStyle = '#e05a7a'; ctx.beginPath(); ctx.arc(hx, hy - r * .9, r * .07, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5ac8e8'; ctx.beginPath(); ctx.arc(hx - r * .3, hy - r * .88, r * .05, 0, Math.PI * 2); ctx.arc(hx + r * .3, hy - r * .88, r * .05, 0, Math.PI * 2); ctx.fill();
  }
}

/* ---------- la tête ---------- */
function head(co, hx, hy, r, closed, x = {}){
  const eyes = x.eyes || (closed ? 'closed' : 'open'), ears = x.ears || 'up';
  if (x.kitten) r *= 1.12;
  ctx.save();
  if (x.tilt){ ctx.translate(hx, hy); ctx.rotate(x.tilt); ctx.translate(-hx, -hy); }
  if (x.acc && x.acc.neck) drawNeckAcc(x.acc.neck, hx, hy, r);
  const big = co.pat === 'sphynx' ? 1.3 : 1;
  const e1 = [[hx - r * .75, hy - r * .45], [hx - r * .45 * big, hy - r * 1.5 * big], [hx + r * .05, hy - r * .85]];
  const e2 = [[hx, hy - r * .92], [hx + r * .55 * big, hy - r * 1.45 * big], [hx + r * .85, hy - r * .4]];
  if (ears === 'flat'){ e1[1] = [hx - r * 1.3, hy - r * .9]; e2[1] = [hx - r * .2, hy - r * 1.2]; }
  if (ears === 'droop'){ e1[1] = [hx - r * .9, hy - r * 1.2]; e2[1] = [hx + r * .25, hy - r * 1.3]; }
  if (ears === 'perk'){ e1[1][1] -= r * .14; e2[1][1] -= r * .14; }
  if (x.twitch) e2[1] = [e2[1][0] + r * .2, e2[1][1] + r * .12];
  const earC = co.pat === 'points' ? co.dark : co.pat === 'calico' ? '#e08a3c' : co.base;
  for (const e of [e1, e2]) blob(earC, () => { ctx.moveTo(...e[0]); ctx.lineTo(...e[1]); ctx.lineTo(...e[2]); ctx.closePath(); });
  const cx2 = (e2[0][0] + e2[1][0] + e2[2][0]) / 3, cy2 = (e2[0][1] + e2[1][1] + e2[2][1]) / 3;
  ctx.fillStyle = 'rgba(255,150,170,.55)'; ctx.beginPath();
  e2.forEach(([px, py], i) => { const qx = px + (cx2 - px) * .4, qy = py + (cy2 - py) * .4; i ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy); });
  ctx.fill();
  if (co.pat === 'fluffy'){
    ctx.strokeStyle = co.dark; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    for (const e of [e1, e2]){ ctx.beginPath(); ctx.moveTo(e[1][0], e[1][1]); ctx.lineTo(e[1][0], e[1][1] - r * .35); ctx.stroke(); }
  }
  blob(co.base, ell(hx, hy, r, r * .92));
  ctx.save(); ctx.beginPath(); ctx.ellipse(hx, hy, r, r * .92, 0, 0, Math.PI * 2); ctx.clip();
  if (co.pat === 'points'){ ctx.fillStyle = co.dark; ctx.beginPath(); ctx.ellipse(hx + r * .6, hy + r * .25, r * .6, r * .5, 0, 0, Math.PI * 2); ctx.fill(); }
  if (co.pat === 'tux'){ ctx.fillStyle = '#f4efe7'; ctx.beginPath(); ctx.ellipse(hx + r * .7, hy + r * .5, r * .55, r * .45, 0, 0, Math.PI * 2); ctx.fill(); }
  if (co.pat === 'calico'){ ctx.fillStyle = '#2a2527'; ctx.beginPath(); ctx.ellipse(hx - r * .5, hy - r * .5, r * .6, r * .5, 0, 0, Math.PI * 2); ctx.fill(); }
  if (co.pat === 'fluffy'){ ctx.fillStyle = '#e8d6c0'; ctx.beginPath(); ctx.ellipse(hx + r * .7, hy + r * .55, r * .5, r * .4, 0, 0, Math.PI * 2); ctx.fill(); }
  if (striped(co)){ ctx.strokeStyle = co.stripeColor || co.dark; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; for (let i = 0; i < 3; i++){ ctx.beginPath(); ctx.moveTo(hx - r * .2 + i * r * .25, hy - r * .9); ctx.lineTo(hx - r * .1 + i * r * .25, hy - r * .55); ctx.stroke(); } }
  if (co.pat === 'spots'){ ctx.fillStyle = co.dark; for (const [u, v] of [[-.3, -.55], [0, -.7], [.25, -.5], [-.55, -.1]]){ ctx.beginPath(); ctx.arc(hx + u * r, hy + v * r, r * .1, 0, Math.PI * 2); ctx.fill(); } }
  if (co.pat === 'sphynx'){ ctx.strokeStyle = 'rgba(150,90,80,.5)'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++){ ctx.beginPath(); ctx.arc(hx, hy - r * .1 - i * r * .14, r * .45, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); } }
  if (co.pat === 'galaxy'){ ctx.fillStyle = '#fff6c8'; for (const [u, v] of [[-.4, -.5], [.1, -.65], [-.6, .1]]){ ctx.beginPath(); ctx.arc(hx + u * r, hy + v * r, 1.1, 0, Math.PI * 2); ctx.fill(); } }
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(hx, hy, r, r * .92, 0, 0, Math.PI * 2); ctx.lineWidth = 1.6; ctx.strokeStyle = OUT; ctx.stroke();

  // les yeux
  const ex = hx + r * .38, ey = hy - r * .12, lid = co.pat === 'points' ? co.base : co.base;
  ctx.lineCap = 'round';
  if (eyes === 'closed'){ ctx.strokeStyle = '#1a1214'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(ex, ey - 1, r * .2, .2, Math.PI - .2); ctx.stroke(); }
  else if (eyes === 'happy'){ ctx.strokeStyle = '#1a1214'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(ex, ey + r * .1, r * .18, Math.PI + .35, -.35); ctx.stroke(); }
  else {
    const wide = eyes === 'wide';
    ctx.fillStyle = co.eye; ctx.beginPath(); ctx.ellipse(ex, ey, r * (wide ? .23 : .2), r * (wide ? .26 : .24), 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#120c0e'; ctx.beginPath();
    if (wide) ctx.arc(ex + r * .04, ey, r * .15, 0, Math.PI * 2); else ctx.ellipse(ex + r * .05, ey, r * .07, r * .19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(ex - r * .02, ey - r * .1, r * (wide ? .07 : .05), 0, Math.PI * 2); ctx.fill();
    if (eyes === 'half' || eyes === 'sad' || eyes === 'angry'){
      ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, r * .22, r * .26, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = lid; ctx.beginPath();
      if (eyes === 'half'){ ctx.rect(ex - r * .3, ey - r * .3, r * .6, r * .3); }
      else if (eyes === 'sad'){ ctx.moveTo(ex - r * .3, ey - r * .02); ctx.lineTo(ex + r * .3, ey - r * .2); ctx.lineTo(ex + r * .3, ey - r * .4); ctx.lineTo(ex - r * .3, ey - r * .4); }
      else { ctx.moveTo(ex - r * .3, ey - r * .26); ctx.lineTo(ex + r * .3, ey - r * .02); ctx.lineTo(ex + r * .3, ey - r * .4); ctx.lineTo(ex - r * .3, ey - r * .4); }
      ctx.fill(); ctx.restore();
      ctx.strokeStyle = '#1a1214'; ctx.lineWidth = 1.4; ctx.beginPath();
      if (eyes === 'sad'){ ctx.moveTo(ex - r * .26, ey - r * .3); ctx.lineTo(ex + r * .22, ey - r * .44); }
      if (eyes === 'angry'){ ctx.moveTo(ex - r * .26, ey - r * .46); ctx.lineTo(ex + r * .24, ey - r * .26); }
      ctx.stroke();
    }
  }
  if (x.acc && x.acc.face === 'glasses'){
    ctx.strokeStyle = '#2a2228'; ctx.lineWidth = r * .08;
    ctx.fillStyle = 'rgba(200,230,255,.22)'; ctx.beginPath(); ctx.arc(ex, ey, r * .3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex - r * .3, ey - r * .02); ctx.lineTo(hx - r * .55, hy - r * .25); ctx.stroke();
  }
  // museau, bouche
  ctx.fillStyle = '#e8869a'; ctx.beginPath(); ctx.moveTo(hx + r * .92, hy + r * .12); ctx.lineTo(hx + r * .78, hy + r * .02); ctx.lineTo(hx + r * .8, hy + r * .25); ctx.fill();
  if (x.mouth === 'yawn'){ blob('#7a2a3a', ell(hx + r * .7, hy + r * .45, r * .2, r * .26)); ctx.fillStyle = '#ff9ab0'; ctx.beginPath(); ctx.ellipse(hx + r * .7, hy + r * .58, r * .12, r * .08, 0, 0, Math.PI * 2); ctx.fill(); }
  if (x.mouth === 'tongue'){ ctx.fillStyle = '#ff8aa4'; ctx.beginPath(); ctx.ellipse(hx + r * .98, hy + r * .34, r * .13, r * .07, .3, 0, Math.PI * 2); ctx.fill(); }
  if (co.pat !== 'sphynx'){
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = .9;
    for (let i = -1; i <= 1; i++){ ctx.beginPath(); ctx.moveTo(hx + r * .75, hy + r * .3); ctx.lineTo(hx + r * 1.55, hy + r * .3 + i * r * .22); ctx.stroke(); }
  }
  if (x.acc && x.acc.head) drawHeadAcc(x.acc.head, hx, hy, r);
  ctx.restore();
}
function leg(co, x, y, h, paw){
  blob(co.base, () => ctx.roundRect(x - 3.5, y, 7, h, 3.5));
  if (paw){ ctx.fillStyle = paw; ctx.beginPath(); ctx.roundRect(x - 3.5, y + h - 4, 7, 4, 2); ctx.fill(); }
}

/* ---------- les poses ---------- */
function catPose(c){
  if (isAsleep(c)) return c.sleepPose === 'belly' && c.state === 'sleep' ? 'belly' : 'sleep';
  if (c.state === 'trick') return 'trick';
  if (c.anim && c.state === 'idle' && !c.moving) return c.anim.type === 'yawn' ? 'sit' : c.anim.type;
  if (c.state === 'groomFriend' && !c.moving) return 'groom';
  if (c.moving || c.state === 'chase' || c.state === 'drink' || c.state === 'fight' || c.state === 'scratch' || c.state === 'rub' || (c.state === 'eat' && c.target)) return 'walk';
  return 'sit';
}

function drawCatBody(c, pose){
  const co = c.coat, T = now();
  const x = Object.assign(expr(c), {acc: c.acc, twitch: (c.earT || 0) > 0, kitten: c.kitten, tilt: (c.look || 0) * .3});
  const paw = co.pat === 'tux' || co.pat === 'fluffy' ? '#f4efe7' : co.pat === 'points' ? co.dark : null;
  const tailC = co.pat === 'points' || co.pat === 'calico' ? co.dark : co.base;
  const tw = co.pat === 'fluffy' ? 10 : co.pat === 'sphynx' ? 4 : 6;
  const fast = c.state === 'chase' || c.state === 'crazy' || c.twitch > 0 || c.state === 'fight';
  const sway = Math.sin((c.tailT || 0) * (fast ? 9 : 2.2)) * 7;
  const happyTail = c.happy > 75 && !c.sick && !fast;
  const tail = path => { ctx.lineCap = 'round'; ctx.beginPath(); path(); ctx.strokeStyle = OUT; ctx.lineWidth = tw + 2.5; ctx.stroke(); ctx.strokeStyle = tailC; ctx.lineWidth = tw; ctx.stroke(); };
  const sitBody = () => { blob(co.base, ell(-2, -22, 18, 21)); bodyPattern(co, -2, -22, 18, 21); };
  const sitTail = () => tail(() => { ctx.moveTo(-12, -5); ctx.quadraticCurveTo(-34, 0, -28 + sway * .4, -16); });

  switch (pose){
    case 'sleep': {
      tail(() => { ctx.moveTo(-22, -8); ctx.quadraticCurveTo(-10, 6, 20, -1); });
      const br = 1 + Math.sin((c.tailT || 0) * 2) * .03;
      blob(co.base, ell(0, -13, 27, 14 * br)); bodyPattern(co, 0, -13, 27, 14 * br);
      head(co, 19, -14, 11.5, true, x);
      break;
    }
    case 'belly': {
      tail(() => { ctx.moveTo(-24, -8); ctx.quadraticCurveTo(-40, -4, -48, -10 + sway * .2); });
      const kick = Math.sin(T * 1.3) * 2;
      [-15, -6, 6, 14].forEach((lx, i) => { blob(co.base, () => ctx.roundRect(lx - 3.5, -38 + (i % 2) * 3 + (i > 1 ? kick : 0), 7, 18, 3.5)); ctx.fillStyle = '#f2a8b8'; ctx.beginPath(); ctx.arc(lx, -36 + (i % 2) * 3 + (i > 1 ? kick : 0), 2.2, 0, Math.PI * 2); ctx.fill(); });
      blob(co.base, ell(0, -13, 26, 12)); bodyPattern(co, 0, -13, 26, 12);
      ctx.fillStyle = mix(co.base, '#ffffff', .45); ctx.beginPath(); ctx.ellipse(2, -21, 15, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(25, -13); ctx.rotate(Math.PI * .92); head(co, 0, 0, 11.5, true, x); ctx.restore();
      break;
    }
    case 'loaf': {
      tail(() => { ctx.moveTo(-18, -4); ctx.quadraticCurveTo(-2, 6, 18, 0); });
      blob(co.base, ell(-2, -14, 22, 14)); bodyPattern(co, -2, -14, 22, 14);
      head(co, 15, -30, 13.5, false, x);
      break;
    }
    case 'groom': {
      sitTail(); sitBody();
      leg(co, 7, -18, 18, paw);
      const lick = Math.sin(T * 9);
      ctx.save(); ctx.translate(14, -30); ctx.rotate(-1.15 + lick * .12); leg(co, 0, 0, 15, paw); ctx.restore();
      ctx.save(); ctx.translate(9, -47 + lick * 1.2); ctx.rotate(.38); head(co, 0, 0, 14, false, x); ctx.restore();
      break;
    }
    case 'stretch': {
      tail(() => { ctx.moveTo(-24, -32); ctx.quadraticCurveTo(-36, -54, -28 + sway * .3, -66); });
      leg(co, -20, -20, 20, paw); leg(co, -12, -20, 20, paw);
      ctx.save(); ctx.translate(0, -24); ctx.rotate(.3); blob(co.base, ell(0, 0, 28, 12)); bodyPattern(co, 0, 0, 28, 12); ctx.restore();
      blob(co.base, () => ctx.roundRect(12, -7, 24, 6, 3)); blob(co.base, () => ctx.roundRect(16, -4, 24, 6, 3));
      head(co, 30, -17, 13, false, Object.assign({}, x, {eyes: 'closed', mouth: 'yawn'}));
      break;
    }
    case 'trick': {
      const k = c.trick || 'sit';
      if (k === 'high5'){
        tail(() => { ctx.moveTo(-8, -6); ctx.quadraticCurveTo(-30, -4, -32 + sway * .4, -20); });
        leg(co, -6, -16, 16, paw); leg(co, 3, -16, 16, paw);
        blob(co.base, ell(0, -36, 14, 23)); bodyPattern(co, 0, -36, 14, 23);
        const wave = Math.sin(T * 10) * .15;
        head(co, 2, -64, 14, false, x);
        ctx.save(); ctx.translate(10, -48); ctx.rotate(Math.PI + 1.05 + wave); leg(co, 0, 0, 22, paw); ctx.restore();
        ctx.save(); ctx.translate(6, -46); ctx.rotate(Math.PI + .75 - wave); leg(co, 0, 0, 20, paw); ctx.restore();
      } else {
        sitTail(); sitBody();
        leg(co, 7, -18, 18, paw);
        if (k === 'paw'){ ctx.save(); ctx.translate(15, -27); ctx.rotate(-1.5 + Math.sin(T * 6) * .1); leg(co, 0, 0, 16, paw); ctx.restore(); }
        else leg(co, 13, -17, 17, paw);
        head(co, 8, k === 'sit' ? -55 : -51, 14, false, x);
      }
      break;
    }
    case 'walk': {
      const sw = c.moving ? 4.5 : 0;
      const lowHead = c.state === 'chase' || c.state === 'drink' || c.state === 'rub' || (c.state === 'eat' && !c.moving);
      const up = c.state === 'scratch';
      if (happyTail && !up) tail(() => { ctx.moveTo(-26, -26); ctx.bezierCurveTo(-36, -48, -38, -66, -27, -73); ctx.quadraticCurveTo(-18, -76, -20 + sway * .15, -67); });
      else tail(() => { ctx.moveTo(-26, -26); ctx.quadraticCurveTo(-46, -30 + sway, -44 + sway * .5, -54); });
      [[-19, 0], [-10, Math.PI], [13, Math.PI], [21, 0]].forEach(([lx, ph], i) => {
        if (up && i >= 2) return;
        leg(co, lx + Math.sin((c.phase || 0) + ph) * sw, -15, 15, paw);
      });
      if (up){
        ctx.save(); ctx.translate(8, -22); ctx.rotate(-.55);
        blob(co.base, ell(0, 0, 27, 13)); bodyPattern(co, 0, 0, 27, 13);
        const scr = Math.sin(T * 18) * 3;
        leg(co, 22, -6 + scr, 14, paw); leg(co, 16, -8 - scr, 14, paw);
        head(co, 24, -12, 13, false, x);
        ctx.restore();
      } else {
        const bob = c.moving ? Math.sin((c.phase || 0) * 2) * 1.6 : 0;
        const rubTilt = c.state === 'rub' ? Math.sin(T * 4) * .15 : 0;
        blob(co.base, ell(0, -25 + bob * .3, 29, 14)); bodyPattern(co, 0, -25 + bob * .3, 29, 14);
        head(co, lowHead ? 30 : 27, (lowHead ? -26 : -38) + bob, 13, false, Object.assign({}, x, {tilt: x.tilt + rubTilt}));
      }
      break;
    }
    default: {
      if (happyTail) tail(() => { ctx.moveTo(-14, -10); ctx.bezierCurveTo(-30, -24, -30, -50, -20, -56); ctx.quadraticCurveTo(-12, -58, -14 + sway * .12, -50); });
      else sitTail();
      sitBody();
      leg(co, 7, -18, 18, paw); leg(co, 13, -17, 17, paw);
      head(co, 7, -50, 14, false, x);
    }
  }
}

function drawCat(c){
  const s = catScale(c) * catSize(c);
  ctx.save(); ctx.translate(c.x, c.y - (c.hop || 0));
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(0, c.hop || 0, 30 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.scale(c.dir * s, s);
  drawCatBody(c, catPose(c));
  ctx.restore();
  drawLabels(c);
}

function drawLabels(c){
  const s0 = catScale(c), s = s0 * catSize(c);
  ctx.font = `700 ${Math.max(10, 12 * s0)}px Nunito, system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = c.sick ? 'rgba(255,190,170,.95)' : 'rgba(255,244,230,.82)';
  ctx.fillText(c.sick ? `${c.name} (malade)` : c.kitten ? `${c.name} (chaton)` : c.name, c.x, c.y + 15 * s0 + 4);
  if (c.sick && !isAsleep(c)){
    const k = (now() * .8) % 1;
    ctx.fillStyle = `rgba(140,200,255,${1 - k})`;
    ctx.beginPath(); ctx.ellipse(c.x + c.dir * 22 * s, c.y - (58 - k * 10) * s, 2.5 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (isAsleep(c)){
    const t = c.tailT || 0;
    ctx.fillStyle = 'rgba(200,210,255,.9)';
    for (let i = 0; i < 3; i++){ const k = ((t * .5 + i / 3) % 1); ctx.globalAlpha = 1 - k; ctx.font = `800 ${(10 + i * 3) * s0}px "Baloo 2", system-ui`; ctx.fillText('z', c.x + c.dir * (20 + k * 18) * s, c.y - (30 + k * 34) * s); }
    ctx.globalAlpha = 1;
  }
  if (c.bubble){
    const by = c.y - (isAsleep(c) ? 50 : c.state === 'trick' && c.trick === 'high5' ? 98 : 82) * s;
    ctx.font = `800 ${Math.max(12, 14 * s0)}px "Baloo 2", system-ui`;
    const tw = ctx.measureText(c.bubble).width + 16, th = Math.max(22, 24 * s0);
    const bx = clamp(c.x, tw / 2 + 4, W - tw / 2 - 4);
    ctx.globalAlpha = Math.min(1, c.bubbleT * 3);
    ctx.fillStyle = '#fff6ea'; ctx.beginPath(); ctx.roundRect(bx - tw / 2, by - th, tw, th, 10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(c.x - 5, by - 1); ctx.lineTo(c.x + 5, by - 1); ctx.lineTo(c.x, by + 6); ctx.fill();
    ctx.fillStyle = c.bubble.startsWith('Pfff') || c.bubble.startsWith('Beurk') ? '#c0392b' : '#3a2530';
    ctx.textBaseline = 'middle'; ctx.fillText(c.bubble, bx, by - th / 2 + 1); ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = 1;
  }
}

/* Aperçu animé d'un vrai chat (fiche du chat). */
function renderCatPortrait(cv, c, t){
  const w = cv.width, h = cv.height, c2 = cv.getContext('2d');
  c2.clearRect(0, 0, w, h);
  const fake = Object.assign({}, c, {dir: 1, state: 'idle', tailT: t, moving: false, hop: 0, look: 0, bubble: null,
    anim: null, blinkT: (t % 4) < .15 ? 1 : 0, purrT: 0, sulkT: 0, sick: c.sick});
  const s = Math.min(w / 70, h / 84) * (c.kitten ? .62 + .38 * (c.grow || 0) : 1) * (c.coat.pat === 'fluffy' ? 1.08 : 1);
  withCtx(c2, () => {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(w / 2, h - 8, 26 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(w / 2 + 2 * s, h - 8); ctx.scale(s, s); drawCatBody(fake, 'sit'); ctx.restore();
  });
}
/* Petit portrait pour la boutique d'accessoires. */
function renderAccPreview(cv, id){
  const w = cv.width, h = cv.height, c2 = cv.getContext('2d');
  c2.clearRect(0, 0, w, h);
  const acc = {[ACC[id].slot]: id};
  withCtx(c2, () => { ctx.save(); ctx.translate(w / 2 - 6, h / 2 + 8); const k = Math.min(w, h) / 50; ctx.scale(k, k); head(coatById('roux'), 0, 0, 14, false, {acc}); ctx.restore(); });
}
