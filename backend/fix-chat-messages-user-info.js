const mongoose = require('mongoose');

async function fixChatMessagesUserInfo() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔧 === CORRECTION INFORMATIONS UTILISATEUR CHAT ===\n');
    
    // 1. Récupérer tous les workflows avec des messages
    const workflows = await db.collection('correspondenceworkflows').find({
      'chatMessages.0': { $exists: true }
    }).toArray();
    
    console.log(`📋 Workflows avec messages trouvés: ${workflows.length}`);
    
    // 2. Récupérer tous les utilisateurs
    const users = await db.collection('users').find({}).toArray();
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = {
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        email: user.email
      };
    });
    
    console.log(`👥 Utilisateurs chargés: ${users.length}`);
    
    let totalMessagesUpdated = 0;
    
    // 3. Parcourir chaque workflow
    for (const workflow of workflows) {
      console.log(`\n🔄 Traitement workflow: ${workflow._id}`);
      console.log(`   Messages: ${workflow.chatMessages.length}`);
      
      let workflowUpdated = false;
      
      // 4. Mettre à jour chaque message
      workflow.chatMessages.forEach((message, index) => {
        const fromUser = userMap[message.from];
        const toUser = userMap[message.to];
        
        let messageUpdated = false;
        
        // Ajouter fromName et fromRole si manquants
        if (!message.fromName && fromUser) {
          message.fromName = fromUser.name;
          messageUpdated = true;
        }
        
        if (!message.fromRole && fromUser) {
          message.fromRole = fromUser.role;
          messageUpdated = true;
        }
        
        // Ajouter toName et toRole si manquants
        if (!message.toName && toUser) {
          message.toName = toUser.name;
          messageUpdated = true;
        }
        
        if (!message.toRole && toUser) {
          message.toRole = toUser.role;
          messageUpdated = true;
        }
        
        if (messageUpdated) {
          console.log(`   ✅ Message ${index + 1} mis à jour: ${fromUser?.name || 'Inconnu'} → ${toUser?.name || 'Inconnu'}`);
          workflowUpdated = true;
          totalMessagesUpdated++;
        }
      });
      
      // 5. Sauvegarder le workflow si modifié
      if (workflowUpdated) {
        await db.collection('correspondenceworkflows').updateOne(
          { _id: workflow._id },
          { $set: { chatMessages: workflow.chatMessages, updatedAt: new Date() } }
        );
        console.log(`   💾 Workflow sauvegardé`);
      } else {
        console.log(`   ⏭️ Aucune mise à jour nécessaire`);
      }
    }
    
    console.log(`\n🎉 === CORRECTION TERMINÉE ===`);
    console.log(`📊 Workflows traités: ${workflows.length}`);
    console.log(`📨 Messages mis à jour: ${totalMessagesUpdated}`);
    
    // 6. Vérification finale
    console.log(`\n🔍 === VÉRIFICATION FINALE ===`);
    const updatedWorkflows = await db.collection('correspondenceworkflows').find({
      'chatMessages.0': { $exists: true }
    }).toArray();
    
    let messagesWithUserInfo = 0;
    let totalMessages = 0;
    
    updatedWorkflows.forEach(workflow => {
      workflow.chatMessages.forEach(message => {
        totalMessages++;
        if (message.fromName && message.fromRole) {
          messagesWithUserInfo++;
        }
      });
    });
    
    console.log(`📊 Messages avec infos utilisateur: ${messagesWithUserInfo}/${totalMessages}`);
    console.log(`📈 Pourcentage: ${Math.round((messagesWithUserInfo / totalMessages) * 100)}%`);
    
    if (messagesWithUserInfo === totalMessages) {
      console.log('✅ Tous les messages ont maintenant les informations utilisateur !');
    } else {
      console.log('⚠️ Certains messages n\'ont pas pu être enrichis');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixChatMessagesUserInfo();
