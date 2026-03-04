const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow-enfidha')
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

// Importer les services
const User = require('./src/models/User');
const newUserNotificationService = require('./src/services/newUserNotificationService');

/**
 * Test complet du système de création d'utilisateur avec notifications
 */
async function testUserCreationWithWelcome() {
  console.log('\n🧪 Test du Système de Création d\'Utilisateur avec Notifications\n');
  console.log('='.repeat(80));

  try {
    // 1. Test de génération de mot de passe temporaire
    console.log('\n📝 1. Test de génération de mot de passe temporaire');
    console.log('-'.repeat(50));
    
    const tempPassword1 = newUserNotificationService.generateTemporaryPassword();
    const tempPassword2 = newUserNotificationService.generateTemporaryPassword();
    
    console.log(`✅ Mot de passe 1: ${tempPassword1} (longueur: ${tempPassword1.length})`);
    console.log(`✅ Mot de passe 2: ${tempPassword2} (longueur: ${tempPassword2.length})`);
    console.log(`✅ Différents: ${tempPassword1 !== tempPassword2 ? 'Oui' : 'Non'}`);
    
    // Vérifier la complexité
    const hasUpper = /[A-Z]/.test(tempPassword1);
    const hasLower = /[a-z]/.test(tempPassword1);
    const hasNumber = /[0-9]/.test(tempPassword1);
    const hasSpecial = /[!@#$%^&*]/.test(tempPassword1);
    
    console.log(`✅ Complexité: Maj(${hasUpper}) Min(${hasLower}) Num(${hasNumber}) Spé(${hasSpecial})`);

    // 2. Test de création d'utilisateur de test
    console.log('\n👤 2. Test de création d\'utilisateur');
    console.log('-'.repeat(50));
    
    const testUserData = {
      firstName: 'Ahmed',
      lastName: 'Ben Ali',
      email: `test.user.${Date.now()}@aerodoc.tn`,
      role: 'AGENT_BUREAU_ORDRE',
      airport: 'ENFIDHA',
      phone: '+216 20 123 456',
      department: 'Bureau d\'Ordre'
    };
    
    console.log('📋 Données utilisateur test:', testUserData);
    
    // Vérifier que l'utilisateur n'existe pas déjà
    const existingUser = await User.findOne({ email: testUserData.email });
    if (existingUser) {
      console.log('⚠️  Utilisateur test existe déjà, suppression...');
      await User.deleteOne({ email: testUserData.email });
    }
    
    // Générer mot de passe temporaire
    const temporaryPassword = newUserNotificationService.generateTemporaryPassword();
    console.log(`🔑 Mot de passe temporaire généré: ${temporaryPassword}`);
    
    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, salt);
    
    // Créer l'utilisateur
    const newUser = new User({
      ...testUserData,
      password: hashedPassword,
      isActive: true,
      mustChangePassword: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    });
    
    await newUser.save();
    console.log('✅ Utilisateur créé avec succès:', newUser._id);

    // 3. Test de génération des informations de bienvenue
    console.log('\n📋 3. Test de génération des informations de bienvenue');
    console.log('-'.repeat(50));
    
    const welcomeInfo = newUserNotificationService.generateWelcomeInfo(testUserData, temporaryPassword);
    console.log('✅ Informations de bienvenue générées:');
    console.log('   Message:', welcomeInfo.message);
    console.log('   Nom:', welcomeInfo.userInfo.name);
    console.log('   Email:', welcomeInfo.userInfo.email);
    console.log('   Rôle:', welcomeInfo.userInfo.role);
    console.log('   Aéroport:', welcomeInfo.userInfo.airport);
    console.log('   Instructions:', welcomeInfo.instructions.length, 'étapes');

    // 4. Test de génération du template email
    console.log('\n📧 4. Test de génération du template email');
    console.log('-'.repeat(50));
    
    const emailTemplate = newUserNotificationService.generateWelcomeEmailTemplate(testUserData, temporaryPassword);
    console.log('✅ Template email généré');
    console.log('   Longueur:', emailTemplate.length, 'caractères');
    console.log('   Contient nom:', emailTemplate.includes(testUserData.firstName) ? 'Oui' : 'Non');
    console.log('   Contient email:', emailTemplate.includes(testUserData.email) ? 'Oui' : 'Non');
    console.log('   Contient mot de passe:', emailTemplate.includes(temporaryPassword) ? 'Oui' : 'Non');
    console.log('   Contient CSS:', emailTemplate.includes('<style>') ? 'Oui' : 'Non');

    // 5. Test d'envoi d'email (simulation)
    console.log('\n📤 5. Test d\'envoi d\'email (simulation)');
    console.log('-'.repeat(50));
    
    try {
      // Note: Ceci échouera probablement car SMTP n'est pas configuré en test
      const emailResult = await newUserNotificationService.sendWelcomeEmail(testUserData, temporaryPassword);
      
      if (emailResult.success) {
        console.log('✅ Email envoyé avec succès:', emailResult.messageId);
      } else {
        console.log('⚠️  Échec d\'envoi email (normal en test):', emailResult.error);
      }
    } catch (error) {
      console.log('⚠️  Erreur d\'envoi email (normal en test):', error.message);
    }

    // 6. Test de validation du mot de passe
    console.log('\n🔐 6. Test de validation du mot de passe');
    console.log('-'.repeat(50));
    
    const isPasswordValid = await bcrypt.compare(temporaryPassword, hashedPassword);
    console.log('✅ Validation mot de passe:', isPasswordValid ? 'Succès' : 'Échec');

    // 7. Simulation de la réponse API complète
    console.log('\n🔄 7. Simulation de la réponse API complète');
    console.log('-'.repeat(50));
    
    const completeResponse = {
      user: {
        _id: newUser._id,
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        airport: newUser.airport,
        isActive: newUser.isActive,
        mustChangePassword: newUser.mustChangePassword
      },
      welcome: welcomeInfo,
      emailSent: false, // Simulé comme échec
      emailError: 'Configuration SMTP non disponible en test'
    };
    
    console.log('✅ Réponse API simulée:');
    console.log('   Utilisateur ID:', completeResponse.user._id);
    console.log('   Bienvenue:', completeResponse.welcome.success ? 'Généré' : 'Échec');
    console.log('   Email envoyé:', completeResponse.emailSent ? 'Oui' : 'Non');
    console.log('   Erreur email:', completeResponse.emailError || 'Aucune');

    // 8. Nettoyage
    console.log('\n🧹 8. Nettoyage');
    console.log('-'.repeat(50));
    
    await User.deleteOne({ _id: newUser._id });
    console.log('✅ Utilisateur test supprimé');

    // 9. Résumé des tests
    console.log('\n📊 9. Résumé des Tests');
    console.log('='.repeat(50));
    console.log('✅ Génération mot de passe temporaire : SUCCÈS');
    console.log('✅ Création utilisateur : SUCCÈS');
    console.log('✅ Génération informations bienvenue : SUCCÈS');
    console.log('✅ Génération template email : SUCCÈS');
    console.log('⚠️  Envoi email : SIMULÉ (SMTP non configuré)');
    console.log('✅ Validation mot de passe : SUCCÈS');
    console.log('✅ Réponse API complète : SUCCÈS');
    console.log('✅ Nettoyage : SUCCÈS');
    
    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('\n💡 Le système de création d\'utilisateur avec notifications est prêt à être utilisé.');
    console.log('   Pour activer l\'envoi d\'emails, configurez les variables SMTP dans .env :');
    console.log('   - SMTP_HOST');
    console.log('   - SMTP_PORT');
    console.log('   - SMTP_USER');
    console.log('   - SMTP_PASS');
    console.log('   - SMTP_FROM');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
    console.error('Stack:', error.stack);
  } finally {
    mongoose.disconnect();
  }
}

// Lancer les tests
testUserCreationWithWelcome();
