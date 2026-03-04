const mongoose = require('mongoose');

async function fixWorkflowStatus() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔧 === CORRECTION STATUT WORKFLOW ===\n');
    
    // Trouver le workflow avec DIRECTOR_REVISION
    const workflow = await db.collection('correspondenceworkflows').findOne({
      currentStatus: 'DIRECTOR_REVISION'
    });
    
    if (!workflow) {
      console.log('❌ Aucun workflow avec DIRECTOR_REVISION trouvé');
      process.exit(1);
    }
    
    console.log(`📋 Workflow trouvé: ${workflow._id}`);
    console.log(`   - Status actuel: ${workflow.currentStatus}`);
    console.log(`   - DG: ${workflow.directeurGeneral}`);
    
    // Vérifier s'il y a des drafts
    const correspondance = await db.collection('correspondances').findOne({
      _id: workflow.correspondanceId
    });
    
    if (correspondance && correspondance.responseDrafts?.length > 0) {
      console.log(`   - Drafts trouvés: ${correspondance.responseDrafts.length}`);
      
      // Corriger le statut vers DIRECTOR_DRAFT
      const result = await db.collection('correspondenceworkflows').updateOne(
        { _id: workflow._id },
        { 
          $set: { 
            currentStatus: 'DIRECTOR_DRAFT',
            updatedAt: new Date()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log('✅ Statut corrigé vers DIRECTOR_DRAFT');
        
        // Aussi corriger la correspondance
        await db.collection('correspondances').updateOne(
          { _id: workflow.correspondanceId },
          { 
            $set: { 
              workflowStatus: 'DIRECTOR_DRAFT',
              updatedAt: new Date()
            }
          }
        );
        
        console.log('✅ Statut correspondance aussi corrigé');
      } else {
        console.log('❌ Échec de la correction');
      }
    } else {
      console.log('⚠️ Aucun draft trouvé - statut non modifié');
    }
    
    // Vérifier le résultat
    const updatedWorkflow = await db.collection('correspondenceworkflows').findOne({
      _id: workflow._id
    });
    
    console.log(`\n📊 Statut final: ${updatedWorkflow.currentStatus}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixWorkflowStatus();
