/* Le Salon des Chats : interface (écran titre, outils, aménagement, boutique, création de chat, succès, pièces). */

const $ = id => document.getElementById(id);
const COIN_SVG = '<svg class="coin" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 7 L5 1.5 L8.5 4.5 Z M16 7 L15 1.5 L11.5 4.5 Z" fill="#e0a92a"/><circle cx="10" cy="11" r="8" fill="#f2c24a" stroke="#c98a1a" stroke-width="1.5"/><path d="M7 10.5 q1 -1.6 2 0 M11 10.5 q1 -1.6 2 0" stroke="#8a5a10" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M9.2 13 h1.6 l-.8 .9 z" fill="#8a5a10"/></svg>';
const esc = s => String(s).replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));

/* ---------- messages ---------- */
let hintTimer = 0;
function showHint(text, ms = 4500){
  const el = $('hint'); el.textContent = text; el.classList.remove('gone');
  clearTimeout(hintTimer); hintTimer = setTimeout(() => el.classList.add('gone'), ms);
}
function toast(title, text, gold){
  const el = document.createElement('div');
  el.className = 'toast' + (gold ? ' gold' : '');
  el.innerHTML = `<b>${esc(title)}</b><span>${esc(text)}</span>`;
  $('toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 4200);
  setTimeout(() => el.remove(), 4800);
}

/* ---------- en-tête et outils ---------- */
function updateHUD(){
  if (!G) return;
  $('coinCount').textContent = G.coins;
  $('roomName').textContent = roomById(G.room).name;
  $('achCount').textContent = `${Object.keys(G.ach).length}/${ACH.length}`;
  const shopCoins = $('shopCoins'); if (shopCoins) shopCoins.textContent = G.coins;
}
function updateToolbar(){
  if (!G) return;
  const fs = $('foodSel'), fv = fs.value || 'croq';
  fs.innerHTML = FOODS.map(f => `<option value="${f.id}">${esc(f.name)} (${G.food[f.id] || 0})</option>`).join('');
  fs.value = fv;
  const cs = $('careSel'), cvv = cs.value || 'vitamins';
  cs.innerHTML = CARES.filter(c => !c.once && c.id !== 'treat').map(c => `<option value="${c.id}">${esc(c.name)} (${G.care[c.id] || 0})</option>`).join('');
  cs.value = cvv;
  $('treatCount').textContent = G.care.treat || 0;
  $('t-brush').classList.toggle('locked', !G.brush);
  $('btnSound').querySelector('span').textContent = soundOn ? 'Son activé' : 'Son coupé';
}
const HINTS = {
  pet: 'Clique sur un chat pour le caresser (pas trop !), sur un jouet pour le lancer, ou sur deux chats qui se chamaillent pour les séparer.',
  laser: 'Promène le pointeur laser dans la pièce.',
  food: 'Choisis la nourriture, puis clique sur une gamelle pour la remplir.',
  treat: 'Clique sur un chat pour lui donner une friandise.',
  brush: 'Clique sur un chat pour le brosser.',
  care: 'Choisis un soin, puis clique sur un chat.',
  scoop: 'Clique sur une litière sale (ou une flaque) pour la nettoyer.'
};
function setTool(t){
  tool = t; laser.on = false;
  document.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tool === t));
  cv.classList.toggle('laser', t === 'laser');
  showHint(HINTS[t]);
}

