const mongoose = require('mongoose');
const User = require('../models/User');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const API_BASE_URL = 'http://localhost:5000/api';

async function testPerformanceOptimizations() {
  try {
    console.log('🚀 Test des optimisations de performance');
    console.log('=====================================\n');

    // 1. Connexion à MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 2. Utiliser un utilisateur existant ou créer un utilisateur de test
    let testUser = await User.findOne({ role: 'SUPER_ADMIN', isActive: true });
    if (!testUser) {
      // Utiliser l'utilisateur superviseur existant pour les tests
      testUser = await User.findOne({ email: 'siwar.daassa1@tav.aero' });
      if (!testUser) {
        console.log('❌ Aucun utilisateur trouvé pour les tests');
        return;
      }
    }
    console.log('✅ Utilisateur de test trouvé:', testUser.email);

    // 3. Générer un token JWT
    const token = jwt.sign(
      { 
        userId: testUser._id, // Utiliser userId au lieu de id
        email: testUser.email, 
        role: testUser.role 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('📊 Test des performances des routes utilisateurs');
    console.log('================================================\n');

    // 4. Test de la route originale /api/users
    console.log('🔄 Test route originale: GET /api/users');
    const startTime1 = Date.now();
    try {
      const response1 = await axios.get(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const endTime1 = Date.now();
      console.log(`✅ Route originale: ${endTime1 - startTime1}ms - ${response1.data.length} utilisateurs`);
    } catch (error) {
      console.log(`❌ Route originale: Erreur ${error.response?.status || 'Network'}`);
    }

    // 5. Test de la route optimisée /api/users/for-correspondance
    console.log('🔄 Test route optimisée: GET /api/users/for-correspondance');
    const startTime2 = Date.now();
    try {
      const response2 = await axios.get(`${API_BASE_URL}/users/for-correspondance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const endTime2 = Date.now();
      console.log(`✅ Route optimisée correspondance: ${endTime2 - startTime2}ms - ${response2.data.length} utilisateurs`);
    } catch (error) {
      console.log(`❌ Route optimisée correspondance: Erreur ${error.response?.status || 'Network'}`);
    }

    // 6. Test de la route ultra-optimisée /api/users/active-light
    console.log('🔄 Test route ultra-optimisée: GET /api/users/active-light');
    const startTime3 = Date.now();
    try {
      const response3 = await axios.get(`${API_BASE_URL}/users/active-light`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const endTime3 = Date.now();
      console.log(`✅ Route ultra-optimisée: ${endTime3 - startTime3}ms - ${response3.data.length} utilisateurs`);
    } catch (error) {
      console.log(`❌ Route ultra-optimisée: Erreur ${error.response?.status || 'Network'}`);
    }

    console.log('\n📊 Test des performances du dashboard superviseur');
    console.log('=================================================\n');

    // 7. Utiliser le superviseur existant
    let supervisor = await User.findOne({ role: 'SUPERVISEUR_BUREAU_ORDRE', isActive: true });
    if (!supervisor) {
      console.log('❌ Aucun superviseur trouvé pour les tests');
      return;
    }
    console.log('✅ Superviseur trouvé:', supervisor.email);

    const supervisorToken = jwt.sign(
      { 
        userId: supervisor._id, // Utiliser userId au lieu de id
        email: supervisor.email, 
        role: supervisor.role 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 8. Test du dashboard superviseur
    console.log('🔄 Test dashboard superviseur: GET /api/supervisor/dashboard');
    const startTime4 = Date.now();
    try {
      const response4 = await axios.get(`${API_BASE_URL}/supervisor/dashboard`, {
        headers: { 'Authorization': `Bearer ${supervisorToken}` },
        params: { timeframe: 'week' }
      });
      const endTime4 = Date.now();
      console.log(`✅ Dashboard superviseur: ${endTime4 - startTime4}ms`);
      
      if (response4.data.success && response4.data.data) {
        const data = response4.data.data;
        console.log(`   📈 Données récupérées:`);
        console.log(`   - Total correspondances: ${data.totalCorrespondances || 0}`);
        console.log(`   - En attente: ${data.pendingCorrespondances || 0}`);
        console.log(`   - Alertes critiques: ${data.criticalDeadlines?.length || 0}`);
        console.log(`   - Correspondances validées: ${data.validatedForResponse?.length || 0}`);
      }
    } catch (error) {
      console.log(`❌ Dashboard superviseur: Erreur ${error.response?.status || 'Network'}`);
      if (error.response?.data) {
        console.log(`   Détails: ${error.response.data.message || 'Erreur inconnue'}`);
      }
    }

    console.log('\n🎯 Recommandations de performance');
    console.log('==================================\n');
    
    console.log('✅ Routes optimisées créées:');
    console.log('   - /api/users/for-correspondance (filtrage + champs limités)');
    console.log('   - /api/users/active-light (ultra-léger)');
    console.log('   - Dashboard superviseur avec cache optimisé');
    
    console.log('\n📝 Utilisation recommandée:');
    console.log('   - Correspondances: useUsersForCorrespondance()');
    console.log('   - Listes simples: useActiveUsersLight()');
    console.log('   - Dashboard superviseur: SupervisorDashboardSkeleton pendant chargement');

    console.log('\n🎉 Test de performance terminé!');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testPerformanceOptimizations();
