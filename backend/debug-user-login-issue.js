const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

/**
 * Script pour diagnostiquer les problèmes de connexion des nouveaux utilisateurs
 */

async function debugUserLoginIssue() {
  try {
    console.log('🔍 ========================================');
    console.log('🔍 DIAGNOSTIC PROBLÈME CONNEXION UTILISATEURS');
    console.log('🔍 ========================================\n');

    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. LISTER LES DERNIERS UTILISATEURS CRÉÉS
    console.log('👤 === DERNIERS UTILISATEURS CRÉÉS ===');
    
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log(`📋 ${recentUsers.length} derniers utilisateurs:\n`);

    recentUsers.forEach((user, index) => {
      console.log(`👤 Utilisateur ${index + 1}:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nom: ${user.firstName} ${user.lastName}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Actif: ${user.isActive ? '✅' : '❌'}`);
      console.log(`   Doit changer mot de passe: ${user.mustChangePassword ? '⚠️ Oui' : '✅ Non'}`);
      console.log(`   Créé le: ${new Date(user.createdAt).toLocaleString('fr-FR')}`);
      console.log(`   Dernier login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : '❌ Jamais'}`);
      console.log('');
    });

    // 2. TESTER LA CONNEXION D'UN UTILISATEUR RÉCENT
    if (recentUsers.length > 0) {
      const testUser = recentUsers[0];
      console.log('🧪 === TEST CONNEXION UTILISATEUR RÉCENT ===');
      console.log(`🎯 Test avec: ${testUser.email}\n`);

      // Simuler différents mots de passe possibles
      const possiblePasswords = [
        'password123',
        'Password123',
        'temp123',
        'Temp123',
        'aerodoc123',
        'Aerodoc123',
        '123456',
        'admin123',
        testUser.firstName.toLowerCase() + '123',
        testUser.lastName.toLowerCase() + '123'
      ];

      console.log('🔐 Test des mots de passe possibles:');
      
      for (const password of possiblePasswords) {
        try {
          const isMatch = await bcrypt.compare(password, testUser.password);
          if (isMatch) {
            console.log(`✅ TROUVÉ ! Mot de passe: "${password}"`);
            console.log(`📋 Instructions pour l'utilisateur ${testUser.email}:`);
            console.log(`   1. Email: ${testUser.email}`);
            console.log(`   2. Mot de passe: ${password}`);
            console.log(`   3. Changement obligatoire: ${testUser.mustChangePassword ? 'Oui' : 'Non'}`);
            break;
          } else {
            console.log(`❌ "${password}" - Incorrect`);
          }
        } catch (error) {
          console.log(`⚠️ "${password}" - Erreur: ${error.message}`);
        }
      }
    }

    // 3. VÉRIFIER LES UTILISATEURS AVEC PROBLÈMES
    console.log('\n🚨 === UTILISATEURS AVEC PROBLÈMES POTENTIELS ===');
    
    const problematicUsers = await User.find({
      $or: [
        { isActive: false },
        { mustChangePassword: true, lastLogin: { $exists: false } },
        { password: { $exists: false } },
        { email: { $exists: false } }
      ]
    }).lean();

    console.log(`⚠️ ${problematicUsers.length} utilisateurs avec problèmes potentiels:\n`);

    problematicUsers.forEach((user, index) => {
      console.log(`⚠️ Problème ${index + 1}: ${user.email || 'Email manquant'}`);
      
      const issues = [];
      if (!user.isActive) issues.push('Compte désactivé');
      if (user.mustChangePassword && !user.lastLogin) issues.push('Doit changer mot de passe (jamais connecté)');
      if (!user.password) issues.push('Mot de passe manquant');
      if (!user.email) issues.push('Email manquant');
      
      console.log(`   Problèmes: ${issues.join(', ')}`);
      console.log(`   Créé le: ${user.createdAt ? new Date(user.createdAt).toLocaleString('fr-FR') : 'Date inconnue'}`);
      console.log('');
    });

    // 4. PROPOSER DES SOLUTIONS
    console.log('💡 === SOLUTIONS RECOMMANDÉES ===');
    
    if (problematicUsers.some(u => !u.isActive)) {
      console.log('🔧 1. Activer les comptes désactivés:');
      console.log('   await User.updateMany({ isActive: false }, { isActive: true });');
    }
    
    if (problematicUsers.some(u => u.mustChangePassword && !u.lastLogin)) {
      console.log('🔧 2. Réinitialiser les mots de passe pour les nouveaux utilisateurs:');
      console.log('   - Générer de nouveaux mots de passe temporaires');
      console.log('   - Renvoyer les emails de bienvenue');
    }
    
    if (problematicUsers.some(u => !u.password)) {
      console.log('🔧 3. Corriger les utilisateurs sans mot de passe:');
      console.log('   - Générer des mots de passe temporaires');
    }

    // 5. CRÉER UN UTILISATEUR DE TEST
    console.log('\n🧪 === CRÉATION UTILISATEUR DE TEST ===');
    
    const testEmail = `test-${Date.now()}@aerodoc.test`;
    const testPassword = 'Test123456';
    
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(testPassword, salt);
      
      const testUser = new User({
        _id: require('uuid').v4(),
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
        password: hashedPassword,
        role: 'AGENT_BUREAU_ORDRE',
        airport: 'ENFIDHA',
        isActive: true,
        mustChangePassword: false, // Pas de changement obligatoire pour le test
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true
      });

      await testUser.save();
      
      console.log('✅ Utilisateur de test créé:');
      console.log(`   Email: ${testEmail}`);
      console.log(`   Mot de passe: ${testPassword}`);
      console.log(`   ID: ${testUser._id}`);
      console.log('\n🎯 Testez la connexion avec ces identifiants !');
      
    } catch (error) {
      console.error('❌ Erreur création utilisateur test:', error.message);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

debugUserLoginIssue();
