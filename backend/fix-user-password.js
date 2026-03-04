const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

/**
 * Script pour corriger le mot de passe des utilisateurs qui ne peuvent pas se connecter
 */

async function fixUserPassword() {
  try {
    console.log('🔧 ========================================');
    console.log('🔧 CORRECTION MOT DE PASSE UTILISATEUR');
    console.log('🔧 ========================================\n');

    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. IDENTIFIER L'UTILISATEUR PROBLÉMATIQUE
    const problematicUser = await User.findOne({
      email: 'Siwar.Daassa@tav.aero'
    });

    if (!problematicUser) {
      console.log('❌ Utilisateur Siwar.Daassa@tav.aero non trouvé');
      return;
    }

    console.log('👤 === UTILISATEUR TROUVÉ ===');
    console.log(`📧 Email: ${problematicUser.email}`);
    console.log(`👤 Nom: ${problematicUser.firstName} ${problematicUser.lastName}`);
    console.log(`🔄 Rôle: ${problematicUser.role}`);
    console.log(`⚠️ Doit changer mot de passe: ${problematicUser.mustChangePassword}`);
    console.log(`📅 Créé le: ${new Date(problematicUser.createdAt).toLocaleString('fr-FR')}\n`);

    // 2. GÉNÉRER UN NOUVEAU MOT DE PASSE TEMPORAIRE
    const newTempPassword = 'Siwar2025!';
    console.log('🔐 === GÉNÉRATION NOUVEAU MOT DE PASSE ===');
    console.log(`🔑 Nouveau mot de passe temporaire: ${newTempPassword}`);

    // 3. HACHER LE NOUVEAU MOT DE PASSE
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newTempPassword, salt);
    console.log('✅ Mot de passe haché avec succès');

    // 4. METTRE À JOUR L'UTILISATEUR
    problematicUser.password = hashedPassword;
    problematicUser.mustChangePassword = true; // Forcer le changement au premier login
    problematicUser.updatedAt = new Date();

    await problematicUser.save();
    console.log('✅ Utilisateur mis à jour avec succès\n');

    // 5. VÉRIFIER LA CORRECTION
    console.log('🧪 === VÉRIFICATION CORRECTION ===');
    const isPasswordCorrect = await bcrypt.compare(newTempPassword, problematicUser.password);
    console.log(`🔐 Test mot de passe: ${isPasswordCorrect ? '✅ Correct' : '❌ Incorrect'}`);

    // 6. INSTRUCTIONS POUR L'UTILISATEUR
    console.log('\n📋 === INSTRUCTIONS POUR L\'UTILISATEUR ===');
    console.log('🎯 Donnez ces informations à Siwar Daassa:');
    console.log('');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│           IDENTIFIANTS DE CONNEXION    │');
    console.log('├─────────────────────────────────────────┤');
    console.log(`│ Email     : ${problematicUser.email.padEnd(24)} │`);
    console.log(`│ Mot de passe : ${newTempPassword.padEnd(21)} │`);
    console.log('│                                         │');
    console.log('│ ⚠️  IMPORTANT:                          │');
    console.log('│ - Changement obligatoire au 1er login  │');
    console.log('│ - Choisir un mot de passe sécurisé     │');
    console.log('│ - Minimum 6 caractères                 │');
    console.log('└─────────────────────────────────────────┘');

    // 7. CORRIGER TOUS LES UTILISATEURS SIMILAIRES
    console.log('\n🔧 === CORRECTION UTILISATEURS SIMILAIRES ===');
    
    const otherProblematicUsers = await User.find({
      mustChangePassword: true,
      lastLogin: { $exists: false },
      _id: { $ne: problematicUser._id }
    });

    console.log(`📋 ${otherProblematicUsers.length} autres utilisateurs avec le même problème`);

    for (const user of otherProblematicUsers) {
      const userTempPassword = `${user.firstName}2025!`;
      const userHashedPassword = await bcrypt.hash(userTempPassword, salt);
      
      user.password = userHashedPassword;
      user.mustChangePassword = true;
      user.updatedAt = new Date();
      
      await user.save();
      
      console.log(`✅ ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   Nouveau mot de passe: ${userTempPassword}`);
    }

    // 8. RÉSUMÉ FINAL
    console.log('\n✅ === CORRECTION TERMINÉE ===');
    console.log(`🎯 ${otherProblematicUsers.length + 1} utilisateur(s) corrigé(s)`);
    console.log('📧 Informez les utilisateurs de leurs nouveaux identifiants');
    console.log('🔄 Ils devront changer leur mot de passe au premier login');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

fixUserPassword();
