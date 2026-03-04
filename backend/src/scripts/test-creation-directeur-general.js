const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const API_BASE_URL = 'http://localhost:5000/api';

async function testCreationDirecteurGeneral() {
  try {
    console.log('🎯 Test Création Directeur Général');
    console.log('==================================\n');

    // 1. Connexion à MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 2. Vérifier qu'un super admin existe pour faire le test
    console.log('👤 Recherche d\'un super admin...');
    const superAdmin = await User.findOne({ role: 'SUPER_ADMIN', isActive: true });
    
    if (!superAdmin) {
      console.log('❌ Aucun super admin trouvé pour effectuer le test');
      return;
    }
    
    console.log('✅ Super admin trouvé:', superAdmin.email);

    // 3. Générer un token JWT pour le super admin
    console.log('🔑 Génération du token JWT...');
    const token = jwt.sign(
      { 
        userId: superAdmin._id,
        email: superAdmin.email, 
        role: superAdmin.role 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ Token généré\n');

    // 4. Préparer les données du directeur général
    const directeurData = {
      email: 'melanie.test@tav.aero',
      firstName: 'Mélanie',
      lastName: 'Lefèvre',
      role: 'DIRECTEUR_GENERAL',
      airport: 'GENERALE',
      phone: '+216 12 345 678',
      department: 'Direction Générale',
      password: 'DirecteurGeneral123!',
      directorate: 'GENERAL', // ✅ Corrigé: GENERAL au lieu de GENERALE
      managedDepartments: ['Direction Générale', 'Secrétariat Général'],
      delegationLevel: 5,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    };

    console.log('📋 Données du directeur général à créer:');
    console.log('   - Email:', directeurData.email);
    console.log('   - Nom:', directeurData.firstName, directeurData.lastName);
    console.log('   - Rôle:', directeurData.role);
    console.log('   - Direction:', directeurData.directorate);
    console.log('   - Aéroport:', directeurData.airport);
    console.log('   - Départements gérés:', directeurData.managedDepartments.join(', '));
    console.log('   - Niveau de délégation:', directeurData.delegationLevel);
    console.log('');

    // 5. Supprimer l'utilisateur s'il existe déjà
    console.log('🧹 Nettoyage des données existantes...');
    const existingUser = await User.findOne({ email: directeurData.email });
    if (existingUser) {
      await User.deleteOne({ email: directeurData.email });
      console.log('✅ Utilisateur existant supprimé');
    } else {
      console.log('ℹ️  Aucun utilisateur existant à supprimer');
    }
    console.log('');

    // 6. Test de création via API
    console.log('🔄 Test de création via API...');
    try {
      const response = await axios.post(`${API_BASE_URL}/users`, directeurData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Création réussie !');
      console.log('📊 Status:', response.status);
      console.log('👤 Utilisateur créé:');
      console.log('   - ID:', response.data.id);
      console.log('   - Email:', response.data.email);
      console.log('   - Nom:', response.data.firstName, response.data.lastName);
      console.log('   - Rôle:', response.data.role);
      console.log('   - Direction:', response.data.directorate);
      console.log('   - Actif:', response.data.isActive);
      console.log('   - Doit changer mot de passe:', response.data.mustChangePassword);
      
    } catch (error) {
      console.log('❌ Erreur lors de la création:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
      
      if (error.response?.data?.details) {
        console.log('   Détails de validation:');
        Object.keys(error.response.data.details).forEach(field => {
          console.log(`     - ${field}: ${error.response.data.details[field].message}`);
        });
      }
      
      console.log('   Données envoyées:', JSON.stringify(directeurData, null, 2));
    }
    console.log('');

    // 7. Vérification en base de données
    console.log('🔍 Vérification en base de données...');
    const createdUser = await User.findOne({ email: directeurData.email });
    
    if (createdUser) {
      console.log('✅ Utilisateur trouvé en base:');
      console.log('   - ID:', createdUser._id);
      console.log('   - Email:', createdUser.email);
      console.log('   - Rôle:', createdUser.role);
      console.log('   - Direction:', createdUser.directorate);
      console.log('   - Départements gérés:', createdUser.managedDepartments);
      console.log('   - Niveau délégation:', createdUser.delegationLevel);
      console.log('   - isDirector():', createdUser.isDirector());
    } else {
      console.log('❌ Utilisateur non trouvé en base de données');
    }
    console.log('');

    // 8. Test de validation du modèle directement
    console.log('🧪 Test de validation du modèle Mongoose...');
    try {
      const testUser = new User({
        _id: 'test-validation-id',
        email: 'test.validation@tav.aero',
        firstName: 'Test',
        lastName: 'Validation',
        password: 'hashedpassword',
        role: 'DIRECTEUR_GENERAL',
        airport: 'GENERALE',
        directorate: 'GENERAL', // ✅ Valeur correcte
        isActive: true
      });
      
      const validationError = testUser.validateSync();
      if (validationError) {
        console.log('❌ Erreur de validation Mongoose:');
        Object.keys(validationError.errors).forEach(field => {
          console.log(`   - ${field}: ${validationError.errors[field].message}`);
        });
      } else {
        console.log('✅ Validation Mongoose réussie');
      }
    } catch (error) {
      console.log('❌ Erreur lors du test de validation:', error.message);
    }
    console.log('');

    // 9. Résumé des corrections
    console.log('🎯 RÉSUMÉ DES CORRECTIONS APPLIQUÉES');
    console.log('====================================\n');
    
    console.log('✅ PROBLÈME IDENTIFIÉ:');
    console.log('   - Valeur "GENERALE" dans frontend ne correspondait pas à "GENERAL" dans backend');
    console.log('   - Champ directorate requis pour DIRECTEUR_GENERAL mais valeur incorrecte\n');
    
    console.log('✅ CORRECTIONS APPLIQUÉES:');
    console.log('   - CreateUserDialog.tsx: GENERALE → GENERAL');
    console.log('   - EditUserDialog.tsx: GENERALE → GENERAL');
    console.log('   - Validation frontend maintenue pour champ obligatoire\n');
    
    console.log('✅ VALEURS CORRECTES POUR DIRECTORATE:');
    console.log('   - GENERAL (Direction Générale)');
    console.log('   - TECHNIQUE (Direction Technique)');
    console.log('   - COMMERCIAL (Direction Commerciale)');
    console.log('   - FINANCIER (Direction Financière)');
    console.log('   - OPERATIONS (Direction des Opérations)');
    console.log('   - RH (Direction des Ressources Humaines)\n');

    console.log('🚀 PROCHAINES ÉTAPES:');
    console.log('   1. Tester la création via l\'interface frontend');
    console.log('   2. Sélectionner "Direction Générale" dans le dropdown');
    console.log('   3. Vérifier que la création fonctionne sans erreur 400');
    console.log('   4. Confirmer que l\'utilisateur apparaît dans la liste\n');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testCreationDirecteurGeneral();
