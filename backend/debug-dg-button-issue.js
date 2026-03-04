const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

/**
 * Script de diagnostic pour identifier pourquoi le bouton d'approbation DG disparaît
 */

async function debugDGButtonIssue() {
  try {
    console.log('🔍 ========================================');
    console.log('🔍 DEBUG BOUTON APPROBATION DG DISPARU');
    console.log('🔍 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. VÉRIFIER LES UTILISATEURS
    const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
    const directeurs = await User.find({ 
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] } 
    });

    console.log('👑 === UTILISATEURS ===');
    console.log(`👑 DG trouvé: ${dg ? `${dg.firstName} ${dg.lastName}` : 'AUCUN'}`);
    console.log(`👤 Directeurs trouvés: ${directeurs.length}`);
    directeurs.forEach(d => {
      console.log(`   - ${d.firstName} ${d.lastName} (${d.role})`);
    });
    console.log();

    // 2. VÉRIFIER LES CORRESPONDANCES AVEC DRAFTS
    console.log('📋 === CORRESPONDANCES AVEC PROPOSITIONS ===');
    
    const correspondancesWithDrafts = await Correspondance.find({
      responseDrafts: { $exists: true, $ne: [] }
    }).lean();

    console.log(`📝 Correspondances avec drafts: ${correspondancesWithDrafts.length}`);
    
    if (correspondancesWithDrafts.length === 0) {
      console.log('❌ PROBLÈME IDENTIFIÉ: Aucune correspondance avec des propositions de réponse !');
      console.log('💡 Le bouton DG n\'apparaît que s\'il y a des drafts avec status PENDING_DG_REVIEW\n');
    } else {
      correspondancesWithDrafts.forEach((corr, index) => {
        console.log(`\n📋 Correspondance ${index + 1}: ${corr.title}`);
        console.log(`   ID: ${corr._id}`);
        console.log(`   Workflow Status: ${corr.workflowStatus}`);
        console.log(`   Drafts: ${corr.responseDrafts?.length || 0}`);
        
        if (corr.responseDrafts && corr.responseDrafts.length > 0) {
          corr.responseDrafts.forEach((draft, draftIndex) => {
            console.log(`   Draft ${draftIndex + 1}:`);
            console.log(`     Status: ${draft.status}`);
            console.log(`     Directeur: ${draft.directorName}`);
            console.log(`     Créé le: ${draft.createdAt}`);
            console.log(`     Urgent: ${draft.isUrgent ? 'Oui' : 'Non'}`);
            
            if (draft.status === 'PENDING_DG_REVIEW') {
              console.log(`     ✅ DRAFT PRÊT POUR APPROBATION DG !`);
            } else {
              console.log(`     ❌ Draft pas prêt (status: ${draft.status})`);
            }
          });
        }
      });
    }

    // 3. VÉRIFIER LES WORKFLOWS
    console.log('\n🔄 === WORKFLOWS ===');
    
    const workflows = await CorrespondenceWorkflow.find({}).lean();
    console.log(`🔄 Workflows trouvés: ${workflows.length}`);
    
    workflows.forEach((workflow, index) => {
      console.log(`\nWorkflow ${index + 1}:`);
      console.log(`   ID: ${workflow._id}`);
      console.log(`   Correspondance: ${workflow.correspondanceId}`);
      console.log(`   Status: ${workflow.currentStatus}`);
      console.log(`   DG assigné: ${workflow.dgId ? 'Oui' : 'Non'}`);
      console.log(`   Créé le: ${workflow.createdAt}`);
    });

    // 4. VÉRIFIER LES CONDITIONS D'AFFICHAGE DU BOUTON
    console.log('\n🎯 === ANALYSE CONDITIONS BOUTON DG ===');
    
    const conditionsAnalysis = correspondancesWithDrafts.map(corr => {
      const workflow = workflows.find(w => w.correspondanceId.toString() === corr._id.toString());
      
      const condition1 = true; // Simuler user.role === 'DIRECTEUR_GENERAL'
      const condition2 = workflow ? ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(workflow.currentStatus) : false;
      const condition3 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(corr.workflowStatus);
      const condition4 = corr.responseDrafts && corr.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW');
      
      const shouldShow = condition1 && (condition2 || condition3 || condition4);
      
      return {
        correspondanceId: corr._id,
        title: corr.title,
        condition1_userRole: condition1,
        condition2_workflowStatus: condition2,
        condition3_corrWorkflowStatus: condition3,
        condition4_pendingDrafts: condition4,
        shouldShowButton: shouldShow,
        workflowCurrentStatus: workflow?.currentStatus || 'AUCUN WORKFLOW',
        corrWorkflowStatus: corr.workflowStatus,
        pendingDraftsCount: corr.responseDrafts?.filter(d => d.status === 'PENDING_DG_REVIEW').length || 0
      };
    });

    console.log('🎯 Analyse détaillée des conditions:');
    conditionsAnalysis.forEach((analysis, index) => {
      console.log(`\n📋 Correspondance ${index + 1}: ${analysis.title}`);
      console.log(`   Condition 1 (User DG): ${analysis.condition1_userRole ? '✅' : '❌'}`);
      console.log(`   Condition 2 (Workflow Status): ${analysis.condition2_workflowStatus ? '✅' : '❌'} (${analysis.workflowCurrentStatus})`);
      console.log(`   Condition 3 (Corr Status): ${analysis.condition3_corrWorkflowStatus ? '✅' : '❌'} (${analysis.corrWorkflowStatus})`);
      console.log(`   Condition 4 (Pending Drafts): ${analysis.condition4_pendingDrafts ? '✅' : '❌'} (${analysis.pendingDraftsCount} drafts)`);
      console.log(`   RÉSULTAT: Bouton ${analysis.shouldShowButton ? '✅ VISIBLE' : '❌ CACHÉ'}`);
      
      if (!analysis.shouldShowButton) {
        console.log(`   🔍 RAISON: ${!analysis.condition1_userRole ? 'Pas DG' : 
                                    !analysis.condition2_workflowStatus && !analysis.condition3_corrWorkflowStatus && !analysis.condition4_pendingDrafts ? 
                                    'Aucune condition de statut remplie' : 'Autre'}`);
      }
    });

    // 5. RECOMMANDATIONS
    console.log('\n💡 === RECOMMANDATIONS ===');
    
    if (correspondancesWithDrafts.length === 0) {
      console.log('1. ❌ Créer une correspondance avec proposition de réponse');
      console.log('2. ❌ Assigner la correspondance à un directeur');
      console.log('3. ❌ Le directeur doit créer une proposition');
    } else {
      const hasValidDrafts = correspondancesWithDrafts.some(corr => 
        corr.responseDrafts && corr.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW')
      );
      
      if (!hasValidDrafts) {
        console.log('1. ❌ Aucun draft avec status PENDING_DG_REVIEW trouvé');
        console.log('2. 💡 Vérifier que les directeurs créent bien leurs propositions');
        console.log('3. 💡 Vérifier que le status passe bien à PENDING_DG_REVIEW');
      } else {
        console.log('1. ✅ Des drafts PENDING_DG_REVIEW existent');
        console.log('2. 💡 Vérifier les logs frontend pour voir les conditions');
        console.log('3. 💡 Vérifier que l\'utilisateur connecté est bien DG');
      }
    }

    // 6. CRÉER UN CAS DE TEST SI NÉCESSAIRE
    if (correspondancesWithDrafts.length === 0) {
      console.log('\n🧪 === CRÉATION CAS DE TEST ===');
      
      const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });
      const directeur = directeurs[0];
      
      if (agent && directeur) {
        console.log('🧪 Création d\'une correspondance de test avec proposition...');
        
        const testCorr = new Correspondance({
          title: 'Test bouton DG - Correspondance avec proposition',
          subject: 'Test approbation DG',
          content: 'Correspondance de test pour vérifier le bouton d\'approbation DG.',
          type: 'INCOMING',
          priority: 'HIGH',
          status: 'PENDING',
          airport: 'ENFIDHA',
          from_address: 'test@external.com',
          to_address: 'test@enfidha.tn',
          personnesConcernees: [directeur._id.toString()],
          code: `TEST-DG-BTN-${Date.now()}`,
          authorId: agent._id,
          workflowStatus: 'DIRECTOR_DRAFT',
          date_correspondance: new Date(),
          responseDrafts: [{
            responseContent: 'Proposition de réponse de test pour vérifier le bouton DG.',
            directorId: directeur._id,
            directorName: `${directeur.firstName} ${directeur.lastName}`,
            status: 'PENDING_DG_REVIEW',
            createdAt: new Date(),
            isUrgent: true,
            comments: 'Test pour bouton DG'
          }]
        });

        await testCorr.save();
        console.log(`✅ Correspondance de test créée: ${testCorr._id}`);
        console.log('💡 Maintenant le bouton DG devrait apparaître !');
        
        // Créer aussi le workflow
        const { CorrespondanceWorkflowService } = require('./src/services/correspondanceWorkflowService');
        const workflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
          testCorr._id.toString(),
          agent._id
        );
        console.log(`✅ Workflow créé: ${workflow._id}`);
      } else {
        console.log('❌ Impossible de créer le test: agent ou directeur manquant');
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le diagnostic
debugDGButtonIssue();
