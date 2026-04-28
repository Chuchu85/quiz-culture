# Agent : Générateur de Quiz Multijoueur Temps Réel

Tu es un expert en développement web full-stack. Tu dois construire de A à Z un système de quiz multijoueur en temps réel, exactement comme décrit ci-dessous. L'utilisateur te fournira le **style graphique** et les **questions** — tout le reste est fixe et documenté ici.

---

## Stack technique (ne pas dévier)

| Côté | Technologie |
|------|-------------|
| Serveur | Node.js + Express + Socket.io |
| Client | React + Vite + TailwindCSS |
| Temps réel | Socket.io (websockets) |
| Stockage | Fichiers JSON locaux (pas de base de données) |
| QR Code | `qrcode.react` |
| Confettis | `canvas-confetti` |

```
/quizz-[nom]/
  server/
    index.js          ← serveur complet
    data/
      config.json     ← config runtime
      quizzes/
        quiz_[nom].json  ← questions
    uploads/          ← logos uploadés
  client/
    src/
      App.jsx
      index.css
      context/SocketContext.jsx
      components/
        Background.jsx
        Timer.jsx
        TeamList.jsx
        Scoreboard.jsx
        FaucheLogo.jsx   ← logo client dynamique
      pages/
        host/
          HostHome.jsx
          HostLobby.jsx
          HostGame.jsx
        player/
          PlayerJoin.jsx
          PlayerGame.jsx
        display/
          Display.jsx
        backoffice/
          Backoffice.jsx
    public/
      logo.png         ← logo du quiz
      [client-logo]    ← logo client
      2.png            ← décoration droite (transparent PNG)
      3.png            ← décoration gauche (transparent PNG)
```

---

## Routes

| URL | Interface | Description |
|-----|-----------|-------------|
| `/join` | Joueur | Rejoindre + selfie caméra |
| `/play` | Joueur | Interface de jeu en temps réel |
| `/host` | Animateur | Login mot de passe |
| `/host/:code/lobby` | Animateur | Attente joueurs + QR code |
| `/host/:code/game` | Animateur | Contrôles pendant la partie |
| `/display/:code` | Projecteur | Écran à projeter |
| `/backoffice` | Admin | Gestion questions, logos, config |

---

## Machine d'états du jeu (serveur)

```
idle → lobby → question_active → question_closed → answer_revealed → scoreboard → (question suivante ou finished)
```

Toutes les transitions sont déclenchées par l'animateur via Socket.io, sauf `question_active → question_closed` qui se fait automatiquement à la fin du timer.

---

## Fonctionnalités complètes à implémenter

### Joueur (`/join` → `/play`)
- Champ nom d'équipe
- **Caméra selfie** : ouverture via `getUserMedia`, capture sur canvas 80×80 JPEG, envoi au serveur via `player:photo`
- Photo transmise avec le nom et affichée partout dans la partie
- Écrans : lobby d'attente, question active (MCQ boutons / texte libre), confirmation réponse, révélation, classement, podium final
- **Countdown urgent** : quand ≤5s restantes, fond pulse rouge, chiffre géant en filigrane, vibration via `navigator.vibrate()`
- **Bonus vitesse** affiché si gagné (+1/+2/+3)
- **Transition cinématique** avant chaque question (numéro en énorme)

### Animateur (`/host`)
- Login avec mot de passe (stocké sessionStorage)
- Lobby : liste équipes en temps réel + QR code + bouton lancer
- Game : contrôles (clôturer / révéler / scoreboard / suivant / terminer), scores live avec +/- manuel, liste des réponses avec photos, correction manuelle (+1 pt)
- Reconnexion auto si perte socket

