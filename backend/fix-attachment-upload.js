const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');
const fs = require('fs');
const path = require('path');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function fixAttachmentUpload() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n🔧 CORRECTION UPLOAD ATTACHEMENTS');
    console.log('==================================');

    // 1. Vérifier et créer les dossiers nécessaires
    console.log('\n📁 Vérification/Création des dossiers:');
    const requiredDirs = [
      'uploads',
      'uploads/chat-attachments',
      'uploads/drafts',
      'uploads/correspondances',
      'uploads/documents',
      'uploads/temp'
    ];

    requiredDirs.forEach(dir => {
      const fullPath = path.join(__dirname, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Créé: ${dir}`);
      } else {
        console.log(`✅ Existe: ${dir}`);
      }
    });

    // 2. Créer des fichiers de test avec différents formats
    console.log('\n📎 Création de fichiers de test:');
    const testFiles = [
      {
        name: `test-document-${Date.now()}.txt`,
        content: `Document de test
Créé le: ${new Date().toISOString()}
Type: Document texte
Contenu: ${Array(50).fill('Test ').join('')}`,
        mimetype: 'text/plain'
      },
      {
        name: `test-image-${Date.now()}.txt`,
        content: `Image de test (simulée)
Créé le: ${new Date().toISOString()}
Type: Image simulée
Données: ${Array(100).fill('IMG ').join('')}`,
        mimetype: 'image/jpeg'
      },
      {
        name: `test-pdf-${Date.now()}.txt`,
        content: `PDF de test (simulé)
Créé le: ${new Date().toISOString()}
Type: PDF simulé
Contenu: ${Array(200).fill('PDF ').join('')}`,
        mimetype: 'application/pdf'
      }
    ];

    const createdFiles = [];
    testFiles.forEach(file => {
      const filePath = path.join(__dirname, 'uploads/chat-attachments', file.name);
      fs.writeFileSync(filePath, file.content);
      console.log(`✅ Créé: ${file.name} (${file.content.length} bytes)`);
      
      createdFiles.push({
        filename: file.name,
        originalName: file.name,
        path: filePath,
        size: file.content.length,
        mimetype: file.mimetype,
        uploadedBy: null, // Sera défini plus tard
        uploadDate: new Date()
      });
    });

    // 3. Trouver ou créer un workflow de test
    console.log('\n🔄 Recherche/Création d\'un workflow de test:');
    let workflow = await CorrespondenceWorkflow.findOne();
    
    if (!workflow) {
      console.log('❌ Aucun workflow trouvé - Création nécessaire');
      console.log('💡 Exécutez d\'abord: node create-dg-workflow-with-attachments.js');
      return;
    }

    console.log(`✅ Workflow trouvé: ${workflow._id}`);

    // 4. Ajouter des messages avec les fichiers de test
    console.log('\n💬 Ajout de messages avec attachements de test:');
    
    const fromUser = workflow.directeurGeneral || workflow.assignedDirector;
    const toUser = workflow.assignedDirector || workflow.directeurGeneral;

    for (let i = 0; i < createdFiles.length; i++) {
      const file = createdFiles[i];
      file.uploadedBy = fromUser;
      
      const message = `Message de test ${i + 1} avec attachement ${file.mimetype}`;
      
      try {
        await workflow.addChatMessage(
          fromUser,
          toUser,
          message,
          null,
          [file]
        );
        console.log(`✅ Message ${i + 1} ajouté avec attachement: ${file.filename}`);
      } catch (error) {
        console.log(`❌ Erreur message ${i + 1}: ${error.message}`);
      }
    }

    // 5. Vérifier la persistance
    console.log('\n🔍 Vérification de la persistance:');
    const reloadedWorkflow = await CorrespondenceWorkflow.findById(workflow._id);
    
    let totalAttachments = 0;
    reloadedWorkflow.chatMessages.forEach((msg, msgIndex) => {
      if (msg.attachments && msg.attachments.length > 0) {
        console.log(`📝 Message ${msgIndex + 1}: ${msg.attachments.length} attachements`);
        msg.attachments.forEach((att, attIndex) => {
          totalAttachments++;
          console.log(`   📎 ${attIndex + 1}. ${att.filename} (${att.size} bytes, ${att.mimetype})`);
          
          // Vérifier que le fichier existe physiquement
          const physicalPath = path.join(__dirname, 'uploads/chat-attachments', att.filename);
          const exists = fs.existsSync(physicalPath);
          console.log(`      Fichier physique: ${exists ? '✅ Existe' : '❌ Manquant'}`);
        });
      }
    });

    console.log(`\n📊 Total attachements créés: ${totalAttachments}`);

    // 6. Tester les URLs de téléchargement
    console.log('\n🌐 URLs de téléchargement à tester:');
    createdFiles.forEach((file, index) => {
      console.log(`${index + 1}. GET /api/workflow-chat/attachment/${file.filename}`);
      console.log(`   Nom original: ${file.originalName}`);
      console.log(`   Taille: ${file.size} bytes`);
      console.log(`   Type: ${file.mimetype}`);
    });

    // 7. Instructions de test
    console.log('\n🧪 INSTRUCTIONS DE TEST:');
    console.log('1. Démarrez le serveur backend si pas déjà fait');
    console.log('2. Connectez-vous en tant que DG dans l\'interface');
    console.log('3. Ouvrez le chat du workflow');
    console.log('4. Vous devriez voir les messages avec attachements');
    console.log('5. Cliquez sur les boutons de téléchargement');
    console.log('6. Vérifiez que les fichiers se téléchargent correctement');

    console.log('\n🔧 POUR TESTER L\'UPLOAD:');
    console.log('1. Dans le chat, utilisez le bouton d\'ajout de fichier');
    console.log('2. Sélectionnez un fichier de votre ordinateur');
    console.log('3. Envoyez le message');
    console.log('4. Vérifiez que le fichier apparaît dans uploads/chat-attachments');
    console.log('5. Testez le téléchargement du fichier uploadé');

    // 8. Diagnostic des problèmes courants
    console.log('\n🔍 DIAGNOSTIC DES PROBLÈMES COURANTS:');
    console.log('Si les attachements ne fonctionnent pas:');
    console.log('1. Vérifiez que le serveur backend est démarré');
    console.log('2. Vérifiez les permissions des dossiers uploads');
    console.log('3. Vérifiez les logs du serveur pour les erreurs');
    console.log('4. Vérifiez la configuration Multer dans workflowChatRoutes.js');
    console.log('5. Vérifiez que l\'authentification JWT fonctionne');

    console.log('\n✅ CORRECTION TERMINÉE');
    console.log(`📊 Workflow ID pour test: ${workflow._id}`);
    console.log(`📊 Messages avec attachements: ${totalAttachments}`);

  } catch (error) {
    console.error('❌ Erreur correction:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

fixAttachmentUpload();
