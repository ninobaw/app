const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');
const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function testWorkflowComplete() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Créer une correspondance de test
    console.log('\n📝 Création d\'une correspondance de test...');
    const testCorrespondance = new Correspondance({
      title: 'Test Workflow Complet',
      type: 'INCOMING',
      from_address: 'test@example.com',
      to_address: 'aerodoc@enfidha.aero',
      subject: 'Test du système de workflow et chat',
      content: 'Correspondance de test pour vérifier le workflow complet',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      code: 'TEST-WF-' + Date.now(),
      authorId: '507f1f77bcf86cd799439011', // ID de test
      personnesConcernees: ['507f1f77bcf86cd799439012'], // Directeur de test
      date_correspondance: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await testCorrespondance.save();
    console.log(`✅ Correspondance créée: ${testCorrespondance._id}`);

    // 2. Créer automatiquement le workflow
    console.log('\n🔄 Création automatique du workflow...');
    const workflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
      testCorrespondance._id.toString(),
      '507f1f77bcf86cd799439011'
    );

    if (workflow) {
      console.log(`✅ Workflow créé: ${workflow._id}`);
      console.log(`   - Status: ${workflow.currentStatus}`);
      console.log(`   - Directeur assigné: ${workflow.assignedDirector}`);
      console.log(`   - DG: ${workflow.directeurGeneral}`);
    } else {
      console.log('⚠️ Workflow non créé (conditions non remplies)');
    }

    // 3. Tester l'ajout de messages de chat
    console.log('\n💬 Test des messages de chat...');
    if (workflow) {
      // Message 1
      await workflow.addChatMessage(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        'Premier message de test du workflow',
        null,
        []
      );
      console.log('✅ Premier message ajouté');

      // Message 2
      await workflow.addChatMessage(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439011',
        'Réponse au premier message',
        null,
        []
      );
      console.log('✅ Deuxième message ajouté');

      // Vérifier la persistance
      const reloadedWorkflow = await CorrespondenceWorkflow.findById(workflow._id);
      console.log(`🔄 Messages persistés en DB: ${reloadedWorkflow.chatMessages.length}`);
      
      if (reloadedWorkflow.chatMessages.length === 2) {
        console.log('✅ Persistance des messages confirmée');
      } else {
        console.log('❌ Problème de persistance détecté');
      }
    }

    // 4. Vérifier les chemins d'attachements
    console.log('\n📎 Vérification des chemins d\'attachements...');
    const fs = require('fs');
    const path = require('path');
    
    const attachmentPaths = [
      path.join(__dirname, 'uploads/chat-attachments'),
      path.join(__dirname, 'uploads/drafts'),
      path.join(__dirname, 'uploads/correspondances'),
      path.join(__dirname, 'uploads/documents'),
      path.join(__dirname, 'uploads')
    ];

    for (const attachmentPath of attachmentPaths) {
      if (fs.existsSync(attachmentPath)) {
        console.log(`✅ Dossier existe: ${attachmentPath}`);
      } else {
        console.log(`⚠️ Dossier manquant: ${attachmentPath}`);
        // Créer le dossier s'il n'existe pas
        fs.mkdirSync(attachmentPath, { recursive: true });
        console.log(`📁 Dossier créé: ${attachmentPath}`);
      }
    }

    console.log('\n🎉 Test du workflow complet terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testWorkflowComplete();
