const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function testChatPermissions() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n🧪 TEST PERMISSIONS CHAT');
    console.log('========================');

    // 1. Trouver un workflow de test
    const workflow = await CorrespondenceWorkflow.findOne()
      .populate('directeurGeneral', 'firstName lastName email role')
      .populate('assignedDirector', 'firstName lastName email role');

    if (!workflow) {
      console.log('❌ Aucun workflow trouvé');
      return;
    }

    console.log(`\n🔄 Workflow de test: ${workflow._id}`);
    console.log(`   - DG: ${workflow.directeurGeneral?.firstName} ${workflow.directeurGeneral?.lastName}`);
    console.log(`   - Directeur: ${workflow.assignedDirector?.firstName} ${workflow.assignedDirector?.lastName}`);

    // 2. Tester les permissions pour différents utilisateurs
    const testUsers = await User.find({
      role: { $in: ['DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR', 'SUPERVISEUR_BUREAU_ORDRE', 'SUPER_ADMIN'] }
    }).limit(5);

    console.log('\n🔐 TEST PERMISSIONS PAR UTILISATEUR:');

    for (const user of testUsers) {
      console.log(`\n👤 ${user.firstName} ${user.lastName} (${user.role})`);
      
      // Simuler la logique de vérification d'accès du backend
      const hasAccess = (
        workflow.assignedDirector?.toString() === user._id.toString() ||
        workflow.directeurGeneral?.toString() === user._id.toString() ||
        user.role === 'SUPERVISEUR_BUREAU_ORDRE' ||
        user.role === 'SUPER_ADMIN'
      );

      console.log(`   - Accès au workflow: ${hasAccess ? '✅ OUI' : '❌ NON'}`);
      
      if (hasAccess) {
        console.log(`   - Peut lire les messages: ✅ OUI`);
        console.log(`   - Peut envoyer des messages: ✅ OUI`);
        console.log(`   - Peut ajouter des attachements: ✅ OUI`);
      } else {
        console.log(`   - Peut lire les messages: ❌ NON`);
        console.log(`   - Peut envoyer des messages: ❌ NON`);
        console.log(`   - Peut ajouter des attachements: ❌ NON`);
      }
    }

    // 3. Tester l'ajout d'un message
    console.log('\n💬 TEST AJOUT MESSAGE:');
    
    const testUser = workflow.directeurGeneral || workflow.assignedDirector;
    if (testUser) {
      console.log(`\n📝 Test avec: ${testUser.firstName} ${testUser.lastName}`);
      
      try {
        const testMessage = `Message de test - ${new Date().toISOString()}`;
        const toUser = workflow.assignedDirector || workflow.directeurGeneral;
        
        await workflow.addChatMessage(
          testUser._id,
          toUser._id,
          testMessage,
          null,
          []
        );
        
        console.log('✅ Message ajouté avec succès');
        console.log(`   - Contenu: "${testMessage}"`);
        console.log(`   - De: ${testUser._id}`);
        console.log(`   - Vers: ${toUser._id}`);
        
        // Vérifier que le message a été sauvegardé
        const updatedWorkflow = await CorrespondenceWorkflow.findById(workflow._id);
        const lastMessage = updatedWorkflow.chatMessages[updatedWorkflow.chatMessages.length - 1];
        
        if (lastMessage && lastMessage.message === testMessage) {
          console.log('✅ Message persisté en base de données');
        } else {
          console.log('❌ Message non persisté en base de données');
        }
        
      } catch (error) {
        console.log('❌ Erreur ajout message:', error.message);
      }
    }

    // 4. Vérifier la route API
    console.log('\n🌐 VÉRIFICATION ROUTE API:');
    console.log('Route: POST /api/workflow-chat/:workflowId/send-message');
    console.log(`URL de test: POST /api/workflow-chat/${workflow._id}/send-message`);
    console.log('Headers requis:');
    console.log('   - Authorization: Bearer <JWT_TOKEN>');
    console.log('   - Content-Type: multipart/form-data');
    console.log('Body requis:');
    console.log('   - message: "Votre message"');
    console.log('   - toUserId: "ID_destinataire" (optionnel)');

    // 5. Vérifier la route de récupération des messages
    console.log('\n📥 VÉRIFICATION ROUTE RÉCUPÉRATION:');
    console.log('Route: GET /api/workflow-chat/:workflowId/messages');
    console.log(`URL de test: GET /api/workflow-chat/${workflow._id}/messages`);
    console.log('Headers requis:');
    console.log('   - Authorization: Bearer <JWT_TOKEN>');

    // 6. Instructions de debug frontend
    console.log('\n🔧 DEBUG FRONTEND:');
    console.log('1. Ouvrez la console du navigateur (F12)');
    console.log('2. Allez dans l\'onglet Network');
    console.log('3. Essayez d\'envoyer un message');
    console.log('4. Vérifiez les requêtes HTTP:');
    console.log('   - GET /api/workflow-chat/:id/messages → Doit retourner 200');
    console.log('   - POST /api/workflow-chat/:id/send-message → Doit retourner 200');
    console.log('5. Si erreur 401: Problème d\'authentification');
    console.log('6. Si erreur 403: Problème de permissions');
    console.log('7. Si erreur 404: Workflow non trouvé');
    console.log('8. Si erreur 500: Problème serveur');

    // 7. Vérifier l'état du composant
    console.log('\n🎯 VÉRIFICATIONS COMPOSANT FRONTEND:');
    console.log('1. Vérifiez que workflowId est défini');
    console.log('2. Vérifiez que user est connecté (useAuth)');
    console.log('3. Vérifiez que loading passe à false');
    console.log('4. Vérifiez que la zone de saisie n\'est pas disabled');
    console.log('5. Vérifiez que handleSendMessage est appelé');

    console.log('\n✅ TEST TERMINÉ');

  } catch (error) {
    console.error('❌ Erreur test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

testChatPermissions();
