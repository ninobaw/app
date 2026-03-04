# Test de la Recherche - Guide de Débogage

## Date: 3 novembre 2025

## Résultats des tests

### ✅ Tests de la base de données

La recherche fonctionne **parfaitement** au niveau de la base de données :

```
✅ Recherche par code: Fonctionnelle
✅ Recherche multi-champs: Fonctionnelle  
✅ Recherche insensible à la casse: Fonctionnelle
✅ Performance: 4ms (excellent)
✅ Index sur le champ "code": Existe
```

**Conclusion** : Le problème ne vient PAS de la base de données.

## Problèmes potentiels

### 1. Filtrage par rôle

Si vous êtes connecté en tant que **DIRECTEUR** ou **SOUS_DIRECTEUR**, la recherche est combinée avec les conditions de rôle :

```javascript
// Conditions de rôle pour directeurs
roleConditions = [
  { assignedTo: userId },
  { personnesConcernees: userId },
  { assignedTo: { $exists: false } },
  { assignedTo: null }
];

// Combiné avec la recherche
filter.$and = [
  { $or: roleConditions },      // DOIT correspondre à une de ces conditions
  { $or: searchConditions }     // ET à une des conditions de recherche
];
```

**Problème** : Si la correspondance n'est pas assignée au directeur, elle ne sera pas trouvée même si elle correspond à la recherche.

### 2. Exclusion des réponses

Par défaut, les réponses sont exclues :

```javascript
if (includeReplies !== 'true') {
  filter.parentCorrespondanceId = { $exists: false };
}
```

## Solutions

### Solution 1 : Tester avec un compte admin

Connectez-vous avec un compte **SUPER_ADMIN** ou **AGENT_BUREAU_ORDRE** pour tester la recherche sans restriction de rôle.

**Comptes à tester** :
- SUPER_ADMIN
- ADMINISTRATOR
- AGENT_BUREAU_ORDRE
- SUPERVISEUR_BUREAU_ORDRE

### Solution 2 : Vérifier les logs du serveur

Lors d'une recherche, le serveur affiche des logs détaillés :

```
🔍 [SEARCH] Recherche avec terme: "MD25-188" (incluant le code)
🔍 [SEARCH] Combinaison rôle + recherche pour DIRECTEUR
🔍 Filtre appliqué pour DIRECTEUR: { ... }
```

**Comment vérifier** :
1. Ouvrir la console du serveur backend
2. Faire une recherche dans le frontend
3. Regarder les logs qui apparaissent
4. Vérifier le filtre appliqué

### Solution 3 : Tester l'API directement

#### Test avec curl (Windows PowerShell)

```powershell
# Remplacer YOUR_TOKEN par votre token JWT
$token = "YOUR_TOKEN_HERE"

# Test de recherche par code
Invoke-RestMethod -Uri "http://localhost:5000/api/correspondances?search=MD25-188" `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -Method Get
```

#### Test avec curl (Linux/Mac)

```bash
# Remplacer YOUR_TOKEN par votre token JWT
TOKEN="YOUR_TOKEN_HERE"

# Test de recherche par code
curl -X GET "http://localhost:5000/api/correspondances?search=MD25-188" \
  -H "Authorization: Bearer $TOKEN"
