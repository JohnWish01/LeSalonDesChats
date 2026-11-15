/* Le Salon des Chats : le moteur du jeu (simulation, outils, aménagement, économie, sauvegarde). */

const SAVE_KEY = 'salon-des-chats-v2';
const DAY_LEN = 240;            // une journée = 4 minutes
const CHATTER = ['Miaou', 'Mrrp ?', 'Miaaa…', 'Mrrr', 'Mew'];
const HOLD = new Set(['eat', 'todrink', 'drink', 'tolitter', 'litter', 'tobox', 'box', 'tobed', 'bed', 'totree', 'jump', 'perch', 'toscratch', 'scratch', 'toy']);

let G = null;                   // la partie en cours (sauvegardée)
let W = 0, H = 0, floorTop = 0, sizeK = 1, cv = null, mainCtx = null;
let dayPhase = .4, daylight = 1, screen = 'title';
let tool = 'pet', buildMode = false, buildPick = null, selected = null, dragging = null, dragOff = {x: 0, y: 0};
const ghost = {x: 0, y: 0, on: false};
const laser = {on: false, x: 0, y: 0};
const pointer = {x: 0, y: 0, on: false, movedAt: 0};
const fx = [], fights = [], birds = [];
let puddles = [];
let sill = {kind: 'sill', users: []};
let comfort = 0;

const scaleAt = y => (.6 + .5 * clamp((y - floorTop) / (H - floorTop), 0, 1)) * sizeK;
const minY = () => floorTop + 28;
const sunHeight = () => -Math.cos(dayPhase * Math.PI * 2);
const catScale = c => c.onTree ? scaleAt(c.perchBaseY) : scaleAt(c.y);
const kindOf = o => ITEMS[o.type].kind;
const ofKind = k => G.placed.filter(o => kindOf(o) === k);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const nearest = (c, list) => list.sort((a, b) => dist(a, c) - dist(b, c))[0];
const isFree = s => s === 'idle' || s === 'wander';
const randFloor = () => ({x: rand(40, W - 40), y: rand(minY(), H - 18)});

/* ================= PARTIE ================= */
function newGameState(){
  const d = new Date();
  return {
    v: 2, coins: 60, earned: 0, day: 1, dayPhase: (d.getHours() + d.getMinutes() / 60) / 24,
    inv: {},
    food: {croq: 0, premium: 0, patee: 0}, care: {treat: 0, catnip: 0, vitamins: 0, kit: 0}, brush: false, laser: false, vibrateOn: true,
    coats: ['roux', 'noir', 'gris', 'blanc'], rooms: ['salon'], room: 'salon', ach: {}, adoptions: 0, uid: 1,
    rel: {}, relFlags: {}, accInv: {}, clock: 0, catUid: 1,
    stats: {pets: 0, fills: 0, cleans: 0, separations: 0, placed: 0, birds: 0, heals: 0, patee: 0, brushes: 0, perfectDays: 0, accidentsToday: 0, fightsToday: 0, grown: 0},
    cats: [], placed: [], soundOn: true
  };
}
function makeCat(o){
  const tr = traitById(o.traitId);
  return {
    name: o.name, coatId: o.coatId, coat: makeCoat(o.coatId, o.stripes, o.stripeColor), voice: o.voice || makeVoice(o.voiceId), traitId: tr.id,
    stripes: o.stripes ?? null, stripeColor: o.stripeColor || null,
    lazy: o.lazy ?? rand(...tr.lazy), patience: o.patience ?? Math.round(rand(...tr.patience)),
    happy: o.happy ?? 65, hunger: o.hunger ?? 25, thirst: o.thirst ?? 20, bladder: o.bladder ?? 15, energy: o.energy ?? 80,
    health: o.health ?? 100, sick: !!o.sick,
    x: 0, y: 0, dir: 1, state: 'idle', timer: rand(1, 3), tx: 0, ty: 0, moving: false, phase: 0, tailT: rand(0, 6),
    pets: [], bubble: null, bubbleT: 0, target: null, spotIdx: null, onTree: false, perchBaseY: 0, perchSleep: false,
    batCd: 0, bats: 0, fightCd: rand(15, 40), hop: 0, twitch: 0, blinkT: 0,
    id: o.id || (G ? G.catUid++ : 0), kitten: !!o.kitten, born: o.born ?? (G ? G.clock : 0), grow: 0,
    favToy: o.favToy || pick(TOY_TYPES), favFood: o.favFood || pick(FOODS).id, favSpot: o.favSpot || pick(['tree', 'box', 'bed', 'sill']),
    known: o.known || {}, acc: o.acc || {}, tricks: o.tricks || {},
    mem: Object.assign({pets: 0, meals: 0, laser: 0, toys: 0, birds: 0, fights: 0, tricks: 0, brushes: 0}, o.mem || {}),
    anim: null, purrT: 0, sulkT: 0, earT: 0, look: 0, trickCd: 0, rubCd: 5, sleepPose: 'curl'
  };
}
const CAT_SAVE = ['name', 'coatId', 'voice', 'traitId', 'lazy', 'patience', 'happy', 'hunger', 'thirst', 'bladder', 'energy', 'health', 'sick',
  'id', 'kitten', 'born', 'favToy', 'favFood', 'favSpot', 'known', 'acc', 'tricks', 'mem', 'stripes', 'stripeColor'];

/* ---------- relations entre chats (-100 rivaux … +100 meilleurs amis) ---------- */
const relKey = (a, b) => a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
const relOf = (a, b) => G.rel[relKey(a, b)] || 0;
function addRel(a, b, v){
  const k = relKey(a, b), before = G.rel[k] || 0, after = clamp(before + v, -100, 100);
  G.rel[k] = after;
  if (after >= 70 && !G.relFlags[k + '+']){ G.relFlags[k + '+'] = true; toast('Meilleurs amis !', `${a.name} et ${b.name} sont devenus inséparables.`); }
  if (after <= -60 && !G.relFlags[k + '-']){ G.relFlags[k + '-'] = true; toast('Rivalité', `${a.name} et ${b.name} ne se supportent plus… gare aux bagarres.`); }
}
function relLabel(v){ return v >= 70 ? 'Meilleurs amis' : v >= 35 ? 'Amis' : v <= -60 ? 'Ennemis jurés' : v <= -30 ? 'Rivaux' : 'Neutres'; }
function updateRelations(){
  const cs = G.cats;
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++){
    const a = cs[i], b = cs[j], d = dist(a, b), s = scaleAt(a.y);
    if (isAsleep(a) && isAsleep(b) && d < 110 * s) addRel(a, b, 1.2);
    else if (a.state === 'toy' && b.state === 'toy' && a.target === b.target) addRel(a, b, .8);
    else if (d < 140 * s && isFree(a.state) && isFree(b.state)) addRel(a, b, .12);
  }
}

/* ---------- préférences ---------- */
function discover(c, kind){
  if (c.known[kind]) return;
  c.known[kind] = true;
  const label = PREF_LABEL[kind][kind === 'toy' ? c.favToy : kind === 'food' ? c.favFood : c.favSpot];
  toast('Découverte !', `${c.name} adore ${label}.`, true);
  cheer(c);
}
function favSpotOf(o){ return o === sill ? 'sill' : o ? kindOf(o) : null; }

