const mongoose = require('mongoose');

async function debugDGChatDetailed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 === DIAGNOSTIC DÉTAILLÉ CHAT DG ===\n');
    
    const dgId = '0fcffdc9-fd0d-4d23-a579-d4548cbb9117';
    
    // 1. Vérifier les workflows du DG
    const dgWorkflows = await db.collection('correspondenceworkflows').find({
      directeurGeneral: dgId
    }).toArray();
    
    console.log(`👑 Workflows DG: ${dgWorkflows.length}\n`);
    
    for (const workflow of dgWorkflows) {
      console.log(`🔄 Workflow ${workflow._id}:`);
      console.log(`   - Status: ${workflow.currentStatus}`);
      console.log(`   - Correspondance: ${workflow.correspondanceId}`);
      
      // 2. Vérifier les messages de ce workflow
      const messages = await db.collection('workflowchatmessages').find({
        workflowId: workflow._id
      }).sort({ createdAt: 1 }).toArray();
      
      console.log(`   - Messages: ${messages.length}`);
      
      if (messages.length > 0) {
        messages.forEach((msg, index) => {
          console.log(`     ${index + 1}. ${msg.senderName} (${msg.senderRole}):`);
          console.log(`        - Type: ${msg.messageType || 'NORMAL'}`);
          console.log(`        - Contenu: "${msg.content.substring(0, 100)}..."`);
          console.log(`        - Date: ${msg.createdAt}`);
          console.log(`        - WorkflowId: ${msg.workflowId}`);
        });
      }
      
      // 3. Vérifier la correspondance
      const correspondance = await db.collection('correspondances').findOne({
        _id: workflow.correspondanceId
      });
      
      if (correspondance) {
        console.log(`   - Correspondance: "${correspondance.objet || correspondance.subject}"`);
        console.log(`   - Drafts: ${correspondance.responseDrafts?.length || 0}`);
      }
      
      console.log('');
    }
    
    // 4. Test d'accès API simulé
    console.log('🌐 === TEST ACCÈS API SIMULÉ ===\n');
    
    // Simuler la logique de workflowChatRoutes.js
    for (const workflow of dgWorkflows) {
      console.log(`🔐 Test accès workflow ${workflow._id}:`);
      
      // Logique d'accès (même que dans workflowChatRoutes.js)
      const isDGWithAccess = workflow.directeurGeneral === dgId;
      
      console.log(`   - DG ID match: ${workflow.directeurGeneral} === ${dgId} = ${isDGWithAccess}`);
      console.log(`   - Status: ${workflow.currentStatus}`);
      
      const needsDGVisibility = [
        'DIRECTOR_DRAFT',
        'DIRECTOR_REVISION', 
        'DG_REVIEW'
      ].includes(workflow.currentStatus);
      
      console.log(`   - DG doit voir: ${needsDGVisibility}`);
      console.log(`   - Accès autorisé: ${isDGWithAccess && needsDGVisibility}`);
      
      if (isDGWithAccess && needsDGVisibility) {
        const messages = await db.collection('workflowchatmessages').find({
          workflowId: workflow._id
        }).toArray();
        
        console.log(`   - Messages récupérés: ${messages.length}`);
      }
      
      console.log('');
    }
    
    // 5. Vérifier les types ObjectId
    console.log('🔍 === VÉRIFICATION TYPES ID ===\n');
    
    for (const workflow of dgWorkflows) {
      console.log(`Workflow ${workflow._id}:`);
      console.log(`   - workflowId type: ${typeof workflow._id}`);
      console.log(`   - workflowId value: ${workflow._id}`);
      
      const messages = await db.collection('workflowchatmessages').find({
        workflowId: workflow._id
      }).toArray();
      
      if (messages.length > 0) {
        console.log(`   - Message workflowId type: ${typeof messages[0].workflowId}`);
        console.log(`   - Message workflowId value: ${messages[0].workflowId}`);
        console.log(`   - Match: ${messages[0].workflowId.toString() === workflow._id.toString()}`);
      }
      
      console.log('');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugDGChatDetailed();
