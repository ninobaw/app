# 🔐 Guide du Système de Liens Temporaires - SGDO

## 📋 Vue d'ensemble

Le système de liens temporaires permet de gérer de manière sécurisée la première connexion des nouveaux utilisateurs avec des mots de passe temporaires qui expirent automatiquement.

## 🚀 Fonctionnalités Principales

### ✅ Liens Sécurisés avec Expiration
- **Génération automatique** de liens temporaires avec tokens JWT
- **Expiration configurable** (par défaut 24 heures)
- **Usage unique** : le lien est invalidé après utilisation
- **Validation côté serveur** avec vérification d'expiration

### ✅ Gestion des Liens Expirés
- **Détection automatique** des liens expirés
- **Messages d'erreur explicites** pour l'utilisateur
- **Interface de récupération** avec options alternatives
- **Nettoyage automatique** des tokens expirés

### ✅ Connexion Automatique Sécurisée
- **Pré-remplissage automatique** des identifiants
- **Validation du token** avant connexion
- **Stockage temporaire** des informations pour changement de mot de passe
- **Redirection automatique** vers l'interface de changement

## 🔧 Architecture Technique

### Backend Components

#### 1. TemporaryPasswordService
```javascript
// Génération de lien temporaire
const { temporaryLink, tempToken, expiresAt } = await TemporaryPasswordService.generateTemporaryLink(
  userId,
  temporaryPassword,
  24 // heures d'expiration
);

// Validation de token
const tokenData = await TemporaryPasswordService.validateTemporaryToken(token);
```

#### 2. Routes API (/api/temp-auth)
- `POST /validate-token` : Validation d'un token temporaire
- `POST /login-with-temp` : Connexion avec mot de passe temporaire
- `POST /cleanup-expired` : Nettoyage des tokens expirés

#### 3. Modèle User Étendu
```javascript
// Nouveaux champs dans User.js
temporaryPasswordToken: { type: String },
temporaryPasswordExpires: { type: Date },
sessionTimeout: { type: Number, default: 25 }
```

### Frontend Components

#### 1. TemporaryLinkHandler
- **Validation automatique** des tokens dans l'URL
- **Interface utilisateur** pour les différents états
- **Gestion des erreurs** avec messages explicites
- **Redirection intelligente** selon le résultat

#### 2. LoginForm Amélioré
- **Détection des liens temporaires** dans l'URL
- **Redirection automatique** vers le gestionnaire spécialisé
- **Pré-remplissage** des identifiants pour compatibilité

#### 3. ForcePasswordChangeDialog Amélioré
- **Pré-remplissage automatique** du mot de passe temporaire
- **Nettoyage automatique** des données temporaires
- **Interface utilisateur** informative

## 📧 Intégration Email

### Template Email Moderne
- **Design responsive** avec CSS intégré
- **Lien direct** vers l'interface de connexion
- **Instructions claires** pour l'utilisateur
- **Informations d'expiration** visibles

### Exemple d'URL Générée
```
http://localhost:8080/login?email=user@example.com&password=TempPass123&temp=true
```

## 🔄 Workflow Complet

### 1. Création d'Utilisateur
```javascript
// 1. Admin crée un utilisateur
const newUser = await User.create({...});

// 2. Génération mot de passe temporaire
const tempPassword = TemporaryPasswordService.generateSecureTemporaryPassword();

// 3. Envoi email avec lien temporaire
await NewUserNotificationService.sendWelcomeEmail(userData, tempPassword);
```

### 2. Première Connexion
```
1. Utilisateur clique sur le lien dans l'email
2. Redirection vers /temp-login avec token
3. Validation automatique du token
4. Connexion automatique si token valide
5. Affichage du dialogue de changement de mot de passe
6. Nettoyage des données temporaires
```

### 3. Gestion des Erreurs
```
- Lien expiré → Message explicite + options de récupération
- Token invalide → Redirection vers connexion manuelle
- Erreur réseau → Possibilité de réessayer
- Compte désactivé → Message d'erreur approprié
```

