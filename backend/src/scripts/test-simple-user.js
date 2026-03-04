const mongoose = require('mongoose');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function testSimpleUser() {
  try {
    console.log('🧪 Test de création d\'utilisateur simple');
    console.log('='.repeat(50));

    // 1. Connexion à la base de données
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    // 2. Test avec un utilisateur AGENT simple (pas de directorate requis)
    console.log('\n2. Test utilisateur AGENT simple...');
    
    const simpleUserData = {
      _id: uuidv4(),
      email: 'test.simple@tav.aero',
      firstName: 'Test',
      lastName: 'Simple',
      password: await bcrypt.hash('password123', 10),
      role: 'AGENT',
      airport: 'ENFIDHA',
      phone: '12345678',
      department: 'Test Department',
      isActive: true,
      mustChangePassword: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    };

    try {
      // Supprimer s'il existe
      await User.deleteOne({ email: simpleUserData.email });
      
      console.log('📋 Données utilisateur:');
      console.log(JSON.stringify(simpleUserData, null, 2));
      
      const user = new User(simpleUserData);
      console.log('\n🔍 Validation du modèle...');
      
      // Validation manuelle
      const validationError = user.validateSync();
      if (validationError) {
        console.log('❌ Erreur de validation:', validationError.message);
        console.log('Détails:', validationError.errors);
        return;
      }
      
      console.log('✅ Validation réussie');
      
      // Sauvegarde
      console.log('\n💾 Sauvegarde en base...');
      await user.save();
      console.log('✅ Utilisateur AGENT créé avec succès');
      
      // Vérification
      const savedUser = await User.findById(user._id);
      console.log('✅ Utilisateur récupéré:', savedUser.email);
      
      // Nettoyage
      await User.deleteOne({ email: simpleUserData.email });
      console.log('✅ Utilisateur supprimé (nettoyage)');
      
    } catch (error) {
      console.log('❌ Erreur création utilisateur AGENT:');
      console.log('Message:', error.message);
      console.log('Code:', error.code);
      console.log('Stack:', error.stack);
      
      if (error.errors) {
        console.log('Erreurs de validation:');
        Object.keys(error.errors).forEach(key => {
          console.log(`  - ${key}: ${error.errors[key].message}`);
        });
      }
    }

    // 3. Test avec un directeur (avec directorate)
    console.log('\n3. Test utilisateur DIRECTEUR...');
    
    const directorData = {
      _id: uuidv4(),
      email: 'test.director@tav.aero',
      firstName: 'Test',
      lastName: 'Director',
      password: await bcrypt.hash('password123', 10),
      role: 'DIRECTEUR',
      airport: 'ENFIDHA',
      phone: '12345678',
      department: 'Direction Test',
      directorate: 'RH',
      managedDepartments: ['Test Department'],
      delegationLevel: 3,
      isActive: true,
      mustChangePassword: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    };

    try {
      // Supprimer s'il existe
      await User.deleteOne({ email: directorData.email });
      
      console.log('📋 Données directeur:');
      console.log(JSON.stringify(directorData, null, 2));
      
      const director = new User(directorData);
      console.log('\n🔍 Validation du modèle directeur...');
      
      // Validation manuelle
      const validationError = director.validateSync();
      if (validationError) {
        console.log('❌ Erreur de validation directeur:', validationError.message);
        console.log('Détails:', validationError.errors);
        return;
      }
      
      console.log('✅ Validation directeur réussie');
      
      // Sauvegarde
      console.log('\n💾 Sauvegarde directeur en base...');
      await director.save();
      console.log('✅ Directeur créé avec succès');
      
      // Nettoyage
      await User.deleteOne({ email: directorData.email });
      console.log('✅ Directeur supprimé (nettoyage)');
      
    } catch (error) {
      console.log('❌ Erreur création directeur:');
      console.log('Message:', error.message);
      console.log('Code:', error.code);
      
      if (error.errors) {
        console.log('Erreurs de validation directeur:');
        Object.keys(error.errors).forEach(key => {
          console.log(`  - ${key}: ${error.errors[key].message}`);
        });
      }
    }

    console.log('\n✅ Tests terminés');

  } catch (error) {
    console.error('❌ Erreur générale:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Connexion MongoDB fermée');
  }
}

// Exécuter le test
testSimpleUser();
