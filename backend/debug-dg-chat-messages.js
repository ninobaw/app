const mongoose = require('mongoose');

async function debugDGChatMessages() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 === DIAGNOSTIC MESSAGES CHAT DG ===\n');
    
    // 1. Trouver le DG
    const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
    if (!dg) {
      console.log('❌ Aucun DIRECTEUR_GENERAL trouvé');
      process.exit(1);
    }
    
    console.log(`👤 DG trouvé: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    console.log(`📧 Email: ${dg.email}\n`);
    
    // 2. Trouver tous les workflows
    const workflows = await db.collection('correspondenceworkflows').find({}).toArray();
    console.log(`📋 Workflows trouvés: ${workflows.length}\n`);
    
    // 3. Analyser chaque workflow
    for (const workflow of workflows) {
      console.log(`🔄 Workflow ID: ${workflow._id}`);
      console.log(`   - Correspondance: ${workflow.correspondanceId}`);
      console.log(`   - Status: ${workflow.currentStatus}`);
      console.log(`   - Directeur assigné: ${workflow.assignedDirector}`);
      console.log(`   - DG: ${workflow.directeurGeneral}`);
      console.log(`   - Messages: ${workflow.chatMessages?.length || 0}`);
      
      // Vérifier si le DG est impliqué
      const isDGInvolved = workflow.directeurGeneral?.toString() === dg._id.toString();
      console.log(`   - DG impliqué: ${isDGInvolved ? '✅' : '❌'}`);
      
      if (workflow.chatMessages && workflow.chatMessages.length > 0) {
        console.log(`   📨 Messages détaillés:`);
        workflow.chatMessages.forEach((msg, index) => {
          console.log(`      ${index + 1}. De: ${msg.from} → Vers: ${msg.to}`);
          console.log(`         Message: "${msg.message.substring(0, 50)}..."`);
          console.log(`         Date: ${msg.timestamp}`);
          
          // Vérifier si le message est pour le DG
          const isForDG = msg.to?.toString() === dg._id.toString();
          const isFromDG = msg.from?.toString() === dg._id.toString();
          console.log(`         Pour DG: ${isForDG ? '✅' : '❌'} | Du DG: ${isFromDG ? '✅' : '✅'}`);
        });
      }
      console.log('');
    }
    
    // 4. Vérifier les correspondances avec drafts
    console.log('📝 === CORRESPONDANCES AVEC DRAFTS ===\n');
    
    const correspondancesWithDrafts = await db.collection('correspondances').find({
      'responseDrafts.0': { $exists: true }
    }).toArray();
    
    console.log(`📋 Correspondances avec drafts: ${correspondancesWithDrafts.length}\n`);
    
    for (const corr of correspondancesWithDrafts) {
      console.log(`📄 Correspondance: "${corr.objet || corr.subject}"`);
      console.log(`   - ID: ${corr._id}`);
      console.log(`   - Status: ${corr.workflowStatus}`);
      console.log(`   - Assignée à: ${corr.assignedTo}`);
      console.log(`   - Drafts: ${corr.responseDrafts?.length || 0}`);
      
      // Vérifier le workflow associé
      const associatedWorkflow = workflows.find(w => 
        w.correspondanceId?.toString() === corr._id.toString()
      );
      
      if (associatedWorkflow) {
        console.log(`   - Workflow trouvé: ${associatedWorkflow._id}`);
        console.log(`   - Messages dans workflow: ${associatedWorkflow.chatMessages?.length || 0}`);
        
        // Vérifier si le DG peut voir cette correspondance
        const canDGSee = associatedWorkflow.directeurGeneral?.toString() === dg._id.toString();
        console.log(`   - DG peut voir: ${canDGSee ? '✅' : '❌'}`);
        
        if (canDGSee && associatedWorkflow.chatMessages?.length > 0) {
          console.log(`   🎯 CETTE CORRESPONDANCE DEVRAIT ÊTRE VISIBLE AU DG!`);
        }
      } else {
        console.log(`   - ❌ Aucun workflow associé trouvé`);
      }
      console.log('');
    }
    
    // 5. Simuler la requête API du DG
    console.log('🔍 === SIMULATION REQUÊTE API DG ===\n');
    
    // Requête pour récupérer les correspondances en attente pour le DG
    const dgWorkflows = await db.collection('correspondenceworkflows').find({
      directeurGeneral: dg._id,
      currentStatus: { $in: ['DIRECTOR_DRAFT', 'DG_REVIEW'] }
    }).toArray();
    
    console.log(`📋 Workflows pour DG (statuts DIRECTOR_DRAFT/DG_REVIEW): ${dgWorkflows.length}`);
    
    if (dgWorkflows.length > 0) {
      for (const workflow of dgWorkflows) {
        console.log(`\n🔄 Workflow ${workflow._id}:`);
        console.log(`   - Status: ${workflow.currentStatus}`);
        console.log(`   - Messages: ${workflow.chatMessages?.length || 0}`);
        
        // Récupérer la correspondance associée
        const corr = await db.collection('correspondances').findOne({
          _id: workflow.correspondanceId
        });
        
        if (corr) {
          console.log(`   - Correspondance: "${corr.objet || corr.subject}"`);
          console.log(`   - Drafts: ${corr.responseDrafts?.length || 0}`);
          
          if (workflow.chatMessages?.length > 0) {
            console.log(`   📨 Messages pour le DG:`);
            const messagesForDG = workflow.chatMessages.filter(msg => 
              msg.to?.toString() === dg._id.toString()
            );
            console.log(`      Messages reçus: ${messagesForDG.length}`);
            
            messagesForDG.forEach((msg, index) => {
              console.log(`      ${index + 1}. "${msg.message.substring(0, 50)}..."`);
              console.log(`         De: ${msg.from} à ${msg.timestamp}`);
            });
          }
        }
      }
    } else {
      console.log('❌ Aucun workflow trouvé pour le DG avec les statuts appropriés');
      
      // Vérifier tous les workflows où le DG est impliqué
      const allDGWorkflows = await db.collection('correspondenceworkflows').find({
        directeurGeneral: dg._id
      }).toArray();
      
      console.log(`\n📋 Tous les workflows où le DG est impliqué: ${allDGWorkflows.length}`);
      
      allDGWorkflows.forEach(workflow => {
        console.log(`   - ${workflow._id}: ${workflow.currentStatus} (Messages: ${workflow.chatMessages?.length || 0})`);
      });
    }
    
    console.log('\n🎯 === RÉSUMÉ ===');
    console.log(`👤 DG: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    console.log(`📋 Total workflows: ${workflows.length}`);
    console.log(`📨 Workflows avec messages: ${workflows.filter(w => w.chatMessages?.length > 0).length}`);
    console.log(`🎯 Workflows pour DG: ${dgWorkflows.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugDGChatMessages();
