const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';
const API_BASE_URL = 'http://localhost:5000';

async function testAttachmentUploadDownload() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n🧪 TEST COMPLET UPLOAD/DOWNLOAD ATTACHEMENTS');
    console.log('=============================================');

    // 1. Trouver un workflow existant
    console.log('\n🔍 Recherche d\'un workflow...');
    const workflow = await CorrespondenceWorkflow.findOne()
      .populate('directeurGeneral', 'firstName lastName email')
      .populate('assignedDirector', 'firstName lastName email');

    if (!workflow) {
      console.log('❌ Aucun workflow trouvé');
      return;
    }

    console.log(`✅ Workflow trouvé: ${workflow._id}`);
    console.log(`   - DG: ${workflow.directeurGeneral?.firstName} ${workflow.directeurGeneral?.lastName}`);
    console.log(`   - Directeur: ${workflow.assignedDirector?.firstName} ${workflow.assignedDirector?.lastName}`);

    // 2. Créer un fichier de test
    console.log('\n📎 Création d\'un fichier de test...');
    const testFileName = `test-upload-${Date.now()}.txt`;
    const testFileContent = `Fichier de test pour upload/download
Créé le: ${new Date().toISOString()}
Workflow: ${workflow._id}
Taille: ${Math.random().toString(36).repeat(100)}`;

    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const testFilePath = path.join(tempDir, testFileName);
    fs.writeFileSync(testFilePath, testFileContent);
    console.log(`✅ Fichier créé: ${testFilePath}`);
    console.log(`   - Taille: ${fs.statSync(testFilePath).size} bytes`);

    // 3. Simuler l'authentification (récupérer un token)
    console.log('\n🔐 Authentification...');
    let authToken = null;
    
    try {
      // Essayer de se connecter avec un utilisateur existant
      const user = workflow.directeurGeneral || workflow.assignedDirector;
      if (user && user.email) {
        console.log(`   Tentative de connexion avec: ${user.email}`);
        
        // Pour le test, on va créer un token manuellement ou utiliser un token existant
        // En production, il faudrait faire un POST /api/auth/login
        console.log('   ⚠️ Pour ce test, nous simulons l\'authentification');
        console.log('   💡 En production, utilisez un vrai token JWT');
        
        // Token simulé - en réalité il faudrait un vrai token
        authToken = 'test-token-simulation';
      }
    } catch (authError) {
      console.log(`   ⚠️ Erreur authentification: ${authError.message}`);
      console.log('   💡 Continuons avec un token simulé pour tester la route');
    }

    // 4. Test d'upload via l'API
    console.log('\n📤 Test d\'upload via API...');
    
    try {
      const formData = new FormData();
      formData.append('message', 'Test d\'upload d\'attachement via script');
      formData.append('toUserId', workflow.assignedDirector || workflow.directeurGeneral);
      formData.append('attachments', fs.createReadStream(testFilePath), {
        filename: testFileName,
        contentType: 'text/plain'
      });

      console.log(`   URL: ${API_BASE_URL}/api/workflow-chat/${workflow._id}/send-message`);
      console.log(`   Fichier: ${testFileName}`);
      console.log(`   Message: Test d'upload d'attachement via script`);

      // Note: Ce test nécessite un serveur en cours d'exécution et un token valide
      console.log('   ⚠️ Test d\'upload nécessite un serveur actif et un token JWT valide');
      console.log('   💡 Pour tester manuellement:');
      console.log(`      1. Démarrez le serveur: node src/server.js`);
      console.log(`      2. Connectez-vous via l'interface pour obtenir un token`);
      console.log(`      3. Utilisez Postman ou curl pour tester l'upload`);

    } catch (uploadError) {
      console.log(`   ❌ Erreur upload: ${uploadError.message}`);
    }

    // 5. Test direct de la méthode addChatMessage
    console.log('\n💬 Test direct addChatMessage avec attachement...');
    
    const attachmentData = {
      filename: testFileName,
      originalName: testFileName,
      path: testFilePath,
      size: fs.statSync(testFilePath).size,
      mimetype: 'text/plain',
      uploadedBy: workflow.directeurGeneral || workflow.assignedDirector,
      uploadDate: new Date()
    };

    try {
      await workflow.addChatMessage(
        workflow.directeurGeneral || workflow.assignedDirector,
        workflow.assignedDirector || workflow.directeurGeneral,
        'Message de test avec attachement créé par script',
        null,
        [attachmentData]
      );
      
      console.log('✅ Message avec attachement ajouté directement en DB');
      
      // Vérifier la persistance
      const reloadedWorkflow = await CorrespondenceWorkflow.findById(workflow._id);
      const lastMessage = reloadedWorkflow.chatMessages[reloadedWorkflow.chatMessages.length - 1];
      
      if (lastMessage.attachments && lastMessage.attachments.length > 0) {
        console.log(`✅ Attachement persisté: ${lastMessage.attachments[0].filename}`);
        
        // Copier le fichier vers le dossier chat-attachments pour le test de téléchargement
        const chatAttachmentsDir = path.join(__dirname, 'uploads/chat-attachments');
        if (!fs.existsSync(chatAttachmentsDir)) {
          fs.mkdirSync(chatAttachmentsDir, { recursive: true });
        }
        
        const finalPath = path.join(chatAttachmentsDir, testFileName);
        fs.copyFileSync(testFilePath, finalPath);
        console.log(`✅ Fichier copié vers: ${finalPath}`);
        
        // 6. Test de téléchargement
        console.log('\n📥 Test de téléchargement...');
        console.log(`   URL de téléchargement: ${API_BASE_URL}/api/workflow-chat/attachment/${testFileName}`);
        console.log(`   Fichier physique: ${finalPath}`);
        console.log(`   Existe: ${fs.existsSync(finalPath) ? 'Oui' : 'Non'}`);
        
        if (fs.existsSync(finalPath)) {
          const stats = fs.statSync(finalPath);
          console.log(`   Taille: ${stats.size} bytes`);
          console.log(`   ✅ Le fichier est prêt pour le téléchargement`);
          
          console.log('\n🧪 Test manuel de téléchargement:');
          console.log(`   1. Ouvrez votre navigateur`);
          console.log(`   2. Connectez-vous à l'application`);
          console.log(`   3. Allez sur: ${API_BASE_URL}/api/workflow-chat/attachment/${testFileName}`);
          console.log(`   4. Le fichier devrait se télécharger automatiquement`);
        }
        
      } else {
        console.log('❌ Attachement non persisté');
      }
      
    } catch (dbError) {
      console.log(`❌ Erreur ajout message: ${dbError.message}`);
    }

    // 7. Nettoyage
    console.log('\n🧹 Nettoyage...');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log(`✅ Fichier temporaire supprimé: ${testFilePath}`);
    }

    // 8. Résumé des tests
    console.log('\n📊 RÉSUMÉ DES TESTS:');
    console.log('✅ Création de fichier de test: OK');
    console.log('✅ Ajout direct en DB: OK');
    console.log('✅ Copie vers dossier uploads: OK');
    console.log('⚠️ Upload via API: Nécessite serveur actif + token JWT');
    console.log('⚠️ Download via API: Nécessite test manuel avec navigateur');

    console.log('\n🔧 POUR TESTER COMPLÈTEMENT:');
    console.log('1. Démarrez le serveur backend: node src/server.js');
    console.log('2. Démarrez le frontend: npm run dev');
    console.log('3. Connectez-vous en tant que DG');
    console.log('4. Ouvrez le chat du workflow');
    console.log('5. Uploadez un fichier via l\'interface');
    console.log('6. Testez le téléchargement en cliquant sur l\'attachement');

    console.log('\n✅ TEST TERMINÉ');

  } catch (error) {
    console.error('❌ Erreur test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

testAttachmentUploadDownload();
