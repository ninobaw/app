# 🧪 Instructions de Test Manuel du Workflow Complet

## ⚠️ Problème Actuel
Le serveur backend doit être redémarré pour prendre en compte les modifications des permissions dans `enhancedWorkflowRoutes.js`.

## 🔄 Étapes de Redémarrage

### 1. Arrêter le Backend Actuel
```bash
# Dans le terminal où tourne le backend, appuyez sur Ctrl+C
# Ou fermez la fenêtre du terminal backend
```

### 2. Redémarrer le Backend
```bash
cd backend
npm start
```

### 3. Attendre le Démarrage Complet
Attendez de voir :
```
✅ Connecté à MongoDB
🚀 Serveur démarré sur le port 5000
```

## 🧪 Test Manuel du Workflow Complet

### Étape 1 : Accéder à l'Interface
1. **Ouvrir** le navigateur
2. **Aller** sur `http://localhost:8080/correspondances`
3. **Se connecter** avec :
   - Email: `abdallah.benkhalifa@tav.aero`
   - Mot de passe: `password123`

### Étape 2 : Créer un Workflow
1. **Sélectionner** une correspondance existante dans la liste
2. **Cliquer** sur l'icône **Workflow** (violet) à droite
3. **Remplir** le formulaire de création :
   - **Directeur Responsable** : Sélectionner un directeur
   - **Directeur Général** : Sélectionner le DG
   - **Superviseur** : Optionnel
   - **Priorité** : HIGH/MEDIUM/LOW
4. **Cliquer** "Créer le Workflow Complet"

### Étape 3 : Interface du Workflow
Le workflow s'ouvre automatiquement dans un nouvel onglet :
- **URL** : `http://localhost:8080/enhanced-workflow/{ID}`
- **Barre de progression** visible
- **Informations** des acteurs affichées
- **Actions disponibles** selon le rôle

### Étape 4 : Test Complet du Processus

#### 4.1 En tant que Directeur
1. **Se connecter** comme directeur assigné
2. **Aller** sur le workflow
3. **Cliquer** "Rédiger une proposition"
4. **Saisir** la proposition de réponse
5. **Joindre** des fichiers si nécessaire
6. **Soumettre** pour révision DG

#### 4.2 En tant que Directeur Général
1. **Se connecter** comme DG
2. **Aller** sur le workflow
3. **Examiner** la proposition
4. **Option A - Demander révision :**
   - Cliquer "Réviser la proposition"
   - Saisir feedback détaillé
   - Cliquer "Demander une révision"
5. **Option B - Approuver :**
   - Cliquer "Réviser la proposition"
   - Cliquer "Approuver"

#### 4.3 Chat DG ↔ Directeur
1. **Utiliser** le chat intégré
2. **Échanger** sur les modifications
3. **Joindre** des documents
4. **Suivre** les versions des propositions

#### 4.4 Révisions Multiples
1. **Directeur** révise selon feedback
2. **Soumet** nouvelle version
3. **DG** révise à nouveau
4. **Processus** répété jusqu'à approbation

#### 4.5 Finalisation par Superviseur
1. **Se connecter** comme superviseur
2. **Voir** notification d'approbation
3. **Préparer** réponse finale formatée
4. **Envoyer** la réponse

## 🔍 Points de Vérification

### ✅ Fonctionnalités à Tester
- [ ] **Création** du workflow par bureau d'ordre
- [ ] **Assignation** correcte des acteurs
- [ ] **Proposition** de réponse par directeur
- [ ] **Révision** et feedback par DG
- [ ] **Chat** entre DG et directeur
- [ ] **Versioning** des propositions
- [ ] **Va-et-vient** multiples
- [ ] **Approbation** finale par DG
- [ ] **Notification** au superviseur
- [ ] **Préparation** réponse par superviseur
- [ ] **Envoi** final de la réponse
- [ ] **Historique** complet des actions
- [ ] **Barre de progression** mise à jour
- [ ] **Attachements** à chaque étape

### 🎯 États du Workflow à Vérifier
1. `CREATED` → Correspondance créée
2. `ASSIGNED_TO_DIRECTOR` → Assignée au directeur
3. `DIRECTOR_DRAFT` → Proposition en cours
4. `DG_REVIEW` → Révision DG
5. `DG_FEEDBACK` → Feedback DG (si révision demandée)
6. `DIRECTOR_REVISION` → Révision directeur
7. `DG_APPROVED` → Approuvée par DG
8. `SUPERVISOR_NOTIFIED` → Superviseur notifié
9. `RESPONSE_PREPARED` → Réponse préparée
10. `RESPONSE_SENT` → Réponse envoyée

## 🚨 Dépannage

### Problème : "Seul le bureau d'ordre peut créer un workflow"
**Solution :** Le serveur n'a pas redémarré avec les nouvelles permissions
```bash
# Arrêter le backend (Ctrl+C)
cd backend
npm start
```

### Problème : "Workflow non trouvé" ou erreur 404
**Solution :** Routes enhanced-workflow non chargées
1. Vérifier que `enhancedWorkflowRoutes.js` existe
2. Vérifier l'ajout dans `server.js`
3. Redémarrer le backend

### Problème : Interface ne se charge pas
**Solution :** Frontend non démarré
```bash
npm run dev
```

### Problème : Chat ne fonctionne pas
**Solution :** Vérifier les permissions et l'état du workflow
- Chat disponible uniquement entre DG et Directeur
- Workflow doit être dans les bons états

## 📊 Test Automatisé (Après Redémarrage)

Une fois le backend redémarré, vous pouvez tester automatiquement :

```bash
# Test simple de création
node test-workflow-with-existing.js

# Test complet (si le premier fonctionne)
node test-enhanced-workflow.js
```

## 🎉 Résultat Attendu

À la fin du test complet, vous devriez avoir :
- ✅ **Workflow complet** fonctionnel de bout en bout
- ✅ **Tous les acteurs** impliqués dans le processus
- ✅ **Chat intégré** pour les échanges DG ↔ Directeur
- ✅ **Versioning** des propositions avec feedback
- ✅ **Historique** complet des actions
- ✅ **Interface moderne** avec barre de progression
- ✅ **Notifications** automatiques
- ✅ **Gestion des attachements** à chaque étape

---

## 🚀 Le workflow complet est prêt !

**Redémarrez le backend et testez l'interface pour voir le processus complet en action !**
