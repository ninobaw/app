const mongoose = require('mongoose');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function debugUserCreation() {
  try {
    console.log('🔍 Diagnostic de création d\'utilisateur');
    console.log('='.repeat(60));

    // 1. Connexion à la base de données
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    // 2. Test de création d'un utilisateur simple
    console.log('\n2. Test de création d\'un utilisateur AGENT...');
    
    const testUserData = {
      _id: uuidv4(),
      email: 'test.agent@tav.aero',
      firstName: 'Test',
      lastName: 'Agent',
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

    try {
      // Supprimer l'utilisateur test s'il existe
      await User.deleteOne({ email: testUserData.email });
      
      const testUser = new User(testUserData);
      await testUser.save();
      console.log('✅ Création utilisateur AGENT réussie');
      
      // Nettoyer
      await User.deleteOne({ email: testUserData.email });
      
    } catch (error) {
      console.log('❌ Erreur création utilisateur AGENT:');
      console.log('Message:', error.message);
      console.log('Erreurs de validation:', error.errors);
    }

    // 3. Test de création d'un directeur
    console.log('\n3. Test de création d\'un DIRECTEUR...');
    
    const testDirectorData = {
      _id: uuidv4(),
      email: 'test.directeur@tav.aero',
      firstName: 'Test',
      lastName: 'Directeur',
      password: await bcrypt.hash('password123', 10),
      role: 'DIRECTEUR',
      airport: 'ENFIDHA',
      phone: '12345678',
      department: 'Test Direction',
      directorate: 'RH', // Ajouter le directorate requis
      managedDepartments: ['Test Direction'],
      isActive: true,
      mustChangePassword: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    };

    try {
      // Supprimer l'utilisateur test s'il existe
      await User.deleteOne({ email: testDirectorData.email });
      
      const testDirector = new User(testDirectorData);
      await testDirector.save();
      console.log('✅ Création DIRECTEUR réussie');
      
      // Nettoyer
      await User.deleteOne({ email: testDirectorData.email });
      
    } catch (error) {
      console.log('❌ Erreur création DIRECTEUR:');
      console.log('Message:', error.message);
      console.log('Erreurs de validation:', error.errors);
    }

    // 4. Vérifier la logique de validation du directorate
    console.log('\n4. Analyse de la validation directorate...');
    
    const roles = ['AGENT', 'DIRECTEUR', 'DIRECTEUR_GENERAL', 'SOUS_DIRECTEUR'];
    
    roles.forEach(role => {
      const requiresDirectorate = role && role.startsWith('DIRECTEUR_');
      console.log(`   ${role}: directorate requis = ${requiresDirectorate}`);
    });

    console.log('\n⚠️ PROBLÈME IDENTIFIÉ:');
    console.log('   La validation directorate utilise role.startsWith("DIRECTEUR_")');
    console.log('   Mais les rôles sont: DIRECTEUR, DIRECTEUR_GENERAL, SOUS_DIRECTEUR');
    console.log('   Seul DIRECTEUR_GENERAL correspond à la validation !');

    // 5. Test avec différents rôles
    console.log('\n5. Test de validation pour chaque rôle...');
    
    const testRoles = [
      { role: 'AGENT', needsDirectorate: false },
      { role: 'DIRECTEUR', needsDirectorate: true }, // Devrait être true mais validation dit false
      { role: 'DIRECTEUR_GENERAL', needsDirectorate: true },
      { role: 'SOUS_DIRECTEUR', needsDirectorate: true } // Devrait être true mais validation dit false
    ];

    for (const testRole of testRoles) {
      const userData = {
        _id: uuidv4(),
        email: `test.${testRole.role.toLowerCase()}@tav.aero`,
        firstName: 'Test',
        lastName: testRole.role,
        password: await bcrypt.hash('password123', 10),
        role: testRole.role,
        airport: 'ENFIDHA',
        phone: '12345678',
        department: 'Test',
        isActive: true,
        mustChangePassword: true,
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true
      };

      // Ajouter directorate si nécessaire
      if (testRole.needsDirectorate) {
        userData.directorate = 'RH';
        userData.managedDepartments = ['Test'];
      }

      try {
        await User.deleteOne({ email: userData.email });
        const user = new User(userData);
        await user.save();
        console.log(`   ✅ ${testRole.role}: Création réussie`);
        await User.deleteOne({ email: userData.email });
      } catch (error) {
        console.log(`   ❌ ${testRole.role}: ${error.message}`);
      }
    }

    // 6. Solution recommandée
    console.log('\n6. 🔧 SOLUTION RECOMMANDÉE:');
    console.log('');
    console.log('   Modifier la validation dans User.js:');
    console.log('   ');
    console.log('   required: function() {');
    console.log('     return this.role && (');
    console.log('       this.role === "DIRECTEUR" ||');
    console.log('       this.role === "DIRECTEUR_GENERAL" ||');
    console.log('       this.role === "SOUS_DIRECTEUR"');
    console.log('     );');
    console.log('   }');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Diagnostic terminé - Connexion MongoDB fermée');
  }
}

// Exécuter le diagnostic
debugUserCreation();
