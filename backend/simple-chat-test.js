const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function simpleChatTest() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Trouver un workflow existant
    console.log('\n🔍 Recherche d\'un workflow existant...');
    const workflow = await CorrespondenceWorkflow.findOne()
      .populate('directeurGeneral', 'firstName lastName')
      .populate('assignedDirector', 'firstName lastName');

    if (!workflow) {
      console.log('❌ Aucun workflow trouvé');
      return;
    }

    console.log(`✅ Workflow trouvé: ${workflow._id}`);
    console.log(`   - DG: ${workflow.directeurGeneral?.firstName} ${workflow.directeurGeneral?.lastName}`);
    console.log(`   - Directeur: ${workflow.assignedDirector?.firstName} ${workflow.assignedDirector?.lastName}`);
    console.log(`   - Messages actuels: ${workflow.chatMessages?.length || 0}`);

    // 2. Ajouter un message de test
    console.log('\n💬 Ajout d\'un message de test...');
    const testMessage = `Message de test - ${new Date().toISOString()}`;
    
    await workflow.addChatMessage(
      workflow.directeurGeneral._id,
      workflow.assignedDirector._id,
      testMessage,
      null,
      []
    );

    console.log('✅ Message ajouté');

    // 3. Vérifier la persistance
    const reloaded = await CorrespondenceWorkflow.findById(workflow._id);
    console.log(`🔄 Messages après reload: ${reloaded.chatMessages?.length || 0}`);

    if (reloaded.chatMessages && reloaded.chatMessages.length > 0) {
      const lastMessage = reloaded.chatMessages[reloaded.chatMessages.length - 1];
      console.log(`📝 Dernier message: "${lastMessage.message.substring(0, 50)}..."`);
    }

    // 4. Tester les routes
    console.log('\n🌐 URLs de test:');
    console.log(`   - Workflow par correspondance: GET /api/workflow-chat/by-correspondance/${workflow.correspondanceId}`);
    console.log(`   - Messages: GET /api/workflow-chat/${workflow._id}/messages`);

    console.log('\n✅ Test terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

simpleChatTest();
