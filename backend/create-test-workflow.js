const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const Correspondance = require('./src/models/Correspondance');
const User = require('./src/models/User');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function createTestWorkflow() {
  try {
    console.log('🔧 [Test] Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ [Test] Connecté à MongoDB');

    // 1. Trouver ou créer une correspondance de test
    console.log('\n📧 [Test] Recherche/création d\'une correspondance de test...');
    
    let correspondance = await Correspondance.findOne({ subject: { $regex: /test.*workflow/i } });
    
    // Trouver un utilisateur pour être l'auteur
    const anyUser = await User.findOne();
    if (!anyUser) {
      console.log('❌ [Test] Aucun utilisateur trouvé. Créez au moins un utilisateur dans le système.');
      return;
    }
    
    if (!correspondance) {
      // Créer une correspondance de test
      correspondance = new Correspondance({
        title: 'Test Workflow Chat',
        subject: 'Test Workflow - Correspondance pour tester le chat',
        content: 'Ceci est une correspondance de test pour valider le système de chat du workflow.\n\nContenu de test pour les échanges entre directeur et DG.',
        type: 'INCOMING',
        from_address: 'test@example.com',
        to_address: 'aerodoc@enfidha.aero',
        priority: 'MEDIUM',
        airport: 'ENFIDHA',
        status: 'PENDING',
        authorId: anyUser._id, // Champ obligatoire
        personnesConcernees: [],
        tags: ['test', 'workflow', 'chat']
      });
      
      await correspondance.save();
      console.log(`✅ [Test] Correspondance de test créée: ${correspondance._id}`);
    } else {
      console.log(`ℹ️ [Test] Correspondance de test existante trouvée: ${correspondance._id}`);
    }

    // 2. Trouver des utilisateurs pour le test
    console.log('\n👥 [Test] Recherche des utilisateurs...');
    
    const directeur = await User.findOne({ role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] } });
    const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
    const superviseur = await User.findOne({ role: 'SUPERVISEUR_BUREAU_ORDRE' });
    
    if (!directeur) {
      console.log('❌ [Test] Aucun directeur trouvé. Créez un utilisateur avec le rôle DIRECTEUR ou SOUS_DIRECTEUR');
      return;
    }
    
    if (!dg) {
      console.log('❌ [Test] Aucun DG trouvé. Créez un utilisateur avec le rôle DIRECTEUR_GENERAL');
      return;
    }
    
    console.log(`👤 [Test] Directeur: ${directeur.firstName} ${directeur.lastName} (${directeur.role})`);
    console.log(`👤 [Test] DG: ${dg.firstName} ${dg.lastName} (${dg.role})`);
    if (superviseur) {
      console.log(`👤 [Test] Superviseur: ${superviseur.firstName} ${superviseur.lastName} (${superviseur.role})`);
    }

    // 3. Créer ou trouver le workflow
    console.log('\n🔄 [Test] Création/recherche du workflow...');
    
    let workflow = await CorrespondenceWorkflow.findOne({ correspondanceId: correspondance._id });
    
    if (!workflow) {
      workflow = new CorrespondenceWorkflow({
        correspondanceId: correspondance._id,
        currentStatus: 'ASSIGNED_TO_DIRECTOR',
        createdBy: superviseur?._id || directeur._id,
        bureauOrdreAgent: superviseur?._id || directeur._id,
        superviseurBureauOrdre: superviseur?._id,
        assignedDirector: directeur._id,
        directeurGeneral: dg._id,
        chatMessages: [],
        draftVersions: [],
        actions: [],
        currentDraftVersion: 0,
        priority: 'MEDIUM',
        tags: ['test', 'workflow'],
        isActive: true
      });
      
      await workflow.save();
      console.log(`✅ [Test] Workflow créé: ${workflow._id}`);
    } else {
      console.log(`ℹ️ [Test] Workflow existant trouvé: ${workflow._id}`);
    }

    // 4. Ajouter des messages de test au chat
    console.log('\n💬 [Test] Ajout de messages de test...');
    
    // Message 1: Directeur soumet proposition
    await workflow.addChatMessage(
      directeur._id,
      dg._id,
      'Proposition de réponse soumise:\n\nMonsieur/Madame,\n\nSuite à votre correspondance, nous avons l\'honneur de vous informer que...\n\nVeuillez agréer nos salutations distinguées.',
      'Proposition initiale',
      []
    );
    console.log('✅ [Test] Message 1 ajouté: Proposition du directeur');

    // Message 2: DG demande révision
    await workflow.addChatMessage(
      dg._id,
      directeur._id,
      '🔄 Demande de révision:\n\nLa proposition est globalement correcte mais nécessite quelques ajustements:\n\n- Préciser les délais\n- Ajouter les références réglementaires\n- Revoir le ton pour qu\'il soit plus formel',
      'Feedback DG - REQUEST_REVISION',
      []
    );
    console.log('✅ [Test] Message 2 ajouté: Feedback DG');

    // Message 3: Directeur révise
    await workflow.addChatMessage(
      directeur._id,
      dg._id,
      'Proposition révisée (Version 2):\n\nMonsieur/Madame,\n\nSuite à votre correspondance du [date], nous avons l\'honneur de vous informer que votre demande sera traitée dans un délai de 15 jours ouvrables conformément à l\'article X du règlement Y.\n\nVeuillez agréer, Monsieur/Madame, l\'expression de nos salutations distinguées.',
      'Révision Version 2',
      []
    );
    console.log('✅ [Test] Message 3 ajouté: Révision du directeur');

    // Message 4: DG approuve
    await workflow.addChatMessage(
      dg._id,
      directeur._id,
      '✅ Proposition approuvée !\n\nParfait, cette version est conforme à nos standards. Vous pouvez procéder à la finalisation.',
      'Feedback DG - APPROVE',
      []
    );
    console.log('✅ [Test] Message 4 ajouté: Approbation DG');

    // 5. Vérifier que les messages sont sauvegardés
    const updatedWorkflow = await CorrespondenceWorkflow.findById(workflow._id)
      .populate('chatMessages.from', 'firstName lastName role')
      .populate('chatMessages.to', 'firstName lastName role');
    
    console.log(`\n📊 [Test] Vérification finale:`);
    console.log(`   - Workflow ID: ${updatedWorkflow._id}`);
    console.log(`   - Correspondance ID: ${updatedWorkflow.correspondanceId}`);
    console.log(`   - Messages de chat: ${updatedWorkflow.chatMessages.length}`);
    console.log(`   - Statut: ${updatedWorkflow.currentStatus}`);
    
    if (updatedWorkflow.chatMessages.length > 0) {
      console.log(`\n💬 [Test] Messages dans le workflow:`);
      updatedWorkflow.chatMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. De: ${msg.from?.firstName || 'Unknown'} vers: ${msg.to?.firstName || 'Unknown'}`);
        console.log(`      Message: ${msg.message.substring(0, 80)}...`);
        console.log(`      Version: ${msg.draftVersion}`);
        console.log(`      Timestamp: ${msg.timestamp}`);
        console.log('');
      });
    }

    console.log('\n🎉 [Test] Workflow de test créé avec succès !');
    console.log('\n📋 [Test] INFORMATIONS POUR LES TESTS:');
    console.log(`   - Workflow ID: ${workflow._id}`);
    console.log(`   - Correspondance ID: ${correspondance._id}`);
    console.log(`   - URL Chat: /api/workflow-chat/${workflow._id}/messages`);
    console.log('\n🚀 Vous pouvez maintenant tester le chat dans l\'interface !');

  } catch (error) {
    console.error('❌ [Test] Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 [Test] Déconnecté de MongoDB');
  }
}

// Exécuter la création du workflow de test
createTestWorkflow();
