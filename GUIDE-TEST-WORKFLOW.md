# 🧪 Guide de Test du Workflow des Correspondances

## 📋 Préparation

### 1. Créer les Utilisateurs de Test
```bash
# Créer le superviseur
create-supervisor-user.bat

# Vérifier les utilisateurs existants
test-new-workflow.bat
```

### 2. Démarrer les Serveurs
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 🔐 Comptes de Test

| Rôle | Email | Mot de passe | Permissions |
|------|-------|--------------|-------------|
| **Super Admin** | abdallah.benkhalifa@tav.aero | password123 | Toutes |
| **Superviseur** | superviseur.bureau@aeroport.tn | supervisor123 | Supervision |
| **Agent Bureau** | maroua.saidi@tav.aero | password123 | Correspondances |
| **Directeur** | anisbenjannet@tav.aero | password123 | Validation |

## 🧪 Tests par Rôle

### A. Test Agent Bureau d'Ordre

1. **Connexion**
   - Se connecter avec `maroua.saidi@tav.aero`
   - Vérifier l'accès au dashboard spécialisé

2. **Création de Correspondance**
   - Aller dans "Correspondances" → "Nouvelle Correspondance"
   - Remplir les champs obligatoires :
     - Titre : "Test Workflow Agent"
     - Type : "INCOMING" 
     - Aéroport : Selon l'agent (MONASTIR/ENFIDHA)
     - Priorité : "HIGH"
     - Échéance : Dans 7 jours
   - ✅ **Vérifier** : Correspondance créée avec statut PENDING

3. **Restrictions d'Accès**
   - ✅ **Vérifier** : Seules les sections Correspondances et Dashboard visibles
   - ✅ **Vérifier** : Peut créer uniquement pour son aéroport

### B. Test Superviseur Bureau d'Ordre

1. **Connexion**
   - Se connecter avec `superviseur.bureau@aeroport.tn`
   - ✅ **Vérifier** : Dashboard superviseur s'affiche

2. **Dashboard Superviseur**
   - ✅ **Vérifier** : Statistiques d'échéances
   - ✅ **Vérifier** : Correspondances en retard
   - ✅ **Vérifier** : Échéances à venir
   - ✅ **Vérifier** : Total assigné

3. **Fonctions de Supervision**
   - Sélectionner une correspondance en retard
   - Envoyer un rappel manuel
   - ✅ **Vérifier** : Rappel enregistré dans l'historique
   - Marquer comme en retard si nécessaire

4. **Rapports Personnalisés**
   - Générer un rapport sur 30 jours
   - ✅ **Vérifier** : Statistiques détaillées
   - ✅ **Vérifier** : Export possible

### C. Test Directeur Général

1. **Connexion**
   - Se connecter avec `abdallah.benkhalifa@tav.aero` (Super Admin)
   - Ou créer un utilisateur DIRECTEUR_GENERAL

2. **Workflow de Validation**
   - Aller dans "Validations en Attente"
   - Sélectionner une correspondance PENDING
   - Ajouter des consignes : "Traiter en priorité - réponse urgente"
   - ✅ **Vérifier** : Consignes sauvegardées

3. **Gestion des Propositions**
   - Attendre qu'une proposition de réponse soit soumise
   - Valider ou rejeter avec commentaires
   - ✅ **Vérifier** : Statut mis à jour
   - Finaliser avec document de décharge

## 🔄 Test Workflow Complet

### Scénario : Correspondance Urgente

1. **Agent** (maroua.saidi@tav.aero)
   - Crée correspondance urgente
   - Type : INCOMING, Priorité : URGENT
   - Échéance : 3 jours

2. **Superviseur** (superviseur.bureau@aeroport.tn)
   - Voit la correspondance dans dashboard
   - Envoie rappel aux personnes concernées
   - Surveille l'échéance

3. **Directeur** (abdallah.benkhalifa@tav.aero)
   - Reçoit notification d'urgence
   - Ajoute consignes spéciales
   - Valide la proposition de réponse
   - Finalise avec décharge

4. **Vérifications Finales**
   - ✅ Correspondance passe à REPLIED
   - ✅ Historique complet des actions
   - ✅ Document de décharge lié
   - ✅ Notifications envoyées à tous

## 🧪 Tests API (Optionnel)

### Endpoints Superviseur
```bash
# Dashboard
GET http://localhost:5000/api/supervisor/dashboard
Authorization: Bearer [TOKEN_SUPERVISEUR]

# Statistiques
GET http://localhost:5000/api/supervisor/stats
Authorization: Bearer [TOKEN_SUPERVISEUR]

# Rappel manuel
POST http://localhost:5000/api/supervisor/send-reminder
{
  "correspondanceId": "ID_CORRESPONDANCE",
  "userIds": ["ID_USER1", "ID_USER2"],
  "message": "Rappel urgent"
}
```

### Endpoints Directeur
```bash
# Validations en attente
GET http://localhost:5000/api/director-workflow/pending-validations
Authorization: Bearer [TOKEN_DIRECTEUR]

# Ajouter consignes
POST http://localhost:5000/api/director-workflow/consignes
{
  "correspondanceId": "ID_CORRESPONDANCE",
  "consignes": "Instructions du directeur"
}
```

## ✅ Checklist de Validation

### Interface Utilisateur
- [ ] Dashboard spécialisé pour chaque rôle
- [ ] Navigation restreinte selon permissions
- [ ] Formulaires adaptés aux rôles
- [ ] Notifications temps réel

### Fonctionnalités Métier
- [ ] Création correspondances par aéroport
- [ ] Supervision des échéances
- [ ] Workflow de validation directeur
- [ ] Rappels automatiques et manuels
- [ ] Rapports personnalisés

### Sécurité et Permissions
- [ ] Accès restreint selon rôles
- [ ] Validation des permissions API
- [ ] Contrôle d'accès par aéroport
- [ ] Audit trail complet

### Performance et Stabilité
- [ ] Temps de réponse < 2s
- [ ] Gestion d'erreurs robuste
- [ ] Pas de fuites mémoire
- [ ] Logs détaillés

## 🐛 Problèmes Courants

### Erreur 403 - Accès Refusé
- Vérifier le rôle de l'utilisateur
- Contrôler les permissions dans auth.js
- Vérifier le token JWT

### Dashboard Vide
- Vérifier les données en base
- Contrôler les requêtes API
- Vérifier les filtres par rôle

### Notifications Non Reçues
- Vérifier la configuration SMTP
- Contrôler les préférences utilisateur
- Vérifier les services de notification

## 📞 Support

En cas de problème :
1. Vérifier les logs backend
2. Contrôler la console navigateur
3. Tester les endpoints avec Postman
4. Exécuter les scripts de diagnostic
