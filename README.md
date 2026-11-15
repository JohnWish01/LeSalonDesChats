# Le Salon des Chats

Un petit jeu de gestion où l'on adopte des chats, aménage leur maison et prend soin d'eux.
Joue directement en ligne sur https://johnwish01.github.io/LeSalonDesChats/

## Comment jouer

1. **Crée ton chat** : nom, pelage, voix et caractère.
2. **Aménage la pièce**, vide au départ : gamelle, eau, litière, puis jouets, arbre à chat, panier, déco…
3. **Prends soin de tes chats** : nourris-les, nettoie les litières, caresse-les, brosse-les, soigne-les s'ils tombent malades, sépare-les s'ils se bagarrent.
4. Des chats heureux rapportent des **duchats** (la monnaie du jeu). Dépense-les à la **boutique** : meilleurs objets, nourriture de qualité, soins et nouveaux pelages.
5. Réussis des **succès** pour débloquer **La Véranda** puis **Le Chat-teau**, et gagne les pelages rares (Doré, Galaxie) grâce aux défis.

La partie est sauvegardée automatiquement dans le navigateur.

## Chaque chat est unique

- **Une fiche par chat** (clique sur sa carte) : humeur, jauges, âge, souvenirs.
- **Des préférences secrètes** (jouet, plat et endroit préférés) à découvrir en jouant.
- **Des amitiés et des rivalités** : les amis dorment collés et se font la toilette, les rivaux se chamaillent.
- **Des chatons** qui grandissent en trois jours de jeu.
- **Des accessoires** : colliers, nœud papillon, bandana, chapeau, béret, fleur, couronne, lunettes.
- **Des tours** à apprendre avec des friandises (assis, donne la patte, high-five), qui rapportent des duchats.
- **Des expressions et des poses** : toilette, bâillement, étirement, position pain, sieste sur le dos, oreilles en arrière quand il est fâché…
- Ils **perdent leurs poils** et crachent parfois une **boule de poils** qu'il faut ramasser (la brosse aide).
- Ils **suivent ta souris des yeux** et viennent parfois **se frotter** à ta main.

## Ce que font les chats tout seuls

Ils se promènent, font la sieste (et ronflent), mangent, boivent, vont à la litière, grimpent aux arbres à chat,
se cachent dans les cartons, dorment dans leur panier, font leurs griffes, guettent les oiseaux depuis la fenêtre,
jouent avec leurs jouets, se chamaillent parfois, et peuvent tomber malades si on les néglige.

Chaque chat a sa propre voix, et tous les sons sont synthétisés en direct, sans fichier audio.

## Les fichiers

- `index.html` : la page et les styles
- `js/data.js` : pelages, voix, objets, nourriture, soins, pièces et succès
- `js/audio.js` : tous les sons
- `js/draw.js` : le dessin des objets et des pièces
- `js/cat.js` : le dessin des chats (poses, expressions, accessoires)
- `js/game.js` : la simulation, l'économie et la sauvegarde
- `js/ui.js` : l'interface (écran titre, boutique, création de chat, aménagement…)