/* ---------- tours ---------- */
function doTrick(c, id){
  if (!(isFree(c.state) || c.state === 'sleep') || c.onTree){ showHint(`${c.name} est occupé : réessaie quand il est tranquille par terre.`); return false; }
  setState(c, 'trick', 2.2); c.trick = id; c.anim = null;
  return true;
}
function trainTrick(c, id){
  const tr = TRICKS.find(t => t.id === id);
  if ((c.tricks[id] || 0) >= tr.sessions) return;
  if ((G.care.treat || 0) <= 0){ errorSound(); showHint('Il faut une friandise par séance de dressage : passe à la boutique (onglet Soins).'); return; }
  if (!doTrick(c, id)) return;
  G.care.treat--; c.tricks[id] = (c.tricks[id] || 0) + 1; c.happy = Math.min(100, c.happy + 6);
  crunch(c);
  if (c.tricks[id] >= tr.sessions){ setTimeout(() => cheer(c), 600); toast('Tour appris !', `${c.name} sait faire « ${tr.name} ». Utilise l’outil Tours pour le montrer.`, true); }
  else say(c, pick(['Mrr ?', 'Miaou ?', 'Comme ça ?']), 1.5);
  updateToolbar();
}
function showTrick(c){
  const learned = TRICKS.filter(t => (c.tricks[t.id] || 0) >= t.sessions);
  if (!learned.length){ showHint(`${c.name} ne connaît pas encore de tour : entraîne-le depuis sa fiche (clique sur sa carte sous la pièce).`, 6000); return; }
  if (c.trickCd > 0){ showHint(`${c.name} en a assez de faire le clown. Réessaie dans ${Math.ceil(c.trickCd)} s.`); return; }
  const tr = pick(learned);
  if (!doTrick(c, tr.id)) return;
  c.trickCd = 40; c.mem.tricks++; c.happy = Math.min(100, c.happy + 5);
  const s = catScale(c);
  setTimeout(() => { say(c, tr.id === 'high5' ? 'Tope là !' : tr.id === 'paw' ? 'Voilà !' : 'Mrrp !', 1.4); sparkle(c.x, c.y - 50 * s, s); addCoins(Math.round(tr.reward * roomById(G.room).mult), c.x, c.y - 90 * s); }, 700);
}
function makeInst(type, x, y){
  const d = ITEMS[type], o = {uid: G.uid++, type, x, y, u: 0, v: 0};
  if (d.kind === 'bowl'){ o.food = 0; o.foodType = 'croq'; }
  if (d.kind === 'water') o.users = Array(d.spots).fill(null);
  if (d.kind === 'tree') o.users = Array(d.levels).fill(null);
  if (d.kind === 'litter'){ o.dirt = 0; o.clumps = []; o.user = null; o.autoT = 40; }
  if (d.kind === 'box' || d.kind === 'bed') o.occupant = null;
  if (d.kind === 'toy'){ o.vx = 0; o.vy = 0; o.rot = 0; o.face = 1; o.autoT = rand(1, 3); }
  toUV(o);
  return o;
}
function toXY(o){ o.x = o.u * W; o.y = floorTop + o.v * (H - floorTop); }
function toUV(o){ o.u = o.x / Math.max(1, W); o.v = (o.y - floorTop) / Math.max(1, H - floorTop); }

function serialize(){
  return JSON.stringify({
    ...G,
    cats: G.cats.map(c => Object.assign(Object.fromEntries(CAT_SAVE.map(k => [k, c[k]])), {u: c.x / W, v: c.onTree ? .2 : (c.y - floorTop) / (H - floorTop)})),
    placed: G.placed.map(o => ({uid: o.uid, type: o.type, u: o.u, v: o.v, food: o.food, foodType: o.foodType, dirt: o.dirt, clumps: o.clumps})),
    dayPhase
  });
}
function saveGame(){ if (!G || screen !== 'game') return; try { localStorage.setItem(SAVE_KEY, serialize()); } catch (e) {} }
function loadSaved(){
  try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null; const s = JSON.parse(raw); return s && s.v === 2 ? s : null; } catch (e) { return null; }
}
function startFromSave(s){
  G = Object.assign(newGameState(), s);
  G.stats = Object.assign(newGameState().stats, s.stats || {});
  G.placed = (s.placed || []).filter(p => ITEMS[p.type]).map(p => { const o = makeInst(p.type, 0, 0); Object.assign(o, p, {users: o.users, occupant: o.occupant ?? null, user: null}); return o; });
  G.cats = (s.cats || []).map(p => { const c = makeCat(p); c._u = p.u; c._v = p.v; return c; });
  for (const c of G.cats) if (!c.id) c.id = G.catUid++;
  dayPhase = s.dayPhase ?? G.dayPhase;
  soundOn = G.soundOn !== false; vibrateOn = G.vibrateOn !== false;
  enterGame();
  for (const c of G.cats){ c.x = clamp((c._u ?? .5) * W, 30, W - 30); c.y = clamp(floorTop + clamp(c._v ?? .5, .1, 1) * (H - floorTop), minY(), H - 16); }
}

/* ================= OUTILS DU JEU ================= */
function setState(c, s, t){
  if (c.target && !HOLD.has(s)) release(c);
  if (s !== 'idle') c.anim = null;
  c.state = s; c.timer = t ?? 0; c.moving = false;
}
function release(c){
  const t = c.target;
  if (t){
    if (t.users && c.spotIdx != null && t.users[c.spotIdx] === c) t.users[c.spotIdx] = null;
    if (t.occupant === c) t.occupant = null;
    if (t.user === c) t.user = null;
  }
  c.target = null; c.spotIdx = null;
}
function moveTo(c, tx, ty, speed, dt){
  const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
  if (d < 5){ c.moving = false; return true; }
  const st = Math.min(d, speed * scaleAt(c.y) * dt);
  c.x += dx / d * st; c.y += dy / d * st;
  if (Math.abs(dx) > 2) c.dir = dx > 0 ? 1 : -1;
  c.moving = true; c.phase += st * .18;
  return false;
}
function say(c, t, d = 1.8){
  c.bubble = t; c.bubbleT = d;
  if (/^(Pfff|Hmpf|Bof|Beurk|Kss)/.test(t)) c.sulkT = 3;
  if (/^(Prrrr|Mrrrou)/.test(t)) c.purrT = 2;
  if (t.startsWith('Ek-') || t.startsWith('Mek-')) chatter(c);
  else if (t.startsWith('Slurp') || t.startsWith('Glou')){ lap(c); setTimeout(() => lap(c), 120); }
  else if (t.startsWith('Grr') || t.startsWith('Mrrraow')) yowl(c);
  else if (t.startsWith('Ss') || t.startsWith('Kss')) hiss();
  else if (t.startsWith('Prrrr') || t === 'Mrrrou') purr(c.voice.pitch);
  else if (t.startsWith('Pfff') || t.startsWith('Hmpf') || t.startsWith('Bof') || t.startsWith('Beurk')){
    sulk(c);
    const s = catScale(c);
    for (let i = 0; i < 3; i++) fx.push({x: c.x + c.dir * rand(30, 40) * s, y: c.y - rand(34, 44) * s, vx: c.dir * rand(20, 45), vy: rand(-12, 4), life: .7, size: rand(7, 11) * s, ch: '●', col: 'rgba(225,225,235,.6)'});
  }
  else if (t.startsWith('Atchoum')) sneeze(c);
  else if (t.startsWith('!') || t.length <= 5) meow(c, 'short');
  else if (t.startsWith('Miaa') || t.startsWith('Bonjour') || t.endsWith('…')) meow(c, 'long');
  else if (t !== 'Pfiou…') meow(c);
}
function hearts(c, n = 3){
  const s = catScale(c);
  for (let i = 0; i < n; i++) fx.push({x: c.x + rand(-14, 14) * s, y: c.y - 60 * s, vx: rand(-12, 12), vy: rand(-45, -30), life: 1.2, size: rand(12, 18) * s});
}
function sparkle(x, y, s){ for (let i = 0; i < 6; i++) fx.push({x: x + rand(-20, 20) * s, y: y + rand(-10, 5) * s, vx: rand(-20, 20), vy: rand(-50, -25), life: 1, size: rand(12, 18) * s, ch: '✦', col: '#bfe8ff'}); }
function cheer(c){
  c.bubble = pick(['Mrrrip ♪', 'Mrrr-iiip !', 'Brrrip ♪']); c.bubbleT = 1.6;
  happySound(c); hearts(c, 2);
}
function addCoins(n, x, y, quiet){
  if (n <= 0) return;
  G.coins += n; G.earned += n;
  if (x != null) fx.push({x, y, vx: 0, vy: -32, life: 1.3, size: 15, text: '+' + n, col: '#ffd75a'});
  if (!quiet) coinSound();
  updateHUD();
}
function spend(n){ if (G.coins < n) return false; G.coins -= n; updateHUD(); return true; }