/* ---------- liste des chats ---------- */
function mood(c){
  if (c.sick) return ['Malade', 'bad'];
  if (c.state === 'bed') return ['Dort dans son panier', 'zzz'];
  if (c.state === 'perch' && c.target === sill) return c.perchSleep ? [daylight > .5 ? 'Bain de soleil' : 'Dort à la fenêtre', 'zzz'] : ['Regarde dehors', 'good'];
  if (c.state === 'perch') return c.perchSleep ? ['Dort en hauteur', 'zzz'] : ['Sur l’arbre à chat', 'good'];
  if (c.state === 'sleep') return ['Fait la sieste', 'zzz'];
  if (c.state === 'fight') return c.fight && c.fight.phase === 'brawl' ? ['Se bagarre !', 'bad'] : c.fight && c.fight.phase === 'scuffle' ? ['Se chamaille', 'bad'] : ['Se toise', 'bad'];
  if (c.state === 'flee') return ['Vexé', 'bad'];
  if (c.state === 'chase') return ['Chasse !', 'good'];
  if (c.state === 'crazy') return ['Fou de joie !', 'good'];
  if (c.state === 'toy') return ['Joue', 'good'];
  if (c.state === 'scratch' || c.state === 'toscratch') return ['Fait ses griffes', 'good'];
  if (c.state === 'box' || c.state === 'tobox') return ['Dans le carton', ''];
  if (c.state === 'tolitter' || c.state === 'litter') return ['Au petit coin', ''];
  if (c.state === 'eat') return [c.moving ? 'Va manger' : 'Mange', 'good'];
  if (c.state === 'drink') return ['Boit', 'good'];
  if (c.state === 'todrink') return ['Va boire', ''];
  if (c.state === 'totree' || c.state === 'jump') return ['Grimpe', ''];
  if (c.bladder > 80) return ['Cherche une litière', 'bad'];
  if (c.thirst > 80) return ['A soif', 'bad'];
  if (c.hunger > 70) return ['A faim', 'bad'];
  if (c.happy > 75) return ['Aux anges', 'good'];
  if (c.happy > 45) return ['Content', ''];
  return ["S'ennuie", 'bad'];
}
function renderRoster(){
  if (!G) return;
  const room = roomById(G.room);
  $('rosterTitle').textContent = `Tes chats (${G.cats.length}/${room.maxCats})`;
  $('roster').innerHTML = G.cats.length ? G.cats.map((c, i) => {
    const [m, k] = mood(c);
    return `<li><span class="sw" style="background:${c.coat.base}"></span><div class="who"><b>${esc(c.name)}</b><small>${esc(c.coat.label)} · ${esc(traitById(c.traitId).label)} · voix ${esc(voiceDef(c.voice).label.toLowerCase())}</small></div><span class="mood ${k}">${m}</span><button class="listen" data-cat="${i}" aria-label="Écouter ${esc(c.name)}" title="Écouter ${esc(c.name)}">♪</button>
      <div class="bars"><label>Bonheur<span class="bar"><i style="width:${Math.round(c.happy)}%"></i></span></label><label>Santé<span class="bar health"><i style="width:${Math.round(c.health)}%"></i></span></label></div></li>`;
  }).join('') : '<li class="empty">Pas encore de chat. Clique sur « Adopter » pour en accueillir un.</li>';
}

/* ---------- aménagement ---------- */
function toggleBuild(on){
  buildMode = on; buildPick = null; selected = null; dragging = null; laser.on = false;
  $('tools').hidden = on; $('buildBar').hidden = !on;
  $('btnBuild').setAttribute('aria-pressed', on);
  cv.classList.toggle('build', on);
  if (on){ renderBuildBar(); showHint('Choisis un objet puis clique dans la pièce pour le poser. Fais glisser un objet pour le déplacer.', 7000); }
  else { saveGame(); showHint(HINTS[tool]); }
}
function renderBuildBar(){
  const types = ITEM_LIST.filter(d => (G.inv[d.id] || 0) > 0);
  $('buildList').innerHTML = types.length
    ? types.map(d => `<button class="inv${buildPick === d.id ? ' on' : ''}" data-pick="${d.id}" title="${esc(d.desc)}"><canvas width="72" height="54"></canvas><span>${esc(d.name)}</span><em>×${G.inv[d.id]}</em></button>`).join('')
    : '<p class="muted">Tout est déjà placé. La boutique a plein d’autres objets !</p>';
  $('buildList').querySelectorAll('[data-pick]').forEach(b => renderItemPreview(b.querySelector('canvas'), b.dataset.pick));
  $('btnStore').disabled = !selected;
  $('selName').textContent = selected ? ITEMS[selected.type].name : 'aucun';
}
function validSpot(x, y){ return x >= 16 && x <= W - 16 && y >= minY() - 8 && y <= H - 6; }
function placeItem(type, x, y){
  const o = makeInst(type, x, clamp(y, minY() - 8, H - 6));
  G.placed.push(o); G.inv[type]--; G.stats.placed++;
  placeSound();
  if (!G.inv[type]) buildPick = null;
  selected = o; renderBuildBar(); saveGame();
}
function storeInst(o){
  const s = scaleAt(o.y);
  for (const c of G.cats){
    if (c.target !== o) continue;
    if (c.onTree){ c.onTree = false; c.y = clamp(o.y + 20 * s, minY(), H - 16); }
    if (c.state === 'box' || c.state === 'bed' || c.state === 'litter') c.y = clamp(o.y + 16 * s, minY(), H - 16);
    setState(c, 'idle', 1);
  }
  G.placed.splice(G.placed.indexOf(o), 1);
  G.inv[o.type] = (G.inv[o.type] || 0) + 1;
  if (selected === o) selected = null;
  renderBuildBar();
}
function hitInst(p){
  const list = [...G.placed].sort((a, b) => b.y - a.y);
  for (const o of list){
    if (kindOf(o) === 'rug') continue;
    const d = ITEMS[o.type], s = scaleAt(o.y);
    if (Math.abs(p.x - o.x) < d.hit[0] * s + 4 && p.y > o.y - d.hit[1] * s - 4 && p.y < o.y + 8 * s) return o;
  }
  for (const o of list){
    if (kindOf(o) !== 'rug') continue;
    const d = ITEMS[o.type], s = scaleAt(o.y);
    if (Math.abs(p.x - o.x) < d.hit[0] * s && Math.abs(p.y - o.y) < d.hit[1] * s) return o;
  }
  return null;
}

