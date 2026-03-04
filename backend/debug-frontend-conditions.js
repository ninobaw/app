const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

/**
 * Script pour diagnostiquer pourquoi le bouton DG ne s'affiche pas côté frontend
 */

async function debugFrontendConditions() {
  try {
    console.log('🔍 ========================================');
    console.log('🔍 DEBUG CONDITIONS FRONTEND BOUTON DG');
    console.log('🔍 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. VÉRIFIER LA CORRESPONDANCE CRÉÉE
    console.log('📋 === VÉRIFICATION CORRESPONDANCE CRÉÉE ===');
    
    const correspondanceTest = await Correspondance.findOne({
      title: 'Demande de formation en sécurité aéroportuaire'
    }).lean();

    if (!correspondanceTest) {
      console.log('❌ Correspondance de test non trouvée !');
      return;
    }

    console.log(`✅ Correspondance trouvée: ${correspondanceTest._id}`);
    console.log(`📋 Titre: ${correspondanceTest.title}`);
    console.log(`🔄 Workflow Status: ${correspondanceTest.workflowStatus}`);
    console.log(`📝 Response Drafts: ${correspondanceTest.responseDrafts?.length || 0}`);
    
    if (correspondanceTest.responseDrafts && correspondanceTest.responseDrafts.length > 0) {
      correspondanceTest.responseDrafts.forEach((draft, index) => {
        console.log(`   Draft ${index + 1}:`);
        console.log(`     Status: ${draft.status}`);
        console.log(`     Directeur: ${draft.directorName}`);
        console.log(`     Urgent: ${draft.isUrgent}`);
        console.log(`     Créé: ${draft.createdAt}`);
      });
    }

    // 2. VÉRIFIER LE WORKFLOW CORRESPONDANT
    console.log('\n🔄 === VÉRIFICATION WORKFLOW ===');
    
    const workflow = await CorrespondenceWorkflow.findOne({
      correspondanceId: correspondanceTest._id
    }).lean();

    if (!workflow) {
      console.log('❌ Workflow non trouvé !');
      return;
    }

    console.log(`✅ Workflow trouvé: ${workflow._id}`);
    console.log(`🔄 Current Status: ${workflow.currentStatus}`);
    console.log(`👑 DG assigné: ${workflow.directeurGeneral}`);
    console.log(`👤 Directeur assigné: ${workflow.assignedDirector}`);
    console.log(`📝 Response Drafts dans workflow: ${workflow.responseDrafts?.length || 0}`);

    if (workflow.responseDrafts && workflow.responseDrafts.length > 0) {
      workflow.responseDrafts.forEach((draft, index) => {
        console.log(`   Workflow Draft ${index + 1}:`);
        console.log(`     Status: ${draft.status}`);
        console.log(`     Directeur: ${draft.directorName}`);
        console.log(`     Urgent: ${draft.isUrgent}`);
      });
    }

    // 3. SIMULER LA ROUTE FRONTEND
    console.log('\n🌐 === SIMULATION ROUTE FRONTEND ===');
    console.log('Simulation de: GET /api/workflow-chat/{workflowId}/messages');
    
    // Simuler ce que fait la route workflowChatRoutes.js
    const enrichedWorkflow = await CorrespondenceWorkflow.findById(workflow._id)
      .populate('correspondanceId')
      .populate('createdBy', 'firstName lastName email role')
      .populate('assignedDirector', 'firstName lastName email role')
      .populate('directeurGeneral', 'firstName lastName email role')
      .lean();

    console.log('📊 Données enrichies workflow:');
    console.log(`   Workflow ID: ${enrichedWorkflow._id}`);
    console.log(`   Current Status: ${enrichedWorkflow.currentStatus}`);
    console.log(`   Correspondance:`, {
      id: enrichedWorkflow.correspondanceId?._id,
      workflowStatus: enrichedWorkflow.correspondanceId?.workflowStatus,
      responseDrafts: enrichedWorkflow.correspondanceId?.responseDrafts?.length || 0
    });

    // 4. VÉRIFIER LES CONDITIONS EXACTES DU FRONTEND
    console.log('\n🎯 === CONDITIONS FRONTEND EXACTES ===');
    
    // Simuler user.role === 'DIRECTEUR_GENERAL'
    const userRole = 'DIRECTEUR_GENERAL';
    
    // Conditions du WorkflowChatPanel.tsx
    const condition1 = userRole === 'DIRECTEUR_GENERAL';
    const condition2 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(enrichedWorkflow.currentStatus);
    const condition3 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(enrichedWorkflow.correspondanceId?.workflowStatus);
    const condition4 = enrichedWorkflow.correspondanceId?.responseDrafts && 
                      enrichedWorkflow.correspondanceId.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW');

    const shouldShow = condition1 && (condition2 || condition3 || condition4);

    console.log('🎯 Conditions WorkflowChatPanel:');
    console.log(`   condition1 (userRole === 'DIRECTEUR_GENERAL'): ${condition1}`);
    console.log(`   condition2 (currentStatus in [DIRECTOR_DRAFT, DIRECTOR_REVISION]): ${condition2}`);
    console.log(`     → currentStatus: "${enrichedWorkflow.currentStatus}"`);
    console.log(`   condition3 (corrWorkflowStatus in [DIRECTOR_DRAFT, DIRECTOR_REVISION]): ${condition3}`);
    console.log(`     → corrWorkflowStatus: "${enrichedWorkflow.correspondanceId?.workflowStatus}"`);
    console.log(`   condition4 (responseDrafts avec PENDING_DG_REVIEW): ${condition4}`);
    
    if (enrichedWorkflow.correspondanceId?.responseDrafts) {
      console.log(`     → responseDrafts count: ${enrichedWorkflow.correspondanceId.responseDrafts.length}`);
      enrichedWorkflow.correspondanceId.responseDrafts.forEach((draft, index) => {
        console.log(`     → draft[${index}].status: "${draft.status}"`);
      });
      const pendingCount = enrichedWorkflow.correspondanceId.responseDrafts.filter(d => d.status === 'PENDING_DG_REVIEW').length;
      console.log(`     → PENDING_DG_REVIEW count: ${pendingCount}`);
    }

    console.log(`\n🎯 RÉSULTAT FINAL: shouldShow = ${shouldShow}`);
    console.log(`   Logique: ${condition1} && (${condition2} || ${condition3} || ${condition4})`);
    console.log(`   Logique: true && (${condition2} || ${condition3} || ${condition4})`);
    console.log(`   Logique: true && ${condition2 || condition3 || condition4}`);

    // 5. VÉRIFIER LA STRUCTURE EXACTE DES DONNÉES
    console.log('\n📊 === STRUCTURE DONNÉES POUR FRONTEND ===');
    
    const frontendData = {
      workflowId: enrichedWorkflow._id,
      currentStatus: enrichedWorkflow.currentStatus,
      correspondance: {
        id: enrichedWorkflow.correspondanceId?._id,
        workflowStatus: enrichedWorkflow.correspondanceId?.workflowStatus,
        responseDrafts: enrichedWorkflow.correspondanceId?.responseDrafts || []
      },
      chatMessages: enrichedWorkflow.chatMessages || []
    };

    console.log('📊 Structure exacte envoyée au frontend:');
    console.log(JSON.stringify(frontendData, null, 2));

    // 6. RECOMMANDATIONS
    console.log('\n💡 === RECOMMANDATIONS ===');
    
    if (!shouldShow) {
      console.log('❌ Le bouton ne devrait PAS s\'afficher selon les conditions');
      console.log('🔍 Problèmes identifiés:');
      if (!condition1) console.log('   - User n\'est pas DIRECTEUR_GENERAL');
      if (!condition2) console.log(`   - currentStatus "${enrichedWorkflow.currentStatus}" n\'est pas DIRECTOR_DRAFT/DIRECTOR_REVISION`);
      if (!condition3) console.log(`   - corrWorkflowStatus "${enrichedWorkflow.correspondanceId?.workflowStatus}" n\'est pas DIRECTOR_DRAFT/DIRECTOR_REVISION`);
      if (!condition4) console.log('   - Aucun draft avec status PENDING_DG_REVIEW');
    } else {
      console.log('✅ Le bouton DEVRAIT s\'afficher selon les conditions');
      console.log('🔍 Vérifications côté frontend:');
      console.log('   1. Vérifiez que l\'utilisateur connecté a bien le rôle DIRECTEUR_GENERAL');
      console.log('   2. Vérifiez les logs de la console browser dans WorkflowChatPanel');
      console.log('   3. Vérifiez que workflowData est bien chargé');
      console.log('   4. Vérifiez que la route /api/workflow-chat/{workflowId}/messages fonctionne');
    }

    // 7. TEST DE LA ROUTE API
    console.log('\n🧪 === TEST ROUTE API ===');
    console.log(`🌐 Testez cette URL dans votre browser (connecté en tant que DG):`);
    console.log(`   http://localhost:5000/api/workflow-chat/${workflow._id}/messages`);
    console.log(`\n📋 Ou utilisez cette correspondance dans l'interface:`);
    console.log(`   ID: ${correspondanceTest._id}`);
    console.log(`   Titre: "${correspondanceTest.title}"`);

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le diagnostic
debugFrontendConditions();
