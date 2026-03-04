const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const Correspondance = require('./src/models/Correspondance');
const User = require('./src/models/User');
const fs = require('fs');
const path = require('path');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function createDGWorkflowWithAttachments() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Trouver ou créer un DG
    console.log('\n👑 Recherche du DG...');
    let dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
    
    if (!dg) {
      console.log('❌ Aucun DG trouvé - Création...');
      dg = new User({
        _id: 'dg-' + Date.now(),
        firstName: 'Ahmed',
        lastName: 'Ben Ali',
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
    console.log('\n👨‍💼 Recherche d\'un directeur...');
    let directeur = await User.findOne({ role: 'DIRECTEUR' });
    
    if (!directeur) {
      console.log('❌ Aucun directeur trouvé - Création...');
      directeur = new User({
        _id: 'dir-' + Date.now(),
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

    // 3. Créer une correspondance
    console.log('\n📋 Création d\'une correspondance...');
    const correspondance = new Correspondance({
      title: 'Correspondance avec Chat et Attachements',
      type: 'INCOMING',
      from_address: 'external@company.com',
      to_address: 'aerodoc@enfidha.aero',
      subject: 'Demande urgente avec documents joints',
      content: 'Cette correspondance nécessite une validation du DG avec échange de documents.',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      code: 'CHAT-TEST-' + Date.now(),
      authorId: directeur._id,
      personnesConcernees: [directeur._id],
      date_correspondance: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await correspondance.save();
    console.log(`✅ Correspondance créée: ${correspondance._id}`);

    // 4. Créer le workflow
    console.log('\n🔄 Création du workflow...');
    const workflow = new CorrespondenceWorkflow({
      correspondanceId: correspondance._id,
      currentStatus: 'ASSIGNED_TO_DIRECTOR',
      createdBy: directeur._id,
      bureauOrdreAgent: directeur._id,
      superviseurBureauOrdre: directeur._id,
      assignedDirector: directeur._id,
      directeurGeneral: dg._id,
      priority: 'HIGH',
      chatMessages: []
    });

    await workflow.save();
    console.log(`✅ Workflow créé: ${workflow._id}`);

    // 5. Créer des fichiers d'attachement
    console.log('\n📎 Création des fichiers d\'attachement...');
    const attachmentFiles = [
      {
        filename: `rapport-${Date.now()}.txt`,
        originalName: 'Rapport_Technique.txt',
        content: `RAPPORT TECHNIQUE
================

Date: ${new Date().toISOString()}
Auteur: ${directeur.firstName} ${directeur.lastName}
Destinataire: ${dg.firstName} ${dg.lastName}

Ce rapport contient les informations techniques importantes
pour la correspondance ${correspondance.code}.

Merci de valider ce document.`
      },
      {
        filename: `document-${Date.now()}.txt`,
        originalName: 'Document_Annexe.txt',
        content: `DOCUMENT ANNEXE
===============

Référence: ${correspondance.code}
Date: ${new Date().toISOString()}

Informations complémentaires pour la correspondance.
Ce document est joint au chat du workflow.`
      }
    ];

    const chatAttachmentsDir = path.join(__dirname, 'uploads/chat-attachments');
    const createdAttachments = [];

    for (const file of attachmentFiles) {
      const filePath = path.join(chatAttachmentsDir, file.filename);
      fs.writeFileSync(filePath, file.content);
      console.log(`✅ Fichier créé: ${file.filename}`);
      
      createdAttachments.push({
        filename: file.filename,
        originalName: file.originalName,
        size: Buffer.byteLength(file.content, 'utf8'),
        mimetype: 'text/plain',
        uploadedBy: directeur._id,
        uploadDate: new Date()
      });
    }

    // 6. Ajouter des messages avec attachements
    console.log('\n💬 Ajout des messages avec attachements...');
    
    // Message 1: Directeur vers DG avec attachement
    await workflow.addChatMessage(
      directeur._id,
      dg._id,
      'Bonjour Monsieur le Directeur Général, veuillez trouver ci-joint le rapport technique pour cette correspondance urgente.',
      null,
      [createdAttachments[0]]
    );
    console.log('✅ Message 1 ajouté (avec attachement)');

    // Message 2: DG vers Directeur
    await workflow.addChatMessage(
      dg._id,
      directeur._id,
      'Merci pour le rapport. J\'ai quelques questions. Pouvez-vous me fournir des informations complémentaires ?',
      null,
      []
    );
    console.log('✅ Message 2 ajouté');

    // Message 3: Directeur vers DG avec deuxième attachement
    await workflow.addChatMessage(
      directeur._id,
      dg._id,
      'Voici le document annexe avec les informations complémentaires demandées.',
      null,
      [createdAttachments[1]]
    );
    console.log('✅ Message 3 ajouté (avec attachement)');

    // Message 4: DG vers Directeur
    await workflow.addChatMessage(
      dg._id,
      directeur._id,
      'Parfait ! Les documents sont complets. Je valide cette correspondance.',
      null,
      []
    );
    console.log('✅ Message 4 ajouté');

    // 7. Vérifier la persistance
    const reloadedWorkflow = await CorrespondenceWorkflow.findById(workflow._id);
    console.log(`🔄 Messages persistés: ${reloadedWorkflow.chatMessages.length}`);

    let totalAttachments = 0;
    reloadedWorkflow.chatMessages.forEach(msg => {
      if (msg.attachments && msg.attachments.length > 0) {
        totalAttachments += msg.attachments.length;
      }
    });
    console.log(`📎 Total attachements: ${totalAttachments}`);

    console.log('\n🎉 WORKFLOW DG AVEC ATTACHEMENTS CRÉÉ !');
    console.log('\n📋 RÉSUMÉ:');
    console.log(`✅ DG: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    console.log(`✅ Directeur: ${directeur.firstName} ${directeur.lastName} (${directeur._id})`);
    console.log(`✅ Correspondance: ${correspondance._id}`);
    console.log(`✅ Workflow: ${workflow._id}`);
    console.log(`✅ Messages: ${reloadedWorkflow.chatMessages.length}`);
    console.log(`✅ Attachements: ${totalAttachments}`);

    console.log('\n🔧 POUR TESTER:');
    console.log('1. Connectez-vous en tant que DG');
    console.log('2. Allez dans le dashboard DG');
    console.log('3. Cherchez la correspondance: "' + correspondance.subject + '"');
    console.log('4. Ouvrez la conversation');
    console.log('5. Cliquez sur l\'onglet "Chat Workflow"');
    console.log('6. Testez le téléchargement des attachements');

    console.log('\n🌐 URLS DE TEST:');
    console.log(`   - Workflow: GET /api/workflow-chat/by-correspondance/${correspondance._id}`);
    console.log(`   - Messages: GET /api/workflow-chat/${workflow._id}/messages`);
    console.log(`   - Attachement 1: GET /api/workflow-chat/attachment/${createdAttachments[0].filename}`);
    console.log(`   - Attachement 2: GET /api/workflow-chat/attachment/${createdAttachments[1].filename}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

createDGWorkflowWithAttachments();
