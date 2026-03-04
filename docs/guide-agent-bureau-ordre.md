# 📥 Guide d'Utilisation - Agent Bureau d'Ordre

## 🎯 Vue d'Ensemble du Rôle

L'**Agent Bureau d'Ordre** est le point d'entrée de toutes les correspondances. Il assure la réception, l'enregistrement, la classification et l'assignation aux directeurs compétents.

---

## 📊 Dashboard Principal

### Interface d'Accueil
> **📸 Capture d'écran requise** : Dashboard principal de l'agent

**Éléments visibles :**
- 📊 **Statistiques du jour** : Correspondances reçues, assignées
- ➕ **Bouton "Nouvelle Correspondance"**
- 📋 **Liste des correspondances récentes**
- 🔍 **Barre de recherche** et filtres

**Métriques affichées :**
- 📥 **Correspondances reçues** aujourd'hui
- 🎯 **Assignations effectuées**
- ⏳ **En cours de traitement**
- ⏰ **Délais critiques**

---

## ➕ Enregistrement de Nouvelle Correspondance

### Formulaire de Saisie
> **📸 Capture d'écran requise** : Formulaire d'ajout de correspondance

```
┌─────────────────────────────────────────────────────────┐
│ ➕ NOUVELLE CORRESPONDANCE                              │
├─────────────────────────────────────────────────────────┤
│ 📧 Informations de Base                                │
│ Expéditeur: [Ministère des Transports            ▼]   │
│ Destinataire: [DGAC Enfidha                      ▼]   │
│ Objet: [_________________________________]            │
│ Date réception: [01/10/2025] Heure: [09:15]           │
│                                                         │
│ 🏷️ Classification                                      │
│ Priorité: [🔴 Urgent ▼] Type: [📋 Réglementaire ▼]    │
│ Direction: [🛡️ Sécurité Aéroportuaire ▼]             │
│                                                         │
│ 📎 Pièces Jointes                                      │
│ [📁 Glisser-déposer ou cliquer pour ajouter]          │
│                                                         │
│ 📝 Notes Internes                                      │
│ [_________________________________________]            │
│                                                         │
│ [💾 Enregistrer] [🎯 Enregistrer et Assigner]         │
└─────────────────────────────────────────────────────────┘
```

### Champs Obligatoires
- ✅ **Expéditeur** : Sélection dans la liste ou saisie libre
- ✅ **Objet** : Description claire et concise
- ✅ **Priorité** : Urgent, Normal, Faible
- ✅ **Type** : Réglementaire, Commercial, Technique, Administratif
- ✅ **Direction concernée** : Pour pré-assignation

---

## 📎 Gestion des Pièces Jointes

### Interface d'Upload
> **📸 Capture d'écran requise** : Zone de glisser-déposer des fichiers

**Fonctionnalités :**
- 📁 **Glisser-déposer** multiple
- 🔍 **Prévisualisation** des fichiers
- 📊 **Indicateur de taille** et format
- ❌ **Suppression** individuelle

**Formats acceptés :**
- 📄 **Documents** : PDF, DOC, DOCX, TXT
- 🖼️ **Images** : JPG, PNG, TIFF
- 📊 **Tableaux** : XLS, XLSX, CSV

---

## 🎯 Assignation aux Directeurs

### Interface d'Assignation
> **📸 Capture d'écran requise** : Dialog d'assignation

```
┌─────────────────────────────────────────────────────────┐
│ 🎯 ASSIGNER LA CORRESPONDANCE                           │
├─────────────────────────────────────────────────────────┤
│ 📋 Correspondance: [Titre affiché]                     │
│ 🏷️ Priorité: 🔴 Urgent | Type: 📋 Réglementaire       │
├─────────────────────────────────────────────────────────┤
│ 👤 Sélection du Directeur                              │
│ Direction: [🛡️ Sécurité Aéroportuaire        ▼]       │
│ Directeur: [Ahmed Ben Salem                   ▼]       │
│                                                         │
│ ⏰ Délai de Traitement                                  │
│ Date limite: [03/10/2025] (48h réglementaires)        │
│ Rappel: [📧 Email + 🔔 Notification]                   │
│                                                         │
│ 📝 Instructions Spéciales                              │
│ [_________________________________________]            │
│                                                         │
│ [🎯 Confirmer l'Assignation]                           │
└─────────────────────────────────────────────────────────┘
```

### Critères d'Assignation
1. **Compétence technique** du directeur
2. **Charge de travail** actuelle
3. **Délais** de traitement habituels
4. **Spécialisation** par type de correspondance

---

## 📊 Tableau de Suivi

### Vue d'Ensemble des Assignations
> **📸 Capture d'écran requise** : Tableau de suivi avec filtres

```
┌─────────────────────────────────────────────────────────┐
│ 📊 SUIVI DES CORRESPONDANCES                           │
├─────────────────────────────────────────────────────────┤
│ 🔍 Filtres: [Toutes ▼] [Cette semaine ▼] [🔴 Urgent ▼] │
├─────────────────────────────────────────────────────────┤
│ Correspondance          │Directeur     │Status    │Délai │
│ ─────────────────────────────────────────────────────── │
│ 🔴 Inspection sécurité  │A. Ben Salem  │📝 Brouillon│2j  │
│ 🟡 Autorisation vol     │M. Trabelsi   │✅ Validé   │✓   │
│ 🟢 Certification pilote │S. Mansouri   │⏳ Attente  │5j  │
│ 🔴 Maintenance équip.   │K. Jemli      │🔄 Révision │1j  │
└─────────────────────────────────────────────────────────┘
```

