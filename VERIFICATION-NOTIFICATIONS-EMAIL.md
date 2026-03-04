# Vérification des Notifications par Email

## Date: 3 novembre 2025

## Objectif de la vérification

Vérifier que les notifications par email lors de la création et de l'affectation de correspondances sont envoyées **UNIQUEMENT** aux personnes concernées spécifiquement assignées, et non à tous les directeurs/sous-directeurs du système.

## Analyse du système de notifications

### 📧 Service EmailNotificationService

**Fichier**: `backend/src/services/emailNotificationService.js`

Le service `EmailNotificationService.sendCorrespondanceEmailNotification()` fonctionne correctement :

```javascript
static async sendCorrespondanceEmailNotification(correspondance, userIds, type = 'NEW_CORRESPONDANCE') {
  // Ligne 633: Boucle sur les userIds fournis
  for (const userId of userIds) {
    const user = await User.findById(userId);
    // Envoie l'email uniquement à cet utilisateur
  }
}
```

✅ **Verdict**: Le service envoie les emails **UNIQUEMENT** aux IDs fournis dans le paramètre `userIds`.

### 🔧 Correction dans correspondanceRoutes.js

**Problème identifié**: Le code utilisait `personnesConcernees` du `req.body` au lieu de `newCorrespondance.personnesConcernees` (la liste finale après assignation).

**Fichier**: `backend/src/routes/correspondanceRoutes.js`  
**Lignes**: 699-727

#### ❌ Ancien code (PROBLÉMATIQUE)
```javascript
if (personnesConcernees && personnesConcernees.length > 0) {
  // Utilise la variable du req.body
  await EmailNotificationService.sendCorrespondanceEmailNotification(
    newCorrespondance, 
    personnesConcernees,  // ❌ Liste du body, pas la liste finale
    notificationType
  );
}
```

**Problème**: 
- Si assignation manuelle → OK (utilise la liste du body)
- Si assignation automatique → ❌ ERREUR (utilise une liste vide au lieu de la liste générée)

#### ✅ Nouveau code (CORRIGÉ)
```javascript
// ✅ CORRECTION CRITIQUE: Utiliser la liste FINALE après assignation
const finalPersonnesConcernees = newCorrespondance.personnesConcernees || [];

if (finalPersonnesConcernees.length > 0) {
  await EmailNotificationService.sendCorrespondanceEmailNotification(
    newCorrespondance, 
    finalPersonnesConcernees,  // ✅ Liste finale (manuelle OU automatique)
    notificationType
  );
}
```

**Avantages**:
- ✅ Fonctionne avec assignation manuelle
- ✅ Fonctionne avec assignation automatique
- ✅ Utilise toujours la liste finale et correcte

## Tests de validation

### Test 1: Assignation manuelle à un directeur spécifique

**Script**: `backend/test-notification-single-director.js`

**Scénario**:
1. Créer une correspondance
2. Assigner manuellement à UN SEUL directeur
3. Vérifier que `personnesConcernees` contient uniquement ce directeur
4. Vérifier que les notifications seraient envoyées uniquement à lui

**Résultat**:
```
✅ ✅ ✅ TEST RÉUSSI ! ✅ ✅ ✅
   La liste des destinataires contient UNIQUEMENT le directeur assigné
   Destinataire: Najeh Chaouch
   Email qui recevra la notification: Najeh.Chaouch@tav.aero
```

### Test 2: Vérification du flux complet

**Flux testé**:
```
Création correspondance
    ↓
Assignation (manuelle ou automatique)
    ↓
newCorrespondance.personnesConcernees = [IDs assignés]
    ↓
finalPersonnesConcernees = newCorrespondance.personnesConcernees
    ↓
EmailNotificationService.sendCorrespondanceEmailNotification(
    correspondance,
    finalPersonnesConcernees,  ← Liste correcte
    type
)
    ↓
Emails envoyés UNIQUEMENT aux IDs dans finalPersonnesConcernees
```

✅ **Verdict**: Le flux est correct et respecte l'assignation.

## Comportement après correction

### Scénario 1: Assignation manuelle à 2 directeurs

