# 🤖 Système d'Assignation Intelligente des Tags

## 📋 Description

Ce système analyse automatiquement le contenu de vos correspondances et assigne les tags les plus pertinents en se basant sur votre table `Tags` existante. Il utilise un algorithme intelligent qui calcule des scores de pertinence pour chaque tag.

## 🧠 Comment ça fonctionne

### 1. Analyse du Contenu
Le système extrait et analyse :
- Le sujet de la correspondance
- Le contenu/description
- Les adresses expéditeur et destinataire
- Tous les champs textuels disponibles

### 2. Extraction des Mots-clés
- Suppression des mots vides (le, la, de, etc.)
- Extraction des mots significatifs (> 2 caractères)
- Conservation des accents français
- Filtrage des nombres purs

### 3. Calcul des Scores de Pertinence
Pour chaque tag de votre base de données, le système calcule un score basé sur :

#### 🎯 Correspondance Exacte (50 points)
- Le nom du tag apparaît exactement dans le texte
- Ex: tag "urgent" trouvé dans "correspondance urgente"

#### 🔑 Correspondance de Mots-clés (10-20 points)
- Mots-clés du tag matchent avec ceux de la correspondance
- Correspondance exacte : 20 points
- Correspondance partielle : 10 points

#### 📝 Similarité avec Description (0-30 points)
- Comparaison entre la description du tag et le contenu
- Utilise un algorithme de similarité textuelle

#### ⚡ Bonus Patterns (25 points)
- Reconnaissance de patterns spécifiques :
  - "urgent" : urgent|priorité|immédiat|critique|asap
  - "confidentiel" : confidentiel|secret|privé|classé
  - "technique" : technique|maintenance|réparation|équipement
  - "financier" : financier|finance|budget|facture|paiement
  - etc.

### 4. Sélection des Tags
- **Seuil minimum** : 15 points
- **Maximum par correspondance** : 3 tags
- **Tri** : Par score décroissant

## 🚀 Utilisation

### Interface Principale
```bash
manage-tags.bat
```

### Scripts Individuels
```bash
# 1. Tester l'analyse (sans modification)
test-smart-analysis.bat

# 2. Sauvegarder les tags actuels
backup-tags.bat

# 3. Assignation intelligente
smart-tag-assignment.bat
```

## 📊 Exemple de Fonctionnement

### Correspondance d'Exemple :
```
Sujet: "Correspondance urgente de la police"
Contenu: "Incident de sécurité nécessitant intervention immédiate"
De: "police.nationale@interieur.tn"
```

### Tags dans votre Base :
- `urgent` (description: "Correspondances nécessitant attention immédiate")
- `confidentiel` (description: "Correspondances confidentielles")
- `technique` (description: "Correspondances techniques")
- `administratif` (description: "Correspondances administratives")

### Calcul des Scores :
- **urgent** : 95 points
  - Correspondance exacte "urgent" : 50 pts
  - Pattern urgent/immédiat : 25 pts
  - Similarité description : 20 pts
- **confidentiel** : 30 points
  - Contexte sécurité/police : 30 pts
- **technique** : 5 points
  - Faible pertinence
- **administratif** : 8 points
  - Faible pertinence

### Résultat : `[urgent, confidentiel]`

## ⚙️ Configuration

### Seuils Ajustables
Dans `smart-tag-assignment.js` :
```javascript
const minScore = 15;     // Score minimum pour assigner un tag
const maxTags = 3;       // Maximum de tags par correspondance
```

### Patterns Personnalisables
Vous pouvez ajouter vos propres patterns dans `bonusPatterns` :
```javascript
const bonusPatterns = {
  'votre-tag': /pattern1|pattern2|pattern3/i,
  // ...
};
```

## 🔒 Sécurité

### Sauvegarde Automatique
- Tous les tags actuels sont sauvegardés avant modification
- Fichiers dans `backend/backups/tags-backup-[timestamp].json`

### Restauration Possible
```bash
# Lister les sauvegardes
dir backend\backups\tags-backup-*.json

# Restaurer
cd backend
node src/scripts/restore-tags.js tags-backup-[timestamp].json
```

## 📈 Avantages

### ✅ Intelligent
- Analyse contextuelle avancée
- Algorithme de scoring multi-critères
- Reconnaissance de patterns

### ✅ Flexible
- Utilise VOS tags existants
- Pas de mapping manuel requis
- S'adapte à votre vocabulaire

### ✅ Sécurisé
- Test sans modification
- Sauvegarde automatique
- Restauration possible

### ✅ Performant
- Traitement en lot
- Logs détaillés
- Statistiques complètes

## 🎯 Cas d'Usage Typiques

### Police/Sécurité → `[urgent, confidentiel, suivi]`
### Formation → `[formation, technique]`
### Finance → `[financier, administratif]`
### Maintenance → `[technique, suivi]`
### RH → `[rh, administratif]`

## 🔧 Dépannage

### Aucun Tag Assigné
- Vérifiez que des tags existent dans votre base
- Réduisez le `minScore` si nécessaire
- Vérifiez le contenu des correspondances

### Scores Trop Faibles
- Ajoutez des descriptions aux tags
- Enrichissez les patterns bonus
- Vérifiez l'orthographe des tags

### Trop de Tags Assignés
- Augmentez le `minScore`
- Réduisez le `maxTags`
- Affinez les descriptions des tags

## 📞 Support

Le système génère des logs détaillés pour chaque correspondance analysée. En cas de problème, consultez les scores calculés pour comprendre le comportement de l'algorithme.
