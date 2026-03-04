const mongoose = require('mongoose');

async function debugChatMessages() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('💬 === DIAGNOSTIC MESSAGES CHAT ===\n');
    
    // 1. Trouver tous les workflows
    const workflows = await db.collection('correspondenceworkflows').find({}).sort({ createdAt: -1 }).toArray();
    
    console.log(`📋 Total workflows: ${workflows.length}\n`);
    
    for (const workflow of workflows) {
      console.log(`🔄 Workflow ${workflow._id}:`);
      console.log(`   - Correspondance: ${workflow.correspondanceId}`);
      console.log(`   - Status: ${workflow.currentStatus}`);
      console.log(`   - DG: ${workflow.directeurGeneral}`);
      console.log(`   - Directeur: ${workflow.assignedDirector}`);
      
      // 2. Chercher les messages de chat pour ce workflow
      const chatMessages = await db.collection('workflowchatmessages').find({
        workflowId: workflow._id
      }).sort({ createdAt: 1 }).toArray();
      
      console.log(`   - Messages chat: ${chatMessages.length}`);
      
      if (chatMessages.length > 0) {
        chatMessages.forEach((msg, index) => {
          console.log(`     Message ${index + 1}:`);
          console.log(`       - De: ${msg.senderName} (${msg.senderRole})`);
          console.log(`       - Contenu: "${msg.content.substring(0, 50)}..."`);
          console.log(`       - Date: ${msg.createdAt}`);
          console.log(`       - Attachements: ${msg.attachments?.length || 0}`);
        });
      }
      
      // 3. Vérifier la correspondance liée
      const correspondance = await db.collection('correspondances').findOne({
        _id: workflow.correspondanceId
      });
      
      if (correspondance) {
        console.log(`   - Correspondance: "${correspondance.objet || correspondance.subject}"`);
        console.log(`   - Response Drafts: ${correspondance.responseDrafts?.length || 0}`);
        
        if (correspondance.responseDrafts?.length > 0) {
          correspondance.responseDrafts.forEach((draft, dIndex) => {
            console.log(`     Draft ${dIndex + 1}:`);
            console.log(`       - Directeur: ${draft.directorName}`);
            console.log(`       - Status: ${draft.status}`);
            console.log(`       - Contenu: "${draft.responseContent?.substring(0, 50)}..."`);
            console.log(`       - Date: ${draft.createdAt}`);
          });
        }
      }
      
      console.log('');
    }
    
    // 4. Vérifier s'il y a des messages orphelins
    console.log('🔍 === MESSAGES ORPHELINS ===\n');
    
    const allChatMessages = await db.collection('workflowchatmessages').find({}).toArray();
    const workflowIds = workflows.map(w => w._id.toString());
    
    const orphanMessages = allChatMessages.filter(msg => 
      !workflowIds.includes(msg.workflowId?.toString())
    );
    
    if (orphanMessages.length > 0) {
      console.log(`❌ ${orphanMessages.length} message(s) orphelin(s) trouvé(s):`);
      orphanMessages.forEach((msg, index) => {
        console.log(`${index + 1}. WorkflowId: ${msg.workflowId} (inexistant)`);
        console.log(`   - De: ${msg.senderName}`);
        console.log(`   - Contenu: "${msg.content.substring(0, 50)}..."`);
      });
    } else {
      console.log('✅ Aucun message orphelin');
    }
    
    // 5. Vérifier les permissions d'accès pour le DG
    console.log('\n👑 === TEST ACCÈS DG ===\n');
    
    const dgId = '0fcffdc9-fd0d-4d23-a579-d4548cbb9117';
    const dgWorkflows = workflows.filter(w => w.directeurGeneral === dgId);
    
    console.log(`Workflows accessibles au DG: ${dgWorkflows.length}`);
    
    for (const workflow of dgWorkflows) {
      const chatMessages = await db.collection('workflowchatmessages').find({
        workflowId: workflow._id
      }).toArray();
      
      console.log(`Workflow ${workflow._id}: ${chatMessages.length} messages`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugChatMessages();
