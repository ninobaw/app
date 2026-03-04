const mongoose = require('mongoose');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailSender');
const crypto = require('crypto');

// Configuration de la base de données
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function testForgotPassword() {
  try {
    console.log('🔍 Test de diagnostic pour la réinitialisation de mot de passe');
    console.log('='.repeat(60));

    // 1. Connexion à la base de données
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    // 2. Vérification de l'utilisateur test
    const testEmail = 'abdallah.benkhalifa@tav.aero';
    console.log(`\n2. Recherche de l'utilisateur: ${testEmail}`);
    
    const user = await User.findOne({ email: testEmail });
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:');
    console.log(`   - ID: ${user._id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Nom: ${user.firstName} ${user.lastName}`);
    console.log(`   - Actif: ${user.isActive}`);

    // 3. Test de génération du token
    console.log('\n3. Génération du token de réinitialisation...');
    const resetToken = crypto.randomBytes(20).toString('hex');
    console.log(`✅ Token généré: ${resetToken}`);

    // 4. Test de sauvegarde du token
    console.log('\n4. Sauvegarde du token dans la base...');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 900000; // 15 minutes
    user.lastPasswordResetRequest = Date.now();
    await user.save();
    console.log('✅ Token sauvegardé avec succès');

    // 5. Test de configuration SMTP
    console.log('\n5. Vérification de la configuration SMTP...');
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD'];
    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingVars.length > 0) {
      console.log(`❌ Variables d'environnement manquantes: ${missingVars.join(', ')}`);
      return;
    }
    
    console.log('✅ Configuration SMTP complète:');
    console.log(`   - Host: ${process.env.SMTP_HOST}`);
    console.log(`   - Port: ${process.env.SMTP_PORT}`);
    console.log(`   - Username: ${process.env.SMTP_USERNAME}`);
    console.log(`   - Password: ${process.env.SMTP_PASSWORD ? '***' + process.env.SMTP_PASSWORD.slice(-4) : 'non défini'}`);

    // 6. Test d'envoi d'email simplifié
    console.log('\n6. Test d'envoi d'email...');
    
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:8080';
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${resetToken}`;
    
    try {
      await sendEmail(
        user._id,
        'Test - Réinitialisation de mot de passe SGDO',
        `Test de réinitialisation de mot de passe.\n\nLien: ${resetUrl}`,
        `<h2>Test de réinitialisation</h2><p>Lien: <a href="${resetUrl}">${resetUrl}</a></p>`,
        true // Force l'envoi
      );
      console.log('✅ Email envoyé avec succès');
    } catch (emailError) {
      console.log('❌ Erreur lors de l\'envoi d\'email:');
      console.error('   Message:', emailError.message);
      console.error('   Stack:', emailError.stack);
      
      // Détails spécifiques SMTP
      if (emailError.responseCode) {
        console.error(`   Code SMTP: ${emailError.responseCode}`);
      }
      if (emailError.response) {
        console.error(`   Réponse SMTP: ${emailError.response}`);
      }
      if (emailError.command) {
        console.error(`   Commande échouée: ${emailError.command}`);
      }
    }

    console.log('\n7. Nettoyage du token de test...');
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    console.log('✅ Token de test supprimé');

  } catch (error) {
    console.error('❌ Erreur générale du test:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Test terminé - Connexion MongoDB fermée');
  }
}

// Exécuter le test
testForgotPassword();