### Projecteur (`/display/:code`)
- **Lobby** : grands logos (quiz + client) côte à côte + QR code + liste joueurs avec photos
- **Question active** : question en grand + choix MCQ + barre de progression des réponses + avatars des équipes ayant répondu + timer
- **Answer revealed** : bonne réponse en grand + score bars animées + fastest finger (top 3 avec temps)
- **Scoreboard** : barres de score animées avec photos
- **Podium final** : SpotlightPodium — révèle 3e→2e→1er avec 1.8s de suspense, grands cercles photos avec halo coloré
- **Transition cinématique** : overlay plein écran 1.5s avant chaque question
- **Countdown 3-2-1** overlay plein écran
- Touche F = plein écran

### Fond animé (`Background.jsx`)
- Props `phase` : `null` | `'countdown'` | `'urgent'` | `'reveal'`
- `countdown` → glow pulse lent
- `urgent` → glow pulse rapide rouge + box-shadow inset rouge clignotant
- `reveal` → flash d'explosion qui s'étend et disparaît
- Décorations PNG transparentes gauche/droite (`3.png`, `2.png`) avec `mixBlendMode: screen`

### Backoffice (`/backoffice`)
- Login mot de passe (sessionStorage)
- **Onglet Config** : mot de passe animateur, code partie, durée par défaut, mot de passe backoffice
- **Onglet Logo & Identité** :
  - Logo quiz (upload drag&drop → `server/uploads/logo.*`)
  - Logo client / entreprise (upload drag&drop → `server/uploads/client-logo.*`)
  - Prévisualisation + suppression pour chaque logo
- **Onglet Questions** : éditeur complet (label, type, thème, durée, points, choix MCQ, réponses acceptées, correction manuelle, supprimer/ajouter question)

---

## Mécaniques de jeu

### Speed bonus
À la révélation, les 3 premiers à avoir répondu correctement gagnent +3/+2/+1 pts. Calculé côté serveur, affiché sur téléphone et projecteur.

### Timer auto-close
Quand le timer expire, `status` passe automatiquement à `question_closed`. L'animateur doit ensuite révéler manuellement.

### Correction manuelle
Questions avec `manualCorrection: true` → bouton "+1 pt" dans HostGame pour chaque équipe.

### Interstitiels
Questions de type `interstitial` (ex: "Questions Image") → affichées en plein écran sur le Display, skippées automatiquement côté calcul de score.

### Countdown 3-2-1 + transition
Séquence au lancement de chaque question :
1. `game:transition` émis → overlay numéro de question (1.5s)
2. `game:countdown` 3, 2, 1 → overlay countdown (3s)
3. `question_active` + timer démarré

---

## Événements Socket.io

### Host → Server
```
host:connect { password }
host:request-state
host:start-game
host:launch-question
host:close-question
host:reveal-answer
host:show-scoreboard
host:next-question
host:end-game
host:restart
host:award-point { playerId }
host:adjust-score { playerId, delta }
```

### Server → Host
```
host:connected { code }
host:error { message }
game:state { status, questionIndex, totalQuestions, question, roundName, players, answers, answersCount }
game:timer { remaining, total }
game:countdown { count }
game:transition { questionNumber, totalQuestions, roundName }
```

### Player → Server
```
player:join { teamName }
player:photo { photo }   ← base64 dataURL JPEG 80×80
player:answer { answer }
```

### Server → Player
```
player:joined { teamName }
player:error { message }
game:state (sans answers des autres)
game:timer
game:countdown
game:transition
quiz:answer-received { answer }
quiz:reveal { correctAnswer, givenAnswer, correct, score, speedBonus }
quiz:finished { score, total, leaderboard }
```

### Display → Server
```
display:join
```

### Server → Display
```
display:joined
game:state (answers avec answer=null pendant question_active)
game:timer
game:countdown
game:transition
```

---

## Format JSON des questions

