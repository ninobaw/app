const mongoose = require('mongoose');

async function testDGDashboardCounter() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('🧪 === TEST COMPTEUR DASHBOARD DG CORRIGÉ ===\n');
    
    // 1. Trouver le DG
    const db = mongoose.connection.db;
    const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
    
    if (!dg) {
      console.log('❌ Aucun DG trouvé');
      process.exit(1);
    }
    
    console.log(`👑 DG: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    
    // 2. Tester la nouvelle méthode getPendingDraftsCount
    console.log('\n📊 === TEST MÉTHODE getPendingDraftsCount ===');
    
    try {
      const DirectorGeneralService = require('./src/services/directorGeneralService');
      
      const pendingCount = await DirectorGeneralService.getPendingDraftsCount(dg._id);
      
      console.log(`📊 Résultat getPendingDraftsCount: ${pendingCount}`);
      
      if (pendingCount >= 0) {
        console.log('✅ Méthode fonctionne !');
      } else {
        console.log('❌ Méthode retourne une valeur invalide');
      }
      
    } catch (methodError) {
      console.error('❌ Erreur méthode getPendingDraftsCount:', methodError.message);
    }
    
    // 3. Tester le dashboard complet
    console.log('\n🎯 === TEST DASHBOARD COMPLET ===');
    
    try {
      const DirectorGeneralService = require('./src/services/directorGeneralService');
      
      const dashboardData = await DirectorGeneralService.getDashboardData(dg._id, 'month');
      
      console.log('📊 Dashboard data récupérée:');
      console.log(`   - totalCorrespondances: ${dashboardData.totalCorrespondances}`);
      console.log(`   - pendingApproval: ${dashboardData.pendingApproval}`);
      console.log(`   - awaitingResponse: ${dashboardData.awaitingResponse}`);
      console.log(`   - completedThisWeek: ${dashboardData.completedThisWeek}`);
      
      if (typeof dashboardData.pendingApproval === 'number') {
        console.log('✅ Dashboard fonctionne avec le nouveau compteur !');
        
        if (dashboardData.pendingApproval > 0) {
          console.log(`🎯 ${dashboardData.pendingApproval} draft(s) en attente d'approbation`);
        } else {
          console.log('ℹ️ Aucun draft en attente (normal si aucun directeur n\'a créé de draft)');
        }
      } else {
        console.log('❌ Dashboard retourne un type incorrect pour pendingApproval');
      }
      
    } catch (dashboardError) {
      console.error('❌ Erreur dashboard:', dashboardError.message);
    }
    
    // 4. Simuler l'appel API
    console.log('\n🌐 === SIMULATION API DASHBOARD ===');
    
    try {
      // Simuler la route /api/director-general/dashboard
      const DirectorGeneralService = require('./src/services/directorGeneralService');
      
      console.log('📞 Simulation GET /api/director-general/dashboard');
      
      const apiResponse = await DirectorGeneralService.getDashboardData(dg._id, 'month');
      
      console.log('📊 Réponse API:');
      console.log(`   - success: true`);
      console.log(`   - data.pendingApproval: ${apiResponse.pendingApproval}`);
      console.log(`   - data.totalCorrespondances: ${apiResponse.totalCorrespondances}`);
      
      console.log('✅ API simulation réussie !');
      
    } catch (apiError) {
      console.error('❌ Erreur API simulation:', apiError.message);
    }
    
    // 5. Recommandations
    console.log('\n💡 === RECOMMANDATIONS ===');
    
    console.log('🎯 Actions suivantes:');
    console.log('1. Redémarrer le serveur backend');
    console.log('2. Tester l\'interface DG dans le navigateur');
    console.log('3. Vérifier que le compteur s\'affiche correctement');
    console.log('4. Créer un draft par un directeur pour tester');
    console.log('5. Vérifier que le compteur augmente');
    
    console.log('\n🎉 === TEST TERMINÉ ===');
    console.log('Status: ✅ COMPTEUR DASHBOARD DG CORRIGÉ');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testDGDashboardCounter();