/* ================= POSITIONS DES PERCHOIRS ================= */
function spotPos(c){
  const o = c.target, i = c.spotIdx ?? 0;
  if (o === sill){ const g = winGeom(); return {x: g.wx + g.ww * g.sill[i], y: g.wy + g.wh + 4}; }
  const s = scaleAt(o.y), [dx, dy] = TREE_SPOTS[i];
  return {x: o.x + dx * s, y: o.y + dy * s};
}
function spotBase(c){
  const o = c.target;
  if (o === sill){ const p = spotPos(c); return {x: clamp(p.x + 24 * scaleAt(minY()), 30, W - 30), y: minY() + 2}; }
  return {x: o.x + 32 * scaleAt(o.y), y: Math.max(minY(), o.y + 6)};
}
const WATER_SPOTS = {water1: [[30, 0]], water2: [[-44, 0], [44, 0]], water3: [[-50, 0], [50, 0], [-26, 20]]};
function jump(c, to, up){
  c.jFrom = {x: c.x, y: c.y}; c.jTo = to; c.jT = 0; c.jUp = up;
  c.dir = to.x > c.x ? 1 : -1; c.onTree = true; c.state = 'jump'; c.moving = true;
  if (up && c.target !== sill) climbSound();
}
function jumpDown(c){
  const o = c.target, wasSill = o === sill;
  release(c);
  const side = Math.random() < .5 ? -1 : 1, s = scaleAt(wasSill ? minY() : (o ? o.y : c.perchBaseY));
  const base = wasSill ? {x: c.x, y: minY()} : {x: o ? o.x : c.x, y: o ? o.y : minY()};
  jump(c, {x: clamp(base.x + side * rand(45, 80) * s, 30, W - 30), y: clamp(base.y + rand(8, 28) * s, minY(), H - 16)}, false);
}

