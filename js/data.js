/* Le Salon des Chats : données du jeu (pelages, voix, objets, nourriture, soins, pièces, succès) */

const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * clamp(t, 0, 1)).toString(16).padStart(2, '0')).join(''); };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* La monnaie du jeu : les « duchats » (des ducats… pour chats). */
const COIN = 'duchats';

const COATS = [
  {id:'roux',      label:'Roux tigré',  base:'#e08a3c', dark:'#a9561a', pat:'tabby',  eye:'#8fd15a', price:0},
  {id:'noir',      label:'Noir',        base:'#2a2527', dark:'#151213', pat:'plain',  eye:'#e8c13a', price:0},
  {id:'gris',      label:'Gris tigré',  base:'#9197a0', dark:'#5d626b', pat:'tabby',  eye:'#e8b13a', price:0},
  {id:'blanc',     label:'Blanc',       base:'#f4efe7', dark:'#cfc6ba', pat:'plain',  eye:'#5aa6e0', price:0},
  {id:'smoking',   label:'Smoking',     base:'#262224', dark:'#151213', pat:'tux',    eye:'#8fd16a', price:60},
  {id:'creme',     label:'Crème',       base:'#e9c38f', dark:'#c4914f', pat:'tabby',  eye:'#c8a03a', price:60},
  {id:'siamois',   label:'Siamois',     base:'#eadcc4', dark:'#5a4033', pat:'points', eye:'#5aa6e0', price:120},
  {id:'calico',    label:'Calico',      base:'#f4efe7', dark:'#2a2527', pat:'calico', eye:'#d9a43a', price:120},
  {id:'bleu',      label:'Bleu russe',  base:'#7d8a9c', dark:'#5f6b7c', pat:'plain',  eye:'#7fd17a', price:200},
  {id:'bengal',    label:'Bengal',      base:'#d9a25a', dark:'#5a3a1e', pat:'spots',  eye:'#9ad16a', price:300},
  {id:'sphynx',    label:'Sphynx',      base:'#e8b9a8', dark:'#c98f80', pat:'sphynx', eye:'#8fd1c8', price:350},
  {id:'mainecoon', label:'Maine coon',  base:'#8a5a3a', dark:'#4a2e1c', pat:'fluffy', eye:'#e0b040', price:450},
  {id:'dore',      label:'Doré',        base:'#f2c24a', dark:'#c98a1a', pat:'gold',   eye:'#3aa0e0', challenge:'golden'},
  {id:'galaxie',   label:'Galaxie',     base:'#2b2a5e', dark:'#14133a', pat:'galaxy', eye:'#ffd75a', challenge:'galaxy'}
];
const coatById = id => COATS.find(c => c.id === id) || COATS[0];

const VOICES = [
  {id:'classic',   label:'Classique', words:['Miaou', 'Miaou ?', 'Mew']},
  {id:'plaintive', label:'Plaintive', words:['Miaaaou…', 'Miaaa…', 'Mééé…']},
  {id:'chirp',     label:'Roulée',    words:['Brrrt ?', 'Prrrip !', 'Mrrrr ?']},
  {id:'squeak',    label:'Couinante', words:['Mii ?', 'Mip !', 'Mi ?']},
  {id:'double',    label:'Bavarde',   words:['Mi-miaou !', 'Mia-mia !', 'Mrr-miaou']},
  {id:'low',       label:'Grave',     words:['Mraaow', 'Mrouuu', 'Rraow']}
];
const voiceDef = v => VOICES.find(x => x.id === v.id) || VOICES[0];
function makeVoice(id){
  const v = VOICES.find(x => x.id === id) || pick(VOICES);
  return {
    id: v.id,
    pitch: v.id === 'low' ? rand(.62, .75) : v.id === 'squeak' ? rand(1.3, 1.6) : rand(.85, 1.25),
    len: rand(.85, 1.25), vib: rand(4, 7),
    wave: v.id === 'squeak' ? 'square' : Math.random() < .5 ? 'sawtooth' : 'triangle'
  };
}

