#!/bin/bash
# ── Script de déploiement Culture Mashup Quiz ──────────────────────────────
# Lance ce script UNE FOIS sur ton serveur après avoir copié les fichiers
# Usage : bash deploy.sh

set -e
echo ""
echo "🎮 Culture Mashup Quiz — Déploiement"
echo "────────────────────────────────────"

# 1. Installer les dépendances serveur
echo "📦 Installation des dépendances serveur..."
cd server && npm install --omit=dev && cd ..

# 2. Installer les dépendances client et builder
echo "🔨 Build du client React..."
cd client && npm install && npm run build && cd ..

echo ""
echo "✅ Build terminé — client/dist/ prêt"
echo ""

# 3. Vérifier PM2
if ! command -v pm2 &> /dev/null; then
  echo "📥 Installation de PM2 (gestionnaire de processus)..."
  npm install -g pm2
fi

# 4. Lancer ou redémarrer le serveur
echo "🚀 Démarrage du serveur..."
pm2 describe quiz-server > /dev/null 2>&1 \
  && pm2 restart quiz-server \
  || pm2 start server/index.js --name quiz-server

pm2 save

echo ""
echo "✅ Serveur lancé !"
echo ""
pm2 list
echo ""
echo "🌐 Ton quiz est accessible sur http://TON_IP:3001"
echo "   (ou sur ton domaine si nginx est configuré)"
echo ""