### Codes Couleur des Statuts
- 🔴 **Rouge** : Urgent, délai critique
- 🟡 **Orange** : Attention, délai serré
- 🟢 **Vert** : Normal, dans les délais
- ⚫ **Gris** : Terminé, archivé

---

## 🔔 Notifications et Alertes

### Système d'Alertes
> **📸 Capture d'écran requise** : Panneau de notifications

**Types de notifications :**
- ⏰ **Rappels de délai** : 24h, 6h, 1h avant échéance
- ✅ **Confirmations** : Assignation effectuée
- 🔄 **Mises à jour** : Changement de statut
- 🚨 **Urgences** : Correspondances critiques

### Configuration des Alertes
- 📧 **Email** : Notifications par mail
- 🔔 **Push** : Notifications navigateur
- 📱 **SMS** : Pour les urgences (optionnel)

---

## 🔍 Recherche et Filtres

### Interface de Recherche
> **📸 Capture d'écran requise** : Barre de recherche avancée

**Critères de recherche :**
- 📝 **Texte libre** : Objet, contenu, expéditeur
- 📅 **Période** : Date de réception
- 🏷️ **Priorité** : Urgent, Normal, Faible
- 👤 **Directeur assigné**
- 📊 **Statut** : En cours, Validé, Révision, etc.

### Filtres Rapides
- 🔴 **Urgences** : Correspondances prioritaires
- ⏰ **Délais courts** : < 24h restantes
- 📥 **Nouvelles** : Reçues aujourd'hui
- ⏳ **En retard** : Dépassement de délai

---

## 📊 Rapports et Statistiques

### Dashboard Analytique
> **📸 Capture d'écran requise** : Section rapports

**Métriques disponibles :**
- 📈 **Volume** : Correspondances par jour/semaine/mois
- ⏱️ **Délais** : Temps moyen de traitement
- 👥 **Répartition** : Par directeur, par direction
- 🎯 **Performance** : Taux de respect des délais

### Exports
- 📊 **Excel** : Données tabulaires
- 📄 **PDF** : Rapports formatés
- 📧 **Email** : Envoi automatique des rapports

---

## 🎯 Bonnes Pratiques

### ✅ Enregistrement Efficace
1. **Vérification** de la complétude des informations
2. **Classification** précise selon les critères
3. **Scan qualité** des pièces jointes
4. **Notes internes** détaillées si nécessaire

### 🎯 Assignation Optimale
1. **Analyse** du contenu technique
2. **Vérification** de la disponibilité du directeur
3. **Délais réalistes** selon la complexité
4. **Instructions claires** pour le traitement

### 📊 Suivi Proactif
1. **Monitoring** quotidien des délais
2. **Relances** préventives si nécessaire
3. **Coordination** entre les services
4. **Escalade** vers la hiérarchie si blocage

---

## 🚨 Gestion des Urgences

### Procédure d'Urgence
> **📸 Capture d'écran requise** : Interface de traitement urgent

**Étapes spéciales :**
1. 🚨 **Marquage urgent** immédiat
2. 📞 **Contact direct** du directeur concerné
3. ⏰ **Délai réduit** (2-6h selon le cas)
4. 🔔 **Notifications multiples** (Email + SMS + Push)

### Escalade Hiérarchique
- 👔 **Directeur** : Premier niveau
- 👑 **Directeur Général** : Si blocage
- 🔧 **Superviseur BO** : Pour coordination

---

## 📱 Interface Mobile

### Application Mobile
> **📸 Capture d'écran requise** : Version mobile

**Fonctionnalités mobiles :**
- 📱 **Enregistrement rapide** via smartphone
- 📷 **Photo** directe des documents
- 🔔 **Notifications push** en temps réel
- 📊 **Consultation** du tableau de bord

---

## 🔐 Sécurité et Conformité

### Gestion des Accès
- 🔐 **Authentification** sécurisée
- 👥 **Profils utilisateur** avec permissions
- 📝 **Traçabilité** complète des actions
- 🛡️ **Protection** des données sensibles

### Archivage
- 📚 **Conservation** automatique
- 🔍 **Recherche** dans les archives
- 📄 **Export** pour audit
- 🗓️ **Purge** selon réglementation

---

## 📞 Support et Formation

### Ressources Disponibles
- 📚 **Manuel utilisateur** détaillé
- 🎥 **Tutoriels vidéo** par fonctionnalité
- 💡 **FAQ** mise à jour
- 📞 **Support technique** : support@dgac-enfidha.tn

### Formation Continue
- 🎓 **Sessions** de formation régulières
- 📋 **Nouveautés** du système
- 🏆 **Bonnes pratiques** partagées
- 📊 **Retours d'expérience**

---

*Ce guide sera enrichi avec les captures d'écran réelles de l'application une fois déployée.*