```

#### Résultat attendu

```json
{
  "success": true,
  "data": [
    {
      "_id": "6902021512f4faabd0226652",
      "code": "MD25-188",
      "title": "Notification de démarrage des travaux...",
      "type": "OUTGOING",
      "status": "INFORMATIF"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Solution 4 : Vérifier le frontend

#### Vérifier la requête envoyée

Ouvrir les DevTools du navigateur (F12) :

1. Aller dans l'onglet **Network** (Réseau)
2. Faire une recherche
3. Regarder la requête `correspondances?search=...`
4. Vérifier :
   - Le paramètre `search` est bien envoyé
   - Le token d'authentification est présent
   - La réponse du serveur

#### Code frontend typique

```javascript
// Exemple de code frontend
const searchCorrespondances = async (searchTerm) => {
  const response = await fetch(
    `/api/correspondances?search=${encodeURIComponent(searchTerm)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const data = await response.json();
  return data;
};
```

## Diagnostic étape par étape

### Étape 1 : Vérifier que le serveur reçoit la requête

**Logs attendus** :
```
✅ Rôle DIRECTEUR autorisé pour accéder aux correspondances
🔍 [SEARCH] Recherche avec terme: "MD25-188" (incluant le code)
```

**Si absent** : Le frontend n'envoie pas la requête correctement.

### Étape 2 : Vérifier le filtre appliqué

**Log attendu** :
```
🔍 Filtre appliqué pour DIRECTEUR: {
  "$and": [
    {
      "$or": [
        { "assignedTo": "..." },
        { "personnesConcernees": "..." }
      ]
    },
    {
      "$or": [
        { "title": { "$regex": "MD25-188", "$options": "i" } },
        { "code": { "$regex": "MD25-188", "$options": "i" } }
      ]
    }
  ]
}
```

**Si le filtre est trop restrictif** : Le problème vient des conditions de rôle.

### Étape 3 : Vérifier les résultats

**Log attendu** :
```
Résultats trouvés: 1 correspondance(s)
```

**Si 0 résultat** : La correspondance ne correspond pas aux conditions de rôle.

## Correction pour les directeurs

Si le problème persiste pour les directeurs, nous pouvons modifier la logique pour que la recherche soit moins restrictive :

### Option A : Recherche dans toutes les correspondances visibles

```javascript
// Pour les directeurs : recherche dans TOUTES les correspondances
// (pas seulement celles assignées)
if (req.user.role === 'DIRECTEUR' || req.user.role === 'SOUS_DIRECTEUR') {
  if (search) {
    // Si recherche active, ignorer les restrictions de rôle
    filter.$or = searchConditions;
  } else {
    // Si pas de recherche, appliquer les restrictions de rôle
    filter.$or = roleConditions;
  }
}
```

### Option B : Élargir les conditions de rôle

```javascript
// Ajouter une condition pour voir toutes les correspondances INFORMATIF
roleConditions.push({ status: 'INFORMATIF' });
```

## Commandes de débogage

### 1. Vérifier les correspondances dans la base

```bash
node backend/test-search-functionality.js
```

### 2. Tester l'API avec Postman

1. Créer une requête GET
2. URL : `http://localhost:5000/api/correspondances?search=MD25-188`
3. Headers : `Authorization: Bearer YOUR_TOKEN`
4. Envoyer la requête

### 3. Vérifier les logs du serveur

```bash
# Redémarrer le serveur avec logs détaillés
cd backend
npm run dev
```

## Checklist de vérification

- [ ] Le serveur backend est démarré
- [ ] Le frontend envoie bien le paramètre `search`
- [ ] Le token d'authentification est valide
- [ ] Les logs du serveur s'affichent
- [ ] Le filtre appliqué est visible dans les logs
- [ ] La correspondance existe dans la base de données
- [ ] Le code de la correspondance est correct (`MD25-188`)
- [ ] L'utilisateur a les permissions nécessaires

## Résolution rapide

### Si vous êtes DIRECTEUR/SOUS_DIRECTEUR

**Problème** : Vous ne voyez pas les résultats de recherche car les correspondances ne vous sont pas assignées.

**Solution temporaire** : Demander à un admin de vous assigner la correspondance.

**Solution permanente** : Modifier le code pour permettre la recherche dans toutes les correspondances (voir Option A ci-dessus).

### Si vous êtes ADMIN/BUREAU_ORDRE

La recherche devrait fonctionner sans restriction. Si ce n'est pas le cas :

1. Vérifier que le paramètre `search` est bien envoyé
2. Vérifier les logs du serveur
3. Vérifier la réponse de l'API dans les DevTools

## Contact

Si le problème persiste après avoir suivi ce guide, fournir :

1. Les logs du serveur lors de la recherche
2. Le rôle de l'utilisateur connecté
3. Le terme de recherche utilisé
4. La réponse de l'API (visible dans les DevTools)

---

*Document généré le 3 novembre 2025*  
*TAV Tunisie - Système de Gestion Documentaire (SGDO)*