/* ---------- clics dans la pièce ---------- */
function pos(e){ const r = cv.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; }
function catAt(p){
  let best = null, bd = Infinity;
  for (const c of G.cats){
    if (hiddenCat(c) || c.state === 'jump') continue;
    const s = catScale(c), d = Math.hypot(p.x - c.x, (p.y - (c.y - 28 * s)) * .9);
    if (d < 42 * s && d < bd){ bd = d; best = c; }
  }
  if (best) return best;
  const o = hitInst(p);
  if (o && (kindOf(o) === 'bed' || kindOf(o) === 'box') && o.occupant && hiddenCat(o.occupant)) return o.occupant;
  return null;
}
function fillBowl(o){
  const fid = $('foodSel').value, fd = foodById(fid), cap = ITEMS[o.type].cap;
  if ((G.food[fid] || 0) <= 0){ errorSound(); showHint(`Plus de ${fd.name.toLowerCase()} : passe à la boutique (onglet Nourriture).`); return; }
  if (o.food >= cap - 1 && o.foodType === fid){ showHint('Cette gamelle est déjà pleine.'); return; }
  G.food[fid]--; o.food = cap; o.foodType = fid; G.stats.fills++; if (fid === 'patee') G.stats.patee++;
  setTimeout(kibbleSound, 30);
  for (const c of G.cats) if (isFree(c.state) && c.hunger > 25 && Math.random() < .8){ setState(c, 'eat'); c.target = o; setTimeout(() => say(c, pick(['Miaou !', 'Miam ?', 'Mrrp !'])), rand(150, 700)); }
  updateToolbar(); saveGame();
}
function scoopAt(p){
  for (const o of ofKind('litter')){
    const d = ITEMS[o.type], s = scaleAt(o.y);
    if (Math.abs(p.x - o.x) < d.hit[0] * s + 4 && p.y > o.y - d.hit[1] * s - 4 && p.y < o.y + 12 * s){
      if (o.dirt > 0){ o.dirt = 0; o.clumps = []; G.stats.cleans++; sparkle(o.x, o.y - 22 * s, s); addCoins(1, o.x, o.y - 50 * s, true); setTimeout(() => cleanSound(false), 30); showHint('Litière propre !'); }
      else showHint('Cette litière est déjà propre.');
      return;
    }
  }
  for (let i = puddles.length - 1; i >= 0; i--){
    const q = puddles[i];
    if (Math.hypot(p.x - q.x, (p.y - q.y) * 2) < q.r * 1.5){ puddles.splice(i, 1); sparkle(q.x, q.y, scaleAt(q.y)); addCoins(1, q.x, q.y - 30, true); setTimeout(() => cleanSound(true), 30); showHint('Tout propre !'); return; }
  }
  showHint(HINTS.scoop);
}
function onDown(e){
  if (!G || screen !== 'game') return;
  audio();
  const p = pos(e);
  if (buildMode){
    if (buildPick){
      if (validSpot(p.x, p.y)) placeItem(buildPick, p.x, p.y);
      else { errorSound(); showHint('Pose les objets sur le sol.'); }
      return;
    }
    const o = hitInst(p);
    selected = o; renderBuildBar();
    if (o){ dragging = o; dragOff = {x: p.x - o.x, y: p.y - o.y}; cv.setPointerCapture(e.pointerId); }
    return;
  }
  if (tool !== 'laser'){
    for (const f of fights){
      const s = scaleAt(f.y);
      if (Math.hypot(p.x - f.x, (p.y - (f.y - 28 * s)) * 1.2) < 62 * s){ endFight(f, 'separated'); return; }
    }
  }
  if (tool === 'laser'){ laser.on = true; laser.x = p.x; laser.y = p.y; cv.setPointerCapture(e.pointerId); return; }
  if (tool === 'food'){ const o = hitInst(p); if (o && kindOf(o) === 'bowl') fillBowl(o); else showHint(ofKind('bowl').length ? 'Clique sur une gamelle pour la remplir.' : 'Place d’abord une gamelle avec Aménager.'); return; }
  if (tool === 'scoop'){ scoopAt(p); return; }
  if (tool === 'pet'){
    const o = hitInst(p);
    if (o && kindOf(o) === 'box' && o.occupant && o.occupant.state === 'box'){
      const oc = o.occupant; oc.y = o.y + 16 * scaleAt(o.y); o.shakeUntil = performance.now() + 450; boxSound(false);
      setState(oc, 'idle', 2.5); say(oc, 'Mrrp !'); oc.happy = Math.min(100, oc.happy + 4); return;
    }
    const c = catAt(p); if (c){ pet(c, p.x); return; }
    if (o && kindOf(o) === 'toy'){ const a = Math.random() * Math.PI * 2, v = rand(150, 260); o.vx = Math.cos(a) * v; o.vy = Math.sin(a) * v * .6; toySound(o.type); }
    return;
  }
  const c = catAt(p);
  if (!c){ showHint(HINTS[tool]); return; }
  if (tool === 'treat') giveTreat(c);
  else if (tool === 'brush') brushCat(c);
  else if (tool === 'care') applyCare(c);
}
function onMove(e){
  if (!G || screen !== 'game') return;
  const p = pos(e);
  if (buildMode){
    ghost.x = p.x; ghost.y = p.y; ghost.on = true;
    if (dragging){
      dragging.x = clamp(p.x - dragOff.x, 16, W - 16); dragging.y = clamp(p.y - dragOff.y, minY() - 8, H - 6);
      if (dragging.vx !== undefined){ dragging.vx = 0; dragging.vy = 0; }
      toUV(dragging);
    }
    return;
  }
  if (tool === 'laser' && (e.pointerType === 'mouse' || laser.on)){ laser.on = true; laser.x = clamp(p.x, 0, W); laser.y = clamp(p.y, 0, H); }
}
function onUp(e){
  if (dragging){ toUV(dragging); dragging = null; saveGame(); }
  if (tool === 'laser' && e.pointerType !== 'mouse') laser.on = false;
}

