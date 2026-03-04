# 📧 Configuration SMTP pour AeroDoc

## 🎯 **Vue d'Ensemble**

Pour que le système d'envoi d'emails de bienvenue fonctionne, vous devez configurer les paramètres SMTP dans votre fichier `.env`. Voici les configurations pour les principaux fournisseurs d'email.

## ⚙️ **Variables d'Environnement**

Ajoutez ces variables dans votre fichier `backend/.env` :

```env
# Configuration SMTP
SMTP_HOST=smtp.exemple.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=votre-email@exemple.com
SMTP_PASSWORD=votre-mot-de-passe
EMAIL_FROM=votre-email@exemple.com
EMAIL_FROM_NAME=AeroDoc System
```

## 🌐 **Configurations par Fournisseur**

### **📧 Gmail**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
EMAIL_FROM=votre-email@gmail.com
EMAIL_FROM_NAME=AeroDoc System
```

**⚠️ Important pour Gmail :**
- Activez l'authentification à 2 facteurs
- Générez un "Mot de passe d'application" spécifique
- N'utilisez pas votre mot de passe Gmail normal

**🔗 Guide Gmail :**
1. Allez dans votre compte Google
2. Sécurité → Authentification à 2 facteurs
3. Mots de passe d'application → Générer
4. Utilisez ce mot de passe dans `SMTP_PASSWORD`

### **🏢 Office 365 / Outlook**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=votre-email@votredomaine.com
SMTP_PASSWORD=votre-mot-de-passe
EMAIL_FROM=votre-email@votredomaine.com
EMAIL_FROM_NAME=AeroDoc System
```

### **📮 Yahoo Mail**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=votre-email@yahoo.com
SMTP_PASSWORD=votre-mot-de-passe-app
EMAIL_FROM=votre-email@yahoo.com
EMAIL_FROM_NAME=AeroDoc System
```

### **🔒 ProtonMail**
```env
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USERNAME=votre-email@protonmail.com
SMTP_PASSWORD=votre-mot-de-passe
EMAIL_FROM=votre-email@protonmail.com
EMAIL_FROM_NAME=AeroDoc System
```
*Nécessite ProtonMail Bridge*

### **🏢 Serveur SMTP Personnalisé**
```env
SMTP_HOST=mail.votredomaine.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=noreply@votredomaine.com
SMTP_PASSWORD=mot-de-passe-securise
EMAIL_FROM=noreply@votredomaine.com
EMAIL_FROM_NAME=AeroDoc System
```

## 🔧 **Configuration Avancée**

### **🔐 SSL/TLS**
Pour une connexion sécurisée (port 465) :
```env
SMTP_PORT=465
SMTP_SECURE=true
```

### **🚫 Sans Authentification**
Pour un serveur SMTP local sans auth :
```env
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_SECURE=false
# Ne pas définir SMTP_USERNAME et SMTP_PASSWORD
```

### **🔍 Debug SMTP**
Pour activer les logs détaillés :
```env
SMTP_DEBUG=true
```

## 🧪 **Test de Configuration**

### **Script de Test**
```bash
# Tester la configuration SMTP
cd backend
node test-email-service.js
```

### **Résultat Attendu**
```
🧪 Test du Service de Notification Email

1. Test d'initialisation du service
   Service configuré: Oui

2. Test de génération de mot de passe
   Mot de passe 1: Kx7$mP9nQ2wE
   Différents: Oui
   Longueur: 12

3. Test de génération des informations de bienvenue
   Succès: Oui
   Message: Utilisateur Ahmed Test créé avec succès !

4. Test de génération du template email
   Template généré: Oui
   Longueur: 15847 caractères

5. Test d'envoi d'email (simulation)
   Résultat envoi:
   - Succès: Oui
   - Message ID: <abc123@gmail.com>

✅ Tests terminés !
```

## 🛠️ **Dépannage**

### **❌ Erreurs Courantes**

#### **"Authentication failed"**
- Vérifiez username/password
- Pour Gmail : utilisez un mot de passe d'application
- Vérifiez que l'authentification 2FA est activée

#### **"Connection timeout"**
- Vérifiez SMTP_HOST et SMTP_PORT
- Testez la connectivité réseau
- Vérifiez les pare-feux

#### **"Self signed certificate"**
Ajoutez dans votre configuration :
```env
NODE_TLS_REJECT_UNAUTHORIZED=0
```
*⚠️ Uniquement pour le développement*

#### **"Service not configured"**
- Vérifiez que toutes les variables SMTP sont définies
- Redémarrez le serveur après modification du .env

### **🔍 Logs de Debug**

Le service affiche des logs détaillés :
```
⚠️  Configuration SMTP incomplète. Les emails ne seront pas envoyés.
   Configurez SMTP_HOST, SMTP_USER, SMTP_PASS dans .env pour activer l'envoi d'emails.
```

```
✅ Email de bienvenue envoyé avec succès: <message-id>
```

```
❌ Erreur lors de l'envoi de l'email de bienvenue: Error message
```

## 🔒 **Sécurité**

### **🛡️ Bonnes Pratiques**

1. **Mots de passe d'application** : Utilisez des mots de passe spécifiques
2. **Comptes dédiés** : Créez un compte email spécifique pour l'application
3. **Variables d'environnement** : Ne jamais commiter les mots de passe
4. **Chiffrement** : Utilisez TLS/SSL quand possible
5. **Limitation** : Configurez des limites d'envoi si nécessaire

### **📝 Exemple de Compte Dédié**
```
Email: noreply@votredomaine.com
Nom: AeroDoc System
Usage: Envoi automatique d'emails système uniquement
```

## 📊 **Monitoring**

### **📈 Métriques à Surveiller**
- Taux de succès d'envoi
- Temps de réponse SMTP
- Erreurs d'authentification
- Bounces et rejets

### **🚨 Alertes Recommandées**
- Échec d'envoi > 10%
- Timeout SMTP > 30s
- Erreurs d'auth répétées

## 🔄 **Alternatives**

### **☁️ Services Cloud**
- **SendGrid** : Service professionnel
- **Mailgun** : API simple
- **Amazon SES** : Intégration AWS
- **Postmark** : Emails transactionnels

### **🏠 Solutions On-Premise**
- **Postfix** : Serveur SMTP Linux
- **hMailServer** : Serveur Windows
- **Zimbra** : Solution complète

---

**💡 Conseil :** Commencez avec Gmail ou Office 365 pour les tests, puis migrez vers une solution professionnelle pour la production.

**🆘 Support :** En cas de problème, vérifiez d'abord les logs du serveur et testez avec le script fourni.
