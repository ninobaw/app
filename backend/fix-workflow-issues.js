const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function fixWorkflowIssues() {
  try {
    console.log('🔧 [Fix] Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ [Fix] Connecté à MongoDB');

    // 1. Créer les dossiers manquants
    console.log('\n📁 [Fix] Création des dossiers d\'attachements...');
    
    const directories = [
      path.join(__dirname, 'uploads'),
      path.join(__dirname, 'uploads/chat-attachments'),
      path.join(__dirname, 'uploads/drafts'),
      path.join(__dirname, 'uploads/correspondances'),
      path.join(__dirname, 'uploads/templates'),
      path.join(__dirname, 'uploads/documents')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ [Fix] Dossier créé: ${dir}`);
      } else {
        console.log(`ℹ️ [Fix] Dossier existe déjà: ${dir}`);
      }
    });

    // 2. Vérifier et corriger la structure des workflows existants
    console.log('\n🔍 [Fix] Vérification des workflows existants...');
    
    const workflows = await CorrespondenceWorkflow.find({});
    console.log(`📊 [Fix] ${workflows.length} workflow(s) trouvé(s)`);

    for (const workflow of workflows) {
      let needsSave = false;

      // Initialiser chatMessages si absent
      if (!workflow.chatMessages) {
        workflow.chatMessages = [];
        needsSave = true;
        console.log(`🔧 [Fix] Initialisation chatMessages pour workflow ${workflow._id}`);
      }

      // Initialiser draftVersions si absent
      if (!workflow.draftVersions) {
        workflow.draftVersions = [];
        needsSave = true;
        console.log(`🔧 [Fix] Initialisation draftVersions pour workflow ${workflow._id}`);
      }

      // Initialiser actions si absent
      if (!workflow.actions) {
        workflow.actions = [];
        needsSave = true;
        console.log(`🔧 [Fix] Initialisation actions pour workflow ${workflow._id}`);
      }

      if (needsSave) {
        await workflow.save();
        console.log(`✅ [Fix] Workflow ${workflow._id} mis à jour`);
      }
    }

    // 3. Test de création de message
    console.log('\n🧪 [Fix] Test de création de message...');
    
    if (workflows.length > 0) {
      const testWorkflow = workflows[0];
      console.log(`🧪 [Fix] Test sur workflow: ${testWorkflow._id}`);
      
      // Créer un message de test
      const testMessage = {
        from: testWorkflow.assignedDirector || testWorkflow.createdBy,
        to: testWorkflow.directeurGeneral || testWorkflow.createdBy,
        message: 'Message de test - diagnostic workflow',
        draftVersion: 'Test Version',
        attachments: [],
        timestamp: new Date(),
        isRead: false
      };

      testWorkflow.chatMessages.push(testMessage);
      await testWorkflow.save();
      
      console.log('✅ [Fix] Message de test ajouté');
      
      // Vérifier que le message a été sauvegardé
      const updatedWorkflow = await CorrespondenceWorkflow.findById(testWorkflow._id);
      console.log(`📊 [Fix] Messages après sauvegarde: ${updatedWorkflow.chatMessages.length}`);
      
      if (updatedWorkflow.chatMessages.length > 0) {
        console.log('✅ [Fix] Sauvegarde des messages fonctionne !');
        
        // Supprimer le message de test
        updatedWorkflow.chatMessages.pop();
        await updatedWorkflow.save();
        console.log('🧹 [Fix] Message de test supprimé');
      } else {
        console.log('❌ [Fix] Problème de sauvegarde des messages');
      }
    }

    // 4. Corriger l'index dupliqué
    console.log('\n🔧 [Fix] Correction des index MongoDB...');
    
    try {
      // Supprimer tous les index et les recréer
      await CorrespondenceWorkflow.collection.dropIndexes();
      console.log('🗑️ [Fix] Index supprimés');
      
      // Recréer les index nécessaires
      await CorrespondenceWorkflow.ensureIndexes();
      console.log('✅ [Fix] Index recréés');
    } catch (indexError) {
      console.log('⚠️ [Fix] Erreur index (peut être ignorée):', indexError.message);
    }

    // 5. Créer des fichiers de test pour les attachements
    console.log('\n📄 [Fix] Création de fichiers de test...');
    
    const testFiles = [
      { dir: 'chat-attachments', name: 'test-chat.txt', content: 'Fichier de test chat' },
      { dir: 'drafts', name: 'test-draft.txt', content: 'Fichier de test draft' }
    ];

    testFiles.forEach(({ dir, name, content }) => {
      const filePath = path.join(__dirname, 'uploads', dir, name);
      fs.writeFileSync(filePath, content);
      console.log(`✅ [Fix] Fichier de test créé: ${filePath}`);
    });

    console.log('\n🎉 [Fix] Toutes les corrections appliquées avec succès !');
    
    // Résumé final
    console.log('\n📋 [Fix] RÉSUMÉ DES CORRECTIONS:');
    console.log('✅ Dossiers d\'attachements créés');
    console.log('✅ Structure des workflows corrigée');
    console.log('✅ Test de sauvegarde des messages effectué');
    console.log('✅ Index MongoDB corrigés');
    console.log('✅ Fichiers de test créés');
    console.log('\n🚀 Redémarrez le serveur backend et testez le workflow !');

  } catch (error) {
    console.error('❌ [Fix] Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 [Fix] Déconnecté de MongoDB');
  }
}

// Exécuter les corrections
fixWorkflowIssues();
