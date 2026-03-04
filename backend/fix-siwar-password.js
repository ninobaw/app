const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

/**
 * Script rapide pour corriger le mot de passe de Siwar
 */

async function fixSiwarPassword() {
  try {
    console.log('🔧 Correction mot de passe Siwar...');

    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    
    // Trouver Siwar (insensible à la casse)
    const siwar = await User.findOne({ 
      email: { $regex: /^siwar\.daassa@tav\.aero$/i }
    });

    if (!siwar) {
      console.log('❌ Siwar non trouvée');
      return;
    }

    console.log(`✅ Siwar trouvée: ${siwar.email}`);

    // Nouveau mot de passe temporaire
    const newPassword = 'Siwar2025!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour
    siwar.password = hashedPassword;
    siwar.mustChangePassword = true;
    await siwar.save();

    console.log('✅ Mot de passe mis à jour');
    console.log('📋 IDENTIFIANTS POUR SIWAR:');
    console.log(`   Email: ${siwar.email}`);
    console.log(`   Mot de passe: ${newPassword}`);
    console.log('   ⚠️ Changement obligatoire au premier login');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixSiwarPassword();
