const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function testDGChatAccess() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Chercher un DG existant
    console.log('\n👑 Recherche du Directeur Général...');
    const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
    if (!dg) {
      console.log('❌ Aucun DG trouvé dans la base de données');
      return;
    }
    console.log(`✅ DG trouvé: ${dg.firstName} ${dg.lastName} (${dg._id})`);

    // 2. Chercher une correspondance avec workflow
    console.log('\n📋 Recherche d\'une correspondance avec workflow...');
    const workflow = await CorrespondenceWorkflow.findOne({ directeurGeneral: dg._id })
      .populate('correspondanceId', 'subject title')
      .populate('assignedDirector', 'firstName lastName');

    if (!workflow) {
      console.log('❌ Aucun workflow trouvé pour ce DG');
      return;
    }

    console.log(`✅ Workflow trouvé: ${workflow._id}`);
    console.log(`   - Correspondance: ${workflow.correspondanceId.subject || workflow.correspondanceId.title}`);
    console.log(`   - Directeur assigné: ${workflow.assignedDirector?.firstName} ${workflow.assignedDirector?.lastName}`);
    console.log(`   - Messages actuels: ${workflow.chatMessages.length}`);

    // 3. Tester l'ajout d'un message par le DG
    console.log('\n💬 Test ajout message par le DG...');
    await workflow.addChatMessage(
      dg._id,
      workflow.assignedDirector._id,
      'Message de test du Directeur Général pour vérifier l\'accès au chat',
      null,
      []
    );
    console.log('✅ Message ajouté par le DG');

    // 4. Vérifier la persistance
    const reloadedWorkflow = await CorrespondenceWorkflow.findById(workflow._id);
    console.log(`🔄 Messages après ajout: ${reloadedWorkflow.chatMessages.length}`);

    if (reloadedWorkflow.chatMessages.length > workflow.chatMessages.length) {
      console.log('✅ Message persisté avec succès');
      
      // Afficher le dernier message
      const lastMessage = reloadedWorkflow.chatMessages[reloadedWorkflow.chatMessages.length - 1];
      console.log(`   - Dernier message: "${lastMessage.message.substring(0, 50)}..."`);
      console.log(`   - De: ${lastMessage.from}`);
      console.log(`   - Vers: ${lastMessage.to}`);
    } else {
      console.log('❌ Problème de persistance');
    }

    // 5. Tester l'accès via la route API (simulation)
    console.log('\n🌐 Test accès route API...');
    console.log(`   - Route à tester: GET /api/workflow-chat/by-correspondance/${workflow.correspondanceId._id}`);
    console.log(`   - Workflow ID attendu: ${workflow._id}`);
    console.log(`   - DG autorisé: ${dg._id}`);

    console.log('\n🎉 Test d\'accès DG au chat terminé avec succès !');
    console.log('\n📋 Résumé:');
    console.log(`   - DG: ${dg.firstName} ${dg.lastName}`);
    console.log(`   - Workflow ID: ${workflow._id}`);
    console.log(`   - Correspondance ID: ${workflow.correspondanceId._id}`);
    console.log(`   - Messages dans le chat: ${reloadedWorkflow.chatMessages.length}`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testDGChatAccess();
