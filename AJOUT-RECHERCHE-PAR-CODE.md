# Ajout de la Recherche par Code de Correspondance

## Date: 3 novembre 2025

## Problème identifié

Le champ de recherche ne permettait pas de rechercher les correspondances par leur **code** (ex: `MD25-188`, `MA25-001`), ce qui rendait difficile la localisation rapide d'une correspondance spécifique quand on connaît son code.

## Solution appliquée

### ✅ Ajout de la recherche par code

**Fichier** : `backend/src/routes/correspondanceRoutes.js`  
**Ligne** : 978

#### Avant
```javascript
// Conditions de recherche
if (search) {
  searchConditions = [
    { title: { $regex: search, $options: 'i' } },
    { subject: { $regex: search, $options: 'i' } },
    { content: { $regex: search, $options: 'i' } },
    { from_address: { $regex: search, $options: 'i' } },
    { to_address: { $regex: search, $options: 'i' } }
  ];
}
```

#### Après
```javascript
// Conditions de recherche
if (search) {
  searchConditions = [
    { title: { $regex: search, $options: 'i' } },
    { subject: { $regex: search, $options: 'i' } },
    { content: { $regex: search, $options: 'i' } },
    { from_address: { $regex: search, $options: 'i' } },
    { to_address: { $regex: search, $options: 'i' } },
    { code: { $regex: search, $options: 'i' } } // ✅ AJOUT: Recherche par code
  ];
  console.log(`🔍 [SEARCH] Recherche avec terme: "${search}" (incluant le code)`);
}
```

## Fonctionnement

### Recherche insensible à la casse

La recherche utilise `$regex` avec l'option `'i'` (case-insensitive), ce qui permet de rechercher :

- `MD25-188` → Trouve la correspondance
- `md25-188` → Trouve la correspondance
- `MD25` → Trouve toutes les correspondances commençant par MD25
- `188` → Trouve toutes les correspondances contenant 188

### Champs de recherche disponibles

Maintenant, la recherche s'effectue sur **7 champs** :

1. **title** : Titre de la correspondance
2. **subject** : Sujet de la correspondance
3. **content** : Contenu de la correspondance
4. **from_address** : Adresse de l'expéditeur
5. **to_address** : Adresse du destinataire
6. **code** : Code de la correspondance ✅ NOUVEAU

## Exemples d'utilisation

### Exemple 1 : Recherche par code complet

**Requête** :
```
GET /api/correspondances?search=MD25-188
```

**Résultat** :
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
  ]
}
```

### Exemple 2 : Recherche par préfixe de code

**Requête** :
```
GET /api/correspondances?search=MD25
```

**Résultat** : Toutes les correspondances sortantes de 2025 (MD25-xxx)

### Exemple 3 : Recherche par numéro

**Requête** :
```
GET /api/correspondances?search=188
```

**Résultat** : Toutes les correspondances contenant 188 dans leur code ou dans d'autres champs

### Exemple 4 : Recherche mixte

**Requête** :
```
GET /api/correspondances?search=notification
```

**Résultat** : Correspondances contenant "notification" dans :
- Le titre
- Le sujet
- Le contenu
- Le code (si un code contient "notification")

## Format des codes

### Correspondances entrantes (INCOMING)
- Format : `MA-YY-NUMERO`
- Exemple : `MA-25-001`, `MA-25-002`
- MA = Monastir Arrivée
- YY = Année (25 pour 2025)

### Correspondances sortantes (OUTGOING)
- Format : `MD-YY-NUMERO`
- Exemple : `MD-25-188`, `MD-25-189`
- MD = Monastir Départ
- YY = Année (25 pour 2025)

## Avantages

### 1. ✅ Recherche rapide
Trouver une correspondance spécifique en tapant son code directement.

### 2. ✅ Flexibilité
Recherche partielle possible (préfixe, suffixe, ou partie du code).

### 3. ✅ Insensible à la casse
Fonctionne avec majuscules ou minuscules.

### 4. ✅ Combinaison avec autres filtres
Peut être combiné avec les filtres de statut, aéroport, priorité, etc.

## Tests

### Test 1 : Recherche par code exact

```bash
curl -X GET "http://localhost:5000/api/correspondances?search=MD25-188" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Résultat attendu** : 1 correspondance trouvée

### Test 2 : Recherche par préfixe

```bash
curl -X GET "http://localhost:5000/api/correspondances?search=MD25" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Résultat attendu** : Toutes les correspondances sortantes de 2025

### Test 3 : Recherche insensible à la casse

```bash
curl -X GET "http://localhost:5000/api/correspondances?search=md25-188" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Résultat attendu** : Même résultat que Test 1

## Compatibilité Frontend

Le frontend peut maintenant utiliser la recherche par code sans modification :

```javascript
// Recherche par code
const searchByCode = async (code) => {
  const response = await fetch(`/api/correspondances?search=${code}`);
  const data = await response.json();
  return data;
};

// Exemple d'utilisation
searchByCode('MD25-188').then(result => {
  console.log('Correspondance trouvée:', result.data);
});
```

## Logs de débogage

Un log a été ajouté pour faciliter le débogage :

```
🔍 [SEARCH] Recherche avec terme: "MD25-188" (incluant le code)
```

Ce log apparaît dans la console du serveur à chaque recherche.

## Fichiers modifiés

**backend/src/routes/correspondanceRoutes.js**
- Ligne 978 : Ajout de la recherche par code
- Ligne 980 : Ajout d'un log de débogage

## Conclusion

### ✅ Objectif atteint

La recherche par code de correspondance est maintenant fonctionnelle. Les utilisateurs peuvent :
- ✅ Rechercher une correspondance par son code exact
- ✅ Rechercher par préfixe de code (ex: MD25)
- ✅ Rechercher par numéro (ex: 188)
- ✅ Combiner avec d'autres filtres

### 🎯 Utilisation pratique

**Scénario** : Un utilisateur reçoit un appel téléphonique mentionnant la correspondance `MD25-188`

**Avant** : Devait parcourir la liste ou chercher par titre/sujet

**Après** : Tape directement `MD25-188` dans la barre de recherche → Résultat immédiat ✅

---

*Document généré le 3 novembre 2025*  
*TAV Tunisie - Système de Gestion Documentaire (SGDO)*
