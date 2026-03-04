const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');

/**
 * Test complet du workflow : Création → Proposition → Visibilité DG
 */

async function testCompleteWorkflow() {
  try {
    console.log('🧪 ========================================');
    console.log('🧪 TEST COMPLET WORKFLOW CORRESPONDANCE');
    console.log('🧪 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. RÉCUPÉRER LES UTILISATEURS
    console.log('👥 === ÉTAPE 1: RÉCUPÉRATION UTILISATEURS ===');
    
    const anisDirector = await User.findOne({ 
      firstName: 'Anis',
      lastName: 'Ben Janet'
    });
    
    const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
    const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });

    if (!anisDirector) {
      console.log('❌ Directeur Anis Ben Janet non trouvé');
      return;
    }
    if (!dg) {
      console.log('❌ Directeur Général non trouvé');
      return;
    }
    if (!agent) {
      console.log('❌ Agent bureau d\'ordre non trouvé');
      return;
    }

    console.log(`👤 Directeur: ${anisDirector.firstName} ${anisDirector.lastName} (${anisDirector.role})`);
    console.log(`👑 DG: ${dg.firstName} ${dg.lastName} (${dg.role})`);
    console.log(`📋 Agent: ${agent.firstName} ${agent.lastName} (${agent.role})\n`);

    // 2. CRÉER UNE CORRESPONDANCE DE TEST
    console.log('📝 === ÉTAPE 2: CRÉATION CORRESPONDANCE ===');
    
    const testCorrespondance = new Correspondance({
      title: 'Test workflow complet - Demande formation RH',
      subject: 'Formation ressources humaines urgente',
      content: 'Nous avons besoin d\'organiser une formation RH pour le personnel. Merci de proposer une réponse.',
      type: 'INCOMING',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'formation@external.com',
      to_address: 'rh@enfidha.tn',
      personnesConcernees: [anisDirector._id.toString()], // Assigné à Anis
      code: 'TEST-WORKFLOW-' + Date.now(),
      authorId: agent._id,
      workflowStatus: 'ASSIGNED_TO_DIRECTOR', // Status initial
      date_correspondance: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await testCorrespondance.save();
    console.log(`✅ Correspondance créée: ${testCorrespondance._id}`);
    console.log(`📋 Titre: ${testCorrespondance.title}`);
    console.log(`👤 Assignée à: ${anisDirector.firstName} ${anisDirector.lastName}`);
    console.log(`🔄 Status workflow: ${testCorrespondance.workflowStatus}\n`);

    // 3. CRÉER UN WORKFLOW POUR LA CORRESPONDANCE
    console.log('🔄 === ÉTAPE 3: CRÉATION WORKFLOW ===');
    
    try {
      const workflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
        testCorrespondance._id.toString(),
        agent._id
      );
      
      if (workflow) {
        console.log(`✅ Workflow créé: ${workflow._id}`);
        console.log(`🔄 Status: ${workflow.currentStatus}`);
        console.log(`👤 Directeur assigné: ${workflow.assignedDirector}`);
        console.log(`👑 DG: ${workflow.directeurGeneral}\n`);
      } else {
        console.log('❌ Échec création workflow\n');
      }
    } catch (workflowError) {
      console.error('❌ Erreur création workflow:', workflowError.message);
    }

    // 4. CRÉER UNE PROPOSITION DE RÉPONSE (SIMULATION DIRECTEUR)
    console.log('📝 === ÉTAPE 4: CRÉATION PROPOSITION RÉPONSE ===');
    
    const draftData = {
      responseContent: 'Proposition de réponse pour la formation RH:\n\nNous proposons d\'organiser une session de formation de 2 jours sur les ressources humaines. Les dates proposées sont les 15 et 16 novembre 2024.\n\nMerci de valider cette proposition.',
      attachments: [],
      comments: 'Formation urgente demandée par le service externe. Proposition détaillée ci-dessus.',
      isUrgent: true
    };

    try {
      console.log(`📝 Création proposition par: ${anisDirector.firstName} ${anisDirector.lastName}`);
      
      const draftResult = await CorrespondanceWorkflowService.createResponseDraft(
        testCorrespondance._id.toString(),
        anisDirector._id.toString(),
        draftData
      );

      if (draftResult.success) {
        console.log(`✅ Proposition créée avec succès`);
        console.log(`📋 Draft ID: ${draftResult.data.draftId}`);
        console.log(`🔄 Nouveau status workflow: ${draftResult.data.workflowStatus}\n`);
      } else {
        console.log('❌ Échec création proposition');
      }
    } catch (draftError) {
      console.error('❌ Erreur création proposition:', draftError.message);
    }

    // 5. VÉRIFIER L'ÉTAT APRÈS CRÉATION PROPOSITION
    console.log('🔍 === ÉTAPE 5: VÉRIFICATION ÉTAT APRÈS PROPOSITION ===');
    
    // Récupérer la correspondance mise à jour
    const updatedCorrespondance = await Correspondance.findById(testCorrespondance._id).lean();
    console.log(`🔄 Status correspondance: ${updatedCorrespondance.workflowStatus}`);
    console.log(`📝 Nombre de drafts: ${updatedCorrespondance.responseDrafts?.length || 0}`);
    
    if (updatedCorrespondance.responseDrafts && updatedCorrespondance.responseDrafts.length > 0) {
      const draft = updatedCorrespondance.responseDrafts[0];
      console.log(`📋 Status du draft: ${draft.status}`);
      console.log(`👤 Créé par: ${draft.directorName}`);
      console.log(`📅 Créé le: ${draft.createdAt}`);
      console.log(`💬 Commentaires: ${draft.comments || 'Aucun'}`);
    }

    // Vérifier le workflow séparé
    const workflowData = await CorrespondenceWorkflow.findOne({ 
      correspondanceId: testCorrespondance._id 
    }).lean();
    
    if (workflowData) {
      console.log(`🔄 Status workflow séparé: ${workflowData.currentStatus}`);
      console.log(`📝 Drafts dans workflow: ${workflowData.responseDrafts?.length || 0}`);
    } else {
      console.log('⚠️ Aucun workflow séparé trouvé');
    }

    // 6. SIMULER LA RÉCUPÉRATION CÔTÉ DG
    console.log('\n👑 === ÉTAPE 6: SIMULATION RÉCUPÉRATION CÔTÉ DG ===');
    
    // Test 1: Récupération via DirectorGeneralWorkflowService
    try {
      const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
      const dgCorrespondances = await DirectorGeneralWorkflowService.getCorrespondancesForDG(dg._id.toString());
      
      console.log(`📊 Correspondances visibles pour DG: ${dgCorrespondances.length}`);
      
      if (dgCorrespondances.length > 0) {
        const testCorr = dgCorrespondances.find(c => c._id.toString() === testCorrespondance._id.toString());
        if (testCorr) {
          console.log(`✅ Correspondance test trouvée pour DG`);
          console.log(`📝 Drafts visibles: ${testCorr.responseDrafts?.length || 0}`);
          console.log(`🔄 Status: ${testCorr.workflowStatus}`);
          
          if (testCorr.responseDrafts && testCorr.responseDrafts.length > 0) {
            const draft = testCorr.responseDrafts[0];
            console.log(`📋 Status draft: ${draft.status}`);
            console.log(`👤 Directeur: ${draft.directorName}`);
          }
        } else {
          console.log('❌ Correspondance test NON trouvée pour DG');
        }
      }
    } catch (dgError) {
      console.error('❌ Erreur récupération DG:', dgError.message);
    }

    // Test 2: Vérification des conditions d'affichage du bouton
    console.log('\n🔍 === ÉTAPE 7: CONDITIONS BOUTON APPROBATION ===');
    
    console.log('Conditions pour affichage bouton DG:');
    console.log(`1. user.role === 'DIRECTEUR_GENERAL': ${dg.role === 'DIRECTEUR_GENERAL'}`);
    console.log(`2. workflowStatus inclut DIRECTOR_DRAFT: ${['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(updatedCorrespondance.workflowStatus)}`);
    console.log(`3. Status actuel: ${updatedCorrespondance.workflowStatus}`);
    console.log(`4. Drafts présents: ${updatedCorrespondance.responseDrafts?.length > 0}`);
    
    if (updatedCorrespondance.responseDrafts && updatedCorrespondance.responseDrafts.length > 0) {
      const draft = updatedCorrespondance.responseDrafts[0];
      console.log(`5. Status draft: ${draft.status}`);
      console.log(`6. Draft PENDING_DG_REVIEW: ${draft.status === 'PENDING_DG_REVIEW'}`);
    }

    // 7. DIAGNOSTIC DES PROBLÈMES
    console.log('\n🔧 === ÉTAPE 8: DIAGNOSTIC PROBLÈMES ===');
    
    const problems = [];
    
    if (updatedCorrespondance.workflowStatus !== 'DIRECTOR_DRAFT') {
      problems.push(`Status workflow incorrect: ${updatedCorrespondance.workflowStatus} au lieu de DIRECTOR_DRAFT`);
    }
    
    if (!updatedCorrespondance.responseDrafts || updatedCorrespondance.responseDrafts.length === 0) {
      problems.push('Aucun draft trouvé dans la correspondance');
    } else {
      const draft = updatedCorrespondance.responseDrafts[0];
      if (draft.status !== 'PENDING_DG_REVIEW') {
        problems.push(`Status draft incorrect: ${draft.status} au lieu de PENDING_DG_REVIEW`);
      }
    }
    
    if (problems.length > 0) {
      console.log('🔴 PROBLÈMES IDENTIFIÉS:');
      problems.forEach((problem, index) => {
        console.log(`   ${index + 1}. ${problem}`);
      });
    } else {
      console.log('✅ Aucun problème détecté - Configuration correcte');
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
testCompleteWorkflow();
