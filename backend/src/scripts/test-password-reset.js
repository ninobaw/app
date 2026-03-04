const mongoose = require('mongoose');
const User = require('../models/User');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';
const JWT_SECRET = process.env.JWT_SECRET || 'sgdo_super_secret_key_2025_change_this_in_production';
const API_BASE_URL = 'http://localhost:5000';

async function testPasswordReset() {
  try {
    console.log('🔍 Test de diagnostic pour la réinitialisation de mot de passe');
    console.log('='.repeat(60));

    // 1. Connexion à la base de données
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    // 2. Recherche d'un SUPER_ADMIN
    console.log('\n2. Recherche d\'un SUPER_ADMIN...');
    const adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    
    if (!adminUser) {
      console.log('❌ Aucun SUPER_ADMIN trouvé');
      return;
    }
    
    console.log(`✅ SUPER_ADMIN trouvé: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.email})`);

    // 3. Recherche d'un utilisateur test à réinitialiser
    console.log('\n3. Recherche d\'un utilisateur à réinitialiser...');
    let testUser = await User.findOne({ 
      role: { $ne: 'SUPER_ADMIN' },
      email: { $ne: adminUser.email }
    });
    
    if (!testUser) {
      console.log('❌ Aucun utilisateur test trouvé, création...');
      const bcrypt = require('bcryptjs');
      const { v4: uuidv4 } = require('uuid');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('TempPassword123!', salt);
      
      testUser = new User({
        _id: uuidv4(),
        email: `test.reset.${Date.now()}@aerodoc.tn`,
        firstName: 'Test',
        lastName: 'Reset',
        password: hashedPassword,
        role: 'AGENT',
        airport: 'ENFIDHA',
        isActive: true,
        mustChangePassword: false
      });
      
      await testUser.save();
      console.log('✅ Utilisateur test créé');
    }
    
    console.log(`✅ Utilisateur à réinitialiser: ${testUser.firstName} ${testUser.lastName} (${testUser.email})`);
    console.log(`   - ID: ${testUser._id}`);
    console.log(`   - Rôle: ${testUser.role}`);

    // 4. Génération d'un token JWT pour le SUPER_ADMIN
    console.log('\n4. Génération du token JWT...');
    const token = jwt.sign(
      { 
        userId: adminUser._id,
        email: adminUser.email,
        role: adminUser.role
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ Token JWT généré');

    // 5. Test de réinitialisation via API
    console.log('\n5. Test de réinitialisation de mot de passe via API...');
    
    const resetData = {
      newPassword: 'NewPassword123!'
    };

    console.log('📋 Données de réinitialisation:');
    console.log(`   - Utilisateur cible: ${testUser.email}`);
    console.log(`   - ID utilisateur: ${testUser._id}`);
    console.log(`   - Nouveau mot de passe: ${resetData.newPassword}`);
    console.log(`   - Admin qui réinitialise: ${adminUser.email}`);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/users/${testUser._id}/reset-password`, 
        resetData, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Réinitialisation réussie !');
      console.log(`   - Message: ${response.data.message}`);
      console.log(`   - mustChangePassword: ${response.data.mustChangePassword}`);
      
      // Vérifier que l'utilisateur a été mis à jour
      const updatedUser = await User.findById(testUser._id);
      console.log(`   - mustChangePassword en base: ${updatedUser.mustChangePassword}`);
      console.log(`   - updatedAt: ${updatedUser.updatedAt}`);
      
    } catch (error) {
      console.log('❌ Erreur lors de la réinitialisation:');
      console.error('   Message:', error.message);
      
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
        
        // Analyser l'erreur 500
        if (error.response.status === 500) {
          console.log('\n🔍 Analyse de l\'erreur 500:');
          console.log('   Causes possibles:');
          console.log('   1. Problème avec User.findById()');
          console.log('   2. Erreur de hashage bcrypt');
          console.log('   3. Problème avec user.save()');
          console.log('   4. Erreur de validation du modèle User');
          console.log('   5. Problème de connexion MongoDB');
        }
      }
    }

    // 6. Test direct de réinitialisation en base
    console.log('\n6. Test direct de réinitialisation en base...');
    
    try {
      const bcrypt = require('bcryptjs');
      
      // Trouver l'utilisateur
      const userToReset = await User.findById(testUser._id);
      if (!userToReset) {
        console.log('❌ Utilisateur non trouvé pour test direct');
        return;
      }
      
      console.log(`✅ Utilisateur trouvé: ${userToReset.email}`);
      
      // Hasher le nouveau mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('DirectTestPassword123!', salt);
      
      console.log('✅ Mot de passe hashé');
      
      // Mettre à jour
      userToReset.password = hashedPassword;
      userToReset.mustChangePassword = true;
      userToReset.updatedAt = new Date();
      
      await userToReset.save();
      console.log('✅ Réinitialisation directe réussie');
      
    } catch (error) {
      console.log('❌ Erreur réinitialisation directe:');
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }

    // 7. Nettoyer - supprimer l'utilisateur de test s'il a été créé
    if (testUser.email.includes('test.reset.')) {
      await User.findByIdAndDelete(testUser._id);
      console.log('\n🧹 Utilisateur de test supprimé');
    }

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
testPasswordReset();