const TRAITS = [
  {id:'calin',       label:'Câlin',       desc:'Adore les caresses.',                     lazy:[.35, .6],  patience:[7, 9]},
  {id:'joueur',      label:'Joueur',      desc:'Toujours prêt à courir après un jouet.', lazy:[.05, .25], patience:[5, 7]},
  {id:'paresseux',   label:'Paresseux',   desc:'Champion de la sieste.',                  lazy:[.75, .95], patience:[5, 8]},
  {id:'susceptible', label:'Susceptible', desc:'Se vexe vite et se chamaille.',           lazy:[.3, .6],   patience:[3, 4]}
];
const traitById = id => TRAITS.find(t => t.id === id) || TRAITS[0];

const NAMES = ['Moustache', 'Pistache', 'Caramel', 'Réglisse', 'Biscotte', 'Noisette', 'Filou', 'Chaussette', 'Grisou', 'Mimine',
  'Tigrou', 'Praline', 'Pompon', 'Sushi', 'Gribouille', 'Plume', 'Cookie', 'Mistigri', 'Croquette', 'Nougat', 'Câlinou', 'Félix',
  'Minouche', 'Loukoum', 'Patouf', 'Ronron', 'Moka', 'Choupette', 'Zéphyr', 'Paprika'];

/* Objets à placer dans la pièce. hit = demi-largeur et hauteur de la zone cliquable (en unités du dessin). */
const ITEM_LIST = [
  {id:'bowl1',   cat:'meubles', kind:'bowl',    name:'Gamelle',                price:15,  cap:100, desc:'Une gamelle toute simple.', hit:[22, 18]},
  {id:'bowl2',   cat:'meubles', kind:'bowl',    name:'Gamelle double',         price:45,  cap:180, desc:'Presque deux fois plus de croquettes.', hit:[32, 18]},
  {id:'bowl3',   cat:'meubles', kind:'bowl',    name:'Distributeur',           price:120, cap:320, desc:'Une grosse réserve : on le remplit bien moins souvent.', hit:[26, 50]},
  {id:'water1',  cat:'meubles', kind:'water',   name:'Bol d’eau',              price:10,  spots:1, joy:0, desc:'Un seul chat peut boire à la fois.', hit:[22, 16]},
  {id:'water2',  cat:'meubles', kind:'water',   name:'Fontaine',               price:60,  spots:2, joy:2, desc:'Deux places, et l’eau qui coule rend les chats heureux.', hit:[38, 44]},
  {id:'water3',  cat:'meubles', kind:'water',   name:'Fontaine fleur',         price:150, spots:3, joy:4, desc:'Trois places et une jolie cascade.', hit:[42, 52]},
  {id:'litter1', cat:'meubles', kind:'litter',  name:'Litière',                price:20,  uses:4, desc:'Pleine après 4 passages.', hit:[42, 26]},
  {id:'litter2', cat:'meubles', kind:'litter',  name:'Litière couverte',       price:70,  uses:6, covered:true, desc:'6 passages, et les odeurs restent dedans.', hit:[42, 48]},
  {id:'litter3', cat:'meubles', kind:'litter',  name:'Litière autonettoyante', price:220, uses:8, covered:true, auto:true, desc:'8 passages, et elle se nettoie toute seule, petit à petit.', hit:[42, 50]},
  {id:'box',     cat:'meubles', kind:'box',     name:'Carton',                 price:5,   desc:'Le meilleur jouet du monde, évidemment.', hit:[42, 56]},
  {id:'bed1',    cat:'meubles', kind:'bed',     name:'Panier douillet',        price:50,  comfort:1, rest:1, desc:'Pour des siestes réparatrices.', hit:[38, 26]},
  {id:'bed2',    cat:'meubles', kind:'bed',     name:'Coussin royal',          price:160, comfort:3, rest:2, desc:'Des siestes dignes d’un roi.', hit:[42, 30]},
  {id:'tree1',   cat:'meubles', kind:'tree',    name:'Petit arbre à chat',     price:60,  levels:1, desc:'Une plateforme pour tout surveiller.', hit:[48, 90]},
  {id:'tree2',   cat:'meubles', kind:'tree',    name:'Arbre à chat',           price:140, levels:2, desc:'Deux plateformes et un pompon.', hit:[52, 164]},
  {id:'tree3',   cat:'meubles', kind:'tree',    name:'Tour à chats',           price:300, levels:3, desc:'Trois étages et une cabane au sommet.', hit:[56, 250]},
  {id:'scratch', cat:'meubles', kind:'scratch', name:'Griffoir',               price:35,  desc:'Les chats y font leurs griffes (et pas sur le canapé).', hit:[22, 96]},
  {id:'mouse',   cat:'jouets',  kind:'toy',     name:'Souris',                 price:8,   desc:'Elle couine quand on la tape.', hit:[18, 16]},
  {id:'bell',    cat:'jouets',  kind:'toy',     name:'Balle à grelot',         price:8,   desc:'Ding ding !', hit:[14, 16]},
  {id:'fish',    cat:'jouets',  kind:'toy',     name:'Poisson',                price:12,  desc:'Il crépite comme du papier froissé.', hit:[18, 16]},
  {id:'yarn',    cat:'jouets',  kind:'toy',     name:'Pelote de laine',        price:10,  desc:'Un grand classique qui roule loin.', hit:[16, 20]},
  {id:'robot',   cat:'jouets',  kind:'toy',     name:'Souris mécanique',       price:90,  auto:true, desc:'Elle se promène toute seule !', hit:[18, 16]},
  {id:'rug1',    cat:'deco',    kind:'rug',     name:'Tapis rond',             price:30,  comfort:1, desc:'Doux sous les coussinets.', hit:[90, 22]},
  {id:'rug2',    cat:'deco',    kind:'rug',     name:'Tapis persan',           price:120, comfort:3, desc:'Chic et moelleux.', hit:[110, 26]},
  {id:'plant1',  cat:'deco',    kind:'plant',   name:'Plante',                 price:20,  comfort:1, size:1,   desc:'Un peu de verdure.', hit:[20, 54]},
  {id:'plant2',  cat:'deco',    kind:'plant',   name:'Grand ficus',            price:70,  comfort:2, size:1.8, desc:'Une vraie jungle d’appartement.', hit:[32, 100]},
  {id:'lamp1',   cat:'deco',    kind:'lamp',    name:'Lampe sur pied',         price:25,  comfort:1, desc:'Éclaire la pièce la nuit.', hit:[24, 150]},
  {id:'lamp2',   cat:'deco',    kind:'lamp',    name:'Lampe boule',            price:80,  comfort:2, desc:'Une lumière douce et dorée.', hit:[22, 86]}
];
const ITEMS = Object.fromEntries(ITEM_LIST.map(i => [i.id, i]));

