const mongoose = require('mongoose');

async function testDGQuick() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('⚡ === TEST RAPIDE SERVICE DG ===\n');
    
    const db = mongoose.connection.db;
    const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
    
    console.log('🔍 Test direct service DG...');
    
    const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
    const result = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id.toString());
    
    console.log(`\n📊 RÉSULTAT: ${result.length} correspondances`);
    
    if (result.length > 0) {
      const corresp = result[0];
      console.log(`✅ Correspondance: ${corresp.title}`);
      console.log(`📝 Drafts: ${corresp.responseDrafts?.length || 0}`);
      
      if (corresp.responseDrafts && corresp.responseDrafts.length > 0) {
        console.log('🎉 SUCCESS: DRAFTS TROUVÉS !');
        corresp.responseDrafts.forEach((draft, index) => {
          console.log(`   ${index + 1}. ${draft.directorName} - ${draft.status}`);
        });
      } else {
        console.log('❌ Aucun draft trouvé');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testDGQuick();
