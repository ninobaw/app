# 🔄 Guide de Test - Workflow Complet de Correspondance

## 🎯 Processus Implémenté

Le workflow de correspondance suit ces étapes :

1. **Création** → Correspondance créée
2. **Révision DG** → Directeur Général examine et ajoute consigne
3. **Assignation** → DG assigne à une personne responsable
4. **Proposition** → Personne assignée rédige une proposition de réponse
5. **Approbation DG** → DG approuve ou demande révision
6. **Révision** (si nécessaire) → Retour à l'étape 4
7. **Envoi** → Réponse finale envoyée

## 🚀 Tests Automatisés

### **1. Test Backend Complet**
```bash
# Exécuter le script de test automatisé
node test-workflow-complete.js
```

**Ce script teste :**
- ✅ Création d'une correspondance
- ✅ Création du workflow
- ✅ Consigne et assignation par DG
- ✅ Proposition de réponse
- ✅ Approbation par DG
- ✅ Envoi de la réponse finale
- ✅ Scénario avec révision

### **2. Test Frontend Manuel**

#### **Étape 1 : Créer une Correspondance**
1. Aller sur `/correspondances`
2. Cliquer "Nouvelle Correspondance"
3. Remplir les champs :
   - **Sujet** : "Test Workflow - Demande urgente"
   - **De** : "client@example.com"
   - **À** : "contact@tav.aero"
   - **Type** : "Entrant"
   - **Priorité** : "Élevée"
4. Sauvegarder

#### **Étape 2 : Créer le Workflow**
1. Dans la liste des correspondances
2. Cliquer sur l'icône **Workflow** (violet) 
3. Sélectionner le Directeur Général
4. Choisir la priorité
5. Cliquer "Créer le Workflow"
6. → **Ouverture automatique** de la page workflow

#### **Étape 3 : Consigne DG (Rôle : Directeur Général)**
1. Se connecter en tant que DG
2. Aller sur `/workflow/{workflowId}`
3. Section "Ajouter une consigne et assigner"
4. Saisir la consigne :
   ```
   Merci de traiter cette demande en priorité. 
   Préparez une réponse détaillée expliquant notre position.
   ```
5. Sélectionner la personne à assigner
6. Cliquer "Assigner la correspondance"

#### **Étape 4 : Proposition de Réponse (Rôle : Personne Assignée)**
1. Se connecter en tant que personne assignée
2. Aller sur `/workflow/{workflowId}`
3. Cliquer "Rédiger une proposition de réponse"
4. Rédiger la proposition :
   ```
   Monsieur/Madame,

   Suite à votre demande, nous avons l'honneur de vous informer que :

   1. Notre organisation respecte toutes les normes requises
   2. Nos équipes sont formées aux dernières procédures
   3. Nous disposons de toutes les certifications nécessaires

   Nous restons à votre disposition pour tout complément.

   Cordialement,
   L'équipe TAV
   ```
5. Cliquer "Soumettre la proposition"

#### **Étape 5 : Approbation DG (Rôle : Directeur Général)**
1. Se reconnecter en tant que DG
2. Aller sur `/workflow/{workflowId}`
3. Cliquer "Réviser la proposition"
4. Examiner la proposition
5. **Option A - Approuver :**
   - Ajouter commentaire : "Proposition approuvée, excellente réponse"
   - Cliquer "Approuver"
6. **Option B - Demander révision :**
   - Ajouter commentaire : "Merci d'ajouter plus de détails techniques"
   - Cliquer "Demander une révision"

#### **Étape 6 : Envoi Final**
1. Si approuvé, section "Envoyer la réponse finale" apparaît
2. Ajouter commentaire : "Réponse envoyée par email"
3. Cliquer "Envoyer la réponse"
4. → **Workflow terminé !**

## 🧪 Scénarios de Test

### **Scénario 1 : Workflow Normal (Succès Direct)**
```
Correspondance → DG Consigne → Assignation → Proposition → Approbation → Envoi
```

### **Scénario 2 : Workflow avec Révision**
```
Correspondance → DG Consigne → Assignation → Proposition → Révision Demandée → 
Nouvelle Proposition → Approbation → Envoi
```

### **Scénario 3 : Workflow Complexe (Multiples Révisions)**
```
Correspondance → DG Consigne → Assignation → Proposition → Révision 1 → 
Proposition 2 → Révision 2 → Proposition 3 → Approbation → Envoi
```

## 📊 Validation des Fonctionnalités

