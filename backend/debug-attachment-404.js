const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const fs = require('fs');
const path = require('path');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function debugAttachment404() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n🔍 DIAGNOSTIC ATTACHEMENTS 404');
    console.log('===============================');

    // 1. Vérifier les dossiers d'attachements
    console.log('\n📁 Vérification des dossiers:');
    const attachmentDirs = [
      'uploads',
      'uploads/chat-attachments',
      'uploads/drafts',
      'uploads/correspondances',
      'uploads/documents',
      'uploads/temp'
    ];

    attachmentDirs.forEach(dir => {
      const fullPath = path.join(__dirname, dir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        console.log(`✅ ${dir}: ${files.length} fichiers`);
        if (files.length > 0) {
          files.slice(0, 5).forEach(file => {
            const filePath = path.join(fullPath, file);
            const stats = fs.statSync(filePath);
            console.log(`   - ${file} (${stats.size} bytes, ${stats.mtime.toISOString()})`);
          });
          if (files.length > 5) {
            console.log(`   ... et ${files.length - 5} autres fichiers`);
          }
        }
      } else {
        console.log(`❌ ${dir}: Dossier manquant`);
        // Créer le dossier
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ ${dir}: Dossier créé`);
      }
    });

    // 2. Analyser les attachements dans les workflows
    console.log('\n💬 Analyse des attachements dans les workflows:');
    const workflows = await CorrespondenceWorkflow.find({
      'chatMessages.attachments': { $exists: true, $ne: [] }
    }).limit(10);

    console.log(`📊 Workflows avec attachements: ${workflows.length}`);

    let totalAttachments = 0;
    let foundFiles = 0;
    let missingFiles = 0;

    for (const workflow of workflows) {
      console.log(`\n🔄 Workflow: ${workflow._id}`);
      
      for (const message of workflow.chatMessages) {
        if (message.attachments && message.attachments.length > 0) {
          console.log(`   💬 Message avec ${message.attachments.length} attachements:`);
          
          for (const attachment of message.attachments) {
            totalAttachments++;
            console.log(`      📎 ${attachment.filename || attachment.originalName || attachment.name || 'Nom inconnu'}`);
            console.log(`         - Taille: ${attachment.size || 'Inconnue'}`);
            console.log(`         - Type: ${attachment.mimetype || 'Inconnu'}`);
            console.log(`         - Upload par: ${attachment.uploadedBy || 'Inconnu'}`);
            
            // Vérifier si le fichier existe physiquement
            const filename = attachment.filename || attachment.originalName || attachment.name;
            if (filename) {
              const possiblePaths = [
                path.join(__dirname, 'uploads/chat-attachments', filename),
                path.join(__dirname, 'uploads/drafts', filename),
                path.join(__dirname, 'uploads/correspondances', filename),
                path.join(__dirname, 'uploads/documents', filename),
                path.join(__dirname, 'uploads', filename)
              ];

              let fileFound = false;
              for (const testPath of possiblePaths) {
                if (fs.existsSync(testPath)) {
                  console.log(`         ✅ Trouvé: ${testPath}`);
                  foundFiles++;
                  fileFound = true;
                  break;
                }
              }

              if (!fileFound) {
                console.log(`         ❌ FICHIER MANQUANT: ${filename}`);
                console.log(`         🔍 Cherché dans:`);
                possiblePaths.forEach(p => console.log(`            - ${p}`));
                missingFiles++;
              }
            } else {
              console.log(`         ⚠️ Nom de fichier manquant dans l'attachement`);
            }
          }
        }
      }
    }

    // 3. Créer des fichiers de test
    console.log('\n🧪 Création de fichiers de test:');
    const testFiles = [
      {
        dir: 'uploads/chat-attachments',
        name: `test-chat-${Date.now()}.txt`,
        content: 'Fichier de test pour chat attachments\nCréé le: ' + new Date().toISOString()
      },
      {
        dir: 'uploads/documents',
        name: `test-doc-${Date.now()}.pdf`,
        content: 'Fichier de test pour documents\nCréé le: ' + new Date().toISOString()
      }
    ];

    const createdTestFiles = [];
    testFiles.forEach(file => {
      const filePath = path.join(__dirname, file.dir, file.name);
      fs.writeFileSync(filePath, file.content);
      console.log(`✅ Créé: ${file.dir}/${file.name}`);
      createdTestFiles.push({
        filename: file.name,
        path: filePath,
        url: `/api/workflow-chat/attachment/${file.name}`
      });
    });

    // 4. Tester la route de téléchargement
    console.log('\n🌐 Test de la route de téléchargement:');
    console.log('Route: GET /api/workflow-chat/attachment/:filename');
    
    for (const testFile of createdTestFiles) {
      console.log(`\n🧪 Test fichier: ${testFile.filename}`);
      console.log(`   URL: ${testFile.url}`);
      console.log(`   Chemin physique: ${testFile.path}`);
      console.log(`   Existe: ${fs.existsSync(testFile.path) ? 'Oui' : 'Non'}`);
      
      if (fs.existsSync(testFile.path)) {
        const stats = fs.statSync(testFile.path);
        console.log(`   Taille: ${stats.size} bytes`);
        console.log(`   Modifié: ${stats.mtime.toISOString()}`);
      }
    }

    // 5. Vérifier la configuration de la route
    console.log('\n⚙️ Configuration de la route:');
    console.log('Fichier: backend/src/routes/workflowChatRoutes.js');
    console.log('Route: router.get(\'/attachment/:filename\', auth, async (req, res) => {');
    console.log('Emplacements de recherche:');
    const searchPaths = [
      'uploads/chat-attachments',
      'uploads/drafts',
      'uploads/correspondances',
      'uploads/documents',
      'uploads'
    ];
    searchPaths.forEach(p => console.log(`   - ${p}`));

    // 6. Statistiques finales
    console.log('\n📊 STATISTIQUES:');
    console.log(`   - Total attachements en DB: ${totalAttachments}`);
    console.log(`   - Fichiers trouvés: ${foundFiles}`);
    console.log(`   - Fichiers manquants: ${missingFiles}`);
    console.log(`   - Taux de réussite: ${totalAttachments > 0 ? Math.round((foundFiles / totalAttachments) * 100) : 0}%`);

    // 7. Recommandations
    console.log('\n💡 RECOMMANDATIONS:');
    
    if (missingFiles > 0) {
      console.log('❌ PROBLÈME: Fichiers manquants détectés');
      console.log('   Solutions:');
      console.log('   1. Vérifier que les fichiers sont bien uploadés dans les bons dossiers');
      console.log('   2. Vérifier les permissions des dossiers uploads');
      console.log('   3. Vérifier la configuration Multer dans workflowChatRoutes.js');
      console.log('   4. Vérifier que les noms de fichiers sont correctement sauvegardés');
    }

    if (totalAttachments === 0) {
      console.log('ℹ️ INFO: Aucun attachement trouvé dans les workflows');
      console.log('   - Testez l\'upload d\'attachements via l\'interface');
      console.log('   - Vérifiez que les attachements sont bien sauvegardés en DB');
    }

    console.log('\n🔧 TESTS À EFFECTUER:');
    console.log('1. Testez l\'upload d\'un fichier via l\'interface chat');
    console.log('2. Vérifiez que le fichier apparaît dans uploads/chat-attachments');
    console.log('3. Testez le téléchargement via l\'interface');
    console.log('4. Vérifiez les logs du serveur pour les erreurs 404');

    console.log('\n✅ DIAGNOSTIC TERMINÉ');

  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

debugAttachment404();
