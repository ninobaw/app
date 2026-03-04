const mongoose = require('mongoose');

async function createChatMessagesFromDrafts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('💬 === CRÉATION MESSAGES CHAT DEPUIS DRAFTS ===\n');
    
    // 1. Trouver tous les workflows avec leurs correspondances
    const workflows = await db.collection('correspondenceworkflows').find({}).toArray();
    
    for (const workflow of workflows) {
      console.log(`🔄 Traitement workflow ${workflow._id}:`);
      
      // 2. Récupérer la correspondance liée
      const correspondance = await db.collection('correspondances').findOne({
        _id: workflow.correspondanceId
      });
      
      if (!correspondance) {
        console.log('   ❌ Correspondance non trouvée');
        continue;
      }
      
      console.log(`   📝 Correspondance: "${correspondance.objet || correspondance.subject}"`);
      console.log(`   📋 Response Drafts: ${correspondance.responseDrafts?.length || 0}`);
      
      // 3. Vérifier s'il y a déjà des messages de chat
      const existingMessages = await db.collection('workflowchatmessages').find({
        workflowId: workflow._id
      }).toArray();
      
      console.log(`   💬 Messages chat existants: ${existingMessages.length}`);
      
      // 4. Créer des messages pour chaque draft qui n'a pas encore de message
      if (correspondance.responseDrafts?.length > 0) {
        for (const [draftIndex, draft] of correspondance.responseDrafts.entries()) {
          console.log(`   📄 Draft ${draftIndex + 1} par ${draft.directorName}:`);
          
          // Vérifier si un message existe déjà pour ce draft
          const existingDraftMessage = existingMessages.find(msg => 
            msg.content.includes(draft.responseContent?.substring(0, 50)) ||
            msg.senderName === draft.directorName
          );
          
          if (existingDraftMessage) {
            console.log(`     ✅ Message déjà existant`);
            continue;
          }
          
          // Créer le message de chat pour ce draft
          const chatMessage = {
            workflowId: workflow._id,
            senderId: draft.directorId,
            senderName: draft.directorName,
            senderRole: 'DIRECTEUR',
            content: `📝 **Proposition de réponse**\n\n${draft.responseContent}${draft.comments ? `\n\n**Commentaires :** ${draft.comments}` : ''}`,
            attachments: draft.attachments || [],
            messageType: 'DRAFT_PROPOSAL',
            draftIndex: draftIndex,
            isRead: false,
            createdAt: draft.createdAt || new Date(),
            updatedAt: draft.updatedAt || new Date()
          };
          
          // Insérer le message
          await db.collection('workflowchatmessages').insertOne(chatMessage);
          console.log(`     ✅ Message créé pour le draft`);
        }
      }
      
      console.log('');
    }
    
    // 5. Vérification finale
    console.log('🔍 === VÉRIFICATION FINALE ===\n');
    
    const dgId = '0fcffdc9-fd0d-4d23-a579-d4548cbb9117';
    const dgWorkflows = workflows.filter(w => w.directeurGeneral === dgId);
    
    for (const workflow of dgWorkflows) {
      const chatMessages = await db.collection('workflowchatmessages').find({
        workflowId: workflow._id
      }).sort({ createdAt: 1 }).toArray();
      
      const correspondance = await db.collection('correspondances').findOne({
        _id: workflow.correspondanceId
      });
      
      console.log(`📋 Workflow "${correspondance?.objet || correspondance?.subject}":`);
      console.log(`   - Status: ${workflow.currentStatus}`);
      console.log(`   - Messages chat: ${chatMessages.length}`);
      
      if (chatMessages.length > 0) {
        chatMessages.forEach((msg, index) => {
          console.log(`     ${index + 1}. ${msg.senderName}: "${msg.content.substring(0, 50)}..."`);
        });
      }
      console.log('');
    }
    
    console.log('🎯 Maintenant testez:');
    console.log('1. Connectez-vous comme DG');
    console.log('2. Ouvrez le chat des correspondances');
    console.log('3. Vous devriez voir les propositions des directeurs');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createChatMessagesFromDrafts();
