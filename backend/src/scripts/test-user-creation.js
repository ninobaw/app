const mongoose = require('mongoose');
const User = require('../models/User');
const AppSettings = require('../models/AppSettings');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';
const JWT_SECRET = process.env.JWT_SECRET || 'sgdo_super_secret_key_2025_change_this_in_production';
const API_BASE_URL = 'http://localhost:5000';

async function testUserCreation() {
  try {
    console.log('🔍 Test de diagnostic pour la création d\'utilisateur');
    console.log('='.repeat(60));

    // 1. Connexion à la base de données
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    // 2. Vérifier AppSettings
    console.log('\n2. Vérification des AppSettings...');
    let appSettings = await AppSettings.findOne({});
    
    if (!appSettings) {
      console.log('❌ AppSettings non trouvé, création...');
      appSettings = new AppSettings({
        sessionTimeout: 60,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requirePasswordChange: true,
        emailNotificationsEnabled: true,
        smsNotificationsEnabled: false,
        pushNotificationsEnabled: true
      });
      await appSettings.save();
      console.log('✅ AppSettings créé');
    } else {
      console.log('✅ AppSettings trouvé');
      console.log(`   - Session timeout: ${appSettings.sessionTimeout} minutes`);
    }

    // 3. Recherche d'un admin pour obtenir un token
    console.log('\n3. Recherche d\'un utilisateur admin...');
    const adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    
    if (!adminUser) {
      console.log('❌ Aucun SUPER_ADMIN trouvé');
      console.log('   Impossible de tester la création d\'utilisateur');
      return;
    }
    
    console.log(`✅ Admin trouvé: ${adminUser.firstName} ${adminUser.lastName}`);

    // 4. Génération d'un token JWT
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

    // 5. Test de création d'utilisateur via API
    console.log('\n5. Test de création d\'utilisateur via API...');
    
    const testUserData = {
      email: `test.user.${Date.now()}@aerodoc.tn`,
      firstName: 'Test',
      lastName: 'User',
      password: 'TestPassword123!',
      role: 'AGENT',
      airport: 'ENFIDHA',
      phone: '+216 12 345 678',
      department: 'Test Department',
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    };

    console.log('📋 Données utilisateur à créer:');
    console.log(`   - Email: ${testUserData.email}`);
    console.log(`   - Nom: ${testUserData.firstName} ${testUserData.lastName}`);
    console.log(`   - Rôle: ${testUserData.role}`);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/users`, testUserData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Utilisateur créé avec succès !');
      console.log(`   - ID: ${response.data.id}`);
      console.log(`   - Email: ${response.data.email}`);
      console.log(`   - Session timeout: ${response.data.sessionTimeout} minutes`);
      
      // Nettoyer - supprimer l'utilisateur de test
      await User.findByIdAndDelete(response.data.id);
      console.log('🧹 Utilisateur de test supprimé');
      
    } catch (error) {
      console.log('❌ Erreur lors de la création d\'utilisateur:');
      console.error('   Message:', error.message);
      
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
        
        // Analyser l'erreur
        if (error.response.status === 500) {
          console.log('\n🔍 Analyse de l\'erreur 500:');
          console.log('   Causes possibles:');
          console.log('   1. Problème de connexion MongoDB');
          console.log('   2. Erreur de validation du modèle User');
          console.log('   3. Problème avec AppSettings.findOne()');
          console.log('   4. Erreur de hashage du mot de passe');
          console.log('   5. Conflit d\'UUID ou d\'email');
        }
      }
    }

    // 6. Test direct de création en base
    console.log('\n6. Test direct de création en base de données...');
    
    try {
      const bcrypt = require('bcryptjs');
      const { v4: uuidv4 } = require('uuid');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('TestPassword123!', salt);
      
      const directTestUser = new User({
        _id: uuidv4(),
        email: `direct.test.${Date.now()}@aerodoc.tn`,
        firstName: 'Direct',
        lastName: 'Test',
        password: hashedPassword,
        role: 'AGENT',
        airport: 'ENFIDHA',
        phone: '+216 87 654 321',
        department: 'Direct Test',
        isActive: true,
        mustChangePassword: true,
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
      });
      
      await directTestUser.save();
      console.log('✅ Création directe en base réussie');
      console.log(`   - ID: ${directTestUser._id}`);
      
      // Test du formatUserResponse
      const User = require('../models/User');
      const formatUserResponse = async (userDoc) => {
        const userObject = userDoc.toObject();
        delete userObject.password;
        userObject.id = userObject._id;
        
        const globalAppSettings = await AppSettings.findOne({});
        userObject.sessionTimeout = globalAppSettings ? globalAppSettings.sessionTimeout : 60;
        
        userObject.emailNotifications = userDoc.emailNotifications;
        userObject.smsNotifications = userDoc.smsNotifications;
        userObject.pushNotifications = userDoc.pushNotifications;
        
        return userObject;
      };
      
      const formattedUser = await formatUserResponse(directTestUser);
      console.log('✅ formatUserResponse fonctionne');
      console.log(`   - Session timeout: ${formattedUser.sessionTimeout}`);
      
      // Nettoyer
      await User.findByIdAndDelete(directTestUser._id);
      console.log('🧹 Utilisateur de test direct supprimé');
      
    } catch (error) {
      console.log('❌ Erreur création directe:');
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
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
testUserCreation();