/* ---------- fenêtres ---------- */
let openModal = null;
function showModal(id){ closeModal(); openModal = id; $(id).hidden = false; const f = $(id).querySelector('[data-autofocus]') || $(id).querySelector('button'); if (f) f.focus(); }
function closeModal(){ if (!openModal) return; $(openModal).hidden = true; if (openModal === 'creatorModal') creatorOpen = false; openModal = null; }

/* ---------- boutique ---------- */
let shopTab = 'meubles';
const TABS = [['meubles', 'Meubles'], ['jouets', 'Jouets'], ['deco', 'Déco'], ['food', 'Nourriture'], ['care', 'Soins'], ['coats', 'Pelages']];
function openShop(tab){ if (tab) shopTab = tab; renderShop(); showModal('shopModal'); }
function priceTag(n){ return `<span class="price">${COIN_SVG}${n}</span>`; }
function renderShop(){
  $('shopTabs').innerHTML = TABS.map(([id, l]) => `<button data-tab="${id}" aria-pressed="${id === shopTab}">${l}</button>`).join('');
  let cards = [];
  if (['meubles', 'jouets', 'deco'].includes(shopTab)){
    cards = ITEM_LIST.filter(d => d.cat === shopTab).map(d => card({kind: 'item', id: d.id, name: d.name, desc: d.desc, price: d.price, owned: `${(G.inv[d.id] || 0) + G.placed.filter(o => o.type === d.id).length} possédé(s)`}));
  } else if (shopTab === 'food'){
    cards = FOODS.map(f => card({kind: 'food', id: f.id, name: f.name, desc: f.desc, price: f.price, owned: `${G.food[f.id] || 0} portion(s) en stock`}));
  } else if (shopTab === 'care'){
    cards = CARES.map(c => card({kind: 'care', id: c.id, name: c.name, desc: c.desc, price: c.price, owned: c.once ? (G.brush ? 'Déjà achetée' : '') : `${G.care[c.id] || 0} en stock`, done: c.once && G.brush}));
  } else {
    cards = COATS.map(co => {
      const has = G.coats.includes(co.id), ch = co.challenge && ACH.find(a => a.id === co.challenge);
      return card({kind: 'coat', id: co.id, name: co.label, desc: has ? 'Disponible dans la création de chat.' : ch ? ch.desc : 'Un nouveau pelage pour tes futurs chats.', price: co.price, done: has, challenge: !has && !!ch});
    });
  }
  $('shopGrid').innerHTML = cards.join('');
  $('shopGrid').querySelectorAll('canvas[data-prev]').forEach(cnv => {
    const [k, id] = cnv.dataset.prev.split(':');
    if (k === 'item') renderItemPreview(cnv, id);
    else if (k === 'coat') renderCatPreview(cnv, coatById(id), 1.3);
    else drawProductIcon(cnv, k, id);
  });
  updateHUD();
}
function card(o){
  const btn = o.done ? '<span class="tag ok">Débloqué</span>'
    : o.challenge ? '<span class="tag">Défi</span>'
    : `<button class="buy" data-buy="${o.kind}:${o.id}" ${G.coins < o.price ? 'disabled' : ''}>${G.coins < o.price ? `Il manque ${o.price - G.coins}` : 'Acheter'}</button>`;
  return `<div class="card"><canvas data-prev="${o.kind}:${o.id}" width="128" height="88"></canvas><div class="card-body"><b>${esc(o.name)}</b><p>${esc(o.desc)}</p>${o.owned ? `<small>${esc(o.owned)}</small>` : ''}<div class="card-foot">${o.challenge || o.done ? '' : priceTag(o.price)}${btn}</div></div></div>`;
}
function buy(kind, id){
  if (kind === 'item'){ const d = ITEMS[id]; if (!spend(d.price)) return; G.inv[id] = (G.inv[id] || 0) + 1; toast('Acheté !', `${d.name} : à placer avec Aménager.`); }
  else if (kind === 'food'){ const f = foodById(id); if (!spend(f.price)) return; G.food[id] = (G.food[id] || 0) + f.pack; }
  else if (kind === 'care'){ const c = CARES.find(x => x.id === id); if (!spend(c.price)) return; if (c.once) G.brush = true; else G.care[id] = (G.care[id] || 0) + c.pack; }
  else if (kind === 'coat'){ const co = coatById(id); if (G.coats.includes(id) || !spend(co.price)) return; G.coats.push(id); toast('Nouveau pelage', `${co.label} est disponible pour tes prochains chats.`); }
  buySound(); updateToolbar(); renderShop(); if (buildMode) renderBuildBar(); saveGame();
}
function drawProductIcon(cnv, kind, id){
  const c2 = cnv.getContext('2d'), w = cnv.width, h = cnv.height;
  c2.clearRect(0, 0, w, h);
  withCtx(c2, () => {
    ctx.save(); ctx.translate(w / 2, h / 2 + 4);
    if (kind === 'food'){
      const f = foodById(id), col = id === 'croq' ? '#5aa6d6' : id === 'premium' ? '#8a5ac8' : '#e07a5a';
      if (id === 'patee'){
        blob('#d8dee4', () => ctx.roundRect(-26, -10, 52, 24, 6)); blob(col, () => ctx.roundRect(-26, -10, 52, 10, 4));
        blob(f.color, ell(0, -12, 22, 5));
      } else {
        blob(col, () => { ctx.moveTo(-20, -30); ctx.lineTo(20, -30); ctx.lineTo(24, 22); ctx.lineTo(-24, 22); ctx.closePath(); });
        blob('#fff6ea', ell(0, -2, 12, 10));
        kibbles(0, -2, 8, 8, f.color);
        if (id === 'premium'){ ctx.fillStyle = '#ffd75a'; ctx.font = '800 12px "Baloo 2"'; ctx.textAlign = 'center'; ctx.fillText('★', 0, -16); }
      }
    } else if (id === 'treat'){
      for (const [x, y, r] of [[-12, 4, .3], [10, 0, -.4], [0, -10, .1]]){ ctx.save(); ctx.translate(x, y); ctx.rotate(r); blob('#d99a4e', () => { ctx.moveTo(-12, 0); ctx.quadraticCurveTo(0, -9, 10, 0); ctx.quadraticCurveTo(0, 9, -12, 0); ctx.moveTo(10, 0); ctx.lineTo(16, -5); ctx.lineTo(16, 5); ctx.closePath(); }); ctx.restore(); }
    } else if (id === 'catnip'){
      for (const [x, r] of [[-10, -.5], [0, 0], [10, .5]]){ ctx.save(); ctx.translate(x, 6); ctx.rotate(r); blob('#5fae5a', ell(0, -14, 7, 15)); ctx.restore(); }
    } else if (id === 'vitamins'){
      blob('#f4efe7', () => ctx.roundRect(-14, -22, 28, 38, 6)); blob('#e8a64e', () => ctx.roundRect(-16, -28, 32, 8, 3));
      ctx.fillStyle = '#e07a5a'; ctx.font = '800 14px "Baloo 2"'; ctx.textAlign = 'center'; ctx.fillText('+', 0, 4);
    } else if (id === 'kit'){
      blob('#e8eef3', () => ctx.roundRect(-24, -18, 48, 34, 6)); ctx.fillStyle = '#e05a5a'; ctx.fillRect(-4, -12, 8, 22); ctx.fillRect(-11, -5, 22, 8);
    } else if (id === 'brush'){
      ctx.rotate(-.4); blob('#a8743e', () => ctx.roundRect(-30, -4, 34, 8, 4)); blob('#c98b4f', () => ctx.roundRect(2, -10, 24, 18, 5));
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.2; for (let i = 0; i < 6; i++){ ctx.beginPath(); ctx.moveTo(5 + i * 4, 8); ctx.lineTo(5 + i * 4, 13); ctx.stroke(); }
    }
    ctx.restore();
  });
}

