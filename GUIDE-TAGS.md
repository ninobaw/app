# 🏷️ Guide de Gestion des Tags - AeroDoc

## Vue d'ensemble

Le système de tags d'AeroDoc permet aux super administrateurs de créer et gérer des tags prédéfinis qui seront utilisés pour catégoriser les correspondances. Cette approche garantit la cohérence et évite la prolifération de tags similaires.

## 🎯 Fonctionnalités

### ✅ Gestion des Tags (Super Administrateurs)
- **Création** de nouveaux tags avec nom, couleur et description
- **Modification** des tags existants
- **Activation/Désactivation** des tags
- **Suppression logique** (désactivation) des tags
- **Aperçu en temps réel** lors de la création/modification

### ✅ Utilisation des Tags (Tous les utilisateurs)
- **Sélection** parmi les tags prédéfinis lors de la création de correspondances
- **Filtrage** des correspondances par tags dans la liste
- **Affichage coloré** des tags selon leur couleur définie
- **Compteurs** de correspondances par tag

## 🚀 Initialisation

### 1. Créer les Tags par Défaut

Exécutez le script d'initialisation pour créer 10 tags par défaut :

```bash
# Méthode 1 : Script batch (Windows)
init-tags.bat

# Méthode 2 : Commande directe
cd backend
node src/scripts/init-default-tags.js
```

### 2. Tags par Défaut Créés

| Tag | Couleur | Description |
|-----|---------|-------------|
| `urgent` | 🔴 Rouge | Correspondances nécessitant une attention immédiate |
| `important` | 🟠 Orange | Correspondances importantes à traiter en priorité |
| `confidentiel` | 🔴 Rouge foncé | Correspondances confidentielles |
| `suivi` | 🔵 Bleu | Correspondances nécessitant un suivi |
| `réunion` | 🟣 Indigo | Correspondances liées aux réunions |
| `formation` | 🟢 Vert | Correspondances relatives à la formation |
| `technique` | 🟢 Vert foncé | Correspondances techniques |
| `administratif` | ⚫ Gris | Correspondances administratives |
| `financier` | 🟡 Jaune | Correspondances financières |
| `rh` | 🟣 Violet | Correspondances ressources humaines |

## 🛠️ Utilisation

### Pour les Super Administrateurs

1. **Accéder à la gestion des tags :**
   - Aller dans `Paramètres` > `Tags`
   - Seuls les SUPER_ADMIN ont accès à cet onglet

2. **Créer un nouveau tag :**
   - Cliquer sur "Nouveau tag"
   - Remplir le nom (obligatoire, max 50 caractères)
   - Choisir une couleur dans la palette
   - Ajouter une description (optionnelle, max 200 caractères)
   - Voir l'aperçu en temps réel
   - Cliquer sur "Créer le tag"

3. **Modifier un tag existant :**
   - Cliquer sur l'icône "Modifier" dans la liste
   - Modifier les propriétés souhaitées
   - Activer/désactiver le tag
   - Cliquer sur "Modifier le tag"

4. **Supprimer un tag :**
   - Cliquer sur l'icône "Supprimer" dans la liste
   - Confirmer la suppression
   - Le tag sera désactivé (suppression logique)

### Pour les Utilisateurs

1. **Utiliser les tags lors de la création :**
   - Dans le dialogue de création de correspondance
   - Section "Tags" avec liste déroulante
   - Sélectionner un ou plusieurs tags
   - Les tags apparaissent avec leurs couleurs définies

2. **Filtrer par tags :**
   - Page Correspondances > Section "Tags disponibles"
   - Cliquer sur un tag pour l'ajouter au filtre
   - Les tags sélectionnés sont mis en évidence
   - Compteur de correspondances par tag

3. **Navigation rapide :**
   - Cliquer sur un tag dans la liste des correspondances
   - Filtre automatiquement par ce tag

## 🎨 Couleurs Disponibles

Le système propose 10 couleurs prédéfinies :
- 🔴 Rouge (`#EF4444`)
- 🟠 Orange (`#F97316`)
- 🟡 Jaune (`#EAB308`)
- 🟢 Vert (`#22C55E`)
- 🔵 Bleu (`#3B82F6`)
- 🟣 Indigo (`#6366F1`)
- 🟣 Violet (`#A855F7`)
- 🩷 Rose (`#EC4899`)
- ⚫ Gris (`#6B7280`)
- 🟢 Émeraude (`#059669`)

## 🔒 Permissions

### SUPER_ADMIN
- ✅ Voir tous les tags (actifs et inactifs)
- ✅ Créer de nouveaux tags
- ✅ Modifier tous les tags
- ✅ Supprimer/désactiver des tags
- ✅ Accès à l'interface de gestion complète

### ADMINISTRATOR
- ✅ Voir tous les tags (actifs et inactifs)
- ✅ Créer de nouveaux tags
- ✅ Modifier tous les tags
- ✅ Supprimer/désactiver des tags
- ✅ Accès à l'interface de gestion complète

### Autres Rôles
- ✅ Voir uniquement les tags actifs
- ✅ Utiliser les tags pour les correspondances
- ✅ Filtrer par tags
- ❌ Pas d'accès à la gestion des tags

## 🔧 API Endpoints

### Pour les développeurs

```javascript
// Récupérer les tags actifs (tous les utilisateurs connectés)
GET /api/tags

// Récupérer tous les tags (SUPER_ADMIN uniquement)
GET /api/tags/all

// Créer un nouveau tag (SUPER_ADMIN uniquement)
POST /api/tags
{
  "name": "nouveau-tag",
  "color": "#3B82F6",
  "description": "Description du tag"
}

// Modifier un tag (SUPER_ADMIN uniquement)
PUT /api/tags/:id
{
  "name": "tag-modifie",
  "color": "#22C55E",
  "description": "Nouvelle description",
  "isActive": true
}

// Supprimer un tag (SUPER_ADMIN uniquement)
DELETE /api/tags/:id
```

## 📊 Bonnes Pratiques

### Nommage des Tags
- Utiliser des noms courts et descriptifs
- Éviter les espaces (utiliser des tirets si nécessaire)
- Utiliser une convention cohérente
- Éviter les doublons sémantiques

### Gestion des Couleurs
- Associer des couleurs logiques aux concepts
- Rouge/Orange pour l'urgence
- Vert pour les aspects positifs
- Bleu pour l'information
- Gris pour les aspects neutres

### Organisation
- Créer des tags génériques réutilisables
- Éviter la sur-segmentation
- Réviser périodiquement l'utilisation des tags
- Désactiver les tags obsolètes plutôt que les supprimer

## 🐛 Dépannage

### Tags non visibles
- Vérifier que les tags sont actifs
- Vérifier les permissions utilisateur
- Redémarrer le serveur backend si nécessaire

### Erreurs de création
- Vérifier l'unicité du nom
- Vérifier le format de couleur hexadécimale
- Vérifier les limites de caractères

### Problèmes de filtrage
- Vider le cache du navigateur
- Vérifier la console pour les erreurs JavaScript
- Vérifier la connectivité avec l'API

## 📞 Support

Pour toute question ou problème :
1. Vérifier ce guide d'abord
2. Consulter les logs du serveur
3. Contacter l'équipe de développement

---

**Version :** 1.0  
**Dernière mise à jour :** 25 septembre 2025
