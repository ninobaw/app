const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');
const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function createDGTestData() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Trouver ou créer un DG
    console.log('\n👑 Recherche/Création du DG...');
    let dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
    
    if (!dg) {
      console.log('❌ Aucun DG trouvé - Création...');
      dg = new User({
        _id: 'dg-test-' + Date.now(),
        firstName: 'Ahmed',
        lastName: 'Directeur Général',
        email: 'dg@aerodoc.tn',
        role: 'DIRECTEUR_GENERAL',
        airport: 'ENFIDHA',
        isActive: true
      });
      await dg.save();
      console.log(`✅ DG créé: ${dg._id}`);
    } else {
      console.log(`✅ DG trouvé: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    }

    // 2. Trouver ou créer un directeur
    console.log('\n👨‍💼 Recherche/Création d\'un directeur...');
    let directeur = await User.findOne({ role: 'DIRECTEUR' });
    
    if (!directeur) {
      console.log('❌ Aucun directeur trouvé - Création...');
      directeur = new User({
        _id: 'dir-test-' + Date.now(),
        firstName: 'Mohamed',
        lastName: 'Directeur',
        email: 'directeur@aerodoc.tn',
        role: 'DIRECTEUR',
        airport: 'ENFIDHA',
        directorate: 'DIRECTION_TECHNIQUE',
        isActive: true
      });
      await directeur.save();
      console.log(`✅ Directeur créé: ${directeur._id}`);
    } else {
      console.log(`✅ Directeur trouvé: ${directeur.firstName} ${directeur.lastName} (${directeur._id})`);
    }

    // 3. Créer une correspondance de test
    console.log('\n📋 Création d\'une correspondance de test...');
    const testCorrespondance = new Correspondance({
      title: 'Test Chat DG - Correspondance Urgente',
      type: 'INCOMING',
      from_address: 'test@external.com',
      to_address: 'aerodoc@enfidha.aero',
      subject: 'Demande urgente nécessitant validation DG',
      content: 'Cette correspondance de test nécessite une validation du Directeur Général. Elle contient des éléments importants qui doivent être traités rapidement.',
      priority: 'URGENT',
      status: 'PENDING',
      airport: 'ENFIDHA',
      code: 'TEST-DG-' + Date.now(),
      authorId: directeur._id,
      personnesConcernees: [directeur._id],
      date_correspondance: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await testCorrespondance.save();
    console.log(`✅ Correspondance créée: ${testCorrespondance._id}`);
    console.log(`   - Sujet: ${testCorrespondance.subject}`);
    console.log(`   - Code: ${testCorrespondance.code}`);

    // 4. Créer le workflow automatiquement
    console.log('\n🔄 Création du workflow...');
    const workflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
      testCorrespondance._id.toString(),
      directeur._id
    );

    if (workflow) {
      console.log(`✅ Workflow créé: ${workflow._id}`);
      console.log(`   - Status: ${workflow.currentStatus}`);
      console.log(`   - DG: ${workflow.directeurGeneral}`);
      console.log(`   - Directeur: ${workflow.assignedDirector}`);
    } else {
      console.log('❌ Échec création workflow');
      return;
    }

    // 5. Ajouter des messages de test dans le chat
    console.log('\n💬 Ajout de messages de test...');
    
    // Message du directeur vers le DG
    await workflow.addChatMessage(
      directeur._id,
      dg._id,
      'Bonjour Monsieur le Directeur Général, j\'ai besoin de votre avis sur cette correspondance urgente. Pouvez-vous me donner votre position ?',
      null,
      []
    );
    console.log('✅ Message 1 ajouté (Directeur → DG)');

    // Message du DG vers le directeur
    await workflow.addChatMessage(
      dg._id,
      directeur._id,
      'Bonjour, j\'ai examiné la correspondance. Je pense qu\'il faut répondre rapidement. Préparez une proposition de réponse et envoyez-la moi pour validation.',
      null,
      []
    );
    console.log('✅ Message 2 ajouté (DG → Directeur)');

    // Message de suivi du directeur
    await workflow.addChatMessage(
      directeur._id,
      dg._id,
      'Parfait, je prépare la proposition de réponse immédiatement. Je vous l\'envoie dans l\'heure.',
      null,
      []
    );
    console.log('✅ Message 3 ajouté (Directeur → DG)');

    // 6. Vérifier la persistance
    const reloadedWorkflow = await CorrespondenceWorkflow.findById(workflow._id);
    console.log(`🔄 Messages persistés: ${reloadedWorkflow.chatMessages.length}`);

    // 7. Créer un fichier de test dans les attachements
    console.log('\n📎 Création d\'un fichier de test...');
    const fs = require('fs');
    const path = require('path');
    
    const chatAttachmentsDir = path.join(__dirname, 'uploads/chat-attachments');
    if (!fs.existsSync(chatAttachmentsDir)) {
      fs.mkdirSync(chatAttachmentsDir, { recursive: true });
    }
    
    const testFileName = `test-dg-attachment-${Date.now()}.txt`;
    const testFilePath = path.join(chatAttachmentsDir, testFileName);
    const testFileContent = `Fichier de test pour le chat DG
Créé le: ${new Date().toISOString()}
Workflow ID: ${workflow._id}
Correspondance: ${testCorrespondance.subject}
DG: ${dg.firstName} ${dg.lastName}
Directeur: ${directeur.firstName} ${directeur.lastName}`;

    fs.writeFileSync(testFilePath, testFileContent);
    console.log(`✅ Fichier de test créé: ${testFileName}`);

    console.log('\n🎉 DONNÉES DE TEST CRÉÉES AVEC SUCCÈS !');
    console.log('\n📋 RÉSUMÉ:');
    console.log(`✅ DG: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    console.log(`✅ Directeur: ${directeur.firstName} ${directeur.lastName} (${directeur._id})`);
    console.log(`✅ Correspondance: ${testCorrespondance._id}`);
    console.log(`✅ Workflow: ${workflow._id}`);
    console.log(`✅ Messages de chat: ${reloadedWorkflow.chatMessages.length}`);
    console.log(`✅ Fichier de test: ${testFileName}`);

    console.log('\n🔧 URLS À TESTER:');
    console.log(`   - Recherche workflow: GET /api/workflow-chat/by-correspondance/${testCorrespondance._id}`);
    console.log(`   - Messages chat: GET /api/workflow-chat/${workflow._id}/messages`);
    console.log(`   - Téléchargement: GET /api/workflow-chat/attachment/${testFileName}`);

    console.log('\n🎯 INSTRUCTIONS POUR TESTER:');
    console.log('1. Connectez-vous en tant que DG avec ces identifiants:');
    console.log(`   - Email: ${dg.email}`);
    console.log(`   - ID: ${dg._id}`);
    console.log('2. Allez dans le dashboard DG');
    console.log('3. Cherchez la correspondance: "' + testCorrespondance.subject + '"');
    console.log('4. Ouvrez la conversation');
    console.log('5. Cliquez sur l\'onglet "Chat Workflow"');
    console.log('6. Vous devriez voir les 3 messages de test');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

createDGTestData();
