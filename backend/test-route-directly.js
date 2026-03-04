const express = require('express');
const mongoose = require('mongoose');
const CorrespondenceWorkflow = require('./src/models/CorrespondenceWorkflow');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function testRouteDirectly() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const workflowId = '68e38183fe924f68937b23e7';
    console.log(`\n🧪 Test direct de la logique de route pour: ${workflowId}`);

    // Simuler exactement ce que fait la route
    console.log('1. Recherche du workflow...');
    let workflow;
    try {
      workflow = await CorrespondenceWorkflow.findById(workflowId)
        .populate('chatMessages.from', 'firstName lastName email role')
        .populate('chatMessages.to', 'firstName lastName email role')
        .populate('assignedDirector', 'firstName lastName email role')
        .populate('directeurGeneral', 'firstName lastName email role');
      
      console.log('✅ Workflow trouvé (sans correspondance)');
      console.log(`   - Messages: ${workflow.chatMessages?.length || 0}`);
      
      // Essayer de populer la correspondance séparément
      if (workflow && workflow.correspondanceId) {
        console.log('2. Tentative de populate correspondance...');
        try {
          await workflow.populate('correspondanceId', 'subject content attachments priority createdAt');
          console.log('✅ Correspondance populée avec succès');
        } catch (populateError) {
          console.log(`⚠️ Correspondance non trouvée: ${workflow.correspondanceId}`);
          console.log(`   Erreur: ${populateError.message}`);
        }
      }
    } catch (error) {
      console.error(`❌ Erreur populate workflow:`, error);
      return;
    }

    if (!workflow) {
      console.log('❌ Workflow non trouvé');
      return;
    }

    console.log('3. Vérification des messages...');
    if (workflow.chatMessages && workflow.chatMessages.length > 0) {
      console.log(`✅ ${workflow.chatMessages.length} messages trouvés`);
      workflow.chatMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. De: ${msg.from?.firstName || msg.from || 'Unknown'} vers: ${msg.to?.firstName || msg.to || 'Unknown'}`);
        console.log(`      Message: "${msg.message?.substring(0, 50)}..."`);
      });
    } else {
      console.log('⚠️ Aucun message trouvé');
    }

    console.log('4. Construction de la réponse...');
    const response = {
      success: true,
      data: {
        workflowId: workflow._id,
        correspondance: workflow.correspondanceId ? {
          id: workflow.correspondanceId._id,
          subject: workflow.correspondanceId.subject || 'Correspondance supprimée',
          content: workflow.correspondanceId.content || 'Contenu non disponible',
          attachments: workflow.correspondanceId.attachments || [],
          priority: workflow.correspondanceId.priority || 'MEDIUM',
          createdAt: workflow.correspondanceId.createdAt || new Date()
        } : {
          id: workflow.correspondanceId,
          subject: 'Correspondance non trouvée',
          content: 'La correspondance originale a été supprimée ou n\'est plus accessible',
          attachments: [],
          priority: 'MEDIUM',
          createdAt: new Date()
        },
        chatMessages: workflow.chatMessages.map(msg => ({
          id: msg._id,
          from: {
            id: msg.from?._id || msg.from,
            name: msg.from?.firstName ? `${msg.from.firstName} ${msg.from.lastName}` : 'Utilisateur inconnu',
            email: msg.from?.email || 'email@inconnu.com',
            role: msg.from?.role || 'USER'
          },
          to: {
            id: msg.to?._id || msg.to,
            name: msg.to?.firstName ? `${msg.to.firstName} ${msg.to.lastName}` : 'Utilisateur inconnu',
            email: msg.to?.email || 'email@inconnu.com',
            role: msg.to?.role || 'USER'
          },
          message: msg.message,
          draftVersion: msg.draftVersion,
          attachments: msg.attachments || [],
          timestamp: msg.timestamp,
          isRead: msg.isRead
        })),
        currentStatus: workflow.currentStatus,
        assignedDirector: workflow.assignedDirector,
        directeurGeneral: workflow.directeurGeneral
      }
    };

    console.log('✅ Réponse construite avec succès');
    console.log(`   - Messages mappés: ${response.data.chatMessages.length}`);
    console.log(`   - Correspondance: ${response.data.correspondance.subject}`);

    // Tester la sérialisation JSON
    console.log('5. Test sérialisation JSON...');
    try {
      const jsonString = JSON.stringify(response);
      console.log('✅ Sérialisation JSON réussie');
      console.log(`   - Taille: ${jsonString.length} caractères`);
    } catch (jsonError) {
      console.error('❌ Erreur sérialisation JSON:', jsonError);
    }

    console.log('\n🎯 RÉSULTAT: La logique de route fonctionne correctement');
    console.log('💡 Le problème est probablement:');
    console.log('   1. Le serveur n\'a pas été redémarré');
    console.log('   2. Il y a une autre erreur dans le code de la route');
    console.log('   3. Problème d\'authentification ou de middleware');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

testRouteDirectly();
