# Aide : Recherche ne fonctionne pas pour SUPERVISEUR_BUREAU_ORDRE

## Problème rapporté

En tant que **SUPERVISEUR_BUREAU_ORDRE**, vous ne pouvez pas rechercher la correspondance avec le code **"MD25-188"**.

## Tests effectués

### ✅ Test de la base de données

La recherche fonctionne **parfaitement** au niveau de la base de données :

```
Filtre avec recherche "MD25-188":
Résultats: 1 correspondance(s)
✅ La correspondance est trouvée avec ce filtre
   - MD25-188: Notification de démarrage des travaux...
```

**Conclusion** : Le problème ne vient PAS de la base de données ni du code backend.

## Diagnostic

### Étape 1 : Vérifier les logs du serveur

Avec les nouveaux logs ajoutés, vous devriez voir ceci dans la console du serveur backend quand vous faites une recherche :

```
✅ Rôle SUPERVISEUR_BUREAU_ORDRE autorisé pour accéder aux correspondances
📥 [GET] Paramètres reçus: { page: 1, limit: 10, status: undefined, airport: undefined, priority: undefined, search: 'MD25-188', includeReplies: false }
🔍 [SEARCH] Recherche avec terme: "MD25-188" (incluant le code)
🔍 [SEARCH] Recherche sans restriction de rôle
🔍 Filtre appliqué pour SUPERVISEUR_BUREAU_ORDRE: { ... }
```

**Si vous ne voyez PAS ces logs** : Le frontend n'envoie pas la requête correctement.

### Étape 2 : Vérifier les paramètres envoyés

Regardez la ligne :
```
📥 [GET] Paramètres reçus: { ... }
```

**Vérifiez** :
- `search` doit contenir `'MD25-188'`
- `status`, `airport`, `priority` ne doivent pas bloquer la recherche

**Problèmes possibles** :
1. Si `status` = `'PENDING'` → La correspondance ne sera pas trouvée (car elle est `INFORMATIF`)
2. Si `airport` = `'ENFIDHA'` → La correspondance ne sera pas trouvée (car elle est `MONASTIR`)

### Étape 3 : Vérifier le filtre appliqué

Regardez la ligne :
```
🔍 Filtre appliqué pour SUPERVISEUR_BUREAU_ORDRE: { ... }
```

**Filtre attendu** :
```json
{
  "parentCorrespondanceId": { "$exists": false },
  "$or": [
    { "title": { "$regex": "MD25-188", "$options": "i" } },
    { "subject": { "$regex": "MD25-188", "$options": "i" } },
    { "content": { "$regex": "MD25-188", "$options": "i" } },
    { "from_address": { "$regex": "MD25-188", "$options": "i" } },
    { "to_address": { "$regex": "MD25-188", "$options": "i" } },
    { "code": { "$regex": "MD25-188", "$options": "i" } }
  ]
}
```

**Si le filtre contient d'autres champs** (status, airport, priority), cela peut bloquer la recherche.

## Solutions

### Solution 1 : Vérifier le frontend

Ouvrez les **DevTools** du navigateur (F12) :

1. Aller dans l'onglet **Network** (Réseau)
2. Faire une recherche avec "MD25-188"
3. Regarder la requête `correspondances?search=...`
4. Vérifier l'URL complète

**URL attendue** :
```
GET /api/correspondances?search=MD25-188&page=1&limit=10
```

**URL problématique** :
```
GET /api/correspondances?search=MD25-188&status=PENDING&page=1&limit=10
                                        ^^^^^^^^^^^^^^^^
                                        Bloque la recherche car MD25-188 est INFORMATIF
```

### Solution 2 : Supprimer les filtres

Si le frontend envoie des filtres de status/airport/priority avec la recherche, cela peut bloquer les résultats.

**Dans le frontend**, quand l'utilisateur fait une recherche, **supprimer temporairement** les autres filtres :

