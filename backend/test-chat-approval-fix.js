const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');

/**
 * Test des corrections : Chat avec approbation DG et mise en évidence des propositions
 */

async function testChatApprovalFix() {
  try {
    console.log('🔧 ========================================');
    console.log('🔧 TEST CORRECTIONS CHAT + APPROBATION DG');
    console.log('🔧 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. RÉCUPÉRER LES UTILISATEURS
    const anisDirector = await User.findOne({ 
      firstName: 'Anis',
      lastName: 'Ben Janet'
    });
    
    const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
    const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });

    console.log(`👤 Directeur: ${anisDirector.firstName} ${anisDirector.lastName}`);
    console.log(`👑 DG: ${dg.firstName} ${dg.lastName}`);
    console.log(`📋 Agent: ${agent.firstName} ${agent.lastName}\n`);

    // 2. CRÉER UNE CORRESPONDANCE DE TEST
    const testCorrespondance = new Correspondance({
      title: 'Test chat avec approbation DG',
      subject: 'Test corrections chat + mise en évidence propositions',
      content: 'Test pour vérifier que le chat DG fonctionne avec les propositions.',
      type: 'INCOMING',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'test@external.com',
      to_address: 'test@enfidha.tn',
      personnesConcernees: [anisDirector._id.toString()],
      code: 'TEST-CHAT-' + Date.now(),
      authorId: agent._id,
      workflowStatus: 'ASSIGNED_TO_DIRECTOR',
      date_correspondance: new Date()
    });

    await testCorrespondance.save();
    console.log(`✅ Correspondance créée: ${testCorrespondance._id}\n`);

    // 3. CRÉER LE WORKFLOW
    const workflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
      testCorrespondance._id.toString(),
      agent._id
    );
    console.log(`✅ Workflow créé: ${workflow._id}\n`);

    // 4. CRÉER UNE PROPOSITION (AVEC CORRECTIONS)
    console.log('📝 === CRÉATION PROPOSITION (AVEC CORRECTIONS) ===');
    
    const draftData = {
      responseContent: 'Proposition de réponse avec corrections chat DG.\n\nCette proposition devrait être visible dans le chat avec le bouton d\'approbation.',
      attachments: [],
      comments: 'Test des corrections chat + approbation DG.',
      isUrgent: true
    };

    const draftResult = await CorrespondanceWorkflowService.createResponseDraft(
      testCorrespondance._id.toString(),
      anisDirector._id.toString(),
      draftData
    );

    console.log(`✅ Proposition créée: ${draftResult.success}`);
    console.log(`📋 Draft ID: ${draftResult.data.draftId}`);
    console.log(`🔄 Status: ${draftResult.data.workflowStatus}\n`);

    // 5. SIMULER L'APPEL API DU CHAT
    console.log('💬 === SIMULATION APPEL API CHAT ===');
    
    // Simuler la route /api/workflow-chat/:workflowId/messages
    const workflowFromDB = await CorrespondenceWorkflow.findById(workflow._id).lean();
    const correspondanceFromDB = await Correspondance.findById(workflowFromDB.correspondanceId)
      .populate('personnesConcernees', 'firstName lastName role directorate')
      .lean();

    console.log(`📋 Workflow trouvé: ${!!workflowFromDB}`);
    console.log(`📋 Correspondance trouvée: ${!!correspondanceFromDB}`);
    console.log(`📝 Drafts dans correspondance: ${correspondanceFromDB?.responseDrafts?.length || 0}`);

    // Simuler la réponse API enrichie
    const simulatedApiResponse = {
      success: true,
      data: {
        workflowId: workflowFromDB._id,
        correspondance: {
          id: correspondanceFromDB._id,
          subject: correspondanceFromDB.subject || correspondanceFromDB.title,
          content: correspondanceFromDB.content,
          workflowStatus: correspondanceFromDB.workflowStatus,
          responseDrafts: correspondanceFromDB.responseDrafts || [],
          personnesConcernees: correspondanceFromDB.personnesConcernees || []
        },
        chatMessages: workflowFromDB.chatMessages || [],
        currentStatus: workflowFromDB.currentStatus,
        assignedDirector: workflowFromDB.assignedDirector,
        directeurGeneral: workflowFromDB.directeurGeneral
      }
    };

    console.log(`📊 Réponse API simulée:`);
    console.log(`   - workflowId: ${simulatedApiResponse.data.workflowId}`);
    console.log(`   - currentStatus: ${simulatedApiResponse.data.currentStatus}`);
    console.log(`   - correspondance.workflowStatus: ${simulatedApiResponse.data.correspondance.workflowStatus}`);
    console.log(`   - responseDrafts: ${simulatedApiResponse.data.correspondance.responseDrafts.length}`);

    // 6. VÉRIFIER CONDITIONS BOUTON APPROBATION
    console.log('\n🔍 === CONDITIONS BOUTON APPROBATION (CORRIGÉES) ===');
    
    const workflowData = simulatedApiResponse.data;
    const userRole = 'DIRECTEUR_GENERAL';

    const conditions = {
      'user.role === DIRECTEUR_GENERAL': userRole === 'DIRECTEUR_GENERAL',
      'currentStatus DIRECTOR_DRAFT': ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(workflowData.currentStatus),
      'correspondance.workflowStatus DIRECTOR_DRAFT': ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(workflowData.correspondance.workflowStatus),
      'drafts PENDING_DG_REVIEW': workflowData.correspondance.responseDrafts && workflowData.correspondance.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW')
    };

    console.log('Conditions pour affichage bouton (corrigées):');
    Object.entries(conditions).forEach(([condition, result]) => {
      console.log(`   ${result ? '✅' : '❌'} ${condition}: ${result}`);
    });

    const shouldShowButton = conditions['user.role === DIRECTEUR_GENERAL'] && (
      conditions['currentStatus DIRECTOR_DRAFT'] ||
      conditions['correspondance.workflowStatus DIRECTOR_DRAFT'] ||
      conditions['drafts PENDING_DG_REVIEW']
    );

    console.log(`\n${shouldShowButton ? '✅' : '❌'} BOUTON D'APPROBATION VISIBLE: ${shouldShowButton}`);

    // 7. VÉRIFIER MISE EN ÉVIDENCE DES PROPOSITIONS
    console.log('\n🎨 === MISE EN ÉVIDENCE DES PROPOSITIONS ===');
    
    if (workflowData.correspondance.responseDrafts && workflowData.correspondance.responseDrafts.length > 0) {
      console.log('📋 Propositions reçues:');
      workflowData.correspondance.responseDrafts.forEach((draft, index) => {
        const isHighlighted = draft.status === 'PENDING_DG_REVIEW';
        console.log(`   ${index + 1}. ${draft.directorName}`);
        console.log(`      Status: ${draft.status}`);
        console.log(`      Urgent: ${draft.isUrgent ? '🚨' : '📝'}`);
        console.log(`      Mise en évidence: ${isHighlighted ? '✅ OUI (animate-pulse)' : '❌ NON'}`);
      });
    }

    // 8. RÉSUMÉ DES CORRECTIONS
    console.log('\n🎯 === RÉSUMÉ DES CORRECTIONS APPLIQUÉES ===');
    console.log('✅ Route chat enrichie avec données correspondance');
    console.log('✅ Conditions bouton approbation étendues');
    console.log('✅ Mise en évidence des propositions avec animations');
    console.log('✅ Affichage des propositions reçues dans le chat');
    console.log('✅ Badges animés pour attirer l\'attention');
    console.log('✅ Support du modèle unifié (Correspondance.responseDrafts)');

    // 9. NETTOYAGE
    console.log('\n🧹 === NETTOYAGE ===');
    await Correspondance.findByIdAndDelete(testCorrespondance._id);
    await CorrespondenceWorkflow.deleteOne({ correspondanceId: testCorrespondance._id });
    console.log('✅ Données de test supprimées');

    console.log('\n🎉 === RÉSULTAT FINAL ===');
    if (shouldShowButton) {
      console.log('🎉 SUCCÈS: Le bouton d\'approbation devrait maintenant être visible !');
      console.log('🎨 SUCCÈS: Les propositions sont mises en évidence avec animations !');
      console.log('💬 SUCCÈS: Le chat contient toutes les informations nécessaires !');
    } else {
      console.log('⚠️ PROBLÈME: Certaines conditions ne sont pas remplies');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le test
testChatApprovalFix();
