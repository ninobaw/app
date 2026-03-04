# Guide : Obtenir et configurer le mot de passe d'application Gmail

## 📋 Prérequis
- Un compte Gmail actif
- L'authentification à 2 facteurs activée sur votre compte Gmail

## 🔐 Étape 1 : Activer l'authentification à 2 facteurs

1. **Allez sur votre compte Google :**
   - Ouvrez [myaccount.google.com](https://myaccount.google.com)
   - Connectez-vous avec votre compte Gmail

2. **Accédez aux paramètres de sécurité :**
   - Cliquez sur **"Sécurité"** dans le menu de gauche
   - Trouvez la section **"Se connecter à Google"**

3. **Activez la validation en 2 étapes :**
   - Cliquez sur **"Validation en 2 étapes"**
   - Suivez les instructions pour configurer votre téléphone
   - ⚠️ **Important :** Cette étape est obligatoire pour créer des mots de passe d'application

## 🔑 Étape 2 : Générer un mot de passe d'application

1. **Retournez dans "Sécurité" :**
   - Une fois la validation en 2 étapes activée
   - Vous verrez maintenant **"Mots de passe des applications"**

2. **Créez un nouveau mot de passe d'application :**
   - Cliquez sur **"Mots de passe des applications"**
   - Sélectionnez **"Autre (nom personnalisé)"**
   - Tapez : **"AeroDoc"** ou **"AeroDoc Email Notifications"**
   - Cliquez sur **"Générer"**

3. **Copiez le mot de passe généré :**
   - Google affiche un mot de passe de 16 caractères (ex: `abcd efgh ijkl mnop`)
   - **⚠️ IMPORTANT :** Copiez-le immédiatement, il ne sera plus affiché
   - Exemple : `abcdefghijklmnop` (sans espaces pour la configuration)

## 📝 Étape 3 : Configurer AeroDoc

1. **Ouvrez le fichier de configuration :**
   ```
   backend/.env
   ```

2. **Modifiez ces lignes avec vos vraies informations :**
   ```env
   # SMTP Email Configuration (for notifications and password reset)
   # Configuration pour serveur SMTP Gmail
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USERNAME=votre_email@gmail.com
   SMTP_PASSWORD=abcdefghijklmnop
   EMAIL_FROM=votre_email@gmail.com
   EMAIL_FROM_NAME=AeroDoc
   ```

3. **Exemple concret :**
   ```env
   SMTP_USERNAME=abdallah.benkhalifa@gmail.com
   SMTP_PASSWORD=abcdefghijklmnop
   EMAIL_FROM=abdallah.benkhalifa@gmail.com
   EMAIL_FROM_NAME=AeroDoc Enfidha
   ```

## 🧪 Étape 4 : Tester la configuration

1. **Ouvrez un terminal dans le dossier backend :**
   ```bash
   cd backend
   ```

2. **Exécutez le script de test :**
   ```bash
   node test-gmail-smtp.js
   ```

3. **Résultats attendus :**
   ```
   ✅ Variables d'environnement configurées
   ✅ Connexion SMTP réussie !
   ✅ Email de test envoyé avec succès !
   🎉 Configuration Gmail SMTP validée avec succès !
   ```

## 🔄 Mettre à jour un mot de passe existant

Si vous devez changer le mot de passe d'application :

1. **Révoquez l'ancien :**
   - Retournez sur [myaccount.google.com](https://myaccount.google.com)
   - Sécurité → Mots de passe des applications
   - Trouvez "AeroDoc" et cliquez sur la corbeille pour le supprimer

2. **Créez un nouveau :**
   - Répétez l'étape 2 ci-dessus
   - Mettez à jour le fichier `.env` avec le nouveau mot de passe

3. **Redémarrez le serveur AeroDoc :**
   ```bash
   # Arrêtez le serveur (Ctrl+C)
   # Puis redémarrez
   npm run dev
   ```

## ❌ Dépannage

### Erreur "Invalid credentials"
- Vérifiez que vous utilisez le mot de passe d'application, pas votre mot de passe Gmail
- Vérifiez qu'il n'y a pas d'espaces dans le mot de passe
- Régénérez un nouveau mot de passe d'application

### Erreur "Less secure app access"
- Cette erreur n'arrive plus avec les mots de passe d'application
- Si elle persiste, vérifiez que l'authentification 2 facteurs est bien activée

### Emails non reçus
- Vérifiez le dossier spam/courrier indésirable
- Testez d'abord avec le script `test-gmail-smtp.js`
- Vérifiez les logs du serveur AeroDoc

## 🔐 Sécurité

- **Ne partagez jamais** votre mot de passe d'application
- **Révoquez** les mots de passe d'application non utilisés
- **Utilisez des noms descriptifs** pour identifier vos applications
- **Surveillez** l'activité de votre compte Google régulièrement

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que l'authentification 2 facteurs est activée
2. Testez avec le script `test-gmail-smtp.js`
3. Consultez les logs du serveur pour plus de détails
4. Régénérez un nouveau mot de passe d'application si nécessaire
