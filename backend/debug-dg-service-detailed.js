const mongoose = require('mongoose');

async function debugDGServiceDetailed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 === TEST SERVICE DG DÉTAILLÉ ===\n');
    
    const dgId = '0fcffdc9-fd0d-4d23-a579-d4548cbb9117';
    
    // 1. Récupérer tous les workflows du DG
    const dgWorkflows = await db.collection('correspondenceworkflows').find({
      directeurGeneral: dgId
    }).toArray();
    
    console.log(`📋 Workflows assignés au DG: ${dgWorkflows.length}\n`);
    
    dgWorkflows.forEach((w, index) => {
      console.log(`${index + 1}. Workflow ${w._id}`);
      console.log(`   - Correspondance: ${w.correspondanceId}`);
      console.log(`   - Status: ${w.currentStatus}`);
      console.log(`   - Créé: ${w.createdAt}`);
      console.log(`   - Modifié: ${w.updatedAt}`);
      console.log('');
    });
    
    // 2. Appliquer la logique du service DG
    console.log('🔍 === LOGIQUE SERVICE DG ===\n');
    
    const pendingWorkflows = dgWorkflows.filter(workflow => {
      const needsDGVisibility = [
        'DIRECTOR_DRAFT',
        'DIRECTOR_REVISION', 
        'DG_REVIEW'
      ].includes(workflow.currentStatus);
      
      console.log(`Workflow ${workflow._id}:`);
      console.log(`   - Status: ${workflow.currentStatus}`);
      console.log(`   - DG doit voir: ${needsDGVisibility}`);
      
      return needsDGVisibility;
    });
    
    console.log(`\n📊 Workflows que le DG devrait voir: ${pendingWorkflows.length}\n`);
    
    // 3. Vérifier les correspondances liées
    console.log('📝 === CORRESPONDANCES LIÉES ===\n');
    
    for (const workflow of pendingWorkflows) {
      const correspondance = await db.collection('correspondances').findOne({
        _id: workflow.correspondanceId
      });
      
      if (correspondance) {
        console.log(`Correspondance "${correspondance.objet || correspondance.subject}":`);
        console.log(`   - Workflow Status: ${correspondance.workflowStatus}`);
        console.log(`   - Response Drafts: ${correspondance.responseDrafts?.length || 0}`);
        
        if (correspondance.responseDrafts?.length > 0) {
          correspondance.responseDrafts.forEach((draft, dIndex) => {
            console.log(`     Draft ${dIndex + 1}: ${draft.status} (${draft.createdAt})`);
          });
        }
        console.log('');
      }
    }
    
    // 4. Vérifier si les statuts correspondent
    console.log('⚠️ === INCOHÉRENCES DÉTECTÉES ===\n');
    
    for (const workflow of dgWorkflows) {
      const correspondance = await db.collection('correspondances').findOne({
        _id: workflow.correspondanceId
      });
      
      if (correspondance) {
        const workflowStatus = workflow.currentStatus;
        const correspondanceStatus = correspondance.workflowStatus;
        
        if (workflowStatus !== correspondanceStatus) {
          console.log(`❌ Incohérence pour "${correspondance.objet || correspondance.subject}":`);
          console.log(`   - Workflow status: ${workflowStatus}`);
          console.log(`   - Correspondance status: ${correspondanceStatus}`);
          console.log('');
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugDGServiceDetailed();
