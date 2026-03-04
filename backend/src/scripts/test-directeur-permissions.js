const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';
const JWT_SECRET = process.env.JWT_SECRET || 'aerodoc_super_secret_key_2025_change_this_in_production';
const API_BASE_URL = 'http://localhost:5000/api';

async function testDirecteurPermissions() {
  try {
    console.log('🔐 Test des Permissions Directeur');
    console.log('=================================\n');

    // 1. Connexion à MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 2. Trouver le directeur Anis Ben Jannet
    console.log('👤 Recherche du directeur...');
    const director = await User.findOne({ 
      email: 'anisbenjannet@tav.aero'
    });

    if (!director) {
      console.log('❌ Directeur non trouvé');
      return;
    }

    console.log('✅ Directeur trouvé:');
    console.log(`   - Email: ${director.email}`);
    console.log(`   - Nom: ${director.firstName} ${director.lastName}`);
    console.log(`   - Rôle: ${director.role}`);
    console.log(`   - Directorate: ${director.directorate}`);
    console.log(`   - Actif: ${director.isActive}`);
    console.log('');

    // 3. Générer un token JWT pour le directeur
    console.log('🔑 Génération du token JWT...');
    const token = jwt.sign(
      { 
        userId: director._id,
        email: director.email, 
        role: director.role,
        loginTime: Date.now()
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    console.log('✅ Token généré avec le bon format\n');

    // 4. Test de l'API correspondances avec le token du directeur
    console.log('🔄 Test de l\'accès aux correspondances...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/correspondances`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          includeReplies: true,
          limit: 100
        }
      });
      
      console.log('✅ Accès aux correspondances RÉUSSI !');
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Correspondances récupérées: ${response.data.data?.length || 0}`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('\n📝 Première correspondance:');
        const first = response.data.data[0];
        console.log(`   - ID: ${first._id}`);
        console.log(`   - Sujet: ${first.subject || 'N/A'}`);
        console.log(`   - De: ${first.from_address || 'N/A'}`);
        console.log(`   - Statut: ${first.status || 'N/A'}`);
        console.log(`   - Assigné à: ${first.assignedTo || 'Non assigné'}`);
      }
      
    } catch (error) {
      console.log('❌ Erreur d\'accès aux correspondances:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message}`);
      console.log(`   URL: ${error.config?.url}`);
      
      if (error.response?.status === 403) {
        console.log('\n🔍 DIAGNOSTIC 403 FORBIDDEN:');
        console.log('   - Le serveur backend a-t-il été redémarré ?');
        console.log('   - Les modifications du filtrage sont-elles actives ?');
        console.log('   - Le rôle DIRECTEUR est-il bien autorisé ?');
      }
    }

    // 5. Test des autres endpoints
    console.log('\n🔄 Test des autres endpoints...');
    
    // Test notifications
    try {
      const notifResponse = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`✅ Notifications: ${notifResponse.status}`);
    } catch (error) {
      console.log(`❌ Notifications: ${error.response?.status}`);
    }

    // Test users
    try {
      const usersResponse = await axios.get(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`✅ Users: ${usersResponse.status}`);
    } catch (error) {
      console.log(`❌ Users: ${error.response?.status}`);
    }

    console.log('\n🎯 RÉSUMÉ DU TEST');
    console.log('==================\n');
    
    console.log('✅ VÉRIFICATIONS EFFECTUÉES:');
    console.log('   - Directeur existe en base de données');
    console.log('   - Token JWT généré correctement');
    console.log('   - Test d\'accès aux correspondances');
    console.log('   - Test des autres endpoints\n');
    
    console.log('🚀 ACTIONS RECOMMANDÉES:');
    console.log('   1. Si erreur 403: Redémarrer le serveur backend');
    console.log('   2. Vérifier que les modifications sont actives');
    console.log('   3. Tester via l\'interface frontend');
    console.log('   4. Exécuter l\'assignation de correspondances\n');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testDirecteurPermissions();
