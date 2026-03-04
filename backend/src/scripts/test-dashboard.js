const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';
const JWT_SECRET = process.env.JWT_SECRET || 'sgdo_super_secret_key_2025_change_this_in_production';
const API_BASE_URL = 'http://localhost:5000';

async function testDashboard() {
  try {
    console.log('🔍 Test de diagnostic pour le dashboard');
    console.log('='.repeat(60));

    // 1. Connexion à la base de données
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    // 2. Recherche d'un agent de bureau d'ordre
    console.log('\n2. Recherche d\'un agent de bureau d\'ordre...');
    let testUser = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });
    
    if (!testUser) {
      console.log('❌ Aucun agent de bureau d\'ordre trouvé');
      console.log('   Création d\'un utilisateur de test...');
      
      testUser = new User({
        firstName: 'Agent',
        lastName: 'Test',
        email: 'agent.test@tav.aero',
        password: 'password123', // Sera hashé automatiquement
        role: 'AGENT_BUREAU_ORDRE',
        airport: 'ENFIDHA',
        isActive: true
      });
      
      await testUser.save();
      console.log('✅ Utilisateur de test créé');
    }
    
    console.log(`✅ Agent trouvé: ${testUser.firstName} ${testUser.lastName} (${testUser.email})`);
    console.log(`   - ID: ${testUser._id}`);
    console.log(`   - Rôle: ${testUser.role}`);

    // 3. Génération d'un token JWT
    console.log('\n3. Génération du token JWT...');
    const token = jwt.sign(
      { 
        userId: testUser._id,
        email: testUser.email,
        role: testUser.role
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ Token JWT généré');

    // 4. Test de l'endpoint dashboard sans authentification
    console.log('\n4. Test de l\'endpoint dashboard SANS authentification...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
        params: {
          userId: testUser._id,
          userRole: testUser.role
        }
      });
      console.log('❌ Erreur: L\'endpoint a répondu sans authentification (problème de sécurité)');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Endpoint correctement protégé (401 Unauthorized)');
      } else {
        console.log(`❌ Erreur inattendue: ${error.message}`);
      }
    }

    // 5. Test de l'endpoint dashboard avec authentification
    console.log('\n5. Test de l\'endpoint dashboard AVEC authentification...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
        params: {
          userId: testUser._id,
          userRole: testUser.role
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Endpoint dashboard accessible avec authentification');
      console.log('📊 Données reçues:');
      
      const data = response.data;
      console.log(`   - Total correspondances: ${data.totalCorrespondences || 0}`);
      console.log(`   - En attente: ${data.pendingCorrespondences || 0}`);
      console.log(`   - Répondues: ${data.repliedCorrespondences || 0}`);
      console.log(`   - Informatives: ${data.informativeCorrespondences || 0}`);
      console.log(`   - Correspondances récentes: ${data.recentCorrespondences?.length || 0}`);
      
      // Vérifier les données spécifiques aux agents de bureau d'ordre
      if (data.totalCorrespondences !== undefined) {
        console.log('✅ Données spécialisées pour agents de bureau d\'ordre présentes');
      } else {
        console.log('❌ Données spécialisées manquantes');
      }
      
      // Vérifier les graphiques
      if (data.correspondencesCreatedMonthly && data.correspondencesByTypeStats) {
        console.log('✅ Données pour graphiques de correspondances présentes');
      } else {
        console.log('❌ Données pour graphiques manquantes');
      }
      
    } catch (error) {
      console.log('❌ Erreur lors de l\'accès au dashboard:');
      console.error('   Message:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
      }
    }

    // 6. Test avec un utilisateur normal
    console.log('\n6. Test avec un utilisateur normal...');
    let normalUser = await User.findOne({ role: { $ne: 'AGENT_BUREAU_ORDRE' } });
    
    if (normalUser) {
      const normalToken = jwt.sign(
        { 
          userId: normalUser._id,
          email: normalUser.email,
          role: normalUser.role
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
          params: {
            userId: normalUser._id,
            userRole: normalUser.role
          },
          headers: {
            'Authorization': `Bearer ${normalToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ Dashboard accessible pour ${normalUser.role}`);
        console.log(`   - Total documents: ${response.data.totalDocuments || 0}`);
        console.log(`   - Utilisateurs actifs: ${response.data.activeUsers || 0}`);
        
      } catch (error) {
        console.log(`❌ Erreur pour utilisateur ${normalUser.role}:`, error.message);
      }
    } else {
      console.log('⚠️  Aucun utilisateur normal trouvé pour le test');
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
testDashboard();
