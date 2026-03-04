# 🔧 Résolution du Problème localhost:5000

## ❌ Problème Identifié

Le client sur le réseau reçoit encore `http://localhost:5000` au lieu de `http://10.20.14.130:5000`, causant l'erreur :
```
Environment variable VITE_API_BASE_URL: http://localhost:5000
Failed to load resource: net::ERR_CONNECTION_REFUSED
```

## 🔍 Cause Racine

1. **Variable d'environnement non mise à jour** : Vite n'a pas rechargé le `.env`
2. **Cache Vite** : Le cache contient l'ancienne configuration
3. **Serveur non redémarré** : Les changements d'environnement nécessitent un redémarrage

## ✅ Solutions Appliquées

### 1. **Correction Automatique de Configuration**
Modifié `src/config/api.ts` pour détecter automatiquement l'IP :
```typescript
// Si on est sur une IP réseau, utiliser cette IP automatiquement
if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
  return `http://${currentHost}:5000`;
}
```

### 2. **Scripts de Correction**
- **`fix-network-config.bat`** - Corrige le fichier `.env`
- **`restart-network-frontend.bat`** - Redémarre avec la bonne config

### 3. **Logs de Debug Améliorés**
Ajouté des logs détaillés pour identifier le problème :
```javascript
console.log('🌐 [API Config] Current hostname:', window.location.hostname);
console.log('🌐 [API Config] Environment variable VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('🌐 [API Config] Resolved API_BASE_URL:', API_BASE_URL);
```

## 🚀 Étapes de Résolution

### Option 1: Correction Automatique (Recommandée)
```bash
# 1. Exécuter le script de correction
fix-network-config.bat

# 2. Redémarrer le frontend
restart-network-frontend.bat
```

### Option 2: Correction Manuelle
```bash
# 1. Arrêter le serveur frontend (Ctrl+C)

# 2. Vérifier le fichier .env
type .env | findstr VITE_API_BASE_URL
# Doit afficher: VITE_API_BASE_URL=http://10.20.14.130:5000

# 3. Si incorrect, modifier manuellement le .env
# Remplacer: VITE_API_BASE_URL=http://localhost:5000
# Par: VITE_API_BASE_URL=http://10.20.14.130:5000

# 4. Supprimer le cache Vite
rmdir /s /q node_modules\.vite
rmdir /s /q .vite

# 5. Redémarrer le serveur
npm run dev
```

### Option 3: Détection Automatique (Nouvelle Fonctionnalité)
Grâce à la modification de `api.ts`, l'application détecte maintenant automatiquement l'IP :
- **Sur localhost** → utilise `http://localhost:5000`
- **Sur IP réseau** → utilise `http://[IP_ACTUELLE]:5000`

## 🧪 Validation

### 1. **Vérifier les Logs Console**
Après redémarrage, la console doit afficher :
```
🌐 [API Config] Current hostname: 10.20.14.130
🌐 [API Config] Environment variable VITE_API_BASE_URL: http://10.20.14.130:5000
🌐 [API Config] Resolved API_BASE_URL: http://10.20.14.130:5000
```

### 2. **Tester la Connexion**
- **Login** doit fonctionner sans erreur `ERR_CONNECTION_REFUSED`
- **Requêtes API** doivent aller vers `10.20.14.130:5000`

### 3. **Vérifier depuis Client Réseau**
```bash
# Depuis un autre poste du réseau
ping 10.20.14.130
# Puis ouvrir: http://10.20.14.130:8080
```

## 🔄 Workflow Complet

### Pour le Serveur (10.20.14.130)
```bash
# 1. Corriger la configuration
fix-network-config.bat

# 2. Démarrer le backend
cd backend
npm start

# 3. Démarrer le frontend
npm run dev
```

### Pour les Clients Réseau
```bash
# Ouvrir navigateur et aller à:
http://10.20.14.130:8080

# Vérifier la console (F12) pour les logs:
# Doit afficher l'IP 10.20.14.130 et non localhost
```

## ⚠️ Points d'Attention

### 1. **Redémarrage Obligatoire**
Les variables d'environnement Vite ne sont chargées qu'au démarrage.
**Toujours redémarrer** après modification du `.env`.

### 2. **Cache Vite**
Le cache peut conserver l'ancienne configuration.
**Toujours supprimer** `node_modules/.vite` en cas de doute.

### 3. **Pare-feu**
S'assurer que les ports 5000 et 8080 sont ouverts :
```cmd
netsh advfirewall firewall add rule name="SGDO Backend" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="SGDO Frontend" dir=in action=allow protocol=TCP localport=8080
```

## 🎯 Résultat Attendu

Après correction, les logs client doivent afficher :
```
🌐 [API Config] Current hostname: 10.20.14.130
🌐 [API Config] Resolved API_BASE_URL: http://10.20.14.130:5000
axios request interceptor: Making request to /api/auth/login
AuthContext: Login successful for: user@example.com
```

## 🔧 Dépannage Avancé

### Si le Problème Persiste
1. **Vérifier les processus** : `tasklist | findstr node`
2. **Tuer tous les processus Node** : `taskkill /f /im node.exe`
3. **Redémarrer complètement** : Backend + Frontend
4. **Vider cache navigateur** : Ctrl+F5

### Logs de Debug
La nouvelle configuration affiche des logs détaillés pour identifier rapidement le problème :
- Hostname détecté
- Variable d'environnement lue
- URL API résolue
- URL complète de la page

---

## ✅ Le problème localhost:5000 est maintenant résolu !

Avec la détection automatique d'IP et les scripts de correction, l'application s'adapte automatiquement à l'environnement réseau. 🎉
