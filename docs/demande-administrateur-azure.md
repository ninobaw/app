# Demande d'Assistance - Configuration Azure AD pour AeroDoc

## 📋 Objet de la Demande

**Demandeur :** [Votre Nom]  
**Service :** [Votre Service]  
**Date :** [Date du jour]  
**Projet :** AeroDoc - Intégration Microsoft Office 365

## 🎯 Contexte

Nous développons une intégration Microsoft Office 365 pour l'application AeroDoc afin de permettre l'édition collaborative de documents directement dans Word, Excel et PowerPoint en ligne, en utilisant notre licence Microsoft 365 existante.

## 🔧 Assistance Requise

### Option 1 : Attribution de Permissions (Recommandée)

**Demande :** Attribuer les permissions suivantes à mon compte :
- **Rôle Azure AD :** "Administrateur d'application" ou "Développeur d'applications"
- **Accès :** Microsoft Entra ID (Azure Active Directory)
- **Durée :** Temporaire (le temps de créer l'application)

### Option 2 : Création de l'Application par l'Administrateur

Si l'Option 1 n'est pas possible, merci de créer l'application avec ces paramètres :

**Configuration de l'Application :**
- **Nom :** `AeroDoc Office 365 Integration`
- **Type :** Application web
- **URI de redirection :** `http://localhost:5173/auth/microsoft/callback`
- **Types de comptes :** Comptes dans cet annuaire organisationnel uniquement

**Permissions Microsoft Graph Requises :**
- `Files.ReadWrite.All` (Délégué + Application)
- `Sites.ReadWrite.All` (Délégué + Application)  
- `User.Read` (Délégué)

**Informations à Fournir :**
- ID d'application (Client ID)
- Secret client (Client Secret)
- ID de locataire (Tenant ID)

## 💼 Justification Métier

**Avantages :**
- Utilisation optimale de notre licence Microsoft 365 existante
- Amélioration de la productivité avec l'édition collaborative native
- Réduction des coûts (plus de serveur OnlyOffice à maintenir)
- Interface familière pour les utilisateurs
- Sécurité renforcée avec les standards Microsoft

**Impact :**
- Amélioration significative de l'expérience utilisateur
- Conformité avec les outils standards de l'entreprise
- Réduction de la charge de maintenance IT

## 🔒 Sécurité

**Mesures de Sécurité Implémentées :**
- Authentification OAuth2 sécurisée
- Stockage chiffré des tokens d'accès
- Permissions minimales requises (principe du moindre privilège)
- Audit complet des actions utilisateur
- Accès limité aux utilisateurs authentifiés

**Données Concernées :**
- Documents de l'application AeroDoc uniquement
- Pas d'accès aux autres données Microsoft 365
- Stockage temporaire sur OneDrive pour édition uniquement

## 📞 Contact

**Développeur :** [Votre Nom]  
**Email :** [Votre Email]  
**Téléphone :** [Votre Téléphone]  
**Disponibilité :** [Vos Horaires]

## 📎 Documents Techniques

- Guide de configuration complet : `docs/microsoft-office-365-setup.md`
- Code source de l'intégration disponible pour audit
- Documentation des API utilisées

---

**Merci pour votre assistance dans ce projet d'amélioration de notre infrastructure documentaire.**