/* ---------- création de chat ---------- */
let creatorOpen = false;
const cr = {name: '', coatId: 'roux', voiceId: 'classic', voice: null, traitId: 'calin', first: false};
function adoptCost(){ return G.adoptions < 2 ? 0 : 40; }
function openCreator(first){
  const room = roomById(G.room);
  if (!first && G.cats.length >= room.maxCats){ errorSound(); showHint(`${room.name} est complet (${room.maxCats} chats). Débloque une plus grande pièce !`, 6000); return; }
  cr.first = first; cr.name = ''; cr.coatId = pick(G.coats); cr.voiceId = pick(VOICES).id; cr.voice = makeVoice(cr.voiceId); cr.traitId = pick(TRAITS).id;
  $('crName').value = ''; $('crName').placeholder = pick(NAMES);
  $('crCancel').hidden = first;
  $('crTitle').textContent = first ? 'Ton premier chat' : 'Adopter un chat';
  renderCreator(); creatorOpen = true; showModal('creatorModal'); $('crName').focus();
}
function renderCreator(){
  $('crCoats').innerHTML = COATS.map(co => {
    const has = G.coats.includes(co.id);
    return `<button class="coat${cr.coatId === co.id ? ' on' : ''}${has ? '' : ' locked'}" data-coat="${co.id}" title="${esc(co.label)}"><span class="sw" style="background:${co.base};border-color:${co.dark}"></span><small>${esc(co.label)}</small>${has ? '' : `<em>${co.challenge ? 'Défi' : co.price}</em>`}</button>`;
  }).join('');
  $('crVoices').innerHTML = VOICES.map(v => `<button class="chip${cr.voiceId === v.id ? ' on' : ''}" data-voice="${v.id}">♪ ${esc(v.label)}</button>`).join('');
  $('crTraits').innerHTML = TRAITS.map(t => `<button class="chip${cr.traitId === t.id ? ' on' : ''}" data-trait="${t.id}" title="${esc(t.desc)}">${esc(t.label)}</button>`).join('');
  $('crTraitDesc').textContent = traitById(cr.traitId).desc;
  const co = coatById(cr.coatId), has = G.coats.includes(co.id), cost = adoptCost();
  $('crCoatName').textContent = co.label;
  const un = $('crUnlock');
  if (!has && !co.challenge){ un.hidden = false; un.innerHTML = `Débloquer ce pelage ${priceTag(co.price)}`; un.disabled = G.coins < co.price; }
  else un.hidden = true;
  $('crMsg').textContent = !has ? (co.challenge ? `Pelage à gagner : ${ACH.find(a => a.id === co.challenge).desc}` : `Ce pelage est verrouillé : débloque-le pour ${co.price} ${COIN}.`) : (cost ? `Adoption : ${cost} ${COIN} (tu en as ${G.coins}).` : 'Adoption gratuite !');
  $('crAdopt').disabled = !has || G.coins < cost;
}
function adoptFromCreator(){
  const co = coatById(cr.coatId), cost = adoptCost();
  if (!G.coats.includes(co.id) || !spend(cost)) return;
  const name = ($('crName').value.trim() || $('crName').placeholder).slice(0, 14);
  const c = makeCat({name, coatId: co.id, voice: cr.voice, traitId: cr.traitId});
  c.x = W + 30; c.y = rand(minY(), H - 18); c.tx = rand(W * .5, W - 60); c.ty = c.y; c.state = 'wander';
  G.cats.push(c); G.adoptions++;
  closeModal(); renderRoster(); saveGame();
  setTimeout(() => say(c, 'Bonjour ? Miaou !', 2.5), 300);
  if (cr.first){
    toggleBuild(true);
    setTimeout(() => showHint(`Bienvenue ${name} ! La pièce est vide : place une gamelle, de l’eau et une litière, puis clique sur Terminer.`, 9000), 400);
  } else toast('Nouveau chat !', `${name} a rejoint la famille.`);
}

