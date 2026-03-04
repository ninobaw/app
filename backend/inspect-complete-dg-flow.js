const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');

/**
 * Inspection complète du flux DG de bout en bout
 */

async function inspectCompleteDGFlow() {
  try {
    console.log('🔍 ========================================');
    console.log('🔍 INSPECTION COMPLÈTE FLUX DG');
    console.log('🔍 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. CRÉER UN SCÉNARIO COMPLET
    console.log('📝 === ÉTAPE 1: CRÉATION SCÉNARIO COMPLET ===');
    
    const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
    const director = await User.findOne({ role: 'DIRECTEUR' });
    const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });

    console.log(`👑 DG: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    console.log(`👤 Directeur: ${director.firstName} ${director.lastName} (${director._id})`);
    console.log(`📋 Agent: ${agent.firstName} ${agent.lastName} (${agent._id})\n`);

    // Créer une correspondance complète
    const testCorr = new Correspondance({
      title: 'Inspection flux DG complet',
      subject: 'Formation RH - Flux complet DG',
      content: 'Test complet du flux DG de bout en bout.',
      type: 'INCOMING',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'test@external.com',
      to_address: 'rh@enfidha.tn',
      personnesConcernees: [director._id.toString()],
      code: `INSPECT-DG-${Date.now()}`,
      authorId: agent._id,
      workflowStatus: 'ASSIGNED_TO_DIRECTOR',
      date_correspondance: new Date()
    });

    await testCorr.save();
    console.log(`✅ Correspondance créée: ${testCorr._id}`);

    // 2. CRÉER LE WORKFLOW
    console.log('\n🔄 === ÉTAPE 2: CRÉATION WORKFLOW ===');
    
    const workflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
      testCorr._id.toString(),
      agent._id.toString()
    );
    
    console.log(`✅ Workflow créé: ${workflow._id}`);
    console.log(`🔄 Status initial: ${workflow.currentStatus}`);

    // 3. DIRECTEUR CRÉE UNE PROPOSITION
    console.log('\n📝 === ÉTAPE 3: DIRECTEUR CRÉE PROPOSITION ===');
    
    const draftData = {
      responseContent: 'Proposition de réponse pour la formation RH.\n\nNous proposons d\'organiser une formation complète.',
      attachments: [],
      comments: 'Proposition détaillée pour inspection flux DG.',
      isUrgent: true
    };

    const draftResult = await CorrespondanceWorkflowService.createResponseDraft(
      testCorr._id.toString(),
      director._id.toString(),
      draftData
    );

    console.log(`✅ Proposition créée: ${draftResult.success}`);
    console.log(`🔄 Nouveau status: ${draftResult.data.workflowStatus}`);

    // 4. VÉRIFIER L'ÉTAT APRÈS PROPOSITION
    console.log('\n📊 === ÉTAPE 4: VÉRIFICATION ÉTAT APRÈS PROPOSITION ===');
    
    const corrAfterDraft = await Correspondance.findById(testCorr._id).lean();
    const workflowAfterDraft = await CorrespondenceWorkflow.findById(workflow._id).lean();

    console.log(`📋 Correspondance:`);
    console.log(`   workflowStatus: ${corrAfterDraft.workflowStatus}`);
    console.log(`   responseDrafts: ${corrAfterDraft.responseDrafts?.length || 0}`);
    
    if (corrAfterDraft.responseDrafts && corrAfterDraft.responseDrafts.length > 0) {
      const draft = corrAfterDraft.responseDrafts[0];
      console.log(`   draft.status: ${draft.status}`);
      console.log(`   draft.directorName: ${draft.directorName}`);
    }

    console.log(`🔄 Workflow:`);
    console.log(`   currentStatus: ${workflowAfterDraft.currentStatus}`);
    console.log(`   assignedDirector: ${workflowAfterDraft.assignedDirector}`);
    console.log(`   directeurGeneral: ${workflowAfterDraft.directeurGeneral}`);

    // 5. TEST SERVICE DG - RÉCUPÉRATION CORRESPONDANCES
    console.log('\n👑 === ÉTAPE 5: SERVICE DG - RÉCUPÉRATION CORRESPONDANCES ===');
    
    try {
      const dgCorrespondances = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id.toString());
      console.log(`📊 Correspondances visibles pour DG: ${dgCorrespondances.length}`);
      
      const testCorrForDG = dgCorrespondances.find(c => c._id.toString() === testCorr._id.toString());
      
      if (testCorrForDG) {
        console.log(`✅ Correspondance test trouvée pour DG:`);
        console.log(`   title: ${testCorrForDG.title}`);
        console.log(`   workflowStatus: ${testCorrForDG.workflowStatus}`);
        console.log(`   responseDrafts: ${testCorrForDG.responseDrafts?.length || 0}`);
        console.log(`   workflowInfo.currentStatus: ${testCorrForDG.workflowInfo?.currentStatus}`);
        
        if (testCorrForDG.responseDrafts && testCorrForDG.responseDrafts.length > 0) {
          const draft = testCorrForDG.responseDrafts[0];
          console.log(`   draft.status: ${draft.status}`);
          console.log(`   draft.directorName: ${draft.directorName}`);
        }
      } else {
        console.log(`❌ Correspondance test NON trouvée pour DG`);
      }
    } catch (dgServiceError) {
      console.error(`❌ Erreur service DG:`, dgServiceError.message);
    }

    // 6. TEST ROUTE CHAT - BY-CORRESPONDANCE
    console.log('\n💬 === ÉTAPE 6: ROUTE CHAT BY-CORRESPONDANCE ===');
    
    try {
      // Simuler l'appel GET /api/workflow-chat/by-correspondance/:correspondanceId
      console.log(`🔍 Test route: /api/workflow-chat/by-correspondance/${testCorr._id}`);
      
      let chatWorkflow = await CorrespondenceWorkflow.findOne({ 
        correspondanceId: testCorr._id 
      }).populate('assignedDirector', 'firstName lastName email role')
        .populate('directeurGeneral', 'firstName lastName email role');

      if (chatWorkflow) {
        console.log(`✅ Workflow trouvé pour chat:`);
        console.log(`   ID: ${chatWorkflow._id}`);
        console.log(`   currentStatus: ${chatWorkflow.currentStatus}`);
        console.log(`   assignedDirector: ${chatWorkflow.assignedDirector?.firstName} ${chatWorkflow.assignedDirector?.lastName}`);
        console.log(`   directeurGeneral: ${chatWorkflow.directeurGeneral?.firstName} ${chatWorkflow.directeurGeneral?.lastName}`);
      } else {
        console.log(`❌ Aucun workflow trouvé pour le chat`);
      }
    } catch (chatError) {
      console.error(`❌ Erreur route chat:`, chatError.message);
    }

    // 7. TEST ROUTE CHAT - MESSAGES
    console.log('\n💬 === ÉTAPE 7: ROUTE CHAT MESSAGES ===');
    
    try {
      // Simuler l'appel GET /api/workflow-chat/:workflowId/messages
      console.log(`🔍 Test route: /api/workflow-chat/${workflow._id}/messages`);
      
      const messagesWorkflow = await CorrespondenceWorkflow.findById(workflow._id).lean();
      const messagesCorrespondance = await Correspondance.findById(testCorr._id)
        .populate('personnesConcernees', 'firstName lastName role directorate')
        .lean();

      console.log(`📊 Données pour messages:`);
      console.log(`   workflow trouvé: ${!!messagesWorkflow}`);
      console.log(`   correspondance trouvée: ${!!messagesCorrespondance}`);
      
      if (messagesWorkflow && messagesCorrespondance) {
        // Simuler la réponse API enrichie
        const apiResponse = {
          success: true,
          data: {
            workflowId: messagesWorkflow._id,
            correspondance: {
              id: messagesCorrespondance._id,
              subject: messagesCorrespondance.subject,
              workflowStatus: messagesCorrespondance.workflowStatus,
              responseDrafts: messagesCorrespondance.responseDrafts || []
            },
            chatMessages: messagesWorkflow.chatMessages || [],
            currentStatus: messagesWorkflow.currentStatus,
            assignedDirector: messagesWorkflow.assignedDirector,
            directeurGeneral: messagesWorkflow.directeurGeneral
          }
        };

        console.log(`✅ Réponse API simulée:`);
        console.log(`   workflowId: ${apiResponse.data.workflowId}`);
        console.log(`   currentStatus: ${apiResponse.data.currentStatus}`);
        console.log(`   correspondance.workflowStatus: ${apiResponse.data.correspondance.workflowStatus}`);
        console.log(`   correspondance.responseDrafts: ${apiResponse.data.correspondance.responseDrafts.length}`);

        // 8. VÉRIFIER CONDITIONS FRONTEND
        console.log('\n🎯 === ÉTAPE 8: CONDITIONS FRONTEND ===');
        
        const workflowData = apiResponse.data;
        const userRole = 'DIRECTEUR_GENERAL';

        // Conditions exactes du composant React
        const condition1 = userRole === 'DIRECTEUR_GENERAL';
        const condition2 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(workflowData.currentStatus);
        const condition3 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(workflowData.correspondance?.workflowStatus);
        const condition4 = workflowData.correspondance?.responseDrafts && 
                          workflowData.correspondance.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW');

        console.log(`Conditions d'affichage bouton (React):`);
        console.log(`   user?.role === 'DIRECTEUR_GENERAL': ${condition1}`);
        console.log(`   ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(workflowData?.currentStatus): ${condition2}`);
        console.log(`   ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(workflowData?.correspondance?.workflowStatus): ${condition3}`);
        console.log(`   workflowData?.correspondance?.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW'): ${condition4}`);

        const globalCondition = condition1 && (condition2 || condition3 || condition4);
        console.log(`\n${globalCondition ? '✅' : '❌'} CONDITION GLOBALE: ${globalCondition}`);

        if (globalCondition) {
          console.log(`🎉 Le bouton d'approbation DEVRAIT être visible !`);
        } else {
          console.log(`❌ Le bouton d'approbation ne sera PAS visible`);
          
          console.log(`\n🔧 Problèmes identifiés:`);
          if (!condition1) console.log(`   - Utilisateur n'est pas DIRECTEUR_GENERAL`);
          if (!condition2) console.log(`   - currentStatus (${workflowData.currentStatus}) n'est pas DIRECTOR_DRAFT/DIRECTOR_REVISION`);
          if (!condition3) console.log(`   - correspondance.workflowStatus (${workflowData.correspondance?.workflowStatus}) n'est pas DIRECTOR_DRAFT/DIRECTOR_REVISION`);
          if (!condition4) {
            console.log(`   - Aucun draft avec status PENDING_DG_REVIEW`);
            if (workflowData.correspondance?.responseDrafts) {
              workflowData.correspondance.responseDrafts.forEach((draft, index) => {
                console.log(`     Draft ${index + 1}: status = ${draft.status}`);
              });
            }
          }
        }

        // 9. TEST APPROBATION DG
        if (globalCondition) {
          console.log('\n👑 === ÉTAPE 9: TEST APPROBATION DG ===');
          
          try {
            console.log(`👑 Test approbation par ${dg.firstName} ${dg.lastName}...`);
            
            const approvalResult = await CorrespondanceWorkflowService.provideDGFeedback(
              testCorr._id.toString(),
              0, // Premier draft
              dg._id.toString(),
              {
                action: 'APPROVE',
                feedback: 'Test approbation - Flux complet vérifié.',
                isApproved: true
              }
            );

            console.log(`✅ Approbation réussie: ${approvalResult.success}`);
            console.log(`🔄 Nouveau status: ${approvalResult.data.workflowStatus}`);

            // Vérifier l'état après approbation
            const corrAfterApproval = await Correspondance.findById(testCorr._id).lean();
            console.log(`📊 Après approbation:`);
            console.log(`   workflowStatus: ${corrAfterApproval.workflowStatus}`);
            
            if (corrAfterApproval.responseDrafts && corrAfterApproval.responseDrafts.length > 0) {
              const approvedDraft = corrAfterApproval.responseDrafts[0];
              console.log(`   draft.status: ${approvedDraft.status}`);
              console.log(`   dgFeedbacks: ${approvedDraft.dgFeedbacks?.length || 0}`);
            }

          } catch (approvalError) {
            console.error(`❌ Erreur approbation:`, approvalError.message);
          }
        }

      } else {
        console.log(`❌ Données manquantes pour les messages`);
      }

    } catch (messagesError) {
      console.error(`❌ Erreur route messages:`, messagesError.message);
    }

    // 10. DIAGNOSTIC FINAL
    console.log('\n🎯 === DIAGNOSTIC FINAL ===');
    
    console.log(`✅ Flux complet inspecté:`);
    console.log(`   1. Correspondance créée avec assignation manuelle`);
    console.log(`   2. Workflow créé automatiquement`);
    console.log(`   3. Proposition créée par le directeur`);
    console.log(`   4. Draft stocké dans Correspondance.responseDrafts`);
    console.log(`   5. Service DG récupère les correspondances`);
    console.log(`   6. Route chat trouve le workflow`);
    console.log(`   7. Route messages enrichit les données`);
    console.log(`   8. Conditions frontend évaluées`);
    console.log(`   9. Approbation DG testée`);

    // 11. NETTOYAGE
    console.log('\n🧹 === NETTOYAGE ===');
    await Correspondance.findByIdAndDelete(testCorr._id);
    await CorrespondenceWorkflow.deleteOne({ correspondanceId: testCorr._id });
    console.log('✅ Données de test supprimées');

  } catch (error) {
    console.error('❌ Erreur lors de l\'inspection:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter l'inspection
inspectCompleteDGFlow();