```javascript
// ❌ PROBLÉMATIQUE
const searchCorrespondances = (searchTerm) => {
  fetch(`/api/correspondances?search=${searchTerm}&status=${currentStatus}&airport=${currentAirport}`)
};

// ✅ CORRECT
const searchCorrespondances = (searchTerm) => {
  // Quand on recherche, on ignore les autres filtres
  fetch(`/api/correspondances?search=${searchTerm}`)
};
```

### Solution 3 : Modifier le backend pour ignorer les filtres lors d'une recherche

Si vous voulez que la recherche ignore les filtres de status/airport/priority, modifiez le code :

```javascript
// Dans correspondanceRoutes.js, ligne 939-951
if (status && !search) {  // ✅ Appliquer status seulement si pas de recherche
  filter.status = status;
}

if (airport && !search) {  // ✅ Appliquer airport seulement si pas de recherche
  filter.airport = airport;
}

if (priority && !search) {  // ✅ Appliquer priority seulement si pas de recherche
  filter.priority = priority;
}
```

## Test manuel

### Test 1 : Recherche simple (sans filtres)

**URL à tester** :
```
http://localhost:5000/api/correspondances?search=MD25-188
```

**Résultat attendu** : 1 correspondance trouvée

### Test 2 : Recherche avec filtre status

**URL à tester** :
```
http://localhost:5000/api/correspondances?search=MD25-188&status=PENDING
```

**Résultat** : 0 correspondance (car MD25-188 est INFORMATIF, pas PENDING)

### Test 3 : Recherche avec filtre airport

**URL à tester** :
```
http://localhost:5000/api/correspondances?search=MD25-188&airport=ENFIDHA
```

**Résultat** : 0 correspondance (car MD25-188 est à MONASTIR, pas ENFIDHA)

## Checklist de vérification

- [ ] Le serveur backend est démarré
- [ ] Les logs du serveur s'affichent dans la console
- [ ] La requête apparaît dans les logs avec `📥 [GET] Paramètres reçus`
- [ ] Le paramètre `search` contient bien "MD25-188"
- [ ] Aucun filtre `status` n'est envoyé (ou il vaut `INFORMATIF`)
- [ ] Aucun filtre `airport` n'est envoyé (ou il vaut `MONASTIR`)
- [ ] Le filtre appliqué contient bien `{ code: { $regex: "MD25-188" } }`
- [ ] Le frontend n'a pas de cache qui bloque les résultats

## Commande de test rapide

Pour tester directement l'API sans passer par le frontend :

### Windows PowerShell

```powershell
# Remplacer YOUR_TOKEN par votre token JWT
$token = "YOUR_TOKEN_HERE"

# Test de recherche
Invoke-RestMethod -Uri "http://localhost:5000/api/correspondances?search=MD25-188" `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -Method Get | ConvertTo-Json -Depth 10
```

### Linux/Mac

```bash
# Remplacer YOUR_TOKEN par votre token JWT
TOKEN="YOUR_TOKEN_HERE"

# Test de recherche
curl -X GET "http://localhost:5000/api/correspondances?search=MD25-188" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Prochaines étapes

1. **Redémarrer le serveur backend** pour activer les nouveaux logs
2. **Faire une recherche** avec "MD25-188" dans le frontend
3. **Regarder les logs** dans la console du serveur
4. **Copier les logs** et me les envoyer pour diagnostic

Les logs devraient ressembler à :
```
✅ Rôle SUPERVISEUR_BUREAU_ORDRE autorisé pour accéder aux correspondances
📥 [GET] Paramètres reçus: { ... }
🔍 [SEARCH] Recherche avec terme: "MD25-188" (incluant le code)
🔍 [SEARCH] Recherche sans restriction de rôle
🔍 Filtre appliqué pour SUPERVISEUR_BUREAU_ORDRE: { ... }
```

---

*Document généré le 3 novembre 2025*  
*TAV Tunisie - Système de Gestion Documentaire (SGDO)*
