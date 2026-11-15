/* Le Salon des Chats : tous les sons, synthétisés en direct (aucun fichier audio). */

let actx = null, soundOn = true;
function audio(){
  if (!soundOn) return null;
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
  } catch (e) { return null; }
  return actx;
}
const ready = () => soundOn && actx && actx.state === 'running';

function noiseBurst(a, t, d, type, freq, q, vol){
  const n = Math.max(1, Math.floor(a.sampleRate * d)), buf = a.createBuffer(1, n, a.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = buf; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + d * .15); g.gain.exponentialRampToValueAtTime(.001, t + d);
  s.connect(f).connect(g).connect(a.destination); s.start(t);
  return f;
}
function tone(a, t, type, f0, f1, d, vol, glide = 'exp'){
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) glide === 'exp' ? o.frequency.exponentialRampToValueAtTime(f1, t + d) : o.frequency.linearRampToValueAtTime(f1, t + d);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(.02, d * .2)); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .02);
}

/* ---------- voix des chats ---------- */
function voiceNote(a, v, t, d, p){
  const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
  o.type = v.wave; f.type = 'bandpass'; f.Q.value = v.id === 'squeak' ? 6 : 2.5;
  const F = o.frequency;
  switch (v.id){
    case 'plaintive': F.setValueAtTime(380 * p, t); F.linearRampToValueAtTime(700 * p, t + d * .6); F.linearRampToValueAtTime(420 * p, t + d); break;
    case 'squeak':    F.setValueAtTime(600 * p, t); F.exponentialRampToValueAtTime(1000 * p, t + d); break;
    case 'low':       F.setValueAtTime(380 * p, t); F.linearRampToValueAtTime(520 * p, t + d * .25); F.exponentialRampToValueAtTime(280 * p, t + d); break;
    case 'chirp':     F.setValueAtTime(520 * p, t); F.linearRampToValueAtTime(720 * p, t + d * .3); F.linearRampToValueAtTime(600 * p, t + d); break;
    default:          F.setValueAtTime(420 * p, t); F.linearRampToValueAtTime(780 * p, t + d * .35); F.linearRampToValueAtTime(470 * p, t + d);
  }
  f.frequency.setValueAtTime(900 * p, t); f.frequency.linearRampToValueAtTime(2300 * p, t + d * .4); f.frequency.linearRampToValueAtTime(1000 * p, t + d);
  const lfo = a.createOscillator(), lg = a.createGain();
  lfo.frequency.value = v.id === 'chirp' ? 22 : v.vib; lg.gain.value = (v.id === 'chirp' ? 60 : 12) * p;
  lfo.connect(lg).connect(F);
  const peak = v.wave === 'triangle' ? .2 : v.wave === 'square' ? .06 : .12;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .04); g.gain.setValueAtTime(peak, t + d * .6); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(f).connect(g).connect(a.destination);
  o.start(t); lfo.start(t); o.stop(t + d + .05); lfo.stop(t + d + .05);
}
function meow(c, kind = 'meow'){
  if (!ready() || !c) return;
  const v = c.voice, a = actx, t0 = a.currentTime;
  const p = v.pitch * (kind === 'short' ? 1.2 : 1);
  const d = (kind === 'short' ? .22 : kind === 'long' ? .75 : .48) * v.len;
  if (v.id === 'double' && kind !== 'short'){ voiceNote(a, v, t0, d * .5, p); voiceNote(a, v, t0 + d * .5 + .06, d * .55, p * 1.08); }
  else voiceNote(a, v, t0, d, p);
}
function purr(pitch = 1){
  if (!ready()) return; const a = actx, t = a.currentTime, d = 1.5;
  const o = a.createOscillator(), f = a.createBiquadFilter(), am = a.createGain(), lfo = a.createOscillator(), lg = a.createGain(), g = a.createGain();
  o.type = 'sawtooth'; o.frequency.value = 46 * pitch; f.type = 'lowpass'; f.frequency.value = 360;
  am.gain.value = .5; lfo.frequency.value = 24; lg.gain.value = .5;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .2); g.gain.setValueAtTime(.16, t + d - .4); g.gain.linearRampToValueAtTime(0, t + d);
  lfo.connect(lg).connect(am.gain); o.connect(f).connect(am).connect(g).connect(a.destination);
  o.start(t); lfo.start(t); o.stop(t + d); lfo.stop(t + d);
}
function hiss(){ if (!ready()) return; noiseBurst(actx, actx.currentTime, .5, 'highpass', 2500, .7, .1); }
function chatter(c){
  if (!ready()) return;
  const a = actx, p = c ? c.voice.pitch : 1, n = 6 + Math.floor(Math.random() * 4), gap = rand(.065, .085);
  for (let i = 0; i < n; i++){
    const t = a.currentTime + i * gap + rand(-.006, .006);
    const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain(), f0 = (850 + (i % 2) * 120) * p * rand(.95, 1.05);
    o.type = 'square'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * .7, t + .04);
    f.type = 'bandpass'; f.frequency.value = 1600 * p; f.Q.value = 3;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + .004); g.gain.exponentialRampToValueAtTime(.001, t + .045);
    o.connect(f).connect(g).connect(a.destination); o.start(t); o.stop(t + .05);
  }
}
function yowl(c){
  if (!ready()) return;
  const a = actx, t = a.currentTime, p = c ? c.voice.pitch : 1, d = rand(.5, .8);
  const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain(), l = a.createOscillator(), lg = a.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(300 * p, t); o.frequency.linearRampToValueAtTime(520 * p, t + d * .5); o.frequency.linearRampToValueAtTime(260 * p, t + d);
  l.frequency.value = 9; lg.gain.value = 30 * p; l.connect(lg).connect(o.frequency);
  f.type = 'bandpass'; f.frequency.value = 1200 * p; f.Q.value = 1.5;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.1, t + .05); g.gain.setValueAtTime(.1, t + d * .7); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(f).connect(g).connect(a.destination); o.start(t); l.start(t); o.stop(t + d + .05); l.stop(t + d + .05);
}
function sulk(c){
  if (!ready()) return;
  const a = actx, t = a.currentTime, p = c ? c.voice.pitch : 1;
  noiseBurst(a, t, .22, 'lowpass', 900, .7, .09);
  const t2 = t + .18, d = rand(.45, .6);
  const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain(), l = a.createOscillator(), lg = a.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(310 * p, t2); o.frequency.exponentialRampToValueAtTime(170 * p, t2 + d);
  l.frequency.value = 14; lg.gain.value = 10 * p; l.connect(lg).connect(o.frequency);
  f.type = 'lowpass'; f.frequency.setValueAtTime(900 * p, t2); f.frequency.linearRampToValueAtTime(450 * p, t2 + d); f.Q.value = 3;
  g.gain.setValueAtTime(0, t2); g.gain.linearRampToValueAtTime(.1, t2 + .06); g.gain.setValueAtTime(.09, t2 + d * .6); g.gain.exponentialRampToValueAtTime(.001, t2 + d);
  o.connect(f).connect(g).connect(a.destination); o.start(t2); l.start(t2); o.stop(t2 + d + .05); l.stop(t2 + d + .05);
}
function happySound(c){
  if (!ready()) return;
  const a = actx, t = a.currentTime, p = c ? c.voice.pitch : 1;
  [[0, .16, 480, 700, 45], [.2, .22, 620, 980, 15]].forEach(([d0, d, f1, f2, vib]) => {
    const tt = t + d0, o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain(), l = a.createOscillator(), lg = a.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(f1 * p, tt); o.frequency.exponentialRampToValueAtTime(f2 * p, tt + d);
    l.frequency.value = 20; lg.gain.value = vib * p; l.connect(lg).connect(o.frequency);
    f.type = 'bandpass'; f.frequency.value = 1400 * p; f.Q.value = 1;
    g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(.15, tt + .02); g.gain.exponentialRampToValueAtTime(.001, tt + d);
    o.connect(f).connect(g).connect(a.destination); o.start(tt); l.start(tt); o.stop(tt + d + .03); l.stop(tt + d + .03);
  });
}
function hungrySound(c){
  if (!ready() || !c) return;
  const a = actx, t = a.currentTime, v = c.voice, p = v.pitch;
  voiceNote(a, v, t, .14 * v.len, p * 1.15);
  const t2 = t + .18, d = .85 * v.len;
  const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain(), l = a.createOscillator(), lg = a.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(450 * p, t2); o.frequency.linearRampToValueAtTime(820 * p, t2 + d * .45);
  o.frequency.linearRampToValueAtTime(900 * p, t2 + d * .7); o.frequency.linearRampToValueAtTime(560 * p, t2 + d);
  l.frequency.value = 6; lg.gain.value = 18 * p; l.connect(lg).connect(o.frequency);
  f.type = 'bandpass'; f.Q.value = 2.2;
  f.frequency.setValueAtTime(1000 * p, t2); f.frequency.linearRampToValueAtTime(2600 * p, t2 + d * .5); f.frequency.linearRampToValueAtTime(1200 * p, t2 + d);
  g.gain.setValueAtTime(0, t2); g.gain.linearRampToValueAtTime(.14, t2 + .06); g.gain.setValueAtTime(.14, t2 + d * .75); g.gain.exponentialRampToValueAtTime(.001, t2 + d);
  o.connect(f).connect(g).connect(a.destination); o.start(t2); l.start(t2); o.stop(t2 + d + .05); l.stop(t2 + d + .05);
}
function thirstySound(c){
  if (!ready() || !c) return;
  const a = actx, t = a.currentTime, v = c.voice, p = v.pitch, d = .3 * v.len;
  voiceNote(a, v, t, d, p * 1.1);
  noiseBurst(a, t, d, 'bandpass', 2000 * p, 1.5, .03);
  for (let k = 0; k < 3; k++){
    const tt = t + d + .1 + k * rand(.11, .15);
    tone(a, tt, 'sine', 950 * p, 520 * p, .04, .06);
    noiseBurst(a, tt, .025, 'highpass', 3000, .8, .04);
  }
}
function sneeze(c){
  if (!ready()) return;
  const a = actx, t = a.currentTime, p = c ? c.voice.pitch : 1;
  tone(a, t, 'sine', 500 * p, 900 * p, .18, .05, 'lin');
  noiseBurst(a, t + .22, .16, 'bandpass', 3000 * p, .9, .16);
}
function playTrill(c){
  if (!ready()) return;
  const a = actx, t = a.currentTime + .05, p = c ? c.voice.pitch : 1, d = rand(.16, .24);
  const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain(), l = a.createOscillator(), lg = a.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(520 * p, t); o.frequency.linearRampToValueAtTime(820 * p, t + d);
  l.frequency.value = 26; lg.gain.value = 70 * p; l.connect(lg).connect(o.frequency);
  f.type = 'bandpass'; f.frequency.value = 1500 * p; f.Q.value = 1.2;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(f).connect(g).connect(a.destination); o.start(t); l.start(t); o.stop(t + d + .03); l.stop(t + d + .03);
}
function snore(c){
  if (!ready()) return;
  const a = actx, t = a.currentTime, p = c ? c.voice.pitch : 1;
  const inhale = noiseBurst(a, t, 1, 'lowpass', 500, .6, .035);
  inhale.frequency.setValueAtTime(300, t); inhale.frequency.linearRampToValueAtTime(700, t + .9);
  const t2 = t + 1.05, d = 1.1;
  const o = a.createOscillator(), am = a.createGain(), l = a.createOscillator(), lg = a.createGain(), f = a.createBiquadFilter(), g = a.createGain();
  o.type = 'sawtooth'; o.frequency.value = 55 * p; f.type = 'lowpass'; f.frequency.value = 320;
  am.gain.value = .5; l.frequency.value = 18; lg.gain.value = .5; l.connect(lg).connect(am.gain);
  g.gain.setValueAtTime(0, t2); g.gain.linearRampToValueAtTime(.07, t2 + .25); g.gain.linearRampToValueAtTime(0, t2 + d);
  o.connect(f).connect(am).connect(g).connect(a.destination); o.start(t2); l.start(t2); o.stop(t2 + d); l.stop(t2 + d);
  const ex = noiseBurst(a, t2, d, 'lowpass', 400, .6, .025);
  ex.frequency.setValueAtTime(600, t2); ex.frequency.linearRampToValueAtTime(250, t2 + d);
}

