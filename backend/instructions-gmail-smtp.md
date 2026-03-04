# Configuration Gmail SMTP pour AeroDoc

## Étapes de configuration

### 1. Activer l'authentification à 2 facteurs sur Gmail
1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. Cliquez sur "Sécurité" dans le menu de gauche
3. Activez "Validation en 2 étapes" si ce n'est pas déjà fait

### 2. Générer un mot de passe d'application
1. Dans la section "Sécurité", cliquez sur "Mots de passe des applications"
2. Sélectionnez "Autre (nom personnalisé)" et tapez "AeroDoc"
3. Copiez le mot de passe généré (16 caractères)

### 3. Configurer le fichier .env
Modifiez les variables suivantes dans `backend/.env`:

```env
# SMTP Email Configuration (for notifications and password reset)
# Configuration pour serveur SMTP Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=votre_email@gmail.com
SMTP_PASSWORD=mot_de_passe_application_16_caracteres
EMAIL_FROM=votre_email@gmail.com
EMAIL_FROM_NAME=AeroDoc
```

### 4. Tester la configuration
Exécutez le script de test depuis le dossier backend:

```bash
cd backend
node test-gmail-smtp.js
```

## Paramètres Gmail SMTP

| Paramètre | Valeur |
|-----------|--------|
| Serveur SMTP | smtp.gmail.com |
| Port | 587 (STARTTLS) ou 465 (SSL) |
| Sécurité | STARTTLS (recommandé) |
| Authentification | Obligatoire |

## Dépannage

### Erreur EAUTH (Authentification échouée)
- Vérifiez que vous utilisez un mot de passe d'application, pas votre mot de passe Gmail
- Assurez-vous que l'authentification à 2 facteurs est activée
- Régénérez un nouveau mot de passe d'application

### Erreur ECONNECTION (Connexion échouée)
- Vérifiez votre connexion internet
- Vérifiez que le port 587 n'est pas bloqué par votre firewall
- Essayez le port 465 avec `SMTP_SECURE=true`

### Emails non reçus
- Vérifiez le dossier spam/courrier indésirable
- Vérifiez que l'adresse email destinataire est correcte
- Vérifiez les logs du serveur pour les erreurs

## Activation des notifications

Les notifications par email sont activées automatiquement pour:
- Nouvelles correspondances
- Réponses aux correspondances
- Actions assignées
- Rappels d'échéances

Les utilisateurs peuvent désactiver les notifications dans leurs paramètres personnels.
