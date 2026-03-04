const mongoose = require('mongoose');
const User = require('../models/User');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function debugCurrentState() {
  try {
    console.log('🔍 Diagnostic de l\'état actuel des utilisateurs');
    console.log('='.repeat(60));

    // 1. Connexion à la base de données
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    // 2. Lister tous les utilisateurs existants
    console.log('\n2. Liste des utilisateurs existants:');
    const users = await User.find({}).select('email firstName lastName role directorate isActive');
    
    console.log(`Trouvé ${users.length} utilisateur(s):`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      - Nom: ${user.firstName} ${user.lastName}`);
      console.log(`      - Role: ${user.role}`);
      console.log(`      - Directorate: ${user.directorate || 'N/A'}`);
      console.log(`      - Actif: ${user.isActive}`);
      console.log('');
    });

    // 3. Vérifier spécifiquement Anis Ben Jannet
    console.log('\n3. Vérification d\'Anis Ben Jannet:');
    const anis = await User.findOne({ 
      $or: [
        { firstName: /anis/i, lastName: /jannet/i },
        { firstName: /anis/i, lastName: /ben/i },
        { email: /anis/i }
      ]
    });
    
    if (anis) {
      console.log('✅ Anis trouvé:');
      console.log('   Email:', anis.email);
      console.log('   Nom complet:', anis.firstName, anis.lastName);
      console.log('   Role:', anis.role);
      console.log('   Directorate:', anis.directorate);
      console.log('   Départements gérés:', anis.managedDepartments);
      console.log('   Niveau délégation:', anis.delegationLevel);
      console.log('   Données complètes:', JSON.stringify(anis.toObject(), null, 2));
    } else {
      console.log('❌ Anis Ben Jannet non trouvé');
    }

    // 4. Test de création pour chaque rôle
    console.log('\n4. Test de création pour chaque rôle:');
    
    const testCases = [
      {
        name: 'SUPER_ADMIN',
        data: {
          email: 'test.superadmin@tav.aero',
          firstName: 'Test',
          lastName: 'SuperAdmin',
          role: 'SUPER_ADMIN',
          airport: 'ENFIDHA',
          password: 'password123'
        }
      },
      {
        name: 'AGENT',
        data: {
          email: 'test.agent.debug@tav.aero',
          firstName: 'Test',
          lastName: 'Agent',
          role: 'AGENT',
          airport: 'ENFIDHA',
          password: 'password123'
        }
      },
      {
        name: 'DIRECTEUR',
        data: {
          email: 'test.directeur.debug@tav.aero',
          firstName: 'Test',
          lastName: 'Directeur',
          role: 'DIRECTEUR',
          airport: 'ENFIDHA',
          password: 'password123',
          directorate: 'RH',
          managedDepartments: ['Test'],
          delegationLevel: 3
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Test ${testCase.name}:`);
      
      try {
        // Supprimer s'il existe
        await User.deleteOne({ email: testCase.data.email });
        
        // Créer l'utilisateur
        const userData = {
          _id: require('uuid').v4(),
          ...testCase.data,
          password: await require('bcryptjs').hash(testCase.data.password, 10),
          isActive: true,
          mustChangePassword: true,
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true
        };

        const user = new User(userData);
        const validationError = user.validateSync();
        
        if (validationError) {
          console.log('❌ Erreur de validation:');
          Object.keys(validationError.errors).forEach(key => {
            console.log(`   - ${key}: ${validationError.errors[key].message}`);
          });
        } else {
          await user.save();
          console.log('✅ Création réussie');
          
          // Vérifier la sauvegarde
          const saved = await User.findById(user._id);
          console.log('   Role sauvegardé:', saved.role);
          console.log('   Directorate sauvegardé:', saved.directorate);
          
          // Nettoyage
          await User.deleteOne({ email: testCase.data.email });
        }
        
      } catch (error) {
        console.log('❌ Erreur:', error.message);
      }
    }

    // 5. Vérifier le schéma User pour les changements récents
    console.log('\n5. Analyse du schéma User:');
    const schema = User.schema;
    const directorateField = schema.paths.directorate;
    
    console.log('Champ directorate:');
    console.log('   Type:', directorateField.instance);
    console.log('   Enum:', directorateField.enumValues);
    console.log('   Requis:', directorateField.isRequired);
    console.log('   Fonction required:', directorateField.validators.find(v => v.type === 'required')?.validator.toString());

  } catch (error) {
    console.error('❌ Erreur générale:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Connexion MongoDB fermée');
  }
}

// Exécuter le diagnostic
debugCurrentState();
