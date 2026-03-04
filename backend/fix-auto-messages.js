const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

async function fixAutoMessages() {
  try {
    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB réussie');

    const correspondanceId = '68e80b66948741da98edd3b6';
    
    console.log('\n🔧 CORRECTION MESSAGES AUTO');
    console.log('=====================================');

    // Récupérer le workflow
    const workflow = await CorrespondenceWorkflow.findOne({ correspondanceId });
    
    if (!workflow) {
      console.log('❌ Workflow non trouvé');
      return;
    }

    console.log(`📋 Workflow trouvé: ${workflow._id}`);
    console.log(`   - Directeur assigné: ${workflow.assignedDirector}`);
    console.log(`   - Directeur général: ${workflow.directeurGeneral}`);
    console.log(`   - Messages: ${workflow.chatMessages.length}`);

    let messagesFixed = 0;
    
    // Corriger les messages avec destinataire "auto"
    for (let i = 0; i < workflow.chatMessages.length; i++) {
      const message = workflow.chatMessages[i];
      
      console.log(`\n💬 Message ${i + 1}:`);
      console.log(`   - De: ${message.from}`);
      console.log(`   - Vers: ${message.to}`);
      console.log(`   - Contenu: ${message.message.substring(0, 50)}...`);
      
      if (message.to === 'auto') {
        console.log(`   🔧 CORRECTION NÉCESSAIRE: Destinataire "auto" détecté`);
        
        // Déterminer le bon destinataire
        const isFromAssignedDirector = message.from === workflow.assignedDirector?.toString();
        const isFromDG = message.from === workflow.directeurGeneral?.toString();
        
        let newRecipient;
        if (isFromAssignedDirector) {
          // Message du directeur → vers DG
          newRecipient = workflow.directeurGeneral;
          console.log(`   → Message du directeur vers DG: ${newRecipient}`);
        } else if (isFromDG) {
          // Message du DG → vers directeur
          newRecipient = workflow.assignedDirector;
          console.log(`   → Message du DG vers directeur: ${newRecipient}`);
        } else {
          // Par défaut, vers DG
          newRecipient = workflow.directeurGeneral;
          console.log(`   → Message par défaut vers DG: ${newRecipient}`);
        }
        
        // Appliquer la correction
        workflow.chatMessages[i].to = newRecipient;
        messagesFixed++;
        console.log(`   ✅ Corrigé: ${message.to} → ${newRecipient}`);
      } else {
        console.log(`   ✅ Destinataire OK: ${message.to}`);
      }
    }

    if (messagesFixed > 0) {
      console.log(`\n💾 Sauvegarde des corrections...`);
      await workflow.save();
      console.log(`✅ ${messagesFixed} message(s) corrigé(s) et sauvegardé(s)`);
    } else {
      console.log(`\n✅ Aucune correction nécessaire`);
    }

    // Vérification finale
    console.log(`\n🔍 VÉRIFICATION FINALE:`);
    const updatedWorkflow = await CorrespondenceWorkflow.findOne({ correspondanceId });
    
    updatedWorkflow.chatMessages.forEach((msg, index) => {
      console.log(`   Message ${index + 1}: ${msg.from} → ${msg.to}`);
    });

    console.log(`\n🎯 RÉSUMÉ:`);
    console.log(`   - Messages total: ${updatedWorkflow.chatMessages.length}`);
    console.log(`   - Messages corrigés: ${messagesFixed}`);
    console.log(`   - Directeur assigné: ${updatedWorkflow.assignedDirector}`);
    console.log(`   - Directeur général: ${updatedWorkflow.directeurGeneral}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Déconnexion MongoDB');
  }
}

fixAutoMessages();
