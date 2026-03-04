const nodemailer = require('nodemailer');

// Configuration SMTP universelle (Gmail, Office365, etc.)
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true pour le port 465, false pour les autres ports
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    // Configuration TLS compatible Gmail et Office365
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  },
  // Délai d'attente augmenté pour les connexions lentes
  connectionTimeout: 10000, // 10 secondes
  greetingTimeout: 10000, // 10 secondes
  // Nombre de tentatives de reconnexion
  maxConnections: 5,
  // Nombre maximum de messages par connexion
  maxMessages: 100,
  // Délai entre les tentatives de reconnexion
  socketTimeout: 30000 // 30 secondes
};

// Cache pour le transporteur
let transporter = null;

/**
 * Crée un transporteur Nodemailer configuré pour Office 365
 * @returns {Object} Transporteur Nodemailer configuré
 * @throws {Error} Si les identifiants SMTP ne sont pas configurés
 */
function createTransporter() {
  // Vérification des variables d'environnement requises
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Configuration SMTP incomplète. Variables manquantes: ${missingVars.join(', ')}`);
  }

  // Création d'un nouveau transporteur si nécessaire
  if (!transporter) {
    console.log('[SMTP] Création d\'un nouveau transporteur SMTP');
    
    transporter = nodemailer.createTransport(SMTP_CONFIG);
    
    // Vérification de la connexion au serveur SMTP
    transporter.verify(function(error, success) {
      if (error) {
        console.error('[SMTP] Erreur de connexion au serveur SMTP:', error);
      } else {
        console.log('[SMTP] Connexion au serveur SMTP établie avec succès');
      }
    });
    
    // Gestion des erreurs de connexion
    transporter.on('error', (error) => {
      console.error('[SMTP] Erreur du transporteur SMTP:', error);
    });
  }
  
  return transporter;
}

/**
 * Vérifie la configuration SMTP actuelle
 * @returns {Object} État de la configuration SMTP
 */
function checkSmtpConfig() {
  return {
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    user: SMTP_CONFIG.auth.user ? '***' + SMTP_CONFIG.auth.user.slice(-4) : 'non défini',
    tlsRejectUnauthorized: SMTP_CONFIG.tls.rejectUnauthorized,
    connectionTimeout: SMTP_CONFIG.connectionTimeout,
    socketTimeout: SMTP_CONFIG.socketTimeout
  };
}

module.exports = {
  createTransporter,
  checkSmtpConfig
};
