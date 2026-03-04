# 🚀 Checklist de Démarrage - Aero Doc Flow

## 1. 🗄️ Base de Données
- [ ] MongoDB démarré (service ou Docker)
- [ ] Base `aero-doc-flow-enfidha` accessible
- [ ] Collections créées (users, correspondances, etc.)

## 2. 🔧 Backend
```bash
cd backend
npm install  # Si première fois
npm start    # Démarrer le serveur
```
- [ ] Serveur démarré sur port 3001
- [ ] Message "Connected to MongoDB" affiché
- [ ] Aucune erreur dans les logs

## 3. 🎨 Frontend
```bash
cd ..  # Retour à la racine
npm run dev  # Démarrer Vite
```
- [ ] Frontend démarré sur port 5173
- [ ] Interface accessible dans le navigateur
- [ ] Aucune erreur de compilation

## 4. 🧪 Tests de Connexion
```bash
# Test API backend
curl http://localhost:3001/api/health

# Test API correspondances
curl http://localhost:3001/api/correspondances/test-simple-no-auth
```
- [ ] API répond correctement
- [ ] Pas d'erreur 500 ou de timeout

## 5. 🔐 Authentification
- [ ] Se connecter avec un utilisateur valide
- [ ] Token JWT généré et stocké
- [ ] Accès aux modules autorisés

## 6. 📝 Test Correspondances
- [ ] Créer une correspondance SANS fichier
- [ ] Vérifier qu'elle apparaît dans la liste
- [ ] Créer une correspondance AVEC fichier
- [ ] Vérifier l'upload et la sauvegarde

## 🚨 En cas de problème :

### Backend ne démarre pas :
- Vérifier MongoDB
- Vérifier les variables d'environnement (.env)
- Vérifier les dépendances (npm install)

### Upload échoue :
- Vérifier les permissions du dossier uploads/
- Vérifier la route /api/uploads dans le backend
- Vérifier les logs serveur pour les erreurs

### Correspondances ne se créent pas :
- Vérifier l'authentification (token valide)
- Vérifier les logs backend
- Vérifier la console navigateur (F12)