/* ================= LES CHATS ================= */
function update(c, dt){
  c.tailT += dt;
  if (c.twitch > 0) c.twitch -= dt;
  if (c.blinkT > 0) c.blinkT -= dt; else if (Math.random() < dt * .25) c.blinkT = .15;
  if (c.earT > 0) c.earT -= dt; else if (Math.random() < dt * .15) c.earT = .25;
  c.purrT -= dt; c.sulkT -= dt; c.trickCd -= dt; c.rubCd -= dt;
  if (c.kitten){
    c.grow = clamp((G.clock - c.born) / 3, 0, 1);
    if (c.grow >= 1){ c.kitten = false; G.stats.grown++; toast('Il a bien grandi !', `${c.name} n’est plus un chaton.`, true); cheer(c); }
  }
  // il suit la main des yeux, et vient parfois se frotter
  const s0 = scaleAt(c.y);
  if (pointer.on && !buildMode && tool !== 'laser' && isFree(c.state) && !c.onTree){
    const dp = Math.hypot(pointer.x - c.x, pointer.y - (c.y - 25 * s0));
    if (dp < 230 * s0){
      if (!c.moving){ c.dir = pointer.x > c.x ? 1 : -1; c.look = clamp((pointer.y - (c.y - 50 * s0)) / (140 * s0), -1, 1); }
      if (dp < 110 * s0 && performance.now() - pointer.movedAt > 900 && c.rubCd <= 0 && c.lazy < .85 && Math.random() < dt * .7){ setState(c, 'rub', rand(2.5, 4)); c.rubCd = 25; purr(c.voice.pitch); }
    } else c.look *= .92;
  } else c.look *= .92;
  // petites animations au repos : toilette, bâillement, position « pain »
  if (c.state === 'idle' && !c.moving && !c.anim && Math.random() < dt * .2){
    const r = Math.random();
    c.anim = r < .45 ? {type: 'groom', t: 0, dur: rand(2.5, 4.5)} : r < .65 ? {type: 'yawn', t: 0, dur: 1.3} : {type: 'loaf', t: 0, dur: rand(5, 9)};
    if (c.anim.type === 'yawn') yawnSound(c);
    c.timer = Math.max(c.timer, c.anim.dur);
  }
  if (c.anim){
    c.anim.t += dt;
    if (c.anim.type === 'groom'){ c.lickT = (c.lickT ?? 0) - dt; if (c.lickT <= 0){ c.lickT = rand(.6, 1); groomSound(); } }
    if (c.anim.t >= c.anim.dur || c.state !== 'idle'){
      const was = c.anim.type; c.anim = null;
      if (was === 'stretch' && c.state === 'idle' && Math.random() < .6){ c.anim = {type: 'yawn', t: 0, dur: 1.3}; yawnSound(c); }
    }
  }
  if (c.acc.neck === 'collarBell' && c.moving){ c.jingleT = (c.jingleT ?? 0) - dt; if (c.jingleT <= 0){ c.jingleT = rand(.7, 1.3); bellJingle(); } }
  if (['box', 'bed', 'perch'].includes(c.state) && favSpotOf(c.target) === c.favSpot){ c.happy = Math.min(100, c.happy + dt * 1.5); discover(c, 'spot'); }
  const eating = c.state === 'eat' && !c.moving;
  c.hunger = Math.min(100, c.hunger + dt * 1.0);
  c.thirst = Math.min(100, c.thirst + dt * (.75 + (eating ? 1.5 : 0)));
  c.bladder = Math.min(100, c.bladder + dt * (.6 + (eating ? 2.5 : 0)));
  const resting = isAsleep(c);
  c.energy = clamp(c.energy + (resting ? dt * (c.state === 'bed' ? 11 : 7) : -dt * (c.state === 'chase' || c.state === 'crazy' ? 3 : .6) * (c.sick ? 1.6 : 1)), 0, 100);
  const decay = ((c.hunger > 70 ? 1.1 : .4) + (c.thirst > 75 ? .5 : 0) + (c.sick ? .6 : 0)) / (1 + comfort * .06);
  c.happy = clamp(c.happy - dt * decay, 0, c.sick ? 60 : 100);
  let dh = 0;
  if (c.hunger > 85) dh -= .55;
  if (c.thirst > 85) dh -= .65;
  if (dh === 0 && c.hunger < 60 && c.thirst < 60) dh = .15;
  c.health = clamp(c.health + dh * dt, 0, 100);
  if (!c.sick && c.health < 35){ c.sick = true; say(c, 'Atchoum !'); showHint(`${c.name} est malade ! Donne-lui des vitamines ou une trousse de soins (boutique, onglet Soins).`, 7000); }
  if (c.sick && c.health >= 60){ c.sick = false; cheer(c); }
  if (c.sick && !resting){ c.sneezeT = (c.sneezeT ?? 3) - dt; if (c.sneezeT <= 0){ c.sneezeT = rand(6, 11); say(c, 'Atchoum !', 1.2); } }

  if (c.bubbleT > 0){ c.bubbleT -= dt; if (c.bubbleT <= 0) c.bubble = null; }
  else if (!resting && (c.chatCd = (c.chatCd ?? rand(5, 15)) - dt) <= 0 && Math.random() < dt * .012){
    // bavardage spontané : plus rare, jamais deux fois le même mot de suite
    const pool = (Math.random() < .7 ? voiceDef(c.voice).words : CHATTER).filter(w => w !== c.lastWord);
    c.lastWord = pick(pool); c.chatCd = rand(10, 22);
    say(c, c.lastWord);
  }

  if (c.happy > 80 && !resting && c.state !== 'fight' && c.state !== 'box'){
    if (!c.wasHappy) cheer(c);
    else if (isFree(c.state) && !c.bubble && Math.random() < dt * .015) cheer(c);
  }
  c.wasHappy = c.happy > 80 ? true : c.happy < 70 ? false : c.wasHappy;

  c.hungryT = (c.hungryT ?? rand(1, 4)) - dt;
  if (c.hunger > 70 && isFree(c.state) && !G.placed.some(o => kindOf(o) === 'bowl' && o.food > 0) && c.hungryT <= 0){
    c.hungryT = rand(5, 9) * (c.hunger > 90 ? .55 : 1);
    c.bubble = pick(['Miaaaou !', 'Mi-AAAOU !', 'Miaou ? Miaou !']); c.bubbleT = 2; hungrySound(c);
    nag('hunger', ofKind('bowl').length ? `${c.name} a faim ! Prends l’outil Nourrir et clique sur une gamelle.` : `${c.name} a faim, mais il n’y a pas de gamelle : place-en une avec Aménager.`);
  }

  c.fightCd -= dt; c.complainT = (c.complainT || 0) - dt;
  if (isFree(c.state)){
    if (laser.on && c.energy > 15 && Math.random() < dt * (1.6 - c.lazy * 1.2)){ setState(c, 'chase'); say(c, '!', .8); c.mem.laser++; }
    else if (c.bladder > 70 && tryLitter(c)){}
    else if (c.hunger > 45 && tryEat(c)){}
    else if (c.thirst > 60 && tryDrink(c)){}
    else if (c.energy > 15 && tryToy(c, dt)){}
    else tryFight(c, dt);
  }
  if (c.state === 'sleep' && laser.on && c.lazy < .5 && Math.random() < dt * .15){ setState(c, 'chase'); say(c, '!!', .8); }

  if (c.bladder >= 100 && !c.onTree && !['box', 'bed', 'tolitter', 'litter', 'jump'].includes(c.state)){
    const s = scaleAt(c.y);
    puddles.push({x: c.x - c.dir * 14 * s, y: c.y + 2, r: rand(14, 20) * s});
    c.bladder = 0; c.happy = Math.max(0, c.happy - 10); c.health = Math.max(0, c.health - 3); say(c, 'Oups…', 2);
    G.stats.accidentsToday++;
    showHint(`Oups ! ${c.name} a eu un petit accident. Prends la pelle pour nettoyer${ofKind('litter').length ? '' : ', et place une litière'}.`, 6000);
  }

  switch (c.state){
    case 'idle': {
      c.timer -= dt;
      if (c.timer > 0) break;
      let o;
      const sleepy = c.energy < 25 || Math.random() < .1 + c.lazy * .15 + (1 - daylight) * .3;
      const fav = k => c.favSpot === k ? 2.3 : 1;
      if (sleepy){
        o = freeOf('bed');
        const buddy = G.cats.find(b => b !== c && b.state === 'sleep' && !b.onTree && relOf(c, b) > 35);
        if (buddy && Math.random() < .7){ setState(c, 'tosnuggle'); c.buddy = buddy; }
        else if (o && Math.random() < .85){ setState(c, 'tobed'); c.target = o; o.occupant = c; }
        else goSleep(c, rand(7, 14) * (daylight < .5 ? 1.5 : 1));
      }
      else if (Math.random() < .14 && (o = G.cats.find(b => b !== c && relOf(c, b) > 45 && isFree(b.state) && !b.onTree && dist(b, c) < 320 * scaleAt(c.y)))){
        setState(c, 'groomFriend', 4); c.buddy = o; setState(o, 'idle', 6);
      }
      else if (Math.random() < .18 * fav('box') && (o = freeOf('box'))){ setState(c, 'tobox'); c.target = o; o.occupant = c; }
      else if (Math.random() < .3 * fav('tree') && (o = freeTreeSpot())){ setState(c, 'totree'); c.target = o.o; c.spotIdx = o.i; o.o.users[o.i] = c; }
      else if (c.favSpot === 'bed' && Math.random() < .15 && (o = freeOf('bed'))){ setState(c, 'tobed'); c.target = o; o.occupant = c; }
      else if (Math.random() < .22 * fav('sill') && sill.users.some(u => !u)){ const i = sill.users.findIndex(u => !u); setState(c, 'totree'); c.target = sill; c.spotIdx = i; sill.users[i] = c; }
      else if (Math.random() < .15 && (o = pick(ofKind('scratch')))){ setState(c, 'toscratch'); c.target = o; }
      else { const p = randFloor(); c.tx = p.x; c.ty = p.y; setState(c, 'wander'); }
      break;
    }
    case 'wander': if (moveTo(c, c.tx, c.ty, 48, dt)) setState(c, 'idle', rand(2, 5)); break;
    case 'flee': c.timer -= dt; if (moveTo(c, c.tx, c.ty, 120, dt) || c.timer <= 0) setState(c, 'idle', rand(3, 5)); break;
    case 'crazy': {
      c.timer -= dt;
      if (moveTo(c, c.tx, c.ty, 210, dt)){ const p = randFloor(); c.tx = p.x; c.ty = p.y; }
      c.happy = Math.min(100, c.happy + dt * 3);
      if (Math.random() < dt * 1.2){ c.bubble = pick(['Wiii !', 'Brrrp !', 'Mrraaa !']); c.bubbleT = .8; playTrill(c); }
      if (c.timer <= 0) setState(c, 'idle', rand(2, 3));
      break;
    }
    case 'sleep':
      c.timer -= dt;
      if (c.timer <= 0 || c.energy >= 100){ setState(c, 'idle', rand(2, 3.5)); c.anim = {type: 'stretch', t: 0, dur: 1.6}; say(c, 'Miaaa…'); }
      break;
    case 'tosnuggle': {
      const b = c.buddy;
      if (!b || b.state !== 'sleep'){ setState(c, 'idle', 1); break; }
      const s = scaleAt(b.y);
      if (moveTo(c, clamp(b.x - b.dir * 42 * s, 30, W - 30), b.y + 2, 55, dt)){ goSleep(c, Math.max(6, b.timer + rand(1, 4))); c.sleepPose = 'curl'; c.dir = b.dir; addRel(c, b, 3); }
      break;
    }
    case 'groomFriend': {
      const b = c.buddy;
      if (!b || !(b.state === 'idle' || b.state === 'sleep')){ setState(c, 'idle', 1); break; }
      const s = scaleAt(b.y), side = c.x < b.x ? -1 : 1;
      if (moveTo(c, clamp(b.x + side * 34 * s, 30, W - 30), b.y + 1, 60, dt)){
        c.dir = -side; if (b.state === 'idle'){ b.dir = side; b.timer = Math.max(b.timer, 1); b.anim = null; }
        c.timer -= dt; b.purrT = .6; b.happy = Math.min(100, b.happy + dt * 3); addRel(c, b, dt * 1.5);
        c.lickT = (c.lickT ?? 0) - dt; if (c.lickT <= 0){ c.lickT = rand(.5, .9); groomSound(); }
        if (c.timer <= 0){ setState(c, 'idle', rand(2, 4)); if (Math.random() < .6) say(b, 'Prrrr'); }
      }
      break;
    }
    case 'rub': {
      c.timer -= dt;
      if (!pointer.on || c.timer <= 0){ setState(c, 'idle', rand(2, 4)); break; }
      const s = scaleAt(c.y), side = c.x < pointer.x ? -1 : 1;
      if (moveTo(c, clamp(pointer.x + side * 16 * s, 30, W - 30), clamp(pointer.y + 30 * s, minY(), H - 16), 75, dt)){
        c.dir = -side; c.purrT = .5; c.happy = Math.min(100, c.happy + dt * 3);
        c.heartT = (c.heartT ?? 0) - dt; if (c.heartT <= 0){ c.heartT = .7; hearts(c, 1); }
      }
      break;
    }
    case 'trick':
      c.timer -= dt; if (c.timer <= 0) setState(c, 'idle', rand(2, 3));
      break;
    case 'chase': {
      if (!laser.on){ setState(c, 'idle', rand(1, 2.5)); break; }
      const ty = clamp(laser.y, minY(), H - 14);
      const reached = moveTo(c, laser.x - c.dir * 26 * scaleAt(c.y), ty, 175, dt);
      if (reached || Math.hypot(laser.x - c.x, ty - c.y) < 34 * scaleAt(c.y)) c.happy = Math.min(100, c.happy + dt * 9);
      if (c.energy < 8){ goSleep(c, rand(6, 10)); say(c, 'Pfiou…'); }
      break;
    }
    case 'eat': {
      const b = c.target;
      if (!b || b.food <= 0){ setState(c, 'idle', rand(2, 4)); break; }
      const s = scaleAt(c.y), side = c.x < b.x ? -1 : 1, off = b.type === 'bowl2' ? 44 : 36;
      if (moveTo(c, b.x + side * off * s, b.y + 2, 70, dt)){
        c.dir = -side;
        c.crunchT = (c.crunchT ?? 0) - dt; if (c.crunchT <= 0){ crunch(c); c.crunchT = rand(.3, .55); }
        const fd = foodById(b.foodType), fav = fd.id === c.favFood;
        c.hunger = Math.max(0, c.hunger - dt * 22); b.food = Math.max(0, b.food - dt * 5);
        c.happy = Math.min(100, c.happy + dt * (.6 + fd.happy / 4 + (fav ? 2.5 : 0))); c.health = Math.min(100, c.health + dt * fd.health / 3);
        if (c.hunger < 4 || b.food <= 0){
          c.mem.meals++;
          if (fav){ say(c, 'Mon plat préféré !'); discover(c, 'food'); } else say(c, fd.id === 'patee' ? 'Délicieux !' : 'Miam !');
          setState(c, 'idle', rand(3, 6));
        }
      }
      break;
    }
    case 'todrink': {
      const o = c.target; if (!o){ setState(c, 'idle', 1); break; }
      const s = scaleAt(o.y), [dx, dy] = WATER_SPOTS[o.type][c.spotIdx];
      if (moveTo(c, o.x + dx * s, o.y + 3 + dy * s, 60, dt)){ c.state = 'drink'; c.moving = false; c.dir = dx > 0 ? -1 : 1; }
      break;
    }
    case 'drink': {
      const o = c.target; if (!o){ setState(c, 'idle', 1); break; }
      c.thirst = Math.max(0, c.thirst - dt * 18); c.happy = Math.min(100, c.happy + dt * (ITEMS[o.type].joy || 0) / 4);
      c.lapT = (c.lapT ?? 0) - dt; if (c.lapT <= 0){ lap(c); c.lapT = rand(.2, .3); }
      if (c.thirst < 4){ setState(c, 'idle', rand(2, 4)); if (Math.random() < .5) say(c, pick(['Slurp !', 'Glou glou'])); }
      break;
    }
    case 'tolitter': {
      const L = c.target; if (!L){ setState(c, 'idle', 1); break; }
      if (moveTo(c, L.x, L.y - 1, 60, dt)){ c.state = 'litter'; c.timer = 3.5; c.moving = false; c.dir = Math.random() < .5 ? -1 : 1; }
      break;
    }
    case 'litter': {
      const L = c.target; if (!L){ setState(c, 'idle', 1); break; }
      c.timer -= dt;
      if (c.timer <= 0){
        const d = ITEMS[L.type], dirty = L.dirt / d.uses >= .5;
        L.dirt = Math.min(d.uses, L.dirt + 1); L.clumps.push([rand(-.6, .6), rand(-.5, .5)]);
        c.bladder = 0; fart(c); setTimeout(litterScratch, 500);
        const ps = scaleAt(c.y);
        for (let i = 0; i < 4; i++) fx.push({x: c.x - c.dir * rand(14, 24) * ps, y: c.y - rand(8, 16) * ps, vx: -c.dir * rand(10, 30), vy: rand(-30, -15), life: .9, size: rand(8, 13) * ps, ch: '●', col: 'rgba(190,215,140,.7)'});
        c.y = L.y + 16 * scaleAt(L.y); setState(c, 'idle', rand(1.5, 3));
        if (dirty){ say(c, 'Bof…'); c.happy = Math.max(0, c.happy - 5); } else c.happy = Math.min(100, c.happy + 3);
        if (L.dirt >= d.uses) showHint('Une litière est pleine ! Prends la pelle pour la nettoyer.');
      }
      break;
    }
    case 'tobox': {
      const o = c.target; if (!o){ setState(c, 'idle', 1); break; }
      if (moveTo(c, o.x, o.y + 1, 55, dt)){ c.state = 'box'; c.timer = rand(6, 12); c.moving = false; c.dir = Math.random() < .5 ? -1 : 1; boxSound(true); o.shakeUntil = performance.now() + 450; say(c, 'Mrrp'); }
      break;
    }
    case 'box': {
      const o = c.target; if (!o){ setState(c, 'idle', 1); break; }
      c.x = o.x; c.y = o.y + 1; c.timer -= dt; c.energy = Math.min(100, c.energy + dt * 2);
      if (c.timer <= 0){ c.y = o.y + 16 * scaleAt(o.y); o.shakeUntil = performance.now() + 450; boxSound(false); setState(c, 'idle', rand(2, 4)); }
      break;
    }
    case 'tobed': {
      const o = c.target; if (!o){ setState(c, 'idle', 1); break; }
      if (moveTo(c, o.x, o.y + 1, 55, dt)){ c.state = 'bed'; c.timer = rand(10, 18); c.moving = false; c.dir = Math.random() < .5 ? -1 : 1; cushionSound(); }
      break;
    }
    case 'bed': {
      const o = c.target; if (!o){ setState(c, 'idle', 1); break; }
      c.x = o.x; c.y = o.y + 1; c.timer -= dt;
      c.happy = Math.min(100, c.happy + dt * ITEMS[o.type].rest * .5); c.health = Math.min(100, c.health + dt * .1 * ITEMS[o.type].rest);
      if (c.timer <= 0){ c.y = o.y + 18 * scaleAt(o.y); setState(c, 'idle', rand(2, 3.5)); c.anim = {type: 'stretch', t: 0, dur: 1.6}; say(c, 'Miaaa…'); }
      break;
    }
    case 'toscratch': {
      const o = c.target; if (!o){ setState(c, 'idle', 1); break; }
      const s = scaleAt(o.y), side = c.x < o.x ? -1 : 1;
      if (moveTo(c, o.x + side * 30 * s, o.y + 2, 60, dt)){ c.state = 'scratch'; c.timer = 3; c.moving = false; c.dir = -side; }
      break;
    }
    case 'scratch': {
      c.timer -= dt; c.happy = Math.min(100, c.happy + dt * 3);
      c.scrT = (c.scrT ?? 0) - dt; if (c.scrT <= 0){ clawScratch(); c.scrT = .45; }
      if (c.timer <= 0) setState(c, 'idle', rand(2, 4));
      break;
    }
    case 'totree': {
      if (!c.target){ setState(c, 'idle', 1); break; }
      const b = spotBase(c);
      if (moveTo(c, b.x, b.y, 60, dt)){ c.perchBaseY = c.target === sill ? minY() : c.target.y; jump(c, spotPos(c), true); }
      break;
    }
    case 'jump': {
      c.jT += dt / (c.jUp ? .6 : .5);
      const k = Math.min(1, c.jT), s = scaleAt(c.perchBaseY);
      c.x = c.jFrom.x + (c.jTo.x - c.jFrom.x) * k;
      c.y = c.jFrom.y + (c.jTo.y - c.jFrom.y) * k - Math.sin(Math.PI * k) * 40 * s;
      c.phase += dt * 20;
      if (k >= 1){
        c.moving = false; landSound(c.jUp);
        if (c.jUp && c.target){
          c.state = 'perch'; c.timer = rand(8, 16); c.dir = Math.random() < .5 ? -1 : 1;
          const atWin = c.target === sill;
          c.perchSleep = Math.random() < (atWin ? .2 + daylight * .4 : .3 + (1 - daylight) * .4);
          if (!c.perchSleep) say(c, atWin ? (daylight > .5 ? pick(['Un oiseau !', 'Ek-ek-ek !']) : pick(['La lune…', 'Mrr… ?'])) : pick(['Mrrp', 'Miaou']));
        } else { c.onTree = false; c.state = 'idle'; c.timer = rand(1.5, 3); }
      }
      break;
    }
    case 'perch': {
      if (!c.target){ jumpDown(c); break; }
      const p = spotPos(c); c.x = p.x; c.y = p.y;
      c.timer -= dt; if (c.perchSleep) c.energy = Math.min(100, c.energy + dt * 6);
      if (c.timer <= 0) jumpDown(c);
      break;
    }
    case 'toy': {
      const ty = c.target; if (!ty){ setState(c, 'idle', 1); break; }
      c.timer += dt; c.batCd -= dt;
      const s = scaleAt(c.y), side = ty.x > c.x ? 1 : -1;
      moveTo(c, ty.x - side * 20 * s, ty.y, 130, dt);
      if (Math.hypot(ty.x - c.x, ty.y - c.y) < 30 * s && c.batCd <= 0){
        c.dir = side; c.batCd = .8; c.bats++;
        ty.vx = side * rand(90, 200); ty.vy = rand(-70, 70); pawTap(); toySound(ty.type);
        c.happy = Math.min(100, c.happy + 5); c.energy -= 2; c.mem.toys++;
        if (ty.type === c.favToy){ c.happy = Math.min(100, c.happy + 4); discover(c, 'toy'); }
        if (Math.random() < .4){ c.bubble = pick(['Brrrp !', 'Mrrp !', 'Hop !']); c.bubbleT = 1; playTrill(c); }
      }
      if (c.bats >= 2 + Math.floor(c.patience / 2) || c.timer > 10 || c.energy < 10) setState(c, 'idle', rand(2, 4));
      break;
    }
  }
}
function freeOf(kind){ const l = ofKind(kind).filter(o => !o.occupant); return l.length ? pick(l) : null; }
function freeTreeSpot(){
  const opts = [];
  for (const o of ofKind('tree')) o.users.forEach((u, i) => { if (!u) opts.push({o, i}); });
  return opts.length ? pick(opts) : null;
}
function tryLitter(c){
  const all = ofKind('litter'), ok = all.filter(l => !l.user && l.dirt < ITEMS[l.type].uses);
  if (ok.length){ const L = nearest(c, ok); setState(c, 'tolitter'); c.target = L; L.user = c; return true; }
  if (c.complainT <= 0 && (!all.length || all.every(l => l.dirt >= ITEMS[l.type].uses))){
    c.complainT = 7; c.happy = Math.max(0, c.happy - 6);
    say(c, all.length ? 'Beurk ! C’est sale !' : 'Pfff ! Pas de litière ?', 2.2);
    nag('litter', all.length ? 'Les litières sont pleines ! Prends la pelle pour les nettoyer.' : 'Il n’y a pas de litière : place-en une avec Aménager, vite !');
  }
  return false;
}
function tryEat(c){
  const ok = ofKind('bowl').filter(b => b.food > 0);
  if (!ok.length) return false;
  const b = nearest(c, ok); setState(c, 'eat'); c.target = b; return true;
}
function tryDrink(c){
  const opts = [];
  for (const o of ofKind('water')) o.users.forEach((u, i) => { if (!u) opts.push({o, i}); });
  if (opts.length){
    const sp = opts.sort((a, b) => dist(a.o, c) - dist(b.o, c))[0];
    setState(c, 'todrink'); c.target = sp.o; c.spotIdx = sp.i; sp.o.users[sp.i] = c;
    c.bubble = pick(['Mlem mlem…', 'Soif…', 'De l’eau ?']); c.bubbleT = 1.8; thirstySound(c);
    return true;
  }
  if (c.thirst > 80){
    c.thirstT = (c.thirstT ?? 0) - .1;
    if (c.thirstT <= 0){
      c.thirstT = rand(40, 70); c.bubble = pick(['Soif…', 'De l’eau ?']); c.bubbleT = 1.8; thirstySound(c);
      if (!ofKind('water').length) nag('water', `${c.name} a soif, mais il n’y a pas d’eau : place un bol d’eau ou une fontaine avec Aménager.`);
    }
  }
  return false;
}
function tryToy(c, dt){
  const toys = ofKind('toy'); if (!toys.length) return false;
  const moving = toys.find(t => Math.hypot(t.vx, t.vy) > 40 && !ITEMS[t.type].auto);
  const robot = toys.find(t => ITEMS[t.type].auto);
  const k = c.kitten ? 1.6 : 1;
  if (robot && Math.random() < dt * .02 * (1 - c.lazy) * k){ setState(c, 'toy'); c.target = robot; c.bats = 0; return true; }
  if ((moving && Math.random() < dt * (1.2 - c.lazy)) || Math.random() < dt * .03 * (1 - c.lazy) * k){
    setState(c, 'toy'); c.target = moving || (Math.random() < .6 && toys.find(t => t.type === c.favToy)) || pick(toys); c.bats = 0; return true;
  }
  return false;
}
function tryFight(c, dt){
  if (c.onTree || c.fightCd > 0 || G.cats.length < 2) return;
  const s = scaleAt(c.y);
  const near = G.cats.filter(o => o !== c && isFree(o.state) && !o.onTree && o.fightCd <= 0 && Math.hypot(o.x - c.x, o.y - c.y) < 160 * s && relOf(c, o) < 35);
  if (!near.length) return;
  const rival = near.sort((a, b) => relOf(c, a) - relOf(c, b))[0], r = relOf(c, rival);
  const mult = r <= -30 ? 3 : r >= 15 ? .4 : 1;
  if (Math.random() < dt * (c.patience <= 4 ? .02 : .008) * mult) startFight(c, rival);
}
function goSleep(c, t){
  setState(c, 'sleep', t);
  c.sleepPose = Math.random() < (c.happy > 60 ? .35 : .1) ? 'belly' : 'curl';
}

