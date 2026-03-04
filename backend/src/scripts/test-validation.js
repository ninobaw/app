const mongoose = require('mongoose');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function testValidation() {
  try {
    console.log('🔍 Test de validation utilisateur');
    console.log('='.repeat(50));

    // 1. Connexion à la base de données
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    // 2. Test avec les mêmes données que le frontend envoie
    console.log('\n2. Test de validation avec données frontend...');
    
    // Données exactes que le frontend envoie (format CreateUserDialog)
    const frontendData = {
      _id: uuidv4(),
      email: 'test@tav.aero',
      firstName: 'Test',
      lastName: 'User',
      password: await bcrypt.hash('password123', 10),
      role: 'AGENT',
      airport: 'ENFIDHA',
      phone: '12345678',
      department: 'Test',
      isActive: true,
      mustChangePassword: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    };

    console.log('📋 Données à valider:');
    console.log(JSON.stringify(frontendData, null, 2));

    // Test de validation
    console.log('\n🔍 Test de validation...');
    const user = new User(frontendData);
    
    // Validation synchrone
    const syncValidationError = user.validateSync();
    if (syncValidationError) {
      console.log('❌ Erreur de validation synchrone:');
      console.log('Message:', syncValidationError.message);
      console.log('Erreurs détaillées:');
      Object.keys(syncValidationError.errors).forEach(key => {
        const error = syncValidationError.errors[key];
        console.log(`  - ${key}: ${error.message}`);
        console.log(`    Valeur: ${error.value}`);
        console.log(`    Type: ${error.kind}`);
      });
      return;
    }
    
    console.log('✅ Validation synchrone réussie');
    
    // Validation asynchrone (sauvegarde)
    console.log('\n💾 Test de sauvegarde...');
    try {
      // Supprimer s'il existe
      await User.deleteOne({ email: frontendData.email });
      
      await user.save();
      console.log('✅ Sauvegarde réussie');
      
      // Nettoyage
      await User.deleteOne({ email: frontendData.email });
      console.log('✅ Nettoyage effectué');
      
    } catch (saveError) {
      console.log('❌ Erreur lors de la sauvegarde:');
      console.log('Message:', saveError.message);
      console.log('Code:', saveError.code);
      
      if (saveError.errors) {
        console.log('Erreurs de validation:');
        Object.keys(saveError.errors).forEach(key => {
          const error = saveError.errors[key];
          console.log(`  - ${key}: ${error.message}`);
        });
      }
    }

    // 3. Test avec un directeur (cas plus complexe)
    console.log('\n3. Test avec un directeur...');
    
    const directorData = {
      _id: uuidv4(),
      email: 'test.director@tav.aero',
      firstName: 'Test',
      lastName: 'Director',
      password: await bcrypt.hash('password123', 10),
      role: 'DIRECTEUR',
      airport: 'ENFIDHA',
      phone: '12345678',
      department: 'Test Direction',
      directorate: 'RH',
      managedDepartments: ['Test'],
      delegationLevel: 3,
      isActive: true,
      mustChangePassword: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    };

    console.log('📋 Données directeur:');
    console.log(JSON.stringify(directorData, null, 2));

    const director = new User(directorData);
    
    const directorValidationError = director.validateSync();
    if (directorValidationError) {
      console.log('❌ Erreur de validation directeur:');
      console.log('Message:', directorValidationError.message);
      console.log('Erreurs détaillées:');
      Object.keys(directorValidationError.errors).forEach(key => {
        const error = directorValidationError.errors[key];
        console.log(`  - ${key}: ${error.message}`);
      });
    } else {
      console.log('✅ Validation directeur réussie');
      
      try {
        await User.deleteOne({ email: directorData.email });
        await director.save();
        console.log('✅ Sauvegarde directeur réussie');
        await User.deleteOne({ email: directorData.email });
      } catch (error) {
        console.log('❌ Erreur sauvegarde directeur:', error.message);
      }
    }

    // 4. Vérification du schéma User
    console.log('\n4. Analyse du schéma User...');
    const schema = User.schema;
    const paths = schema.paths;
    
    console.log('Champs requis:');
    Object.keys(paths).forEach(path => {
      const schemaType = paths[path];
      if (schemaType.isRequired) {
        console.log(`  - ${path}: ${schemaType.instance} (requis)`);
      }
    });

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
testValidation();
