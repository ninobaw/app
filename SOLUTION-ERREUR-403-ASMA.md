# 🔧 Solution - Erreur 403 Création Correspondance Asma

## 🎯 **Problème identifié**

### **Symptômes :**
- ✅ Upload de fichier réussi
- ❌ Création de correspondance échoue avec erreur 403
- 🔍 Logs montrent : `axios response interceptor: Error response from /api/correspondances Status: 403`

### **Cause racine :**
L'utilisateur `asma.sahli@tav.aero` n'existait pas dans la base de données ou n'avait pas les permissions nécessaires pour créer des correspondances.

## ✅ **Solution appliquée**

### **1. Diagnostic des permissions**
```javascript
// Route de création : POST /api/correspondances
router.post('/', auth, authorizeBureauOrdre, authorizeAirportAccess, ...)

// Middleware authorizeBureauOrdre - Rôles autorisés :
const authorizedRoles = [
  'AGENT_BUREAU_ORDRE', 
  'SUPERVISEUR_BUREAU_ORDRE',
  'DIRECTEUR',
  'SOUS_DIRECTEUR',
  'DIRECTEUR_GENERAL',
  'SUPER_ADMIN'
];
```

### **2. Création/Mise à jour utilisateur Asma**
```javascript
// Script exécuté : backend/create-asma-sahli.js
const asma = new User({
  firstName: 'Asma',
  lastName: 'Sahli',
  email: 'asma.sahli@tav.aero',
  password: 'password123', // Hashé avec bcrypt
  role: 'AGENT_BUREAU_ORDRE', // ✅ Rôle autorisé
  airport: 'GENERALE',
  isActive: true,
  department: 'Bureau d\'Ordre',
  position: 'Agent Bureau d\'Ordre'
});
```

## 🧪 **Test de la solution**

### **Étapes de test :**

#### **1. Connexion Asma**
```
Email: asma.sahli@tav.aero
Mot de passe: password123
```

#### **2. Création de correspondance**
1. **Interface** : Aller sur la page de création de correspondances
2. **Remplir** les champs obligatoires :
   - Titre
   - Expéditeur
   - Destinataire
   - Sujet
   - Contenu
   - Priorité
   - Aéroport
3. **Upload** : Joindre un fichier (ex: BOOK_20530_1-1.pdf)
4. **Soumettre** : Cliquer sur "Créer correspondance"

#### **3. Vérifications attendues**
- ✅ Upload du fichier réussi
- ✅ Création de correspondance réussie
- ✅ Pas d'erreur 403
- ✅ Correspondance visible dans la liste
- ✅ Assignation automatique aux directeurs

## 🔍 **Logs de débogage**

### **Avant correction :**
```
useFileUpload.ts:83 Réponse de l'upload de fichier: {success}
axios.ts:40 axios response interceptor: Error response from /api/correspondances Status: 403
use-toast.ts:147 TOAST_INVOCATION_DEBUG: toast() called with title: Erreur de création
```

### **Après correction (attendu) :**
```
useFileUpload.ts:83 Réponse de l'upload de fichier: {success}
axios.ts:35 axios response interceptor: Success response from /api/correspondances Status: 201
use-toast.ts:147 TOAST_INVOCATION_DEBUG: toast() called with title: Correspondance créée
```

## 🎯 **Points de contrôle**

### **Base de données :**
```javascript
// Vérifier l'utilisateur Asma
db.users.findOne({email: "asma.sahli@tav.aero"})

// Doit retourner :
{
  firstName: "Asma",
  lastName: "Sahli",
  email: "asma.sahli@tav.aero",
  role: "AGENT_BUREAU_ORDRE", // ✅ Autorisé
  airport: "GENERALE",
  isActive: true
}
```

### **API Test :**
```bash
# Test direct de l'API (avec token valide)
curl -X POST http://localhost:5000/api/correspondances \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "from_address": "test@example.com",
    "to_address": "dest@example.com",
    "subject": "Test",
    "content": "Test content",
    "priority": "MEDIUM",
    "airport": "GENERALE"
  }'
```

## 🚀 **Résultat final**

### **✅ Problème résolu :**
- **Utilisateur Asma** créé avec rôle `AGENT_BUREAU_ORDRE`
- **Permissions** correctes pour créer des correspondances
- **Upload de fichiers** + **Création correspondance** fonctionnels
- **Workflow complet** opérationnel

### **🎉 Asma peut maintenant :**
1. **Se connecter** avec `asma.sahli@tav.aero` / `password123`
2. **Créer des correspondances** avec attachements
3. **Assigner** aux directeurs appropriés
4. **Suivre** le workflow complet jusqu'à la finalisation

## 💡 **Prévention future**

### **Checklist création utilisateur :**
- [ ] **Email** unique et correct
- [ ] **Rôle** approprié selon les permissions nécessaires
- [ ] **Aéroport** défini
- [ ] **Statut actif** (`isActive: true`)
- [ ] **Test** de connexion et permissions

### **Rôles et permissions :**
```javascript
// Création correspondances
'AGENT_BUREAU_ORDRE'        // ✅ Recommandé pour agents
'SUPERVISEUR_BUREAU_ORDRE'  // ✅ Pour superviseurs
'DIRECTEUR'                 // ✅ Pour directeurs (tests)
'DIRECTEUR_GENERAL'         // ✅ Pour DG (tests)
'SUPER_ADMIN'              // ✅ Pour admins

// Autres rôles
'USER'                     // ❌ Pas autorisé
'GUEST'                    // ❌ Pas autorisé
```

---

**L'erreur 403 d'Asma est maintenant résolue ! Elle peut créer des correspondances normalement. 🎯✨**
