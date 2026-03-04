# Explication : Recherche par Code pour Tous les Rôles

## Date: 3 novembre 2025

## Question

Pourquoi la recherche par code semble être appliquée uniquement pour les directeurs ?

## Réponse

La recherche par code est **bien appliquée pour TOUS les rôles**. Voici l'explication détaillée :

## Code de recherche (ligne 972-982)

```javascript
// Conditions de recherche
if (search) {
  searchConditions = [
    { title: { $regex: search, $options: 'i' } },
    { subject: { $regex: search, $options: 'i' } },
    { content: { $regex: search, $options: 'i' } },
    { from_address: { $regex: search, $options: 'i' } },
    { to_address: { $regex: search, $options: 'i' } },
    { code: { $regex: search, $options: 'i' } } // ✅ Pour TOUS les rôles
  ];
  console.log(`🔍 [SEARCH] Recherche avec terme: "${search}" (incluant le code)`);
}
```

**Ce code s'exécute pour TOUS les utilisateurs**, quel que soit leur rôle.

## Comportement par rôle

### 1. SUPER_ADMIN / ADMINISTRATOR / AGENT_BUREAU_ORDRE / SUPERVISEUR_BUREAU_ORDRE

**Code** (ligne 998-1001) :
```javascript
else if (searchConditions.length > 0) {
  // Seulement des conditions de recherche (pour admin/bureau ordre)
  filter.$or = searchConditions;
  console.log(`🔍 [SEARCH] Recherche sans restriction de rôle`);
}
```

**Résultat** :
- ✅ Recherche dans **TOUTES** les correspondances
- ✅ Aucune restriction de rôle
- ✅ Recherche par code fonctionne sur toute la base

**Exemple** :
```javascript
// Recherche "MD25-188"
filter = {
  $or: [
    { title: /MD25-188/i },
    { subject: /MD25-188/i },
    { content: /MD25-188/i },
    { from_address: /MD25-188/i },
    { to_address: /MD25-188/i },
    { code: /MD25-188/i }  // ✅ Recherche par code
  ]
}
```

### 2. DIRECTEUR / SOUS_DIRECTEUR

**Code** (ligne 985-992) :
```javascript
if (roleConditions.length > 0 && searchConditions.length > 0) {
  filter.$and = [
    { $or: roleConditions },
    { $or: searchConditions }
  ];
  console.log(`🔍 [SEARCH] Combinaison rôle + recherche pour ${req.user.role}`);
}
```

**Résultat** :
- ✅ Recherche dans les correspondances **visibles** par le directeur
- ✅ Recherche par code fonctionne
- ✅ Combiné avec les restrictions de rôle

**Exemple** :
```javascript
// Recherche "MD25-188" par un directeur
filter = {
  $and: [
    {
      $or: [
        { assignedTo: userId },
        { personnesConcernees: userId },
        { status: 'INFORMATIF' }  // ✅ Peut voir les correspondances informatives
      ]
    },
    {
      $or: [
        { title: /MD25-188/i },
        { subject: /MD25-188/i },
        { content: /MD25-188/i },
        { from_address: /MD25-188/i },
        { to_address: /MD25-188/i },
        { code: /MD25-188/i }  // ✅ Recherche par code
      ]
    }
  ]
}
```

### 3. DIRECTEUR_GENERAL

**Comportement** : Identique aux ADMIN (pas de restrictions)

## Pourquoi la confusion ?

La confusion vient du fait que j'ai ajouté `{ status: 'INFORMATIF' }` dans les `roleConditions` des directeurs (ligne 965).

**Ce que j'ai ajouté** :
```javascript
roleConditions = [
  { assignedTo: req.user._id },
  { personnesConcernees: req.user._id },
  { assignedTo: { $exists: false } },
  { assignedTo: null },
  { status: 'INFORMATIF' }  // ✅ AJOUTÉ pour les directeurs
];
```

**Pourquoi ?**
- Les correspondances **INFORMATIF** ne sont pas assignées à des directeurs
- Sans cette condition, les directeurs ne pourraient pas les voir dans la recherche
- Les admins n'ont pas besoin de cette condition car ils voient déjà tout

