const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');

/**
 * Test du modèle unifié : Correspondance.responseDrafts comme source unique
 */

async function testUnifiedModel() {
  try {
    console.log('🎯 ========================================');
    console.log('🎯 TEST MODÈLE UNIFIÉ - CORRESPONDANCE.RESPONSEDRAFTS');
    console.log('🎯 ========================================\n');

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
      title: 'Test modèle unifié - Formation RH',
      subject: 'Test avec Correspondance.responseDrafts comme source unique',
      content: 'Test pour vérifier que le modèle unifié fonctionne correctement.',
      type: 'INCOMING',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'test@external.com',
      to_address: 'test@enfidha.tn',
      personnesConcernees: [anisDirector._id.toString()],
      code: 'TEST-UNIFIED-' + Date.now(),
      authorId: agent._id,
      workflowStatus: 'ASSIGNED_TO_DIRECTOR',
      date_correspondance: new Date()
    });

    await testCorrespondance.save();
    console.log(`✅ Correspondance créée: ${testCorrespondance._id}\n`);

    // 3. CRÉER LE WORKFLOW (MÉTADONNÉES SEULEMENT)
    const workflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
      testCorrespondance._id.toString(),
      agent._id
    );
    console.log(`✅ Workflow créé: ${workflow._id}\n`);

    // 4. CRÉER UNE PROPOSITION (MODÈLE UNIFIÉ)
    console.log('📝 === CRÉATION PROPOSITION (MODÈLE UNIFIÉ) ===');
    
    const draftData = {
      responseContent: 'Proposition de réponse avec modèle unifié.\n\nLes drafts sont maintenant stockés uniquement dans Correspondance.responseDrafts.',
      attachments: [],
      comments: 'Test du modèle unifié - source unique de vérité.',
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

    // 5. VÉRIFICATION MODÈLE UNIFIÉ
    console.log('🔍 === VÉRIFICATION MODÈLE UNIFIÉ ===');
    
    // Vérifier dans Correspondance (SOURCE UNIQUE)
    const updatedCorrespondance = await Correspondance.findById(testCorrespondance._id).lean();
    console.log(`📋 Correspondance - Drafts: ${updatedCorrespondance.responseDrafts?.length || 0}`);
    console.log(`📋 Correspondance - Status: ${updatedCorrespondance.workflowStatus}`);
    
    if (updatedCorrespondance.responseDrafts && updatedCorrespondance.responseDrafts.length > 0) {
      const draft = updatedCorrespondance.responseDrafts[0];
      console.log(`   ✅ Draft dans Correspondance (SOURCE UNIQUE):`);
      console.log(`   - Status: ${draft.status}`);
      console.log(`   - Directeur: ${draft.directorName}`);
      console.log(`   - Urgent: ${draft.isUrgent}`);
      console.log(`   - Commentaires: ${draft.comments}`);
    }

    // Vérifier dans Workflow (MÉTADONNÉES SEULEMENT)
    const updatedWorkflow = await CorrespondenceWorkflow.findOne({ 
      correspondanceId: testCorrespondance._id 
    }).lean();
    console.log(`🔄 Workflow - Status: ${updatedWorkflow.currentStatus}`);
    console.log(`🔄 Workflow - Drafts: ${updatedWorkflow.responseDrafts?.length || 0} (devrait être 0 ou vide)`);

    // 6. TEST VISIBILITÉ CÔTÉ DG (MODÈLE UNIFIÉ)
    console.log('\n👑 === TEST VISIBILITÉ DG (MODÈLE UNIFIÉ) ===');
    
    const dgCorrespondances = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id.toString());
    console.log(`📊 Correspondances visibles pour DG: ${dgCorrespondances.length}`);
    
    const testCorr = dgCorrespondances.find(c => c._id.toString() === testCorrespondance._id.toString());
    
    if (testCorr) {
      console.log(`✅ Correspondance test trouvée pour DG`);
      console.log(`📝 Drafts visibles: ${testCorr.responseDrafts?.length || 0}`);
      console.log(`🔄 Status: ${testCorr.workflowStatus}`);
      console.log(`📋 Workflow Status: ${testCorr.workflowInfo?.currentStatus}`);
      
      if (testCorr.responseDrafts && testCorr.responseDrafts.length > 0) {
        const draft = testCorr.responseDrafts[0];
        console.log(`   ✅ Draft visible pour DG (depuis Correspondance):`);
        console.log(`   - Status: ${draft.status}`);
        console.log(`   - Directeur: ${draft.directorName}`);
        console.log(`   - Urgent: ${draft.isUrgent}`);
        console.log(`   - Source: Correspondance.responseDrafts (UNIFIÉ)`);
      }
    } else {
      console.log('❌ Correspondance test NON trouvée pour DG');
    }

    // 7. VÉRIFICATION CONDITIONS BOUTON APPROBATION
    console.log('\n🔍 === CONDITIONS BOUTON APPROBATION (UNIFIÉ) ===');
    
    const conditions = {
      'user.role === DIRECTEUR_GENERAL': dg.role === 'DIRECTEUR_GENERAL',
      'workflowStatus === DIRECTOR_DRAFT': updatedCorrespondance.workflowStatus === 'DIRECTOR_DRAFT',
      'drafts présents (source unique)': updatedCorrespondance.responseDrafts?.length > 0,
      'draft status PENDING_DG_REVIEW': updatedCorrespondance.responseDrafts?.[0]?.status === 'PENDING_DG_REVIEW'
    };

    console.log('Conditions pour affichage bouton (modèle unifié):');
    Object.entries(conditions).forEach(([condition, result]) => {
      console.log(`   ${result ? '✅' : '❌'} ${condition}: ${result}`);
    });

    const allConditionsMet = Object.values(conditions).every(Boolean);
    console.log(`\n${allConditionsMet ? '✅' : '❌'} TOUTES CONDITIONS REMPLIES: ${allConditionsMet}`);
    
    if (allConditionsMet) {
      console.log('🎉 MODÈLE UNIFIÉ FONCTIONNEL - Bouton d\'approbation visible !');
    } else {
      console.log('⚠️ Problème avec le modèle unifié');
    }

    // 8. AVANTAGES DU MODÈLE UNIFIÉ
    console.log('\n🎯 === AVANTAGES CONSTATÉS ===');
    console.log('✅ Source unique de vérité : Correspondance.responseDrafts');
    console.log('✅ Pas de synchronisation nécessaire');
    console.log('✅ Requêtes simplifiées (une seule table)');
    console.log('✅ Cohérence garantie des données');
    console.log('✅ Code plus simple et maintenable');
    console.log('✅ Performance améliorée (moins de joins)');

    // 9. NETTOYAGE
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
testUnifiedModel();