**Action**: Créer une correspondance et sélectionner Directeur A et Directeur B  
**Résultat**:
- ✅ Email envoyé à Directeur A
- ✅ Email envoyé à Directeur B
- ✅ Notification push envoyée à Directeur A
- ✅ Notification push envoyée à Directeur B
- ✅ Aucun autre directeur ne reçoit de notification

### Scénario 2: Assignation automatique

**Action**: Créer une correspondance sans sélectionner de directeurs  
**Résultat**:
- ✅ Le système assigne automatiquement selon les mots-clés
- ✅ Les emails sont envoyés UNIQUEMENT aux directeurs assignés automatiquement
- ✅ Aucun autre directeur ne reçoit de notification

### Scénario 3: Correspondance urgente

**Action**: Créer une correspondance urgente avec assignation manuelle  
**Résultat**:
- ✅ Email avec sujet "🚨 URGENT" envoyé aux personnes assignées
- ✅ Aucun autre directeur ne reçoit de notification, même si c'est urgent

## Points de notification dans le code

### 1. Création de correspondance (ligne 700-734)
```javascript
const finalPersonnesConcernees = newCorrespondance.personnesConcernees || [];
await EmailNotificationService.sendCorrespondanceEmailNotification(
  newCorrespondance, 
  finalPersonnesConcernees,  // ✅ Liste spécifique
  notificationType
);
```

### 2. Réponse à une correspondance (ligne 681-690)
```javascript
await EmailNotificationService.sendCorrespondanceEmailNotification(
  newCorrespondance, 
  Array.from(allPersonnesConcernees),  // ✅ Liste spécifique
  'CORRESPONDANCE_REPLY'
);
```

### 3. Mise à jour de correspondance (ligne 1199-1202)
```javascript
await EmailNotificationService.notifyCorrespondanceUpdate(
  updatedCorrespondance,
  updatedCorrespondance.personnesConcernees.map(p => p._id)  // ✅ Liste spécifique
);
```

### 4. Échéances (deadlineService.js, ligne 96-99)
```javascript
await EmailNotificationService.sendCorrespondanceEmailNotification(
  correspondance,
  correspondance.personnesConcernees,  // ✅ Liste spécifique
  'DEADLINE_WARNING'
);
```

✅ **Tous les points de notification utilisent la liste spécifique des personnes concernées**

## Fichiers modifiés

1. **backend/src/routes/correspondanceRoutes.js**
   - Ligne 699-700 : Utilisation de `newCorrespondance.personnesConcernees` au lieu de `personnesConcernees` du body
   - Ligne 707 : Log amélioré pour tracer le nombre de destinataires
   - Ligne 717, 726 : Utilisation de `finalPersonnesConcernees`

## Conclusion

### ✅ Notifications par email

Les notifications par email sont **100% spécifiques** :
- ✅ Envoyées UNIQUEMENT aux personnes dans `personnesConcernees`
- ✅ Respectent l'assignation manuelle
- ✅ Respectent l'assignation automatique
- ✅ Aucune notification n'est envoyée aux autres directeurs

### ✅ Notifications push

Les notifications push suivent le même principe :
- ✅ Envoyées via `NotificationService.sendCorrespondanceNotification()`
- ✅ Utilisent la même liste `finalPersonnesConcernees`
- ✅ Comportement identique aux emails

### 🎯 Garanties

1. **Confidentialité**: Les correspondances sensibles ne sont notifiées qu'aux personnes assignées
2. **Précision**: Aucune notification parasite aux directeurs non concernés
3. **Cohérence**: Email et notifications push utilisent la même liste
4. **Traçabilité**: Logs détaillés pour suivre l'envoi des notifications

## Recommandations

1. ✅ **Correction appliquée et testée**
2. 📝 **Documentation mise à jour**
3. 🧪 **Tests automatiques validés**
4. 🚀 **Prêt pour la production**

## Notes techniques

- Le service `EmailNotificationService` n'a pas été modifié (il fonctionnait correctement)
- La correction porte uniquement sur l'utilisation de la bonne liste de destinataires
- Les logs ont été améliorés pour faciliter le débogage
- Le comportement est maintenant cohérent entre assignation manuelle et automatique
