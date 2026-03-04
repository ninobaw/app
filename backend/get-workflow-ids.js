const mongoose = require('mongoose');
const CorrespondenceWorkflow = require('./src/models/CorrespondenceWorkflow');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function getWorkflowIds() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les workflows avec leurs infos de base
    const workflows = await CorrespondenceWorkflow.find()
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`\n📋 WORKFLOWS DISPONIBLES (${workflows.length}):\n`);

    workflows.forEach((workflow, index) => {
      console.log(`${index + 1}. 🔧 Workflow ID: ${workflow._id}`);
      console.log(`   📄 Correspondance ID: ${workflow.correspondanceId}`);
      console.log(`   👑 DG ID: ${workflow.directeurGeneral || 'N/A'}`);
      console.log(`   👨‍💼 Directeur ID: ${workflow.assignedDirector || 'N/A'}`);
      console.log(`   📊 Status: ${workflow.currentStatus}`);
      console.log(`   💬 Messages: ${workflow.chatMessages?.length || 0}`);
      console.log('');
    });

    if (workflows.length > 0) {
      console.log('🎯 POUR TESTER LE CHAT:');
      console.log('1. Copiez un Workflow ID ci-dessus');
      console.log('2. Allez sur: http://localhost:5173/test-chat');
      console.log('3. Collez l\'ID dans le champ de test');
      console.log('4. Cliquez sur "Tester le Chat"');
      console.log('');
      console.log('💡 RECOMMANDÉ POUR LE TEST:');
      const workflowWithMessages = workflows.find(w => w.chatMessages && w.chatMessages.length > 0);
      if (workflowWithMessages) {
        console.log(`   🎯 Workflow avec messages: ${workflowWithMessages._id}`);
        console.log(`   💬 ${workflowWithMessages.chatMessages.length} messages disponibles`);
      } else {
        console.log(`   🎯 Premier workflow: ${workflows[0]._id}`);
      }
    } else {
      console.log('❌ Aucun workflow trouvé');
      console.log('💡 Exécutez d\'abord: node create-test-workflow.js');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

getWorkflowIds();
