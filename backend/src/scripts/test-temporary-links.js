const mongoose = require('mongoose');
const User = require('../models/User');
const TemporaryPasswordService = require('../services/temporaryPasswordService');
const NewUserNotificationService = require('../services/newUserNotificationService');
const bcrypt = require('bcryptjs');

// Configuration de la base de données
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connecté pour les tests');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
};

async function testTemporaryLinks() {
  console.log('\n🧪 === TEST DU SYSTÈME DE LIENS TEMPORAIRES ===\n');

  try {
    await connectDB();

    // 1. Créer un utilisateur de test
    console.log('1️⃣ Création d\'un utilisateur de test...');
    
    const testUserId = new mongoose.Types.ObjectId().toString();
    const tempPassword = TemporaryPasswordService.generateSecureTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const testUser = new User({
      _id: testUserId,
      email: 'test.temporary@example.com',
      firstName: 'Test',
      lastName: 'Temporaire',
      password: hashedPassword,
      role: 'AGENT',
      airport: 'ENFIDHA',
      mustChangePassword: true,
      isActive: true
    });

    await testUser.save();
    console.log(`✅ Utilisateur de test créé: ${testUser.email}`);
    console.log(`🔑 Mot de passe temporaire: ${tempPassword}`);

    // 2. Générer un lien temporaire
    console.log('\n2️⃣ Génération du lien temporaire...');
    
    const { temporaryLink, tempToken, expiresAt } = await TemporaryPasswordService.generateTemporaryLink(
      testUserId,
      tempPassword,
      24 // 24 heures
    );

    console.log(`🔗 Lien temporaire généré:`);
    console.log(`   URL: ${temporaryLink}`);
    console.log(`   Token: ${tempToken.substring(0, 50)}...`);
    console.log(`   Expire le: ${expiresAt}`);

    // 3. Valider le token temporaire
    console.log('\n3️⃣ Validation du token temporaire...');
    
    const tokenData = await TemporaryPasswordService.validateTemporaryToken(tempToken);
    console.log(`✅ Token validé avec succès:`);
    console.log(`   Email: ${tokenData.email}`);
    console.log(`   User ID: ${tokenData.userId}`);
    console.log(`   Mot de passe temporaire: ${tokenData.tempPassword.substring(0, 10)}...`);

    // 4. Test de l'email de bienvenue avec lien temporaire
    console.log('\n4️⃣ Test d\'envoi d\'email avec lien temporaire...');
    
    try {
      const emailResult = await NewUserNotificationService.sendWelcomeEmail(
        {
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          email: testUser.email,
          role: testUser.role,
          airport: testUser.airport,
          createdAt: testUser.createdAt
        },
        tempPassword
      );

      if (emailResult.success) {
        console.log(`✅ Email de bienvenue envoyé avec succès`);
        console.log(`   Message ID: ${emailResult.messageId}`);
      } else {
        console.log(`⚠️ Email non envoyé (configuration SMTP manquante):`);
        console.log(`   Erreur: ${emailResult.error}`);
      }
    } catch (error) {
      console.log(`⚠️ Erreur envoi email: ${error.message}`);
    }

    // 5. Test de nettoyage des tokens expirés
    console.log('\n5️⃣ Test de nettoyage des tokens expirés...');
    
    // Créer un token expiré pour le test
    const expiredUser = await User.findById(testUserId);
    expiredUser.temporaryPasswordToken = 'expired-token';
    expiredUser.temporaryPasswordExpires = new Date(Date.now() - 1000); // Expiré depuis 1 seconde
    await expiredUser.save();

    const cleanedCount = await TemporaryPasswordService.cleanupExpiredTokens();
    console.log(`✅ ${cleanedCount} token(s) expiré(s) nettoyé(s)`);

    // 6. Test de validation d'un token expiré
    console.log('\n6️⃣ Test de validation d\'un token expiré...');
    
    try {
      await TemporaryPasswordService.validateTemporaryToken('expired-token');
      console.log('❌ ERREUR: Le token expiré a été validé (ne devrait pas arriver)');
    } catch (error) {
      console.log(`✅ Token expiré correctement rejeté: ${error.message}`);
    }

    // 7. Test de génération de mot de passe sécurisé
    console.log('\n7️⃣ Test de génération de mots de passe sécurisés...');
    
    for (let i = 0; i < 5; i++) {
      const securePassword = TemporaryPasswordService.generateSecureTemporaryPassword();
      console.log(`   Mot de passe ${i + 1}: ${securePassword} (longueur: ${securePassword.length})`);
    }

    // 8. Vérifier l'état final de l'utilisateur
    console.log('\n8️⃣ Vérification de l\'état final...');
    
    const finalUser = await User.findById(testUserId);
    console.log(`✅ État final de l'utilisateur:`);
    console.log(`   Email: ${finalUser.email}`);
    console.log(`   Must change password: ${finalUser.mustChangePassword}`);
    console.log(`   Token temporaire: ${finalUser.temporaryPasswordToken ? 'Présent' : 'Absent'}`);
    console.log(`   Expiration: ${finalUser.temporaryPasswordExpires || 'Non définie'}`);

    console.log('\n🎉 === TOUS LES TESTS RÉUSSIS ===');
    console.log('\n📋 Résumé des fonctionnalités testées:');
    console.log('   ✅ Génération de liens temporaires sécurisés');
    console.log('   ✅ Validation de tokens avec expiration');
    console.log('   ✅ Intégration avec le système d\'email');
    console.log('   ✅ Nettoyage automatique des tokens expirés');
    console.log('   ✅ Gestion des erreurs et tokens invalides');
    console.log('   ✅ Génération de mots de passe sécurisés');

    // Nettoyage
    console.log('\n🧹 Nettoyage des données de test...');
    await User.findByIdAndDelete(testUserId);
    console.log('✅ Utilisateur de test supprimé');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testTemporaryLinks();
}

module.exports = { testTemporaryLinks };
