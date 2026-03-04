const nodemailer = require('nodemailer');
const AppSettings = require('../models/AppSettings.js');
const User = require('../models/User.js');
const { createTransporter } = require('./office365Auth');

// Vérification des variables d'environnement requises
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`[EmailSender] Variables d'environnement manquantes: ${missingEnvVars.join(', ')}`);
  console.error('[EmailSender] Veuillez configurer ces variables dans le fichier .env');
}

/**
 * Envoie un email via SMTP
 * @param {string} recipientUserId - ID du destinataire dans la base de données
 * @param {string} subject - Sujet de l'email
 * @param {string} text - Version texte de l'email
 * @param {string} html - Version HTML de l'email
 * @param {boolean} forceEmail - Force l'envoi même si les notifications sont désactivées (pour emails critiques)
 * @returns {Promise<Object>} Résultat de l'envoi
 */
const sendEmail = async (recipientUserId, subject, text, html, forceEmail = false) => {
  console.log(`[EmailSender] Tentative d'envoi d'email pour userId: ${recipientUserId}, Sujet: ${subject}, Force: ${forceEmail}`);
  
  try {
    // 1. Récupérer les détails de l'utilisateur destinataire
    const recipientUser = await User.findById(recipientUserId);
    if (!recipientUser || !recipientUser.email) {
      console.warn(`[EmailSender] Utilisateur destinataire ${recipientUserId} non trouvé ou n'a pas d'adresse email pour la notification.`);
      return { success: false, message: 'Destinataire non trouvé ou sans email' };
    }

    // 2. Vérifier les préférences de notification du destinataire (sauf si forcé)
    if (!forceEmail) {
      const recipientAppSettings = await AppSettings.findOne({ userId: recipientUserId });
      if (recipientAppSettings && !recipientAppSettings.emailNotifications) {
        console.log(`[EmailSender] Notifications email désactivées pour l'utilisateur destinataire ${recipientUserId}.`);
        return { success: true, message: 'Notifications email désactivées pour ce destinataire' };
      }
    } else {
      console.log(`[EmailSender] Email forcé - bypass des préférences de notification pour ${recipientUserId}`);
    }

    // 3. Créer le transporteur SMTP
    if (missingEnvVars.length > 0) {
      throw new Error(`Configuration SMTP incomplète. Variables manquantes: ${missingEnvVars.join(', ')}`);
    }
    
    const transporter = createTransporter();
    const fromName = process.env.EMAIL_FROM_NAME || 'SGDO';
    const fromEmail = process.env.SMTP_USERNAME;
    
    if (!fromEmail) {
      throw new Error('L\'adresse email d\'expédition n\'est pas configurée (SMTP_USERNAME)');
    }

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: recipientUser.email,
      subject: subject,
      text: text,
      html: html,
    };

    console.log(`[EmailSender] Envoi de l'email à: ${recipientUser.email}, From: ${mailOptions.from}, Sujet: ${subject}`);
    
    // Désactiver temporairement la vérification du certificat pour le débogage
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailSender] Email envoyé avec succès à ${recipientUser.email} pour l'utilisateur ${recipientUserId}`);
    console.log(`[EmailSender] Message ID: ${info.messageId}`);
    
    return { 
      success: true, 
      message: 'Email envoyé avec succès',
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`[EmailSender] Erreur lors de l'envoi de l'email à l'utilisateur ${recipientUserId}:`);
    console.error('[EmailSender] Message d\'erreur:', error.message);
    
    if (error.responseCode) {
      console.error(`[EmailSender] Code d'erreur SMTP: ${error.responseCode}`);
    }
    
    if (error.response) {
      console.error('[EmailSender] Réponse du serveur SMTP:', error.response);
    }
    
    if (error.command) {
      console.error(`[EmailSender] Commande échouée: ${error.command}`);
    }
    
    throw new Error(`Échec de l'envoi de l'email: ${error.message}`);
  }
};

module.exports = {
  sendEmail
};