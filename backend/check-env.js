// Vérification des variables d'environnement requises
console.log('=== Vérification des variables d\'environnement ===\n');

// Liste des variables requises
const requiredVars = [
  'MONGO_URI',
  'PORT',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USERNAME',
  'SMTP_PASSWORD',
  'EMAIL_FROM',
  'EMAIL_FROM_NAME'
];

// Charger les variables d'environnement
require('dotenv').config();

// Vérifier chaque variable
let allVarsOk = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isSet = value !== undefined && value !== '';
  
  console.log(`${varName}: ${isSet ? '✅ Défini' : '❌ Non défini'}`);
  
  if (!isSet) {
    allVarsOk = false;
    console.log(`   → La variable ${varName} est requise mais n'est pas définie.`);
    console.log('   → Vérifiez votre fichier .env ou consultez .env.example pour un exemple.');
  } else if (varName === 'SMTP_PASSWORD' && value === 'votre_mot_de_passe') {
    console.log('   ⚠️  ATTENTION: Le mot de passe SMTP est défini sur la valeur par défaut.');
    console.log('   → Veuillez définir un mot de passe valide dans le fichier .env');
  } else if (varName === 'JWT_SECRET' && value.includes('change_this')) {
    console.log('   ⚠️  ATTENTION: La clé secrète JWT est définie sur la valeur par défaut.');
    console.log('   → Pour des raisons de sécurité, changez cette valeur en production.');
  }
  
  console.log('');
});

// Afficher un résumé
console.log('=== Résumé de la configuration ===');
if (allVarsOk) {
  console.log('✅ Toutes les variables requises sont définies.');
  console.log('   Vous pouvez maintenant démarrer le serveur avec la commande: npm run dev');
} else {
  console.log('❌ Certaines variables requises ne sont pas définies.');
  console.log('   Veuillez configurer les variables manquantes dans le fichier .env');
  console.log('   Consultez le fichier .env.example pour un exemple de configuration.');
  process.exit(1);
}

// Vérifier la configuration SMTP
console.log('\n=== Vérification de la configuration SMTP ===');
try {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  
  console.log('\nTest de connexion au serveur SMTP...');
  
  transporter.verify(function(error, success) {
    if (error) {
      console.error('❌ Échec de la connexion au serveur SMTP:');
      console.error(error);
      process.exit(1);
    } else {
      console.log('✅ Connexion SMTP réussie !');
      console.log('\nLa configuration SMTP semble correcte.');
      console.log('Vous pouvez maintenant envoyer des emails depuis l\'application.');
    }
  });
} catch (error) {
  console.error('❌ Erreur lors de la vérification SMTP:');
  console.error(error);
  process.exit(1);
}