let nagAt = {};
function nag(key, text){ const t = performance.now(); if ((nagAt[key] || -1e9) + 20000 < t){ nagAt[key] = t; showHint(text, 6000); } }

/* ---------- caresses, soins ---------- */
function pet(c, px){
  G.stats.pets++; c.mem.pets++;
  if (c.state === 'sleep'){ setState(c, 'idle', 2.5); say(c, 'Mrr… ?'); c.happy += 4; return; }
  if ((c.state === 'perch' && c.perchSleep) || c.state === 'bed'){ if (c.state === 'perch') c.perchSleep = false; else c.timer = Math.min(c.timer, 1); say(c, 'Mrr… ?'); c.happy = Math.min(100, c.happy + 4); return; }
  const t = performance.now();
  c.pets = c.pets.filter(x => t - x < 3500); c.pets.push(t);
  if (c.pets.length > c.patience){
    c.pets = []; c.happy = Math.max(0, c.happy - 12); say(c, 'Pfff !', 2);
    if (c.onTree){ jumpDown(c); return; }
    const far = randFloor(); far.x = c.x < W / 2 ? rand(W * .65, W - 40) : rand(40, W * .35);
    c.tx = far.x; c.ty = far.y; setState(c, 'flee', 4); return;
  }
  c.happy = Math.min(100, c.happy + 9);
  c.dir = px > c.x ? 1 : -1;
  purrVibration();
  say(c, pick(['Prrrr', 'Prrrrr…', 'Mrrrou']));
  if (c.state === 'perch') c.timer = Math.max(c.timer, 3);
  else if (!['eat', 'drink', 'litter', 'jump', 'fight'].includes(c.state)) setState(c, 'idle', rand(2.5, 4));
  hearts(c);
}
function giveTreat(c){
  if ((G.care.treat || 0) <= 0){ errorSound(); showHint('Plus de friandises : passe à la boutique (onglet Soins).'); return; }
  G.care.treat--; c.happy = Math.min(100, c.happy + 15); c.hunger = Math.max(0, c.hunger - 8);
  if (isAsleep(c) && c.state !== 'bed'){ if (c.state === 'perch') c.perchSleep = false; else setState(c, 'idle', 2); }
  crunch(c); setTimeout(() => cheer(c), 250);
  updateToolbar();
}
function brushCat(c){
  if (!G.brush){ errorSound(); showHint('Il te faut une brosse : elle est dans la boutique, onglet Soins.'); return; }
  const t = performance.now();
  if (t - (c.brushAt || 0) < 900) return;
  c.brushAt = t;
  c.pets = c.pets.filter(x => t - x < 3500); c.pets.push(t);
  if (c.pets.length > c.patience + 2){ c.pets = []; say(c, 'Pfff !', 2); c.happy = Math.max(0, c.happy - 8); const p = randFloor(); c.tx = p.x; c.ty = p.y; if (!c.onTree && !HOLD.has(c.state)) setState(c, 'flee', 3); return; }
  G.stats.brushes++; c.mem.brushes++; c.happy = Math.min(100, c.happy + 7); c.health = Math.min(100, c.health + 2);
  brushSound(); const s = catScale(c); sparkle(c.x, c.y - 30 * s, s);
  if (Math.random() < .5) say(c, pick(['Prrrr', 'Mrrrou']));
}
function applyCare(c){
  const id = $('careSel').value, cd = CARES.find(x => x.id === id);
  if (!cd || (G.care[id] || 0) <= 0){ errorSound(); showHint(`Plus de ${cd ? cd.name.toLowerCase() : 'soins'} : passe à la boutique (onglet Soins).`); return; }
  if (id === 'catnip'){
    if (c.onTree || ['box', 'bed', 'litter', 'jump', 'fight'].includes(c.state)){ showHint(`${c.name} est occupé : réessaie quand il est par terre.`); return; }
    G.care.catnip--; c.happy = Math.min(100, c.happy + 30); const p = randFloor(); c.tx = p.x; c.ty = p.y; setState(c, 'crazy', 8); say(c, 'Mrraaa !');
  } else if (id === 'vitamins'){
    G.care.vitamins--; c.health = Math.min(100, c.health + 30); const s = catScale(c); sparkle(c.x, c.y - 30 * s, s);
    if (c.sick && c.health >= 60){ c.sick = false; G.stats.heals++; cheer(c); } else say(c, 'Miaou ?');
  } else if (id === 'kit'){
    G.care.kit--; const was = c.sick; c.health = 100; c.sick = false; const s = catScale(c); sparkle(c.x, c.y - 30 * s, s);
    if (was){ G.stats.heals++; showHint(`${c.name} est guéri !`); }
    cheer(c);
  }
  updateToolbar();
}

