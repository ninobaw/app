const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const API_BASE_URL = 'http://localhost:5000/api';

async function testSupervisorAPI() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Trouver ou créer un superviseur
    console.log('\n📋 1. Recherche d\'un utilisateur superviseur...');
    let supervisor = await User.findOne({ role: 'SUPERVISEUR_BUREAU_ORDRE' });
    
    if (!supervisor) {
      console.log('❌ Aucun superviseur trouvé. Création...');
      supervisor = new User({
        firstName: 'Superviseur',
        lastName: 'Test',
        email: 'superviseur.test@tav.aero',
        password: 'supervisor123',
        role: 'SUPERVISEUR_BUREAU_ORDRE',
        airport: 'GENERALE',
        isActive: true
      });
      await supervisor.save();
      console.log('✅ Superviseur créé');
    }

    console.log(`✅ Superviseur trouvé: ${supervisor.firstName} ${supervisor.lastName} (${supervisor.email})`);

    // 2. Générer un token JWT
    console.log('\n📋 2. Génération du token JWT...');
    const token = jwt.sign(
      { 
        userId: supervisor._id, // Utiliser userId au lieu de id
        email: supervisor.email, 
        role: supervisor.role 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ Token JWT généré');

    // 3. Tester l'API dashboard superviseur
    console.log('\n📋 3. Test de l\'API dashboard superviseur...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/supervisor/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          timeframe: 'week'
        }
      });

      console.log('✅ API dashboard superviseur accessible');
      console.log('📊 Réponse API:');
      console.log(`  - Success: ${response.data.success}`);
      
      if (response.data.data) {
        const data = response.data.data;
        console.log('📈 Données du dashboard:');
        console.log(`  - Total correspondances: ${data.totalCorrespondances || 0}`);
        console.log(`  - En attente: ${data.pendingCorrespondances || 0}`);
        console.log(`  - Répondues: ${data.repliedCorrespondances || 0}`);
        console.log(`  - En retard: ${data.overdueCorrespondances || 0}`);
        console.log(`  - Taux de réponse: ${data.responseRate || 0}%`);
        console.log(`  - Alertes critiques: ${data.criticalDeadlines?.length || 0}`);
        console.log(`  - Échéances à venir: ${data.upcomingDeadlines?.length || 0}`);
        console.log(`  - Correspondances validées: ${data.validatedForResponse?.length || 0}`);
        
        if (data.priorityBreakdown) {
          console.log('🎯 Répartition par priorité:');
          console.log(`  - URGENT: ${data.priorityBreakdown.URGENT || 0}`);
          console.log(`  - HIGH: ${data.priorityBreakdown.HIGH || 0}`);
          console.log(`  - MEDIUM: ${data.priorityBreakdown.MEDIUM || 0}`);
          console.log(`  - LOW: ${data.priorityBreakdown.LOW || 0}`);
        }
        
        if (data.airportStats && data.airportStats.length > 0) {
          console.log('🏢 Statistiques par aéroport:');
          data.airportStats.forEach(stat => {
            console.log(`  - ${stat.airport}: ${stat.responded}/${stat.total} (${stat.responseRate}%)`);
          });
        }
      }

    } catch (apiError) {
      console.error('❌ Erreur API dashboard superviseur:', apiError.response?.status, apiError.response?.statusText);
      if (apiError.response?.data) {
        console.error('📄 Détails de l\'erreur:', apiError.response.data);
      }
    }

    // 4. Tester d'autres endpoints superviseur
    console.log('\n📋 4. Test des autres endpoints superviseur...');
    
    const endpoints = [
      '/supervisor/stats',
      '/supervisor/validated-correspondances',
      '/supervisor/deadline-alerts'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`✅ ${endpoint}: ${response.status} - ${response.data.success ? 'Success' : 'Failed'}`);
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status || 'Error'} - ${error.response?.statusText || error.message}`);
      }
    }

    console.log('\n🎉 Test API terminé!');
    console.log('\n📝 Informations de connexion superviseur:');
    console.log(`📧 Email: ${supervisor.email}`);
    console.log(`🔑 Mot de passe: supervisor123`);
    console.log(`👤 Rôle: ${supervisor.role}`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testSupervisorAPI();
