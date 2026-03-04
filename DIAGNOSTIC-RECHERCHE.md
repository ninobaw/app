# Diagnostic : Recherche ne fonctionne pas

## Tests effectués

### ✅ Test 1 : Base de données
**Résultat** : ✅ FONCTIONNE PARFAITEMENT

```
Test 1 : Recherche simple par code "MD25-188"
Résultats: 1 correspondance(s)
✅ Trouvé: MD25-188 - Notification de démarrage des travaux...
```

### ✅ Test 2 : Recherche partielle
**Résultat** : ✅ FONCTIONNE

```
Test 2 : Recherche partielle "MD25"
Résultats: 1 correspondance(s)
✅ MD25-188
```

### ✅ Test 3 : Recherche insensible à la casse
**Résultat** : ✅ FONCTIONNE

```
"MD25-188" → 1 résultat(s)
"md25-188" → 1 résultat(s)
"Md25-188" → 1 résultat(s)
"MD25" → 1 résultat(s)
```

## Conclusion

Le **backend fonctionne parfaitement**. Le problème vient de l'un de ces éléments :

### 1. Le frontend n'envoie pas la requête

**Vérification** : Ouvrir les DevTools (F12) → Network → Rechercher "MD25-188"

**Si aucune requête n'apparaît** : Le problème est dans le code frontend

### 2. Le serveur ne reçoit pas la requête

**Vérification** : Regarder les logs du serveur backend

**Logs attendus** :
```
✅ Rôle SUPERVISEUR_BUREAU_ORDRE autorisé pour accéder aux correspondances
📥 [GET] Paramètres reçus: { search: 'MD25-188', ... }
🔍 [SEARCH] Recherche avec terme: "MD25-188" (incluant le code)
```

**Si ces logs n'apparaissent pas** : Le frontend n'envoie pas la requête

### 3. Le token d'authentification est invalide

**Vérification** : Regarder les logs du serveur

**Si vous voyez** :
```
❌ Token invalide
❌ Unauthorized
```

**Solution** : Se reconnecter

### 4. Le frontend a un cache

**Solution** : 
- Vider le cache du navigateur (Ctrl+Shift+Delete)
- Faire un "Hard Refresh" (Ctrl+F5)
- Essayer en navigation privée

### 5. Le frontend filtre les résultats

**Vérification** : Regarder la réponse de l'API dans les DevTools

**Si la réponse contient des données** mais rien ne s'affiche : Le frontend filtre les résultats côté client

## Actions à faire MAINTENANT

### Étape 1 : Vérifier que le serveur est démarré

```bash
cd backend
npm run dev
```

Vous devriez voir :
```
Server running on port 5000
Connected to MongoDB
```

### Étape 2 : Ouvrir les DevTools du navigateur

1. Appuyer sur **F12**
2. Aller dans l'onglet **Network** (Réseau)
3. Cocher "Preserve log"

### Étape 3 : Faire une recherche

1. Dans le frontend, taper **"MD25-188"** dans la barre de recherche
2. Appuyer sur Entrée ou cliquer sur Rechercher

### Étape 4 : Vérifier la requête dans Network

Chercher une ligne qui contient `correspondances?search=`

**Cliquer dessus** et regarder :

#### Headers
```
Request URL: http://localhost:5000/api/correspondances?search=MD25-188
Request Method: GET
Status Code: 200 OK (ou autre)
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "code": "MD25-188",
      "title": "Notification de démarrage..."
    }
  ]
}
```

### Étape 5 : Regarder les logs du serveur

Dans la console où vous avez lancé `npm run dev`, vous devriez voir :

```
✅ Rôle SUPERVISEUR_BUREAU_ORDRE autorisé
📥 [GET] Paramètres reçus: { search: 'MD25-188' }
🔍 [SEARCH] Filtres status/airport/priority ignorés pendant la recherche
🔍 [SEARCH] Recherche avec terme: "MD25-188" (incluant le code)
🔍 [SEARCH] Recherche sans restriction de rôle
```

## Scénarios possibles

### Scénario A : Aucune requête dans Network

**Diagnostic** : Le frontend ne déclenche pas la recherche

**Causes possibles** :
- Le bouton de recherche n'est pas connecté
- L'événement onSubmit/onClick n'est pas défini
- Une erreur JavaScript bloque l'exécution

**Solution** : Vérifier le code frontend

### Scénario B : Requête présente, Status 401/403

**Diagnostic** : Problème d'authentification

**Solution** : Se reconnecter

### Scénario C : Requête présente, Status 200, data vide

**Diagnostic** : Le backend ne trouve pas la correspondance

**Causes possibles** :
- Des filtres sont envoyés avec la recherche
- Le paramètre `search` n'est pas correctement envoyé

**Solution** : Vérifier l'URL de la requête

### Scénario D : Requête présente, Status 200, data contient MD25-188, mais rien ne s'affiche

**Diagnostic** : Le frontend ne gère pas correctement la réponse

**Causes possibles** :
- Le frontend filtre les résultats côté client
- Un bug dans le rendu des résultats
- Le composant ne se met pas à jour

**Solution** : Vérifier le code frontend qui affiche les résultats

## Test manuel de l'API

Pour tester l'API directement sans passer par le frontend :

### Windows PowerShell

```powershell
# Récupérer votre token (après connexion)
$token = "VOTRE_TOKEN_ICI"

# Tester la recherche
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/correspondances?search=MD25-188" `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -Method Get

# Afficher le résultat
$response | ConvertTo-Json -Depth 10
```

### Résultat attendu

```json
{
  "success": true,
  "data": [
    {
      "_id": "6902021512f4faabd0226652",
      "code": "MD25-188",
      "title": "Notification de démarrage des travaux...",
      "status": "INFORMATIF",
      "type": "OUTGOING",
      "airport": "MONASTIR"
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

## Prochaine étape

**Faites les 5 étapes ci-dessus** et dites-moi :

1. Est-ce qu'une requête apparaît dans Network ?
2. Quel est le Status Code de la requête ?
3. Qu'est-ce qu'il y a dans la Response ?
4. Quels logs apparaissent dans la console du serveur ?

Avec ces informations, je pourrai identifier le problème exact.

---

*Document généré le 3 novembre 2025*  
*TAV Tunisie - Système de Gestion Documentaire (SGDO)*
