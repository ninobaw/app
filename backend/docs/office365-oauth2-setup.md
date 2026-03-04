# Configuration OAuth2 avec Office 365 pour l'envoi d'emails

Ce guide explique comment configurer l'authentification OAuth2 avec Office 365 pour permettre l'envoi d'emails depuis l'application AeroDoc.

## Prérequis

1. Un compte Office 365 avec des droits d'administration
2. Accès au [Portail Azure](https://portal.azure.com/)
3. L'application AeroDoc déployée avec accès au backend

## Étape 1 : Créer une inscription d'application dans Azure AD

1. Connectez-vous au [Portail Azure](https://portal.azure.com/)
2. Sélectionnez **Azure Active Directory** dans le menu de gauche
3. Cliquez sur **Inscriptions d'applications** > **Nouvelle inscription**
4. Configurez l'inscription :
   - **Nom** : `AeroDoc Email Sender`
   - **Types de comptes pris en charge** : "Comptes dans cet annuaire d’organisation uniquement"
   - **URI de redirection** : Sélectionnez "Web" et entrez `https://votre-domaine.com/auth/office365/callback` (remplacez par votre domaine réel)
5. Cliquez sur **S'inscrire**

## Étape 2 : Configurer les autorisations de l'application

1. Dans la page de vue d'ensemble de votre application, notez les valeurs suivantes :
   - **ID d'application (client)**
   - **ID de l'annuaire (locataire)**

2. Dans le menu de gauche, cliquez sur **Authentification** :
   - Ajoutez `https://localhost:5000/auth/office365/callback` comme URL de redirection (pour le développement local)
   - Cochez **Jetons d'accès** et **Jetons d'ID** sous **Octroi implicite et flux hybrides**
   - Cliquez sur **Enregistrer**

3. Dans le menu de gauche, cliquez sur **Certificats et secrets** :
   - Cliquez sur **Nouveau secret client**
   - Ajoutez une description (ex: "Clé secrète AeroDoc")
   - Sélectionnez une durée d'expiration (24 mois recommandé)
   - Cliquez sur **Ajouter**
   - **Important** : Copiez la valeur du secret immédiatement, elle ne sera plus affichée par la suite

4. Dans le menu de gauche, cliquez sur **Autorisations des API** :
   - Cliquez sur **Ajouter une autorisation**
   - Sélectionnez **Microsoft Graph** > **Autorisations déléguées**
   - Ajoutez les autorisations suivantes :
     - `SMTP.Send`
     - `IMAP.AccessAsUser.All`
     - `email`
     - `openid`
     - `profile`
   - Cliquez sur **Ajouter des autorisations**
   - Cliquez sur **Accorder le consentement de l'administrateur pour [nom du répertoire]**, puis confirmez

## Étape 3 : Mettre à jour la configuration de l'application

1. Mettez à jour votre fichier `.env` avec les informations de l'application :

```env
# Office 365 OAuth2 Configuration
OFFICE365_CLIENT_ID=votre_client_id
OFFICE365_CLIENT_SECRET=votre_client_secret
SMTP_USERNAME=votre.email@votredomaine.com
EMAIL_FROM_NAME="AeroDoc"
FRONTEND_BASE_URL=https://votre-domaine.com
```

2. Redémarrez votre serveur d'application pour charger les nouvelles variables d'environnement

## Étape 4 : Tester la configuration

1. Exécutez le script de test pour vérifier la configuration :

```bash
node test-oauth2.js
```

2. Suivez les instructions à l'écran pour autoriser l'application et tester l'envoi d'email

## Dépannage

### Erreur d'autorisation
- Vérifiez que vous avez accordé toutes les autorisations nécessaires
- Assurez-vous que le compte a les droits d'envoi d'emails

### Erreur de redirection
- Vérifiez que l'URL de redirection correspond exactement à celle configurée dans le portail Azure
- Assurez-vous que le protocole (http/https) est correct

### Erreur d'authentification
- Vérifiez que le client ID et le client secret sont corrects
- Assurez-vous que le client secret n'a pas expiré

## Sécurité

- Ne partagez jamais votre client secret
- Utilisez des durées de validité courtes pour les secrets clients
- Limitez les autorisations au strict nécessaire
- Utilisez des variables d'environnement pour stocker les informations sensibles

## Maintenance

- Renouvelez les secrets clients avant leur expiration
- Mettez à jour régulièrement les bibliothèques OAuth2
- Surveillez les journaux d'activité pour détecter les activités suspectes
