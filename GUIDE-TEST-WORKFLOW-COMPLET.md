# 🧪 Guide de Test du Workflow Complet des Correspondances

## 📋 Scénario de Test

**Workflow à tester :**
1. **Agent Asma Sahli** enregistre correspondance reçue
2. **Envoi au Directeur RH** Anis Ben Jannet  
3. **Anis propose une réponse**
4. **Directeur Général modifie** légèrement la réponse
5. **Anis applique les modifications** et renvoie
6. **Directeur Général approuve**
7. **Superviseur notifié** (système + email)
8. **Réponse appliquée** et décharge reçu
9. **Insertion réponse** avec liaison dans système

## 🚀 Préparation

### 1. Exécuter le Script de Préparation
```bash
prepare-workflow-test.bat
```

### 2. Démarrer les Serveurs
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd ..
npm run dev
```

## 👥 Comptes de Test

| Rôle | Email | Mot de passe | Fonction |
|------|-------|--------------|----------|
| **Agent Bureau** | asma.sahli@tav.aero | password123 | Enregistrer correspondances |
| **Directeur RH** | anisbenjannet@tav.aero | password123 | Proposer réponses |
| **Directeur Général** | abdallah.benkhalifa@tav.aero | password123 | Approuver/modifier |
| **Superviseur** | superviseur.bureau@aeroport.tn | supervisor123 | Superviser et appliquer |

## 📝 Étapes Détaillées du Test

### **ÉTAPE 1 : Enregistrement par l'Agent (Asma Sahli)**

1. **Connexion :**
   - Email : `asma.sahli@tav.aero`
   - Mot de passe : `password123`

2. **Créer une correspondance :**
   - Aller dans **Correspondances**
   - Cliquer **"Nouvelle Correspondance"**
   - Remplir les champs :
     ```
     Titre: Demande congé exceptionnel - Employé Dupont
     Objet: Demande de congé exceptionnel pour raisons familiales
     Type: INCOMING (Entrant)
     Priorité: MEDIUM
     Aéroport: ENFIDHA
     De: employe.dupont@tav.aero
     À: rh@enfidha-airport.tn
     Contenu: Monsieur le Directeur RH, je sollicite un congé exceptionnel de 3 jours pour raisons familiales urgentes. Merci de votre compréhension.
     ```
   - **Important :** Sélectionner **Anis Ben Jannet** dans "Personnes concernées"
   - Cliquer **"Créer"**

3. **Vérifications :**
   - ✅ Correspondance créée avec statut PENDING
   - ✅ Notification envoyée à Anis Ben Jannet
   - ✅ Correspondance visible dans la liste

### **ÉTAPE 2 : Proposition de Réponse (Anis Ben Jannet)**

1. **Connexion :**
   - Se déconnecter d'Asma
   - Email : `anisbenjannet@tav.aero`
   - Mot de passe : `password123`

2. **Consulter les correspondances :**
   - Aller dans **Dashboard Directeur**
   - Voir la correspondance dans "Correspondances en attente"
   - Cliquer sur la correspondance

3. **Proposer une réponse :**
   - Cliquer **"Proposer Réponse"**
   - Remplir la proposition :
     ```
     Proposition de réponse:
     Monsieur Dupont,
     Suite à votre demande de congé exceptionnel, nous vous informons que votre demande est acceptée pour 2 jours (au lieu de 3) du [date] au [date].
     Veuillez vous rapprocher du service RH pour les formalités.
     Cordialement,
     Direction RH
     ```
   - Cliquer **"Soumettre Proposition"**

4. **Vérifications :**
   - ✅ Proposition enregistrée
   - ✅ Statut mis à jour
   - ✅ Notification envoyée au Directeur Général

### **ÉTAPE 3 : Modification par le Directeur Général**

1. **Connexion :**
   - Se déconnecter d'Anis
   - Email : `abdallah.benkhalifa@tav.aero`
   - Mot de passe : `password123`

2. **Consulter la proposition :**
   - Aller dans **Dashboard Directeur**
   - Voir la correspondance avec proposition
   - Cliquer pour examiner

3. **Modifier la réponse :**
   - Cliquer **"Modifier Proposition"**
   - Apporter des modifications :
     ```
     Réponse modifiée:
     Monsieur Dupont,
     Suite à votre demande de congé exceptionnel, nous vous informons que votre demande est acceptée pour 3 jours complets du [date] au [date].
     Veuillez vous rapprocher du service RH pour les formalités administratives.
     Bien cordialement,
     Direction Générale
     ```
   - Ajouter des commentaires :
     ```
     Commentaires pour Anis:
     J'ai accepté les 3 jours complets et ajouté la signature Direction Générale. 
     Merci de finaliser avec ces modifications.
     ```
   - Cliquer **"Renvoyer à Anis"**

4. **Vérifications :**
   - ✅ Modifications enregistrées
   - ✅ Notification envoyée à Anis
   - ✅ Commentaires visibles

### **ÉTAPE 4 : Application des Modifications (Anis)**

1. **Reconnexion Anis :**
   - Email : `anisbenjannet@tav.aero`

2. **Voir les modifications :**
   - Consulter la correspondance modifiée
   - Lire les commentaires du DG

3. **Appliquer et renvoyer :**
   - Cliquer **"Appliquer Modifications"**
   - Confirmer la version finale
   - Cliquer **"Renvoyer au Directeur Général"**

4. **Vérifications :**
   - ✅ Version finale prête
   - ✅ Renvoyée au DG pour approbation

### **ÉTAPE 5 : Approbation Finale (Directeur Général)**

1. **Reconnexion DG :**
   - Email : `abdallah.benkhalifa@tav.aero`

2. **Approuver la réponse :**
   - Consulter la version finale
   - Cliquer **"Approuver Réponse"**
   - Confirmer l'approbation

3. **Vérifications :**
   - ✅ Réponse approuvée
   - ✅ Statut : APPROVED
   - ✅ Notification au superviseur

### **ÉTAPE 6 : Notification Superviseur**

1. **Connexion Superviseur :**
   - Email : `superviseur.bureau@aeroport.tn`
   - Mot de passe : `supervisor123`

2. **Consulter le dashboard :**
   - Voir la section **"Correspondances Validées pour Réponse"**
   - Correspondance doit apparaître avec statut APPROVED

3. **Préparer la réponse :**
   - Cliquer **"Préparer Réponse"**
   - Voir les détails et commentaires
   - Remplir les informations de réponse :
     ```
     Référence réponse: REP-2024-001
     Responsable: Superviseur Bureau Ordre
     Date d'achèvement: [date du jour + 1]
     ```
   - Cliquer **"Soumettre Réponse"**

4. **Vérifications :**
   - ✅ Notification reçue (système + email)
   - ✅ Correspondance dans dashboard superviseur
   - ✅ Bouton "Préparer Réponse" fonctionnel

### **ÉTAPE 7 : Application de la Réponse et Liaison**

1. **Créer la réponse officielle :**
   - Dans le système, créer la correspondance de réponse
   - Utiliser l'API ou l'interface pour créer la liaison
   - Vérifier que `parentCorrespondanceId` est correctement défini

2. **Tester les liaisons :**
   - **Depuis la correspondance originale :** Voir les réponses liées
   - **Depuis la réponse :** Voir la correspondance originale
   - **Chaîne complète :** Vérifier toute la conversation

## 🔍 Points de Vérification

### **Notifications**
- [ ] Agent → Directeur RH (nouvelle correspondance)
- [ ] Directeur RH → Directeur Général (proposition)
- [ ] Directeur Général → Directeur RH (modifications)
- [ ] Directeur RH → Directeur Général (version finale)
- [ ] Directeur Général → Superviseur (approbation)

### **États et Statuts**
- [ ] PENDING → Correspondance créée
- [ ] PROPOSAL_SUBMITTED → Proposition soumise
- [ ] NEEDS_REVISION → Modifications demandées
- [ ] REVISED → Version révisée
- [ ] APPROVED → Approuvée par DG
- [ ] REPLIED → Réponse appliquée

### **Liaisons Correspondance-Réponse**
- [ ] `parentCorrespondanceId` correctement défini
- [ ] `childCorrespondanceIds` mis à jour
- [ ] `isResponse: true` pour la réponse
- [ ] Navigation bidirectionnelle fonctionnelle

### **Dashboard Superviseur**
- [ ] Correspondances validées visibles
- [ ] Alertes d'échéances fonctionnelles
- [ ] Statistiques mises à jour
- [ ] Dialog de préparation réponse

## 🚨 Points d'Attention

1. **Permissions :** Vérifier que chaque utilisateur voit uniquement ses correspondances
2. **Notifications :** S'assurer que les emails sont envoyés (vérifier logs)
3. **Liaisons :** Tester la navigation correspondance ↔ réponse
4. **Workflow :** Chaque étape doit déclencher la suivante automatiquement

## 📊 APIs à Tester

```bash
# Correspondances avec réponses
GET /api/correspondances/{id}/with-responses

# Chaîne complète
GET /api/correspondances/{id}/chain

# Dashboard superviseur
GET /api/supervisor/dashboard

# Correspondances validées
GET /api/supervisor/validated-correspondances
```

## ✅ Résultat Attendu

À la fin du test, vous devriez avoir :
- ✅ **Correspondance originale** avec statut REPLIED
- ✅ **Réponse officielle** liée à l'originale
- ✅ **Navigation bidirectionnelle** fonctionnelle
- ✅ **Dashboard superviseur** à jour
- ✅ **Notifications** envoyées à chaque étape
- ✅ **Workflow complet** documenté et fonctionnel

**Bonne chance pour votre test ! 🎯**
