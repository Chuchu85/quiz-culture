# Culture Mashup — Quiz multijoueur en temps réel

Application de quiz d'entreprise temps réel avec interface hôte, écran projecteur et interface mobile participants.

## Stack

- **Frontend** : React + Vite + Tailwind CSS
- **Backend** : Node.js + Express + Socket.io
- **State** : mémoire serveur (pas de base de données)

---

## Installation

### Prérequis
- Node.js 18+
- npm

### Étapes

```bash
# 1. Cloner / ouvrir le dossier
cd quiz-app

# 2. Installer les dépendances serveur
cd server && npm install && cd ..

# 3. Installer les dépendances client
cd client && npm install && cd ..
```

---

## Lancement en local

Ouvrir **deux terminaux** :

**Terminal 1 — Serveur :**
```bash
cd quiz-app/server
npm run dev
# → http://localhost:3001
```

**Terminal 2 — Client :**
```bash
cd quiz-app/client
npm run dev
# → http://localhost:5173
```

Puis ouvrir **http://localhost:5173** dans le navigateur.

---

## Flux de jeu

### Côté hôte
1. Aller sur `/` → cliquer **"Je suis l'hôte"**
2. Sélectionner un quiz → **Créer la session**
3. Partager le code à 4 lettres aux équipes
4. Optionnel : cliquer **"Ouvrir l'écran projecteur"** (s'ouvre en nouvel onglet, à mettre en fullscreen sur le vidéoprojecteur avec la touche `F`)
5. Attendre que les équipes rejoignent → **Lancer la partie**
6. Question par question :
   - Clôturer manuellement OU attendre le timer
   - Révéler la réponse
   - Attribuer des points manuels si besoin (+1 pt par réponse correcte ouverte)
   - Afficher le classement
   - Passer à la question suivante

### Côté participants
1. Aller sur `/join` depuis leur téléphone
2. Entrer le code + nom d'équipe
3. Répondre aux questions en temps réel
4. Voir son score et le classement entre les questions

---

## Types de questions

| Type | Description |
|------|-------------|
| `multiple_choice` | QCM 2–4 choix, correction automatique |
| `text_input` | Réponse libre — correction auto si `acceptedAnswers` défini, sinon manuelle |
| `interstitial` | Écran de transition / titre de section |

---

## Ajouter un quiz

Créer un fichier JSON dans `server/data/quizzes/` :

```json
{
  "id": "mon_quiz",
  "name": "Mon Quiz",
  "theme": "Thème général",
  "rounds": [
    {
      "id": "round1",
      "name": "Manche 1",
      "questions": [
        {
          "id": "q1",
          "type": "multiple_choice",
          "theme": "Culture",
          "label": "Quelle est la capitale de la France ?",
          "choices": [
            { "id": "A", "text": "Lyon" },
            { "id": "B", "text": "Paris" },
            { "id": "C", "text": "Marseille" },
            { "id": "D", "text": "Bordeaux" }
          ],
          "correctAnswer": "B",
          "explanation": "Paris est la capitale depuis des siècles.",
          "points": 1,
          "duration": 20
        },
        {
          "id": "q2",
          "type": "text_input",
          "theme": "Histoire",
          "label": "En quelle année a eu lieu la Révolution française ?",
          "acceptedAnswers": ["1789"],
          "explanation": "La Révolution française a débuté en 1789.",
          "points": 1,
          "duration": 30
        }
      ]
    }
  ]
}
```

Le serveur charge automatiquement tous les fichiers `.json` au démarrage.

---

## Ajouter des médias

Placer les fichiers dans `client/public/media/` :
- Images : `client/public/media/images/`
- Audio : `client/public/media/audio/`

Les référencer dans les questions avec :
```json
"media": { "type": "image", "url": "/media/images/mon_image.jpg" }
```

---

## Design system

| Élément | Valeur |
|---------|--------|
| Fond | `#1a0bdb` (bleu électrique) |
| Rose | `#ff1ee8` (magenta néon) |
| Vert | `#39ff14` (vert néon) |
| Jaune | `#ffe600` |
| Police titres | Lilita One (Google Fonts) |
| Police corps | Nunito |

---

## Variables d'environnement

Créer un fichier `client/.env` si besoin :
```
VITE_SERVER_URL=http://localhost:3001
```

Par défaut le client se connecte sur `http://localhost:3001`.

---

## Raccourcis projecteur

Sur l'écran Display (`/display/:code`) :
- Appuyer sur `F` pour activer/désactiver le plein écran
