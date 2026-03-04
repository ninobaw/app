# 💬 Guide d'utilisation - Dialogue Conversationnel de Proposition de Réponse

## 🎯 Vue d'ensemble

Le nouveau dialogue conversationnel remplace l'ancienne interface complexe par une approche moderne de type "chat" pour gérer les propositions de réponse aux correspondances.

## 👥 Utilisateurs concernés

- **Directeurs** (DIRECTEUR, SOUS_DIRECTEUR)
- **Directeur Général** (DIRECTEUR_GENERAL)

## 📍 Comment accéder au dialogue

### Pour les Directeurs :

1. **Connectez-vous** avec un compte directeur
2. **Accédez au Dashboard Directeur** (`/director-dashboard`)
3. **Trouvez la section** "Mes Propositions de Réponse"
4. **Cliquez sur "Voir détails"** sur une correspondance assignée
5. **Le dialogue conversationnel s'ouvre**

### Pour le Directeur Général :

1. **Connectez-vous** avec un compte DG
2. **Accédez au Dashboard DG** ou à la section de révision
3. **Cliquez sur "Ouvrir conversation"** sur une correspondance avec propositions
4. **Le dialogue conversationnel s'ouvre**

## 🔧 Prérequis pour voir le dialogue

### ✅ Conditions nécessaires :

1. **Compte utilisateur approprié** :
   - Directeur : `role: 'DIRECTEUR'` ou `'SOUS_DIRECTEUR'`
   - DG : `role: 'DIRECTEUR_GENERAL'`

2. **Correspondances assignées** :
   - Le champ `personnesConcernees` doit contenir l'ID du directeur
   - La correspondance doit avoir `status !== 'ARCHIVED'`

3. **Données valides** :
   - L'API `/api/correspondances/workflow/my-tasks` doit retourner des données
   - Le hook `useDirectorTasks` doit fonctionner correctement

## 🎨 Interface du dialogue conversationnel

### 📱 Apparence moderne :
- **Zone de messages** chronologique comme WhatsApp
- **Messages colorés** selon le rôle (bleu pour directeur, violet pour DG)
- **Timestamps** sur chaque message
- **Badges d'action** (APPROVE, REQUEST_REVISION, etc.)
- **Gestion des fichiers** intégrée

### 💬 Types de messages :
1. **Propositions directeur** (encadré bleu)
2. **Feedbacks DG** (encadré violet)
3. **Révisions** (encadré jaune)
4. **Approbations** (encadré vert)

## 🚀 Utilisation étape par étape

### Pour les Directeurs :

#### 1. Créer une proposition :
```
1. Ouvrir le dialogue sur une correspondance assignée
2. Rédiger la proposition dans la zone de texte
3. Ajouter des fichiers si nécessaire (drag & drop)
4. Cliquer sur "Envoyer proposition"
```

#### 2. Réviser une proposition :
```
1. Lire les commentaires du DG dans l'historique
2. Modifier la proposition selon les consignes
3. Ajouter des documents mis à jour
4. Cliquer sur "Envoyer révision"
```

### Pour le Directeur Général :

#### 1. Donner un feedback :
```
1. Lire la proposition du directeur
2. Choisir "Demander révision" ou "Approuver"
3. Rédiger les commentaires et consignes
4. Envoyer le feedback
```

#### 2. Approuver une proposition :
```
1. Sélectionner "Approuver avec commentaires"
2. Ajouter des commentaires d'approbation (optionnel)
3. Envoyer l'approbation
```

## 🔍 Diagnostic des problèmes

### ❌ Le dialogue ne s'affiche pas ?

#### Vérifications à faire :

1. **Compte utilisateur** :
   ```
   - Vérifiez votre rôle : DIRECTEUR, SOUS_DIRECTEUR, ou DIRECTEUR_GENERAL
   - Assurez-vous que votre compte est actif
   ```

2. **Correspondances assignées** :
   ```
   - Vérifiez que des correspondances vous sont assignées
   - Le champ "personnesConcernees" doit contenir votre ID utilisateur
   ```

3. **API et données** :
   ```
   - Ouvrez la console développeur (F12)
   - Vérifiez les appels API : /api/correspondances/workflow/my-tasks
   - Regardez les erreurs dans la console
   ```

#### Scripts de diagnostic :

1. **Test backend** :
   ```bash
   # Exécuter depuis la racine du projet
   test-director-tasks.bat
   ```

2. **Debug frontend** :
   ```
   - Un composant de debug est temporairement ajouté au dashboard
   - Il affiche toutes les informations de diagnostic
   - Utilisez les boutons "Log" pour voir les données dans la console
   ```

### 🛠️ Solutions courantes :

#### Problème : "Aucune tâche trouvée"
```
Solution : Assignez des correspondances au directeur
1. Aller dans la gestion des correspondances
2. Modifier une correspondance
3. Ajouter le directeur dans "Personnes concernées"
4. Sauvegarder
```

#### Problème : "Erreur API"
```
Solution : Vérifier le backend
1. Redémarrer le serveur backend
2. Vérifier la connexion MongoDB
3. Tester l'endpoint manuellement
```

#### Problème : "Dialogue vide"
```
Solution : Vérifier les données
1. S'assurer que la correspondance a un ID valide
2. Vérifier que les données sont bien passées au dialogue
3. Regarder les logs de la console
```

## 📊 Fonctionnalités avancées

### 📎 Gestion des fichiers :
- **Upload** : Drag & drop ou clic pour sélectionner
- **Types supportés** : PDF, DOC, DOCX, images
- **Téléchargement** : Bouton download sur chaque fichier
- **Aperçu** : Nom, taille, type de fichier

### 🔄 Historique complet :
- **Messages chronologiques** : Tous les échanges visibles
- **Actions tracées** : Chaque action avec timestamp
- **Révisions** : Historique des modifications
- **Statuts** : Évolution du statut de la proposition

### 🎯 Actions contextuelles :
- **Directeur** : Créer, réviser, ajouter documents
- **DG** : Approuver, demander révision, rejeter
- **Boutons adaptatifs** : Selon le rôle et le statut

## 🆘 Support et aide

### En cas de problème :

1. **Vérifiez ce guide** d'utilisation
2. **Exécutez le diagnostic** avec `test-director-tasks.bat`
3. **Consultez la console** développeur (F12)
4. **Regardez le composant debug** dans le dashboard
5. **Contactez l'équipe technique** avec les logs d'erreur

### Informations utiles à fournir :
- Rôle de l'utilisateur connecté
- ID de la correspondance concernée
- Messages d'erreur dans la console
- Capture d'écran du problème

---

## ✅ Résumé

Le nouveau dialogue conversationnel simplifie grandement la gestion des propositions de réponse :

- **Interface moderne** et intuitive
- **Communication naturelle** entre directeur et DG
- **Historique complet** dans une seule vue
- **Gestion des fichiers** intégrée
- **Actions contextuelles** selon le rôle

Pour toute question ou problème, suivez les étapes de diagnostic de ce guide !
