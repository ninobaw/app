const mongoose = require('mongoose');

async function fixWorkflowStatusForDG() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔧 === CORRECTION STATUT WORKFLOW POUR DG ===\n');
    
    // 1. Trouver le workflow avec des messages
    const workflowId = '68e80b66948741da98edd3bf';
    const workflow = await db.collection('correspondenceworkflows').findOne({
      _id: new mongoose.Types.ObjectId(workflowId)
    });
    
    if (!workflow) {
      console.log('❌ Workflow non trouvé');
      process.exit(1);
    }
    
    console.log(`🔄 Workflow trouvé: ${workflow._id}`);
    console.log(`   - Status actuel: ${workflow.currentStatus}`);
    console.log(`   - Messages: ${workflow.chatMessages?.length || 0}`);
    console.log(`   - Correspondance: ${workflow.correspondanceId}`);
    
    // 2. Vérifier s'il y a des messages du directeur vers le DG
    const messagesFromDirector = workflow.chatMessages?.filter(msg => 
      msg.from?.toString() === workflow.assignedDirector?.toString() &&
      msg.to?.toString() === workflow.directeurGeneral?.toString()
    ) || [];
    
    console.log(`\n📨 Messages du directeur vers DG: ${messagesFromDirector.length}`);
    
    if (messagesFromDirector.length > 0) {
      console.log('🎯 Il y a des messages du directeur → Le statut devrait être DIRECTOR_DRAFT');
      
      // 3. Mettre à jour le statut du workflow
      const newStatus = 'DIRECTOR_DRAFT';
      
      await db.collection('correspondenceworkflows').updateOne(
        { _id: workflow._id },
        { 
          $set: { 
            currentStatus: newStatus,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`✅ Statut workflow mis à jour: ${workflow.currentStatus} → ${newStatus}`);
      
      // 4. Mettre à jour aussi la correspondance
      await db.collection('correspondances').updateOne(
        { _id: workflow.correspondanceId },
        { 
          $set: { 
            workflowStatus: newStatus,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`✅ Statut correspondance mis à jour vers: ${newStatus}`);
      
      // 5. Vérification finale
      const updatedWorkflow = await db.collection('correspondenceworkflows').findOne({
        _id: workflow._id
      });
      
      console.log(`\n🔍 Vérification finale:`);
      console.log(`   - Nouveau statut workflow: ${updatedWorkflow.currentStatus}`);
      
      // 6. Test de la requête DG
      console.log(`\n🧪 Test requête DG après correction:`);
      
      const dgWorkflows = await db.collection('correspondenceworkflows').find({
        directeurGeneral: workflow.directeurGeneral,
        currentStatus: { $in: ['DIRECTOR_DRAFT', 'DG_REVIEW'] }
      }).toArray();
      
      console.log(`📋 Workflows visibles pour DG: ${dgWorkflows.length}`);
      
      if (dgWorkflows.length > 0) {
        dgWorkflows.forEach(wf => {
          console.log(`   - ${wf._id}: ${wf.currentStatus} (Messages: ${wf.chatMessages?.length || 0})`);
        });
        
        console.log('\n🎉 SUCCÈS! Le DG devrait maintenant voir les messages.');
      } else {
        console.log('\n❌ Problème: Le DG ne voit toujours pas les workflows');
      }
      
    } else {
      console.log('❌ Aucun message du directeur vers le DG trouvé');
    }
    
    console.log('\n🎯 === INSTRUCTIONS ===');
    console.log('1. Connectez-vous comme DG (melanie@tav.aero)');
    console.log('2. Allez dans la section correspondances');
    console.log('3. Vous devriez maintenant voir la correspondance avec les messages');
    console.log('4. Les messages du sous-directeur devraient être visibles');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixWorkflowStatusForDG();
