const nodemailer = require('nodemailer');
const { getFrontendURL } = require('../utils/networkUtils');

/**
 * Service pour envoyer des notifications aux nouveaux utilisateurs
 */
class NewUserNotificationService {
  constructor() {
    // Configuration du transporteur email (à adapter selon votre configuration SMTP)
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true' || false,
        auth: {
          user: process.env.SMTP_USERNAME || process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS
        }
      });
      
      // Vérifier si la configuration SMTP est disponible (support des deux formats de variables)
      const hasConfig = !!(
        process.env.SMTP_HOST && 
        (process.env.SMTP_USERNAME || process.env.SMTP_USER) && 
        (process.env.SMTP_PASSWORD || process.env.SMTP_PASS)
      );
      this.isConfigured = hasConfig;
      
      if (!this.isConfigured) {
        console.warn('⚠️  Configuration SMTP incomplète. Les emails ne seront pas envoyés.');
        console.warn('   Configurez SMTP_HOST, SMTP_USER, SMTP_PASS dans .env pour activer l\'envoi d\'emails.');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du service email:', error.message);
      this.transporter = null;
      this.isConfigured = false;
    }
  }

  /**
   * Génère le template HTML pour l'email de bienvenue
   */
  generateWelcomeEmailTemplate(userData, temporaryPassword) {
    const { firstName, lastName, email, role, airport } = userData;
    
    // URL du serveur (détection automatique ou depuis .env)
    const serverUrl = getFrontendURL(8080);
    
    const roleTranslations = {
      'SUPER_ADMIN': 'Super Administrateur',
      'ADMINISTRATOR': 'Administrateur',
      'DIRECTEUR_GENERAL': 'Directeur Général',
      'DIRECTEUR': 'Directeur',
      'DIRECTEUR_TECHNIQUE': 'Directeur Technique',
      'DIRECTEUR_COMMERCIAL': 'Directeur Commercial',
      'DIRECTEUR_FINANCIER': 'Directeur Financier',
      'DIRECTEUR_OPERATIONS': 'Directeur des Opérations',
      'DIRECTEUR_RH': 'Directeur des Ressources Humaines',
      'SOUS_DIRECTEUR': 'Sous-Directeur',
      'AGENT_BUREAU_ORDRE': 'Agent Bureau d\'Ordre',
      'SUPERVISEUR_BUREAU_ORDRE': 'Superviseur Bureau d\'Ordre',
      'APPROVER': 'Approbateur',
      'USER': 'Utilisateur',
      'VISITOR': 'Visiteur'
    };

    const airportNames = {
      'ENFIDHA': 'Aéroport International Enfidha-Hammamet',
      'MONASTIR': 'Aéroport International Monastir Habib Bourguiba',
      'GENERALE': 'Direction Générale'
    };

    return `
<!DOCTYPE html>
<html lang="fr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!--[if mso]>
    <xml>
        <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <title>Bienvenue dans SGDO</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #667eea;
            padding: 20px;
            margin: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        /* Outlook-specific styles */
        table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
        }
        
        .container {
            max-width: 650px;
            margin: 0 auto;
            background: white;
            border-radius: 25px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            overflow: hidden;
        }
        
        .header {
            background-color: #2a5298;
            color: white;
            padding: 50px 40px;
            text-align: center;
            position: relative;
        }
        
        .header h1 {
            font-size: 3.2em;
            margin-bottom: 15px;
            position: relative;
            z-index: 1;
            font-weight: 700;
            letter-spacing: 2px;
        }
        
        .header .subtitle {
            font-size: 1.3em;
            opacity: 0.95;
            position: relative;
            z-index: 1;
            font-weight: 300;
        }
        
        .welcome-icon {
            font-size: 5em;
            margin-bottom: 25px;
            display: block;
            animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        
        .content {
            padding: 50px 40px;
        }
        
        .greeting {
            font-size: 2em;
            color: #667eea;
            margin-bottom: 30px;
            text-align: center;
            font-weight: 600;
        }
        
        .welcome-message {
            text-align: center;
            font-size: 1.2em;
            margin-bottom: 40px;
            color: #555;
            line-height: 1.8;
        }
        
        .user-info {
            background-color: #f8f9ff;
            border-radius: 20px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
            border: 3px solid #e3f2fd;
        }
        
        .role-badge, .airport-badge {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 600;
            margin: 8px;
            font-size: 1em;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .role-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        
        .airport-badge {
            background: linear-gradient(135deg, #ff7b7b 0%, #667eea 100%);
            color: #ffffff !important;
            text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        
        .credentials-section {
            background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
            border: 3px solid #28a745;
            border-radius: 20px;
            padding: 35px;
            margin: 35px 0;
            position: relative;
        }
        
        .credentials-section::before {
            content: '🔐';
            position: absolute;
            top: -20px;
            left: 30px;
            background: white;
            padding: 8px 15px;
            border-radius: 25px;
            font-size: 2em;
            border: 3px solid #28a745;
        }
        
        .credentials-title {
            color: #28a745;
            font-size: 1.5em;
            font-weight: 600;
            margin-bottom: 25px;
            text-align: center;
        }
        
        .credential-box {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 15px;
            padding: 20px;
            margin: 15px 0;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        .credential-label {
            font-weight: 600;
            color: #666;
            font-size: 0.95em;
            margin-bottom: 8px;
        }
        
        .credential-value {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            padding: 12px 18px;
            border-radius: 10px;
            color: #1565c0;
            font-weight: 700;
            font-size: 1.1em;
            border: 2px solid #2196f3;
        }
        
        .login-button {
            text-align: center;
            margin: 35px 0;
        }
        
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 18px 40px;
            text-decoration: none;
            border-radius: 30px;
            font-weight: 600;
            font-size: 1.1em;
            box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(40, 167, 69, 0.4);
        }
        
        .warning {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 3px solid #ffc107;
            border-radius: 15px;
            padding: 25px;
            margin: 25px 0;
            text-align: center;
        }
        
        .warning-icon {
            font-size: 2.5em;
            margin-bottom: 15px;
            display: block;
        }
        
        .security-tips {
            background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%);
            border-radius: 20px;
            padding: 30px;
            margin: 30px 0;
            border: 3px solid #4caf50;
        }
        
        .security-tips h3 {
            color: #2e7d32;
            margin-bottom: 20px;
            text-align: center;
            font-size: 1.3em;
        }
        
        .security-tips ul {
            list-style: none;
            padding: 0;
        }
        
        .security-tips li {
            margin: 12px 0;
            padding-left: 30px;
            position: relative;
            color: #2e7d32;
            font-weight: 500;
        }
        
        .security-tips li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #4caf50;
            font-weight: bold;
            font-size: 1.2em;
        }
        
        .footer {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 40px;
            text-align: center;
            border-top: 3px solid #dee2e6;
        }
        
        .contact-info {
            background: white;
            border-radius: 15px;
            padding: 25px;
            margin: 25px 0;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            border: 2px solid #e9ecef;
        }
        
        .contact-info h4 {
            color: #2a5298;
            margin-bottom: 15px;
            font-size: 1.2em;
        }
        
        .footer-text {
            color: #666;
            font-size: 0.9em;
            margin-top: 25px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="welcome-icon">✈️</span>
            <h1>SGDO</h1>
            <div class="subtitle">Système de Gestion Documentaire</div>
        </div>
        
        <div class="content">
            <div class="greeting">
                Bienvenue ${firstName} ${lastName} !
            </div>
            
            <div class="welcome-message">
                Votre compte utilisateur a été créé avec succès.<br>
                Vous pouvez maintenant accéder au <strong>Système de Gestion Documentaire (SGDO)</strong>.
            </div>
            
            <div class="user-info">
                <div style="margin-bottom: 20px; font-size: 1.1em; color: #555;">
                    <strong>Vos informations :</strong>
                </div>
                <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                        <td style="padding: 12px 24px; border-radius: 25px; font-weight: 600; margin: 8px; font-size: 1em; background-color: #667eea; color: #ffffff; text-align: center; mso-padding-alt: 12px 24px;">
                            <span style="color: #ffffff; font-weight: 600; font-size: 1em;">👤 ${roleTranslations[role] || role}</span>
                        </td>
                        <td style="width: 16px;"></td>
                        <td style="padding: 12px 24px; border-radius: 25px; font-weight: 600; margin: 8px; font-size: 1em; background-color: #ff7b7b; color: #ffffff; text-align: center; mso-padding-alt: 12px 24px;">
                            <span style="color: #ffffff; font-weight: 600; font-size: 1em;">🏢 ${airportNames[airport] || airport}</span>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div class="credentials-section">
                <h3 class="credentials-title">🔑 Identifiants de Connexion</h3>
                
                <div class="credential-box">
                    <div class="credential-label">📧 Adresse email :</div>
                    <div class="credential-value">${email}</div>
                </div>
                
                <div class="credential-box">
                    <div class="credential-label">🔒 Mot de passe temporaire :</div>
                    <div class="credential-value">${temporaryPassword}</div>
                </div>
                
                <div class="warning">
                    <span class="warning-icon">⚠️</span>
                    <strong>Important :</strong> Vous devrez changer ce mot de passe temporaire lors de votre première connexion pour des raisons de sécurité.
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%); border-radius: 15px; padding: 25px; margin: 25px 0; border: 3px solid #4caf50; text-align: center;">
                <h3 style="color: #2e7d32; margin-bottom: 15px; font-size: 1.2em;">
                    🎯 Comment se connecter ?
                </h3>
                <p style="color: #2e7d32; margin-bottom: 15px; line-height: 1.6;">
                    1. Cliquez sur le bouton "Accéder à SGDO" ci-dessous<br>
                    2. Saisissez votre adresse email et votre mot de passe temporaire<br>
                    3. Créez un nouveau mot de passe sécurisé lors de votre première connexion
                </p>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                        <td align="center" style="background-color: #28a745; border-radius: 30px; padding: 0;">
                            <a href="${serverUrl}/login" target="_blank" style="display: inline-block; padding: 18px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 18px; font-family: Arial, sans-serif; border-radius: 30px;">
                                🚀 Accéder à SGDO
                            </a>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div class="security-tips">
                <h3>🛡️ Recommandations de Sécurité</h3>
                <ul>
                    <li>Créez un mot de passe fort : minimum 8 caractères avec majuscules, minuscules et chiffres</li>
                    <li>Ne communiquez jamais vos identifiants à qui que ce soit</li>
                    <li>Déconnectez-vous systématiquement après chaque session</li>
                    <li>En cas de problème, contactez immédiatement le support technique</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <div class="contact-info">
                <h4>📞 Besoin d'Aide ?</h4>
                <p>
                    <strong>Support Technique :</strong> TAVTunisia-QMS@tav.aero<br>
                    <strong>Téléphone :</strong> +216 73 103 000<br>
                    <strong>Horaires :</strong> Lundi - Vendredi, 8h00 - 17h00
                </p>
            </div>
            
            <div class="footer-text">
                Cet email a été généré automatiquement par le système SGDO.<br>
                Merci de ne pas répondre à cet email.<br>
                © ${new Date().getFullYear()} TAV Tunisie - Système de Gestion Documentaire
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Envoie l'email de bienvenue à un nouvel utilisateur
   */
  async sendWelcomeEmail(userData, temporaryPassword) {
    // Vérifier si le service email est configuré
    if (!this.isConfigured || !this.transporter) {
      console.warn('⚠️  Service email non configuré. Email non envoyé.');
      return { 
        success: false, 
        error: 'Configuration SMTP manquante. Configurez SMTP_HOST, SMTP_USER, SMTP_PASS dans .env' 
      };
    }

    try {
      const htmlContent = this.generateWelcomeEmailTemplate(userData, temporaryPassword);
      
      // URL du serveur (détection automatique ou depuis .env)
      const serverUrl = getFrontendURL(8080);
      
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'SGDO System'}" <${process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@sgdo.tn'}>`,
        to: userData.email,
        subject: `Bienvenue dans SGDO - Vos identifiants de connexion`,
        html: htmlContent,
        // Version texte pour les clients qui ne supportent pas HTML
        text: `
Bienvenue ${userData.firstName} ${userData.lastName} !

Votre compte utilisateur a été créé avec succès.
Vous pouvez maintenant accéder au Système de Gestion Documentaire (SGDO).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDENTIFIANTS DE CONNEXION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Adresse email : ${userData.email}
Mot de passe temporaire : ${temporaryPassword}

⚠️ IMPORTANT : Vous devrez changer ce mot de passe temporaire lors de votre première connexion pour des raisons de sécurité.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMMENT SE CONNECTER ?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Accédez à l'application : ${serverUrl}/login
2. Saisissez votre adresse email et votre mot de passe temporaire
3. Créez un nouveau mot de passe sécurisé lors de votre première connexion

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECOMMANDATIONS DE SÉCURITÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Créez un mot de passe fort : minimum 8 caractères avec majuscules, minuscules et chiffres
• Ne communiquez jamais vos identifiants à qui que ce soit
• Déconnectez-vous systématiquement après chaque session
• En cas de problème, contactez immédiatement le support technique

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BESOIN D'AIDE ?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Support Technique : TAVTunisia-QMS@tav.aero
Téléphone : +216 73 103 000
Horaires : Lundi - Vendredi, 8h00 - 17h00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cet email a été généré automatiquement par le système SGDO.
Merci de ne pas répondre à cet email.

© ${new Date().getFullYear()} TAV Tunisie - Système de Gestion Documentaire
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de bienvenue envoyé avec succès:', result.messageId);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Génère un mot de passe temporaire sécurisé
   */
  generateTemporaryPassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Assurer au moins un caractère de chaque type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Majuscule
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minuscule
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Chiffre
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Caractère spécial
    
    // Compléter avec des caractères aléatoires
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Mélanger les caractères
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Génère les informations de bienvenue pour l'interface utilisateur
   */
  generateWelcomeInfo(userData, temporaryPassword) {
    const roleTranslations = {
      'SUPER_ADMIN': 'Super Administrateur',
      'ADMINISTRATOR': 'Administrateur',
      'DIRECTEUR_GENERAL': 'Directeur Général',
      'DIRECTEUR': 'Directeur',
      'DIRECTEUR_TECHNIQUE': 'Directeur Technique',
      'DIRECTEUR_COMMERCIAL': 'Directeur Commercial',
      'DIRECTEUR_FINANCIER': 'Directeur Financier',
      'DIRECTEUR_OPERATIONS': 'Directeur des Opérations',
      'DIRECTEUR_RH': 'Directeur des Ressources Humaines',
      'SOUS_DIRECTEUR': 'Sous-Directeur',
      'AGENT_BUREAU_ORDRE': 'Agent Bureau d\'Ordre',
      'SUPERVISEUR_BUREAU_ORDRE': 'Superviseur Bureau d\'Ordre',
      'APPROVER': 'Approbateur',
      'USER': 'Utilisateur',
      'VISITOR': 'Visiteur'
    };

    return {
      success: true,
      message: `Utilisateur ${userData.firstName} ${userData.lastName} créé avec succès dans SGDO !`,
      userInfo: {
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        role: roleTranslations[userData.role] || userData.role,
        airport: userData.airport,
        temporaryPassword: temporaryPassword,
        serverUrl: process.env.FRONTEND_BASE_URL || process.env.SERVER_URL || 'http://localhost:3000'
      },
      instructions: [
        'L\'utilisateur recevra un email avec ses identifiants de connexion',
        'Il peut accéder directement à SGDO via le lien fourni dans l\'email',
        'Il devra changer son mot de passe lors de la première connexion',
        'Un email de bienvenue magnifique a été envoyé avec toutes les instructions',
        'Le compte est activé et prêt à être utilisé'
      ]
    };
  }
}

module.exports = new NewUserNotificationService();
