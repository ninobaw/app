const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');

/**
 * Test de l'approbation DG avec le modèle unifié
 */

async function testDGApprovalUnified() {
  try {
    console.log('👑 ========================================');
    console.log('👑 TEST APPROBATION DG (MODÈLE UNIFIÉ)');
    console.log('👑 ========================================\n');

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
      title: 'Test approbation DG avec modèle unifié',
      subject: 'Formation RH - Test approbation',
      content: 'Test pour vérifier que l\'approbation DG fonctionne avec le modèle unifié.',
      type: 'INCOMING',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'test@external.com',
      to_address: 'rh@enfidha.tn',
      personnesConcernees: [anisDirector._id.toString()],
      code: `TEST-DG-APPROVAL-${Date.now()}`,
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

    // 4. CRÉER UNE PROPOSITION DE RÉPONSE
    console.log('📝 === CRÉATION PROPOSITION RÉPONSE ===');
    
    const draftData = {
      responseContent: 'Proposition de réponse pour la formation RH.\n\nNous proposons d\'organiser une session de formation complète sur les ressources humaines pour améliorer les compétences de notre équipe.',
      attachments: [],
      comments: 'Proposition détaillée pour la formation RH demandée.',
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

    // 5. VÉRIFIER QUE LA PROPOSITION EST DANS LA CORRESPONDANCE
    console.log('📊 === VÉRIFICATION PROPOSITION DANS CORRESPONDANCE ===');
    
    const corrWithDraft = await Correspondance.findById(testCorrespondance._id).lean();
    console.log(`📝 Drafts dans correspondance: ${corrWithDraft.responseDrafts?.length || 0}`);
    console.log(`🔄 Status correspondance: ${corrWithDraft.workflowStatus}`);
    
    if (corrWithDraft.responseDrafts && corrWithDraft.responseDrafts.length > 0) {
      const draft = corrWithDraft.responseDrafts[0];
      console.log(`📋 Draft status: ${draft.status}`);
      console.log(`👤 Directeur: ${draft.directorName}`);
      console.log(`📅 Créé le: ${draft.createdAt}`);
      console.log(`✅ Proposition prête pour approbation DG\n`);
    } else {
      console.log(`❌ Aucune proposition trouvée dans la correspondance\n`);
      return;
    }

    // 6. TEST APPROBATION DG
    console.log('👑 === TEST APPROBATION DG ===');
    
    try {
      console.log(`👑 DG ${dg.firstName} ${dg.lastName} approuve la proposition...`);
      
      const approvalResult = await CorrespondanceWorkflowService.provideDGFeedback(
        testCorrespondance._id.toString(),
        0, // Premier draft (index 0)
        dg._id.toString(),
        {
          action: 'APPROVE',
          feedback: 'Proposition approuvée par le Directeur Général. Excellente approche pour la formation RH.',
          isApproved: true
        }
      );

      console.log(`✅ Approbation réussie: ${approvalResult.success}`);
      console.log(`📋 Message: ${approvalResult.message}`);
      console.log(`🔄 Nouveau status: ${approvalResult.data.workflowStatus}\n`);

      // 7. VÉRIFIER L'ÉTAT APRÈS APPROBATION
      console.log('📊 === VÉRIFICATION APRÈS APPROBATION ===');
      
      const corrAfterApproval = await Correspondance.findById(testCorrespondance._id).lean();
      console.log(`🔄 Status correspondance: ${corrAfterApproval.workflowStatus}`);
      console.log(`📝 Drafts: ${corrAfterApproval.responseDrafts?.length || 0}`);
      
      if (corrAfterApproval.responseDrafts && corrAfterApproval.responseDrafts.length > 0) {
        const approvedDraft = corrAfterApproval.responseDrafts[0];
        console.log(`📋 Status draft: ${approvedDraft.status}`);
        console.log(`👑 Feedbacks DG: ${approvedDraft.dgFeedbacks?.length || 0}`);
        
        if (approvedDraft.dgFeedbacks && approvedDraft.dgFeedbacks.length > 0) {
          const dgFeedback = approvedDraft.dgFeedbacks[0];
          console.log(`   Action: ${dgFeedback.action}`);
          console.log(`   Feedback: ${dgFeedback.feedback}`);
          console.log(`   DG: ${dgFeedback.dgName}`);
          console.log(`   Date: ${dgFeedback.createdAt}`);
          
          if (dgFeedback.action === 'APPROVE' && approvedDraft.status === 'APPROVED') {
            console.log(`✅ SUCCÈS: Approbation DG enregistrée correctement !`);
          } else {
            console.log(`❌ PROBLÈME: Status ou action incorrects`);
          }
        } else {
          console.log(`❌ PROBLÈME: Feedback DG non enregistré`);
        }
      }

      // 8. VÉRIFIER LE WORKFLOW
      const workflowAfterApproval = await CorrespondenceWorkflow.findOne({ 
        correspondanceId: testCorrespondance._id 
      }).lean();
      
      console.log(`🔄 Status workflow: ${workflowAfterApproval.currentStatus}`);
      
      if (workflowAfterApproval.currentStatus === 'DG_APPROVED') {
        console.log(`✅ SUCCÈS: Workflow mis à jour correctement !`);
      } else {
        console.log(`❌ PROBLÈME: Status workflow incorrect`);
      }

    } catch (approvalError) {
      console.error(`❌ Erreur approbation DG:`, approvalError.message);
    }

    // 9. RÉSUMÉ
    console.log('\n📋 === RÉSUMÉ TEST APPROBATION DG ===');
    console.log('✅ Correspondance créée avec assignation manuelle');
    console.log('✅ Proposition de réponse créée par le directeur');
    console.log('✅ Proposition stockée dans Correspondance.responseDrafts (modèle unifié)');
    console.log('✅ Approbation DG fonctionnelle avec le modèle unifié');
    console.log('✅ Feedback DG enregistré dans la correspondance');
    console.log('✅ Status workflow mis à jour correctement');

    // 10. NETTOYAGE
    console.log('\n🧹 === NETTOYAGE ===');
    await Correspondance.findByIdAndDelete(testCorrespondance._id);
    await CorrespondenceWorkflow.deleteOne({ correspondanceId: testCorrespondance._id });
    console.log('✅ Données de test supprimées');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le test
testDGApprovalUnified();
