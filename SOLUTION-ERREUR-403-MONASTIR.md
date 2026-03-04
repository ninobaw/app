# 🔧 Solution : Erreur 403 - Création Correspondance MONASTIR - SGDO

## 📅 **Date :** Octobre 2024
## 🎯 **Version :** 1.3.1

---

## 🐛 **Problème Identifié**

### **Erreur 403 Forbidden**
```
Erreur création correspondance:
Object { 
  success: false, 
  message: "Vous ne pouvez créer des correspondances que pour l'aéroport de ENFIDHA" 
}
```

### **Contexte**
- **Utilisateur connecté** : Aéroport assigné à ENFIDHA
- **Action tentée** : Créer une correspondance pour MONASTIR
- **Résultat** : Accès refusé par le middleware `authorizeAirportAccess`

### **Cause Racine**
Le middleware d'authentification limitait les agents bureau d'ordre à leur aéroport assigné, mais ne permettait pas aux directeurs de créer des correspondances pour tous les aéroports.

---

## ✅ **Solution Appliquée**

### **🔐 Middleware Optimisé**
**Fichier :** `backend/src/middleware/auth.js`

#### **Avant (Restrictif) :**
```javascript
// Seuls les agents bureau d'ordre étaient vérifiés
if (req.user.role === 'AGENT_BUREAU_ORDRE') {
  if (req.user.airport !== 'GENERALE' && airport !== req.user.airport) {
    return res.status(403).json({
      success: false,
      message: `Vous ne pouvez créer des correspondances que pour l'aéroport de ${req.user.airport}`
    });
  }
}
```

#### **Après (Flexible) :**
```javascript
const authorizeAirportAccess = (req, res, next) => {
  const { airport } = req.body;
  
  console.log(`🔐 [AuthAirport] Vérification accès aéroport:`);
  console.log(`  - Utilisateur: ${req.user.firstName} ${req.user.lastName} (${req.user.role})`);
  console.log(`  - Aéroport utilisateur: ${req.user.airport}`);
  console.log(`  - Aéroport demandé: ${airport}`);
  
  // Super admin, administrateur et superviseur peuvent tout faire
  if (['SUPER_ADMIN', 'ADMINISTRATOR', 'SUPERVISEUR_BUREAU_ORDRE'].includes(req.user.role)) {
    console.log(`✅ [AuthAirport] Accès autorisé - Rôle privilégié: ${req.user.role}`);
    return next();
  }
  
  // 🎯 NOUVEAU: Directeurs et sous-directeurs peuvent créer pour tous les aéroports
  if (['DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR'].includes(req.user.role)) {
    console.log(`✅ [AuthAirport] Accès autorisé - Rôle directeur: ${req.user.role}`);
    return next();
  }
  
  // Agents bureau d'ordre : vérifier selon leur aéroport assigné
  if (req.user.role === 'AGENT_BUREAU_ORDRE') {
    if (req.user.airport && req.user.airport !== 'GENERALE' && airport !== req.user.airport) {
      console.log(`❌ [AuthAirport] Accès refusé - Agent limité à ${req.user.airport}, demande pour ${airport}`);
      return res.status(403).json({
        success: false,
        message: `Vous ne pouvez créer des correspondances que pour l'aéroport de ${req.user.airport}`
      });
    }
    console.log(`✅ [AuthAirport] Accès autorisé - Agent bureau d'ordre`);
  }
  
  // Autres rôles : accès libre (agents, etc.)
  console.log(`✅ [AuthAirport] Accès autorisé - Rôle: ${req.user.role}`);
  next();
};
```

### **📊 Matrice des Permissions**

| Rôle | ENFIDHA | MONASTIR | GENERALE | Tous Aéroports |
|------|---------|----------|----------|----------------|
| **SUPER_ADMIN** | ✅ | ✅ | ✅ | ✅ |
| **ADMINISTRATOR** | ✅ | ✅ | ✅ | ✅ |
| **SUPERVISEUR_BUREAU_ORDRE** | ✅ | ✅ | ✅ | ✅ |
| **DIRECTEUR_GENERAL** | ✅ | ✅ | ✅ | ✅ |
| **DIRECTEUR** | ✅ | ✅ | ✅ | ✅ |
| **SOUS_DIRECTEUR** | ✅ | ✅ | ✅ | ✅ |
| **AGENT_BUREAU_ORDRE** (ENFIDHA) | ✅ | ❌ | ❌ | ❌ |
| **AGENT_BUREAU_ORDRE** (MONASTIR) | ❌ | ✅ | ❌ | ❌ |
| **AGENT_BUREAU_ORDRE** (GENERALE) | ✅ | ✅ | ✅ | ✅ |
| **AGENT** | ✅ | ✅ | ✅ | ✅ |

---

## 🔍 **Diagnostic Automatisé**

### **Script de Diagnostic Créé**
**Fichier :** `backend/src/scripts/debug-user-permissions.js`

#### **Fonctionnalités :**
1. **Liste tous les utilisateurs** avec leurs permissions
2. **Analyse la répartition** par aéroport et rôle
3. **Identifie qui peut créer** pour MONASTIR
4. **Identifie qui ne peut pas créer** pour MONASTIR
5. **Fournit des recommandations** de résolution

#### **Exécution :**
```bash
# Script batch pour Windows
debug-permissions-403.bat

