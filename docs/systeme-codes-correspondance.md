# 🔢 Système de Codes de Correspondance

## 📋 **Spécifications des Codes**

Le système génère automatiquement des codes uniques pour chaque correspondance selon le format suivant :

### **🏢 Aéroport d'Enfidha**
- **Correspondances entrantes** : `A-YY-XXX`
  - Exemple : `A-24-001`, `A-24-002`, etc.
- **Correspondances sortantes** : `D-YY-XXX`
  - Exemple : `D-24-001`, `D-24-002`, etc.

### **✈️ Aéroport de Monastir**
- **Correspondances entrantes** : `MA-YY-XXX`
  - Exemple : `MA-24-001`, `MA-24-002`, etc.
- **Correspondances sortantes** : `MD-YY-XXX`
  - Exemple : `MD-24-001`, `MD-24-002`, etc.

## 🔧 **Format Détaillé**

```
[PRÉFIXE]-[ANNÉE]-[NUMÉRO]
```

- **PRÉFIXE** : 
  - `A` = Arrivée (Enfidha entrante)
  - `D` = Départ (Enfidha sortante)
  - `MA` = Monastir Arrivée (Monastir entrante)
  - `MD` = Monastir Départ (Monastir sortante)

- **ANNÉE** : Deux derniers chiffres de l'année courante (ex: 24 pour 2024)

- **NUMÉRO** : Numéro séquentiel sur 3 chiffres avec zéros (001, 002, 003...)

## 🚀 **Fonctionnalités**

### **1. Saisie Manuelle Obligatoire**
- **Code obligatoire** : Chaque correspondance doit avoir un code
- **Format strict** : Validation du format selon les spécifications
- **Unicité garantie** : Vérification automatique des doublons

### **2. Validation en Temps Réel**
- **Validation instantanée** : Vérification du format pendant la saisie
- **Indicateurs visuels** : Bordures colorées et icônes de validation
- **Messages explicites** : Aide contextuelle pour corriger les erreurs

### **3. Interface Utilisateur**
- **Champ obligatoire** : Marqué avec astérisque (*)
- **Format dynamique** : Aperçu du format attendu selon type/aéroport
- **Validation avant soumission** : Blocage si format invalide

## 🔄 **API Endpoints**

### **Validation de Code**
```http
POST /api/correspondances/validate-code
```

**Body :**
```json
{
  "code": "A-24-001",
  "type": "INCOMING",
  "airport": "ENFIDHA"
}
```

**Réponse (succès) :**
```json
{
  "success": true,
  "message": "Format valide.",
  "isValid": true
}
```

**Réponse (erreur format) :**
```json
{
  "success": false,
  "message": "Format invalide. Le code doit respecter le format: A-24-XXX (ex: A-24-001)"
}
```

**Réponse (code existant) :**
```json
{
  "success": false,
  "message": "Le code \"A-24-001\" existe déjà. Veuillez choisir un autre code."
}
```

### **Création avec Code**
```http
POST /api/correspondances/
```

**Body :**
```json
{
  "title": "Titre de la correspondance",
  "type": "INCOMING",
  "airport": "ENFIDHA",
  "code": "A-24-001",
  // ... autres champs
}
```

## 🛠️ **Implémentation Backend**

### **Fonctions Principales**

#### `generateCorrespondanceCode(type, airport, numero)`
Génère un code selon le format spécifié.

#### `getNextSequentialNumber(type, airport)`
Trouve le prochain numéro séquentiel disponible.

#### `generateAutoCorrespondanceCode(type, airport)`
Génère automatiquement un code complet.

### **Validation**
- Vérification d'unicité des codes manuels
- Gestion des erreurs de génération
- Fallback en cas d'échec

## 🎨 **Interface Frontend**

### **Champ Code**
- Input avec placeholder informatif
- Bouton "Générer" avec icône et animation
- Format dynamique selon sélection type/aéroport
- Messages d'aide contextuels

### **États d'Interface**
- **Vide** : Génération automatique au backend
- **En cours** : Animation de chargement
- **Généré** : Code affiché avec succès
- **Erreur** : Message d'erreur explicite

## 🧪 **Tests**

### **Script de Test**
```bash
node backend/test-code-generation.js
```

**Fonctionnalités testées :**
- Génération pour tous les types/aéroports
- Numérotation séquentielle
- Vérification des codes existants
- Gestion des erreurs

### **Cas de Test**
- ✅ Enfidha entrante : `A-24-001`
- ✅ Enfidha sortante : `D-24-001`
- ✅ Monastir entrante : `MA-24-001`
- ✅ Monastir sortante : `MD-24-001`

## 📊 **Exemples d'Utilisation**

### **Scénario 1 : Génération Automatique**
1. Utilisateur sélectionne "Correspondance reçue" + "Enfidha"
2. Clique sur "Générer"
3. Système génère `A-24-001` (ou le prochain disponible)

### **Scénario 2 : Saisie Manuelle**
1. Utilisateur tape directement `A-24-005`
2. Système vérifie l'unicité
3. Accepte si disponible, rejette si existant

### **Scénario 3 : Soumission sans Code**
1. Utilisateur laisse le champ vide
2. Backend génère automatiquement lors de la création
3. Code assigné et retourné dans la réponse

## 🔒 **Sécurité et Robustesse**

- **Unicité garantie** : Vérification en base de données
- **Gestion d'erreurs** : Messages explicites pour l'utilisateur
- **Fallback** : Génération automatique si échec manuel
- **Validation** : Format et existence vérifiés côté backend

## 📈 **Statistiques et Monitoring**

Le système permet de :
- Suivre le nombre de correspondances par type/aéroport
- Identifier les pics d'activité
- Générer des rapports annuels
- Détecter les anomalies de numérotation

---

**Status :** ✅ Implémenté et fonctionnel
**Version :** 1.0
**Dernière mise à jour :** Octobre 2024
