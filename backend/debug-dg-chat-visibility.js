const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

/**
 * Debug de la visibilité du bouton d'approbation DG dans le chat
 */

async function debugDGChatVisibility() {
  try {
    console.log('🔍 ========================================');
    console.log('🔍 DEBUG VISIBILITÉ BOUTON APPROBATION DG');
    console.log('🔍 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. RÉCUPÉRER UNE CORRESPONDANCE EXISTANTE AVEC DRAFT
    console.log('📋 === RECHERCHE CORRESPONDANCE AVEC DRAFT ===');
    
    const correspondancesWithDrafts = await Correspondance.find({
      responseDrafts: { $exists: true, $ne: [] },
      workflowStatus: { $in: ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'] }
    }).populate('personnesConcernees', 'firstName lastName role').lean();

    console.log(`📊 Correspondances avec drafts trouvées: ${correspondancesWithDrafts.length}`);

    if (correspondancesWithDrafts.length === 0) {
      console.log('⚠️ Aucune correspondance avec draft trouvée');
      console.log('💡 Créons une correspondance de test...\n');
      
      // Créer une correspondance de test si aucune n'existe
      const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
      const director = await User.findOne({ role: 'DIRECTEUR' });
      const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });

      const testCorr = new Correspondance({
        title: 'Debug DG Chat - Test correspondance',
        subject: 'Test pour debug bouton approbation DG',
        content: 'Correspondance de test pour vérifier la visibilité du bouton.',
        type: 'INCOMING',
        priority: 'HIGH',
        status: 'PENDING',
        airport: 'ENFIDHA',
        from_address: 'debug@test.com',
        to_address: 'dg@enfidha.tn',
        personnesConcernees: [director._id.toString()],
        code: `DEBUG-DG-${Date.now()}`,
        authorId: agent._id,
        workflowStatus: 'DIRECTOR_DRAFT',
        responseDrafts: [{
          directorId: director._id.toString(),
          directorName: `${director.firstName} ${director.lastName}`,
          directorate: director.directorate,
          responseContent: 'Proposition de réponse de test pour debug DG.',
          attachments: [],
          comments: 'Test debug',
          isUrgent: true,
          status: 'PENDING_DG_REVIEW',
          createdAt: new Date(),
          updatedAt: new Date(),
          dgFeedbacks: []
        }],
        date_correspondance: new Date()
      });

      await testCorr.save();
      console.log(`✅ Correspondance de test créée: ${testCorr._id}`);
      
      // Utiliser cette correspondance pour le debug
      correspondancesWithDrafts.push(testCorr);
    }

    // 2. ANALYSER LA PREMIÈRE CORRESPONDANCE
    const testCorr = correspondancesWithDrafts[0];
    console.log(`\n🔍 === ANALYSE CORRESPONDANCE ${testCorr._id} ===`);
    console.log(`📋 Titre: ${testCorr.title}`);
    console.log(`🔄 workflowStatus: ${testCorr.workflowStatus}`);
    console.log(`📝 responseDrafts: ${testCorr.responseDrafts?.length || 0}`);

    if (testCorr.responseDrafts && testCorr.responseDrafts.length > 0) {
      testCorr.responseDrafts.forEach((draft, index) => {
        console.log(`   Draft ${index + 1}:`);
        console.log(`     - Status: ${draft.status}`);
        console.log(`     - Directeur: ${draft.directorName}`);
        console.log(`     - Urgent: ${draft.isUrgent}`);
        console.log(`     - Feedbacks DG: ${draft.dgFeedbacks?.length || 0}`);
      });
    }

    // 3. RÉCUPÉRER LE WORKFLOW ASSOCIÉ
    console.log(`\n🔄 === ANALYSE WORKFLOW ASSOCIÉ ===`);
    
    const workflow = await CorrespondenceWorkflow.findOne({ 
      correspondanceId: testCorr._id 
    }).lean();

    if (workflow) {
      console.log(`✅ Workflow trouvé: ${workflow._id}`);
      console.log(`🔄 currentStatus: ${workflow.currentStatus}`);
      console.log(`👑 directeurGeneral: ${workflow.directeurGeneral}`);
      console.log(`👤 assignedDirector: ${workflow.assignedDirector}`);
      console.log(`📝 responseDrafts: ${workflow.responseDrafts?.length || 0}`);
    } else {
      console.log(`❌ Aucun workflow trouvé pour cette correspondance`);
    }

    // 4. SIMULER L'APPEL API DU CHAT
    console.log(`\n💬 === SIMULATION APPEL API CHAT ===`);
    
    // Simuler la réponse de /api/workflow-chat/:workflowId/messages
    const simulatedApiResponse = {
      success: true,
      data: {
        workflowId: workflow?._id || 'no-workflow',
        correspondance: {
          id: testCorr._id,
          subject: testCorr.subject,
          workflowStatus: testCorr.workflowStatus,
          responseDrafts: testCorr.responseDrafts || []
        },
        chatMessages: workflow?.chatMessages || [],
        currentStatus: workflow?.currentStatus || testCorr.workflowStatus,
        assignedDirector: workflow?.assignedDirector,
        directeurGeneral: workflow?.directeurGeneral
      }
    };

    console.log(`📊 Données simulées pour le frontend:`);
    console.log(`   workflowId: ${simulatedApiResponse.data.workflowId}`);
    console.log(`   currentStatus: ${simulatedApiResponse.data.currentStatus}`);
    console.log(`   correspondance.workflowStatus: ${simulatedApiResponse.data.correspondance.workflowStatus}`);
    console.log(`   correspondance.responseDrafts: ${simulatedApiResponse.data.correspondance.responseDrafts.length}`);

    // 5. VÉRIFIER LES CONDITIONS D'AFFICHAGE
    console.log(`\n🎯 === CONDITIONS AFFICHAGE BOUTON DG ===`);
    
    const workflowData = simulatedApiResponse.data;
    const userRole = 'DIRECTEUR_GENERAL';

    // Conditions exactes du frontend
    const condition1 = userRole === 'DIRECTEUR_GENERAL';
    const condition2 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(workflowData.currentStatus);
    const condition3 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(workflowData.correspondance?.workflowStatus);
    const condition4 = workflowData.correspondance?.responseDrafts && 
                      workflowData.correspondance.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW');

    console.log(`Conditions d'affichage:`);
    console.log(`   1. user.role === 'DIRECTEUR_GENERAL': ${condition1}`);
    console.log(`   2. currentStatus in ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION']: ${condition2}`);
    console.log(`   3. correspondance.workflowStatus in ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION']: ${condition3}`);
    console.log(`   4. draft.status === 'PENDING_DG_REVIEW': ${condition4}`);

    const shouldShowButton = condition1 && (condition2 || condition3 || condition4);
    console.log(`\n${shouldShowButton ? '✅' : '❌'} BOUTON DEVRAIT ÊTRE VISIBLE: ${shouldShowButton}`);

    if (!shouldShowButton) {
      console.log(`\n🔧 === PROBLÈMES IDENTIFIÉS ===`);
      
      if (!condition1) {
        console.log(`❌ Utilisateur n'est pas DIRECTEUR_GENERAL`);
      }
      
      if (!condition2) {
        console.log(`❌ currentStatus (${workflowData.currentStatus}) n'est pas DIRECTOR_DRAFT/DIRECTOR_REVISION`);
      }
      
      if (!condition3) {
        console.log(`❌ correspondance.workflowStatus (${workflowData.correspondance?.workflowStatus}) n'est pas DIRECTOR_DRAFT/DIRECTOR_REVISION`);
      }
      
      if (!condition4) {
        console.log(`❌ Aucun draft avec status PENDING_DG_REVIEW`);
        if (workflowData.correspondance?.responseDrafts) {
          workflowData.correspondance.responseDrafts.forEach((draft, index) => {
            console.log(`     Draft ${index + 1} status: ${draft.status}`);
          });
        }
      }
    }

    // 6. DÉTAILS DES DRAFTS
    if (workflowData.correspondance?.responseDrafts && workflowData.correspondance.responseDrafts.length > 0) {
      console.log(`\n📝 === DÉTAILS DES DRAFTS ===`);
      
      workflowData.correspondance.responseDrafts.forEach((draft, index) => {
        console.log(`Draft ${index + 1}:`);
        console.log(`   Status: ${draft.status}`);
        console.log(`   Directeur: ${draft.directorName}`);
        console.log(`   Urgent: ${draft.isUrgent}`);
        console.log(`   Créé: ${draft.createdAt}`);
        console.log(`   Feedbacks DG: ${draft.dgFeedbacks?.length || 0}`);
        
        const isPendingDGReview = draft.status === 'PENDING_DG_REVIEW';
        console.log(`   ${isPendingDGReview ? '✅' : '❌'} En attente DG: ${isPendingDGReview}`);
      });
    }

    // 7. RECOMMANDATIONS
    console.log(`\n💡 === RECOMMANDATIONS ===`);
    
    if (shouldShowButton) {
      console.log(`✅ Le bouton devrait être visible avec ces données`);
      console.log(`🔍 Vérifiez que le frontend reçoit bien ces données`);
      console.log(`🔍 Vérifiez la console du navigateur pour les erreurs`);
    } else {
      console.log(`🔧 Pour que le bouton soit visible, il faut:`);
      
      if (!condition2 && !condition3) {
        console.log(`   1. workflowStatus ou currentStatus = 'DIRECTOR_DRAFT' ou 'DIRECTOR_REVISION'`);
      }
      
      if (!condition4) {
        console.log(`   2. Au moins un draft avec status = 'PENDING_DG_REVIEW'`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le debug
debugDGChatVisibility();