/* ---------- succès et pièces ---------- */
function renderAch(){
  $('achList').innerHTML = ACH.map(a => {
    const done = !!G.ach[a.id], p = a.prog ? a.prog(G.stats, G) : null, pct = done ? 100 : p ? Math.min(100, p[0] / p[1] * 100) : 0;
    return `<li class="${done ? 'done' : ''}${a.challenge ? ' challenge' : ''}"><span class="check">${done ? '✓' : ''}</span><div><b>${esc(a.name)}</b><p>${esc(a.desc)}</p>${!done && p ? `<span class="bar"><i style="width:${pct}%"></i></span><small>${Math.min(p[0], p[1])} / ${p[1]}</small>` : ''}</div>${priceTag(a.reward)}</li>`;
  }).join('');
  $('achSummary').textContent = `${Object.keys(G.ach).length} succès sur ${ACH.length}`;
}
function renderRooms(){
  const nAch = Object.keys(G.ach).length;
  $('roomsList').innerHTML = ROOMS.map(r => {
    const has = G.rooms.includes(r.id), here = G.room === r.id;
    const reqs = r.req ? [[nAch, r.req.ach, 'succès'], [G.earned, r.req.earned, `${COIN} gagnés`]] : [];
    const ok = reqs.every(([v, t]) => v >= t);
    const btn = here ? '<span class="tag ok">Tu es ici</span>'
      : has ? `<button class="buy" data-move="${r.id}">Déménager ici</button>`
      : `<button class="buy" data-unlock="${r.id}" ${ok ? '' : 'disabled'}>${ok ? 'Débloquer' : 'Verrouillée'}</button>`;
    return `<div class="room-card${here ? ' here' : ''}"><canvas data-room="${r.id}" width="240" height="120"></canvas><div><b>${esc(r.name)}</b><p>${esc(r.desc)}</p>
      ${!has && reqs.length ? reqs.map(([v, t, l]) => `<div class="req"><span>${Math.min(v, t)} / ${t} ${l}</span><span class="bar"><i style="width:${Math.min(100, v / t * 100)}%"></i></span></div>`).join('') : ''}
      <div class="card-foot">${btn}</div></div></div>`;
  }).join('');
  $('roomsList').querySelectorAll('canvas[data-room]').forEach(drawRoomThumb);
}
function drawRoomThumb(cnv){
  const id = cnv.dataset.room, c2 = cnv.getContext('2d');
  const save = {W, H, floorTop, room: G.room, sizeK};
  W = cnv.width; H = cnv.height; floorTop = H * .5; G.room = id;
  const keepBirds = birds.splice(0);
  withCtx(c2, () => drawRoom(0));
  birds.push(...keepBirds);
  W = save.W; H = save.H; floorTop = save.floorTop; G.room = save.room; sizeK = save.sizeK;
}
function moveRoom(id){
  const r = roomById(id);
  if (G.cats.length > r.maxCats){ errorSound(); showHint(`Trop de chats pour ${r.name} (${r.maxCats} maximum).`); return; }
  G.room = id; fights.splice(0).forEach(f => { f.a.fight = f.b.fight = null; setState(f.a, 'idle', 1); setState(f.b, 'idle', 1); });
  birds.length = 0; rebuildSill(); updateHUD(); renderRooms(); renderRoster(); saveGame();
  toast('Déménagement', `Bienvenue dans ${r.name} ! Tes meubles t’ont suivi.`);
}