const FOODS = [
  {id:'croq',    name:'Croquettes',         price:2,  pack:5, happy:0,  health:0, color:'#8a5428', desc:'Le repas de base. 5 portions.'},
  {id:'premium', name:'Croquettes premium', price:6,  pack:5, happy:6,  health:3, color:'#b8742e', desc:'Meilleures pour la santé, et les chats sont plus contents. 5 portions.'},
  {id:'patee',   name:'Pâtée gourmet',      price:10, pack:3, happy:16, health:5, color:'#c4574a', desc:'Un vrai festin : bonheur garanti. 3 portions.'}
];
const foodById = id => FOODS.find(f => f.id === id) || FOODS[0];

const CARES = [
  {id:'treat',    name:'Friandise',        price:3,  pack:5, desc:'À donner à la main : +15 bonheur. 5 friandises.'},
  {id:'catnip',   name:'Herbe à chat',     price:8,  pack:2, desc:'Rend un chat fou de joie pendant un moment. 2 doses.'},
  {id:'vitamins', name:'Vitamines',        price:10, pack:2, desc:'+30 santé. 2 doses.'},
  {id:'kit',      name:'Trousse de soins', price:25, pack:1, desc:'Guérit complètement un chat malade.'},
  {id:'brush',    name:'Brosse',           price:40, once:true, desc:'Un outil pour brosser les chats : ils adorent, et c’est bon pour leur santé.'}
];

