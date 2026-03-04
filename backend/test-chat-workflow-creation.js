const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

/**
 * Test de création automatique de workflow pour le chat
 */

async function testChatWorkflowCreation() {
  try {
    console.log('🔧 ========================================');
    console.log('🔧 TEST CRÉATION WORKFLOW AUTOMATIQUE CHAT');
    console.log('🔧 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. CRÉER UNE CORRESPONDANCE SANS WORKFLOW
    const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
    const director = await User.findOne({ role: 'DIRECTEUR' });
    const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });

    console.log(`👑 DG: ${dg.firstName} ${dg.lastName}`);
    console.log(`👤 Directeur: ${director.firstName} ${director.lastName}`);
    console.log(`📋 Agent: ${agent.firstName} ${agent.lastName}\n`);

    // Créer une correspondance avec draft mais sans workflow
    const testCorr = new Correspondance({
      title: 'Test création workflow automatique',
      subject: 'Correspondance avec draft mais sans workflow',
      content: 'Test pour vérifier la création automatique de workflow.',
      type: 'INCOMING',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'test@external.com',
      to_address: 'dg@enfidha.tn',
      personnesConcernees: [director._id.toString()],
      code: `TEST-AUTO-WORKFLOW-${Date.now()}`,
      authorId: agent._id,
      workflowStatus: 'DIRECTOR_DRAFT',
      responseDrafts: [{
        directorId: director._id.toString(),
        directorName: `${director.firstName} ${director.lastName}`,
        directorate: director.directorate,
        responseContent: 'Proposition de réponse pour test workflow automatique.',
        attachments: [],
        comments: 'Test création automatique workflow',
        isUrgent: true,
        status: 'PENDING_DG_REVIEW',
        createdAt: new Date(),
        updatedAt: new Date(),
        dgFeedbacks: []
      }],
      date_correspondance: new Date()
    });

    await testCorr.save();
    console.log(`✅ Correspondance créée: ${testCorr._id}`);
    console.log(`📝 Avec 1 draft en attente DG`);
    console.log(`🔄 Status: ${testCorr.workflowStatus}\n`);

    // 2. VÉRIFIER QU'AUCUN WORKFLOW N'EXISTE
    const existingWorkflow = await CorrespondenceWorkflow.findOne({ 
      correspondanceId: testCorr._id 
    });
    
    console.log(`🔍 Workflow existant: ${existingWorkflow ? 'OUI' : 'NON'}`);
    
    if (existingWorkflow) {
      console.log(`⚠️ Un workflow existe déjà, suppression pour le test...`);
      await CorrespondenceWorkflow.deleteOne({ _id: existingWorkflow._id });
      console.log(`🗑️ Workflow supprimé`);
    }

    // 3. SIMULER L'APPEL API DU CHAT DG
    console.log(`\n💬 === SIMULATION APPEL API CHAT DG ===`);
    
    // Simuler l'appel GET /api/workflow-chat/by-correspondance/:correspondanceId
    console.log(`🔍 Simulation: GET /api/workflow-chat/by-correspondance/${testCorr._id}`);
    console.log(`👤 Utilisateur: ${dg.firstName} ${dg.lastName} (${dg.role})`);

    try {
      // Simuler la logique de la route corrigée
      let workflow = await CorrespondenceWorkflow.findOne({ 
        correspondanceId: testCorr._id 
      }).populate('assignedDirector', 'firstName lastName email role')
        .populate('directeurGeneral', 'firstName lastName email role');

      console.log(`📊 Workflow trouvé: ${!!workflow}`);

      if (!workflow) {
        console.log(`⚠️ Aucun workflow trouvé, création automatique...`);
        
        // Créer automatiquement un workflow
        const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
        const createdWorkflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
          testCorr._id.toString(),
          dg._id.toString()
        );
        
        if (createdWorkflow) {
          console.log(`✅ Workflow créé automatiquement: ${createdWorkflow._id}`);
          
          // Récupérer le workflow créé avec les populations
          workflow = await CorrespondenceWorkflow.findById(createdWorkflow._id)
            .populate('assignedDirector', 'firstName lastName email role')
            .populate('directeurGeneral', 'firstName lastName email role');
        }
      }

      if (workflow) {
        console.log(`✅ Workflow disponible pour le chat:`);
        console.log(`   ID: ${workflow._id}`);
        console.log(`   Status: ${workflow.currentStatus}`);
        console.log(`   Directeur assigné: ${workflow.assignedDirector}`);
        console.log(`   DG: ${workflow.directeurGeneral}`);
        
        // 4. VÉRIFIER QUE LE CHAT PEUT MAINTENANT FONCTIONNER
        console.log(`\n🎯 === VÉRIFICATION FONCTIONNALITÉ CHAT ===`);
        
        // Simuler les données que recevrait le frontend
        const chatData = {
          workflowId: workflow._id,
          correspondance: {
            id: testCorr._id,
            subject: testCorr.subject,
            workflowStatus: testCorr.workflowStatus,
            responseDrafts: testCorr.responseDrafts
          },
          currentStatus: workflow.currentStatus,
          assignedDirector: workflow.assignedDirector,
          directeurGeneral: workflow.directeurGeneral
        };

        console.log(`📊 Données chat disponibles:`);
        console.log(`   workflowId: ${chatData.workflowId}`);
        console.log(`   currentStatus: ${chatData.currentStatus}`);
        console.log(`   responseDrafts: ${chatData.correspondance.responseDrafts.length}`);

        // Vérifier conditions bouton approbation
        const userRole = 'DIRECTEUR_GENERAL';
        const condition1 = userRole === 'DIRECTEUR_GENERAL';
        const condition2 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(chatData.currentStatus);
        const condition3 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(chatData.correspondance.workflowStatus);
        const condition4 = chatData.correspondance.responseDrafts && 
                          chatData.correspondance.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW');

        console.log(`\n🎯 Conditions bouton approbation:`);
        console.log(`   1. user.role === 'DIRECTEUR_GENERAL': ${condition1}`);
        console.log(`   2. currentStatus DIRECTOR_DRAFT/REVISION: ${condition2}`);
        console.log(`   3. correspondance.workflowStatus DIRECTOR_DRAFT/REVISION: ${condition3}`);
        console.log(`   4. draft.status === 'PENDING_DG_REVIEW': ${condition4}`);

        const shouldShowButton = condition1 && (condition2 || condition3 || condition4);
        console.log(`\n${shouldShowButton ? '✅' : '❌'} BOUTON APPROBATION VISIBLE: ${shouldShowButton}`);

        if (shouldShowButton) {
          console.log(`🎉 SUCCÈS: Le chat DG devrait maintenant afficher le bouton d'approbation !`);
        } else {
          console.log(`❌ PROBLÈME: Le bouton ne sera pas visible`);
        }

      } else {
        console.log(`❌ Impossible de créer ou récupérer le workflow`);
      }

    } catch (error) {
      console.error(`❌ Erreur simulation API:`, error.message);
    }

    // 5. NETTOYAGE
    console.log(`\n🧹 === NETTOYAGE ===`);
    await Correspondance.findByIdAndDelete(testCorr._id);
    
    const finalWorkflow = await CorrespondenceWorkflow.findOne({ 
      correspondanceId: testCorr._id 
    });
    if (finalWorkflow) {
      await CorrespondenceWorkflow.deleteOne({ _id: finalWorkflow._id });
      console.log(`🗑️ Workflow supprimé`);
    }
    
    console.log(`✅ Correspondance supprimée`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le test
testChatWorkflowCreation();