### **Interface Utilisateur**
- [ ] **Bouton Workflow** visible dans la liste des correspondances
- [ ] **Dialog de création** s'ouvre correctement
- [ ] **Page workflow** affiche toutes les informations
- [ ] **Actions disponibles** selon le rôle et l'état
- [ ] **Historique complet** des actions effectuées

### **Permissions et Rôles**
- [ ] **DG uniquement** peut ajouter consignes et assigner
- [ ] **Personne assignée** peut soumettre propositions
- [ ] **DG uniquement** peut approuver/rejeter
- [ ] **DG ou assigné** peut envoyer réponse finale
- [ ] **Autres utilisateurs** voient le workflow en lecture seule

### **États et Transitions**
- [ ] **CREATED** → **DG_REVIEW** (automatique)
- [ ] **DG_REVIEW** → **DG_ASSIGNED** (après consigne DG)
- [ ] **DG_ASSIGNED** → **DRAFT_RESPONSE** (après assignation)
- [ ] **DRAFT_RESPONSE** → **DG_APPROVAL** (après proposition)
- [ ] **DG_APPROVAL** → **APPROVED** (si approuvé)
- [ ] **DG_APPROVAL** → **DG_REVISION** (si rejeté)
- [ ] **DG_REVISION** → **DRAFT_RESPONSE** (pour nouvelle proposition)
- [ ] **APPROVED** → **RESPONSE_SENT** (après envoi)

### **Données et Persistance**
- [ ] **Actions sauvegardées** avec utilisateur, date, commentaire
- [ ] **Propositions conservées** dans l'historique
- [ ] **Réponse finale** stockée correctement
- [ ] **Assignations** trackées avec utilisateurs
- [ ] **Timestamps** précis pour chaque action

## 🔍 Points de Contrôle

### **Logs Backend**
Vérifier dans la console backend :
```
✅ Workflow créé avec succès
✅ Consigne ajoutée et correspondance assignée
✅ Proposition de réponse soumise pour approbation
✅ Réponse approuvée avec succès
✅ Réponse envoyée avec succès
```

### **Logs Frontend**
Vérifier dans la console navigateur (F12) :
```
🌐 [API Config] Resolved API_BASE_URL: http://10.20.14.130:5000
✅ Workflow créé avec succès
✅ Consigne ajoutée et correspondance assignée
✅ Proposition de réponse soumise pour approbation
```

### **Base de Données**
Vérifier les collections MongoDB :
- **correspondenceworkflows** : Workflow créé avec bonnes données
- **correspondances** : Correspondance originale intacte
- **users** : Utilisateurs assignés correctement référencés

## 🎯 Critères de Succès

### **Fonctionnalité Complète**
- ✅ **Workflow créé** depuis une correspondance
- ✅ **Toutes les étapes** fonctionnelles
- ✅ **Permissions respectées** selon les rôles
- ✅ **Historique complet** des actions
- ✅ **Interface intuitive** et responsive

### **Robustesse**
- ✅ **Gestion d'erreur** appropriée
- ✅ **Validation des données** côté frontend et backend
- ✅ **Transitions d'état** sécurisées
- ✅ **Notifications utilisateur** claires
- ✅ **Performance** acceptable

### **Expérience Utilisateur**
- ✅ **Navigation fluide** entre les étapes
- ✅ **Feedback visuel** pour chaque action
- ✅ **Messages d'erreur** compréhensibles
- ✅ **Interface adaptée** au rôle utilisateur
- ✅ **Workflow intuitif** à suivre

## 🚨 Problèmes Potentiels

### **Erreurs Communes**
1. **Workflow non trouvé** → Vérifier l'ID dans l'URL
2. **Permissions insuffisantes** → Vérifier le rôle utilisateur
3. **Transition invalide** → Vérifier l'état actuel du workflow
4. **Utilisateur non assigné** → Vérifier l'assignation dans le workflow

### **Solutions de Dépannage**
1. **Redémarrer les serveurs** backend et frontend
2. **Vider le cache** navigateur (Ctrl+F5)
3. **Vérifier les logs** backend pour erreurs détaillées
4. **Tester avec différents utilisateurs** et rôles

---

## ✅ Le workflow complet est maintenant opérationnel !

**Vous pouvez tester le processus complet de traitement des correspondances avec toutes les étapes d'approbation.** 🎉

### **URLs de Test**
- **Correspondances** : `http://10.20.14.130:8080/correspondances`
- **Workflow** : `http://10.20.14.130:8080/workflow/{workflowId}`
- **API Backend** : `http://10.20.14.130:5000/api/workflow`