/* ---------- jouets, oiseaux, bagarres ---------- */
function updateToys(dt){
  const f = Math.pow(.3, dt);
  for (const t of ofKind('toy')){
    if (t === dragging) continue;
    if (ITEMS[t.type].auto){
      t.autoT -= dt;
      if (t.autoT <= 0){ t.autoT = rand(1.5, 3.2); const a = Math.random() * Math.PI * 2, v = rand(70, 130); t.vx = Math.cos(a) * v; t.vy = Math.sin(a) * v * .6; if (Math.random() < .3) toySound('robot'); }
    }
    t.x += t.vx * dt; t.y += t.vy * dt; t.vx *= f; t.vy *= f;
    if (t.x < 14){ t.x = 14; t.vx = Math.abs(t.vx); }
    if (t.x > W - 14){ t.x = W - 14; t.vx = -Math.abs(t.vx); }
    if (t.y < minY() - 4){ t.y = minY() - 4; t.vy = Math.abs(t.vy); }
    if (t.y > H - 8){ t.y = H - 8; t.vy = -Math.abs(t.vy); }
    if (Math.abs(t.vx) > 5) t.face = t.vx > 0 ? 1 : -1;
    t.rot += t.vx * dt / 6;
    toUV(t);
  }
}
let birdT = 4;
function updateBirds(dt){
  birdT -= dt;
  if (birdT <= 0){
    birdT = G.room === 'veranda' ? rand(3, 7) : rand(5, 12);
    if (daylight > .5 && birds.length < 4){
      const dir = Math.random() < .5 ? 1 : -1, sp = rand(.18, .3) * (G.room === 'veranda' ? .5 : 1), v = rand(.12, .45);
      const n = Math.random() < .3 ? 2 + Math.floor(Math.random() * 2) : 1;
      for (let i = 0; i < n; i++) birds.push({u: dir > 0 ? -.15 - i * .14 : 1.15 + i * .14, v: v + rand(-.08, .08), dir, sp, ph: rand(0, 6), col: pick(['#3a3340', '#5b4a3a', '#2f4b6b'])});
      birdChirp(); birdAlert();
    }
  }
  for (let i = birds.length - 1; i >= 0; i--){ const b = birds[i]; b.u += b.dir * b.sp * dt; b.ph += dt * 14; if (b.u < -.6 || b.u > 1.6) birds.splice(i, 1); }
}
function birdAlert(){
  let seen = false;
  for (const c of G.cats){
    if (c.state === 'perch' && c.target === sill){
      if (c.perchSleep && Math.random() < .5) c.perchSleep = false;
      if (!c.perchSleep){ seen = true; c.mem.birds++; c.timer = Math.max(c.timer, 6); c.twitch = 3; setTimeout(() => say(c, pick(['Ek-ek-ek !', 'Un oiseau !', 'Mek-mek !'])), rand(200, 900)); }
    } else if (isFree(c.state) && c.lazy < .7 && Math.random() < .35){
      const i = sill.users.findIndex(u => !u);
      if (i >= 0){ setState(c, 'totree'); c.target = sill; c.spotIdx = i; sill.users[i] = c; say(c, 'Un oiseau ?!', 1.4); }
    }
  }
  if (seen) G.stats.birds++;
}
function startFight(a, b){
  const f = {a, b, x: (a.x + b.x) / 2, y: clamp((a.y + b.y) / 2, minY(), H - 16), aLeft: a.x < b.x,
    heat: rand(.15, .35), drift: rand(-.03, .07), phase: 'stare', brawlT: 0, hissT: rand(.6, 1.4), warned: false, alarmed: false};
  for (const c of [a, b]){ setState(c, 'fight'); c.fight = f; c.mem.fights++; }
  addRel(a, b, -8);
  fights.push(f);
  say(a, pick(['Grrr…', 'Grrr ?!']), 1.6);
}
function endFight(f, mode){
  const i = fights.indexOf(f); if (i >= 0) fights.splice(i, 1);
  const s = scaleAt(f.y);
  [f.a, f.b].forEach((c, k) => {
    c.fight = null; c.hop = 0; c.fightCd = rand(25, 45);
    const side = (k === 0) === f.aLeft ? -1 : 1;
    c.tx = clamp(f.x + side * rand(110, 190) * s, 30, W - 30); c.ty = clamp(f.y + rand(-30, 30) * s, minY(), H - 16);
    if (mode === 'calm') setState(c, 'wander');
    else { setState(c, 'flee', 4); c.happy = Math.max(0, c.happy - (mode === 'exhausted' ? 15 : 3)); }
  });
  if (mode === 'calm') say(f.a, 'Hmpf.', 1.5);
  else if (mode === 'separated'){
    say(f.a, 'Pfff !', 1.6); say(f.b, 'Pfff !', 1.6); sparkle(f.x, f.y - 30 * s, s);
    G.stats.separations++; addCoins(3, f.x, f.y - 70 * s);
    showHint(`${f.a.name} et ${f.b.name} sont séparés. Ils vont se calmer.`);
  } else { say(f.a, 'Kssss !', 1.6); showHint(`${f.a.name} et ${f.b.name} se sont battus… ils sont tout vexés.`); }
}
function updateFights(dt){
  const t = now();
  for (const f of [...fights]){
    const s = scaleAt(f.y);
    const ra = moveTo(f.a, f.x + (f.aLeft ? -1 : 1) * 24 * s, f.y, 90, dt), rb = moveTo(f.b, f.x + (f.aLeft ? 1 : -1) * 24 * s, f.y, 90, dt);
    if (!(ra && rb)) continue;
    f.a.dir = f.aLeft ? 1 : -1; f.b.dir = -f.a.dir; f.a.moving = f.b.moving = false;
    const calm = ((f.a.patience + f.b.patience) / 2 - 5) * .006;
    f.heat = clamp(f.heat + dt * (f.drift + rand(-.08, .08) - calm), 0, 1);
    const was = f.phase;
    f.phase = f.heat < .5 ? 'stare' : f.heat < .8 ? 'scuffle' : 'brawl';
    if (was === 'stare' && f.phase !== 'stare') G.stats.fightsToday++;
    if (was !== 'brawl' && f.phase === 'brawl') addRel(f.a, f.b, -10);
    f.hissT -= dt;
    if (f.phase === 'stare'){
      f.a.hop = f.b.hop = 0;
      if (f.hissT <= 0){ f.hissT = rand(1.2, 2.2); say(pick([f.a, f.b]), pick(['Grrr…', 'Ssss !', 'Mrrraow…'])); }
      if (f.heat < .3 && Math.random() < dt * .25){ endFight(f, 'calm'); continue; }
    } else if (f.phase === 'scuffle'){
      f.a.hop = Math.max(0, Math.sin(t * 11)) * 6 * s; f.b.hop = Math.max(0, Math.sin(t * 11 + 1.6)) * 6 * s;
      if (f.hissT <= 0){ f.hissT = rand(.5, 1); swat(); say(pick([f.a, f.b]), pick(['Kss !', 'Ssss !', 'Mrrraow !']), 1); }
      if (!f.warned){ f.warned = true; showHint(`${f.a.name} et ${f.b.name} se chamaillent… Clique dessus pour les séparer !`); }
      f.a.happy = Math.max(0, f.a.happy - dt); f.b.happy = Math.max(0, f.b.happy - dt);
    } else {
      f.brawlT += dt;
      if (f.hissT <= 0){ f.hissT = rand(.25, .5); if (Math.random() < .55) swat(); else yowl(pick([f.a, f.b])); }
      if (!f.alarmed){ f.alarmed = true; showHint(`Bagarre entre ${f.a.name} et ${f.b.name} ! Clique sur le nuage pour les séparer.`, 6000); }
      for (const c of [f.a, f.b]){ c.happy = Math.max(0, c.happy - dt * 4); c.health = Math.max(0, c.health - dt * 1.5); }
      if (Math.random() < dt * 6) fx.push({x: f.x + rand(-30, 30) * s, y: f.y - rand(10, 50) * s, vx: rand(-40, 40), vy: rand(-40, -10), life: .8, size: rand(9, 13) * s, ch: '✶', col: '#e8e0d0'});
      if (f.brawlT > 12){ endFight(f, 'exhausted'); continue; }
    }
  }
}

