const mongoose = require('mongoose');

async function fixWorkflowStatusFinal() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔧 === CORRECTION FINALE STATUTS WORKFLOWS ===\n');
    
    const dgId = '0fcffdc9-fd0d-4d23-a579-d4548cbb9117';
    
    // 1. Trouver tous les workflows du DG
    const dgWorkflows = await db.collection('correspondenceworkflows').find({
      directeurGeneral: dgId
    }).toArray();
    
    console.log(`👑 Workflows DG: ${dgWorkflows.length}\n`);
    
    for (const workflow of dgWorkflows) {
      console.log(`🔄 Workflow ${workflow._id}:`);
      console.log(`   - Status actuel: ${workflow.currentStatus}`);
      
      // 2. Vérifier la correspondance
      const correspondance = await db.collection('correspondances').findOne({
        _id: workflow.correspondanceId
      });
      
      if (correspondance) {
        console.log(`   - Correspondance: "${correspondance.objet || correspondance.subject}"`);
        console.log(`   - Drafts: ${correspondance.responseDrafts?.length || 0}`);
        console.log(`   - Correspondance status: ${correspondance.workflowStatus}`);
        
        // 3. Si il y a des drafts mais le workflow n'est pas DIRECTOR_DRAFT
        if (correspondance.responseDrafts?.length > 0 && workflow.currentStatus !== 'DIRECTOR_DRAFT') {
          console.log(`   🔧 Correction nécessaire: ${workflow.currentStatus} → DIRECTOR_DRAFT`);
          
          // Corriger le workflow
          await db.collection('correspondenceworkflows').updateOne(
            { _id: workflow._id },
            { 
              $set: { 
                currentStatus: 'DIRECTOR_DRAFT',
                updatedAt: new Date()
              }
            }
          );
          
          // Corriger la correspondance
          await db.collection('correspondances').updateOne(
            { _id: correspondance._id },
            { 
              $set: { 
                workflowStatus: 'DIRECTOR_DRAFT',
                updatedAt: new Date()
              }
            }
          );
          
          console.log(`   ✅ Statuts corrigés vers DIRECTOR_DRAFT`);
        } else if (correspondance.responseDrafts?.length > 0) {
          console.log(`   ✅ Statut déjà correct`);
        } else {
          console.log(`   ⚠️ Pas de drafts - statut correct`);
        }
      }
      
      console.log('');
    }
    
    // 4. Vérification finale
    console.log('🎯 === VÉRIFICATION FINALE ===\n');
    
    const updatedWorkflows = await db.collection('correspondenceworkflows').find({
      directeurGeneral: dgId
    }).toArray();
    
    for (const workflow of updatedWorkflows) {
      const correspondance = await db.collection('correspondances').findOne({
        _id: workflow.correspondanceId
      });
      
      const needsDGVisibility = [
        'DIRECTOR_DRAFT',
        'DIRECTOR_REVISION', 
        'DG_REVIEW'
      ].includes(workflow.currentStatus);
      
      console.log(`📋 "${correspondance?.objet || correspondance?.subject}":`);
      console.log(`   - Status: ${workflow.currentStatus}`);
      console.log(`   - DG doit voir: ${needsDGVisibility ? '✅ OUI' : '❌ NON'}`);
      
      if (needsDGVisibility) {
        const messages = await db.collection('workflowchatmessages').find({
          workflowId: workflow._id
        }).toArray();
        
        console.log(`   - Messages chat: ${messages.length}`);
      }
      
      console.log('');
    }
    
    console.log('🚀 Maintenant testez:');
    console.log('1. Connectez-vous comme DG');
    console.log('2. Vous devriez voir les correspondances avec drafts');
    console.log('3. Les chats devraient afficher les propositions');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixWorkflowStatusFinal();
