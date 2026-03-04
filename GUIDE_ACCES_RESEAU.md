# 🌐 Guide d'Accès Réseau SGDO

## 📋 Configuration Actuelle

### Adresses Réseau
- **IP Serveur** : `10.20.14.130`
- **Port Backend** : `5000`
- **Port Frontend** : `8080`

### URLs d'Accès
- **Application Web** : `http://10.20.14.130:8080`
- **API Backend** : `http://10.20.14.130:5000`
- **Documentation API** : `http://10.20.14.130:5000/api-docs`

## ✅ Configuration Vérifiée

### 1. **Variables d'Environnement (.env)**
```env
VITE_API_BASE_URL=http://10.20.14.130:5000
FRONTEND_BASE_URL=http://10.20.14.130:8080
```

### 2. **Configuration Backend (server.js)**
```javascript
const HOST = '0.0.0.0'; // Écoute sur toutes les interfaces
const PORT = process.env.PORT || 5000;
```

### 3. **Configuration Frontend (vite.config.ts)**
```typescript
server: {
  host: true, // Écoute sur toutes les interfaces
  port: 8080,
  allowedHosts: ['10.20.14.130', ...]
}
```

### 4. **Configuration API (axios.ts)**
```typescript
baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
```

## 🚀 Démarrage en Mode Réseau

### Option 1: Script Automatique
```bash
# Exécuter le script de démarrage
start-network-mode.bat
```

### Option 2: Démarrage Manuel
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm run dev
```

## 🔧 Tests de Connectivité

### 1. **Test Automatique**
```bash
# Exécuter le script de test (en tant qu'administrateur)
test-network-connectivity.bat
```

### 2. **Tests Manuels**

#### Test Local (sur le serveur)
- Frontend : `http://localhost:8080`
- Backend : `http://localhost:5000`

#### Test Réseau (depuis un autre poste)
- Frontend : `http://10.20.14.130:8080`
- Backend : `http://10.20.14.130:5000`

## 🛡️ Configuration Pare-feu

### Windows Defender Firewall

#### Règles Requises
```cmd
# Autoriser port 5000 (Backend)
netsh advfirewall firewall add rule name="SGDO Backend" dir=in action=allow protocol=TCP localport=5000

# Autoriser port 8080 (Frontend)  
netsh advfirewall firewall add rule name="SGDO Frontend" dir=in action=allow protocol=TCP localport=8080
```

#### Vérification
```cmd
# Lister les règles
netsh advfirewall firewall show rule name="SGDO Backend"
netsh advfirewall firewall show rule name="SGDO Frontend"
```

## 👥 Instructions pour les Utilisateurs

### Accès à l'Application
1. **Ouvrir un navigateur web** (Chrome, Firefox, Edge)
2. **Aller à l'adresse** : `http://10.20.14.130:8080`
3. **Se connecter** avec les identifiants fournis

### Résolution de Problèmes

#### Si la page ne se charge pas :
- Vérifier la connexion réseau
- Ping du serveur : `ping 10.20.14.130`
- Contacter l'administrateur système

#### Si l'interface se charge mais les données ne s'affichent pas :
- Vérifier que l'API est accessible : `http://10.20.14.130:5000`
- Vider le cache du navigateur (Ctrl+F5)
- Vérifier les logs de la console (F12)

## 🔍 Diagnostics

### Logs Backend
```bash
# Vérifier les logs du serveur backend
# Rechercher les messages de connexion réseau
```

### Logs Frontend
```bash
# Ouvrir la console développeur (F12)
# Vérifier les requêtes réseau dans l'onglet Network
# Rechercher les erreurs CORS ou de connectivité
```

### Tests de Connectivité
```bash
# Test ping
ping 10.20.14.130

# Test ports (depuis un autre poste)
telnet 10.20.14.130 5000
telnet 10.20.14.130 8080

# Test HTTP (avec curl)
curl http://10.20.14.130:5000/
curl http://10.20.14.130:8080/
```

## ⚠️ Problèmes Courants

### 1. **Erreur "ERR_CONNECTION_REFUSED"**
- **Cause** : Serveur non démarré ou pare-feu bloquant
- **Solution** : Vérifier que les serveurs sont actifs et configurer le pare-feu

### 2. **Interface se charge mais requêtes échouent**
- **Cause** : Configuration API incorrecte
- **Solution** : Vérifier `VITE_API_BASE_URL` dans `.env`

### 3. **Erreur CORS**
- **Cause** : Configuration CORS backend
- **Solution** : Vérifier la configuration CORS dans `server.js`

### 4. **Timeout de connexion**
- **Cause** : Réseau lent ou surcharge serveur
- **Solution** : Vérifier la bande passante et les performances

## 📊 Monitoring

### Surveillance des Performances
- **CPU** : Surveiller l'utilisation processeur
- **RAM** : Vérifier la consommation mémoire
- **Réseau** : Monitorer le trafic réseau
- **Logs** : Analyser les logs d'erreur

### Métriques Importantes
- **Temps de réponse API** : < 2 secondes
- **Temps de chargement page** : < 5 secondes
- **Disponibilité** : > 99%
- **Utilisateurs simultanés** : Selon capacité serveur

## 🔄 Maintenance

### Redémarrage des Services
```bash
# Arrêter les serveurs (Ctrl+C dans les terminaux)
# Redémarrer avec start-network-mode.bat
```

### Mise à Jour de Configuration
1. Modifier le fichier `.env`
2. Redémarrer les serveurs
3. Tester la connectivité
4. Informer les utilisateurs

## 📞 Support

### Contacts
- **Administrateur Système** : [Nom/Email]
- **Support Technique** : [Nom/Email]
- **Documentation** : Ce guide + README.md

### Informations à Fournir en Cas de Problème
- **IP du poste client**
- **Navigateur utilisé** (version)
- **Message d'erreur exact**
- **Capture d'écran** si possible
- **Heure du problème**

---

## ✅ Checklist de Déploiement

- [ ] Configuration `.env` correcte
- [ ] Serveurs démarrés sur bonnes interfaces
- [ ] Pare-feu configuré
- [ ] Tests de connectivité réussis
- [ ] Accès utilisateur validé
- [ ] Documentation fournie aux utilisateurs
- [ ] Support technique informé

**L'application SGDO est maintenant accessible sur le réseau à l'adresse `http://10.20.14.130:8080` !** 🎉