/* Accessoires : un emplacement au cou, un sur la tête, un sur le visage. */
const ACCESSORIES = [
  {id:'collarRed',  slot:'neck', name:'Collier rouge',      price:20,  color:'#d23a3a', desc:'Un classique.'},
  {id:'collarBlue', slot:'neck', name:'Collier bleu',       price:20,  color:'#3a6ad2', desc:'Bleu comme le ciel.'},
  {id:'collarBell', slot:'neck', name:'Collier à clochette', price:45, color:'#2a9a6a', bell:true, desc:'Il tinte quand le chat se promène.'},
  {id:'bandana',    slot:'neck', name:'Bandana',            price:30,  color:'#e8a64e', desc:'Pour un look d’aventurier.'},
  {id:'bow',        slot:'neck', name:'Nœud papillon',      price:35,  color:'#e05a9a', desc:'Très chic.'},
  {id:'flower',     slot:'head', name:'Fleur',              price:25,  color:'#ff9ab8', desc:'Une jolie fleur à l’oreille.'},
  {id:'beret',      slot:'head', name:'Béret',              price:50,  color:'#c23a4e', desc:'Oh là là !'},
  {id:'hat',        slot:'head', name:'Chapeau melon',      price:60,  color:'#2a2228', desc:'Distingué, forcément.'},
  {id:'crown',      slot:'head', name:'Couronne',           price:250, color:'#f2c24a', desc:'Pour le roi ou la reine du salon.'},
  {id:'glasses',    slot:'face', name:'Lunettes rondes',    price:40,  color:'#2a2228', desc:'Un air très intelligent.'}
];
const ACC = Object.fromEntries(ACCESSORIES.map(a => [a.id, a]));
const SLOTS = [['neck', 'Cou'], ['head', 'Tête'], ['face', 'Visage']];

/* Tours à apprendre avec des friandises : séances nécessaires et duchats gagnés à chaque démonstration. */
const TRICKS = [
  {id:'sit',   name:'Assis',          sessions:3, reward:2},
  {id:'paw',   name:'Donne la patte', sessions:5, reward:3},
  {id:'high5', name:'High-five',      sessions:8, reward:5}
];

/* Préférences secrètes de chaque chat, à découvrir en jouant. */
const TOY_TYPES = ['mouse', 'bell', 'fish', 'yarn', 'robot'];
const PREF_LABEL = {
  toy:  {mouse:'la souris', bell:'la balle à grelot', fish:'le poisson', yarn:'la pelote de laine', robot:'la souris mécanique'},
  food: {croq:'les croquettes', premium:'les croquettes premium', patee:'la pâtée gourmet'},
  spot: {tree:'l’arbre à chat', box:'le carton', bed:'le panier', sill:'la fenêtre'}
};
const PREF_TITLE = {toy:'Jouet préféré', food:'Plat préféré', spot:'Endroit préféré'};

const ROOMS = [
  {id:'salon',   name:'Le Salon',     maxCats:5,  mult:1,   desc:'Un petit salon douillet pour commencer.', req:null},
  {id:'veranda', name:'La Véranda',   maxCats:8,  mult:1.5, desc:'Lumineuse et pleine d’oiseaux. Jusqu’à 8 chats, et 50 % de duchats en plus.', req:{ach:6, earned:400}},
  {id:'chateau', name:'Le Chat-teau', maxCats:12, mult:2,   desc:'Un château pour vos majestés félines. Jusqu’à 12 chats, et les duchats doublés.', req:{ach:15, earned:1500}}
];
const roomById = id => ROOMS.find(r => r.id === id) || ROOMS[0];