/* ---------- écran titre ---------- */
const titleCats = [
  {coat: coatById('roux'), dir: 1, state: 'idle', tailT: 0, happy: 50, x: .3},
  {coat: coatById('siamois'), dir: -1, state: 'idle', tailT: 2, happy: 50, x: .7},
  {coat: coatById('noir'), dir: 1, state: 'sleep', tailT: 1, happy: 50, x: .5}
];
function drawTitle(t){
  const tc = $('titleCanvas'), r = tc.getBoundingClientRect(), d = window.devicePixelRatio || 1;
  if (!r.width) return;
  if (tc.width !== Math.round(r.width * d) || tc.height !== Math.round(r.height * d)){ tc.width = Math.round(r.width * d); tc.height = Math.round(r.height * d); }
  const c2 = tc.getContext('2d'); c2.setTransform(d, 0, 0, d, 0, 0);
  const w = r.width, h = r.height;
  withCtx(c2, () => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a1430'); g.addColorStop(.65, '#3a2a52'); g.addColorStop(1, '#231a26');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    for (const [sx, sy, sp] of STARFIELD){ ctx.globalAlpha = .3 + .7 * Math.abs(Math.sin(t * .7 + sp * 9)); ctx.fillRect(sx * w, sy * h * .6, 1.6, 1.6); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f7efd2'; ctx.beginPath(); ctx.arc(w * .82, h * .18, Math.min(w, h) * .06, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#231a26'; ctx.beginPath(); ctx.arc(w * .82 + Math.min(w, h) * .025, h * .18 - Math.min(w, h) * .015, Math.min(w, h) * .055, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f2238'; ctx.fillRect(0, h * .86, w, h * .14);
    ctx.fillStyle = '#b8493f'; ctx.beginPath(); ctx.ellipse(w / 2, h * .9, Math.min(w * .42, 300), 20, 0, 0, Math.PI * 2); ctx.fill();
    const s = clamp(Math.min(w, h) / 380, .8, 1.8);
    for (const c of titleCats){
      c.tailT = t + (c.x * 10); c.blinkT = ((t + c.x * 7) % 5) < .15 ? 1 : 0;
      ctx.save(); ctx.translate(w * c.x, h * .9); ctx.scale(c.dir * s, s); drawCatBody(c, c.state === 'sleep' ? 'sleep' : 'sit'); ctx.restore();
    }
  });
}
function showTitle(){
  screen = 'title'; buildMode && toggleBuild(false); laser.on = false; closeModal();
  $('title').hidden = false; $('game').hidden = true;
  const s = loadSaved();
  $('btnContinue').hidden = !s;
  if (s) $('btnContinue').querySelector('small').textContent = `${s.cats.length} chat${s.cats.length > 1 ? 's' : ''} · jour ${s.day} · ${s.coins} ${COIN}`;
  $('newConfirm').hidden = true; $('helpPanel').hidden = true;
}
function enterGame(){
  screen = 'game';
  $('title').hidden = true; $('game').hidden = false;
  resize(); rebuildSill();
  updateHUD(); updateToolbar(); renderRoster(); setTool('pet');
}
function startNewGame(){
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  G = newGameState(); dayPhase = G.dayPhase; puddles = []; fights.length = 0; birds.length = 0;
  enterGame();
  openCreator(true);
}

