# 🧹 Guide des Scripts de Nettoyage

## 🎯 **Vue d'ensemble**

Trois scripts de nettoyage sont disponibles pour préparer l'application aux tests avec des correspondances réelles :

1. **🧹 Nettoyage COMPLET** - Supprime tout
2. **⚡ Nettoyage RAPIDE** - Supprime uniquement les correspondances
3. **🔄 Réinitialisation STATUTS** - Remet à zéro les workflows

## 📋 **Scripts disponibles**

### **1. 🧹 Nettoyage Complet**
**Fichier :** `backend/src/scripts/clean-application.js`

#### **Ce qui est supprimé :**
- ✅ **Toutes les correspondances**
- ✅ **Toutes les réponses**
- ✅ **Tous les fichiers uploads**
- ✅ **Toutes les notifications utilisateurs**
- ✅ **Données de workflow utilisateurs**
- ✅ **Logs système**

#### **Ce qui est préservé :**
- ✅ **Utilisateurs** (comptes et mots de passe)
- ✅ **Rôles et permissions**
- ✅ **Configuration système**

#### **Utilisation :**
```bash
# Avec confirmation
node backend/src/scripts/clean-application.js

# Sans confirmation (mode force)
node backend/src/scripts/clean-application.js --force
```

### **2. ⚡ Nettoyage Rapide**
**Fichier :** `backend/src/scripts/quick-clean.js`

#### **Ce qui est supprimé :**
- ✅ **Correspondances uniquement**
- ✅ **Réponses associées**
- ✅ **Fichiers de correspondances**

#### **Ce qui est préservé :**
- ✅ **Utilisateurs et notifications**
- ✅ **Structure des dossiers**
- ✅ **Logs système**

#### **Utilisation :**
```bash
node backend/src/scripts/quick-clean.js
```

### **3. 🔄 Réinitialisation Statuts**
**Fichier :** `backend/src/scripts/reset-status.js`

#### **Ce qui est réinitialisé :**
- ✅ **Statuts** → `PENDING`
- ✅ **WorkflowStatus** → `DRAFT_PENDING`
- ✅ **Réponses et brouillons** supprimés
- ✅ **Historique** effacé
- ✅ **Notifications** nettoyées

#### **Ce qui est préservé :**
- ✅ **Correspondances** (titre, contenu, fichiers)
- ✅ **Utilisateurs**
- ✅ **Structure complète**

#### **Utilisation :**
```bash
node backend/src/scripts/reset-status.js
```

## 🖥️ **Interface Windows - Batch**

### **Fichier :** `clean-app.bat`

#### **Menu interactif :**
```
========================================
   NETTOYAGE APPLICATION AERO-DOC-FLOW
========================================

Choisissez le type de nettoyage:

1. Nettoyage COMPLET (tout supprimer)
2. Nettoyage RAPIDE (correspondances seulement)
3. Annuler

Votre choix (1-3):
```

#### **Utilisation :**
```bash
# Double-clic sur le fichier ou :
clean-app.bat
```

## 🎯 **Cas d'usage**

### **🧪 Préparation tests complets**
```bash
# Nettoyage complet pour repartir de zéro
node backend/src/scripts/clean-application.js --force
```
**Quand utiliser :** Avant de tester avec des vraies correspondances, démonstrations clients

### **⚡ Tests de développement**
```bash
# Nettoyage rapide entre les tests
node backend/src/scripts/quick-clean.js
```
**Quand utiliser :** Pendant le développement, tests répétés du workflow

### **🔄 Tests de workflow**
```bash
# Réinitialiser pour retester le même workflow
node backend/src/scripts/reset-status.js
```
**Quand utiliser :** Tester différents chemins de workflow sur les mêmes données

## 📊 **Rapports de nettoyage**

### **Exemple de rapport complet :**
```
============================================================
📊 RAPPORT DE NETTOYAGE
============================================================
📧 Correspondances supprimées: 15
📤 Réponses supprimées: 8
📄 Fichiers supprimés: 42
🗂️  Dossiers supprimés: 12
🔔 Notifications nettoyées: 25
👥 Utilisateurs mis à jour: 9

✅ NETTOYAGE TERMINÉ SANS ERREUR

🎯 APPLICATION PRÊTE POUR TESTS RÉELS
============================================================
```

### **Exemple de rapport rapide :**
```
========================================
🧹 NETTOYAGE RAPIDE EN COURS...
========================================
✅ Connexion MongoDB
📧 15 correspondances supprimées
📤 8 réponses supprimées
📄 42 fichiers supprimés
========================================
✅ NETTOYAGE RAPIDE TERMINÉ
Total: 65 éléments supprimés
```

## 🔒 **Sécurité et précautions**

### **⚠️ Confirmations de sécurité :**

#### **Nettoyage complet :**
```
⚠️  ATTENTION: Cette opération va supprimer TOUTES les correspondances et fichiers !
📋 Éléments qui seront supprimés:
   - Toutes les correspondances
   - Toutes les réponses
   - Tous les fichiers uploads
   - Toutes les notifications
   - Données de workflow utilisateurs
   - Logs système

Êtes-vous sûr de vouloir continuer ? (tapez "OUI" pour confirmer):
```

#### **Mode force :**
```bash
# Bypass la confirmation (pour scripts automatisés)
node backend/src/scripts/clean-application.js --force
```

### **🛡️ Protections intégrées :**
- ✅ **Confirmation obligatoire** pour nettoyage complet
- ✅ **Préservation des utilisateurs** et rôles
- ✅ **Recréation automatique** de la structure uploads
- ✅ **Fichiers .gitkeep** pour préserver les dossiers vides
- ✅ **Logs détaillés** de toutes les opérations

## 🚀 **Workflow recommandé**

### **Pour une démonstration client :**
```bash
1. node backend/src/scripts/clean-application.js
2. Créer 2-3 correspondances réelles
3. Tester le workflow complet
4. Présenter l'application propre
```

### **Pour le développement :**
```bash
1. node backend/src/scripts/quick-clean.js
2. Tester les nouvelles fonctionnalités
3. Répéter selon les besoins
```

### **Pour les tests de workflow :**
```bash
1. Créer des correspondances de test
2. node backend/src/scripts/reset-status.js
3. Tester différents scénarios
4. Répéter avec les mêmes données
```

## 📁 **Structure après nettoyage**

### **Dossiers uploads recréés :**
```
uploads/
├── correspondances/
│   ├── ENFIDHA/
│   │   ├── Arrivee/ (.gitkeep)
│   │   └── Depart/ (.gitkeep)
│   ├── MONASTIR/
│   │   ├── Arrivee/ (.gitkeep)
│   │   └── Depart/ (.gitkeep)
│   └── GENERALE/
│       ├── Arrivee/ (.gitkeep)
│       └── Depart/ (.gitkeep)
├── responses/ (.gitkeep)
├── discharge/ (.gitkeep)
└── temp/ (.gitkeep)
```

## 💡 **Conseils d'utilisation**

### **✅ Bonnes pratiques :**
- **Toujours** faire une sauvegarde avant nettoyage complet
- **Utiliser** le nettoyage rapide pour les tests fréquents
- **Réinitialiser** les statuts pour tester différents workflows
- **Vérifier** les logs en cas d'erreur

### **❌ À éviter :**
- Ne pas utiliser `--force` sans être sûr
- Ne pas nettoyer en production
- Ne pas oublier de redémarrer le serveur après nettoyage
- Ne pas supprimer manuellement les fichiers (utiliser les scripts)

---

**Ces scripts garantissent un environnement propre pour tester l'application avec des correspondances réelles ! 🧹✨**
