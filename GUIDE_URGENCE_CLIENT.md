# 🚨 Guide d'Urgence - Problème Réseau Client

## ⚡ Actions Immédiates pour le Client

### **1. Navigation Privée (Test Rapide)**
```
1. Ouvrir une fenêtre de navigation privée:
   - Chrome: Ctrl+Shift+N
   - Firefox: Ctrl+Shift+P  
   - Edge: Ctrl+Shift+N

2. Aller à: http://10.20.14.130:8080

3. Tester la connexion
```

**Si ça fonctionne en navigation privée → C'est un problème de cache !**

### **2. Vider le Cache Navigateur**
```
1. Ouvrir les outils développeur (F12)
2. Clic droit sur le bouton actualiser
3. Sélectionner "Vider le cache et actualiser"
4. Ou: Ctrl+Shift+Delete → Tout supprimer
```

### **3. Désactiver le Cache Temporairement**
```
1. Outils développeur (F12)
2. Onglet "Network" 
3. Cocher "Disable cache"
4. Actualiser avec Ctrl+F5
```

## 🔧 Actions Côté Serveur

### **Redémarrage Complet Forcé**
```bash
# Exécuter ce script sur le serveur
force-restart-network.bat
```

### **Vérification des Logs**
Après redémarrage, les logs client doivent afficher :
```
🔧 [API Config] Debug - currentHost: 10.20.14.130
🔧 [API Config] FORCE - Utilisation IP réseau détectée
🌐 [API Config] Resolved API_BASE_URL: http://10.20.14.130:5000
```

## 🎯 Diagnostic Rapide

### **Logs à Vérifier (F12 → Console)**

#### **✅ Logs Corrects :**
```
🔧 [API Config] FORCE - Utilisation IP réseau détectée
🌐 [API Config] Resolved API_BASE_URL: http://10.20.14.130:5000
AuthContext: Login successful
```

#### **❌ Logs Problématiques :**
```
Environment variable VITE_API_BASE_URL: http://localhost:5000
Failed to load resource: net::ERR_CONNECTION_REFUSED
```

## 🚀 Solutions par Ordre de Priorité

### **Solution 1: Navigation Privée (30 secondes)**
- Ouvrir fenêtre privée
- Tester http://10.20.14.130:8080
- Si ça marche → Problème de cache confirmé

### **Solution 2: Cache Navigateur (2 minutes)**
- F12 → Network → Disable cache
- Ctrl+F5 pour actualiser
- Ou vider complètement le cache

### **Solution 3: Autre Navigateur (1 minute)**
- Si Chrome ne marche pas → Tester Firefox
- Si Firefox ne marche pas → Tester Edge
- Permet d'isoler le problème

### **Solution 4: Redémarrage Serveur (5 minutes)**
- Exécuter `force-restart-network.bat`
- Attendre que les serveurs redémarrent
- Retester depuis le client

## 🔍 Tests de Validation

### **Test 1: API Backend Accessible**
```
Ouvrir: http://10.20.14.130:5000
Doit afficher: "SGDO Backend API is running"
```

### **Test 2: Frontend Accessible**
```
Ouvrir: http://10.20.14.130:8080  
Doit afficher: Interface de login SGDO
```

### **Test 3: Logs Console**
```
F12 → Console
Chercher: "🔧 [API Config] FORCE"
Doit afficher l'IP 10.20.14.130
```

## ⚠️ Si Rien ne Fonctionne

### **Vérifications Réseau**
```bash
# Depuis le poste client
ping 10.20.14.130
telnet 10.20.14.130 5000
telnet 10.20.14.130 8080
```

### **Pare-feu Client**
```
Vérifier que le pare-feu client n'bloque pas:
- Port 5000 (API)
- Port 8080 (Frontend)
```

### **DNS/Hosts**
```
Vérifier le fichier hosts:
C:\Windows\System32\drivers\etc\hosts

Ne doit PAS contenir:
10.20.14.130 localhost
```

## 📞 Escalade

### **Informations à Collecter**
1. **Navigateur utilisé** (Chrome, Firefox, Edge + version)
2. **Système d'exploitation** (Windows 10/11)
3. **Logs console** (capture d'écran F12)
4. **Test navigation privée** (fonctionne ou non)
5. **Test ping** (résultat de `ping 10.20.14.130`)

### **Tests Supplémentaires**
```bash
# Test direct API
http://10.20.14.130:5000/api/auth/login

# Test avec curl (si disponible)
curl http://10.20.14.130:5000/

# Test avec PowerShell
Invoke-WebRequest http://10.20.14.130:5000/
```

---

## ✅ Résolution Attendue

Après application des solutions, le client doit voir :
- **Interface de login** qui se charge normalement
- **Connexion utilisateur** qui fonctionne
- **Logs console** qui montrent l'IP 10.20.14.130
- **Aucune erreur** ERR_CONNECTION_REFUSED

**Dans 90% des cas, c'est un problème de cache navigateur !** 🎯
