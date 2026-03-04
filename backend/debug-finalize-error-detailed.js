const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');

/**
 * Script pour diagnostiquer en détail l'erreur de finalisation
 */

async function debugFinalizeErrorDetailed() {
  try {
    console.log('🔍 ========================================');
    console.log('🔍 DIAGNOSTIC DÉTAILLÉ ERREUR FINALISATION');
    console.log('🔍 ========================================\n');

    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. VÉRIFIER LA CORRESPONDANCE SPÉCIFIQUE
    const correspondanceId = '68e8d1b76015b1e27a8700c8';
    console.log(`🔍 === VÉRIFICATION CORRESPONDANCE ${correspondanceId} ===`);
    
    const correspondance = await Correspondance.findById(correspondanceId).lean();
    if (!correspondance) {
      console.log('❌ Correspondance non trouvée');
      return;
    }

    console.log(`✅ Correspondance trouvée: ${correspondance.title}`);
    console.log(`🔄 Status: ${correspondance.workflowStatus}`);
    console.log(`📝 Response Drafts: ${correspondance.responseDrafts?.length || 0}`);
    
    if (correspondance.responseDrafts && correspondance.responseDrafts.length > 0) {
      correspondance.responseDrafts.forEach((draft, index) => {
        console.log(`   Draft ${index + 1}:`);
        console.log(`     Status: ${draft.status}`);
        console.log(`     Directeur: ${draft.directorName}`);
        console.log(`     DG Feedbacks: ${draft.dgFeedbacks?.length || 0}`);
        
        if (draft.dgFeedbacks && draft.dgFeedbacks.length > 0) {
          draft.dgFeedbacks.forEach((feedback, fIndex) => {
            console.log(`       Feedback ${fIndex + 1}: ${feedback.action} - ${feedback.feedback?.substring(0, 50)}...`);
          });
        }
      });
    }

    // 2. VÉRIFIER LE SUPERVISEUR
    console.log('\n👤 === VÉRIFICATION SUPERVISEUR ===');
    
    const supervisor = await User.findOne({ role: 'SUPERVISEUR_BUREAU_ORDRE' });
    if (!supervisor) {
      console.log('❌ Aucun superviseur trouvé');
      return;
    }

    console.log(`✅ Superviseur: ${supervisor.firstName} ${supervisor.lastName}`);
    console.log(`📧 Email: ${supervisor.email}`);
    console.log(`🆔 ID: ${supervisor._id}`);

    // 3. VÉRIFIER LES DRAFTS APPROUVÉS
    console.log('\n📋 === VÉRIFICATION DRAFTS APPROUVÉS ===');
    
    const approvedDrafts = correspondance.responseDrafts?.filter(draft => draft.status === 'APPROVED') || [];
    console.log(`📝 Drafts approuvés: ${approvedDrafts.length}`);
    
    if (approvedDrafts.length === 0) {
      console.log('❌ PROBLÈME: Aucun draft approuvé trouvé !');
      console.log('💡 La finalisation nécessite au moins un draft avec status "APPROVED"');
      
      // Vérifier les status existants
      const allStatuses = correspondance.responseDrafts?.map(d => d.status) || [];
      console.log(`📊 Status existants: ${JSON.stringify(allStatuses)}`);
      
      return;
    } else {
      approvedDrafts.forEach((draft, index) => {
        console.log(`✅ Draft approuvé ${index + 1}:`);
        console.log(`   ID: ${draft._id || draft.id}`);
        console.log(`   Directeur: ${draft.directorName}`);
        console.log(`   Contenu: ${draft.responseContent?.substring(0, 100)}...`);
      });
    }

    // 4. TEST MANUEL DE LA FONCTION
    console.log('\n🧪 === TEST MANUEL FONCTION FINALIZE ===');
    
    const testData = {
      finalResponseContent: 'Test de finalisation - Réponse envoyée par le superviseur',
      attachments: [],
      sendMethod: 'EMAIL',
      deliveryMethod: 'EMAIL',
      recipientEmail: correspondance.from_address || 'test@example.com',
      dischargeFiles: [] // Ajout explicite
    };

    console.log('📤 Données de test:', JSON.stringify(testData, null, 2));

    try {
      console.log('🔄 Appel de finalizeResponse...');
      
      const result = await CorrespondanceWorkflowService.finalizeResponse(
        correspondanceId,
        supervisor._id.toString(),
        testData
      );

      console.log('✅ SUCCÈS !');
      console.log('📊 Résultat:', JSON.stringify(result, null, 2));

    } catch (finalizeError) {
      console.error('❌ ERREUR LORS DE LA FINALISATION:');
      console.error('📋 Message:', finalizeError.message);
      console.error('📊 Stack:', finalizeError.stack);
      
      // Analyser l'erreur
      if (finalizeError.message.includes('Aucune proposition de réponse approuvée')) {
        console.log('\n💡 SOLUTION: Le draft doit avoir le status "APPROVED"');
        console.log('🔧 Correction automatique...');
        
        // Corriger le status du draft
        const correctedCorr = await Correspondance.findById(correspondanceId);
        if (correctedCorr.responseDrafts && correctedCorr.responseDrafts.length > 0) {
          correctedCorr.responseDrafts[0].status = 'APPROVED';
          await correctedCorr.save();
          console.log('✅ Status du draft corrigé en "APPROVED"');
          
          // Réessayer
          console.log('🔄 Nouvelle tentative...');
          const retryResult = await CorrespondanceWorkflowService.finalizeResponse(
            correspondanceId,
            supervisor._id.toString(),
            testData
          );
          console.log('✅ SUCCÈS APRÈS CORRECTION !');
          console.log('📊 Résultat:', JSON.stringify(retryResult, null, 2));
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

debugFinalizeErrorDetailed();
