# 🚀 Démarrage SGDO en Mode Réseau

## ✅ Configuration Vérifiée

La configuration est **déjà correcte** pour l'accès réseau :
- **IP Serveur** : `10.20.14.130`
- **API Backend** : `http://10.20.14.148:5000`
- **Frontend Web** : `http://10.20.14.148:8080`

## 🎯 Étapes de Démarrage

### 1. **Démarrer le Backend**
```bash
# Ouvrir un terminal dans le dossier backend
cd backend
npm start
```

### 2. **Démarrer le Frontend**
```bash
# Ouvrir un nouveau terminal dans le dossier racine
npm run dev
```

### 3. **Vérifier l'Accès**
- **Local** : `http://localhost:8080`
- **Réseau** : `http://10.20.14.148:8080`

## 🔧 Configuration Pare-feu (Si Nécessaire)

Si les utilisateurs du réseau ne peuvent pas accéder :

### Windows Defender Firewall
```cmd
# Exécuter en tant qu'administrateur
netsh advfirewall firewall add rule name="SGDO Backend" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="SGDO Frontend" dir=in action=allow protocol=TCP localport=8080
```

### Ou via Interface Graphique
1. Ouvrir **Pare-feu Windows Defender**
2. Cliquer **Règles de trafic entrant**
3. Cliquer **Nouvelle règle...**
4. Sélectionner **Port** → **TCP** → **Ports spécifiques** : `5000, 8080`
5. **Autoriser la connexion**
6. Nommer la règle : `SGDO Application`

## 👥 Instructions Utilisateurs

### Accès à l'Application
1. **Ouvrir un navigateur** (Chrome, Firefox, Edge)
2. **Aller à** : `http://10.20.14.130:8080`
3. **Se connecter** avec les identifiants

### En Cas de Problème
- **Vérifier la connectivité** : `ping 10.20.14.130`
- **Vider le cache** : Ctrl+F5
- **Contacter l'administrateur**

## 🔍 Vérifications Rapides

### Backend Actif
```bash
# Test dans un navigateur ou curl
http://10.20.14.148:5000/
# Doit afficher: "SGDO Backend API is running"
```

### Frontend Actif
```bash
# Test dans un navigateur
http://10.20.14.148:8080/
# Doit afficher l'interface de login SGDO
```

## ⚡ Démarrage Rapide

### Script Automatique (Option)
```bash
# Utiliser le script de démarrage
start-network-mode.bat
```

### Démarrage Manuel (Recommandé)
```bash
# Terminal 1
cd backend && npm start

# Terminal 2  
npm run dev
```

## 📊 Monitoring

### Logs à Surveiller
- **Backend** : Messages de connexion et erreurs API
- **Frontend** : Console navigateur (F12) pour erreurs JavaScript
- **Réseau** : Onglet Network pour requêtes échouées

### Signaux de Bon Fonctionnement
- ✅ Backend affiche : "Serveur démarré" + IP réseau
- ✅ Frontend affiche : "Local: http://localhost:8080, Network: http://10.20.14.130:8080"
- ✅ Page de login se charge sans erreur
- ✅ Connexion utilisateur fonctionne

## 🆘 Résolution de Problèmes

### Interface se charge mais pas les données
- **Cause** : Requêtes API bloquées
- **Solution** : Vérifier que le backend est accessible sur port 5000

### Erreur "Connection Refused"
- **Cause** : Serveurs non démarrés ou pare-feu
- **Solution** : Démarrer les serveurs + configurer pare-feu

### Lenteur de l'application
- **Cause** : Réseau surchargé ou serveur sous-dimensionné
- **Solution** : Vérifier performances réseau et serveur

---

## 🎉 L'application est maintenant accessible sur le réseau !

**URL d'accès** : `http://10.20.14.130:8080`

Les utilisateurs du réseau peuvent maintenant accéder à SGDO depuis leurs postes de travail.