/* ---------- branchements ---------- */
function init(){
  cv = $('room'); mainCtx = cv.getContext('2d'); ctx = mainCtx;
  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointerleave', () => { ghost.on = false; if (tool === 'laser') laser.on = false; });
  document.addEventListener('pointerdown', () => { if (soundOn) audio(); }, {capture: true});
  window.addEventListener('resize', () => { resize(); if (openModal === 'roomsModal') renderRooms(); });
  window.addEventListener('pagehide', saveGame);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (openModal && !(openModal === 'creatorModal' && cr.first)) closeModal();
    else if (buildMode && buildPick){ buildPick = null; renderBuildBar(); }
  });

  $('btnContinue').addEventListener('click', () => { const s = loadSaved(); if (s) startFromSave(s); });
  $('btnNew').addEventListener('click', () => { if (loadSaved()) $('newConfirm').hidden = false; else startNewGame(); });
  $('btnNewYes').addEventListener('click', startNewGame);
  $('btnNewNo').addEventListener('click', () => { $('newConfirm').hidden = true; });
  $('btnHelp').addEventListener('click', () => { $('helpPanel').hidden = !$('helpPanel').hidden; });

  document.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
  $('foodSel').addEventListener('change', () => setTool('food'));
  $('careSel').addEventListener('change', () => setTool('care'));
  $('btnDay').addEventListener('click', () => { let g = daylight > .5 ? 22 / 24 : 9 / 24; if (g <= dayPhase) g += 1; skipTo = g; });
  $('btnSound').addEventListener('click', () => { soundOn = !soundOn; G.soundOn = soundOn; if (soundOn){ audio(); } else if (actx) actx.suspend(); updateToolbar(); });
  $('btnShop').addEventListener('click', () => openShop());
  $('btnBuild').addEventListener('click', () => toggleBuild(!buildMode));
  $('btnAdopt').addEventListener('click', () => openCreator(false));
  $('btnAch').addEventListener('click', () => { renderAch(); showModal('achModal'); });
  $('btnRooms').addEventListener('click', () => { renderRooms(); showModal('roomsModal'); });
  $('btnMenu').addEventListener('click', () => { saveGame(); showTitle(); });

  $('buildList').addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (!b) return; buildPick = buildPick === b.dataset.pick ? null : b.dataset.pick; selected = null; renderBuildBar(); });
  $('btnStore').addEventListener('click', () => { if (selected) storeInst(selected); });
  $('btnStoreAll').addEventListener('click', () => { [...G.placed].forEach(storeInst); renderBuildBar(); });
  $('btnBuildDone').addEventListener('click', () => toggleBuild(false));
  $('btnBuildShop').addEventListener('click', () => openShop('meubles'));

  function listen(e){ const b = e.target.closest('[data-cat]'); if (!b) return; const c = G.cats[+b.dataset.cat]; if (!c) return; audio(); setTimeout(() => say(c, pick(voiceDef(c.voice).words)), 40); }
  $('roster').addEventListener('pointerdown', listen);
  $('roster').addEventListener('click', e => { if (e.detail === 0) listen(e); });

  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('pointerdown', e => { if (e.target === m && !(m.id === 'creatorModal' && cr.first)) closeModal(); }));
  $('shopTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b){ shopTab = b.dataset.tab; renderShop(); } });
  $('shopGrid').addEventListener('click', e => { const b = e.target.closest('[data-buy]'); if (b){ const [k, id] = b.dataset.buy.split(':'); buy(k, id); } });
  $('roomsList').addEventListener('click', e => {
    const u = e.target.closest('[data-unlock]'), m = e.target.closest('[data-move]');
    if (u){ const id = u.dataset.unlock; if (!G.rooms.includes(id)){ G.rooms.push(id); achievementSound(); toast('Nouvelle pièce !', `${roomById(id).name} est débloquée.`, true); checkAchievements(); } moveRoom(id); }
    if (m) moveRoom(m.dataset.move);
  });

  $('crRandom').addEventListener('click', () => { $('crName').value = pick(NAMES); });
  $('crCoats').addEventListener('click', e => { const b = e.target.closest('[data-coat]'); if (b){ cr.coatId = b.dataset.coat; renderCreator(); } });
  $('crVoices').addEventListener('click', e => { const b = e.target.closest('[data-voice]'); if (b){ cr.voiceId = b.dataset.voice; cr.voice = makeVoice(cr.voiceId); renderCreator(); audio(); setTimeout(() => meow({voice: cr.voice}), 40); } });
  $('crTraits').addEventListener('click', e => { const b = e.target.closest('[data-trait]'); if (b){ cr.traitId = b.dataset.trait; renderCreator(); } });
  $('crUnlock').addEventListener('click', () => { const co = coatById(cr.coatId); if (!G.coats.includes(co.id) && spend(co.price)){ G.coats.push(co.id); buySound(); renderCreator(); saveGame(); } });
  $('crAdopt').addEventListener('click', adoptFromCreator);
  $('crCancel').addEventListener('click', closeModal);
  $('crName').addEventListener('keydown', e => { if (e.key === 'Enter') adoptFromCreator(); });

  showTitle();
  requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
}
init();
