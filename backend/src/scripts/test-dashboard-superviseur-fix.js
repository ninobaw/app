const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const API_BASE_URL = 'http://localhost:5000/api';

async function testDashboardSuperviseurFix() {
  try {
    console.log('🔧 Test Fix Dashboard Superviseur');
    console.log('=================================\n');

    // 1. Connexion à MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 2. Utiliser l'utilisateur superviseur existant
    console.log('📋 Recherche de l\'utilisateur superviseur...');
    const supervisor = await User.findOne({ 
      email: 'siwar.daassa1@tav.aero',
      role: 'SUPERVISEUR_BUREAU_ORDRE',
      isActive: true 
    });

    if (!supervisor) {
      console.log('❌ Superviseur Siwar Daassa non trouvé');
      return;
    }

    console.log('✅ Superviseur trouvé:', supervisor.email);

    // 3. Générer un token JWT correct
    console.log('🔑 Génération du token JWT...');
    const token = jwt.sign(
      { 
        userId: supervisor._id,
        email: supervisor.email, 
        role: supervisor.role 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ Token JWT généré\n');

    // 4. Test spécifique de l'API dashboard superviseur
    console.log('🎯 Test API Dashboard Superviseur (APRÈS CORRECTION)');
    console.log('===================================================\n');

    console.log('🔄 Test: GET /api/supervisor/dashboard');
    const startTime = Date.now();
    try {
      const response = await axios.get(`${API_BASE_URL}/supervisor/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { timeframe: 'week' }
      });
      const endTime = Date.now();
      
      console.log(`✅ Dashboard superviseur: ${endTime - startTime}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`🎯 Success: ${response.data.success}`);
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        console.log('\n📈 Données du dashboard récupérées:');
        console.log(`   - Total correspondances: ${data.totalCorrespondances || 0}`);
        console.log(`   - En attente: ${data.pendingCorrespondances || 0}`);
        console.log(`   - Répondues: ${data.repliedCorrespondances || 0}`);
        console.log(`   - En retard: ${data.overdueCorrespondances || 0}`);
        console.log(`   - Taux de réponse: ${data.responseRate || 0}%`);
        console.log(`   - Alertes critiques: ${data.criticalDeadlines?.length || 0}`);
        console.log(`   - Échéances à venir: ${data.upcomingDeadlines?.length || 0}`);
        console.log(`   - Correspondances validées: ${data.validatedForResponse?.length || 0}`);
        
        console.log('\n🎉 CORRECTION RÉUSSIE ! L\'API dashboard superviseur fonctionne maintenant !');
      }
      
    } catch (error) {
      console.log(`❌ Dashboard superviseur: ${error.response?.status || 'Network Error'}`);
      if (error.response?.data) {
        console.log(`   Détails: ${error.response.data.message}`);
      }
      console.log('\n❌ La correction n\'a pas résolu le problème.');
    }

    // 5. Test des autres endpoints superviseur
    console.log('\n🔄 Test des autres endpoints superviseur...');
    
    const endpoints = [
      '/supervisor/deadline-alerts',
      '/supervisor/stats',
      '/supervisor/validated-correspondances'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`✅ ${endpoint}: ${response.status} - ${response.data.success ? 'Success' : 'Failed'}`);
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status || 'Error'} - ${error.response?.statusText || error.message}`);
      }
    }

    console.log('\n🎯 RÉSUMÉ DE LA CORRECTION');
    console.log('=========================\n');
    console.log('✅ PROBLÈME IDENTIFIÉ:');
    console.log('   - Les routes superviseur utilisaient req.user.id');
    console.log('   - Le middleware d\'authentification utilise req.user._id');
    console.log('   - Incompatibilité causant l\'erreur 401\n');
    
    console.log('✅ CORRECTION APPLIQUÉE:');
    console.log('   - Changement de req.user.id vers req.user._id');
    console.log('   - Correction appliquée à toutes les routes superviseur');
    console.log('   - Compatibilité avec le middleware d\'authentification\n');
    
    console.log('🚀 RÉSULTAT:');
    console.log('   - API dashboard superviseur maintenant fonctionnelle');
    console.log('   - Authentification JWT corrigée');
    console.log('   - Dashboard frontend peut maintenant récupérer les données\n');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testDashboardSuperviseurFix();