```json
{
  "id": "quiz_[nom]",
  "name": "Nom du quiz",
  "theme": "Thème général",
  "rounds": [
    {
      "id": "round_1",
      "name": "Nom de la manche",
      "questions": [
        {
          "id": "q1",
          "type": "multiple_choice",
          "theme": "Sous-thème",
          "label": "La question ?",
          "choices": [
            { "id": "A", "text": "Réponse A" },
            { "id": "B", "text": "Réponse B" },
            { "id": "C", "text": "Réponse C" },
            { "id": "D", "text": "Réponse D" }
          ],
          "correctAnswer": "B",
          "explanation": "Explication affichée après.",
          "points": 1,
          "duration": 30
        },
        {
          "id": "q2",
          "type": "text_input",
          "theme": "Sous-thème",
          "label": "Question texte libre ?",
          "acceptedAnswers": ["réponse1", "réponse2"],
          "explanation": "Explication.",
          "points": 1,
          "duration": 45,
          "manualCorrection": true
        },
        {
          "id": "q3",
          "type": "interstitial",
          "theme": "Fun",
          "label": "Titre de l'interstitiel",
          "subtitle": "Sous-titre",
          "duration": 0
        }
      ]
    }
  ]
}
```

---

## Format config.json

```json
{
  "hostPassword": "animateur",
  "backofficePassword": "admin2024",
  "gameCode": "QUIZ01",
  "quizId": "quiz_[nom]",
  "defaultDuration": 40,
  "logo": null,
  "clientLogo": null
}
```

---

## Ce que l'utilisateur te fournit

### 1. Style graphique
- Couleur de fond principale (ex: `#1a0bdb`)
- Couleur accent 1 — "rose/primaire" (ex: `#ff1ee8`)
- Couleur accent 2 — "vert/succès" (ex: `#39ff14`)
- Couleur accent 3 — "jaune/warning" (ex: `#ffe600`)
- Font display (ex: Bebas Neue, Anton, Montserrat Black…)
- Font body (ex: Nunito, Inter, Poppins…)
- Logo du quiz (fichier image)
- Logo client / entreprise (fichier image)
- Images décoratives transparentes si disponibles (sinon tu génères des SVG décoratifs)

### 2. Questions
- Le contenu complet des questions par manche
- Ou un thème et tu génères les questions toi-même

---

## Instructions de construction

1. Crée la structure de dossiers complète
2. Installe les dépendances :
   - Server : `express socket.io cors multer`
   - Client : `react react-dom react-router-dom socket.io-client qrcode.react canvas-confetti`
   - Dev client : `vite @vitejs/plugin-react tailwindcss autoprefixer`
3. Adapte les couleurs dans `tailwind.config.js` et `index.css` selon le style fourni
4. Génère les fichiers dans l'ordre : server/index.js → client config → composants → pages
5. Crée le fichier `quiz_[nom].json` avec les questions fournies
6. Configure `vite.config.js` avec proxy `/api`, `/uploads`, `/socket.io` → port 3001
7. Configure les scripts dans `package.json` racine : `dev:server`, `dev:client`, `install:all`

---

## Scripts de lancement

```bash
# Terminal 1 — serveur
cd server && node --watch index.js

# Terminal 2 — client
cd client && npm run dev
```

## URLs après lancement
- Joueurs : `http://localhost:5173/join`
- Animateur : `http://localhost:5173/host`
- Projecteur : `http://localhost:5173/display/QUIZ01`
- Backoffice : `http://localhost:5173/backoffice`

---

## Contraintes importantes

- **Pas de base de données** — tout en mémoire côté serveur, questions en JSON
- **Pas de lib d'animation** — tout en CSS keyframes natif
- **Socket.io rooms** — l'hôte rejoint `host-room`, dual broadcast (room + socketId direct) pour fiabilité
- **Photos joueurs** — compressées en JPEG 80×80 base64 côté client avant envoi, max 30KB validé côté serveur
- **Polling de secours** — `host:request-state` toutes les 3s dans HostLobby pour pallier les pertes d'événements
- **Reconnexion** — sessionStorage `host_pwd` pour ré-authentifier l'animateur après reconnexion socket
- **Display** — les réponses des joueurs sont masquées (`answer: null`) pendant `question_active`
