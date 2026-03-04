const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function debugWorkflowChat() {
  try {
    console.log('🔍 [Debug] Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ [Debug] Connecté à MongoDB');

    // 1. Trouver tous les workflows avec des messages de chat
    console.log('\n📋 [Debug] Recherche des workflows avec messages...');
    const workflowsWithMessages = await CorrespondenceWorkflow.find({
      'chatMessages.0': { $exists: true }
    })
    .populate('chatMessages.from', 'firstName lastName role')
    .populate('chatMessages.to', 'firstName lastName role')
    .populate('correspondanceId', 'subject');

    console.log(`📊 [Debug] ${workflowsWithMessages.length} workflow(s) avec messages trouvé(s)`);

    for (const workflow of workflowsWithMessages) {
      console.log(`\n🔍 [Debug] Workflow ID: ${workflow._id}`);
      console.log(`📧 [Debug] Correspondance: ${workflow.correspondanceId?.subject || 'N/A'}`);
      console.log(`📊 [Debug] Statut: ${workflow.currentStatus}`);
      console.log(`💬 [Debug] Nombre de messages: ${workflow.chatMessages?.length || 0}`);
      
      if (workflow.chatMessages && workflow.chatMessages.length > 0) {
        console.log(`📝 [Debug] Messages:`);
        workflow.chatMessages.forEach((msg, index) => {
          console.log(`   ${index + 1}. De: ${msg.from?.firstName || 'Unknown'} ${msg.from?.lastName || ''} (${msg.from?.role || 'Unknown'})`);
          console.log(`      Vers: ${msg.to?.firstName || 'Unknown'} ${msg.to?.lastName || ''} (${msg.to?.role || 'Unknown'})`);
          console.log(`      Message: ${msg.message?.substring(0, 80)}...`);
          console.log(`      Version: ${msg.draftVersion || 'N/A'}`);
          console.log(`      Timestamp: ${msg.timestamp}`);
          console.log(`      Attachements: ${msg.attachments?.length || 0}`);
          console.log(`      Lu: ${msg.isRead ? 'Oui' : 'Non'}`);
          console.log('');
        });
      }
    }

    // 2. Vérifier la structure du schéma
    console.log('\n🏗️ [Debug] Vérification structure schéma...');
    const sampleWorkflow = await CorrespondenceWorkflow.findOne();
    if (sampleWorkflow) {
      console.log(`📋 [Debug] Champs disponibles dans le workflow:`);
      console.log(`   - chatMessages: ${sampleWorkflow.chatMessages ? 'Présent' : 'Absent'}`);
      console.log(`   - draftVersions: ${sampleWorkflow.draftVersions ? 'Présent' : 'Absent'}`);
      console.log(`   - actions: ${sampleWorkflow.actions ? 'Présent' : 'Absent'}`);
      
      if (sampleWorkflow.chatMessages) {
        console.log(`   - Type chatMessages: ${Array.isArray(sampleWorkflow.chatMessages) ? 'Array' : typeof sampleWorkflow.chatMessages}`);
        console.log(`   - Longueur chatMessages: ${sampleWorkflow.chatMessages.length}`);
      }
    }

    // 3. Test d'ajout de message
    console.log('\n🧪 [Debug] Test d\'ajout de message...');
    const testWorkflow = await CorrespondenceWorkflow.findOne();
    if (testWorkflow) {
      const users = await User.find({ role: { $in: ['DIRECTEUR', 'DIRECTEUR_GENERAL'] } }).limit(2);
      if (users.length >= 2) {
        console.log(`👥 [Debug] Utilisateurs test: ${users[0].firstName} ${users[0].lastName} -> ${users[1].firstName} ${users[1].lastName}`);
        
        const messagesBefore = testWorkflow.chatMessages?.length || 0;
        console.log(`📊 [Debug] Messages avant: ${messagesBefore}`);
        
        try {
          await testWorkflow.addChatMessage(
            users[0]._id,
            users[1]._id,
            'Message de test pour diagnostic',
            'Test Version',
            []
          );
          
          const updatedWorkflow = await CorrespondenceWorkflow.findById(testWorkflow._id);
          const messagesAfter = updatedWorkflow.chatMessages?.length || 0;
          console.log(`📊 [Debug] Messages après: ${messagesAfter}`);
          
          if (messagesAfter > messagesBefore) {
            console.log('✅ [Debug] Ajout de message réussi');
            
            // Supprimer le message de test
            updatedWorkflow.chatMessages.pop();
            await updatedWorkflow.save();
            console.log('🧹 [Debug] Message de test supprimé');
          } else {
            console.log('❌ [Debug] Échec ajout de message');
          }
        } catch (error) {
          console.error('❌ [Debug] Erreur ajout message:', error.message);
        }
      } else {
        console.log('⚠️ [Debug] Pas assez d\'utilisateurs pour le test');
      }
    }

    // 4. Vérifier les fichiers d'attachements
    console.log('\n📎 [Debug] Vérification des attachements...');
    const fs = require('fs');
    const path = require('path');
    
    const chatAttachmentsDir = path.join(__dirname, 'uploads/chat-attachments');
    const draftsDir = path.join(__dirname, 'uploads/drafts');
    
    console.log(`📁 [Debug] Dossier chat-attachments: ${fs.existsSync(chatAttachmentsDir) ? 'Existe' : 'N\'existe pas'}`);
    console.log(`📁 [Debug] Dossier drafts: ${fs.existsSync(draftsDir) ? 'Existe' : 'N\'existe pas'}`);
    
    if (fs.existsSync(chatAttachmentsDir)) {
      const chatFiles = fs.readdirSync(chatAttachmentsDir);
      console.log(`📄 [Debug] Fichiers chat-attachments: ${chatFiles.length}`);
      chatFiles.slice(0, 5).forEach(file => console.log(`   - ${file}`));
    }
    
    if (fs.existsSync(draftsDir)) {
      const draftFiles = fs.readdirSync(draftsDir);
      console.log(`📄 [Debug] Fichiers drafts: ${draftFiles.length}`);
      draftFiles.slice(0, 5).forEach(file => console.log(`   - ${file}`));
    }

  } catch (error) {
    console.error('❌ [Debug] Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 [Debug] Déconnecté de MongoDB');
  }
}

// Exécuter le diagnostic
debugWorkflowChat();
