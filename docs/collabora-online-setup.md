# Configuration Collabora Online pour AeroDoc

## 🎯 Vue d'ensemble

Collabora Online est une solution open source basée sur LibreOffice qui permet l'édition collaborative de documents en temps réel.

## 🐳 Installation avec Docker (Recommandée)

### Prérequis
- Docker et Docker Compose installés
- Port 9980 disponible
- Certificat SSL (optionnel pour développement)

### Configuration Docker Compose

Créez un fichier `docker-compose.collabora.yml` :

```yaml
version: '3.8'

services:
  collabora:
    image: collabora/code:latest
    container_name: collabora-online
    ports:
      - "9980:9980"
    environment:
      - domain=localhost:5173
      - DONT_GEN_SSL_CERT=true
      - extra_params=--o:ssl.enable=false --o:ssl.termination=true
      - username=admin
      - password=admin123
    volumes:
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    restart: unless-stopped
    cap_add:
      - MKNOD
```

### Démarrage du serveur

```bash
# Démarrer Collabora Online
docker-compose -f docker-compose.collabora.yml up -d

# Vérifier le statut
docker-compose -f docker-compose.collabora.yml ps

# Voir les logs
docker-compose -f docker-compose.collabora.yml logs -f collabora
```

### Vérification de l'installation

Ouvrez votre navigateur et allez à : `http://localhost:9980`

Vous devriez voir la page d'administration de Collabora Online.

## 🔧 Configuration Production

### Avec SSL/TLS

```yaml
services:
  collabora:
    image: collabora/code:latest
    ports:
      - "9980:9980"
    environment:
      - domain=votre-domaine.com
      - username=admin
      - password=VotreMotDePasseSecurise
      - extra_params=--o:ssl.enable=true --o:ssl.cert_file_path=/etc/ssl/certs/collabora.crt --o:ssl.key_file_path=/etc/ssl/private/collabora.key
    volumes:
      - /path/to/ssl/cert.crt:/etc/ssl/certs/collabora.crt:ro
      - /path/to/ssl/private.key:/etc/ssl/private/collabora.key:ro
```

## 🌐 Variables d'environnement

Ajoutez dans votre fichier `.env` :

```env
# Collabora Online Configuration
COLLABORA_SERVER_URL=http://localhost:9980
COLLABORA_ADMIN_USERNAME=admin
COLLABORA_ADMIN_PASSWORD=admin123
COLLABORA_DOMAIN=localhost:5173
```

## 🔐 Sécurité

### Configuration des domaines autorisés

Dans l'interface d'administration de Collabora (`http://localhost:9980`), configurez :

1. **Domaines autorisés** : `localhost:5173`, `127.0.0.1:5173`
2. **WOPI Host** : Votre serveur backend
3. **Authentification** : Activée avec tokens

### Tokens de sécurité

Collabora utilise des tokens JWT pour sécuriser l'accès aux documents via l'API WOPI.

## 🧪 Test de l'installation

### Test basique

```bash
# Test de connectivité
curl -k http://localhost:9980/hosting/discovery

# Test WOPI
curl -k "http://localhost:9980/hosting/wopi/discovery"
```

### Test avec document

1. Créez un document de test
2. Générez une URL WOPI
3. Ouvrez dans Collabora Online

## 📊 Monitoring

### Logs utiles

```bash
# Logs Collabora
docker logs collabora-online

# Logs détaillés
docker exec collabora-online tail -f /var/log/loolwsd.log
```

### Métriques de performance

- CPU : Surveillez l'utilisation lors de l'édition simultanée
- Mémoire : ~200MB par document ouvert
- Réseau : Bande passante pour la synchronisation temps réel

## 🔧 Dépannage

### Problèmes courants

**Erreur de connexion :**
```bash
# Vérifier le statut du container
docker ps | grep collabora

# Redémarrer si nécessaire
docker-compose -f docker-compose.collabora.yml restart
```

**Problème de domaine :**
- Vérifiez la configuration `domain` dans docker-compose
- Assurez-vous que le domaine correspond à votre frontend

**Performance lente :**
- Augmentez les ressources Docker
- Vérifiez la configuration réseau

## 📚 Ressources

- [Documentation officielle Collabora](https://www.collaboraoffice.com/code/)
- [API WOPI Microsoft](https://docs.microsoft.com/en-us/microsoft-365/cloud-storage-partner-program/rest/)
- [Guide d'intégration](https://sdk.collaboraonline.com/)

## 🔄 Migration depuis OnlyOffice

1. **Sauvegarde** : Exportez tous les documents existants
2. **Test parallèle** : Testez Collabora avec quelques documents
3. **Migration progressive** : Basculez par étapes
4. **Formation** : Formez les utilisateurs aux nouvelles fonctionnalités
