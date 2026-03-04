const mongoose = require('mongoose');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function captureFrontendData() {
  try {
    console.log('🔍 Capture des données frontend vs backend');
    console.log('='.repeat(60));

    // 1. Connexion à la base de données
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    // 2. Simuler exactement ce que le frontend envoie (req.body)
    console.log('\n2. Simulation des données frontend (req.body)...');
    
    // Données EXACTES que le frontend envoie dans req.body
    const frontendReqBody = {
      email: 'test@tav.aero',
      firstName: 'Test',
      lastName: 'User',
      role: 'AGENT',
      airport: 'ENFIDHA',
      phone: '12345678',
      department: 'Test',
      password: 'password123', // Mot de passe en clair (comme le frontend l'envoie)
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      // Champs directeur (peuvent être undefined/null)
      directorate: undefined,
      managedDepartments: undefined,
      delegationLevel: undefined
    };

    console.log('📋 Données req.body (frontend):');
    console.log(JSON.stringify(frontendReqBody, null, 2));

    // 3. Simuler exactement le traitement de la route POST
    console.log('\n3. Simulation du traitement route POST...');
    
    const { 
      email, 
      firstName, 
      lastName, 
      role, 
      airport, 
      phone, 
      department, 
      password, 
      emailNotifications, 
      smsNotifications, 
      pushNotifications,
      directorate,
      managedDepartments,
      delegationLevel
    } = frontendReqBody;

    console.log('🔍 Champs extraits:', {
      email, firstName, lastName, role, airport, phone, department,
      directorate, managedDepartments, delegationLevel
    });

    // 4. Vérification des champs requis
    if (!email || !firstName || !lastName || !password) {
      console.log('❌ Champs requis manquants');
      return;
    }
    console.log('✅ Champs requis présents');

    // 5. Hachage du mot de passe
    console.log('\n🔍 Hachage du mot de passe...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('✅ Mot de passe haché');

    // 6. Création de l'objet userData (exactement comme dans la route)
    console.log('\n🔍 Création de l\'objet userData...');
    const userData = {
      _id: uuidv4(),
      email,
      firstName,
      lastName,
      password: hashedPassword,
      role,
      airport,
      phone,
      department,
      isActive: true,
      mustChangePassword: true,
      emailNotifications: emailNotifications ?? true,
      smsNotifications: smsNotifications ?? false,
      pushNotifications: pushNotifications ?? true,
    };

    // 7. Ajout des champs directeur (exactement comme dans la route)
    if (directorate) {
      console.log('🔍 Ajout directorate:', directorate);
      userData.directorate = directorate;
    } else {
      console.log('🔍 Pas de directorate (undefined/null)');
    }
    
    if (managedDepartments && Array.isArray(managedDepartments)) {
      console.log('🔍 Ajout managedDepartments:', managedDepartments);
      userData.managedDepartments = managedDepartments;
    } else {
      console.log('🔍 Pas de managedDepartments (undefined/null/pas array)');
    }
    
    if (delegationLevel !== undefined) {
      console.log('🔍 Ajout delegationLevel:', delegationLevel);
      userData.delegationLevel = delegationLevel;
    } else {
      console.log('🔍 Pas de delegationLevel (undefined)');
    }

    console.log('\n📋 userData final (route):');
    console.log(JSON.stringify(userData, null, 2));

    // 8. Test de validation (exactement comme dans la route)
    console.log('\n🔍 Test de validation...');
    const newUser = new User(userData);
    
    const validationError = newUser.validateSync();
    if (validationError) {
      console.log('❌ Erreur de validation:');
      console.log('Message:', validationError.message);
      console.log('Détails:');
      Object.keys(validationError.errors).forEach(key => {
        const error = validationError.errors[key];
        console.log(`  - ${key}: ${error.message}`);
        console.log(`    Valeur: ${error.value}`);
        console.log(`    Type: ${error.kind}`);
      });
      return;
    }
    
    console.log('✅ Validation réussie');

    // 9. Test de sauvegarde
    console.log('\n💾 Test de sauvegarde...');
    try {
      await User.deleteOne({ email: userData.email });
      await newUser.save();
      console.log('✅ Sauvegarde réussie');
      await User.deleteOne({ email: userData.email });
      console.log('✅ Nettoyage effectué');
    } catch (saveError) {
      console.log('❌ Erreur de sauvegarde:', saveError.message);
      if (saveError.errors) {
        Object.keys(saveError.errors).forEach(key => {
          console.log(`  - ${key}: ${saveError.errors[key].message}`);
        });
      }
    }

    console.log('\n✅ CONCLUSION: La simulation complète fonctionne !');
    console.log('Le problème doit être ailleurs...');

  } catch (error) {
    console.error('❌ Erreur générale:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Connexion MongoDB fermée');
  }
}

// Exécuter la capture
captureFrontendData();
