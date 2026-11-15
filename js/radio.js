/* Le Salon des Chats : la radio des chats.
   Elle lit des playlists YouTube publiques avec le lecteur officiel, toujours visible pendant la lecture
   (règles de YouTube). On peut remplacer la playlist de chaque station par la sienne. */

const radio = {open: false, playing: false, station: null, player: null, apiLoading: false, errors: 0, noteT: 0, titleT: 0};
const stationById = id => RADIO_STATIONS.find(s => s.id === id) || RADIO_STATIONS[0];
const stationList = st => (G.radioLists && G.radioLists[st.id]) || st.list;

function loadYT(cb){
  if (window.YT && window.YT.Player) return cb();
  (window._ytQueue = window._ytQueue || []).push(cb);
  if (radio.apiLoading) return;
  radio.apiLoading = true;
  window.onYouTubeIframeAPIReady = () => { window._ytQueue.splice(0).forEach(f => f()); };
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  s.onerror = () => { radio.apiLoading = false; radioMsg('Impossible de joindre YouTube : vérifie ta connexion Internet.'); };
  document.head.appendChild(s);
}
function radioMsg(t){ $('radioMsg').textContent = t || ''; }

function openRadio(){
  if (!ofKind('radio').length){ showHint('Achète une radio à la boutique (onglet Déco), puis place-la dans la pièce avec Aménager.', 6000); return; }
  radio.open = true; $('radioPanel').hidden = false; renderRadio();
}
function closeRadio(){
  radio.open = false; $('radioPanel').hidden = true;
  try { if (radio.player && radio.player.stopVideo) radio.player.stopVideo(); } catch (e) {}
  radio.playing = false;
}
function playStation(id){
  const st = stationById(id), list = stationList(st);
  radio.station = st.id; G.radioStation = st.id; radio.errors = 0;
  radioMsg('Chargement de la station…');
  renderRadio();
  loadYT(() => {
    if (!radio.player){
      radio.player = new YT.Player('ytPlayer', {
        width: '100%', height: '200', host: 'https://www.youtube-nocookie.com',
        playerVars: {listType: 'playlist', list, autoplay: 1, playsinline: 1, rel: 0},
        events: {
          onReady: e => { e.target.setVolume(G.radioVol ?? 60); e.target.setShuffle(true); e.target.playVideo(); },
          onStateChange: e => {
            radio.playing = e.data === YT.PlayerState.PLAYING;
            if (radio.playing){ radio.errors = 0; radioMsg(''); }
            renderRadio();
          },
          onError: () => {
            radio.errors++;
            if (radio.errors < 6){ radioMsg('Ce morceau ne peut pas être lu ici, on passe au suivant…'); setTimeout(() => radio.player && radio.player.nextVideo(), 800); }
            else radioMsg('Cette playlist ne peut pas être lue ici. Essaie une autre station, ou mets ta propre playlist.');
          }
        }
      });
    } else {
      radio.player.loadPlaylist({list, listType: 'playlist', index: 0});
      setTimeout(() => { try { radio.player.setShuffle(true); } catch (e) {} }, 1500);
    }
  });
}
function renderRadio(){
  if (!G) return;
  const cur = radio.station || G.radioStation || 'lofi';
  $('radioStations').innerHTML = RADIO_STATIONS.map(s => `<button class="chip station${s.id === radio.station ? ' on' : ''}" data-station="${s.id}" style="--st:${s.color}">${esc(s.name)}${G.radioLists && G.radioLists[s.id] ? ' ★' : ''}</button>`).join('');
  $('radioPlay').textContent = radio.playing ? 'Pause' : 'Lecture';
  $('radioVol').value = G.radioVol ?? 60;
  $('radioCustomFor').textContent = stationById(cur).name;
  $('radioReset').hidden = !(G.radioLists && G.radioLists[cur]);
}
function radioTitle(){
  try { const d = radio.player && radio.player.getVideoData && radio.player.getVideoData(); $('radioNow').textContent = d && d.title ? d.title : ''; } catch (e) {}
}
function parsePlaylist(v){
  v = (v || '').trim();
  const m = v.match(/[?&]list=([A-Za-z0-9_-]+)/);
  const id = m ? m[1] : v;
  return /^[A-Za-z0-9_-]{12,}$/.test(id) ? id : null;
}

/* Pendant la musique : des notes s'envolent de la radio, et les chats autour hochent la tête en rythme. */
function updateRadio(dt){
  if (radio.open){ radio.titleT -= dt; if (radio.titleT <= 0){ radio.titleT = 2; radioTitle(); } }
  if (!radio.playing) return;
  const o = ofKind('radio')[0];
  if (!o){ closeRadio(); return; }
  const st = stationById(radio.station), s = scaleAt(o.y), t = now();
  radio.noteT -= dt;
  if (radio.noteT <= 0){
    radio.noteT = rand(.35, .7);
    fx.push({x: o.x + rand(-14, 14) * s, y: o.y - 40 * s, vx: rand(-18, 18), vy: rand(-40, -25), life: 1.4, size: rand(12, 17) * s, ch: pick(['♪', '♫']), col: st.color});
  }
  for (const c of G.cats){
    if (c.state !== 'idle' || c.moving || dist(c, o) > 300 * s) continue;
    c.look = Math.sin(t * st.tempo + c.id) * .55;
    c.happy = Math.min(100, c.happy + dt * .6);
    if (!c.bubble && Math.random() < dt * .04){ c.bubble = pick(['♪ Mrrr ♪', '♫', '♪ Miaou ♪']); c.bubbleT = 1.3; }
  }
}

function initRadio(){
  $('radioClose').addEventListener('click', closeRadio);
  $('radioStations').addEventListener('click', e => { const b = e.target.closest('[data-station]'); if (b) playStation(b.dataset.station); });
  $('radioPlay').addEventListener('click', () => {
    if (!radio.player || !radio.station) return playStation(G.radioStation || 'lofi');
    if (radio.playing) radio.player.pauseVideo(); else radio.player.playVideo();
  });
  $('radioNext').addEventListener('click', () => { if (radio.player) radio.player.nextVideo(); });
  $('radioVol').addEventListener('input', e => { G.radioVol = +e.target.value; if (radio.player && radio.player.setVolume) radio.player.setVolume(G.radioVol); });
  $('radioSave').addEventListener('click', () => {
    const id = parsePlaylist($('radioCustom').value), cur = radio.station || G.radioStation || 'lofi';
    if (!id){ radioMsg('Colle le lien d’une playlist YouTube (il contient « list= »).'); return; }
    G.radioLists = G.radioLists || {}; G.radioLists[cur] = id; $('radioCustom').value = '';
    saveGame(); playStation(cur);
  });
  $('radioReset').addEventListener('click', () => {
    const cur = radio.station || G.radioStation || 'lofi';
    if (G.radioLists) delete G.radioLists[cur];
    saveGame(); playStation(cur);
  });
}
