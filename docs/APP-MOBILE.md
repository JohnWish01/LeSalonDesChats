# Plan : l'app Android et iOS du Salon des Chats

Ce document prépare la future app mobile. Rien n'est encore créé : on garde le jeu web tel quel,
et on l'emballera dans une vraie app le moment venu.

## L'approche choisie : Capacitor

[Capacitor](https://capacitorjs.com/) transforme un site web en app Android et iOS.
Le jeu (HTML + JavaScript) tourne dans l'app, avec accès aux fonctions du téléphone
(vibrations, stockage, barre d'état…). Un seul code pour le web, Android et iPhone :
chaque amélioration du jeu profite aux trois.

## Ce qui est déjà prêt dans le jeu

- **Vibration quand on caresse un chat** : `purrVibration()` dans `js/audio.js`.
  - Dans l'app, elle passera par le module natif **Haptics** de Capacitor (trois petites pulsations, comme un ronronnement).
  - Dans un navigateur Android, elle utilise déjà `navigator.vibrate`. Les iPhone ne vibrent pas dans un navigateur : il faudra l'app.
  - Un bouton **Vibrations** permet de la couper. Il n'apparaît que sur les appareils qui savent vibrer.
- **Tactile** : toutes les commandes passent par les événements « pointer », donc doigt et souris fonctionnent pareil.
- **Écrans de téléphone** : mise en page adaptée aux petits écrans, et marges pour les encoches (`viewport-fit=cover`, `safe-area-inset`).
- **Sons** : ils démarrent au premier toucher, comme l'exigent Android et iOS.

## Étapes quand on créera l'app

1. **Préparer le projet**
   - Ajouter un `package.json`, puis installer Capacitor :
     `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`,
     `@capacitor/haptics`, `@capacitor/preferences`, `@capacitor/splash-screen`, `@capacitor/status-bar`.
   - `npx cap init "Le Salon des Chats" com.johnwish01.lesalondeschats --web-dir www`
   - Un petit script qui copie `index.html` et `js/` dans `www/`.
2. **Adapter le jeu au mode app**
   - **Polices** : intégrer Baloo 2 et Nunito dans le projet (aujourd'hui elles viennent de Google Fonts, donc d'Internet).
   - **Sauvegarde** : passer de `localStorage` à `@capacitor/preferences` (iOS peut effacer le stockage du navigateur intégré).
   - **Bouton retour d'Android** : fermer la fenêtre ouverte, sinon revenir à l'écran titre.
   - **Barre d'outils** : en bas de l'écran sur téléphone, avec de plus gros boutons.
   - **Orientation** : choisir portrait, paysage ou les deux.
   - **Mise en pause** quand l'app passe en arrière-plan (sauvegarde + arrêt des sons).
3. **Habillage**
   - Icône de l'app (la tête de chat roux de l'onglet, en grand format) et écran de démarrage.
   - Captures d'écran et description pour les boutiques.
   - Une courte politique de confidentialité (le jeu ne collecte aucune donnée).
4. **Android**
   - Outils : **Android Studio** (il contient le JDK et le SDK Android).
   - `npx cap add android`, puis `npx cap open android` pour tester sur un téléphone ou un émulateur.
   - Publication : compte **Google Play Console** (25 $ une seule fois), fichier `.aab` signé.
5. **iOS**
   - Il faut **un Mac avec Xcode** : impossible de compiler une app iPhone depuis Windows.
   - Solutions : emprunter ou louer un Mac (par exemple un Mac dans le cloud), ou un service de compilation en ligne (Codemagic, Ionic Appflow).
   - Publication : **Apple Developer Program** (99 $ par an), tests avec TestFlight.

## Ce qu'il faut installer sur ce PC

| Outil | Pourquoi | État |
|---|---|---|
| Node.js | Lancer Capacitor et les scripts | Installé |
| Git | Envoyer le code sur GitHub | Installé |
| Android Studio (avec son JDK intégré) | Compiler et tester l'app Android | Installé |
| SDK Android (Android 37, build-tools 36, adb) | Les briques d'Android pour compiler | Installé, licences acceptées |
| Émulateur + téléphone virtuel « Medium Phone API 37 » | Tester l'app sans téléphone | Installé |
| Un vrai téléphone Android en mode développeur | Tester la vibration pour de vrai | Optionnel |
| Mac + Xcode | Compiler l'app iPhone | Impossible sous Windows (voir plus haut) |

Les modules Capacitor s'installent dans le projet au moment de créer l'app (`npm install`) : rien à installer à l'avance.
