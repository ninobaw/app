const mongoose = require('mongoose');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function listWorkflows() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('correspondenceworkflows');

    // Récupérer tous les workflows
    const workflows = await collection.find({}).sort({ createdAt: -1 }).limit(10).toArray();

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
      console.log('1. Démarrez le serveur frontend: npm run dev');
      console.log('2. Allez sur: http://localhost:5173/test-chat');
      console.log('3. Copiez un Workflow ID ci-dessus');
      console.log('4. Collez l\'ID dans le champ de test');
      console.log('5. Cliquez sur "Tester le Chat"');
      console.log('');
      console.log('💡 RECOMMANDÉ POUR LE TEST:');
      const workflowWithMessages = workflows.find(w => w.chatMessages && w.chatMessages.length > 0);
      if (workflowWithMessages) {
        console.log(`   🎯 Workflow avec messages: ${workflowWithMessages._id}`);
        console.log(`   💬 ${workflowWithMessages.chatMessages.length} messages disponibles`);
      } else {
        console.log(`   🎯 Premier workflow: ${workflows[0]._id}`);
      }
      
      console.log('\n🔧 POUR TESTER LES ROUTES API:');
      console.log(`   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/workflow-chat/${workflows[0]._id}/messages`);
    } else {
      console.log('❌ Aucun workflow trouvé');
      console.log('💡 Créez d\'abord des workflows avec les scripts de test');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

listWorkflows();
