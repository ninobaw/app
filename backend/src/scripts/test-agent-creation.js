const mongoose = require('mongoose');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function testAgentCreation() {
  try {
    console.log('🧪 Test spécifique - Création utilisateur AGENT');
    console.log('='.repeat(60));

    // 1. Connexion à la base de données
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    // 2. Test avec différentes variations de données AGENT
    const testCases = [
      {
        name: 'AGENT - Données minimales',
        data: {
          email: 'agent.minimal@tav.aero',
          firstName: 'Agent',
          lastName: 'Minimal',
          role: 'AGENT',
          airport: 'ENFIDHA',
          password: 'password123'
        }
      },
      {
        name: 'AGENT - Avec champs optionnels',
        data: {
          email: 'agent.complet@tav.aero',
          firstName: 'Agent',
          lastName: 'Complet',
          role: 'AGENT',
          airport: 'ENFIDHA',
          phone: '12345678',
          department: 'Test Department',
          password: 'password123',
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true
        }
      },
      {
        name: 'AGENT - Avec champs directeur vides',
        data: {
          email: 'agent.vide@tav.aero',
          firstName: 'Agent',
          lastName: 'Vide',
          role: 'AGENT',
          airport: 'ENFIDHA',
          phone: '12345678',
          department: 'Test Department',
          password: 'password123',
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          // Champs directeur explicitement vides (comme le frontend pourrait envoyer)
          directorate: '',
          managedDepartments: [],
          delegationLevel: null
        }
      },
      {
        name: 'AGENT - Avec champs directeur undefined',
        data: {
          email: 'agent.undefined@tav.aero',
          firstName: 'Agent',
          lastName: 'Undefined',
          role: 'AGENT',
          airport: 'ENFIDHA',
          phone: '12345678',
          department: 'Test Department',
          password: 'password123',
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          // Champs directeur undefined
          directorate: undefined,
          managedDepartments: undefined,
          delegationLevel: undefined
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 ${testCase.name}`);
      console.log('='.repeat(40));
      
      try {
        // Préparer les données comme dans la route
        const userData = {
          _id: uuidv4(),
          ...testCase.data,
          password: await bcrypt.hash(testCase.data.password, 10),
          isActive: true,
          mustChangePassword: true,
          emailNotifications: testCase.data.emailNotifications ?? true,
          smsNotifications: testCase.data.smsNotifications ?? false,
          pushNotifications: testCase.data.pushNotifications ?? true
        };

        // Traitement conditionnel des champs directeur (comme dans la route)
        if (testCase.data.directorate) {
          userData.directorate = testCase.data.directorate;
        }
        if (testCase.data.managedDepartments && Array.isArray(testCase.data.managedDepartments)) {
          userData.managedDepartments = testCase.data.managedDepartments;
        }
        if (testCase.data.delegationLevel !== undefined) {
          userData.delegationLevel = testCase.data.delegationLevel;
        }

        console.log('📋 Données finales:');
        console.log(JSON.stringify(userData, null, 2));

        // Test de validation
        const user = new User(userData);
        const validationError = user.validateSync();
        
        if (validationError) {
          console.log('❌ Erreur de validation:');
          console.log('Message:', validationError.message);
          console.log('Erreurs détaillées:');
          Object.keys(validationError.errors).forEach(key => {
            const error = validationError.errors[key];
            console.log(`  - ${key}: ${error.message}`);
            console.log(`    Valeur: ${JSON.stringify(error.value)}`);
            console.log(`    Type: ${error.kind}`);
          });
          continue;
        }

        console.log('✅ Validation réussie');

        // Test de sauvegarde
        await User.deleteOne({ email: userData.email });
        await user.save();
        console.log('✅ Sauvegarde réussie');
        
        // Vérification
        const savedUser = await User.findById(user._id);
        console.log('✅ Utilisateur récupéré:', savedUser.email, '- Role:', savedUser.role);
        
        // Nettoyage
        await User.deleteOne({ email: userData.email });
        console.log('✅ Nettoyage effectué');

      } catch (error) {
        console.log('❌ Erreur:', error.message);
        if (error.errors) {
          Object.keys(error.errors).forEach(key => {
            console.log(`  - ${key}: ${error.errors[key].message}`);
          });
        }
      }
    }

    // 3. Test comparatif avec un DIRECTEUR qui fonctionne
    console.log('\n📋 Test DIRECTEUR (pour comparaison)');
    console.log('='.repeat(40));
    
    const directorData = {
      _id: uuidv4(),
      email: 'test.directeur.comparison@tav.aero',
      firstName: 'Test',
      lastName: 'Directeur',
      password: await bcrypt.hash('password123', 10),
      role: 'DIRECTEUR',
      airport: 'ENFIDHA',
      phone: '12345678',
      department: 'Test Direction',
      directorate: 'RH',
      managedDepartments: ['Test Department'],
      delegationLevel: 3,
      isActive: true,
      mustChangePassword: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    };

    const director = new User(directorData);
    const directorValidationError = director.validateSync();
    
    if (directorValidationError) {
      console.log('❌ Erreur validation directeur:', directorValidationError.message);
    } else {
      console.log('✅ Validation directeur réussie');
      await User.deleteOne({ email: directorData.email });
      await director.save();
      console.log('✅ Sauvegarde directeur réussie');
      await User.deleteOne({ email: directorData.email });
    }

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
testAgentCreation();