/* ---------- bruits du quotidien ---------- */
function fart(c){
  if (!ready()) return;
  const a = actx, t = a.currentTime, p = c ? c.voice.pitch : 1, d = rand(.25, .45);
  const o = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), f = a.createBiquadFilter(), g = a.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(95 * p, t); o.frequency.exponentialRampToValueAtTime(55 * p, t + d);
  lfo.type = 'square'; lfo.frequency.value = rand(22, 34); lg.gain.value = 25 * p; lfo.connect(lg).connect(o.frequency);
  f.type = 'lowpass'; f.Q.value = 4; f.frequency.setValueAtTime(700, t); f.frequency.linearRampToValueAtTime(300, t + d);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.22, t + .02); g.gain.setValueAtTime(.2, t + d * .7); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(f).connect(g).connect(a.destination); o.start(t); lfo.start(t); o.stop(t + d + .05); lfo.stop(t + d + .05);
}
function litterScratch(){
  if (!ready()) return; const a = actx;
  for (let k = 0; k < 3; k++) noiseBurst(a, a.currentTime + k * .16, .1, 'bandpass', 1800, 1.2, .08);
}
function clawScratch(){
  if (!ready()) return; const a = actx;
  for (let k = 0; k < 4; k++) noiseBurst(a, a.currentTime + k * rand(.07, .1), rand(.06, .09), 'bandpass', rand(1400, 2200), 1, rand(.07, .1));
}
function cleanSound(puddle){
  if (!ready()) return; const a = actx, t = a.currentTime;
  if (puddle) for (let k = 0; k < 2; k++) noiseBurst(a, t + k * .2, .18, 'bandpass', 900, .8, .07);
  else {
    const f = noiseBurst(a, t, .35, 'bandpass', 1200, 1, .1);
    f.frequency.setValueAtTime(700, t); f.frequency.linearRampToValueAtTime(2200, t + .3);
    for (let k = 0; k < 4; k++){ const f0 = rand(180, 300); tone(a, t + .4 + k * rand(.05, .09), 'triangle', f0, f0 * .6, .07, .12); }
  }
  const t2 = t + (puddle ? .45 : .8);
  [1046.5, 1318.5, 1568].forEach((fr, i) => tone(a, t2 + i * .08, 'sine', fr, fr, .35, .07));
}
function kibbleSound(){
  if (!ready()) return; const a = actx, t = a.currentTime;
  tone(a, t, 'sine', 1180, 1180, .6, .05); tone(a, t, 'sine', 1770, 1770, .6, .02);
  for (let i = 0; i < 38; i++){
    const tt = t + .02 + Math.pow(Math.random(), 1.6) * .75, f0 = rand(1800, 4200);
    const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(f0, tt); o.frequency.exponentialRampToValueAtTime(f0 * .6, tt + .015);
    f.type = 'highpass'; f.frequency.value = 1500;
    const v = rand(.02, .05) * (1 - (tt - t) / 1.1);
    g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(v, tt + .002); g.gain.exponentialRampToValueAtTime(.0005, tt + .025);
    o.connect(f).connect(g).connect(a.destination); o.start(tt); o.stop(tt + .03);
  }
}
function crunch(c){
  if (!ready()) return; const a = actx, t = a.currentTime, p = c ? c.voice.pitch : 1;
  const n = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < n; i++) noiseBurst(a, t + i * rand(.025, .045), rand(.03, .06), 'bandpass', rand(1200, 2400) * (.85 + p * .15), 1.5, rand(.05, .08));
}
function lap(c){
  if (!ready()) return; const a = actx, t = a.currentTime, p = c ? c.voice.pitch : 1, f0 = rand(350, 500) * (.8 + p * .2);
  tone(a, t, 'sine', f0, f0 * 2.6, .05, .07);
  noiseBurst(a, t + .01, .04, 'bandpass', 2500, 2, .02);
}
function toySound(kind){
  if (!ready()) return; const a = actx, t0 = a.currentTime;
  if (kind === 'mouse' || kind === 'robot'){
    for (let k = 0; k < 2; k++){
      const tt = t0 + k * .14, o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(2000, tt); o.frequency.linearRampToValueAtTime(2900, tt + .05); o.frequency.linearRampToValueAtTime(2200, tt + .11);
      g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(.05, tt + .01); g.gain.exponentialRampToValueAtTime(.001, tt + .12);
      o.connect(g).connect(a.destination); o.start(tt); o.stop(tt + .13);
    }
  } else if (kind === 'bell'){
    for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++){ const f = rand(3200, 5400); tone(a, t0 + k * rand(.06, .1), 'sine', f, f, .25, .025); }
  } else if (kind === 'fish'){
    for (let k = 0; k < 6; k++) noiseBurst(a, t0 + k * rand(.02, .05), rand(.02, .04), 'highpass', 3800, .7, rand(.04, .07));
  } else {
    noiseBurst(a, t0, .12, 'lowpass', 500, .7, .06);
  }
}
function pawTap(){
  if (!ready()) return; const a = actx, t = a.currentTime;
  tone(a, t, 'sine', 160, 70, .1, .12); noiseBurst(a, t, .05, 'lowpass', 600, .8, .05);
}
function swat(){
  if (!ready()) return; const a = actx, t = a.currentTime;
  noiseBurst(a, t, .08, 'lowpass', 900, 1, .12); noiseBurst(a, t + .01, .03, 'highpass', 3000, 1, .05);
}
function climbSound(){
  if (!ready()) return; const a = actx, t = a.currentTime;
  for (let k = 0; k < 5; k++) noiseBurst(a, t + k * rand(.06, .09), rand(.04, .06), 'bandpass', rand(2200, 3200), 1.4, rand(.06, .09));
}
function landSound(soft){
  if (!ready()) return; const a = actx, t = a.currentTime;
  tone(a, t, 'sine', soft ? 140 : 110, 50, .15, soft ? .1 : .16);
  noiseBurst(a, t, .06, 'lowpass', 400, .7, soft ? .04 : .07);
}
function boxSound(enter){
  if (!ready()) return; const a = actx, t = a.currentTime;
  noiseBurst(a, t, .14, 'bandpass', 240, 5, enter ? .22 : .15);
  for (let k = 0; k < (enter ? 5 : 3); k++) noiseBurst(a, t + .05 + k * rand(.05, .09), rand(.05, .09), 'bandpass', rand(700, 1300), 1.1, rand(.05, .08));
}
function cushionSound(){
  if (!ready()) return; const a = actx, t = a.currentTime;
  noiseBurst(a, t, .3, 'lowpass', 500, .5, .1);
}
function birdChirp(){
  if (!ready()) return; const a = actx, n = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++){
    const t = a.currentTime + .1 + i * rand(.12, .18), f0 = rand(2600, 3600), o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.4, t + .06); o.frequency.exponentialRampToValueAtTime(f0 * .9, t + .1);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.04, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + .1);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + .12);
  }
}
function brushSound(){
  if (!ready()) return; const a = actx, t = a.currentTime;
  for (let k = 0; k < 3; k++){ const f = noiseBurst(a, t + k * .13, .12, 'bandpass', 3000, .8, .05); f.frequency.setValueAtTime(2000, t + k * .13); f.frequency.linearRampToValueAtTime(4500, t + k * .13 + .12); }
}

/* ---------- interface ---------- */
function coinSound(){
  if (!ready()) return; const a = actx, t = a.currentTime;
  tone(a, t, 'square', 1320, 1320, .07, .03); tone(a, t + .07, 'square', 1760, 1760, .16, .03);
}
function achievementSound(){
  if (!ready()) return; const a = actx, t = a.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(a, t + i * .1, 'triangle', f, f, i === 3 ? .6 : .2, .1));
}
function buySound(){
  if (!ready()) return; const a = actx, t = a.currentTime;
  tone(a, t, 'triangle', 880, 880, .08, .08); tone(a, t + .08, 'triangle', 1175, 1175, .2, .08);
}
function placeSound(){
  if (!ready()) return; const a = actx, t = a.currentTime;
  tone(a, t, 'sine', 300, 140, .12, .12); noiseBurst(a, t, .05, 'lowpass', 700, .7, .05);
}
function errorSound(){
  if (!ready()) return; const a = actx, t = a.currentTime;
  tone(a, t, 'square', 220, 180, .18, .04);
}
