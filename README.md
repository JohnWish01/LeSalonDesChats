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

## Ce que font les chats tout seuls

Ils se promènent, font la sieste (et ronflent), mangent, boivent, vont à la litière, grimpent aux arbres à chat,
se cachent dans les cartons, dorment dans leur panier, font leurs griffes, guettent les oiseaux depuis la fenêtre,
jouent avec leurs jouets, se chamaillent parfois, et peuvent tomber malades si on les néglige.

Chaque chat a sa propre voix, et tous les sons sont synthétisés en direct, sans fichier audio.

## Les fichiers

- `index.html` : la page et les styles
- `js/data.js` : pelages, voix, objets, nourriture, soins, pièces et succès
- `js/audio.js` : tous les sons
- `js/draw.js` : le dessin des chats, des objets et des pièces
- `js/game.js` : la simulation, l'économie et la sauvegarde
- `js/ui.js` : l'interface (écran titre, boutique, création de chat, aménagement…)
