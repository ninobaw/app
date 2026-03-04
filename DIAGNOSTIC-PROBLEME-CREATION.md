# 🔍 Diagnostic : Problème Création Correspondance - SGDO

## 📅 **Date :** Octobre 2024
## 🎯 **Analyse des Logs**

---

## 🐛 **Problèmes Identifiés**

### **1. Utilisateur Incorrect**
- **Logs Frontend** : "Najeh Chaouch (SOUS_DIRECTEUR)"
- **Logs Backend** : "asma.sahli@tav.aero (AGENT_BUREAU_ORDRE)"
- **Problème** : Incohérence entre frontend et backend

### **2. Boucle Infinie `/detect-language`**
```
[AUTH MIDDLEWARE] Début de l'authentification pour POST /detect-language
[AUTH MIDDLEWARE] Authorization header: Bearer eyJhbGciOiJIUzI1NiIs...
[AUTH MIDDLEWARE] Token décodé avec succès pour l'utilisateur: 347dcb4c-6236-41c0-9c08-24e4bbdf5b0b
```
- **Problème** : Appels répétés en boucle qui saturent le serveur

### **3. Permissions Refusées**
- **Utilisateur** : `AGENT_BUREAU_ORDRE` avec aéroport `ENFIDHA`
- **Action** : Créer correspondance pour `MONASTIR`
- **Résultat attendu** : ❌ Refus (selon nos règles)

---

## 🔍 **Analyse du Token JWT**

### **Token Décodé :**
```json
{
  "userId": "347dcb4c-6236-41c0-9c08-24e4bbdf5b0b",
  "email": "asma.sahli@tav.aero",
  "role": "AGENT_BUREAU_ORDRE",
  "loginTime": 1759414260673,
  "iat": 1759414260,
  "exp": 1759443060
}
```

### **Utilisateur Réel :**
- **Nom** : Asma Sahli
- **Email** : asma.sahli@tav.aero
- **Rôle** : AGENT_BUREAU_ORDRE
- **Aéroport** : ENFIDHA (probablement)

---

## 🎯 **Solutions par Problème**

### **Solution 1 : Incohérence Utilisateur**

#### **Cause Possible :**
- Cache navigateur avec ancien token
- Session mixte entre utilisateurs
- Problème de déconnexion/reconnexion

#### **Actions :**
1. **Vider le cache navigateur** (Ctrl+Shift+R)
2. **Se déconnecter complètement** et se reconnecter
3. **Vérifier le localStorage** pour les tokens multiples

### **Solution 2 : Boucle Infinie `/detect-language`**

#### **Cause Probable :**
- Composant frontend qui appelle la détection de langue en continu
- Probablement dans le dialogue de création de correspondance
- Effet de bord d'un `useEffect` mal configuré

#### **Actions :**
1. **Identifier le composant** qui appelle `/detect-language`
2. **Ajouter des conditions** pour éviter les appels répétés
3. **Débouncer** les appels de détection de langue

### **Solution 3 : Permissions Agent Bureau d'Ordre**

#### **Comportement Attendu :**
```javascript
// AGENT_BUREAU_ORDRE (ENFIDHA) → MONASTIR = ❌ REFUSÉ
if (req.user.role === 'AGENT_BUREAU_ORDRE') {
  if (req.user.airport !== 'GENERALE' && airport !== req.user.airport) {
    return res.status(403).json({
      success: false,
      message: `Vous ne pouvez créer des correspondances que pour l'aéroport de ${req.user.airport}`
    });
  }
}
```

#### **Options de Résolution :**
1. **Changer l'aéroport** d'Asma Sahli à `GENERALE`
2. **Promouvoir** Asma Sahli à `SOUS_DIRECTEUR`
3. **Créer un compte** spécifique pour MONASTIR
4. **Utiliser un compte directeur** pour cette action

---

## 🧪 **Tests de Validation**

### **Test 1 : Vérifier l'Utilisateur Connecté**
```javascript
// Dans la console navigateur
console.log('Token:', localStorage.getItem('token'));
console.log('User:', JSON.parse(localStorage.getItem('user') || '{}'));
```

### **Test 2 : Arrêter la Boucle `/detect-language`**
```javascript
// Rechercher dans le code frontend :
grep -r "detect-language" src/
// Identifier le composant responsable
```

### **Test 3 : Tester les Permissions**
```bash
# Avec le bon utilisateur (SOUS_DIRECTEUR)
curl -X POST http://10.20.14.130:5000/api/correspondances \
  -H "Authorization: Bearer TOKEN_SOUS_DIRECTEUR" \
  -H "Content-Type: application/json" \
  -d '{"airport": "MONASTIR", ...}'
```

---

## 📋 **Actions Immédiates**

### **🔧 Étape 1 : Résoudre la Boucle Infinie**
1. **Identifier** le composant qui appelle `/detect-language`
2. **Ajouter des logs** pour tracer les appels
3. **Corriger** la logique d'appel

### **🔧 Étape 2 : Vérifier l'Utilisateur**
1. **Se déconnecter** complètement
2. **Vider le cache** navigateur
3. **Se reconnecter** avec le bon compte

### **🔧 Étape 3 : Tester les Permissions**
1. **Avec Asma Sahli (AGENT_BUREAU_ORDRE)** → MONASTIR = ❌ Attendu
2. **Avec Najeh Chaouch (SOUS_DIRECTEUR)** → MONASTIR = ✅ Attendu

---

## 🎯 **Diagnostic Rapide**

### **Commandes de Test :**
```bash
# 1. Tester les permissions localement
node test-permissions-quick.js

# 2. Vérifier les utilisateurs en base
node backend/src/scripts/debug-user-permissions.js

# 3. Identifier la boucle detect-language
grep -r "detect-language" src/components/
```

### **Logs à Surveiller :**
```
🔍 [DETECT-LANG] Requête reçue de asma.sahli@tav.aero
📝 [DETECT-LANG] Texte à analyser: "..."
🔐 [AuthAirport] === VÉRIFICATION ACCÈS AÉROPORT ===
👤 [AuthAirport] Utilisateur: Asma Sahli (AGENT_BUREAU_ORDRE)
❌ [AuthAirport] Accès refusé - Agent limité à ENFIDHA, demande pour MONASTIR
```

---

## 🎉 **Résolution Attendue**

### **Après Corrections :**
1. **Boucle infinie** : Arrêtée
2. **Utilisateur correct** : Najeh Chaouch (SOUS_DIRECTEUR)
3. **Permissions** : ✅ Autorisées pour SOUS_DIRECTEUR
4. **Création** : ✅ Succès pour MONASTIR

### **Logs de Succès Attendus :**
```
🔐 [AuthAirport] === VÉRIFICATION ACCÈS AÉROPORT ===
👤 [AuthAirport] Utilisateur: Najeh Chaouch (SOUS_DIRECTEUR)
🎯 [AuthAirport] Aéroport demandé: MONASTIR
✅ [AuthAirport] ACCÈS AUTORISÉ - Rôle directeur: SOUS_DIRECTEUR
🎉 [AuthAirport] Najeh Chaouch peut créer pour MONASTIR
```

**🎊 Une fois ces problèmes résolus, la création de correspondances fonctionnera correctement !**