## Tableau récapitulatif

| Rôle | Recherche par code | Restrictions | Voit INFORMATIF |
|------|-------------------|--------------|-----------------|
| SUPER_ADMIN | ✅ Oui | ❌ Aucune | ✅ Oui |
| ADMINISTRATOR | ✅ Oui | ❌ Aucune | ✅ Oui |
| AGENT_BUREAU_ORDRE | ✅ Oui | ❌ Aucune | ✅ Oui |
| SUPERVISEUR_BUREAU_ORDRE | ✅ Oui | ❌ Aucune | ✅ Oui |
| DIRECTEUR_GENERAL | ✅ Oui | ❌ Aucune | ✅ Oui |
| DIRECTEUR | ✅ Oui | ✅ Correspondances assignées + INFORMATIF | ✅ Oui (grâce à la correction) |
| SOUS_DIRECTEUR | ✅ Oui | ✅ Correspondances assignées + INFORMATIF | ✅ Oui (grâce à la correction) |

## Tests de validation

### Test 1 : Admin recherche "MD25-188"

**Requête** :
```
GET /api/correspondances?search=MD25-188
Role: SUPER_ADMIN
```

**Filtre appliqué** :
```javascript
{
  $or: [
    { title: /MD25-188/i },
    { code: /MD25-188/i }  // ✅ Recherche par code
  ]
}
```

**Résultat** : ✅ Trouve la correspondance

### Test 2 : Directeur recherche "MD25-188"

**Requête** :
```
GET /api/correspondances?search=MD25-188
Role: DIRECTEUR
```

**Filtre appliqué** :
```javascript
{
  $and: [
    {
      $or: [
        { assignedTo: userId },
        { status: 'INFORMATIF' }  // ✅ Peut voir les INFORMATIF
      ]
    },
    {
      $or: [
        { title: /MD25-188/i },
        { code: /MD25-188/i }  // ✅ Recherche par code
      ]
    }
  ]
}
```

**Résultat** : ✅ Trouve la correspondance (car status = 'INFORMATIF')

### Test 3 : Bureau d'ordre recherche "notification"

**Requête** :
```
GET /api/correspondances?search=notification
Role: AGENT_BUREAU_ORDRE
```

**Filtre appliqué** :
```javascript
{
  $or: [
    { title: /notification/i },
    { subject: /notification/i },
    { content: /notification/i },
    { code: /notification/i }  // ✅ Recherche par code
  ]
}
```

**Résultat** : ✅ Trouve toutes les correspondances contenant "notification"

## Conclusion

### ✅ La recherche par code fonctionne pour TOUS les rôles

La ligne 979 :
```javascript
{ code: { $regex: search, $options: 'i' } }
```

Est dans `searchConditions`, qui est utilisé par **tous les rôles**.

### ✅ La seule différence entre les rôles

- **Admins/Bureau d'ordre** : Recherchent dans **toutes** les correspondances
- **Directeurs** : Recherchent dans les correspondances **visibles** (assignées + INFORMATIF)

### ✅ Pourquoi j'ai ajouté `{ status: 'INFORMATIF' }` pour les directeurs

Sans cette condition, les directeurs ne pourraient pas voir les correspondances INFORMATIF dans la recherche, car elles ne sont pas assignées.

**Avec la correction** :
- ✅ Directeurs peuvent rechercher et voir les correspondances INFORMATIF
- ✅ Admins voient déjà tout (pas besoin de condition supplémentaire)

## Vérification

Pour vérifier que la recherche fonctionne pour tous les rôles, regardez les logs du serveur :

**Admin** :
```
🔍 [SEARCH] Recherche avec terme: "MD25-188" (incluant le code)
🔍 [SEARCH] Recherche sans restriction de rôle
```

**Directeur** :
```
🔍 [SEARCH] Recherche avec terme: "MD25-188" (incluant le code)
🔍 [SEARCH] Combinaison rôle + recherche pour DIRECTEUR
```

Les deux utilisent bien la recherche par code !

---

*Document généré le 3 novembre 2025*  
*TAV Tunisie - Système de Gestion Documentaire (SGDO)*