## ⚙️ Configuration

### Variables d'Environnement
```env
# JWT pour les tokens temporaires
JWT_SECRET=your-secret-key

# URL frontend pour les liens
FRONTEND_BASE_URL=http://localhost:8080

# Configuration SMTP pour les emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM_NAME=SGDO System
```

### Paramètres Configurables
```javascript
// Durée d'expiration des liens (en heures)
const EXPIRATION_HOURS = 24;

// Longueur des mots de passe temporaires
const PASSWORD_LENGTH = 12;

// Timeout de session (en minutes)
const SESSION_TIMEOUT = 25;
```

## 🧪 Tests et Validation

### Script de Test Automatisé
```bash
# Exécution des tests
node backend/src/scripts/test-temporary-links.js

# Ou via le script batch
test-temporary-links.bat
```

### Tests Couverts
- ✅ Génération de liens temporaires
- ✅ Validation de tokens avec expiration
- ✅ Envoi d'emails (si SMTP configuré)
- ✅ Nettoyage des tokens expirés
- ✅ Gestion des erreurs
- ✅ Génération de mots de passe sécurisés

## 🛡️ Sécurité

### Mesures de Protection
- **Tokens JWT signés** avec secret sécurisé
- **Expiration automatique** des liens
- **Usage unique** des tokens
- **Validation côté serveur** obligatoire
- **Nettoyage automatique** des données expirées

### Bonnes Pratiques
- **Mots de passe temporaires complexes** (12+ caractères)
- **Durée d'expiration limitée** (24h max recommandé)
- **Logs de sécurité** pour traçabilité
- **Nettoyage régulier** des tokens expirés

## 🔧 Maintenance

### Nettoyage Automatique
```javascript
// Nettoyage périodique des tokens expirés
setInterval(async () => {
  const cleaned = await TemporaryPasswordService.cleanupExpiredTokens();
  console.log(`${cleaned} tokens expirés nettoyés`);
}, 24 * 60 * 60 * 1000); // Toutes les 24h
```

### Monitoring
- **Logs détaillés** pour chaque étape
- **Métriques d'utilisation** des liens
- **Alertes** pour les tentatives suspectes
- **Statistiques** d'expiration

## 📱 Interface Utilisateur

### États de l'Interface
1. **Validation** : Spinner + message de validation
2. **Succès** : Icône verte + message de confirmation
3. **Erreur** : Icône rouge + message d'erreur détaillé
4. **Options de récupération** : Boutons d'action appropriés

### Messages Utilisateur
- **Lien expiré** : "Ce lien a expiré. Contactez votre administrateur."
- **Lien invalide** : "Ce lien n'est pas valide ou a déjà été utilisé."
- **Succès** : "Connexion réussie ! Vous devez maintenant changer votre mot de passe."

## 🚀 Déploiement

### Checklist de Déploiement
- [ ] Configuration des variables d'environnement
- [ ] Test de la configuration SMTP
- [ ] Validation des URLs frontend/backend
- [ ] Test complet du workflow
- [ ] Configuration du nettoyage automatique
- [ ] Mise en place du monitoring

### Migration
Si vous migrez depuis l'ancien système :
1. Ajouter les nouveaux champs au modèle User
2. Déployer les nouvelles routes backend
3. Mettre à jour les composants frontend
4. Tester avec quelques utilisateurs pilotes
5. Déploiement complet

## 📞 Support

### Problèmes Courants
- **Lien expiré** → Demander un nouveau lien à l'admin
- **Email non reçu** → Vérifier spams + configuration SMTP
- **Erreur 401** → Token invalide, utiliser connexion manuelle
- **Erreur 500** → Problème serveur, contacter support technique

### Logs de Debug
```javascript
// Activation des logs détaillés
console.log('[TemporaryAuth] Token validé pour:', email);
console.log('[TemporaryAuth] Expiration:', expiresAt);
console.log('[TemporaryAuth] Connexion automatique réussie');
```

---

**© 2024 SGDO - Système de Gestion Documentaire Opérationnel**
