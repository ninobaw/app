const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function testChatPersistence() {
  try {
    console.log('🔧 [Test] Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ [Test] Connecté à MongoDB');

    // 1. Trouver le workflow de test existant
    console.log('\n🔍 [Test] Recherche du workflow de test...');
    const workflow = await CorrespondenceWorkflow.findOne()
      .populate('chatMessages.from', 'firstName lastName')
      .populate('chatMessages.to', 'firstName lastName');

    if (!workflow) {
      console.log('❌ [Test] Aucun workflow trouvé. Exécutez d\'abord create-test-workflow.js');
      return;
    }

    console.log(`📋 [Test] Workflow trouvé: ${workflow._id}`);
    console.log(`💬 [Test] Messages actuels: ${workflow.chatMessages.length}`);

    // 2. Afficher tous les messages existants
    if (workflow.chatMessages.length > 0) {
      console.log('\n📝 [Test] Messages existants:');
      workflow.chatMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. De: ${msg.from?.firstName || 'Unknown'} vers: ${msg.to?.firstName || 'Unknown'}`);
        console.log(`      Message: ${msg.message.substring(0, 50)}...`);
        console.log(`      Timestamp: ${msg.timestamp}`);
        console.log(`      ID: ${msg._id}`);
      });
    }

    // 3. Trouver deux utilisateurs pour le test
    const users = await User.find().limit(2);
    if (users.length < 2) {
      console.log('❌ [Test] Besoin d\'au moins 2 utilisateurs pour le test');
      return;
    }

    const fromUser = users[0];
    const toUser = users[1];

    console.log(`\n👥 [Test] Utilisateurs pour le test:`);
    console.log(`   De: ${fromUser.firstName} ${fromUser.lastName} (${fromUser._id})`);
    console.log(`   Vers: ${toUser.firstName} ${toUser.lastName} (${toUser._id})`);

    // 4. Test d'ajout de message
    console.log('\n💬 [Test] Test d\'ajout de message...');
    const testMessage = `Message de test - ${new Date().toISOString()}`;
    const messagesBefore = workflow.chatMessages.length;

    console.log(`📊 [Test] Messages avant ajout: ${messagesBefore}`);

    // Ajouter le message
    await workflow.addChatMessage(
      fromUser._id,
      toUser._id,
      testMessage,
      'Test Version',
      []
    );

    console.log(`📊 [Test] Messages après ajout (en mémoire): ${workflow.chatMessages.length}`);

    // 5. Vérification immédiate en base
    const reloadedWorkflow = await CorrespondenceWorkflow.findById(workflow._id);
    console.log(`📊 [Test] Messages après rechargement DB: ${reloadedWorkflow.chatMessages.length}`);

    // 6. Comparaison
    if (reloadedWorkflow.chatMessages.length === workflow.chatMessages.length) {
      console.log('✅ [Test] PERSISTANCE OK - Les messages sont correctement sauvegardés');
    } else {
      console.log('❌ [Test] PROBLÈME DE PERSISTANCE DÉTECTÉ!');
      console.log(`   - En mémoire: ${workflow.chatMessages.length}`);
      console.log(`   - En base: ${reloadedWorkflow.chatMessages.length}`);
    }

    // 7. Vérifier le dernier message ajouté
    const lastMessage = reloadedWorkflow.chatMessages[reloadedWorkflow.chatMessages.length - 1];
    if (lastMessage && lastMessage.message === testMessage) {
      console.log('✅ [Test] Le dernier message correspond au message de test');
      console.log(`   Message: ${lastMessage.message}`);
      console.log(`   De: ${lastMessage.from} vers: ${lastMessage.to}`);
    } else {
      console.log('❌ [Test] Le dernier message ne correspond pas au message de test');
    }

    // 8. Test de récupération avec populate
    console.log('\n🔄 [Test] Test de récupération avec populate...');
    const populatedWorkflow = await CorrespondenceWorkflow.findById(workflow._id)
      .populate('chatMessages.from', 'firstName lastName email role')
      .populate('chatMessages.to', 'firstName lastName email role');

    console.log(`📊 [Test] Messages avec populate: ${populatedWorkflow.chatMessages.length}`);
    
    if (populatedWorkflow.chatMessages.length > 0) {
      const lastPopulatedMessage = populatedWorkflow.chatMessages[populatedWorkflow.chatMessages.length - 1];
      console.log(`💬 [Test] Dernier message populé:`);
      console.log(`   De: ${lastPopulatedMessage.from?.firstName || 'Unknown'} ${lastPopulatedMessage.from?.lastName || ''}`);
      console.log(`   Vers: ${lastPopulatedMessage.to?.firstName || 'Unknown'} ${lastPopulatedMessage.to?.lastName || ''}`);
      console.log(`   Message: ${lastPopulatedMessage.message.substring(0, 50)}...`);
    }

    console.log('\n🎉 [Test] Test de persistance terminé');

  } catch (error) {
    console.error('❌ [Test] Erreur:', error);
  } finally {
    console.log('\n👋 [Test] Déconnexion de MongoDB');
    await mongoose.disconnect();
  }
}

// Exécuter le test
if (require.main === module) {
  testChatPersistence();
}

module.exports = { testChatPersistence };
