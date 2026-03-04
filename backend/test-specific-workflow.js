const mongoose = require('mongoose');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function testSpecificWorkflow() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const workflowId = '68e38183fe924f68937b23e7';
    console.log(`\n🔍 Test du workflow spécifique: ${workflowId}`);

    const db = mongoose.connection.db;
    const collection = db.collection('correspondenceworkflows');

    // 1. Vérifier si le workflow existe
    const workflow = await collection.findOne({ _id: new mongoose.Types.ObjectId(workflowId) });
    
    if (!workflow) {
      console.log('❌ Workflow non trouvé');
      return;
    }

    console.log('✅ Workflow trouvé:');
    console.log(`   - ID: ${workflow._id}`);
    console.log(`   - Correspondance: ${workflow.correspondanceId}`);
    console.log(`   - Status: ${workflow.currentStatus}`);
    console.log(`   - DG: ${workflow.directeurGeneral}`);
    console.log(`   - Directeur: ${workflow.assignedDirector}`);
    console.log(`   - Messages: ${workflow.chatMessages?.length || 0}`);

    // 2. Vérifier les messages
    if (workflow.chatMessages && workflow.chatMessages.length > 0) {
      console.log('\n💬 Messages détaillés:');
      workflow.chatMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. De: ${msg.from} vers: ${msg.to}`);
        console.log(`      Message: "${msg.message?.substring(0, 50)}..."`);
        console.log(`      Timestamp: ${msg.timestamp}`);
        console.log(`      Attachments: ${msg.attachments?.length || 0}`);
      });
    }

    // 3. Vérifier les utilisateurs référencés
    console.log('\n👥 Vérification des utilisateurs:');
    const usersCollection = db.collection('users');
    
    if (workflow.directeurGeneral) {
      const dg = await usersCollection.findOne({ _id: workflow.directeurGeneral });
      console.log(`   DG: ${dg ? `${dg.firstName} ${dg.lastName}` : 'Non trouvé'}`);
    }
    
    if (workflow.assignedDirector) {
      const director = await usersCollection.findOne({ _id: workflow.assignedDirector });
      console.log(`   Directeur: ${director ? `${director.firstName} ${director.lastName}` : 'Non trouvé'}`);
    }

    // 4. Simuler la requête de la route
    console.log('\n🌐 Simulation de la route API:');
    console.log(`GET /api/workflow-chat/${workflowId}/messages`);
    
    // Vérifier les champs requis pour la route
    const requiredFields = ['_id', 'correspondanceId', 'currentStatus', 'chatMessages'];
    const missingFields = requiredFields.filter(field => !workflow[field]);
    
    if (missingFields.length > 0) {
      console.log(`❌ Champs manquants: ${missingFields.join(', ')}`);
    } else {
      console.log('✅ Tous les champs requis sont présents');
    }

    // 5. Vérifier la correspondance référencée
    console.log('\n📋 Vérification de la correspondance:');
    const correspondancesCollection = db.collection('correspondances');
    const correspondance = await correspondancesCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(workflow.correspondanceId) 
    });
    
    if (correspondance) {
      console.log(`✅ Correspondance trouvée: ${correspondance.subject || correspondance.title}`);
    } else {
      console.log('❌ Correspondance non trouvée - PROBLÈME POTENTIEL');
    }

    console.log('\n🎯 DIAGNOSTIC:');
    if (missingFields.length === 0 && correspondance) {
      console.log('✅ Le workflow semble correct');
      console.log('🔍 Le problème est probablement dans le code de la route backend');
    } else {
      console.log('❌ Problème détecté dans les données');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

testSpecificWorkflow();