/* ---------- temps, revenus, succès ---------- */
let incomeT = 15, achT = 1, rosterT = 0, saveT = 5, snoreT = 2, essentialsT = 20;
function updateDay(dt){
  const before = dayPhase;
  dayPhase += dt / DAY_LEN;
  if (skipTo !== null){ dayPhase += dt * .2; if (dayPhase >= skipTo){ dayPhase = skipTo; skipTo = null; } }
  G.clock += dayPhase - before;
  if (before < .25 && dayPhase >= .25) newDay();
  if (dayPhase >= 1){ dayPhase -= 1; if (skipTo !== null) skipTo -= 1; if (dayPhase >= .25) newDay(); }
  daylight = smooth(-.15, .3, sunHeight());
}
let skipTo = null;
function newDay(){
  G.day++;
  if (!G.cats.length) return;
  const perfect = G.stats.accidentsToday === 0 && G.stats.fightsToday === 0;
  const bonus = 10;
  if (perfect) G.stats.perfectDays++;
  G.stats.accidentsToday = 0; G.stats.fightsToday = 0;
  addCoins(bonus, W / 2, floorTop);
  toast(`Jour ${G.day}`, `Bonus de la journée : +${bonus} ${COIN}${perfect ? ' (journée parfaite !)' : ''}`);
}
function payIncome(){
  const room = roomById(G.room); let total = 0;
  for (const c of G.cats){
    if (c.sick) continue;
    const g = Math.round((c.happy > 85 ? 2 : c.happy > 60 ? 1 : 0) * room.mult);
    if (g > 0){ total += g; addCoins(g, c.x, c.y - 72 * catScale(c), true); }
  }
  if (total) coinSound();
}
function checkAchievements(){
  for (const a of ACH){
    if (G.ach[a.id]) continue;
    const done = a.test ? a.test(G.stats, G) : (p => p[0] >= p[1])(a.prog(G.stats, G));
    if (!done) continue;
    G.ach[a.id] = true;
    const coat = COATS.find(c => c.challenge === a.id);
    if (coat && !G.coats.includes(coat.id)) G.coats.push(coat.id);
    addCoins(a.reward, null, null, true);
    achievementSound();
    toast(`Succès : ${a.name}`, `+${a.reward} ${COIN}${coat ? ` · pelage ${coat.label} débloqué !` : ''}`, true);
  }
  updateHUD();
}

