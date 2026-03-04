const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');

/**
 * Test de synchronisation des drafts après correction
 */

async function testDraftSync() {
  try {
    console.log('🧪 ========================================');
    console.log('🧪 TEST SYNCHRONISATION DRAFTS CORRIGÉE');
    console.log('🧪 ========================================\n');

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
      title: 'Test synchronisation drafts',
      subject: 'Test après correction synchronisation',
      content: 'Test pour vérifier que les drafts sont bien synchronisés entre Workflow et Correspondance.',
      type: 'INCOMING',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'test@external.com',
      to_address: 'test@enfidha.tn',
      personnesConcernees: [anisDirector._id.toString()],
      code: 'TEST-SYNC-' + Date.now(),
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

    // 4. CRÉER UNE PROPOSITION (AVEC LA CORRECTION)
    console.log('📝 === CRÉATION PROPOSITION AVEC CORRECTION ===');
    
    const draftData = {
      responseContent: 'Proposition de réponse après correction de synchronisation.\n\nLes drafts doivent maintenant être visibles à la fois dans CorrespondenceWorkflow ET dans Correspondance.responseDrafts.',
      attachments: [],
      comments: 'Test de synchronisation après correction du bug.',
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

    // 5. VÉRIFICATION SYNCHRONISATION
    console.log('🔍 === VÉRIFICATION SYNCHRONISATION ===');
    
    // Vérifier dans Correspondance
    const updatedCorrespondance = await Correspondance.findById(testCorrespondance._id).lean();
    console.log(`📋 Correspondance - Drafts: ${updatedCorrespondance.responseDrafts?.length || 0}`);
    console.log(`📋 Correspondance - Status: ${updatedCorrespondance.workflowStatus}`);
    
    if (updatedCorrespondance.responseDrafts && updatedCorrespondance.responseDrafts.length > 0) {
      const draft = updatedCorrespondance.responseDrafts[0];
      console.log(`   ✅ Draft trouvé dans Correspondance:`);
      console.log(`   - Status: ${draft.status}`);
      console.log(`   - Directeur: ${draft.directorName}`);
      console.log(`   - Contenu: ${draft.responseContent.substring(0, 50)}...`);
    }

    // Vérifier dans Workflow
    const updatedWorkflow = await CorrespondenceWorkflow.findOne({ 
      correspondanceId: testCorrespondance._id 
    }).lean();
    console.log(`🔄 Workflow - Drafts: ${updatedWorkflow.responseDrafts?.length || 0}`);
    console.log(`🔄 Workflow - Status: ${updatedWorkflow.currentStatus}`);
    
    if (updatedWorkflow.responseDrafts && updatedWorkflow.responseDrafts.length > 0) {
      const draft = updatedWorkflow.responseDrafts[0];
      console.log(`   ✅ Draft trouvé dans Workflow:`);
      console.log(`   - Status: ${draft.status}`);
      console.log(`   - Directeur: ${draft.directorName}`);
      console.log(`   - Contenu: ${draft.responseContent.substring(0, 50)}...`);
    }

    // 6. TEST VISIBILITÉ CÔTÉ DG
    console.log('\n👑 === TEST VISIBILITÉ CÔTÉ DG ===');
    
    try {
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
          console.log(`   ✅ Draft visible pour DG:`);
          console.log(`   - Status: ${draft.status}`);
          console.log(`   - Directeur: ${draft.directorName}`);
          console.log(`   - Urgent: ${draft.isUrgent}`);
        }
      } else {
        console.log('❌ Correspondance test NON trouvée pour DG');
      }
    } catch (dgError) {
      console.error('❌ Erreur récupération DG:', dgError.message);
    }

    // 7. VÉRIFICATION CONDITIONS BOUTON APPROBATION
    console.log('\n🔍 === CONDITIONS BOUTON APPROBATION ===');
    
    const conditions = {
      'user.role === DIRECTEUR_GENERAL': dg.role === 'DIRECTEUR_GENERAL',
      'workflowStatus === DIRECTOR_DRAFT': updatedCorrespondance.workflowStatus === 'DIRECTOR_DRAFT',
      'drafts présents dans correspondance': updatedCorrespondance.responseDrafts?.length > 0,
      'drafts présents dans workflow': updatedWorkflow.responseDrafts?.length > 0
    };

    console.log('Conditions pour affichage bouton:');
    Object.entries(conditions).forEach(([condition, result]) => {
      console.log(`   ${result ? '✅' : '❌'} ${condition}: ${result}`);
    });

    const allConditionsMet = Object.values(conditions).every(Boolean);
    console.log(`\n${allConditionsMet ? '✅' : '❌'} TOUTES CONDITIONS REMPLIES: ${allConditionsMet}`);
    
    if (allConditionsMet) {
      console.log('🎉 Le bouton d\'approbation devrait maintenant être visible !');
    } else {
      console.log('⚠️ Certaines conditions ne sont pas remplies');
    }

    // 8. NETTOYAGE
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
testDraftSync();
