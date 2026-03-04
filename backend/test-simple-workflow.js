const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function testSimpleWorkflow() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // Tester la création d'un workflow simple
    console.log('\n🔄 Test création workflow simple...');
    
    // Générer un ObjectId unique pour le test
    const testCorrespondanceId = new mongoose.Types.ObjectId();
    console.log(`📝 ID correspondance test: ${testCorrespondanceId}`);
    
    // Vérifier s'il existe déjà un workflow pour cette correspondance
    const existingWorkflow = await CorrespondenceWorkflow.findOne({ correspondanceId: testCorrespondanceId });
    if (existingWorkflow) {
      console.log('🧹 Suppression workflow existant...');
      await CorrespondenceWorkflow.findByIdAndDelete(existingWorkflow._id);
    }
    
    const testWorkflow = new CorrespondenceWorkflow({
      correspondanceId: testCorrespondanceId,
      currentStatus: 'ASSIGNED_TO_DIRECTOR',
      createdBy: '507f1f77bcf86cd799439011',
      bureauOrdreAgent: '507f1f77bcf86cd799439011',
      superviseurBureauOrdre: '507f1f77bcf86cd799439011',
      assignedDirector: '507f1f77bcf86cd799439012',
      directeurGeneral: '507f1f77bcf86cd799439013',
      priority: 'HIGH',
      chatMessages: []
    });

    await testWorkflow.save();
    console.log(`✅ Workflow créé: ${testWorkflow._id}`);

    // Test ajout de message
    console.log('\n💬 Test ajout message...');
    await testWorkflow.addChatMessage(
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012',
      'Message de test',
      null,
      []
    );
    console.log('✅ Message ajouté');

    // Vérifier persistance
    const reloaded = await CorrespondenceWorkflow.findById(testWorkflow._id);
    console.log(`🔄 Messages en DB: ${reloaded.chatMessages.length}`);

    if (reloaded.chatMessages.length === 1) {
      console.log('✅ Persistance confirmée');
      console.log(`   Message: "${reloaded.chatMessages[0].message}"`);
    } else {
      console.log('❌ Problème de persistance');
    }

    // Nettoyer
    await CorrespondenceWorkflow.findByIdAndDelete(testWorkflow._id);
    console.log('🧹 Workflow de test supprimé');

    console.log('\n🎉 Test simple terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testSimpleWorkflow();
