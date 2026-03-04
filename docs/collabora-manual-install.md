# Installation Manuelle de Collabora Online (Sans Docker)

## 🎯 Alternative pour Windows sans Docker

Si Docker Desktop n'est pas disponible, voici comment installer Collabora Online manuellement.

## 📦 Option 1: Utiliser un Service Cloud Gratuit

### Collabora Online Demo Server
Pour les tests de développement, vous pouvez utiliser le serveur de démonstration :

```env
# Dans votre .env
COLLABORA_SERVER_URL=https://collabora-online-demo.collaboraoffice.com
WOPI_SECRET=your-secure-wopi-secret-key
```

**⚠️ Attention :** Le serveur de démo a des limitations et ne doit être utilisé que pour les tests.

## 📦 Option 2: Installation Native Windows

### Prérequis
- Windows 10/11
- Node.js 18+ installé
- Port 9980 disponible

### Étapes d'installation

1. **Télécharger Collabora Online**
   ```bash
   # Créer un dossier pour Collabora
   mkdir C:\collabora-online
   cd C:\collabora-online
   ```

2. **Télécharger les binaires Windows**
   - Allez sur : https://www.collaboraoffice.com/code/
   - Téléchargez la version Windows
   - Extrayez dans `C:\collabora-online`

3. **Configuration**
   Créez un fichier `config.xml` :
   ```xml
   <config>
     <allowed_languages desc="List of allowed languages of documents to open">de_DE en_GB en_US es_ES fr_FR it nl pt_BR pt_PT ru</allowed_languages>
     <sys_template_path desc="Path to a template tree with shared libraries etc" type="path" relative="true" default="systemplate"></sys_template_path>
     <child_root_path desc="Path to the directory under which the chroot jails for the child processes will be created" type="path" relative="true" default="jails"></child_root_path>
     <server_name desc="External hostname:port of the server running loolwsd. If empty, it's derived from the request (please set it if this doesn't work). May be specified when the server is behind a reverse-proxy or when the hostname is not reachable directly." type="string" default=""></server_name>
     <file_server_root_path desc="Path to the directory that should be considered root for the file server" type="path" relative="true" default="browser/../.."></file_server_root_path>
     
     <storage desc="Backend storage">
       <wopi desc="Allow/deny wopi storage">
         <host desc="Regex pattern of hostname to allow or deny." allow="true">localhost</host>
         <host desc="Regex pattern of hostname to allow or deny." allow="true">127\.0\.0\.1</host>
         <host desc="Regex pattern of hostname to allow or deny." allow="true">.*\.local</host>
       </wopi>
     </storage>
     
     <ssl desc="SSL settings">
       <enable type="bool" desc="Controls whether SSL encryption is enable (do not disable for production deployment). If default is false, must first be compiled with SSL support to enable." default="false">false</enable>
     </ssl>
     
     <net desc="Network settings">
       <proto type="string" default="all" desc="Protocol to use IPv4, IPv6 or all for both">all</proto>
       <listen type="string" default="any" desc="Listen address that loolwsd binds to. Can be 'any' or 'loopback'.">any</listen>
       <service_root type="path" default="" desc="Prefix all the pages, websockets, etc. with this path."></service_root>
     </net>
   </config>
   ```

4. **Démarrage**
   ```bash
   # Dans le dossier Collabora
   ./loolwsd --config-file=config.xml --port=9980
   ```

## 📦 Option 3: Utiliser WSL2 avec Docker

Si vous avez WSL2 activé :

1. **Installer WSL2** (si pas déjà fait)
2. **Installer Docker dans WSL2**
3. **Lancer Collabora depuis WSL2**

```bash
# Dans WSL2
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo docker run -t -d -p 9980:9980 -e "domain=localhost:5173" collabora/code
```

## 📦 Option 4: Alternative - OnlyOffice Community

Si Collabora pose trop de problèmes, continuez avec OnlyOffice qui est déjà configuré :

```bash
# OnlyOffice est plus simple à installer sur Windows
npm install -g @onlyoffice/documentserver
```

## 🧪 Test de Connectivité

Une fois installé, testez :

```bash
# Test basique
curl http://localhost:9980/hosting/discovery

# Ou ouvrez dans le navigateur
http://localhost:9980
```

## 🔧 Dépannage

### Problème de port
```bash
# Vérifier si le port 9980 est libre
netstat -an | findstr :9980
```

### Problème de permissions
- Exécutez en tant qu'administrateur
- Vérifiez les règles du pare-feu Windows

## 💡 Recommandation

Pour un environnement de développement stable, **Docker Desktop** reste la meilleure option. L'installation manuelle est plus complexe et moins fiable.

**Voulez-vous que je vous guide dans l'installation de Docker Desktop ou préférez-vous continuer avec OnlyOffice ?**