/* ================= BOUCLE ================= */
let last = performance.now();
function step(dt){
  updateDay(dt);
  updateBirds(dt);
  updateToys(dt);
  comfort = G.placed.reduce((a, o) => a + (ITEMS[o.type].comfort || 0), 0);
  for (const c of G.cats) update(c, dt);
  updateFights(dt);
  for (const L of ofKind('litter')) if (ITEMS[L.type].auto && L.dirt > 0){ L.autoT -= dt; if (L.autoT <= 0){ L.autoT = 40; L.dirt--; L.clumps.pop(); } }
  incomeT -= dt; if (incomeT <= 0){ incomeT = 15; payIncome(); }
  achT -= dt; if (achT <= 0){ achT = 1; checkAchievements(); updateRelations(); }
  rosterT -= dt; if (rosterT <= 0){ rosterT = .5; renderRoster(); }
  saveT -= dt; if (saveT <= 0){ saveT = 5; saveGame(); }
  snoreT -= dt; if (snoreT <= 0){ const sl = G.cats.filter(isAsleep); if (sl.length){ snore(pick(sl)); snoreT = rand(2.6, 4); } else snoreT = 1; }
  essentialsT -= dt;
  if (essentialsT <= 0 && !buildMode){
    essentialsT = 30;
    const miss = [['bowl', 'une gamelle'], ['water', 'de l’eau'], ['litter', 'une litière']].filter(([k]) => !ofKind(k).length).map(x => x[1]);
    if (miss.length && G.cats.length) showHint(`Il manque ${miss.join(', ')} dans la pièce. Achète-les à la boutique, puis place-les avec Aménager.`, 6000);
  }
  for (let i = fx.length - 1; i >= 0; i--){ const p = fx[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) fx.splice(i, 1); }
}
function hiddenCat(c){
  if (c.state === 'box' || c.state === 'bed') return true;
  if (c.fight && c.fight.phase === 'brawl') return true;
  if (c.state === 'litter' && c.target && ITEMS[c.target.type].covered) return true;
  return false;
}
function render(t){
  ctx = mainCtx;
  drawRoom(t);
  const lit = daylight < .5;
  for (const o of G.placed) if (kindOf(o) === 'rug'){ drawItemAt(o, o.x, o.y, scaleAt(o.y), lit); }
  puddles.forEach(drawPuddle);
  const ents = [];
  for (const o of G.placed) if (kindOf(o) !== 'rug') ents.push({y: o.y, d: () => drawItemAt(o, o.x, o.y, scaleAt(o.y), lit)});
  for (const c of G.cats) if (!hiddenCat(c)) ents.push({y: c.onTree ? (c.target === sill ? 0 : (c.target ? c.target.y + .5 : c.perchBaseY + .5)) : c.y, d: () => drawCat(c)});
  for (const c of G.cats) if (c.state === 'box' || c.state === 'bed') ents.push({y: c.y + .2, d: () => drawLabels(c)});
  for (const f of fights) ents.push({y: f.y + 1, d: () => drawFight(f)});
  ents.sort((a, b) => a.y - b.y).forEach(e => e.d());
  if (buildMode) drawBuildOverlay();
  drawNight(ofKind('lamp'));
  if (laser.on){
    const y = clamp(laser.y, floorTop, H);
    const g = ctx.createRadialGradient(laser.x, y, 0, laser.x, y, 16);
    g.addColorStop(0, 'rgba(255,60,60,.9)'); g.addColorStop(1, 'rgba(255,60,60,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(laser.x, y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff0f0'; ctx.beginPath(); ctx.arc(laser.x, y, 2.6 + Math.sin(t * 20) * .5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.textAlign = 'center';
  for (const p of fx){
    ctx.globalAlpha = Math.min(1, p.life); ctx.fillStyle = p.col || '#ff7aa8';
    if (p.text){ ctx.font = `800 ${p.size}px "Baloo 2", system-ui`; ctx.strokeStyle = 'rgba(40,25,10,.6)'; ctx.lineWidth = 3; ctx.strokeText(p.text, p.x, p.y); ctx.fillText(p.text, p.x, p.y); }
    else { ctx.font = `${p.size}px system-ui`; ctx.fillText(p.ch || '♥', p.x, p.y); }
  }
  ctx.globalAlpha = 1;
}
function drawBuildOverlay(){
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(0, minY() - 8, W, H - minY() + 8);
  if (selected){
    const s = scaleAt(selected.y), d = ITEMS[selected.type];
    ctx.setLineDash([6, 5]); ctx.strokeStyle = '#ffd75a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(selected.x - d.hit[0] * s - 6, selected.y - d.hit[1] * s - 6, d.hit[0] * 2 * s + 12, d.hit[1] * s + 14, 8); ctx.stroke();
    ctx.setLineDash([]);
  }
  if (buildPick && ghost.on){
    const ok = validSpot(ghost.x, ghost.y);
    ctx.globalAlpha = .55; drawItemAt(previewInst(buildPick), ghost.x, clamp(ghost.y, minY() - 8, H - 6), scaleAt(ghost.y), false); ctx.globalAlpha = 1;
    if (!ok){ ctx.strokeStyle = 'rgba(255,90,90,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ghost.x, ghost.y, 14, 0, Math.PI * 2); ctx.moveTo(ghost.x - 10, ghost.y - 10); ctx.lineTo(ghost.x + 10, ghost.y + 10); ctx.stroke(); }
  }
}
function frame(ts){
  const dt = Math.min(.05, (ts - last) / 1000); last = ts;
  if (screen === 'title') drawTitle(ts / 1000);
  else if (screen === 'game'){ step(dt); render(ts / 1000); }
  if (creatorOpen) renderCatPreview($('crPreview'), makeCoat(cr.coatId, cr.stripes, cr.stripeColor), ts / 1000);
  if (sheetCat) renderCatPortrait($('shPreview'), sheetCat, ts / 1000);
  requestAnimationFrame(frame);
}

/* ================= TAILLE ================= */
function resize(){
  const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
  if (!r.width) return;
  W = r.width; H = r.height;
  cv.width = Math.round(W * d); cv.height = Math.round(H * d);
  mainCtx.setTransform(d, 0, 0, d, 0, 0);
  floorTop = H * .5; sizeK = clamp(W / 820, .62, 1.1);
  if (!G) return;
  for (const o of G.placed) toXY(o);
  for (const c of G.cats){ c.x = clamp(c.x, 30, W - 30); if (!c.onTree) c.y = clamp(c.y, minY(), H - 16); }
  rebuildSill();
}
function rebuildSill(){
  const n = winGeom().sill.length;
  for (const c of G.cats) if (c.target === sill){ c.onTree = false; c.y = minY() + 10; setState(c, 'idle', 1); }
  sill = {kind: 'sill', users: Array(n).fill(null)};
}