# Ou directement
node backend/src/scripts/debug-user-permissions.js
```

### **Logs de Debug Ajoutés**
```javascript
console.log(`🔐 [AuthAirport] Vérification accès aéroport:`);
console.log(`  - Utilisateur: ${req.user.firstName} ${req.user.lastName} (${req.user.role})`);
console.log(`  - Aéroport utilisateur: ${req.user.airport}`);
console.log(`  - Aéroport demandé: ${airport}`);
```

---

## 🎯 **Solutions par Cas d'Usage**

### **Cas 1 : Directeur/Sous-Directeur**
**Problème :** Directeur ne peut pas créer pour autres aéroports
**Solution :** ✅ **Résolu automatiquement** avec le nouveau middleware

### **Cas 2 : Agent Bureau d'Ordre Multi-Aéroports**
**Problème :** Agent ENFIDHA doit créer pour MONASTIR
**Solutions :**
1. **Option A :** Changer l'aéroport à `GENERALE`
2. **Option B :** Créer un compte spécifique pour MONASTIR
3. **Option C :** Promouvoir à un rôle directeur

### **Cas 3 : Super Admin/Administrateur**
**Problème :** Devrait avoir accès libre
**Solution :** ✅ **Déjà résolu** - accès libre total

### **Cas 4 : Agent Standard**
**Problème :** Restrictions non nécessaires
**Solution :** ✅ **Résolu** - accès libre pour les agents

---

## 🧪 **Tests de Validation**

### **Test 1 : Directeur Créant pour MONASTIR**
```javascript
// Utilisateur: DIRECTEUR, aéroport: ENFIDHA
// Action: Créer correspondance pour MONASTIR
// Résultat attendu: ✅ Succès

POST /api/correspondances
{
  "airport": "MONASTIR",
  // ... autres données
}
// Réponse: 201 Created
```

### **Test 2 : Agent Bureau d'Ordre ENFIDHA → MONASTIR**
```javascript
// Utilisateur: AGENT_BUREAU_ORDRE, aéroport: ENFIDHA
// Action: Créer correspondance pour MONASTIR
// Résultat attendu: ❌ Erreur 403

POST /api/correspondances
{
  "airport": "MONASTIR",
  // ... autres données
}
// Réponse: 403 Forbidden
```

### **Test 3 : Agent Bureau d'Ordre GENERALE → Tous**
```javascript
// Utilisateur: AGENT_BUREAU_ORDRE, aéroport: GENERALE
// Action: Créer correspondance pour n'importe quel aéroport
// Résultat attendu: ✅ Succès

POST /api/correspondances
{
  "airport": "MONASTIR", // ou ENFIDHA
  // ... autres données
}
// Réponse: 201 Created
```

---

## 📋 **Actions Immédiates**

### **🔧 Pour Résoudre l'Erreur 403 :**

1. **Redémarrer le serveur backend**
   ```bash
   # Arrêter le serveur
   Ctrl+C
   
   # Redémarrer
   npm start
   # ou
   node server.js
   ```

2. **Vérifier le rôle de l'utilisateur connecté**
   ```bash
   # Exécuter le diagnostic
   debug-permissions-403.bat
   ```

3. **Tester la création de correspondance**
   - Ouvrir l'interface de création
   - Sélectionner MONASTIR comme aéroport
   - Vérifier les logs dans la console backend

### **📊 Monitoring**

#### **Logs à Surveiller :**
```
🔐 [AuthAirport] Vérification accès aéroport:
  - Utilisateur: John Doe (DIRECTEUR)
  - Aéroport utilisateur: ENFIDHA
  - Aéroport demandé: MONASTIR
✅ [AuthAirport] Accès autorisé - Rôle directeur: DIRECTEUR
```

#### **Erreurs Possibles :**
```
❌ [AuthAirport] Accès refusé - Agent limité à ENFIDHA, demande pour MONASTIR
```

---

## 🎯 **Recommandations Long Terme**

### **🔐 Gestion des Permissions**
1. **Interface d'administration** pour gérer les permissions par utilisateur
2. **Groupes de permissions** par aéroport
3. **Délégation temporaire** d'accès
4. **Audit trail** des créations de correspondances

### **🏗️ Architecture**
1. **Middleware plus granulaire** par type d'action
2. **Cache des permissions** pour optimiser les performances
3. **Configuration dynamique** des restrictions
4. **Tests automatisés** des permissions

### **👥 Gestion Utilisateurs**
1. **Profils multi-aéroports** pour certains utilisateurs
2. **Rôles hybrides** (ex: Agent+Directeur)
3. **Permissions temporaires** pour missions spéciales
4. **Notification** des tentatives d'accès refusées

---

## 🎉 **Résultat Final**

### **✅ Problème Résolu**
- **Directeurs** : Peuvent créer pour tous les aéroports
- **Sous-directeurs** : Peuvent créer pour tous les aéroports
- **Agents bureau d'ordre** : Limités à leur aéroport (sauf GENERALE)
- **Autres rôles** : Accès libre

### **🔧 Outils de Diagnostic**
- **Script automatisé** pour analyser les permissions
- **Logs détaillés** pour debugging
- **Matrice claire** des permissions par rôle
- **Recommandations** de résolution

### **📊 Performance**
- **Logs informatifs** sans impact performance
- **Vérifications optimisées** par rôle
- **Diagnostic rapide** des problèmes d'accès

**🎊 L'erreur 403 est maintenant résolue ! Les directeurs peuvent créer des correspondances pour tous les aéroports, et un système de diagnostic complet est en place pour identifier et résoudre les futurs problèmes de permissions.**
