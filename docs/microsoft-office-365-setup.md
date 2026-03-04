# Configuration Microsoft Office 365 - Guide d'Installation

## 🎯 Vue d'Ensemble

Ce guide vous accompagne dans la configuration de l'intégration Microsoft Office 365 pour AeroDoc, permettant l'édition collaborative de documents directement dans Word, Excel et PowerPoint en ligne.

## 📋 Prérequis

- Compte Microsoft 365 Business/Enterprise
- Accès administrateur Azure AD
- Application AeroDoc déployée

## 🔧 Configuration Azure AD

### Étape 1 : Créer une Application Azure AD

1. **Connectez-vous au portail Azure** : https://portal.azure.com
2. **Localisez Azure Active Directory** :
   - **Option A** : Dans la barre de recherche en haut, tapez "Azure Active Directory" ou "Entra ID"
   - **Option B** : Dans le menu de gauche, cliquez sur "Tous les services" puis cherchez "Azure Active Directory"
   - **Option C** : Si vous voyez "Microsoft Entra ID" dans le menu, c'est le nouveau nom d'Azure AD
3. **Naviguez vers "Inscriptions d'applications"** (App registrations)
4. **Cliquez sur "Nouvelle inscription"** (New registration)
4. **Configurez l'application** :
   - **Nom** : `AeroDoc Office 365 Integration`
   - **Types de comptes pris en charge** : Comptes dans cet annuaire organisationnel uniquement
   - **URI de redirection** : `http://localhost:5173/auth/microsoft/callback` (développement)

### Étape 2 : Configurer les Permissions API

1. **Allez dans "Autorisations de l'API"**
2. **Ajoutez les permissions Microsoft Graph** :
   - `Files.ReadWrite.All` (Application + Délégué)
   - `Sites.ReadWrite.All` (Application + Délégué)
   - `User.Read` (Délégué)
3. **Accordez le consentement administrateur**

### Étape 3 : Créer un Secret Client

1. **Allez dans "Certificats et secrets"**
2. **Cliquez sur "Nouveau secret client"**
3. **Configurez** :
   - **Description** : `AeroDoc Integration Secret`
   - **Expire** : 24 mois
4. **Copiez la valeur** (elle ne sera plus visible après)

### Étape 4 : Noter les Informations

Récupérez ces informations depuis la page "Vue d'ensemble" :
- **ID d'application (client)** : `MICROSOFT_CLIENT_ID`
- **ID de l'annuaire (locataire)** : `MICROSOFT_TENANT_ID`
- **Secret client** : `MICROSOFT_CLIENT_SECRET`

## ⚙️ Configuration Backend

### Variables d'Environnement

Ajoutez ces variables à votre fichier `.env` :

```env
# Microsoft Office 365 Integration
MICROSOFT_CLIENT_ID=votre_client_id
MICROSOFT_CLIENT_SECRET=votre_client_secret
MICROSOFT_TENANT_ID=votre_tenant_id
MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/microsoft/callback
```

### Installation des Dépendances

```bash
cd backend
npm install axios form-data
```

## 🚀 Utilisation

### Pour les Utilisateurs

1. **Première utilisation** :
   - Cliquez sur "Éditer avec Microsoft Office"
   - Authentifiez-vous avec votre compte Microsoft
   - Accordez les permissions demandées

2. **Édition de documents** :
   - Le document est automatiquement uploadé sur OneDrive
   - S'ouvre dans l'interface Office 365 en ligne
   - Modifications sauvegardées automatiquement

3. **Synchronisation** :
   - Cliquez sur "Synchroniser" pour récupérer les modifications
   - Le document est mis à jour dans AeroDoc

### Pour les Administrateurs

1. **Gestion des utilisateurs** :
   - Vérifiez les statuts d'authentification Microsoft
   - Gérez les permissions d'accès

2. **Monitoring** :
   - Consultez les logs d'activité Office 365
   - Surveillez les synchronisations

## 🔒 Sécurité

### Bonnes Pratiques

- **Tokens** : Stockés de manière sécurisée en base de données
- **Permissions** : Principe du moindre privilège
- **Audit** : Toutes les actions sont loggées
- **Expiration** : Gestion automatique du renouvellement des tokens

### Considérations de Sécurité

- Les fichiers sont stockés sur OneDrive de l'organisation
- Accès limité aux utilisateurs authentifiés
- Chiffrement en transit et au repos
- Conformité aux standards Microsoft 365

## 🛠️ Dépannage

### Erreurs Courantes

**Erreur d'authentification** :
- Vérifiez les variables d'environnement
- Confirmez les permissions Azure AD
- Validez l'URI de redirection

**Échec d'upload** :
- Vérifiez les permissions OneDrive
- Contrôlez la taille du fichier
- Validez le format de fichier

**Problème de synchronisation** :
- Vérifiez la connectivité réseau
- Confirmez que le fichier existe sur OneDrive
- Validez les permissions de lecture/écriture

### Logs Utiles

```bash
# Backend logs
tail -f backend/logs/microsoft-office.log

# Vérifier les tokens utilisateur
db.users.find({}, {microsoftAccessToken: 1, microsoftTokenUpdatedAt: 1})
```

## 📊 Monitoring

### Métriques à Surveiller

- Nombre d'authentifications Microsoft par jour
- Taux de succès des synchronisations
- Temps de réponse des API Microsoft Graph
- Erreurs d'authentification et d'autorisation

### Alertes Recommandées

- Échec d'authentification répété
- Erreurs de synchronisation en masse
- Dépassement des quotas Microsoft Graph
- Tokens expirés non renouvelés

## 🔄 Migration depuis OnlyOffice

### Étapes de Migration

1. **Phase de test** : Déployez en parallèle
2. **Formation utilisateurs** : Guides et sessions
3. **Migration progressive** : Par département
4. **Désactivation OnlyOffice** : Après validation complète

### Comparaison des Fonctionnalités

| Fonctionnalité | OnlyOffice | Microsoft 365 |
|----------------|------------|---------------|
| Édition collaborative | ✅ | ✅ |
| Commentaires | ✅ | ✅ |
| Historique des versions | ✅ | ✅ |
| Intégration IA | ❌ | ✅ |
| Templates avancés | ⚠️ | ✅ |
| Maintenance serveur | ❌ | ✅ |

## 📞 Support

Pour toute question ou problème :
- **Documentation** : Consultez ce guide
- **Logs** : Vérifiez les fichiers de log
- **Support Microsoft** : Pour les problèmes Azure AD/Graph API
- **Équipe AeroDoc** : Pour les problèmes d'intégration

---

**Version** : 1.0  
**Dernière mise à jour** : 2024-01-28  
**Auteur** : Équipe AeroDoc