/* Succès. prog(stats, partie) renvoie [valeur, objectif] ; test(stats, partie) renvoie vrai quand c'est réussi. */
const ACH = [
  {id:'pet1',      name:'Premier ronron',      desc:'Caresser un chat.',                                   reward:10,  prog:s => [s.pets, 1]},
  {id:'pet50',     name:'Main de velours',     desc:'Caresser des chats 50 fois.',                         reward:30,  prog:s => [s.pets, 50]},
  {id:'place10',   name:'Décorateur',          desc:'Placer 10 objets dans la pièce.',                     reward:25,  prog:s => [s.placed, 10]},
  {id:'feed10',    name:'Chef cuistot',        desc:'Remplir 10 gamelles.',                                reward:30,  prog:s => [s.fills, 10]},
  {id:'clean10',   name:'Pelle d’or',          desc:'Nettoyer 10 litières.',                               reward:30,  prog:s => [s.cleans, 10]},
  {id:'cats3',     name:'Petite famille',      desc:'Avoir 3 chats.',                                      reward:25,  prog:(s, g) => [g.cats.length, 3]},
  {id:'cats5',     name:'Famille nombreuse',   desc:'Avoir 5 chats.',                                      reward:60,  prog:(s, g) => [g.cats.length, 5]},
  {id:'happy',     name:'Aux anges',           desc:'Tous les chats (3 ou plus) au-dessus de 80 de bonheur en même temps.', reward:50, test:(s, g) => g.cats.length >= 3 && g.cats.every(c => c.happy > 80)},
  {id:'peace3',    name:'Casque bleu',         desc:'Séparer 3 bagarres.',                                 reward:30,  prog:s => [s.separations, 3]},
  {id:'birds10',   name:'Ornithologue',        desc:'Les chats ont guetté 10 oiseaux.',                    reward:25,  prog:s => [s.birds, 10]},
  {id:'gourmet',   name:'Gourmet',             desc:'Servir une pâtée gourmet.',                           reward:20,  prog:s => [s.patee, 1]},
  {id:'brush20',   name:'Brosseur pro',        desc:'Brosser les chats 20 fois.',                          reward:40,  prog:s => [s.brushes, 20]},
  {id:'heal',      name:'Infirmier',           desc:'Soigner un chat malade.',                             reward:40,  prog:s => [s.heals, 1]},
  {id:'day3',      name:'Journées parfaites',  desc:'Passer 3 journées sans accident ni bagarre.',         reward:80,  prog:s => [s.perfectDays, 3]},
  {id:'coins500',  name:'Bourse pleine',       desc:'Gagner 500 duchats au total.',                        reward:50,  prog:(s, g) => [g.earned, 500]},
  {id:'coins2000', name:'Duchats à gogo',      desc:'Gagner 2000 duchats au total.',                       reward:150, prog:(s, g) => [g.earned, 2000]},
  {id:'coats8',    name:'Collectionneur',      desc:'Débloquer 8 pelages.',                                reward:60,  prog:(s, g) => [g.coats.length, 8]},
  {id:'friends',   name:'Meilleurs amis',      desc:'Deux chats deviennent meilleurs amis.',               reward:40,  test:(s, g) => Object.values(g.rel || {}).some(v => v >= 70)},
  {id:'prefs',     name:'Je te connais par cœur', desc:'Découvrir les trois préférences d’un chat.',       reward:40,  test:(s, g) => g.cats.some(c => c.known && c.known.toy && c.known.food && c.known.spot)},
  {id:'tricks3',   name:'Dresseur',            desc:'Apprendre 3 tours à tes chats.',                      reward:50,  prog:(s, g) => [g.cats.reduce((n, c) => n + TRICKS.filter(t => (c.tricks || {})[t.id] >= t.sessions).length, 0), 3]},
  {id:'fashion',   name:'Chat-rmant',          desc:'Trois chats portent un accessoire en même temps.',    reward:40,  prog:(s, g) => [g.cats.filter(c => c.acc && Object.values(c.acc).some(Boolean)).length, 3]},
  {id:'grownup',   name:'Il a bien grandi',    desc:'Un chaton devient adulte.',                           reward:40,  prog:s => [s.grown || 0, 1]},
  {id:'veranda',   name:'Chat-pitre deux',     desc:'Débloquer la Véranda.',                               reward:50,  prog:(s, g) => [g.rooms.includes('veranda') ? 1 : 0, 1]},
  {id:'chateau',   name:'Chat-telain',         desc:'Débloquer le Chat-teau.',                             reward:150, prog:(s, g) => [g.rooms.includes('chateau') ? 1 : 0, 1]},
  {id:'golden',    name:'Défi : Pluie d’or',   desc:'Avoir 5 chats tous au-dessus de 90 de bonheur en même temps. Débloque le pelage Doré.', reward:100, challenge:true, test:(s, g) => g.cats.length >= 5 && g.cats.every(c => c.happy > 90)},
  {id:'galaxy',    name:'Défi : Chat-stronaute', desc:'Vivre au Chat-teau avec 20 succès réussis. Débloque le pelage Galaxie.', reward:200, challenge:true, test:(s, g) => g.room === 'chateau' && Object.keys(g.ach).length >= 20}
];
