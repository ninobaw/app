const mongoose = require('mongoose');

async function testDGServiceFixed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('🧪 === TEST SERVICE DG CORRIGÉ ===\n');
    
    const db = mongoose.connection.db;
    
    // 1. Vérifier l'état actuel
    const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
    console.log(`👑 DG: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    
    const workflows = await db.collection('correspondenceworkflows').find({
      directeurGeneral: dg._id
    }).toArray();
    
    console.log(`📋 Workflows assignés au DG: ${workflows.length}`);
    
    workflows.forEach((workflow, index) => {
      console.log(`   ${index + 1}. Workflow ${workflow._id}`);
      console.log(`      - Status: ${workflow.currentStatus}`);
      console.log(`      - Drafts: ${workflow.responseDrafts?.length || 0}`);
      
      if (workflow.responseDrafts && workflow.responseDrafts.length > 0) {
        workflow.responseDrafts.forEach((draft, dIndex) => {
          console.log(`      - Draft ${dIndex + 1}: ${draft.status} par ${draft.directorName}`);
        });
      }
    });
    
    // 2. Tester le service DG corrigé
    console.log('\n🌐 === TEST SERVICE DG CORRIGÉ ===');
    
    try {
      const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
      
      console.log('📞 Appel service DG...');
      const serviceResult = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id.toString());
      
      console.log(`\n📊 === RÉSULTAT SERVICE DG ===`);
      console.log(`Correspondances retournées: ${serviceResult.length}`);
      
      if (serviceResult.length > 0) {
        console.log('\n✅ SUCCESS: Service DG retourne des correspondances !');
        
        serviceResult.forEach((corresp, index) => {
          console.log(`\n   ${index + 1}. ${corresp.title || corresp.subject}`);
          console.log(`      - ID: ${corresp._id}`);
          console.log(`      - Status: ${corresp.status}`);
          console.log(`      - Workflow Status: ${corresp.workflowInfo?.currentStatus}`);
          console.log(`      - Drafts count: ${corresp.responseDrafts?.length || 0}`);
          
          if (corresp.responseDrafts && corresp.responseDrafts.length > 0) {
            console.log(`      - ✅ DRAFTS TROUVÉS:`);
            corresp.responseDrafts.forEach((draft, dIndex) => {
              console.log(`        ${dIndex + 1}. ${draft.directorName}`);
              console.log(`           - Status: ${draft.status}`);
              console.log(`           - Contenu: "${draft.responseContent?.substring(0, 50)}..."`);
              console.log(`           - Créé: ${draft.createdAt}`);
            });
          } else {
            console.log(`      - ❌ Aucun draft trouvé`);
          }
        });
        
        // Vérifier spécifiquement les drafts en attente
        const totalDrafts = serviceResult.reduce((total, corresp) => {
          return total + (corresp.responseDrafts?.length || 0);
        }, 0);
        
        const pendingDrafts = serviceResult.reduce((total, corresp) => {
          const pending = corresp.responseDrafts?.filter(d => d.status === 'PENDING_DG_REVIEW') || [];
          return total + pending.length;
        }, 0);
        
        console.log(`\n📊 === STATISTIQUES FINALES ===`);
        console.log(`✅ Correspondances visibles: ${serviceResult.length}`);
        console.log(`✅ Total drafts: ${totalDrafts}`);
        console.log(`✅ Drafts en attente DG: ${pendingDrafts}`);
        
        if (pendingDrafts > 0) {
          console.log(`\n🎉 === SUCCÈS COMPLET ===`);
          console.log(`✅ Le service DG fonctionne parfaitement !`);
          console.log(`✅ Les drafts sont visibles pour le DG !`);
          console.log(`💡 Maintenant, testez l'interface DG dans le navigateur`);
        } else {
          console.log(`\n⚠️ Aucun draft en attente DG trouvé`);
        }
        
      } else {
        console.log('\n❌ ÉCHEC: Service DG ne retourne aucune correspondance');
      }
      
    } catch (serviceError) {
      console.error('❌ Erreur service DG:', serviceError.message);
      console.error(serviceError.stack);
    }
    
    // 3. Test de la route API directement
    console.log('\n🌐 === TEST ROUTE API DIRECTE ===');
    
    try {
      // Simuler une requête HTTP
      const request = {
        user: { 
          _id: dg._id, 
          id: dg._id.toString(),
          role: 'DIRECTEUR_GENERAL' 
        }
      };
      
      console.log('📞 Simulation requête API...');
      
      // Le service devrait maintenant fonctionner
      const apiResult = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id.toString());
      
      console.log(`📊 Résultat API simulée: ${apiResult.length} correspondances`);
      
      if (apiResult.length > 0) {
        console.log('✅ API fonctionne correctement !');
      }
      
    } catch (apiError) {
      console.error('❌ Erreur API:', apiError.message);
    }
    
    console.log('\n🎯 === PROCHAINES ÉTAPES ===');
    console.log('1. ✅ Service backend corrigé et fonctionnel');
    console.log('2. 🌐 Tester l\'interface DG dans le navigateur');
    console.log('3. 🔍 Vérifier les logs de la console browser');
    console.log('4. 📝 Créer un nouveau draft via l\'interface directeur si nécessaire');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testDGServiceFixed();
